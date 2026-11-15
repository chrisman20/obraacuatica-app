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
  const precio = plan === "white" ? 500 : 15;
  const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ title: "ObraAcuática Plan " + plan.toUpperCase(), quantity: 1,
        unit_price: precio, currency_id: env.MP_MONEDA || "USD" }],
      external_reference: "obracuatica-" + plan + "-" + Date.now(),
      notification_url: new URL(request.url).origin + "/api/cobro/webhook"
    })
  });
  const pref = await r.json();
  if (!r.ok) return new Response(JSON.stringify({ ok: false, error: "MP rechazó la preferencia" }), { status: 502, headers });
  return new Response(JSON.stringify({ ok: true, checkout: pref.init_point }), { status: 200, headers });
};
