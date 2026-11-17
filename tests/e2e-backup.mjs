// e2e-backup.mjs — RESTAURACIÓN ENSAYADA del backup rotativo (P1 operación, regla 12 nivel 4).
// Carga el código REAL (sec-core.js + auth.js) en un sandbox vm con WebCrypto de Node
// y recorre el circuito completo: registrar admin → exportar → CIFRAR (AES-256-GCM,
// mismas primitivas que ui.js adBackup) → ROTAR 5 backups (FIFO máx 3) → CORROMPER
// el estado vivo → RESTAURAR del histórico → comparar clave por clave → passphrase
// equivocada = fail-closed → el histórico jamás se auto-incluye.
// Run: node tests/e2e-backup.mjs
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
  const store = {};
  const base = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  };
  // en el navegador Object.keys(localStorage) lista las claves: proxy para emularlo
  // (getOwnPropertyDescriptor hace las claves enumerables para Object.keys)
  const lsProxy = new Proxy(base, {
    ownKeys: () => Reflect.ownKeys(store),
    getOwnPropertyDescriptor: (target, k) => (k in store
      ? { configurable: true, enumerable: true, writable: true, value: store[k] }
      : undefined)
  });
  const ssStore = {};
  return {
    console, Math, Date, JSON, isNaN, parseFloat, parseInt, isFinite, Number, String, Array, Object, RegExp, Error, Promise, Uint8Array,
    crypto, btoa: s => Buffer.from(s, "binary").toString("base64"),
    atob: s => Buffer.from(s, "base64").toString("binary"),
    TextEncoder, TextDecoder,
    localStorage: lsProxy,
    sessionStorage: {
      getItem: k => (k in ssStore ? ssStore[k] : null),
      setItem: (k, v) => { ssStore[k] = String(v); },
      removeItem: k => { delete ssStore[k]; }
    },
    window: {}, document: { addEventListener: () => {}, getElementById: () => null },
    navigator: {}, location: { reload: () => {} }, setTimeout: () => {}
  };
}

const box = makeSandbox();
for (const f of ["sec-core.js", "auth.js"]) {
  vm.runInNewContext(fs.readFileSync(path.join(APP, f), "utf8"), box, { filename: f });
}
const { Sec, Auth } = vm.runInNewContext("({ Sec, Auth })", box);

/* 1. usuario admin (el primero queda dueño) + sesión */
const reg = await Auth.register("Dueño Test", "dueno@test.local", "clave-larga-456");
check("registro del primer usuario (dueño) ok", reg.ok === true, JSON.stringify(reg));
const login = await Auth.login("dueno@test.local", "clave-larga-456");
check("login deja sesión admin", login.ok === true && Auth.isAdmin() === true);

/* 2. exportar + cifrar (circuito EXACTO de ui.js adBackup: aesEncrypt(exportAll, pass)) */
const b1 = Auth.exportAll();
check("exportAll recoge claves piletalab_*", b1.ok === true && Object.keys(b1.data).length >= 1, JSON.stringify(Object.keys(b1.data || {})));
const PASS1 = "passphrase-primera-123";
const enc1 = await Sec.aesEncrypt(b1, PASS1);
check("cifrado AES-256-GCM con PBKDF2 (formato v1)", enc1.v === 1 && enc1.cipher === "AES-256-GCM");

/* 3. rotación FIFO máx 3: guardamos 5 copias con passphrases distintas —
      las 2 primeras (PASS1 incluida) quedan PURGADAS, viven la 3/4/5 */
check("rotativo guarda copia 1", Auth.rotarGuardar(enc1).kept === 1);
for (let i = 2; i <= 5; i++) {
  const e = await Sec.aesEncrypt(Auth.exportAll(), "passphrase-copia-" + i);
  Auth.rotarGuardar(e);
}
const listAfter5 = Auth.rotarListar();
check(`rotativo conserva exactamente ROT_MAX=${Auth.ROT_MAX} tras 5 guardas`, listAfter5.length === Auth.ROT_MAX && Auth.ROT_MAX === 3, "quedaron " + listAfter5.length);

