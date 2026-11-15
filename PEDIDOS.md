# PEDIDOS — obracuatica-web

Todo pedido del dueño se anota acá EN EL MISMO TURNO (regla 19b). Estados: anotado → en curso → hecho → verificado.
"verificado" exige el nombre exacto del check que lo prueba.

| Fecha | Pedido (cita textual) | Estado | Check que lo prueba |
|---|---|---|---|
| 2026-11-08 | Crear este archivo (sanéado por gate-obra) | verificado | sanear-corazones.py ejecutado, archivo existe |
| 2026-11-15 | Ejecutá el PASE DE MADUREZ COMPLETO sobre la app obracuatica-web (12 áreas, P0 sin preguntar) | verificado | `node tests/smoke-seguridad.js` + `node tests/smoke-ui.js` verdes · E0 punta a punta en navegador real (6×3,2 → 15,84 m³; cobro SIMULADO completo; 3 salidas probadas) · commit del pase |
| 2026-11-15 | CORAZÓN: promesa real + flujo núcleo punta a punta con dato vivo | verificado | E0 en CORAZON.md: 15,84 m³ / $9.468.500 / plan Pro SIMULADO levanta el gate de cuota + `node tests/e2e-corazon.mjs` 16/16 verde (recorrido independiente 6,5×3,5) |
| 2026-11-15 | SEGURIDAD del nivel declarado: smoke-seguridad.js verde | verificado | node tests/smoke-seguridad.js → "todo verde (Nivel 1 + auth client-side + cobro regla 21)" |
| 2026-11-15 | PRODUCTO: P1-P10 flujo núcleo, cero cosas que no llevan a ningún lado | verificado | ctaPro ya no es href=# (pasa por Cobro.checkout); WhatsApp cableado desde CONFIG; gestión de plan visible (#cobroGestion) |
| 2026-11-15 | COBRO regla 21: planes/suscripciones + pricing + upgrade + flag + webhook firmado | verificado (SIMULADO punta a punta; webhook escrito, inactivo sin secrets) | checkout SIMULADO completo en navegador; functions/api/cobro/webhook.js valida x-signature + re-fetch; flag pagos_activos false por diseño |
| 2026-11-15 | INSTRUMENTACIÓN: PostHog/Sentry/Turnstile integrados, sin credenciales = inactivo | verificado (inactivo por diseño) | medir.js sin credencial = cero red (check del smoke-ui); eventos registro/aha/pago cableados |
| 2026-11-15 | UI/UX: 15 puntos + toasts/modales propios con 3 salidas + smoke-ui verde | verificado | node tests/smoke-ui.js → "diseño al estándar"; 3 salidas probadas en vivo (Escape/✕/fondo) |
| 2026-11-15 | ASSETS §7: og:image + favicon/apple-touch + CREDITS | verificado | og-image.png 1200×630 en repo (>10KB); meta og completa en index; set de íconos presente |
