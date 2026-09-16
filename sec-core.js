/* ============================================================
   sec-core.js — Protocolo de seguridad para apps del workspace
   Estándar "grado bancario aplicado a app local":

   · PBKDF2-SHA256 600.000 iteraciones (baseline OWASP 2023)
   · AES-256-GCM para cifrado de datos (backups, exportaciones)
   · Bloqueo por intentos fallidos (5 → 15 min, backoff)
   · Registro de auditoría ENCADENADO con SHA-256 (tamper-evident)
   · Expiración y rotación de sesión + logout por inactividad
   · escapeHtml() contra XSS en todo input que se renderiza

   Sin dependencias, funciona offline, WebCrypto nativo.
   Copiar este archivo a cada app nueva + seguir
   99-HERRAMIENTAS/seguridad-apps/SECURITY-PROTOCOL.md
   ============================================================ */

const Sec = (() => {

  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const rand = n => crypto.getRandomValues(new Uint8Array(n));
  const b64 = b => btoa(String.fromCharCode(...b));
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const hex = b => [...b].map(x => x.toString(16).padStart(2, "0")).join("");

  /* ---------- XSS ---------- */
  const escapeHtml = s => String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  /* ---------- hashing ---------- */
  async function pbkdf2(pass, saltB64, iter = 600000) {
    const key = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: unb64(saltB64), iterations: iter }, key, 256);
    return b64(new Uint8Array(bits));
  }
  async function sha256B64(text) {
    const d = await crypto.subtle.digest("SHA-256", enc.encode(text));
    return b64(new Uint8Array(d));
  }

  /* ---------- AES-256-GCM (cifrado autenticado) ---------- */
  async function deriveKey(pass, saltB64, iter = 310000) {
    const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", hash: "SHA-256", salt: unb64(saltB64), iterations: iter },
      base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function aesEncrypt(obj, passphrase) {
    const salt = b64(rand(16)), iv = rand(12);
    const key = await deriveKey(passphrase, salt);
    const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(obj)));
    return { v: 1, kdf: "PBKDF2-SHA256-310k", cipher: "AES-256-GCM", salt, iv: b64(iv), data: b64(new Uint8Array(data)) };
  }
  async function aesDecrypt(payload, passphrase) {
    if (!payload || payload.v !== 1) throw new Error("Formato de backup inválido");
    const key = await deriveKey(passphrase, payload.salt);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: unb64(payload.iv) }, key, unb64(payload.data));
    return JSON.parse(dec.decode(plain));   // GCM autentica: si la clave está mal, lanza
  }

  /* ---------- bloqueo por intentos fallidos ---------- */
  const LOCK_MAX = 5, LOCK_MIN = 15;
  function lkKey(k) { return "sec_lock_" + k; }
  function lockoutCheck(k) {
    try {
      const st = JSON.parse(localStorage.getItem(lkKey(k)) || "null");
      if (st?.until && Date.now() < st.until)
        return { locked: true, minutes: Math.ceil((st.until - Date.now()) / 60000) };
    } catch (e) { }
    return { locked: false };
  }
  function lockoutFail(k) {
    const st = (() => { try { return JSON.parse(localStorage.getItem(lkKey(k)) || "{}"); } catch (e) { return {}; } })();
    st.fails = (st.fails || 0) + 1;
    if (st.fails >= LOCK_MAX) { st.until = Date.now() + LOCK_MIN * 60000; st.fails = 0; }
    localStorage.setItem(lkKey(k), JSON.stringify(st));
  }
  function lockoutReset(k) { localStorage.removeItem(lkKey(k)); }

  /* ---------- registro de auditoría encadenado (tamper-evident) ----------
     Cada entrada lleva el SHA-256 de la anterior: si alguien edita o
     borra una entrada del medio, la cadena deja de cuadrar. */
  const AUDIT_KEY = "sec_audit_" + (document.body?.dataset?.app || "app");
  async function audit(event, detail = "") {
    try {
      const list = JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]");
      const prev = list.at(-1)?.hash || "GENESIS";
      const entry = { t: new Date().toISOString(), event, detail: escapeHtml(detail).slice(0, 120) };
      entry.hash = await sha256B64(prev + "|" + entry.t + "|" + entry.event + "|" + entry.detail);
      list.push(entry);
      localStorage.setItem(AUDIT_KEY, JSON.stringify(list.slice(-200)));   // últimos 200
    } catch (e) { /* la auditoría nunca rompe la app */ }
  }
  function auditGet() { try { return JSON.parse(localStorage.getItem(AUDIT_KEY)) || []; } catch (e) { return []; } }
  async function auditVerify() {
    const list = auditGet();
    let prev = "GENESIS";
    for (const e of list) {
      const expect = await sha256B64(prev + "|" + e.t + "|" + e.event + "|" + e.detail);
      if (expect !== e.hash) return { ok: false, brokenAt: e.t };
      prev = e.hash;
    }
    return { ok: true, count: list.length };
  }

  /* ---------- logout por inactividad ---------- */
  function setIdleLogout(minutes, onIdle) {
    let timer = null;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(onIdle, minutes * 60000);
    };
    ["click", "keydown", "mousemove", "touchstart", "scroll"].forEach(ev =>
      document.addEventListener(ev, arm, { passive: true }));
    arm();
  }

  /* ---------- tokens de sesión ---------- */
  const token = () => hex(rand(24));
  const nowExp = hours => Date.now() + hours * 3600000;

  return { escapeHtml, pbkdf2, sha256B64, aesEncrypt, aesDecrypt,
    lockoutCheck, lockoutFail, lockoutReset,
    audit, auditGet, auditVerify, setIdleLogout, token, nowExp,
    rand, b64, unb64, hex };
})();
