// Gate de EMBUDO — PROTOCOLO-ESTADISTICAS-DE-USO.md (regla 24) §6.
// (a) vocabulario cableado en los pasos del embudo, (b) capturador global de
// errores, (c) sin key = CERO network (regla 13, medir.js corrido en una VM
// con fetch espiado + mordida con key sembrada), (d) embudo declarado en
// CORAZON.md con los umbrales del protocolo, (e) botón de auxilio §7.
// Run: node tests/smoke-funnel.js   — Exit 0 = se publica.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log("ok   - " + name);
  else { failures++; console.error("FAIL - " + name + (extra ? " :: " + extra : "")); }
}

const appDir = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(appDir, f), "utf8");
const uijs = read("ui.js");
const cobro = read("cobro.js");
const medir = read("medir.js");
const auth = read("auth.js");
const index = read("index.html");
const datajs = read("data.js");
const styles = read("styles.css");
const corazon = read("CORAZON.md");
const webhook = read(path.join("functions", "api", "cobro", "webhook.js"));

/* ── (a) Vocabulario cableado en los pasos del embudo ──
   EMBUDO (CORAZON.md): config (paso_1) → resultados (paso_2) → presupuesto
   (paso_3) → export (aha) → checkout (pago_start → pago_ok). */
check("embudo: paso_1 al configurar la pileta (inputs del tab Configurá)", uijs.includes('enviar("paso_1")'));
check("embudo: paso_2 al ver Resultados", uijs.includes('enviar("paso_2")'));
check("embudo: paso_3 al ver el Presupuesto", uijs.includes('enviar("paso_3")'));
check("embudo: aha en el primer export (sigue vivo)", uijs.includes('enviar("aha"'));
check("embudo: registro al crear cuenta (sigue vivo)", auth.includes('enviar("registro"'));
check("embudo: pago_start al abrir el checkout (real o SIMULADO)", cobro.includes('enviar("pago_start"'));
check("embudo: pago_ok cuando el plan queda activo", cobro.includes('enviar("pago_ok"'));
check("embudo: pago_ok nace donde el pago es cierto (webhook firmado, con guard de env)", webhook.includes('"pago_ok"') && webhook.includes("env.POSTHOG_KEY"));
check("embudo: pago_fail en las fricciones (ya-pagué / canje inválido / sin backend)", (cobro.match(/enviar\("pago_fail"/g) || []).length >= 3);
check("embudo: vuelta_paso_1 (re-configura tras ver resultados) y vuelta_paso_2 (re-entra sin exportar)", uijs.includes('enviar("vuelta_paso_1"') && uijs.includes('enviar("vuelta_paso_2"'));
check("embudo: salida_paso_N al irse con un paso vigiente (beforeunload + visibilitychange)", /["']salida_["'] \+ pasoVigente/.test(medir) && medir.includes("beforeunload") && medir.includes("visibilitychange"));

/* ── (b) Capturador global de errores ── */
check("errores: capturador global (window.onerror + unhandledrejection → error_js)", medir.includes('addEventListener("error"') && medir.includes('addEventListener("unhandledrejection"') && medir.includes('enviar("error_js"'));
check("errores: stack saneado (recorte 200 chars), SIN PII en el código de medir", /slice\(0,\s*200\)/.test(medir) && (() => {
  const mSin = medir.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  return mSin.indexOf("email") < 0 && mSin.indexOf("nombre") < 0 && mSin.indexOf("tel") < 0;
})());

/* ── (e) Botón de auxilio §7 ── */
check("auxilio: botón flotante presente y OCULTO por defecto en toda pantalla", index.includes('id="btnAuxilio"') && index.includes("hidden"));
check("auxilio: sin WHATSAPP_NUMBER = botón oculto (inactivo por diseño, regla 13)", datajs.includes('WHATSAPP_NUMBER: ""') && uijs.includes("WHATSAPP_NUMBER") && uijs.includes("aux.hidden = false"));
check("auxilio: wa.me con contexto (app + versión fuente única + paso vigente)", uijs.includes("wa.me/") && medir.includes("algo no anda: ") && medir.includes("APP_VERSION"));
check("auxilio: estilos del flotante (discreto, [hidden] manda)", styles.includes(".btn-auxilio") && styles.includes(".btn-auxilio[hidden]"));

/* ── (c) Sin key = CERO network (regla 13) — medir.js corrido en una VM ── */
async function correrMedir(cfg) {
  const llamadas = [];
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.CONFIG = { analytics: cfg || {} };
  sandbox.APP_VERSION = "4.5"; // fuente única de la versión (data.js en el navegador)
  sandbox.addEventListener = (ev, fn) => { (sandbox.__listeners = sandbox.__listeners || {})[ev] = fn; };
  sandbox.document = {
    addEventListener: (ev, fn) => { (sandbox.__docListeners = sandbox.__docListeners || {})[ev] = fn; },
    visibilityState: "visible"
  };
  sandbox.localStorage = { _k: {}, getItem(k) { return this._k[k] || null; }, setItem(k, v) { this._k[k] = String(v); }, removeItem(k) { delete this._k[k]; } };
  sandbox.crypto = { getRandomValues(a) { for (let i = 0; i < a.length; i++) a[i] = (i * 7 + 13) % 256; return a; } };
  sandbox.fetch = (url) => { llamadas.push(String(url)); return Promise.resolve({ json: () => Promise.resolve({}) }); };
  vm.createContext(sandbox);
  vm.runInContext(medir, sandbox);
  vm.runInContext("window.Medir = Medir;", sandbox); // expone el const del script
  await new Promise(r => setImmediate(r));
  return { sandbox, llamadas };
}

(async () => {
  // Sin credencial: los eventos van a la cola local y NADA sale del navegador.
  const sin = await correrMedir({});
  sin.sandbox.Medir.enviar("paso_1");
  sin.sandbox.Medir.enviar("pago_start");
  if (sin.sandbox.__listeners && sin.sandbox.__listeners.error) sin.sandbox.__listeners.error({ message: "boom", filename: "https://x/ui.js", lineno: 42 });
  if (sin.sandbox.__listeners && sin.sandbox.__listeners.beforeunload) sin.sandbox.__listeners.beforeunload();
  await new Promise(r => setImmediate(r));
  check("regla 13: sin key CERO network (ni un fetch sale del navegador)", sin.llamadas.length === 0);
  check("regla 13: sin key los eventos quedan en la cola local (window.__medidos)", sin.sandbox.__medidos.includes("paso_1") && sin.sandbox.__medidos.includes("pago_start"));
  check("regla 24: salida_paso_1 se dispara al irse con un paso vigiente", sin.sandbox.__medidos.includes("salida_paso_1"));
  check("regla 24: error_js cae al vocabulario desde el capturador global (saneado, 200 chars)", sin.sandbox.__medidos.includes("error_js"));
  check("regla 24 §7: el texto de auxilio lleva app + versión + paso con su etiqueta", (() => {
    const t = sin.sandbox.Medir.textoAuxilio();
    return t.startsWith("obracuatica v4.5") && t.includes("paso_1") && t.includes("(Configurá)") && t.includes("algo no anda: ");
  })());

  // Con key sembrada (la mordida): la instrumentación queda VIVA, no muerta en silencio.
  const con = await correrMedir({ posthog: "phc_test_falso" });
  con.sandbox.Medir.enviar("paso_2");
  await new Promise(r => setImmediate(r));
  check("regla 13: con key el evento SALE a PostHog (modo vivo sin refactor)", con.llamadas.some(u => u.indexOf("posthog") !== -1));

  /* ── (d) Embudo declarado en CORAZON.md ── */
  const seg = corazon.slice(corazon.indexOf("## EMBUDO"));
  check("corazón: embudo declarado (paso_1..3, aha, pago_start → pago_ok)", seg.length > 100 && seg.includes("paso_1") && seg.includes("paso_2") && seg.includes("paso_3") && seg.includes("aha") && seg.includes("pago_start") && seg.includes("pago_ok"));
  check("corazón: umbrales del protocolo §2 (90% / 60% / 40% / 8%)", seg.includes("90%") && seg.includes("60%") && seg.includes("40%") && seg.includes("8%"));

  console.log(failures ? "\nSMOKE FUNNEL: " + failures + " FAIL — el embudo no se publica a ciegas." : "\nSMOKE FUNNEL: embudo al estándar (regla 24).");
  process.exit(failures ? 1 : 0);
})();
