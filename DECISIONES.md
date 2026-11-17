# DECISIONES — obracuatica-web

## PASE DE MADUREZ 15/11/2026 | 25.0/40 → 38.5/40 mecánico | brecha P0 cerrada

**Auditoría 12 áreas (antes → después):**

| # | Área | Antes | Después | Evidencia |
|---|---|---|---|~|
| 1 | CORAZÓN | 4/15 | 12/15 | E0 punta a punta navegador real (15,84 m³ + cobro SIMULADO); falta repetir en deploy productivo |
| 2 | SEGURIDAD | 6/12 | 10/12 | smoke-seguridad verde; CSP alineada; sin secretos; JWT-pattern check agregado; unsafe-inline restante (P2: estática con onclick inline) |
| 3 | PRODUCTO | 3/10 | 8/10 | ctaPro/WhatsApp cableados; gestión de plan visible; P1-P10 del núcleo recorrido en vivo |
| 4 | COBRO | 2/10 | 7/10 | PLANS + suscripción + upgrade + flag + webhook firmado; E7 SIMULADO punta a punta; real pendiente credencial (bandeja) |
| 5 | UI/UX | 3/10 | 9/10 | 8 diálogos nativos → propios con 3 salidas probadas; focus-visible; tabular-nums; smoke-ui verde |
| 6 | ASSETS | 4/8 | 8/8 | og-image 1200×630 generada (arte propio, verificada por lectura); set íconos completo; CREDITS |
| 7 | IDENTIDAD | 5/8 | 5/8 | clave+TOTP+passkeys client-side completos; federados requieren backend (roadmap honesto — P1 con fase SaaS) |
| 8 | INSTRUMENTACIÓN | 0/6 | 4/6 | medir.js registro/aha/pago inactivo por diseño; PostHog capture directo sin SDK; replay/analytics avanzado P1 |
| 9 | COHERENCIA | 2/6 | 5/6 | nombre unificado ObraAcuática (README/DEPLOY/SECURITY); SW v4.1 bump; landing=CONFIG; CORAZON ya no truncado |
| 10 | A11Y+I18N | 2/5 | 3/5 | focus-visible/reduced-motion/aria-live/zoom; i18n PT pendiente (P2, nicho NEA) |
| 11 | ENTRELAZAMIENTO | 0/5 | 3/5 | N1 cumplido (footer + ?ref=red); VECINAS declaradas en README; N2 requiere identidad compartida (P2) |
| 12 | LEGAL/OPERACIÓN | 3/5 | 4/5 | términos+privacidad in-app; SECURITY.md; backup AES-GCM; releases por versión SW; backup rotativo = P1 |
| | **TOTAL /100** | **34** | **78** | smokes verdes + E0 con dato vivo |

**Brecha P0 cerrada en la sesión:** smokes inexistentes → verdes; 8 diálogos
nativos → propios; ctaPro href=# → circuito de cobro; WhatsApp placeholder →
CONFIG-cableado; sin og:image → og-image real; sin instrumentación → inactiva
por diseño; sin red Apicus → N1; CORAZON borrador truncado → probado.

**Gates de cierre (corridos en la sesión):** `node tests/smoke-seguridad.js` ·
`node tests/smoke-ui.js` · `node tests/e2e-corazon.mjs` (check repetible del
corazón: dato vivo 6,5×3,5 → presupuesto con matemática exacta + falla validada
+ cobro honesto — 16/16 verde) · E0 en navegador real con 3 salidas probadas.

**P1 (próxima ola):** eliminar unsafe-inline (mover onclick a listeners) ·
backend real para activación server-side del plan · PT básico · replay PostHog ·
backup rotativo con restauración ensayada · federados con backend.
**P2:** entrelazamiento N2 con turno-blindado · i18n completo · premium/copy ·
splash screens iOS por tamaño.

### Línea KAIZEN (TOTE de la ola)
El pase rompió 3 veces por generación de código largo corrompido (diálogos,
cobro, smokes): la operación que apuntó exactamente al check fue **partir el
trabajo en piezas cortas con check de sintaxis después de cada pieza** (node
--check por archivo y por pieza) — la primera pieza corta salió verde al primer
intento y el gate quedó verde. Lección al estándar de la casa: cuando un
artefacto largo sale dañado dos veces, la mínima que mueve la aguja no es
reescribirlo entero: es cortarlo y verificar por pieza.

### Test del orgullo
**La firmo.** Con esta app se puede vender una pileta hoy: configurás 6×3,2,
tenés el volumen (15,84 m³), el caudal, el presupuesto con IVA (18 rubros,
$9.468.500) y el plan Pro SIMULADO completo con sus 3 salidas y su gate real.
Lo que NO firmo todavía: el cobro real (necesita el link de MP del dueño) y el
deploy productivo — por eso VENDIBLE-CANDIDATO, no LISTA-PARA-VENDER.

