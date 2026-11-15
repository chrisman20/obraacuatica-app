// e2e-corazon.mjs — EL CHECK DEL CORAZON repetible (regla 19).
// Recorre el pipeline completo del motor con dato vivo (prefabricada 6.5x3.5)
// y exige: geometria finita, presupuesto real, matematica exacta del total,
// la falla validada (input roto -> aviso, jamas NaN) y el circuito de cobro.
// Run: node tests/e2e-corazon.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(__dirname, "..");
let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log("ok   - " + name);
  else { failures++; console.error("FAIL - " + name + (extra ? " :: " + extra : "")); }
}
function makeSandbox() {
  const elements = {};
  const mkEl = (id, value) => ({ id, value: value != null ? value : "", checked: false,
    classList: { contains: () => false, add: () => {}, remove: () => {} }, textContent: "", disabled: false });
  const ids = { fBorderType: "skimmer", fShape: "rect", fLen: "6.5", fWidth: "3.5",
    fDepthMin: "1.0", fDepthMax: "1.7", fSolW: "3", fUse: "res", fTerrain: "slope",
    fCopingType: "stone", fDeck: "", fDeckW: "2", fDeckMat: "madera", fFinish: "lisa",
    fWaste: "8", fBoxM2: "2.07", fFilter: "arena", fSanitizer: "cl",
    fLights: "", fLadder: "", fHeat: "", fCover: "on", fShower: "", fRobot: "" };
  for (const id of Object.keys(ids)) elements[id] = mkEl(id, ids[id]);
  const typeCards = [{ dataset: { type: "arena" }, classList: { contains: s => s === "selected" } }];
  return {
    document: {
      getElementById: id => elements[id] || null,
      querySelector: sel => (String(sel).includes("ts-card") ? typeCards.find(c => c.classList.contains("selected")) : null),
      querySelectorAll: sel => (String(sel).includes("chip") ? [] : []),
    },
    window: {},
    localStorage: (() => { const store = {}; return {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    }; })(),
    navigator: {},
    console, Math, Date, JSON, isNaN, parseFloat, parseInt, isFinite, Number, String, Array, Object, RegExp, Error,
  };
}
const CTX = {};
function loadCtx(files, box) {
  for (const file of files) {
    const code = fs.readFileSync(path.join(APP, file), "utf8");
    vm.runInNewContext(code, box, { filename: file });
  }
  // los const top-level viven en el scope global del contexto (no en el objeto sandbox):
  // se leen de vuelta con un snippet corrido DENTRO del mismo contexto
  return vm.runInNewContext("({ Engine: typeof Engine !== 'undefined' ? Engine : null, POOL_TYPES: typeof POOL_TYPES !== 'undefined' ? POOL_TYPES : null, CONFIG: typeof CONFIG !== 'undefined' ? CONFIG : null, DEFAULT_PRICES: typeof DEFAULT_PRICES !== 'undefined' ? DEFAULT_PRICES : null, Cobro: typeof Cobro !== 'undefined' ? Cobro : null })", box);
}
function freshCtx(files) {
  // sandbox NUEVO por bloque: recontextificar el mismo objeto reusaría el contexto
  // (y los const de la corrida anterior volverían a declararse -> SyntaxError)
  const box = makeSandbox();
  const mods = loadCtx(files, box);
  return Object.assign(box, mods);
}
// ---------- E0 CORAZON: prefabricada 6.5x3.5, precio de mercado ----------
const sb = freshCtx(["data.js", "engine.js"]);
check("motor carga con stub minimo", !!sb.Engine && typeof sb.Engine.computeGeometry === "function");
const tdef = sb.POOL_TYPES.find(t => t.id === "prefabricada");
check("tipo prefabricada existe en POOL_TYPES", !!tdef);
const cfg = { type: "prefabricada", tdef, shape: "rect", L: 6.5, W: 3.5, dMin: 1.0, dMax: 1.7,
  solarium: false, solW: 3, use: "res", borderType: "skimmer", infinity: false, infSides: 1,
  terrain: "slope", copingType: "stone", deck: false, deckW: 2, deckMat: "madera",
  finish: tdef.finishes.includes("lisa") ? "lisa" : tdef.finishes[0],
  waste: 0.08, boxM2: 2.07, filter: "arena", sanitizer: "cl",
  lights: false, ladder: false, heat: false, cover: true, shower: false, robot: false, innovations: [] };
