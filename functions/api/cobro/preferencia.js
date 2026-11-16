// /api/cobro/preferencia — crea preferencia de checkout de Mercado Pago.
// INACTIVO POR DISEÑO (regla 13): sin MP_ACCESS_TOKEN en env responde 503
// SIMULADO_INACTIVO; el front degrada a checkout SIMULADO (cobro.js) sin romperse.
export const onRequestPost = async ({ request, env }) => {
  const headers = { "content-type": "application/json; charset=utf-8" };
  const token = env.MP_ACCESS_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ ok: false, modo: "SIMULADO_INACTIVO",
      notas: "sin MP_ACCESS_TOKEN en env: proveedor inactivo por diseño (no roto)" }), { status: 503, headers });
  }
  let body = {};
  try { body = await request.json(); } catch (e) { /* body vacío */ }
  const plan = String(body.plan || "pro").slice(0, 20);
  // P0 TOTE r3: UNA sola fuente de verdad de precio y moneda (regla 18) — la
  // MISMA que valida el webhook (env.MP_PRECIO_* / env.MP_MONEDA). El precio
  // un precio fijado en el codigo creaba links baratos con el encendido ARS y el
  // webhook los rechazaba por monto insuficiente: circuito que no entrega.
  // FAIL-CLOSED: sin envs de precio/moneda la preferencia no se crea.
  const PLANS_OK = ["pro", "white"];
  if (!PLANS_OK.includes(plan)) {
    return new Response(JSON.stringify({ ok: false, error: "plan no válido" }), { status: 400, headers });
  }
  const precios = { pro: Number(env.MP_PRECIO_PRO), white: Number(env.MP_PRECIO_WHITE) };
  const precio = precios[plan];
  if (!precio || precio <= 0) {
    return new Response(JSON.stringify({ ok: false, modo: "SIMULADO_INACTIVO",
      notas: "falta MP_PRECIO_" + plan.toUpperCase() + " en env: preferencia NO creada (fail-closed, misma fuente que el webhook)" }), { status: 503, headers });
  }
  if (!env.MP_MONEDA) {
    return new Response(JSON.stringify({ ok: false, modo: "SIMULADO_INACTIVO",
      notas: "falta MP_MONEDA en env: preferencia NO creada (fail-closed, sin fallback USD)" }), { status: 503, headers });
  }
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ title: "ObraAcuática Plan " + plan.toUpperCase(), quantity: 1,
        unit_price: precio, currency_id: env.MP_MONEDA }],
      external_reference: "obracuatica-" + plan + "-" + Date.now(),
      notification_url: new URL(request.url).origin + "/api/cobro/webhook"
    })
  });
  const pref = await r.json();
  if (!r.ok) return new Response(JSON.stringify({ ok: false, error: "MP rechazó la preferencia" }), { status: 502, headers });
  return new Response(JSON.stringify({ ok: true, checkout: pref.init_point }), { status: 200, headers });
};