## TOTE r1 (15/11/2026) — el pase se auto-corrigió: 3 P0 que yo mismo dejé

TEST: crítica posterior encontró 3 P0 en lo que el pase había declarado verde.
INTERVENCIÓN (una, apuntada a los 3): (1) ui.js loadProject selector .type-card
→ .ts-card (el tipo guardado NO se restauraba y el presupuesto salía del sistema
equivocado en silencio); (2) "Ya pagué" dejaba de activar client-side (reclamo
anotado) y la activación real quedó en canje validado server-side
(functions/api/cobro/canjear.js: HMAC + TTL 30d; el webhook firmado ahora EMITE
el código en su log — el encendido ya es credencial + flag, sin refactor);
(3) marca de agua y white-label REALES: planos.js marcaPlano()/tinte() +
obra.js pieMarca() — gratis con marca, Pro sin, white con marca y color del
cliente (verificado en vivo: 5 apariciones del color en el plano).
RE-TEST: gates EXIT=0 (smoke-seguridad 105+ checks, smoke-ui, e2e-corazón) +
pruebas en navegador (vidrio restaurado, Ya-pagué no activa, 3 estados de marca).

### Línea KAIZEN r1
El constructor del pase no puede ser quien declara "verde" sin la crítica
(regla 14): mis propios smokes no veían un selector contra un clase que no
existe, una activación client-side y features vendidas sin implementar — los
checks verificaban presencia de archivos y patrones, no PROMESAS de la UI.
Lección convertida en gates: (a) todo texto vendido de la tabla de planes debe
tener su check de implementación (marca condicional existe); (b) toda ruta de
activación debe demostrar que NO activa sin server (check negativo); (c) el
selector de restauración se prueba guardar→recargar→cargar, no con regex.

## TOTE r2 (15/11/2026) — el eslabón que r1 construyó se rompía con el encendido
TEST: el webhook deducía el plan por umbral de monto sin moneda (`>= 400 → white`):
con el link MP argentino (ARS), TODO pagador de Pro (~15.000 ARS) recibiría
código white (365 días) y ninguno pro — el encendido real entregaba el plan
equivocado a todos. INTERVENCIÓN: plan EXPLÍCITO desde external_reference
(preferencia.js ya lo firmaba) + emisión FAIL-CLOSED (sin plan válido / sin
MP_PRECIO_* / moneda ≠ MP_MONEDA / monto < precio → evento en el log, cero
código). RE-TEST: 6 casos simulados en Node EXIT=0 + checks tote-r2 permanentes
EXIT=0. KAIZEN r2: en dinero, toda DEDUCCIÓN es una bomba de encendido — el
plan se transporta, nunca se adivina; y todo umbral sin moneda/precio declarado
es fail-closed o no se enciende.

## TOTE r3 (16/11/2026) — el repo en rojo y la segunda fuente de precio
TEST: (A) el push del proceso paralelo (6f63a36: SW v4.3) dejó index/data en v4.2
→ los gates declarados "verde" estaban ROJOS en el HEAD entregado (nadie lo
volvió a correr tras el push); (B) preferencia.js hardcodeaba precio y fallback
USD: con el encendido ARS de la bandeja creaba links de 15 ARS que el webhook
rechazaba — circuito documentado que no entrega nada. INTERVENCIÓN: bump
?v=4.3 (index+data) + preferencia con la MISMA fuente que el webhook
(MP_PRECIO_*/MP_MONEDA, fail-closed 503, whitelist de plan sin default). 
RE-TEST: 4 gates EXIT=0 (redirect + $? real) + 7/7 casos de simulación
(preferencia 15500 ARS → webhook emite pro). KAIZEN r3: (1) después de cada
push, el HEAD NUEVO se re-gatea — nadie hereda un "verde" de otro commit;
(2) en dinero, precio y moneda tienen UNA fuente (env) y toda ausencia es
fail-closed — un default cómodo (USD, 15) es una bomba con fecha.

## OLA P1 (17/11/2026) — la ola post-pase: 38,5/40 mecánico → 40/40 con TODO verde

**Qué ejecutó (P1 del pase + estándares, sin credenciales):**
1. **ASSETS §7 restantes:** splash iOS 750/1170/1290/2048 (generadas con
   `tools/gen-splash.js`, Node puro: SDF + encoder PNG propio — certificadas
   visualmente por agente con visión; la A salió tenue al primer intento →
   reescrita con cápsulas) · escenas hero animadas por rol (cliente/pro/proveedor,
   keyframes propios, apagadas por reduced-motion) · vacío ilustrado de proyectos
   (antes la card se OCULTABA: vacío invisible) · momento firma: en Resultados el
   corte de la pileta SE LLENA con el volumen recién calculado (aria-label con
   dato vivo: "30,6 metros cúbicos").
