/* ============================================================
   medir.js — Instrumentación (PostHog + Sentry + Turnstile)
   REGLA 13: sin credencial = INACTIVO POR DISEÑO, no roto.
   Las credenciales viven en CONFIG.analytics (data.js). Vacías
   = cero red, cero eventos, cero scripts cargados. Al dueño
   cargarlas (bandeja CUENTAS-CREDENCIALES-DUENO.md) el circuito
   se enciende sin refactor: jamás cambia el código del front.
   Eventos: registro (cuenta creada) · aha (primer export)
   · pago (plan activado). Sin email/nombre/teléfono en eventos:
   id anónimo del navegador solamente.
   ============================================================ */

const Medir = (() => {
  const KEY_ANON = "obracuatica_anon";
  const cfg = () => (typeof CONFIG !== "undefined" && CONFIG.analytics) || {};

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
    const k = cfg().posthog;
    if (!k || !k.length) return;                 // sin credencial: no sale nada del navegador
    try {
      const body = JSON.stringify({
        api_key: k,
        event: "oa_" + evento,
        distinct_id: anon(),
        properties: props || {}
      });
      fetch("https://us.i.posthog.com/i/v0/e/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        keepalive: true
      }).catch(() => {});
    } catch (e) { /* nunca rompe la app */ }
  }

  /* ---------- Sentry (DSN cargado = activo) ---------- */
  let sentryOn = false;
  function sentry() {
    const dsn = cfg().sentry;
    if (!dsn || sentryOn) return;
    const s = document.createElement("script");
    s.src = "https://browser.sentry-cdn.com/7.119.0/bundle.tracing.min.js";
    s.crossOrigin = "anonymous";
    s.onload = () => {
      try {
        window.Sentry.init({ dsn, release: "obracuatica@" + (window.APP_VERSION || "4.1") });
        sentryOn = true;
      } catch (e) { /* no activo */ }
    };
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

  return { enviar, sentry, turnstile, turnstileToken, anon };
})();
