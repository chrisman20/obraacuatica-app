/* ============================================================
   medir.js — Instrumentación (PostHog + Sentry + Turnstile)
   REGLA 13: sin credencial = INACTIVO POR DISEÑO, no roto.
   Las credenciales viven en CONFIG.analytics (data.js). Vacías
   = cero red, cero eventos, cero scripts cargados. Al dueño
   cargarlas (bandeja CUENTAS-CREDENCIALES-DUENO.md) el circuito
   se enciende sin refactor: jamás cambia el código del front.
   REGLA 24 (17/11) — vocabulario de la casa, idéntico en todas:
   paso_N (marca el paso vigente) · aha (primer export) · registro
   (cuenta creada) · pago_start/pago_ok/pago_fail (checkout y su
   resultado; el ok nace en el webhook firmado) · salida_paso_N
   (se fue del flujo con un paso vigiente) · vuelta_paso_N
   (reintento) · error_js (capturador global con stack saneado).
   Sin credencial los eventos quedan en la cola local
   (window.__medidos) y NADA sale del navegador (lo prueba el
   gate tests/smoke-funnel.js corriendo este archivo en una VM).
   Sin email/nombre/teléfono en eventos: id anónimo del
   navegador solamente + app + versión.
   ============================================================ */

const Medir = (() => {
  const KEY_ANON = "obracuatica_anon";
  const cfg = () => (typeof CONFIG !== "undefined" && CONFIG.analytics) || {};
  try { window.__medidos = window.__medidos || []; } catch (e) { /* sin window */ }

  /* ---------- REGLA 24: paso vigente + salida + etiquetas ---------- */
  const PASOS = { 1: "Configurá", 2: "Resultados", 3: "Presupuesto" };
  const esPaso = /^paso_(\d+)$/;
  let pasoVigente = null;
  const salidaYa = {};
  function pasoActual() {
    if (!pasoVigente) return null;
    const n = parseInt(pasoVigente.slice(5), 10);
    return { n: n, id: pasoVigente, texto: PASOS[n] || ("paso " + n) };
  }

  function anon() {
    try {
      let id = localStorage.getItem(KEY_ANON);
      if (!id) {
        id = "a-" + crypto.getRandomValues(new Uint32Array(2)).join("-");
        localStorage.setItem(KEY_ANON, id);
      }
      return id;
    } catch (e) { return "a-sin-ls"; }
  }

  /* ---------- PostHog (capture API, sin SDK) ---------- */
  function enviar(evento, props) {
    try { window.__medidos.push(evento); } catch (e) { /* cola local best-effort */ }
    if (esPaso.test(evento)) pasoVigente = evento;    // regla 24: el paso dado marca el vigente
    const k = cfg().posthog;
    if (!k || !k.length) return;                 // sin credencial: no sale nada del navegador
    try {
      const body = JSON.stringify({
        api_key: k,
        event: evento,                           // vocabulario idéntico en toda la casa (regla 24)
        distinct_id: anon(),
        properties: Object.assign({
          app: "obracuatica",
          v: (typeof window !== "undefined" && window.APP_VERSION) || ""
        }, props || {})
      });
      fetch("https://us.i.posthog.com/i/v0/e/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        keepalive: true
      }).catch(() => {});
    } catch (e) { /* nunca rompe la app */ }
  }

  /* ---------- REGLA 24 — salida_paso_N: la tranca silenciosa ----------
     Se fue de la app (o a background) con un paso vigente => abandono en
     ese paso. Una sola salida por paso (volver a entrar y avanzar resetea). */
  function medirSalida() {
    if (!pasoVigente || salidaYa[pasoVigente]) return;
    salidaYa[pasoVigente] = true;
    enviar("salida_" + pasoVigente);
  }
  window.addEventListener("beforeunload", medirSalida);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") medirSalida();
  });

  /* ---------- REGLA 24 — error_js: capturador global ----------
     window.onerror + unhandledrejection al vocabulario de la casa (con
     stack saneado: mensaje corto + archivo:línea, SIN datos personales). */
  function errorJs(detalle) {
    const d = String(detalle || "").replace(/\s+/g, " ").slice(0, 200);
    enviar("error_js", { d: d });
  }
  window.addEventListener("error", e => {
    errorJs(((e && e.message) || "error") + " @ " + String((e && e.filename) || "").split("/").pop() + ":" + ((e && e.lineno) || 0));
  });
  window.addEventListener("unhandledrejection", e => {
    const r = e && e.reason;
    errorJs((r && r.message) ? r.message : ((r && String(r)) || "promesa rechazada"));
  });

  /* ---------- REGLA 24 §7 — texto del BOTÓN DE AUXILIO ----------
     El mensaje de WhatsApp llega con contexto automático: app, versión
     (fuente única window.APP_VERSION) y el paso vigente con su etiqueta.
     Lo completa el usuario ("algo no anda: "). */
  function textoAuxilio() {
    const v = (typeof window !== "undefined" && window.APP_VERSION) ? String(window.APP_VERSION) : "";
    const p = pasoActual();
    return "obracuatica v" + v + (p ? " · " + p.id + " (" + p.texto + ")" : "") + " · algo no anda: ";
  }

  /* ---------- Sentry (DSN cargado = activo) ---------- */
  let sentryOn = false;
  function sentry() {
    const dsn = cfg().sentry;
    if (!dsn || sentryOn) return;
    const s = document.createElement("script");
    s.src = "https://browser.sentry-cdn.com/7.119.0/bundle.tracing.min.js";
    s.crossOrigin = "anonymous";
    s.addEventListener("load", () => {
      try {
        window.Sentry.init({ dsn, release: "obracuatica@" + (window.APP_VERSION || "4.4") });
        sentryOn = true;
      } catch (e) { /* no activo */ }
    });
    document.head.appendChild(s);
  }

  /* ---------- Turnstile (site key cargada = activo) ---------- */
  function turnstile() {
    const site = cfg().turnstileSite;
    if (!site || sentryTurnstileCargado) return;
    sentryTurnstileCargado = true;
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    document.head.appendChild(s);
  }

  let sentryTurnstileCargado = false;
  function turnstileToken(fn) {
    const site = cfg().turnstileSite;
    if (!site) { fn(null); return; }
    try {
      turnstile.render("#tsBox", { sitekey: site, callback: t => fn(t) });
    } catch (e) { fn(null); }
  }

  /* ---------- PostHog session replay (P1: wiring inactivo por diseño) ----------
     Encendido = DOS señales del dueño en CONFIG.analytics (bandeja):
     posthog: "<key>"  +  posthogReplay: true. Sin ambas = cero red.
     Al encender: sumar https://us.i.posthog.com al script-src del CSP
     (una línea en index.html + _headers — documentado en PENDIENTES-DEL-DUENO). */
  let replayOn = false;
  function replay() {
    const k = cfg().posthog;
    const on = cfg().posthogReplay;
    if (!k || on !== true || replayOn) return;
    replayOn = true;
    // stub oficial del loader (sin eval): define window.posthog y carga array.js
    if (!window.posthog) {
      window.posthog = function () { (window.posthog._i = window.posthog._i || []).push(arguments); };
      const s = document.createElement("script");
      s.src = "https://us.i.posthog.com/static/array.js";
      s.async = true;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    window.posthog("init", k, {
      api_host: "https://us.i.posthog.com",
      autocapture: false,          // sin PII: los eventos van por enviar()
      session_replay: { maskAllInputs: true },
      capture_pageview: false,
      persistence: "memory"        // nada en storage del usuario
    });
    window.posthog("session_replay", { name: "replay" });
  }

  return { enviar, sentry, turnstile, turnstileToken, replay, anon, pasoActual, textoAuxilio };
})();

/* auto-arranque (fix de esta ola): sentry/turnstile/replay se encendían
   "con credencial sin refactor" pero NADIE los llamaba — sin este disparo,
   cargar la key en CONFIG no prendía nada. Sin credenciales = cero red. */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof Medir === "undefined") return;
  try {
    Medir.sentry();
    Medir.turnstile();
    Medir.replay();
  } catch (e) { /* nunca rompe la app */ }
});