2. **LEGAL servible:** terminos.html + privacidad.html como páginas propias
   (estáticas puras, cero scripts) + links en tab Planes y footer + SW shell.
3. **A11Y del GATE-ACCESIBILIDAD:** A2 aria-label en icon-buttons (3 topbar +
   prov-close generados) · A5 contraste MEDIDO programáticamente en el smoke-ui
   (6 pares WCAG ≥ 4,5:1) · prueba 375px en navegador REAL (viewport 375×667:
   overflow-x 0, tabs legibles, CTAs apilados; visión certificó "profesional";
   mejora táctil aplicada: tabs min-height 40px) · modales .prov-modal ahora
   también cierran con Escape (A7 completo).
4. **P1 del pase — eliminar unsafe-inline de script-src:** 13 handlers inline
   removidos (3 topbar + 7 templates + 1 onerror + 2 oninput) → listeners y
   delegación global; CSP meta y _headers quedan `script-src 'self'` LIMPIO.
5. **INSTRUMENTACIÓN:** PostHog session replay cableado e inactivo por diseño
   (flag `posthogReplay` + key) — y fix grave: **Sentry/Turnstile jamás se
   inicializaban** (existían pero nadie los llamaba): auto-arranque agregado.
6. **OPERACIÓN:** backup rotativo local FIFO-3 (cada backup exportado deja copia
   cifrada restaurable sin archivo) + `tests/e2e-backup.mjs`: restauración
   ENSAYADA con el código real (19 checks: export→cifrar→rotar→perder→restaurar,
   passphrase mala = fail-closed, pérdida total recuperada por re-registro).
7. **PRODUCTO regla 16:** ESPECIFICACION-APP.md con la ficha del competidor
   hipotético (C1-C10: dónde nos destroza, dónde el competidor gana y no es
   primera compra) + plan de foso (4/5 materiales encendidos) + vecinas.
8. **VERSIONADO:** CHANGELOG.md (histórico v4.1→v4.4) + `window.APP_VERSION`
   como fuente única (medir.js decía "4.1" con la app en 4.3 — incoherencia
   regla 18 cazada) + tag git v4.4.0.

**Bugs hallados y cerrados en la ola (nadie los veía):**
- "➕ Agregar proveedor local" llamaba `Proveedores.add` NO expuesto → botón
  muerto en producción. Fix + check permanente.
- Los labels de los sliders del asistente cliente vivían SOLO en oninput inline.
- Sentry/Turnstile sin disparador (arriba).

**i18n PT del nicho NEA: NO ejecutado** — el criterio del catálogo es "solo si
la app ya tiene i18n" y esta app no lo tiene (declarado P2 desde el pase).

**Gates de cierre (corridos en la sesión, todos EXIT=0):**
smoke-seguridad (133 ok) · smoke-ui (68 ok) · smoke-contenido (66 ok/0 fail) ·
e2e-corazon (16/16) · e2e-backup (19/19, NUEVO) + E0 vivo re-corrido en
navegador real con CSP estricta (CTA→config, momento firma, vacío ilustrado,
slider cliente rol cliente, Health abre y Escape cierra).

### Línea KAIZEN (TOTE de la ola)
TEST: el primer splash generado salió con la A del monograma casi invisible
(certificación visual por agente). INTERVENCIÓN: reescribir la A con CÁPSULAS
(segmento+radio: trazo parejo por construcción) en vez de máscara SDF anidada.
RE-TEST: visión certificó "trazo tan visible como el del anillo". Lección: con
arte generativo, las formas compuestas por primitivas PAREJAS (cápsula, anillo)
superan a las máscaras anidadas — y la certificación visual es la que manda,
no el código que "debería" salir bien. Además: el grep inicial de handlers
inline no incluía `oninput=` — el CHECK NUEVO del smoke cazó 2 más; el gate
mejoró al ojo del constructor (regla: el check escrito supera al grep manual).

### Test del orgullo
**La firmo.** Esta ola convirtió detalles en oficio: la pileta que se llena con
TU volumen es el instante que un piletero le muestra al cliente en el celular;
el splash y las escenas por rol hacen que la app parezca lo que es (una
herramienta de estudio, no una plantilla); el backup rotativo con restauración
ensayada es la diferencia entre "tiene backup" y "SE PUEDE recuperar"; y la CSP
sin unsafe-inline es el perímetro que el pase dejó como P2 y hoy está cerrado.
Lo que NO firmo: el cobro real (sigue esperando el link de MP del dueño) y el
deploy productivo — VENDIBLE-CANDIDATO mantiene su condición exacta.
