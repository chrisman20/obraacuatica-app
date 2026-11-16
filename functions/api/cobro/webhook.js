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
  // Eslabón de activación (regla 21): el webhook EMITE un código de canje
  // firmado HMAC (MP_WEBHOOK_SECRET) para el plan del pago. El dueño lo copia
  // del log de Pages Functions y se lo pasa al pagador, que lo canjea en la
  // app → /api/cobro/canjear valida la firma server-side y activa.
  // Sin DB todavía, el canal de entrega es el dueño (fase 2: email automático).
  // P0 TOTE r2: el plan JAMÁS se deduce del monto (una comparación sin moneda
  // entregaba white a todo pagador de Pro en ARS). El plan viaja EXPLÍCITO en
  // external_reference (preferencia.js: "obracuatica-<plan>-<ts>") y el código
  // solo se emite FAIL-CLOSED: moneda declarada coincide + monto >= precio
  // esperado del plan (env.MP_PRECIO_PRO / MP_PRECIO_WHITE en MP_MONEDA).
  const ref = String(pago.external_reference || "");
  const mRef = ref.match(/^obracuatica-(pro|white)-\d+$/);
  const preciosEsperados = { pro: Number(env.MP_PRECIO_PRO), white: Number(env.MP_PRECIO_WHITE) };
  const planDePago = mRef ? mRef[1] : null;
  const logEvento = (evento) => console.log(JSON.stringify({ evento, email, monto: pago.transaction_amount, moneda: pago.currency_id, external: ref }));
  if (!planDePago) {           // sin plan explícito válido: jamás se adivina
    logEvento("cobro_sin_plan_valido");
    return new Response(JSON.stringify({ ok: true, notas: "pago registrado sin plan identificable: código NO emitido (fail-closed)" }), { status: 200, headers });
  }
  if (!preciosEsperados[planDePago] || preciosEsperados[planDePago] <= 0) {
    logEvento("cobro_precio_no_declarado");
    return new Response(JSON.stringify({ ok: true, notas: "falta MP_PRECIO_" + planDePago.toUpperCase() + " en env: código NO emitido (fail-closed)" }), { status: 200, headers });
  }
  if (env.MP_MONEDA && pago.currency_id !== env.MP_MONEDA) {
    logEvento("cobro_moneda_inesperada");
    return new Response(JSON.stringify({ ok: true, notas: "moneda " + pago.currency_id + " no coincide con MP_MONEDA: código NO emitido (fail-closed)" }), { status: 200, headers });
  }
  if (!(Number(pago.transaction_amount) >= preciosEsperados[planDePago])) {
    logEvento("cobro_monto_insuficiente");
    return new Response(JSON.stringify({ ok: true, notas: "monto menor al precio esperado del plan: código NO emitido (fail-closed)" }), { status: 200, headers });
  }
  const payload = b64url(JSON.stringify({ plan: planDePago, email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 }));
  const firma = (await hmacSha256Hex(MP_SECRET, payload)).slice(0, 16);
  const codigo = payload + "." + firma;
  console.log(JSON.stringify({ evento: "cobro_aprobado", email, monto: pago.transaction_amount, moneda: pago.currency_id, external: ref, codigo_canje: codigo }));
  return new Response(JSON.stringify({ ok: true, notas: "pago aprobado registrado; código de canje en el log" }), { status: 200, headers });
};

function b64url(s) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
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
