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
