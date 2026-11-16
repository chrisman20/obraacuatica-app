// /api/cobro/canjear — ÚNICA vía de activación real de planes (regla 21).
// El código lo EMITE el webhook firmado (webhook.js) tras validar el pago y lo
// valida SIEMPRE este endpoint server-side: HMAC-SHA256 con el secret del env
// (la clave jamás toca el front) + TTL 30 días + plan whitelist.
// INACTIVO POR DISEÑO (regla 13): sin MP_WEBHOOK_SECRET en env responde 503.
// Limitación declarada (fase 2 con D1 la cierra): el código es re-canjeable
// mientras no expire — la invalidación por payment_id necesita base.
export const onRequestPost = async ({ request, env }) => {
  const headers = { "content-type": "application/json; charset=utf-8" };
  const secret = env.MP_WEBHOOK_SECRET;
  if (!secret) {
    return new Response(JSON.stringify({ ok: false, modo: "SIMULADO_INACTIVO",
      notas: "sin MP_WEBHOOK_SECRET: canje inactivo por diseño (no roto)" }), { status: 503, headers });
  }
  let body = {};
  try { body = await request.json(); } catch (e) { /* body vacío */ }
  const codigo = String(body.codigo || "").slice(0, 300);
  const partes = codigo.split(".");
  if (partes.length !== 2) return new Response(JSON.stringify({ ok: false, error: "formato de código inválido" }), { status: 400, headers });
  const [payloadB64, firma] = partes;
  const esperada = await hmacHex(secret, payloadB64);
  const okFirma = firma.length === 16 && tiempoConstante(esperada.slice(0, 16), firma);
  if (!okFirma) return new Response(JSON.stringify({ ok: false, error: "código inválido" }), { status: 401, headers });
  let data;
  try {
    data = JSON.parse(b64urlDecode(payloadB64));
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "código inválido" }), { status: 400, headers });
  }
  const PLANS_OK = ["pro", "white"];
  if (!data || !PLANS_OK.includes(data.plan)) return new Response(JSON.stringify({ ok: false, error: "plan del código no válido" }), { status: 400, headers });
  const ahora = Math.floor(Date.now() / 1000);
  if (!data.exp || typeof data.exp !== "number" || data.exp < ahora) {
    return new Response(JSON.stringify({ ok: false, error: "el código está vencido" }), { status: 401, headers });
  }
  const duracionDias = data.plan === "white" ? 365 : 30;
  const expira = new Date(Date.now() + duracionDias * 86400000).toISOString();
  return new Response(JSON.stringify({ ok: true, plan: data.plan, expira }), { status: 200, headers });
};

async function hmacHex(secret, texto) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const firm = await crypto.subtle.sign("HMAC", key, enc.encode(texto));
  return [...new Uint8Array(firm)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function tiempoConstante(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
function b64urlDecode(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64 + "===".slice((b64.length + 3) % 4);
  return atob(pad);
}
