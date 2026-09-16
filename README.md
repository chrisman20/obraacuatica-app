# PiletaLab — Estudio de Fabricación y Construcción de Piletas

App web **PWA instalable** (100% estática, sin dependencias ni build, funciona offline) que funciona como especialista de proyecto para fabricar y construir piletas — con **3 áreas por rol (Cliente · Profesional · Proveedor)**, fotografía real, landing premium, seguridad grado bancario y asistente IA de doble motor.

**Estado: v2.7 — ROBUSTA Y COMPLETA.** Incluye color de agua por revestimiento con maqueta SVG, matriz de permisos por rol con `can()`, comparador A/B, balance térmico, verificación de flotación, IA con streaming + memoria, export a Odoo, PWA completa con iconos PNG. Pendiente solo lo comercial: dominio + deploy (DEPLOY.md) + WhatsApp real en `CONFIG.whatsapp` (data.js) + fotos propias de tus obras reemplazando `img/`.

**Cómo usarla:** abrir `index.html` doble click, o servirla (`python -m http.server`). En dominio HTTPS se vuelve instalable en el celular (PWA) con las passkeys activas. Guía de publicación: `DEPLOY.md`.

## Qué resuelve

| Pestaña | Contenido |
|---|---|
| 1 · Configurá | 10 tipos de pileta: Arena/Bali · Tradicional hormigón · Prefabricada GRC de fábrica · Natural/bio · 🚢 Contenedor marítimo · 🪟 Vidrio/acrílico · 🏙️ Suspendida/rooftop · 🍸 Plunge/cocktail · 🏊 Nado contra corriente · ♨️ Spa/hidromasaje. Geometría con solarium húmedo, **4 tipos de borde** (skimmer, rebose perimetral, infinito 1 lado, infinito perimetral) + **6 copings**, **solarium seco/deck** con 5 materiales (incluye losetas atérmicas GRC propias), **9 innovaciones** seleccionables (tanning ledge, swim-up bar, cascadas, automatización, arena real…) y Detalles y confort (luces LED, escalera, bomba de calor, cobertor, ducha, robot) |
| 2 · Resultados | Superficies y volumen (misma lógica del Excel `pileta-4x8-calculo-simil-bali`), hidráulica resumida, materiales (cajas, bolsas, pastina, impermeabilizante, coping) y cálculo específico del borde infinito (weir, rebalse, estanque compensador) |
| 3 · Filtración | Comparador de 5 sistemas mecánicos (arena, vidrio, cartucho, diatomeas, biofiltro) + 6 de desinfección (cloro, sal, UV, ozono, oxígeno activo, sin química), dimensionado de equipo, skimmers/retornos/cañería y esquema de sala de máquinas |
| 4 · Química | Rangos objetivo (pH, cloro, alcalinidad, dureza, cianúrico, ORP), calculadora de correcciones por volumen real y rutinas (diaria/semanal/mensual/apertura/invernada) |
| 5 · Protocolos | Paso a paso por sistema constructivo y fase (pre-obra, estructura, impermeabilización, instalaciones, puesta en marcha, mantenimiento, invernada) con controles de calidad marcados como CN |
| 6 · Fábrica | Fórmulas propias escalables por lote — **🔒 restringidas al dueño**: sin sesión solo se ve el nombre del producto y su rendimiento (lo necesario para presupuestar); con sesión de dueño se desbloquean componentes, gramos, porcentajes y guía de moldes. Nunca se exportan en presupuestos ni informes de cliente |
| 7 · Presupuesto | Lista de materiales generada desde el cálculo, precios editables que se guardan en el navegador, ajuste + contingencia, export CSV e impresión |
| 7 · Presupuesto | Lista de materiales con **proveedores por zona** (cadenas + tu directorio local + online + búsqueda Maps/ML), **IVA diferenciado**: selector de régimen — *general (todo 21%)* u *obra adherida (materiales de la lista de construcción al 10,5%: hormigón, acero, ladrillos, caños, piedra, adhesivos cementicios…)* — con columna de IVA por rubro y desglose 10,5+21 en los totales (y en Excel/Word/MD/informe cliente). Además: precios editables, ajuste + contingencia + **margen → precio de venta**, **plan de pagos por hitos**, **modo cliente** y exportación **Excel · Word · Markdown · CSV · PDF** |
| 8 · Planos | **Planta** (vista superior con skimmers, retornos, desagüe, luces, weir, paño de vidrio, olas, cotas y rueda de escala) + **Axonométrica 3D** del conjunto + **corte transversal A-A** + **corte longitudinal B-B** (solarium, drop, pendiente, napa estimada). Sobre papel blueprint. Descargables como SVG e imprimibles. Plano orientativo — el ejecutivo lo firma ingeniería |
| 9 · Obra | **Seguimiento**: los protocolos convertidos en checklist tildable con fecha y % de avance (global y por fase) persistido por proyecto. **Planificación**: cronograma tipo Gantt con fechas reales, duraciones editables por fase y avance superpuesto. **Cliente**: informe HTML autocontenido (ilustración + planos + avance + cronograma + presupuesto + plan de pagos + firmas) para mandar por WhatsApp/mail, y resumen corto para pegar en WhatsApp |
| 🤖 Asistente IA | Agente especialista (compras · construcción · arquitectura · negocio) con **doble motor**. **Offline**: experto local que responde al instante con el conocimiento de la app + los números del proyecto actual (recomendaciones, comparativas con tabla, diagnóstico de agua verde, dimensionado de equipo, estrategia de precios y compras, cronograma, invernada, fórmulas de fábrica…). **Online (BYOK)**: conectá tu propio motor compatible OpenAI — presets para **GLM (Z.ai)**, OpenAI, DeepSeek y OpenRouter — con el contexto completo del proyecto inyectado al prompt, prueba de conexión y **fallback automático** a offline si falla. La API key se guarda solo en el navegador y viaja únicamente al endpoint elegido |
| 🔐 Cuenta | Registro y login con **contraseña hasheada PBKDF2** (120k iteraciones, salt único). **2FA real TOTP** (RFC 6238): compatible con Google Authenticator / Authy / Microsoft Authenticator / FreeOTP, con secret + URI otpauth:// y **códigos de recuperación de un solo uso**. **Passkey biométrica** (WebAuthn: Face ID / huella / Windows Hello). **Roles**: el primer usuario es **dueño/admin** con panel de usuarios, **backup total descargable** (precios, proveedores, obras, settings) y restauración. Los sociales (Google/Telegram/LinkedIn/WhatsApp/Apple/Facebook/Instagram) requieren backend + dominio HTTPS + cuentas de desarrollador: quedan listados como roadmap honesto de la versión online |

