# ESPECIFICACION-APP — ObraAcuática

> Doc maestra de producto (regla 16: método del competidor hipotético · regla 20b: plan de foso ·
> regla 22: vecinas de red). v1.0 — escrita en la ola P1 del 17/11/2026.

## 1 · Identidad

| Campo | Valor |
|---|---|
| App | **ObraAcuática** (repo `chrisman20/obracuatica-web`) |
| Promesa | El especialista de proyecto para fabricar y construir piletas: de la conversación de venta al presupuesto firmable en 2 minutos |
| Usuario (U0/silla) | Profesional/constructora de piletas del NEA que hoy presupuesta en papel y Excel |
| Usuarios secundarios | Cliente final (qué me conviene / cuánto sale) · proveedor/corralón (qué se está comprando) |
| Plataforma | PWA 100% en el navegador (estática + functions de cobro), offline, instalable |
| Modelo | Gratis (3 exports/mes) → Pro (cobra sin marca, exports ilimitados) → Constructoras white-label |
| Corazón | CORAZON.md — E0 probado punta a punta con dato vivo (15,84 m³ → presupuesto → plan) |

## 2 · EL COMPETIDOR HIPOTÉTICO (regla 16: competimos contra la app que DEBERÍA existir)

**La app que un equipo con capital escribiría si mirara nuestro nicho:**

| # | El competidor tendría… | Nosotros hoy | Brecha → acción |
|---|---|---|---|
| C1 | Presupuesto automático desde los parámetros de la pileta | ✅ 18 rubros, IVA, margen, precios por zona, math exacta (gate e2e) | — |
| C2 | Planos SVG descargables con marca condicional | ✅ 4 vistas, marca/white-label reales (tote-r1) | — |
| C3 | Hidráulica + filtración + química con estándar del rubro | ✅ recambio por uso, selección de filtro, balance de agua | — |
| C4 | Cotizaciones en USD/moneda local con vigencia | ⚠️ precios ARS con fecha de vigencia | P2: multi-moneda |
| C5 | **Catálogo de fotos REALES del propio portfolio** | ⚠️ CC certificadas + renders propios (sin mentir — gate de contenido) | bandeja: fotos propias del dueño |
| C6 | App móvil nativa con cámara en obra | ❌ PWA offline instalable (foto → Excel es de Asentado) | P2: importar foto de obra |
| C7 | CRM con seguimiento de leads | ❌ proyectos guardados + informe de cliente | P2: embudo simple |
| C8 | **Funciona SIN registro y SIN internet en la obra** | ✅ nuestro contra-golpe: cero fricción de arranque, cero señal necesaria | Argumento de venta N.º 1 |
| C9 | Privacidad bancaria de los datos del usuario | ✅ 100% en el navegador, nada sale (privacidad.html) | Argumento de venta N.º 2 |
| C10 | IA que redacta la propuesta comercial | ✅ asistente IA opcional (modo offline/online) | — |

**Lectura del competidor:** donde el competidor hipotético nos gana (C4/C5/C6/C7) NINGUNA es la
primera compra del usuario; donde nosotros lo destrozamos (C8/C9/C1) ES la decisión de compra
del primer día. El foso correcto es profundizar el día-1 (velocidad de presupuesto) y la verdad
de contenido (fotos certificadas), no perseguir el CRM.

**Huecos que SÍ son del competidor (y este release los cierra):**
- vacío de proyectos invisible → ahora vacío ilustrado con salida (P5 con arte)
- botón "Agregar proveedor local" muerto (llamaba a una función no expuesta) → reparado en esta ola
- legal solo adentro de una tab → páginas servibles terminos.html / privacidad.html

## 3 · PLAN DE FOSO (regla 20b — ≥2 materiales, con fecha de encendido)

| Material | Cómo se enciende | Estado |
|---|---|---|
| **Datos que crecen con el uso** | Cada proyecto guardado + precios ajustados por zona + directorio de proveedores locales viven y acumulan valor en el navegador del profesional | ✅ día 1 |
| **Integraciones locales profundas** | Mercado Pago (cobro AR), WhatsApp (CTA comercial), zona NEA con radios de proveedores | ✅ día 1 (MP en sandbox hasta credencial) |
| **Velocidad de iteración** | PWA sin store: deploy = push | ✅ día 1 |
| **Marca de nicho** | "El estudio de piletas del NEA" — contenido certificado + protocolos de fábrica propios | ✅ día 1 |
| Circuito de dos lados | Proveedores que publican ofertas ↔ constructores que compran | 🌱 sembrado (panel proveedor) — se enciende con tráfico |

## 4 · VECINAS DE RED (regla 22)

- `obracuatica ↔ turno-blindado` (N1 hoy): el profesional que presupuesta agenda sus
  visitas/mediciones en Turno Blindado — `?ref=red`, identidad compartida por email verificado en N2.
- `obracuatica ↔ apicuspartner.com` (N1): escaparate comercial del estudio.
- Guardia: corte de luz (cada app completa sola), la plata solo por PSP, su repo su deploy.

## 5 · Fuentes vivas

- CORAZON.md (promesa + E0) · DECISIONES.md (pases y KAIZEN) · CHANGELOG.md (versiones)
- MATRIZ-MADUREZ: ver DECISIONES.md (auditoría 12 áreas del pase 15/11/2026)