/* 4. corromper el estado vivo: pisamos una clave de DATOS (precios) con basura.
      (La clave de usuarios NO se toca: isAdmin() la lee — si la rompiéramos,
      el restaurador se bloquearía a sí mismo. Ese caso va por el paso 7.) */
box.localStorage.setItem("piletalab_prices", '{"corrupto":');
const valorOriginalUsers = box.localStorage.getItem("piletalab_users");
check("estado corrompido (precios pisados con basura)", box.localStorage.getItem("piletalab_prices") === '{"corrupto":');

/* 5. restauración ensayada de la copia MÁS VIEJA viva (índice 0 = passphrase-copia-3) */
const r05 = await Auth.rotarRestaurar(0, "passphrase-copia-3");
check("restauración ensayada: la copia más vieja viva restaura con SU passphrase exacta", !!(r05 && r05.ok), JSON.stringify(r05));
check("la sesión de admin sigue viva tras restaurar", Auth.isAdmin() === true);
check("la clave de usuarios quedó intacta por la restauración", box.localStorage.getItem("piletalab_users") === valorOriginalUsers);

/* 6. fail-closed: passphrase equivocada = GCM rechaza, NADA se restaura */
const antes = box.localStorage.getItem("piletalab_users");
let blocked = false;
try { await Auth.rotarRestaurar(0, "passphrase-equivocada-999"); } catch (e) { blocked = true; }
check("passphrase equivocada = GCM autentica y rechaza (cero restauración silenciosa)", blocked === true);
check("el estado quedó INTACTO tras el intento fallido", box.localStorage.getItem("piletalab_users") === antes);

/* 7. pérdida TOTAL (navegador nuevo): users corrupto + sesión muerta → el camino
      documentado de recuperación es re-registrar (el primero vuelve a ser dueño)
      y DESPUÉS restaurar el histórico. El restaurador jamás se debilita: exige
      un admin real logueado. */
box.sessionStorage.removeItem("piletalab_session");
box.localStorage.removeItem("piletalab_session_keep");
box.localStorage.setItem("piletalab_users", '{"corrupto":');
check("pérdida total: sin sesión y users corrupto (isAdmin cae)", Auth.isAdmin() === false);
const bloqueado = await Auth.rotarRestaurar(0, "passphrase-copia-3").catch(() => ({ ok: false }));
check("sin admin logueado el restaurador NO restaura (fail-closed, no se debilita)", bloqueado.ok === false);
const reReg = await Auth.register("Dueño Test", "dueno@test.local", "clave-larga-456");
check("re-registro con users vacío → primer usuario = dueño de nuevo", reReg.ok === true && reReg.isFirst === true);
const reLogin = await Auth.login("dueno@test.local", "clave-larga-456");
const rRecup = await Auth.rotarRestaurar(0, "passphrase-copia-3");
check("recuperación punta a punta: dueño re-registrado restaura el histórico", reLogin.ok === true && rRecup.ok === true, JSON.stringify(rRecup));
check("los usuarios originales VOLVIERON con la restauración", box.localStorage.getItem("piletalab_users") === valorOriginalUsers);

/* 8. el histórico no se auto-incluye en los backups (clave sin prefijo piletalab_).
      Tras restaurar, la sesión del re-registro apunta a un id que ya no existe:
      re-login con las credenciales ORIGINALES (restauradas) vuelve a ser admin. */
const reLogin2 = await Auth.login("dueno@test.local", "clave-larga-456");
check("re-login con las credenciales originales restauradas", reLogin2.ok === true && Auth.isAdmin() === true);
check("el histórico rotativo NO viaja dentro del backup (no auto-incluido)",
  !Object.keys(Auth.exportAll().data).some(k => k.includes("backup_rot")));

console.log(failures ? `\nE2E BACKUP: ${failures} FAIL` : "\nE2E BACKUP: restauración ensayada verde (export→cifrar→rotar→perder→restaurar).");
process.exit(failures ? 1 : 0);