Cada tipo de pileta tiene su **ilustración arquitectónica propia** (viñeta SVG animada) y su **foto real** (CC BY, créditos en `CREDITS-FOTOS.md`): landing hero a pantalla completa con foto y zoom cinematográfico, tarjetas de tipo con fotografía y fallback automático a la ilustración. Tipografía editorial (Fraunces + Inter con fallback offline).

> Nota: los productos de la propia planta (pastinas, revestimientos, GRC, losetas atérmicas) figuran como "fabricación propia" — son insumos internos de fábrica, no una marca externa.

## Fuentes del conocimiento (documentos propios)

- `02-CONSTRUCCION-QUIMICA/pileta-4x8-calculo-simil-bali.xlsx` — lógica de superficies (solarium 3x4, muro drop, escalera, desperdicio 8%, doble encolado 4 kg/m², 2,07 m²/caja Palau)
- `D:\proyectos\170126\revestimiento cementicio interior piscinas\📘_FÓRMULAS_CORREGIDAS_REVESTIMIENTOS_INTERIORES_DE_PISCINAS.pdf` — revestimientos v2.0 (sin cal, sin sorbitol; microsílice + silicato de sodio)
- `D:\proyectos\170126\recubrimientos insumos amichen\pastina_piscina_dosificaciones.md.docx` — pastinas con estearato de zinc / Tylose + Vinavil
- `02-CONSTRUCCION-QUIMICA/moldes-propios/ESTUDIO-MOLDES-PROPIOS.md` — moldes RTV-2, GRC, matriz CNC (base de la línea prefabricada)
- `D:\proyectos\170126\pileta contruccion.zip` — fotos de obra 2023 (constructiva tradicional con hormigón)

## Arquitectura

```
piletalab/
├── index.html      → estructura y 8 pestañas
├── styles.css      → tema agua profunda (dark aqua)
├── data.js         → tipos, bordes, copings, decks, innovaciones, filtración, química, precios base
├── protocols.js    → protocolos de obra (11 sistemas) + fórmulas de fábrica + guía de moldes
├── engine.js       → motor puro (geometría, hidráulica, materiales, química, presupuesto)
├── planos.js       → generador de planos SVG (planta + axonométrica + 2 cortes, en vivo)
├── ilustraciones.js→ viñetas arquitectónicas SVG animadas por tipo de pileta
├── obra.js         → seguimiento de obra + cronograma Gantt + informe cliente + exports Excel/Word/MD
└── ui.js           → render, tabs, chips, hero, localStorage de precios, CSV, planos
```

Validado por navegador: la geometría del caso 4x8 reproduce el Excel de referencia (volumen 32,6 m³ exacto, 32 cajas de venecita, 9 bolsas de adhesivo).

## Notas técnicas

- Los precios son referenciales de septiembre 2026 (ARS): editalos en la pestaña 7 y quedan en `localStorage`.
- El cálculo estructural (hormigón/acero, paños de vidrio, estructura de rooftop) es estimativo para presupuesto: la verificación final la firma ingeniería matriculado — en vidrio, suspendida y spa la memoria de cálculo es obligatoria.
- Contenedor/plunge/endless/spa vienen con geometría predefinida al seleccionarlos (editable a mano).
- Las dosificaciones químicas son reglas de arranque del rubro: agregar, circular 30-60 min y volver a medir.
- Borde infinito: 2 m³/h por metro de weir + margen de viento 1,3; estanque compensador al 7% del volumen (rango 5-10%).
- Luces: 1 LED cada 4 m de largo + 1 transformador estanco 12V cada 3 luces; bomba de calor dimensionada por volumen (9-45 kW).

— AMICHEM / Apicus Partners · Christian Osvaldo Hillkirk Gane
