/* ============================================================
   cobro.js — Circuito de cobro completo (regla 21)
   GRATIS es un plan de la tabla, no la ausencia del sistema de cobro.
   Diseño para app estática:
   · tabla PLANS (fuente única de planes/precios)
   · suscripción con expiración + migración de usuario viejo (regla 18)
   · flag CONFIG.pagos_activos: sin link de MP verificado el checkout
     corre en modo SIMULADO (avisado, no se cobra nada).
     El upgrade se enciende con credencial + flag: jamás un refactor.
   · backend mínimo opcional en functions/ (Cloudflare Pages):
     webhook firmado server-side que activa el plan SOLO allí.
   ============================================================ */

const Cobro = (() => {
  const KEY_SUS = "obracuatica_suscripcion";
  const KEY_LEGACY = "piletalab_pro";            // usuario viejo (regla 18)
  const GRACIA_DIAS = 3;                         // vencida hace <= 3 días = gracia

  /* ---------- tabla PLANS: fuente única ---------- */
  const PLANS = [
    { id: "gratis", nombre: "Gratis", precio: "$0", detalle: "/siempre",
      features: [
        "10 sistemas + hidráulica + química + planos en pantalla",
        "Todo lo que ves — sin registro",
        "3 exports por mes (para probar)",
        "Con marca ObraAcuática en informes"
      ] },
    { id: "pro", nombre: "Pro", precio: () => CONFIG.precioPro, detalle: "/mes", duracionDias: 30,
      features: [
        "Exports ilimitados (Excel · Word · MD · CSV · Odoo · PDF)",
        "Sin marca de agua en planos e informes",
        "Seguimiento de obra + cronograma con fechas",
        "Informe de cliente HTML profesional",
        "Proyectos guardados ilimitados",
        "Comparador A/B",
        "Soporte prioritario WhatsApp"
      ] },
    { id: "white", nombre: "Constructoras white-label", precio: () => CONFIG.precioWhiteLabel, detalle: "/año", duracionDias: 365,
      white: true,
      features: [
        "La app completa con tu logo y colores",
        "Para todo tu equipo de ventas",
        "Tu catálogo de formatos y precios",
        "Capacitación de 2 h",
        "Sin marca de agua"
      ] }
  ];

  const planDe = id => PLANS.find(p => p.id === id) || PLANS[0];
  const precioDe = p => typeof p.precio === "function" ? p.precio() : p.precio;

  /* ---------- suscripción (localStorage con expiración) ---------- */
  function leer() {
    try { return JSON.parse(localStorage.getItem(KEY_SUS) || "null"); } catch (e) { return null; }
  }
  function escribir(s) { localStorage.setItem(KEY_SUS, JSON.stringify(s)); }
  function migrar() {
    // usuario viejo: piletalab_pro = true → suscripción legacy sin vencimiento
    try {
      if (leer()) return;
      if (localStorage.getItem(KEY_LEGACY) === "true") {
        escribir({ plan: "pro", desde: null, expira: null, fuente: "legacy" });
        return;
      }
      escribir({ plan: "gratis", desde: null, expira: null, fuente: "n/a" });
    } catch (e) { /* localStorage off */ }
  }
  /* ---------- estado ---------- */
  function estado() {
    migrar();
    const s = leer();
    if (!s || s.plan === "gratis") return { plan: "gratis", activo: false, expira: null, fuente: s ? s.fuente : "n/a", dias: null };
    const expira = s.expira ? new Date(s.expira) : null;      // null = sin vencimiento (legacy)
    const dias = expira ? Math.ceil((expira - Date.now()) / 86400000) : null;
    const vencida = expira ? expira.getTime() < Date.now() : false;
    const gracia = vencida && dias >= -GRACIA_DIAS;
    if (vencida && !gracia) return { plan: "gratis", activo: false, expira: null, fuente: "vencida", dias: 0 };
    return { plan: s.plan, activo: true, expira: s.expira, fuente: s.fuente, dias, gracia, vencida };
  }

  /* ---------- API ---------- */
  function activo(planId) { return estado().activo && estado().plan === planId; }
  function esPro() { return estado().activo && (estado().plan === "pro" || estado().plan === "white"); }

  /* ---------- activar / desactivar ---------- */
  function activar(planId, fuente, expiraServer) {
    const p = planDe(planId);
    let expira = null;
    if (expiraServer) {
      expira = String(expiraServer);              // la fija el server (canje)
    } else if (p.duracionDias) {
      const ms = Date.now() + p.duracionDias * 86400000;
      expira = new Date(ms).toISOString();
    }
    escribir({ plan: planId, desde: Date.now(), expira, fuente: fuente || "manual" });
    // REGLA 24: pago_ok cuando el plan queda activo (la verdad del dinero nace
    // en el webhook firmado — functions/api/cobro/webhook.js dispara el suyo
    // server-side; este es el eco del canje/simulación que ve el navegador).
    if (typeof Medir !== "undefined") Medir.enviar("pago_ok", { plan: planId, fuente: fuente || "manual" });
    return leer();
  }
  function desactivar() {
    escribir({ plan: "gratis", desde: Date.now(), expira: null, fuente: "baja" });
  }
  /* ---------- flag de pagos: activo vs SIMULADO ---------- */
  function pagosActivos() {
    return !!(CONFIG.pagos_activos && CONFIG.mpLink && /^https:\/\/(mpago\.la|link\.mercadopago\.com\.ar)/.test(CONFIG.mpLink));
  }
  function reclamarPago(planId) {
    // P0 TOTE r1: "Ya pagué" JAMÁS activa el plan client-side (regla 21:
    // activación solo por webhook firmado / canje verificado server-side).
    // Guarda un reclamo visible y el plan sigue en su estado real.
    if (typeof Medir !== "undefined") Medir.enviar("pago_fail", { motivo: "ya-pague", plan: planId }); // regla 24: fricción de pago real
    try {
      localStorage.setItem("obracuatica_reclamo_pago", JSON.stringify({ plan: planId, fecha: Date.now() }));
    } catch (e) { /* sin localStorage */ }
    Dialogos.info({
      titulo: "📌 Reclamo anotado",
      primario: true,
      html: '<p class="dlg-text">Tu reclamo quedó registrado. <b>No activamos nada sin pago verificado</b>: el plan se activa solo cuando el pago acredita (webhook firmado) o canjeando el código que te enviamos.</p>' +
            '<p class="hint" style="margin:.5rem 0 0;font-size:.75rem">¿Tenés un código de activación? Canjealo en la pestaña Planes, sección "Tu plan".</p>'
    });
    if (typeof UI !== "undefined" && UI.renderPlanes) UI.renderPlanes();
  }
  function simularPago(planId) {
    activar(planId, "simulado");
    Dialogos.toast("Plan activado en MODO SIMULADO — no se cobró nada", "ok");
    if (typeof UI !== "undefined" && UI.renderPlanes) UI.renderPlanes();
  }

  /* ---------- canje de codigo: la UNICA via de activacion real (regla 21) ----------
     El codigo lo emite el webhook firmado (functions/api/cobro/webhook.js) y se
     valida SIEMPRE server-side en /api/cobro/canjear (HMAC con secret del env,
     la clave jamas toca el front). El front solo presenta el codigo. */
  function canjear(codigo) {
    const cod = String(codigo || "").trim().slice(0, 120);
    if (!cod) return Promise.resolve({ ok: false, error: "Codigo vacio" });
    return fetch("/api/cobro/canjear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo: cod })
    }).then(r => r.json()).then(j => {
      if (!j || !j.ok) {
        if (typeof Medir !== "undefined") Medir.enviar("pago_fail", { motivo: "canje-invalido", plan: "n/a" }); // regla 24
        Dialogos.toast(j && j.error ? "X " + j.error : "Codigo invalido", "error");
        return { ok: false, error: (j && j.error) || "invalido" };
      }
      activar(j.plan, "mp-verificado", j.expira);   // la expiracion la fija el server
      Dialogos.toast("Plan " + j.plan.toUpperCase() + " activado - pago verificado", "ok");
      if (typeof UI !== "undefined" && UI.renderPlanes) UI.renderPlanes();
      return { ok: true };
    }).catch(() => {
      if (typeof Medir !== "undefined") Medir.enviar("pago_fail", { motivo: "sin-backend", plan: "n/a" }); // regla 24
      Dialogos.toast("Sin backend de cobro en este entorno - el canje corre en el deploy", "error");
      return { ok: false };
    });
  }

  /* ---------- marca de agua: lo vendido se entrega (P0 TOTE r1) ---------- */
  function marcaRequerida() { return !esPro(); }
  function marcaTexto() { return branding().texto || CONFIG.marca; }

  /* ---------- white-label real (P0 TOTE r1) ---------- */
  const KEY_BRANDING = "obracuatica_branding";
  function branding() {
    try { return JSON.parse(localStorage.getItem(KEY_BRANDING) || "null") || {}; }
    catch (e) { return {}; }
  }
  function guardarBranding(b) {
    if (!activo("white")) {
      Dialogos.toast("El re-branding es del plan Constructoras (white-label)", "error");
      return;
    }
    localStorage.setItem(KEY_BRANDING, JSON.stringify(b || {}));
    aplicarBranding();
  }
  function aplicarBranding() {
    if (!activo("white")) return;
    const b = branding();
    if (b.color) {
      const rs = document.documentElement.style;
      rs.setProperty("--aqua", b.color);
      rs.setProperty("--aqua-bright", b.color);
      rs.setProperty("--aqua-line", b.color + "66");
    }
    const logo = document.querySelector(".topbar .logo");
    if (logo && b.texto) logo.textContent = b.texto.slice(0, 3);
    const h1 = document.querySelector(".brand-txt h1");
    if (h1 && b.texto) h1.textContent = b.texto;
  }
  function editorBranding() {
    if (!activo("white")) {
      Dialogos.toast("El re-branding es del plan Constructoras (white-label)", "error");
      return;
    }
    Dialogos.pedir({
      titulo: "Editor de marca (white-label)",
      btnOk: "Aplicar mi marca",
      campos: [
        { label: "Nombre de tu empresa (marca en planos e informes)", ph: "Constructora del Norte", valor: branding().texto || "" },
        { label: "Color de acento (hex, ej #E67E22)", ph: "#E67E22", valor: branding().color || "" }
      ]
    }).then(resp => {
      if (!resp) return;
      const color = resp[1] && /^#[0-9a-fA-F]{3,8}$/.test(resp[1]) ? resp[1] : null;
      guardarBranding({ texto: resp[0], color });
      Dialogos.toast("Marca aplicada: " + resp[0], "ok");
    });
  }

  /* ---------- checkout honesto (SIMULADO o MP real) ---------- */
  function checkout(planId) {
    const p = planDe(planId);
    const activos = pagosActivos();
    // REGLA 24: el checkout arrancado se mide SIEMPRE (modo real o simulado)
    if (typeof Medir !== "undefined") Medir.enviar("pago_start", { plan: planId, modo: activos ? "mp" : "simulado" });
    const precio = precioDe(p);
    const incl = p.features.slice(0, 3).join(" · ");
    if (activos) {
      Dialogos.info({
        titulo: "💳 Plan " + p.nombre + " — " + precio,
        primario: true,
        html: '<p class="dlg-text">Te llevamos a Mercado Pago (otra pestaña). Al acreditar, activamos tu plan y te avisamos.</p>' +
              '<p class="hint" style="margin:.5rem 0 0;font-size:.75rem">Incluye: ' + incl + '…</p>',
        extra: [
          { texto: "💳 Ir a Mercado Pago", clase: "btn primary", fn: () => { window.open(CONFIG.mpLink, "_blank", "noopener"); } },
          { texto: "Ya pagué", clase: "btn", fn: () => reclamarPago(planId) }
        ]
      });
    } else {
      Dialogos.info({
        titulo: "🧪 Plan " + p.nombre + " (SIMULADO)",
        primario: true,
        html: '<p class="dlg-text"><b>MODO SIMULADO</b> — no se cobra nada. Con el link de Mercado Pago en <code>CONFIG.mpLink</code> y <code>pagos_activos: true</code> este flujo cobra de verdad vía PSP (regla 21).</p>' +
              '<p class="hint" style="margin:.5rem 0 0;font-size:.75rem">Incluye: ' + incl + '…</p>',
        extra: [{ texto: "▶ Simular pago acreditado", clase: "btn primary", fn: () => simularPago(planId) }]
      });
    }
  }

  /* ---------- gestión del plan (UI en tab Planes) ---------- */
  function renderGestion() {
    const box = document.getElementById("cobroGestion");
    if (!box) return;
    const e = estado();
    const p = planDe(e.plan);
    const vence = e.expira ? new Date(e.expira).toLocaleDateString("es-AR") : "sin vencimiento";
    const sim = e.fuente === "simulado" ? " · <span class=\"tag aqua\">SIMULADO</span>" : "";
    box.innerHTML =
      '<div class="plan-card" style="max-width:520px">' +
      '  <div class="plan-name">Tu plan: ' + p.nombre + sim + '</div>' +
      '  <div class="plan-price">' + precioDe(p) + '<span>' + (p.detalle && !String(precioDe(p)).includes("/") ? p.detalle : "") + '</span></div>' +
      '  <p class="hint">Vence: ' + vence + ' · Fuente: ' + e.fuente + '</p>' +
      '  <div style="display:flex;gap:.5rem;flex-wrap:wrap">' +
      '    <button class="btn primary" id="btnCambiarPlan" type="button">Cambiar de plan</button>' +
      '    <button class="btn" id="btnBajaPlan" type="button">Bajar a Gratis</button>' +
      (e.fuente === "mp-verificado" || e.fuente === "simulado" ? '' : '') +
      '  </div>' +
      '  <div style="display:flex;gap:.5rem;margin-top:.7rem;flex-wrap:wrap;align-items:center">' +
      '    <input id="canjeCodigo" class="dlg-inp" style="flex:1;min-width:170px" placeholder="Código de activación (pago verificado)" maxlength="120">' +
      '    <button class="btn" id="btnCanjear" type="button">Canjear</button>' +
      (e.plan === "white" && e.activo ? '    <button class="btn" id="btnMarca" type="button">🎨 Mi marca</button>' : '') +
      '  </div>' +
      '  <p class="hint" style="margin:.5rem 0 0;font-size:.7rem">pagos_activos: ' + (pagosActivos() ? "ON (MP real)" : "OFF (checkout SIMULADO)") + '</p>' +
      '</div>';
    const bc = box.querySelector("#btnCambiarPlan");
    if (bc) bc.onclick = () => checkout(e.plan === "white" ? "white" : "pro");
    const bi = box.querySelector("#btnCanjear");
    if (bi) bi.onclick = () => {
      const inp = box.querySelector("#canjeCodigo");
      if (inp && inp.value.trim()) canjear(inp.value.trim());
    };
    const bm = box.querySelector("#btnMarca");
    if (bm) bm.onclick = () => editorBranding();
    const bb = box.querySelector("#btnBajaPlan");
    if (bb) bb.onclick = async () => {
      const ok = await Dialogos.confirmar({ titulo: "Bajar a Gratis", texto: "Perdés exports ilimitados y planos sin marca. ¿Seguir?", btnOk: "Sí, bajar a Gratis", peligro: true });
      if (ok) { desactivar(); renderGestion(); Dialogos.toast("Plan: Gratis", "ok"); }
    };
  }

  /* ---------- avisar vencimiento una vez por sesión ---------- */
  let avisoVenc = false;
  function avisarSiVencida() {
    if (avisoVenc) return;
    const e = estado();
    if (e.fuente === "vencida") {
      Dialogos.toast("Tu Plan Pro venció — seguís en Gratis", "info");
      avisoVenc = true;
    }
  }

  migrar();
  return { PLANS, estado, activo, esPro, activar, desactivar, checkout, pagosActivos, renderGestion, avisarSiVencida, planDe, precioDe, canjear, marcaRequerida, marcaTexto, branding, guardarBranding, aplicarBranding, editorBranding, reclamarPago };
})();
