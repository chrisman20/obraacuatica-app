# CHANGELOG — ObraAcuática

Formato: versiones del release (SW/`?v=`) con su ola. La fuente única de la versión
es `data.js` → `window.APP_VERSION` + `sw.js` CACHE + `?v=` de index (regla 18).

## v4.4.0 — OLA P1 post-pase (17/11/2026)

### Assets (estándar §7)
- **Splash screens iOS** 750/1170/1290/2048 generadas por `tools/gen-splash.js`
  (Node puro: SDF + PNG encoder — arte del agente, certificado visualmente) +
  `apple-touch-startup-image` con media queries en index.
- **Escenas hero animadas por tipo de usuario** en las role-cards (cliente: sol/agua/flotador ·
  pro: plano que se dibuja con cotas y grúa · proveedor: camioneta con ruedas y checklist) —
  CSS puro, apagadas por `prefers-reduced-motion`.
- **Vacío ilustrado** de proyectos guardados: el vacío enseña la salida (CTA al input de nombre).
- **Momento firma**: en Resultados, el corte de la pileta **se llena con el volumen recién
  calculado** (agua que sube + onda + burbujas + cifra en tabular-nums).

### Legal
- `terminos.html` y `privacidad.html` como **páginas servibles** (antes solo `<details>` en
  la tab Planes) + links en la tab y en el footer + cacheadas por el SW.

### Seguridad
- **CSP sin `unsafe-inline` en `script-src`** (meta + `_headers`): 11 handlers inline
  eliminados (3 topbar, 7 templates, 1 onerror) → listeners/delegación global.
- Fix: **"➕ Agregar proveedor local" estaba muerto** (llamaba `Proveedores.add`, no expuesto).
- Fix: **Sentry/Turnstile jamás se inicializaban** (las funciones existían pero nadie las
  llamaba) — auto-arranque en DOMContentLoaded; sin credencial = cero red.
- PostHog **session replay** cableado e inactivo por diseño (flag `posthogReplay`).

### Accesibilidad
- aria-label en botones solo-ícono (A2) · **contraste medido programáticamente** en el
  smoke-ui (A5, 6 pares ≥ 4.5:1) · **media query 375px** + prueba en navegador real.

### Operación
- **Backup rotativo local**: cada backup exportado deja copia cifrada (FIFO 3) restaurable
  sin archivo — `tests/e2e-backup.mjs` 19/19 (export→cifrar→rotar→perder→restaurar,
  fail-closed y no auto-incluido).

### Producto
- `ESPECIFICACION-APP.md`: ficha del competidor hipotético (C1-C10) + plan de foso + vecinas.

## v4.3.0 — TOTE r3 (16/11/2026)
Bump forzado por push paralelo + preferencia.js con fuente única de precio/moneda
(MP_PRECIO_*/MP_MONEDA fail-closed, sin fallback USD).

## v4.2.0 — segunda auditoría de contenido (15/11/2026)
5 fotos de hotel/landmark reemplazadas por renders de viñeta propia; vara elevada en
MANIFIESTO §regla 2; smoke-contenido 66 ok / 0 fail.

## v4.1.0 — pase de madurez + TOTE r1/r2 (15/11/2026)
Pase 34→78/100: smokes creados, 8 diálogos nativos → propios, circuito de cobro regla 21
(PLANS/suscripción/webhook firmado/canje HMAC), og-image, medir.js inactivo por diseño,
N1 red Apicus, TOTP+passkeys client-side. r1: selector .ts-card, Ya-pagué no activa,
marca condicional real. r2: plan explícito desde external_reference (fail-closed).

## ≤ v4.0 — historia previa
Ver DECISIONES.md (pase de madurez 15/11/2026 documenta el estado 34/100 de arranque).
