// /api/cobro/webhook — webhook firmado de Mercado Pago (regla 21 + estándar nivel 2).
// El plan se activa SOLO acá (server-side), jamás por una ruta confirmable desde el front.
// INACTIVO POR DISEÑO (regla 13): sin MP_ACCESS_TOKEN + MP_WEBHOOK_SECRET en env
// responde 503 SIMULADO_INACTIVO y no toca nada.
// Validación doble (la que exige la casa para "webhook firmado"):
//   1. firma HMAC x-signature de MP (MP_WEBHOOK_SECRET) en tiempo constante
//   2. re-fetch del pago a la API de MP con el access token (jamás confiar en el body)
export const onRequestPost = async ({ request, env }) => {
  const headers = { "content-type": "application/json; charset=utf-8" };
  const MP_TOKEN = env.MP_ACCESS_TOKEN;
  const MP_SECRET = env.MP_WEBHOOK_SECRET;
  if (!MP_TOKEN || !MP_SECRET) {
    return new Response(JSON.stringify({ ok: false, modo: "SIMULADO_INACTIVO",
      notas: "sin credenciales de MP en env: proveedor inactivo por diseño (no roto)" }), { status: 503, headers });
  }

  const url = new URL(request.url);
  const topic = url.searchParams.get("topic") || "payment";
  const dataId = url.searchParams.get("data.id") || url.searchParams.get("id");
  if (!dataId) return new Response(JSON.stringify({ ok: false, error: "sin data.id" }), { status: 400, headers });

  // 1) firma HMAC (x-signature): MP firma "id:<ts>:<secret>" ... formato oficial:
  //    HMAC SHA256 de "id:{dataId}:{ts}" con el secret del webhook, en x-signature
  const sig = request.headers.get("x-signature") || "";
  const ts = (sig.match(/t=([0-9]+)/) || [])[1] || url.searchParams.get("ts") || "";
  const csp = crypto.subtle ? await hmacSha256Hex(MP_SECRET, "id:" + dataId + ":" + ts) : "";
  const recibida = (sig.match(/v1=([a-f0-9]{64})/) || [])[1] || "";
  const firmasOk = recibida.length === 64 && tiempoConstante(csp, recibida);
  if (!firmasOk) {
    return new Response(JSON.stringify({ ok: false, error: "firma inválida" }), { status: 401, headers });
  }

  // 2) re-fetch del pago (la verdad es la API, no el body)
  const r = await fetch("https://api.mercadopago.com/v1/payments/" + dataId, {
    headers: { "Authorization": "Bearer " + MP_TOKEN }
  });
  if (!r.ok) return new Response(JSON.stringify({ ok: false, error: "pago no verificado" }), { status: 402, headers });
  const pago = await r.json();
  if (pago.status !== "approved") {
    return new Response(JSON.stringify({ ok: true, notas: "pago no acreditado: " + pago.status }), { status: 200, headers });
  }

  // 3) activación server-side: el email del pagador es la clave de unión (regla 22 N2)
  //    Este deploy estático no tiene base: el aviso va al registro de la casa
  //    (log de Pages Functions) y el dueño activa por su panel/WhatsApp.
  //    Con base (fase 2), acá va UPDATE suscripciones SET plan='pro' WHERE email = ?
  const email = (pago.payer && pago.payer.email) || "desconocido";
  console.log(JSON.stringify({ evento: "cobro_aprobado", email, monto: pago.transaction_amount, moneda: pago.currency_id, external: pago.external_reference }));
  return new Response(JSON.stringify({ ok: true, notas: "pago aprobado registrado" }), { status: 200, headers });
};

async function hmacSha256Hex(secret, texto) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const firm = await crypto.subtle.sign("HMAC", key, enc.encode(texto));
  return [...new Uint8Array(firm)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function tiempoConstante(a, b) {
  if (a.length !== b.length || !a.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
