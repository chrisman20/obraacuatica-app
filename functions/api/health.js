// /api/health — health endpoint (PROTOCOLO-MONITOREO): versión, uptime, contadores.
// Cero datos sensibles. Sin dependencias.
export const onRequestGet = () => {
  const data = {
    ok: true,
    app: "obracuatica-web",
    version: "4.1.0",
    tiempo: new Date().toISOString(),
    memoria: "n/a (estático)",
    notas: "app estática + funciones de cobro; sin datos de usuarios en server"
  };
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
};
