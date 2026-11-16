/*
 * smoke-contenido.js — GATE DE VERDAD DE CONTENIDO (mecánico)
 * ObraAcuatica · protocolo: ../PROTOCOLO-VERDAD-DE-CONTENIDO.md
 *
 * Convierte MANIFIESTO-CONTENIDO.md en trampa permanente. El título de un asset
 * NO es evidencia: cada imagen referenciada en data.js necesita fila en el
 * MANIFIESTO con certificacion visual escrita.
 *   VERDE (certificada)            -> pasa
 *   DEBIL (veraz pero mejorable)   -> WARN + obligacion P2
 *   ROJO / sin fila / sin certificar -> FAIL
 * Run: node tests/smoke-contenido.js
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
let fails = 0, warns = 0, oks = 0;

function check(ok, msg) {
  if (ok) { oks++; console.log("[OK]   " + msg); }
  else { fails++; console.log("[FAIL] " + msg); }
}
function warn(ok, msg) {
  if (ok) { oks++; console.log("[OK]   " + msg); }
  else { warns++; console.log("[WARN] " + msg); }
}

// 1. Cargar manifiesto
const MPATH = path.join(ROOT, "MANIFIESTO-CONTENIDO.md");
if (!fs.existsSync(MPATH)) {
  console.error("[FAIL] MANIFIESTO-CONTENIDO.md no existe — el gate de contenido exige manifiesto");
  process.exit(1);
}
const manifest = fs.readFileSync(MPATH, "utf8");

// 2. Extraer el mapeo tipo->foto desde data.js (fuente unica del mapeo)
const dataJs = fs.readFileSync(path.join(ROOT, "data.js"), "utf8");
const map = {};
const re = /([A-Za-z_][A-Za-z0-9_]*)\s*:\s*"(img\/[^"]+\.jpg)"/g;
let m;
while ((m = re.exec(dataJs)) !== null) {
  const key = m[1];
  const file = m[2];
  if (!map[key]) map[key] = [];
  map[key].push(file);
}

const keys = Object.keys(map);
if (keys.length === 0) {
  console.error("[FAIL] no se extrajo ningun mapeo de fotos desde data.js");
  process.exit(1);
}
console.log("Mapeo extraido de data.js: " + keys.length + " claves (" + keys.map(k => k).join(", ") + ")");

// 3. Por cada foto referenciada: archivo existe + fila en manifiesto + veredicto
const seen = new Set();
for (const key of keys) {
  for (const file of map[key]) {
    if (seen.has(file)) {
      check(false, "REUTILIZACION: " + file + " esta mapeada a mas de una clave (" + key + ") — foto compartida entre tipos = mentira por reuso");
      continue;
    }
    seen.add(file);
    const abs = path.join(ROOT, file);
    check(fs.existsSync(abs), "existe: " + file);
    const rowRe = new RegExp("\\|\\s*`" + file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "`\\s*\\|");
    const row = rowRe.test(manifest);
    check(row, "fila en MANIFIESTO: " + file);
    if (row) {
      const line = manifest.split("\n").find(l => l.includes("`" + file + "`"));
      const verde = line.includes("VERDE");
      const debil = line.includes("DÉBIL") || line.includes("DEBIL");
      if (verde) { console.log("[OK]   certificacion VERDE: " + file); oks++; }
      else if (debil) { warn(false, "certificacion DEBIL (obligacion P2): " + file); }
      else { check(false, "sin certificacion legible (VERDE/DEBIL): " + file); }
    }
  }
}

// 4. Todo archivo de imagen del repo esta en el manifiesto (sin assets sueltos sin certificar)
const imgDir = path.join(ROOT, "img");
if (fs.existsSync(imgDir)) {
  for (const f of fs.readdirSync(imgDir)) {
    if (!/\.(jpg|jpeg|png|webp)$/i.test(f)) continue;
    const rel = "img/" + f;
    const rowRe = new RegExp("\\|\\s*`" + rel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "`\\s*\\|");
    check(rowRe.test(manifest), "img/ sin fila huerfana en manifiesto: " + rel);
  }
}

// 5. Creditos: cada foto binaria tiene fila en CREDITS-FOTOS.md
const credits = fs.existsSync(path.join(ROOT, "CREDITS-FOTOS.md"))
  ? fs.readFileSync(path.join(ROOT, "CREDITS-FOTOS.md"), "utf8") : "";
for (const file of seen) {
  const rowRe = new RegExp("\\|\\s*`" + file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "`\\s*\\|");
  check(rowRe.test(credits), "credito en CREDITS-FOTOS.md: " + file);
}

// 6. Magia de archivo vs extension (JPEG real, no renombrados)
for (const file of seen) {
  const buf = fs.readFileSync(path.join(ROOT, file));
  const isJpeg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8;
  check(isJpeg, "JPEG real (magia de bytes): " + file);
}

// 7. Salida
console.log("");
console.log("SMOKE CONTENIDO: " + oks + " ok | " + warns + " warn | " + fails + " fail");
if (fails > 0) { console.log("ROJO — no se publica"); process.exit(1); }
console.log("VERDE — todo asset certificado (warns = obligaciones P2 registradas)");
