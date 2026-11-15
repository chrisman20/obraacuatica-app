// Gate de seguridad — ESTANDAR-SEGURIDAD-APP.md, Nivel 1 Perimetro (app estatica)
// + extras client-side del protocolo propio (SECURITY.md): PBKDF2 600k, TOTP,
// lockout, auditoria encadenada, backup AES-GCM.
// + Cobro regla 21: flag honesto, activacion jamas por URL/front, webhook firmado server.
// Scanner-safe: solo lectura de archivos y regex. Run: node tests/smoke-seguridad.js
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

const ARCHIVOS = ["index.html", "styles.css", "data.js", "dialogos.js", "medir.js", "cobro.js",
  "protocols.js", "engine.js", "planos.js", "ilustraciones.js", "obra.js", "proveedores.js",
  "ia.js", "sec-core.js", "auth.js", "enterprise.js", "ui.js", "sw.js", "manifest.webmanifest",
  "_headers", ".gitignore", "og-image.png", "icon.svg", "icon-192.png", "icon-512.png",
  "apple-touch-icon.png", "CREDITS-FOTOS.md", "SECURITY.md",
  "functions/api/health.js", "functions/api/cobro/webhook.js", "functions/api/cobro/preferencia.js"];
ARCHIVOS.forEach(f => check("archivo presente: " + f, exists(f)));

const front = ["data.js", "dialogos.js", "medir.js", "cobro.js", "protocols.js", "engine.js",
  "planos.js", "ilustraciones.js", "obra.js", "proveedores.js", "ia.js", "sec-core.js",
  "auth.js", "enterprise.js", "ui.js"].map(read).join("\n");
const index = read("index.html");
const todo = front + "\n" + index;