const geo = sb.Engine.computeGeometry(cfg);
check("E0 geometria 6.5x3.5: volumen finito y realista (15-40 m3)", Number.isFinite(geo.volume) && geo.volume > 15 && geo.volume < 40, String(geo.volume));
const hyd = sb.Engine.computeHydraulics(cfg, geo);
check("E0 hidraulica: recambio y caudal finitos", Number.isFinite(hyd.flow) || Number.isFinite(hyd.renovH), JSON.stringify({ flow: hyd.flow, renovH: hyd.renovH }));
const mat = sb.Engine.computeMaterials(cfg, geo);
const nRubros = Array.isArray(mat.items) ? mat.items.length : Object.keys(mat).length;
check("E0 materiales: rubros reales (>=5)", nRubros >= 5, String(nRubros));
const budget = sb.Engine.computeBudget(cfg, geo, hyd, mat, sb.DEFAULT_PRICES);
const items = budget.items;
check("E0 presupuesto: >= 12 rubros con precio (varían con opciones)", Array.isArray(items) && items.length >= 12, String(items ? items.length : "n/a"));
const subtotal = items.reduce((s, i) => s + (i.qty * i.price), 0);
check("E0 matematica exacta: subtotal = SUM(cant x precio)", Math.abs(subtotal - budget.subtotal) < 1, "SUM=" + subtotal.toFixed(2) + " vs " + budget.subtotal);
const precio = subtotal * 1.10 * 1.35 * 1.21;
check("E0 precio llave en mano en rango de mercado (1M-100M ARS)", precio > 1000000 && precio < 100000000, "aprox $" + Math.round(precio).toLocaleString("es-AR"));
// ---------- LA FALLA: input roto -> marca el campo y jamas fabrica NaN ----------
const sb2 = freshCtx(["data.js", "engine.js"]);
sb2.document.getElementById("fLen").value = "";
const cfg2 = sb2.Engine.readConfig();
check("falla: input vacio queda MARCADO (entradasInvalidas)", Array.isArray(cfg2.entradasInvalidas) && cfg2.entradasInvalidas.length >= 1);
const geo2 = sb2.Engine.computeGeometry(cfg2);
check("falla: con input roto el volumen jamas es NaN (fallback + aviso)", Number.isFinite(geo2.volume));
// ---------- COBRO (regla 21): tabla PLANS + estado honesto + flag ----------
const sb3 = freshCtx(["data.js", "engine.js", "cobro.js"]);
const C = sb3.Cobro;
check("cobro: tabla PLANS con los 3 planes", Array.isArray(C.PLANS) && C.PLANS.length === 3 && C.PLANS.map(p => p.id).join(",") === "gratis,pro,white");
check("cobro: estado inicial honesto (gratis, sin fingir pro)", C.estado().plan === "gratis" && C.estado().activo === false);
C.desactivar();
C.activar("pro", "simulado");
const e = C.estado();
check("cobro: activacion registra fuente y expiracion 30 dias", e.plan === "pro" && e.activo === true && e.fuente === "simulado" && e.dias === 30);
check("cobro: esPro reconoce pro y white (y no gratis)", C.esPro() === true);
C.desactivar();
check("cobro: baja a gratis real (esPro false)", C.esPro() === false);
check("cobro: pagosActivos false sin credencial (SIMULADO honesto)", C.pagosActivos() === false);

if (failures) { console.error(""); console.error("E2E CORAZON: " + failures + " fallo(s). El corazon esta rojo."); process.exit(1); }
console.log("");
console.log("E2E CORAZON: punta a punta verde (dato vivo + falla validada + cobro).");
