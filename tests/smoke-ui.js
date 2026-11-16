// Gate de UI/UX — ESTANDAR-UI-UX-APP.md (15 puntos + sistema de assets 7 + regla 22).
// Scanner-safe: lectura + regex. Run: node tests/smoke-ui.js
const fs = require("fs");
const path = require("path");

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log("ok   - " + name);
  else { failures++; console.error("FAIL - " + name + (extra ? " :: " + extra : "")); }
}

const appDir = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(appDir, f), "utf8");
const exists = f => fs.existsSync(path.join(appDir, f));

const index = read("index.html");
const styles = read("styles.css");
const cobro = read("cobro.js");
const dialogos = read("dialogos.js");
const medir = read("medir.js");
const ui = read("ui.js");
const front = ["data.js", "dialogos.js", "medir.js", "cobro.js", "protocols.js", "engine.js",
  "planos.js", "ilustraciones.js", "obra.js", "proveedores.js", "ia.js", "sec-core.js",
  "auth.js", "enterprise.js", "ui.js"].map(read).join("\n");
const todo = index + styles + front;

// 1) cero dialogos nativos (regla 12 punto 13)
check("sin alert() en el front", !/\balert\s*\(/.test(front));
check("sin prompt() en el front", !/\bprompt\s*\(/.test(front));
check("sin confirm() en el front", !/\bconfirm\s*\(/.test(front));
// 1) cero diálogos nativos (regla 12 punto 13)
check("sin alert() en el front", !/\balert\s*\(/.test(front));
check("sin prompt() en el front", !/\bprompt\s*\(/.test(front));
check("sin confirm() en el front", !/\bconfirm\s*\(/.test(front));
check("sin diálogos nativos en el HTML", !/(^|[^.a-zA-Z_])(alert|prompt|confirm)\s*\(/.test(index));

// 2) sistema propio de diálogos con TRES salidas (✕ + fondo + Escape)
check("dialogos.js presente y cargado en index", exists("dialogos.js") && index.includes("dialogos.js"));
check("modal con botón ✕ aria-label Cerrar", /aria-label="Cerrar"/.test(dialogos));
check("modal cierra por Escape", /e\.key === "Escape"/.test(dialogos));
check("modal cierra por clic en el fondo", /e\.target === el/.test(dialogos));
check("toasts con aria-live", /aria-live/.test(dialogos));

// 3) vidrio 3 capas + auroras (puntos 4-5)
check("vidrio: backdrop-filter", /backdrop-filter/.test(styles));
check("vidrio: inset glow (brillo superior)", /inset 0 1px/.test(styles));
check("auroras: gradientes radiales de fondo", /radial-gradient/.test(styles));
check("cabecera de vidrio sticky", /\.topbar/.test(styles));
check("hover con movimiento (translateY)", /hover[^{]*\{[^}]*translateY/.test(styles));

// 4) paleta propia, cero azules de plantilla
check("paleta aqua de marca (--aqua)", styles.includes("--aqua:"));
check("sin azules de plantilla", !/#007bff|#3b82f6|#2563eb|#1d4ed8/i.test(todo));

// 5) a11y mínima
check("focus-visible con color de marca", /:focus-visible/.test(styles));
check("prefers-reduced-motion respetado", /prefers-reduced-motion/.test(styles));
check("numerales tabulares", /tabular-nums/.test(styles));
check("scrollbar personalizado", /::-webkit-scrollbar/.test(styles));
check("html lang es", /<html[^>]*lang="es/.test(index));
check("viewport sin bloquear zoom", !/user-scalable\s*=\s*no|maximum-scale\s*=\s*1\b/.test(index));

// 6) assets §7: og:image real + favicon set + créditos
const ogOk = (() => { try { return fs.statSync(path.join(appDir, "og-image.png")).size > 10000; } catch (e) { return false; } })();
check("og:image 1200x630 real en repo (>10KB)", ogOk);
check("og meta completa (og:image + width + twitter:card)", index.includes("og:image") && index.includes("og:image:width") && index.includes("twitter:card"));
check("favicon set completo (svg+192+512+apple-touch)", exists("icon.svg") && exists("icon-192.png") && exists("icon-512.png") && exists("apple-touch-icon.png"));
check("CREDITS-FOTOS.md presente (hay fotografía self-hosted)", exists("CREDITS-FOTOS.md"));

// 7) higiene §7.3: cero placeholders prohibidos
check("sin dominios placeholder", !/picsum|placehold\.(co|com|it)|loremflickr/.test(todo));
check("sin lorem ipsum/TODO/FIXME", !/lorem ipsum|TODO:|FIXME:/i.test(todo));
check("toda <img> con alt", (() => {
  const imgs = index.match(/<img\b[^>]*>/g) || [];
  return imgs.length === 0 || imgs.every(t => /alt=/.test(t));
})());

// 8) red Apicus N1 (regla 22)
check("bloque red Apicus con ?ref=red en el footer", /ref=red/.test(index));

// 9) coherencia usuario viejo (regla 18): versiones alineadas
check("SW coherente con index ?v= (regla 18 usuario viejo)", (()=>{ const m=(read("sw.js").match(/obracuatica-v(\d+\.\d+)/)||[])[1]; return !!m && index.includes("dialogos.js?v="+m); })());
check("IMG_V coherente con el SW", (()=>{ const m=(read("sw.js").match(/obracuatica-v(\d+\.\d+)/)||[])[1]; return !!m && read("data.js").includes("?v="+m); })());

// 10) producto: cero cosas que no llevan a ningún lado (P1-P10)
check("ctaPro pasa por el circuito de cobro (nunca href=# colgado)", cobro.includes("function checkout") && !index.includes('id="ctaPro" href="#"'));
check("link WhatsApp de Prueba Pro cableado desde CONFIG", index.includes('id="waPruebaPro"') && ui.includes("waPruebaPro"));
check("gestión de plan visible en Planes (#cobroGestion)", index.includes('id="cobroGestion"') && cobro.includes("cobroGestion"));
check("landing: 10 sistemas reales en data.js (números desde fuente única)", (() => {
  const d = read("data.js");
  const n = (d.match(/id: "(arena|tradicional|prefabricada|natural|contenedor|vidrio|suspendida|plunge|endless|spa)"/g) || []).length;
  return n === 10;
})());

// 11) instrumentación inactiva por diseño (regla 13)
check("medir.js cargado + eventos registro/aha/pago cableados", index.includes("medir.js") && front.includes('enviar("registro"') && front.includes('enviar("aha"'));
check("sin credencial = cero red (config vacía no dispara fetch)", medir.includes("if (!k || !k.length) return;"));
const mSin = medir.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
check("sin PII en eventos", mSin.indexOf("email") < 0 && mSin.indexOf("nombre") < 0 && mSin.indexOf("tel") < 0);
check("Turnstile/Sentry solo con credencial (gated por cfg)", medir.includes("turnstileSite") && medir.includes("cfg()"));

// 12) honestidad de números + legal mínimo
check("landing 3 exports = CONFIG.freeExportsMes 3", index.includes("3 exports por mes") && read("data.js").includes("freeExportsMes: 3"));
check("checkout SIMULADO avisado en el diálogo", cobro.includes("MODO SIMULADO"));
check("términos y privacidad en la app", index.includes("Términos y condiciones de uso") && index.includes("Política de privacidad"));

// 13) reduced-motion apaga los diálogos
check("reduced-motion apaga dlg-box/dlg-toast", /prefers-reduced-motion: reduce[\s\S]{0,200}dlg-box/.test(styles));

if (failures) {
  console.error("\nSMOKE UI: " + failures + " fallo(s). El diseño no se publica.");
  process.exit(1);
}
console.log("\nSMOKE UI: diseño al estándar (15 puntos + §7 + red N1).");