// 1) cero secretos en el repo
const secretos = [
  [/ghp_[A-Za-z0-9]{20,}/, "token GitHub"],
  [/gho_[A-Za-z0-9]{20,}/, "token GitHub gho"],
  [/AKIA[0-9A-Z]{16}/, "AWS key"],
  [/AIza[0-9A-Za-z_\-]{30,}/, "Google API key"],
  [/sk-[A-Za-z0-9]{20,}/, "sk- key"],
  [/APP_USR-\d+-\d{12,}/, "MP produccion"],
  [/TEST-\d+-\d{12,}/, "MP test"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
  [/eyJ[A-Za-z0-9_\-]{30,}\.[A-Za-z0-9_\-]{10,}/, "JWT pegado"]
];
secretos.forEach(p => check("sin secretos: " + p[1], !p[0].test(todo + read("_headers"))));

// 2) scripts self-hosted + cero eval
const srcs = index.match(/<script[^>]+src="([^"]+)"/g) || [];
srcs.forEach(t => {
  const src = t.match(/src="([^"]+)"/)[1];
  check("script self-hosted: " + src, !/^https?:\/\//.test(src));
});
check("sin eval/new Function en el front", !/\beval\s*\(|new\s+Function\s*\(/.test(front));
check("sin ejecucion dinamica en functions/", !/\beval\s*\(|new\s+Function\s*\(/.test(read("functions/api/cobro/webhook.js") + read("functions/api/cobro/preferencia.js")));

// 3) links externos con noopener
(index.match(/<a [^>]*target="_blank"[^>]*>/g) || []).forEach(t => {
  check("target=_blank con noopener", /rel="[^"]*noopener/.test(t), t.slice(0, 60));
});

// 4) XSS: escapeHtml presente y aplicado en sinks de datos de usuario
check("Sec.escapeHtml definido", read("sec-core.js").indexOf("escapeHtml") >= 0);
check("escapeHtml aplicado en directorio local", (proveedoresTxt().match(/Sec\.escapeHtml/g) || []).length >= 2);
function proveedoresTxt() { return read("proveedores.js"); }

// 5) headers de seguridad (meta + _headers)
check("meta CSP default-src 'self'", index.includes("default-src 'self'"));
check("meta CSP object-src none", index.includes("object-src 'none'"));
check("meta CSP base-uri self", index.includes("base-uri 'self'"));
check("meta CSP frame-ancestors none", index.includes("frame-ancestors 'none'"));
const hdr = read("_headers");
check("_headers HSTS", hdr.includes("Strict-Transport-Security"));
check("_headers X-Frame-Options DENY", hdr.includes("X-Frame-Options: DENY"));
check("_headers nosniff", hdr.includes("X-Content-Type-Options: nosniff"));
check("_headers CSP alineada con la meta (challenges.cloudflare.com)", hdr.includes("challenges.cloudflare.com") === index.includes("challenges.cloudflare.com"));
check("_headers Permissions-Policy", hdr.includes("Permissions-Policy"));

// 6) auth client-side del protocolo propio
const sec = read("sec-core.js");
const auth = read("auth.js");
check("PBKDF2 600k iteraciones", sec.includes("600000") && /iter = 600000/.test(sec));
check("lockout 5 -> 15 min", sec.includes("LOCK_MAX = 5") && sec.includes("LOCK_MIN = 15"));
check("auditoria encadenada SHA-256", sec.includes("prev + \"|\"") || sec.includes("prev + '|'"));
check("backup AES-256-GCM", sec.includes("AES-GCM"));
check("2FA TOTP real", /TOTP|totp/.test(auth) && auth.includes("otpauth"));
check("sesion token CSPRNG + expiracion", auth.includes("token") && /8 h|expira/.test(auth));

// 7) COBRO (regla 21): circuito honesto, sin atajos confirmables por URL
const cobro = read("cobro.js");
const datajs = read("data.js");
check("flag pagos_activos existe y nace false", /pagos_activos:\s*false/.test(datajs));
check("sin token de MP hardcodeado en front", !/APP_USR-|TEST-\d+-\d{12}/.test(front));
check("el front jamas llama a la API de MP con credenciales", !/api\.mercadopago\.com/.test(front));
// El front nunca activa el plan por URL: no hay ruta confirmable
check("sin ruta confirmable por URL (jamAs plan/confirmar)", !/plan\/confirmar/.test(front + index));
check("webhook activa SOLO server-side y sin env = 503 inactivo", read("functions/api/cobro/webhook.js").includes("SIMULADO_INACTIVO") && read("functions/api/cobro/webhook.js").includes("x-signature"));
check("preferencia server-side (token jamas en el front)", read("functions/api/cobro/preferencia.js").includes("MP_ACCESS_TOKEN") && !front.includes("MP_ACCESS_TOKEN"));
check("tabla PLANS fuente unica en cobro.js", cobro.includes("const PLANS") && cobro.includes("id: \"pro\""));
check("suscripcion con expiracion + migracion legacy", cobro.includes("KEY_LEGACY") && cobro.includes("expira"));

// 8) PWA + cache-busting (usuario viejo, regla 18)
const sw = read("sw.js");
const manifest = read("manifest.webmanifest");
check("SW versionado v4.1", sw.includes("obracuatica-v4.1"));
check("SW cachea el shell completo (incluye dialogos/medir/cobro)", sw.includes("./dialogos.js") && sw.includes("./medir.js" ) && sw.includes("./cobro.js"));
check("manifest standalone", manifest.includes('"display": "standalone"'));
check("manifest iconos 192/512 + maskable + svg", manifest.includes("icon-192.png") && manifest.includes("icon-512.png") && manifest.includes("purpose\": \"maskable"));
check("index versiona los scripts ?v=4.1 (coherente con SW)", /cobro\.js\?v=4\.1/.test(index) && /dialogos\.js\?v=4\.1/.test(index));
check("theme-color + apple-touch-icon", index.includes("apple-touch-icon.png") && index.includes('name="theme-color"'));

// 9) deploy higiene
check(".assetsignore presente (deploy por lista)", exists(".assetsignore"));
check(".gitignore cubre datos locales", read(".gitignore").includes("data/") && read(".gitignore").includes(".env"));
check("health endpoint presente", read("functions/api/health.js").includes("ok: true"));

if (failures) {
  console.error("\nSMOKE SEGURIDAD: " + failures + " fallo(s). No se publica.");
  process.exit(1);
}
console.log("\nSMOKE SEGURIDAD: todo verde (Nivel 1 + auth client-side + cobro regla 21).");
