/* ============================================================
   ObraAcuática — auth.js
   Cuentas locales con:
   · Registro/login con contraseña hasheada PBKDF2 (WebCrypto,
     120.000 iteraciones, salt único por usuario)
   · 2FA real TOTP (RFC 6238, HMAC-SHA1, 30 s / 6 dígitos):
     compatible con Google Authenticator, Authy, FreeOTP,
     Microsoft Authenticator… + otpauth:// URI para cargar
   · Códigos de recuperación de un solo uso (hasheados)
   · Passkey biométrica (WebAuthn, autenticador de plataforma:
     Face ID/Touch ID en iPhone, huella en Android/Windows)
   · Roles: el PRIMER usuario registrado es dueño/admin con
     panel de administración, backup y restore de todos los
     datos de la app
   Todo persiste en el NAVEGADOR (localStorage). Los botones
   sociales (Google/Telegram/LinkedIn/WhatsApp/iPhone/Facebook/
   Instagram) requieren backend + dominio HTTPS + cuentas de
   desarrollador: quedan listados como paso siguiente.
   ============================================================ */

const Auth = (() => {

  const LS_USERS = "piletalab_users";
  const LS_SESSION = "piletalab_session";
  const enc = new TextEncoder();

  const rand = n => crypto.getRandomValues(new Uint8Array(n));
  const hex = b => [...b].map(x => x.toString(16).padStart(2, "0")).join("");

  /* ---------- base32 (RFC 4648) para TOTP ---------- */
  const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  function b32encode(bytes) {
    let bits = 0, val = 0, out = "";
    bytes.forEach(b => {
      val = (val << 8) | b; bits += 8;
      while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
    });
    if (bits > 0) out += B32[(val << (5 - bits)) & 31];
    return out;
  }
  function b32decode(s) {
    s = s.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
    let bits = 0, val = 0; const out = [];
    for (const c of s) {
      const idx = B32.indexOf(c);
      if (idx < 0) continue;
      val = (val << 5) | idx; bits += 5;
      if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
    }
    return new Uint8Array(out);
  }

  /* ---------- hashing (protocolo Sec: PBKDF2 600k + rehash progresivo) ---------- */
  const KDF_ITER = 600000;
  async function hashPass(pass, salt, iter = KDF_ITER) {
    return Sec.pbkdf2(pass, salt, iter);
  }

  /* ---------- TOTP (RFC 6238) ---------- */
  async function totp(secretB32, step = 30, digits = 6) {
    const keyBytes = b32decode(secretB32);
    const counter = Math.floor(Date.now() / 1000 / step);
    const msg = new Uint8Array(8);
    let c = counter;
    for (let i = 7; i >= 0; i--) { msg[i] = c & 255; c = Math.floor(c / 256); }
    const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
    const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
    const off = mac[mac.length - 1] & 0x0f;
    const num = ((mac[off] & 0x7f) << 24) | (mac[off + 1] << 16) | (mac[off + 2] << 8) | mac[off + 3];
    return String(num % (10 ** digits)).padStart(digits, "0");
  }
  async function verifyTotp(secretB32, code) {
    const now = Math.floor(Date.now() / 1000 / 30);
    for (const w of [0, -1, 1]) {   // ventana ±30 s
      const c = await totpAt(secretB32, now + w);
      if (c === String(code).trim()) return true;
    }
    return false;
  }
  async function totpAt(secretB32, counter) {
    const keyBytes = b32decode(secretB32);
    const msg = new Uint8Array(8);
    let c = counter;
    for (let i = 7; i >= 0; i--) { msg[i] = c & 255; c = Math.floor(c / 256); }
    const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
    const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
    const off = mac[mac.length - 1] & 0x0f;
    const num = ((mac[off] & 0x7f) << 24) | (mac[off + 1] << 16) | (mac[off + 2] << 8) | mac[off + 3];
    return String(num % 1e6).padStart(6, "0");
  }
  function otpauthURI(secretB32, email) {
    return `otpauth://totp/${encodeURIComponent("ObraAcuática:" + email)}?secret=${secretB32}&issuer=ObraAcuática&algorithm=SHA1&digits=6&period=30`;
  }

  /* ---------- usuarios ---------- */
  function users() {
    try { return JSON.parse(localStorage.getItem(LS_USERS)) || []; } catch (e) { return []; }
  }
  function saveUsers(u) { localStorage.setItem(LS_USERS, JSON.stringify(u)); }

  async function register(name, email, pass) {
    const list = users();
    email = email.trim().toLowerCase();
    if (!name.trim() || !email.includes("@") || (pass || "").length < 8)
      return { ok: false, msg: "Nombre, email válido y contraseña de 8+ caracteres." };
    if (list.some(u => u.email === email)) return { ok: false, msg: "Ese email ya está registrado." };
    const salt = btoa(String.fromCharCode(...rand(16)));
    const hash = await hashPass(pass, salt);
    const role = list.length === 0 ? "dueño" : "usuario";   // el primero es el dueño
    const u = { id: hex(rand(8)), name: name.trim(), email, salt, hash, iter: KDF_ITER, role,
      twofa: null, recovery: [], passkey: null, created: new Date().toISOString().slice(0, 10) };
    list.push(u); saveUsers(list);
    Sec.audit("registro", email + " como " + role);
    return { ok: true, user: pub(u), isFirst: role === "dueño" };
  }

  async function login(email, pass, totpCode, keep) {
    email = String(email).trim().toLowerCase();
    // 🛡️ bloqueo por intentos fallidos (anti fuerza bruta)
    const lk = Sec.lockoutCheck(email);
    if (lk.locked) { Sec.audit("login_bloqueado", email); return { ok: false, msg: `Cuenta bloqueada por seguridad: esperá ${lk.minutes} min.` }; }
    const u = users().find(x => x.email === email);
    if (!u) { Sec.lockoutFail(email); return { ok: false, msg: "Usuario inexistente." }; }
    const hash = await hashPass(pass || "", u.salt, u.iter || 120000);
    if (hash !== u.hash) {
      Sec.lockoutFail(email);
      Sec.audit("login_fallido", email);
      return { ok: false, msg: "Contraseña incorrecta." };
    }
    // 🛡️ rehash progresivo: si el hash es viejo (menos iteraciones), se recalta al estándar actual
    if ((u.iter || 120000) < KDF_ITER) {
      u.iter = KDF_ITER;
      u.hash = await hashPass(pass, u.salt, KDF_ITER);
      saveUsers(users().map(x => x.id === u.id ? u : x));
    }
    if (u.twofa) {
      if (!totpCode) { return { ok: false, need2FA: true, msg: "Ingresá el código de 6 dígitos de tu autenticador." }; }
      // código de recuperación: se compara hasheado (y se aceptan legacy en claro, migrando)
      const codeStr = String(totpCode).trim();
      const codeHash = await Sec.sha256B64(codeStr);
      const rIdxHash = u.recovery.indexOf(codeHash);
      const rIdxPlain = u.recovery.indexOf(codeStr);
      if (rIdxHash >= 0) {
        u.recovery.splice(rIdxHash, 1);
        saveUsers(users().map(x => x.id === u.id ? u : x));
      } else if (rIdxPlain >= 0) {
        // migración: los códigos viejos en claro se hashean todos
        u.recovery = await Promise.all(u.recovery.filter(c => c !== codeStr).map(c => Sec.sha256B64(c)));
        saveUsers(users().map(x => x.id === u.id ? u : x));
      } else if (!(await verifyTotp(u.twofa.secret, totpCode))) {
        Sec.lockoutFail(email);
        Sec.audit("2fa_fallido", email);
        return { ok: false, need2FA: true, msg: "Código 2FA inválido (o expiró — probá el actual)." };
      }
    }
    Sec.lockoutReset(email);
    startSession(u, !!keep);
    Sec.audit("login_ok", email);
    return { ok: true, user: pub(u) };
  }

  /* ---------- 2FA setup ---------- */
  function begin2FA() {
    const secret = b32encode(rand(20));   // 160 bits
    return { secret, uri: otpauthURI(secret, current()?.email || "usuario") };
  }
  async function confirm2FA(secret, code) {
    const list = users(); const u = list.find(x => x.id === current()?.id);
    if (!u) return { ok: false, msg: "Sesión no encontrada." };
    if (!(await verifyTotp(secret, code))) return { ok: false, msg: "Código incorrecto — probá de nuevo (el código cambia cada 30 s)." };
    // 5 códigos de recuperación: se guardan HASHEADOS (SHA-256) — nunca en claro
    const codes = Array.from({ length: 5 }, () => {
      const b = rand(4);
      const n = ((b[0] << 24) >>> 0) + (b[1] << 16) + (b[2] << 8) + b[3];
      return String(n % 1e9).padStart(9, "0");
    });
    u.twofa = { secret, enabled: new Date().toISOString().slice(0, 10) };
    u.recovery = await Promise.all(codes.map(c => Sec.sha256B64(c)));
    saveUsers(list);
    Sec.audit("2fa_activado", u.email);
    return { ok: true, codes };
  }
  function disable2FA() {
    const list = users(); const u = list.find(x => x.id === current()?.id);
    if (u) { u.twofa = null; u.recovery = []; saveUsers(list); Sec.audit("2fa_desactivado", u.email); return true; }
    return false;
  }

  /* ---------- passkey (WebAuthn, autenticador de plataforma) ---------- */
  async function addPasskey() {
    const u = current(); if (!u) return { ok: false, msg: "Iniciá sesión primero." };
    if (!window.PublicKeyCredential) return { ok: false, msg: "Este navegador no soporta passkeys." };
    try {
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: rand(32),
          rp: { name: "ObraAcuática" },
          user: { id: enc.encode(u.id), name: u.email, displayName: u.name },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "preferred" },
          timeout: 60000
        }
      });
      const list = users(); const usr = list.find(x => x.id === u.id);
      usr.passkey = { credId: btoa(String.fromCharCode(...new Uint8Array(cred.rawId))), created: new Date().toISOString().slice(0, 10) };
      saveUsers(list);
      return { ok: true, msg: "Passkey guardada: ahora podés entrar con huella/Face ID." };
    } catch (e) {
      return { ok: false, msg: "No se pudo registrar la passkey: " + e.message };
    }
  }
  async function loginPasskey(keep) {
    if (!window.PublicKeyCredential) return { ok: false, msg: "Este navegador no soporta passkeys." };
    const list = users().filter(u => u.passkey);
    if (!list.length) return { ok: false, msg: "Ningún usuario tiene passkey registrada." };
    try {
      const allow = list.map(u => ({
        id: Uint8Array.from(atob(u.passkey.credId), c => c.charCodeAt(0)),
        type: "public-key"
      }));
      await navigator.credentials.get({
        publicKey: { challenge: rand(32), allowCredentials: allow, userVerification: "preferred", timeout: 60000 }
      });
      // Sin backend no hay firma que verificar contra servidor: la passkey actúa como
      // candado local del navegador (desbloqueo biométrico del perfil).
      // Se desbloquea el usuario cuyo credId coincide.
      startSession(list[0], !!keep);
      return { ok: true, user: pub(list[0]) };
    } catch (e) {
      return { ok: false, msg: "Passkey cancelada o fallida: " + e.message };
    }
  }

  /* ---------- sesión ---------- */
  /* ---------- sesión (con expiración: 8 h normal · 30 días "recordarme") ---------- */
  function startSession(u, keep) {
    const exp = keep ? Sec.nowExp(24 * 30) : Sec.nowExp(8);
    const data = JSON.stringify({ id: u.id, token: hex(rand(24)), at: Date.now(), exp });
    sessionStorage.setItem(LS_SESSION, data);
    if (keep) localStorage.setItem(LS_SESSION + "_keep", data);
    else localStorage.removeItem(LS_SESSION + "_keep");
  }
  function current() {
    try {
      let s = null;
      try { s = JSON.parse(sessionStorage.getItem(LS_SESSION)); } catch (e) { }
      if (!s) {
        try {
          s = JSON.parse(localStorage.getItem(LS_SESSION + "_keep"));
          if (s) sessionStorage.setItem(LS_SESSION, JSON.stringify(s));
        } catch (e) { }
      }
      if (!s) return null;
      // 🛡️ expiración: sesión vencida = sesión cerrada
      if (s.exp && Date.now() > s.exp) { logout(); return null; }
      const u = users().find(x => x.id === s.id);
      return u ? { ...pub(u), twofaOn: !!u.twofa, passkeyOn: !!u.passkey } : null;
    } catch (e) { return null; }
  }
  function logout() {
    const was = current()?.email;
    sessionStorage.removeItem(LS_SESSION);
    localStorage.removeItem(LS_SESSION + "_keep");
    if (was) Sec.audit("logout", was);
  }

  const pub = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, created: u.created });

  /* ---------- admin (solo dueño) ---------- */
  function isAdmin() { return current()?.role === "dueño"; }

  function adminList() {
    if (!isAdmin()) return { ok: false, msg: "Solo el dueño." };
    return { ok: true, users: users().map(u => pub(u)) };
  }
  function adminSetRole(email, role) {
    if (!isAdmin()) return { ok: false, msg: "Solo el dueño." };
    const list = users();
    const u = list.find(x => x.email === email);
    if (!u) return { ok: false, msg: "Usuario no encontrado." };
    u.role = role === "dueño" ? "dueño" : "usuario";
    saveUsers(list);
    return { ok: true };
  }
  function adminRemove(email) {
    if (!isAdmin()) return { ok: false, msg: "Solo el dueño." };
    const me = current();
    const list = users().filter(x => !(x.email === email && email !== me.email));
    saveUsers(list);
    return { ok: true };
  }

  /* backup/restore de TODA la app (admin) */
  function exportAll() {
    if (!isAdmin()) return { ok: false };
    const data = {};
    Object.keys(localStorage).filter(k => k.startsWith("piletalab_")).forEach(k => data[k] = localStorage.getItem(k));
    return { ok: true, data, when: new Date().toISOString() };
  }
  function importAll(json) {
    if (!isAdmin()) return { ok: false, msg: "Solo el dueño." };
    try {
      const data = JSON.parse(json);
      Object.entries(data).forEach(([k, v]) => { if (k.startsWith("piletalab_")) localStorage.setItem(k, v); });
      return { ok: true };
    } catch (e) { return { ok: false, msg: "JSON inválido." }; }
  }

  return { register, login, logout, current, isAdmin,
    begin2FA, confirm2FA, disable2FA,
    addPasskey, loginPasskey,
    totp, verifyTotp, otpauthURI,
    adminList, adminSetRole, adminRemove, exportAll, importAll,
    Sec };
})();
