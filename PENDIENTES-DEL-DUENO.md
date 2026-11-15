# PENDIENTES-DEL-DUENO — obracuatica-web

> Bandeja única del dueño (regla 15). Cada línea cita CUENTAS-CREDENCIALES-DUENO.md
> (05-APPS-TECH/CUENTAS-CREDENCIALES-DUENO.md). Nada de esto bloquea la obra:
> todo corre hoy en modo degradado/simulado por diseño.

| # | Qué | Por qué | Dónde va |
|---|---|---|---|
| 1 | **Link real de Mercado Pago** (link de pago Pro USD 15/mes) + poner `pagos_activos: true` en `data.js` | sin link real el checkout corre SIMULADO (avisado en el diálogo; no se cobra nada) — la activación real requiere dueño | `05-APPS-TECH/CUENTAS-CREDENCIALES-DUENO.md` → clave "Mercado Pago" |
| 2 | **Secrets de MP en el deploy** (Pages): `MP_ACCESS_TOKEN` + `MP_WEBHOOK_SECRET` | sin ellos el webhook `/api/cobro/webhook` responde 503 SIMULADO_INACTIVO (inactivo por diseño, no roto) | `CUENTAS-CREDENCIALES-DUENO.md` + settings del deploy en Cloudflare |
| 3 | **WhatsApp real** en `CONFIG.whatsapp` (hoy placeholder 5493790000000) | todos los CTAs comerciales caen en ese número | `CUENTAS-CREDENCIALES-DUENO.md` → WhatsApp del negocio |
| 4 | **Credenciales PostHog + Sentry + Turnstile** en `CONFIG.analytics` (data.js) | sin credencial = circuito inactivo por diseño (cero red); con credenciales se enciende sin refactor | `CUENTAS-CREDENCIALES-DUENO.md` |
| 5 | **Dominio + deploy productivo** (obracuatica.pages.dev o propio) | la E0 se probó en local; repetir el recorrido en producción al deployar (DEPLOY.md checklist) | DEPLOY.md |
| 6 | Fotos propias de obras reales para reemplazar `img/` (CC actuales con créditos) | la foto self-hosted tratada con marca es el estándar §7.2 | opcional |
