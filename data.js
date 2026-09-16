/* ============================================================
   ObraAcuática — data.js
   Base de conocimiento: tipos de pileta, revestimientos,
   sistemas de filtración y desinfección, química del agua,
   precios referenciales (ARS, septiembre 2026).
   ============================================================ */

const DATA_VERSION = "v5.0";

/* ------------------------------------------------------------
   CATÁLOGO DE FÁBRICA — productos propios para promocionar
   dentro de la app (publicidad rústica, estilo industrial)
   ------------------------------------------------------------ */
const FACTORY_PRODUCTS = [
  { id: "grc", icon: "🏭", name: "Paneles GRC prefabricados", desc: "Monobloques listos para montar.", price: "cotizar", tag: "FABRICACIÓN PROPIA", cta: "Cotizá" },
  { id: "pastina", icon: "🧱", name: "Pastina de pileta propia", desc: "Resiste cloro e inmersión continua.", price: "cotizar", tag: "FÓRMULA PROPIA", cta: "Consultá" },
  { id: "atermica", icon: "❄️", name: "Losetas atérmicas GRC", desc: "Caminás descalzo sin quemarte.", price: "cotizar", tag: "EXCLUSIVO", cta: "Muestras" }
];

/* descripciones simplificadas para el modo cliente de la guía */
const CLIENT_PHASE_DESC = {
  pre: "Antes de empezar: medir, decidir dónde va la pileta y preparar todo",
  struct: "La 'caja' de la pileta: el hormigón que sostiene el agua",
  water: "Hacerla hermética y ponerle el revestimiento (el color que se ve)",
  install: "Instalar la bomba, el filtro y las cañerías",
  startup: "Llenarla, ponerle los productos y dejarla cristalina"
};

/* ------------------------------------------------------------
   CONFIG del negocio — LO ÚNICO QUE CAMBIÁS ANTES DE PUBLICAR
   ------------------------------------------------------------ */
const CONFIG = {
  whatsapp: "5493790000000",   // ← CAMBIAR por el real antes del deploy
  marca: "ObraAcuática",
  marcaCorta: "OA",
  dominio: "obracuatica.com",
  mpLink: "https://link.mercadopago.com.ar/obracuatica",
  precioPro: "USD 15/mes",
  precioWhiteLabel: "USD 500/año",
  freeExportsMes: 3
};

/* ------------------------------------------------------------
   FREEMIUM — contador de exports del plan gratis
   ------------------------------------------------------------ */
const Freemium = {
  KEY: "piletalab_free_exports",
  count() {
    try {
      const d = JSON.parse(localStorage.getItem(this.KEY) || "{}");
      const now = new Date();
      const mes = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
      if (d.mes !== mes) { d.mes = mes; d.count = 0; localStorage.setItem(this.KEY, JSON.stringify(d)); }
      return d.count;
    } catch (e) { return 0; }
  },
  remaining() { return CONFIG.freeExportsMes - this.count(); },
  isPro() {
    try { return JSON.parse(localStorage.getItem("piletalab_pro") || "false"); }
    catch (e) { return false; }
  },
  setPro(v) { localStorage.setItem("piletalab_pro", JSON.stringify(v)); },
  canExport() {
    if (this.isPro()) return { ok: true, pro: true };
    if (this.remaining() > 0) return { ok: true, pro: false, remaining: this.remaining() };
    return { ok: false, pro: false, remaining: 0 };
  },
  consumeExport() {
    if (this.isPro()) return;
    const d = JSON.parse(localStorage.getItem(this.KEY) || "{}");
    const now = new Date();
    const mes = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    if (d.mes !== mes) { d.mes = mes; d.count = 0; }
    d.count++;
    localStorage.setItem(this.KEY, JSON.stringify(d));
  }
};

/* Fotos reales por tipo (CC descargadas localmente — ver CREDITS-FOTOS.md).
   ?v= para cache-busting: cada release se bump junto con SW. */
const IMG_V = "?v=4.0";
const PHOTOS = {
  hero: "img/hero.jpg" + IMG_V,
  arena: "img/arena.jpg" + IMG_V,
  tradicional: "img/tradicional.jpg" + IMG_V,
  prefabricada: "img/prefabricada.jpg" + IMG_V,
  natural: "img/natural.jpg" + IMG_V,
  contenedor: "img/contenedor.jpg" + IMG_V,
  vidrio: "img/vidrio.jpg" + IMG_V,
  suspendida: "img/suspendida.jpg" + IMG_V,
  plunge: "img/plunge.jpg" + IMG_V,
  endless: "img/endless.jpg" + IMG_V,
  spa: "img/spa.jpg" + IMG_V
};

/* ------------------------------------------------------------
   TIPOS DE PILETA (sistemas constructivos)
   Cada tipo define: descripción, plazos, costo relativo,
   estructura, revestimientos admitidos, si admite borde
   infinito y particularidades hidráulicas.
   ------------------------------------------------------------ */
const POOL_TYPES = [
  {
    id: "arena",
    icon: "🏝️",
    name: "Arena / Bali",
    desc: "Pileta de hormigón con terminación cementicia de arena, playas de ingreso suave, bordes de piedra y formas orgánicas. El look Bali que vende: agua turquesa sin venecita.",
    timeLabel: "4-6 semanas de obra",
    costRel: 1.15,
    structure: "Hormigón proyectado (gunite) u hormigón armado convencional, geometría libre.",
    finishes: ["micro", "cemento-arena", "venecita"],
    infinity: true,
    natural: false,
    turnoverH: 5,
    notes: [
      "La terminación cementicia la fabricamos nosotros (pestaña Fábrica): liso pulible con microsílice + silicato de sodio, sin cal.",
      "El color del agua lo da el fondo: verde Bali = venecita verde o pigmento en masa del revestimiento.",
      "Playa de ingreso suave (0-30 cm) con antiderrapante: granulado de cuarzo o microesferas."
    ]
  },
  {
    id: "tradicional",
    icon: "🏗️",
    name: "Tradicional hormigón",
    desc: "La constructiva clásica: excavación, platea, paredes de hormigón armado, revoque, impermeabilización y venecita. La más documentada en nuestras fotos de obra 2023.",
    timeLabel: "6-10 semanas de obra",
    costRel: 1.0,
    structure: "Platea + paredes hormigón armado in situ o mampostería de ladrillo con columnas.",
    finishes: ["venecita", "micro", "pvc"],
    infinity: true,
    natural: false,
    turnoverH: 6,
    notes: [
      "Alternativa económica: mampostería de ladrillo común + revoque rico 1:3 + impermeabilizante integral.",
      "Impermeabilización: membrana cementicia elastomérica (fabricada o comprada según costo) en 2 manos cruzadas + malla en encuentros.",
      "Junta de dilatación períimetral entre coping y vereda, sellada con pastina de poliuretano."
    ]
  },
  {
    id: "prefabricada",
    icon: "🏭",
    name: "Prefabricada GRC (de fábrica)",
    desc: "Paneles y monobloques moldeados en nuestra planta con moldes propios de silicona RTV-2 / ABS. En obra solo se montan, se juntan y se nivan. Control de calidad de fábrica.",
    timeLabel: "2-4 semanas (montaje 2-4 días)",
    costRel: 0.95,
    structure: "Paneles GRC (cemento + fibra AR) premoldeados + platea hormigón. Monobloque para piletas chicas.",
    finishes: ["grc-integrado", "micro", "venecita"],
    infinity: false,
    natural: false,
    turnoverH: 5,
    notes: [
      "El GRC sale de los MISMOS moldes del estudio de moldes propios: geometría repetible, borde antiderrapante integrado.",
      "Juntas entre paneles: sellado con malla + mortero polímero + banda elastomérica, NUNCA rigido seco.",
      "Ideal para línea de producto estandarizada: 3 formatos (3x6, 4x8, 5x10) con showroom y entrega llave en mano.",
      "Transporte: panel máximo 2,4 m de ancho por carretera sin escolta."
    ]
  },
  {
    id: "natural",
    icon: "🌿",
    name: "Natural / bio",
    desc: "Sin cloro ni químicas: el agua se depura en una zona de regeneración con gravas y plantas acuáticas. Paredes con geomembrana EPDM o arcilla. El agua cristalina la hace la biología.",
    timeLabel: "5-8 semanas de obra",
    costRel: 1.25,
    structure: "Excavación con taludes, geomembrana EPDM 1,5 mm o GCL de bentonita, zona de nado + zona de regeneración.",
    finishes: ["geo", "cemento-arena"],
    infinity: true,
    natural: true,
    turnoverH: 36,
    notes: [
      "Zona de regeneración: 30-50% de la superficie total, profundidad 0,4-0,8 m, gravas de 4-16 mm + plantas oxigenantes.",
      "Filtración biológica lenta: recambio del volumen cada 24-48 h con bomba de bajo consumo.",
      "El equilibrio tarda 4-8 semanas en madurar (ciclo del biofilm): llenar con anticipación.",
      "Prohibido: cloro, alguicidas, cobre. Algas filamentosas se controlan con extracción manual y balance de plantas."
    ]
  },
  {
    id: "contenedor",
    icon: "🚢",
    name: "Contenedor marítimo",
    desc: "Pileta construida dentro de un contenedor 20 o 40 pies: estructura de acero marinizado, arenado, epoxi, aislación y liner o venecita. Enterrada, apoyada o mixta. Del puerto a tu patio en 2-3 semanas.",
    timeLabel: "2-3 semanas (montaje 1-2 días)",
    costRel: 1.3,
    structure: "Contenedor usado HCM (high cube) reforzado: perfiles UPN en paredes, puntera y contra-peso, piso antiderrapante.",
    finishes: ["epoxi", "pvc", "venecita"],
    infinity: true,
    natural: false,
    turnoverH: 4,
    exotic: true,
    notes: [
      "Formatos: 20 pies (6,06 × 2,44 m) para 12-14 m³ · 40 pies (12,19 × 2,44 m) para 25-28 m³.",
      "El refuerzo estructural es OBLIGATORIO: un contenedor apilado soporta carga en los bordes, no presión hidrostática lateral de 1,2 m.",
      "Terminación premium: paño de vidrio/acrílico reemplazando una pared lateral (combo con el tipo vidrio).",
      "Transporte: el contenedor viaja cargado en camión con grúa; verificar acceso y peso sobre vereda (7-9 t con agua).",
      "Funciona perfecta como pileta ELEVADA: terrace pool, rooftop con vereda de madera alrededor."
    ]
  },
  {
    id: "vidrio",
    icon: "🪟",
    name: "Vidrio / acrílico",
    desc: "Pileta con paño lateral (o fondo) de vidrio laminado templado o acrílico: la ventana que se ve en los hoteles de Dubai. Paredes hormigón + paño estructural con sellado especial.",
    timeLabel: "6-10 semanas de obra",
    costRel: 2.2,
    structure: "Hormigón armado convencional en 3 lados + paño de vidrio laminado templado (2×8 mm con SentryGlas) o acrílico de 30-60 mm en marcos de acero inox.",
    finishes: ["venecita", "micro", "pvc"],
    infinity: true,
    natural: false,
    turnoverH: 5,
    exotic: true,
    notes: [
      "El paño se calcula con presión hidrostática + empuje sísmico: vidrio laminado 2×10 mm hasta 1,2 m de agua; sobre eso, acrílico monolítico espesores de 30-120 mm.",
      "El sellado va con silicona estructural MS/híbrida + perfilería de apoyo continua: NUNCA punto silicona común.",
      "Combo ganador: borde infinito + paño de vidrio en el muro del weir (el clásico de Instagram).",
      "Fondo de vidrio total (sky pool) solo con cálculo estructural firmado + acrílico: el vidrio en fondo trabajando a flexión se sale del estándar.",
      "El costo manda: el paño instalado ronda $850.000/m² — se paga el efecto, no el material."
    ]
  },
  {
    id: "suspendida",
    icon: "🏙️",
    name: "Suspendida / rooftop",
    desc: "Pileta elevada sobre estructura (terraza, losa, columnas): la fly pool. Todo el peso del agua (1 t por m³) cae sobre un cálculo estructural serio + impermeabilización de altísima confianza.",
    timeLabel: "8-14 semanas de obra",
    costRel: 1.8,
    structure: "Estructura metálica o losa calculada para 1,5 t/m² (agua + empuje + bañistas) + pileta de hormigón proyectado o panel GRC con liner.",
    finishes: ["pvc", "micro", "venecita"],
    infinity: true,
    natural: false,
    turnoverH: 5,
    exotic: true,
    notes: [
      "El 80% del costo extra es la estructura de apoyo, no la pileta: 1 m³ de agua = 1.000 kg.",
      "Impermeabilización de doble seguridad: membrana cementicia + liner PVC armada (redundancia obligada arriba de la gente).",
      "Cámaras de inspección permanentes bajo la cuba: una pérdida en rooftop arruina el techo de abajo.",
      "Doble circulación: filtración + rebalse por grating perimetral (el skimmer convencional pierde ahí).",
      "Hidráulica con sala de máquinas en el MISMO nivel: bombas de compensación silenciosas (aislación antivibratoria obligatoria)."
    ]
  },
  {
    id: "plunge",
    icon: "🍸",
    name: "Plunge / cocktail",
    desc: "Mini pileta de inmersión 2-3 m: para refrescarse, tomar algo y verse bien. Sale como monobloque GRC de fábrica o en obra chica, con opcional hidromasaje y calefacción.",
    timeLabel: "1-2 semanas (monobloque: 1 día)",
    costRel: 0.5,
    structure: "Monobloque GRC de fábrica sobre platea simple, u obra de mampostería chica.",
    finishes: ["grc-integrado", "micro", "venecita"],
    infinity: false,
    natural: false,
    turnoverH: 3,
    exotic: true,
    notes: [
      "Formato de fábrica: 2,0 × 2,0 m a 2,5 × 1,5 m, profundidad 1,0-1,2 m, ~4-5 m³.",
      "Con calefacción + borlas se convierte en spa-jet: el 'cocktail pool' americano que más crece.",
      "Filtración compacta: cartucho monobloque (sin retrolavado, ideal en terrazas).",
      "Ideal primer producto del catálogo prefabricado: precio de entrada, entrega en un día, upsell a los equipos."
    ]
  },
  {
    id: "endless",
    icon: "🏊",
    name: "Nado contra corriente",
    desc: "Pileta corta (3-5 m) con motor de contra corriente: nadás en el lugar, entrenamiento real en terrenos chicos. El 1% de las piletas, la que el natación-runner del barrio quiere.",
    timeLabel: "3-5 semanas de obra",
    costRel: 0.8,
    structure: "Hormigón o monobloque GRC + equipo contra corriente empotrado en pared.",
    finishes: ["venecita", "micro", "grc-integrado"],
    infinity: false,
    natural: false,
    turnoverH: 3,
    exotic: true,
    notes: [
      "Formato típico: 3,5-5 × 2-2,5 m, profundidad uniforme 1,3 m (nada en el lugar, no necesita pendiente).",
      "El equipo es la estrella: contracorriente de 60-110 m³/h regulable (Jet Swim / Badu) — 1,5-2,2 HP dedicados.",
      "Espejo de agua calmado: la corriente genera olas — prever rebalse ancho en el lado opuesto al jet.",
      "Combo fitness: plunge frío al lado + contra corriente = circuito de recuperación deportiva."
    ]
  },
  {
    id: "spa",
    icon: "♨️",
    name: "Spa / hidromasaje",
    desc: "Agua caliente 34-38 °C, jets de hidromasaje y burbujeo: obra propia o prefabricado. Consumo y química distintos (agua caliente = desinfección más exigente).",
    timeLabel: "2-4 semanas de obra",
    costRel: 0.7,
    structure: "Hormigón armado aislado (poliestireno perimetral) o acrílico prefabricado dentro de deck.",
    finishes: ["micro", "venecita", "grc-integrado"],
    infinity: false,
    natural: false,
    turnoverH: 1,
    exotic: false,
    notes: [
      "Recambio horario: el agua a 36 °C es caldo de cultivo — filtración continua y desinfección reforzada (ozono ideal acá).",
      "Aislación TÉRMICA obligatoria en paredes y fondo (EPS 5 cm): sin ella la bomba de calor no para.",
      "Dos circuitos: filtración + circuito de jets (bomba 1,5-2 HP + blower de aire).",
      "Cobertor térmico rígido: sin él perdés 2-3 °C por noche y pagás el doble en electricidad.",
      "Química propia: pH 7,2-7,6 estricto + desinfección residual continua; drenaje y limpieza profunda cada 2-3 meses (biofilm)."
    ]
  }
];

/* ------------------------------------------------------------
   TIPOS DE BORDE (define la línea de agua contra el deck)
   skimmer  = borde seco clásico con skimmers
   rebose   = espejo de agua a ras con canaleta perimetral
   infinity1/infinityP = borde infinito de un lado / perimetral
   ------------------------------------------------------------ */
const BORDERS = {
  skimmer:   { name: "Skimmer clásico (borde seco)", desc: "El borde termina 15-20 cm sobre el agua y los skimmers tragan la nata. El estándar: simple y barato de mantener." },
  rebose:    { name: "Rebose perimetral (espejo a ras)", desc: "El agua llega parejo al filo en TODO el perímetro y cae a canaleta: agua de vidrio siempre (skimming del 100% de la superficie). Requiere estanque compensador + bomba, como el infinito." },
  infinity1: { name: "Borde infinito — un lado", desc: "La pared desaparece del lado de la vista: el agua se funde con el horizonte. Requiere weir perfecto + estanque + bomba de compensación." },
  infinityP: { name: "Borde infinito — perimetral (espejo total)", desc: "TODOS los lados desbordan: la pileta parece flotar. Máximo efecto, máximo equipamiento (canaleta perimetral + estanque grande)." }
};

/* Coping / cordón perimetral (sobre el borde) */
const COPINGS = {
  none:   { name: "Sin coping (venecita hasta el filo)", priceKey: null },
  stone:  { name: "Piedra bola / laja", priceKey: "copingPiedra" },
  grc:    { name: "Losas GRC de fábrica (0,50 m)", priceKey: "copingGrc" },
  brick:  { name: "Ladrillo / cerámico", priceKey: "copingLadrillo" },
  wood:   { name: "Madera composite (deck al filo)", priceKey: "copingMadera" },
  mosaic: { name: "Bulón 40 / venecita enrollada", priceKey: "copingMosaico" }
};

/* Solarium seco / deck perimetral */
/* ------------------------------------------------------------
   COLOR DE AGUA Y PALETA por revestimiento interior —
   qué color de agua logra cada terminación, paleta sugerida
   (fondo + coping + deck) y tips del rubro.
   ------------------------------------------------------------ */
const FINISH_COLORS = {
  venecita: {
    base: [{ n: "Verde Bali 10×10", c: "#0e7a63" }, { n: "Azul océano", c: "#1266a8" }, { n: "Blanco perlado", c: "#e8ecec" }],
    agua: { c1: "#3ec6b0", c2: "#0f7f8f", txt: "agua turquesa tipo laguna Bali" },
    paleta: [{ n: "coping", c: "#b8a888" }, { n: "deck", c: "#c9b48a" }],
    tips: [
      "El verde del mosaico tiñe el agua TURQUESA: es el look Bali que más se comparte en redes",
      "Mosaico azul = agua azul intensa; blanco perlado = agua celeste cristalina",
      "Con venecita clara, cuidá la dureza del agua (baja disuelve las juntas y las picotea)"
    ]
  },
  micro: {
    base: [{ n: "Gris cemento pulido", c: "#b9b9b3" }, { n: "Cemento + pigmento azul", c: "#5f89a6" }, { n: "Blanco hueso", c: "#e6e1d5" }],
    agua: { c1: "#8fd0e0", c2: "#4f9db5", txt: "agua celeste natural, espejo si se pule" },
    paleta: [{ n: "coping", c: "#c9c2b4" }, { n: "deck", c: "#a8926b" }],
    tips: [
      "El fondo claro da agua CELESTE: multiplica la luz y la pileta se ve más grande",
      "Pigmento azul en masa → agua más profunda sin dejar de ser cementicio",
      "Sellado final con silicato = menos poros, más brillo espejo del cielo"
    ]
  },
  "cemento-arena": {
    base: [{ n: "Arena natural", c: "#d9c9a3" }, { n: "Verde Bali profundo", c: "#2e6e55" }, { n: "Gris piedra", c: "#9d9a90" }],
    agua: { c1: "#7fc4a8", c2: "#3f8f78", txt: "agua verde suave, estilo laguna natural" },
    paleta: [{ n: "coping", c: "#b8a888" }, { n: "deck", c: "#8a6a48" }],
    tips: [
      "La arena natural imita un balneario: el agua queda VERDE SUAVE, orgánica",
      "Con pigmento verde en masa lográs el Bali profundo sin venecita",
      "Acabado esponjeado o con cuarzo en playas = antiderrapante para chicos"
    ]
  },
  pvc: {
    base: [{ n: "Azul liner clásico", c: "#2f7fa8" }, { n: "Celeste", c: "#6fb5d4" }, { n: "Gris grafito", c: "#4a5560" }],
    agua: { c1: "#5fb4d9", c2: "#2a7fa8", txt: "agua azul pareja y saturada, look clásico" },
    paleta: [{ n: "coping", c: "#c9c2b4" }, { n: "deck", c: "#8a6a48" }],
    tips: [
      "El color lo da el liner: elegilo de catálogo físico (en pantalla engaña)",
      "Gris grafito = agua azul profunda muy elegante, pero se ve 'más fría'",
      "Cambio de look futuro = cambiar el liner, sin obra"
    ]
  },
  "grc-integrado": {
    base: [{ n: "Gris arena GRC", c: "#c4bba8" }, { n: "Blanco cemento", c: "#e3ded2" }, { n: "Color en masa a pedido", c: "#7aa5b5" }],
    agua: { c1: "#8fd0e0", c2: "#57a8bf", txt: "agua celeste limpia, tono uniforme" },
    paleta: [{ n: "coping", c: "#c4bba8" }, { n: "deck", c: "#c9b48a" }],
    tips: [
      "El panel sale de fábrica con el color en masa: uniformidad total, sin juntas de venecita",
      "Ideal para los 3 formatos estandarizados del catálogo prefab",
      "Textura antiderrapante integrada en playas y escalones"
    ]
  },
  epoxi: {
    base: [{ n: "Azul alto brillo", c: "#1668a8" }, { n: "Verde intenso", c: "#0d7a5f" }, { n: "Negro profundo", c: "#1d272e" }],
    agua: { c1: "#37a6c9", c2: "#0d5f8a", txt: "agua muy saturada, modernista" },
    paleta: [{ n: "coping", c: "#8f959c" }, { n: "deck", c: "#5d6a73" }],
    tips: [
      "Máxima saturación de color: el epoxi brilla y multiplica el tinte",
      "Exige contrafondo perfecto: cada ondulación se ve (es un espejo de la obra)",
      "Para contenedores es EL revestimiento: adherencia al acero + sellado total"
    ]
  },
  geo: {
    base: [{ n: "Negro EPDM", c: "#22282c" }, { n: "Azul EPDM", c: "#1c4e6e" }, { n: "Con gravas vistas", c: "#7a8a80" }],
    agua: { c1: "#2e5f52", c2: "#16352e", txt: "agua oscura espejada, laguna viva" },
    paleta: [{ n: "coping", c: "#8a9a8f" }, { n: "deck", c: "#6d8a6f" }],
    tips: [
      "El negro EPDM espeja el cielo: el agua queda OSCURA y cristalina a la vez",
      "Zona de regeneración con gravas claras = contraste de aguas en el mismo vaso",
      "Es la única terminación 100% compatible con peces y plantas (cero química)"
    ]
  }
};

/* ------------------------------------------------------------
   PERMISOS por rol — qué puede hacer cada tipo de usuario.
   La matriz se muestra en Planes y se aplica con can(feature).
   ------------------------------------------------------------ */
const ROLE_PERMS = {
  features: [
    { f: "Estimación de precio y guías", c: "✔", p: "✔", v: "✔" },
    { f: "Configuración técnica completa", c: "—", p: "✔", v: "—" },
    { f: "Planos en pantalla y descarga SVG", c: "—", p: "✔", v: "—" },
    { f: "Presupuesto con IVA, margen y plan de pagos", c: "—", p: "✔", v: "—" },
    { f: "Exports (Excel · Word · MD · CSV · Odoo)", c: "—", p: "✔", v: "—" },
    { f: "Informe de cliente y seguimiento de obra", c: "—", p: "✔", v: "—" },
    { f: "Ver demanda y publicar ofertas", c: "—", p: "—", v: "✔" },
    { f: "Sumarse al directorio de constructores", c: "—", p: "—", v: "✔" },
    { f: "Asistente IA (offline siempre; online con tu clave)", c: "✔", p: "✔", v: "✔" },
    { f: "Fábrica — formulaciones propias", c: "—", p: "🔒 solo dueño", v: "—" },
    { f: "Panel del dueño: usuarios, backup cifrado, auditoría", c: "—", p: "🔒 solo dueño", v: "—" }
  ],
  nota: "El rol 'profesional' incluye al dueño: con sesión de dueño iniciada se desbloquean fábrica y administración."
};

function can(feature) {
  const r = localStorage.getItem("piletalab_role") || "pro";
  const M = { "exportar": ["pro"], "obra": ["pro"], "ofertas": ["proveedor"], "fabrica": ["owner"], "admin": ["owner"] };
  const allow = M[feature] || ["pro"];
  if (allow.includes("owner")) return typeof Auth !== "undefined" && Auth.isAdmin();
  return allow.includes(r);
}

/* Solarium seco / deck perimetral */
const DECK_MATERIALS = {
  madera:   { name: "Deck de madera composite", price: 62000, note: "listones + estructura, antiderrapante" },
  piedra:   { name: "Laja / piedra caliza", price: 52000 },
  hormigon: { name: "Hormigón pulido / lavado", price: 38000 },
  cesped:   { name: "Césped natural o sintético", price: 18000 },
  atermico: { name: "Losetas atérmicas GRC (fabricación propia)", price: 95000, note: "no quema los pies al sol — nuestro producto diferencial" }
};

/* ------------------------------------------------------------
   INNOVACIONES seleccionables (chips en config → presupuesto)
   ------------------------------------------------------------ */
const INNOVATIONS = [
  { id: "tanning", icon: "🌞", name: "Tanning ledge (solárium sumergido con reposeras)", desc: "Plataforma de 20-30 cm dentro de la pileta con reposeras: el lugar donde todos terminan. Se integra a la geometría tipo solarium húmedo.", price: 850000 },
  { id: "swimbar", icon: "🍹", name: "Bar dentro de la pileta (swim-up bar)", desc: "Mesada + bancos sumergidos contra la pared: tragos sin salir del agua. Combina perfecto con el solarium húmedo.", price: 1950000 },
  { id: "cascada", icon: "🌊", name: "Cascada sheetfall (lamina de acero inox)", desc: "Lámina de agua de vidrio desde el muro: sonido + movimiento + oxigenación gratis del agua.", price: 980000 },
  { id: "fuente", icon: "⛲", name: "Fuente danzante con luces", desc: "Jets coreografiados con LED: la pileta de noche se vuelve show. Suma oxigenación y enfriamiento.", price: 1400000 },
  { id: "solarHeat", icon: "☀️", name: "Calefacción solar híbrida (paneles + bomba calor)", desc: "Paneles solares térmicos precalientan y la bomba de calor solo ajusta: 40-60% menos electricidad.", price: 1200000 },
  { id: "auto", icon: "📱", name: "Automatización pH/ORP + control por app", desc: "Dosificadores automáticos, sondas y todo el equipo desde el celular: el agua se cuida solo.", price: 1850000 },
  { id: "rgbMusic", icon: "🎶", name: "Luces RGB coreografiadas + audio sumergido", desc: "Escenas de luz sincronizadas con música bajo el agua: la fiesta termina en la pileta.", price: 1550000 },
  { id: "arenaReal", icon: "🏖️", name: "Playa de arena real (fondo de arena en el solarium)", desc: "Capa de arena sílica sobre membrana con borde contenedor: entrás descalizo a un balneario. El look Bali definitivo.", price: 680000 },
  { id: "aterrmico", icon: "❄️", name: "Piso atérmico GRC alrededor (fabricación propia)", desc: "Nuestras losetas atérmicas en el deck: caminás descalzo al mediodía sin quemarte. Se calcula por m² de deck.", price: 95000, perM2: true }
];

/* ------------------------------------------------------------
   REVESTIMIENTOS
   ------------------------------------------------------------ */
const FINISHES = {
  "venecita": {
    name: "Venecita / mosaico vítreo (simil Bali verde 10x10)",
    adherKgM2: 4,        // doble encolado, llana 6x6 + llana 8x8
    boxM2: 2.07,
    pastinaKgM2: 0.9,
    basePriceM2: 98000,
    desc: "Mosaico vítreo 10x10 en placas 30x30. Doble encolado obligatorio en pileta. Nuestro cálculo 4x8 de referencia usa Palau verde."
  },
  "micro": {
    name: "Revestimiento cementicio liso pulible (línea propia)",
    adherKgM2: 3,
    boxM2: null,
    pastinaKgM2: 0,
    basePriceM2: 42000,
    desc: "Nuestro liso pulible espejo: 1,5-3 mm en 2-3 capas, rendimiento 0,5-0,65 m²/kg. Sin cal, con microsílice + silicato de sodio. Fórmulas completas en pestaña Fábrica."
  },
  "cemento-arena": {
    name: "Cemento-arena teñido rústico (acabado Bali)",
    adherKgM2: 0,
    boxM2: null,
    pastinaKgM2: 0,
    basePriceM2: 26000,
    desc: "Revoque fino de cemento blanco + arena tamizada, pigmentado en masa (verde Bali / arena natural). Acabado esponjeado o pulido a piedra. Sellado final con silicato."
  },
  "pvc": {
    name: "Membrana PVC armada (liner reforzado)",
    adherKgM2: 0,
    boxM2: null,
    pastinaKgM2: 0,
    basePriceM2: 38000,
    desc: "Membrana PVC 1,5 mm armada, soldada en caliente. Rápida y sin juntas; el geo queda a la vista. Vida útil 10-15 años, reemplazable."
  },
  "grc-integrado": {
    name: "GRC de fábrica (terminación integrada del panel)",
    adherKgM2: 0,
    boxM2: null,
    pastinaKgM2: 0,
    basePriceM2: 0,
    desc: "El panel sale del molde con la cara vista terminada: color en masa, textura antiderrapante. Solo sellado de juntas in situ."
  },
  "geo": {
    name: "Geomembrana vista (natural)",
    adherKgM2: 0,
    boxM2: null,
    pastinaKgM2: 0,
    basePriceM2: 22000,
    desc: "EPDM 1,5 mm negra o azul. En naturales se cubre la zona de regeneración con grava; la zona de nado puede ir con acabado cementicio arriba."
  },
  "epoxi": {
    name: "Epoxi 100% sólidos (contenedor / acero)",
    adherKgM2: 0,
    boxM2: null,
    pastinaKgM2: 0,
    basePriceM2: 32000,
    desc: "Pintura epoxi bicomponente 100% sólidos sobre arenado Sa 2,5: la barrera del contenedor. 2 manos (+ imprimación epoxi). Resiste inmersión permanente y cloro."
  }
};

/* ------------------------------------------------------------
   FILTRACIÓN MECÁNICA
   Velocidad de filtración = caudal (m³/h) / área filtrante (m²).
   ------------------------------------------------------------ */
const FILTER_SYSTEMS = {
  arena: {
    name: "Filtro de arena (sílica #20, 0,6-1 mm)",
    type: "mecánica",
    velFiltr: 50,          // m³/h por m² de área filtrante (normal); 20 en lavado
    mediaCost: "Grava de soporte + arena sílica #20",
    backwashL: 250,        // litros aproximados por retrolavado
    pros: "Estándar del rubro, barato de mantener, media dura 3-5 años, tolera descuidos.",
    cons: "Finura media (15-25 micrones), retrolavado gasta agua (250-400 L por ciclo).",
    maintenance: "Retrolavado c/7-15 días (según manómetro +0,3 bar del limpio) · media cada 3-5 años.",
    priceRef: "Filtro 500 mm ≈ $380.000 · 600 mm ≈ $520.000 · 750 mm ≈ $760.000 (ARS sep/2026)"
  },
  vidrio: {
    name: "Filtro de vidrio reciclado",
    type: "mecánica",
    velFiltr: 40,
    mediaCost: "Vidrio activado 0,4-1 mm (3 tamaños en capas)",
    backwashL: 180,
    pros: "Filtra más fino (10-15 µm), menos biofilm (el vidrio no aloja bacterias como la arena), retrolavados más cortos, dura 8-10 años.",
    cons: "Media 2-3 veces más cara que arena al arranque.",
    maintenance: "Retrolavado c/10-20 días · media cada 8-10 años (solo se repone lo degradado).",
    priceRef: "Mismo cuerpo que arena + media: vidrio ≈ $95.000 por 25 kg"
  },
  cartucho: {
    name: "Filtro de cartucho",
    type: "mecánica",
    velFiltr: 0,           // se dimensiona por m² de cartucho y no por lecho: caudal máx según tabla
    mediaCost: "Cartucho de poliéster 10-25 µm",
    backwashL: 0,
    pros: "No gasta agua en retrolavado (se lava el cartucho con manguera), ideal donde el agua es cara o hay restricción. Chico y silencioso.",
    cons: "El cartucho se limpia a mano cada 2-4 semanas, se cambia 1-2 veces por año. Pierde con cargas altas.",
    maintenance: "Lavado manual c/15 días · recambio del cartucho c/12-18 meses.",
    priceRef: "Equipo 10 m² de cartucho ≈ $450.000 · cartucho repuesto ≈ $85.000"
  },
  diatomeas: {
    name: "Tierra de diatomeas (DE)",
    type: "mecánica",
    velFiltr: 0,
    mediaCost: "Diatomeas en polvo (precoat sobre telas/mallas)",
    backwashL: 300,
    pros: "La filtración más fina (2-5 µm): agua cristalina de vidrio. El estándar de piletas de exposición.",
    cons: "Operación más exigente: recarga de polvo tras cada retrolavado, el DE es material de manejo con cuidado (no respirar el polvo seco), desechos regulados.",
    maintenance: "Precoat 0,5-1 kg de DE cada retrolavado · telas se limpian c/6-12 meses.",
    priceRef: "Equipo doméstico ≈ $650.000 · bolsa de DE 10 kg ≈ $38.000"
  },
  bio: {
    name: "Biofiltro de gravas + plantas (naturales)",
    type: "biológica",
    velFiltr: 0.5,          // velocidad extremadamente baja: régimen biológico
    mediaCost: "Gravas 4-16 mm en capas + plantas oxigenantes",
    backwashL: 0,
    pros: "Cero química, cuesta de operación mínimo (bomba chica), es un ecosistema: peces y plantas. El agua no irrita ojos ni piel.",
    cons: "Requiere 30-50% de superficie extra para regeneración, maduración 4-8 semanas, control de equilibrio biológico (no es 'sin mantenimiento').",
    maintenance: "Poda de plantas estacional · retiro manual de hojas · chequeo de bomba c/mes.",
    priceRef: "Grava ≈ $28.000/m³ · plantas ≈ $12.000 los 10 plantines · bomba 0,5 HP ≈ $180.000"
  }
};

/* ------------------------------------------------------------
   DESINFECCIÓN / COMPLEMENTOS
   ------------------------------------------------------------ */
const SANITIZERS = {
  cl: {
    name: "Cloro manual (dicloro/tricloro + hipoclorito)",
    residual: "1-3 ppm libre",
    pros: "El más barato y probado. Residual duradero que sigue matando después del dosificado.",
    cons: "Hay que dosificar y medir seguido, olor a cloro si se combina con amoníaco (cloraminas).",
    priceRef: "Balde dicloro 10 kg ≈ $95.000 (rinde ~2 meses en 40 m³)"
  },
  salt: {
    name: "Electrólisis salina",
    residual: "1-2 ppm (cloro generado in situ)",
    pros: "Agua suave para piel y ojos, dosificación automática, olor casi nulo. Sal 4-6 g/L (agua casi dulce).",
    cons: "Electrolizador y sonda pH suben el costo inicial; la celda se repone c/3-5 años; el pH tiende a subir (consumo de corrector).",
    priceRef: "Electrolizador salino doméstico ≈ $850.000 + sal 25 kg ≈ $18.000"
  },
  uv: {
    name: "UV ultravioleta",
    residual: "Necesita cloro residual 0,5-1 ppm",
    pros: "Destruye cloraminas y virus resistentes al cloro, agua de aspecto excelente, sin agregar productos.",
    cons: "NO deja residual: siempre necesita cloro atrás. Lámpara se repone c/1-2 años (~$150.000), consume energía.",
    priceRef: "Equipo UV 55 W ≈ $950.000"
  },
  ozone: {
    name: "Ozono (O₃)",
    residual: "Necesita cloro residual 0,5-1 ppm",
    pros: "El oxidante más potente: agua de manantial, elimina olores y sabores, reduce el consumo de cloro 60-80%.",
    cons: "El más caro de instalar y operar; sin residual (como UV); requiere espacio y ventilación en sala; ozono en exceso es corrosivo.",
    priceRef: "Generador + destructor ≈ $1.400.000+"
  },
  "activeo2": {
    name: "Oxígeno activo (peróxido/perácidos)",
    residual: "Bajo, se dosifica frecuente",
    pros: "Sin cloro: ideal para alérgicos y piletas de uso intermitente. No forma cloraminas.",
    cons: "Residual corto: en verano se dosifica 1-2 veces por semana, se degrada rápido con calor y sol. No recomendado solo en piletas de uso intenso.",
    priceRef: "Bidón 5 L ≈ $65.000 (rinde ~1 mes en 40 m³)"
  },
  none: {
    name: "Sin química (solo naturales)",
    residual: "—",
    pros: "El agua es apta para riego y vida silvestre.",
    cons: "Solo alcanzable con zona de regeneración dimensionada correctamente. No aplicar a pileta de nado convencional.",
    priceRef: "—"
  }
};

/* ------------------------------------------------------------
   QUÍMICA DEL AGUA — rangos objetivo
   ------------------------------------------------------------ */
const CHEM_TARGETS = [
  { param: "pH", range: "7,2 - 7,6", ideal: "7,4", why: "Fuera de rango el cloro pierde potencia (a pH 8 tiene el 20% de actividad) y la venecita/revoque se ataca.", tool: "Medidor digital o gotero (verificar vencimiento de reactivos)" },
  { param: "Cloro libre", range: "1 - 3 ppm", ideal: "1,5", why: "Residual desinfectante. Siempre medir junto a pH: el par manda.", tool: "Kit DPD (el OTA confunde con cloraminas)" },
  { param: "Cloro combinado", range: "< 0,6 ppm", ideal: "0", why: "Cloraminas = olor a pileta y ojos rojos. Si sube: supercloración (shock).", tool: "Kit DPD con reactivo de combinado" },
  { param: "Alcalinidad total", range: "80 - 120 ppm", ideal: "100", why: "El amortiguador del pH. Se corrige PRIMERO que el pH (arrastre).", tool: "Titulación por gotas" },
  { param: "Dureza cálcica", range: "200 - 400 ppm", ideal: "300", why: "Con venecita y revestimientos cementicios: bajo 200 el agua disuelve el yeso (agujeritos); sobre 500 incrusta.", tool: "Titulación o tiras" },
  { param: "Ácido cianúrico", range: "20 - 50 ppm", ideal: "35", why: "Protege el cloro del sol. Sobre 70 ppm el cloro queda 'bloqueado' y hay que diluir con agua nueva.", tool: "Tiras o titulación" },
  { param: "ORP", range: "> 650 mV", ideal: "720 mV", why: "Medida directa del poder oxidante: el mejor termómetro de agua sana.", tool: "Sonda ORP (viene en controladores automáticos)" },
  { param: "Temperatura", range: "26 - 29 °C", ideal: "27", why: "Confort. Cada grado extra acelera consumo de cloro y crecimiento de algas.", tool: "Termómetro flotante" }
];

/* Dosificaciones orientativas por m³ (regla de arranque del rubro) */
const CHEM_DOSING = {
  raisePH:   { product: "Carbonato de sodio (soda ash / elevador de pH)", perM3Per01: 8,   unit: "g",   note: "8 g por m³ sube el pH ~0,1. Disolver en balde y esparcir con la bomba andando." },
  lowerPH:   { product: "Ácido muriático 31% (o bisulfato de sodio)", perM3Per01: 12,  unit: "ml",  note: "12 ml por m³ baja el pH ~0,1. SIEMPRE ácido al agua, nunca agua al ácido. En pozas de dilución lejos de venecita." },
  raiseAlk:  { product: "Bicarbonato de sodio", perM3Per10: 15, unit: "g", note: "15 g por m³ sube alcalinidad ~10 ppm. Esperar 24 h y remedir antes de tocar el pH." },
  raiseHard: { product: "Cloruro de calcio", perM3Per50: 60, unit: "g", note: "60 g por m³ sube dureza ~50 ppm. Disolver en agua FRÍA antes (reacciona con calor)." },
  shock:     { product: "Hipoclorito de calcio 65-70% (supercloración)", perM3: 15, unit: "g", note: "15 g por m³ = ~5 ppm de suba. Shock de temporada o tras uso intensivo: al atardecer, sin bañistas, filtrar 8 h." },
  lowerCyA:  { product: "Dilución (vaciado parcial + agua nueva)", perM3: 0, unit: "", note: "El cianúrico NO se quema ni se filtra: la única corrección es reemplazar agua. ~25% del volumen baja ~25% del CYA." }
};

/* Rutinas de mantenimiento */
const CHEM_ROUTINE = {
  daily:   ["Medir pH y cloro (a la misma hora, ideal al atardecer)", "Retirar hojas y flotantes con el jopi", "Controlar nivel de agua (1/3 del skimmer aprox.)"],
  weekly:  ["Retrolavado si el manómetro pide (+0,3 bar) o caudal visible caído", "Correctivos de pH/alcalinidad según medición", "Barrido de fondo (bicho o robot) mientras filtra", "Control del cloro combinado: si > 0,6 ppm, shock", "Enjuagar canastas de skimmer y pre-filtro de bomba"],
  monthly: ["Alcalinidad + dureza + cianúrico (los parámetros lentos)", "Limpieza de línea de agua (grasa bronceadora): esponja + detergente neutro", "Revisar uniones, sellados del equipo y pérdidas en cañerías visibles", "Reposición de agua evaporada con manguera (no reponer todo de golpe si es blanda)"],
  opening: ["Retiro de la lona de invernada y limpieza de sedimentos", "Reposición de nivel, arrime de equipos y prueba de estanqueidad", "Análisis completo de agua y corrección de alcalinidad primero", "Supercloración de arranque + filtración continua 48 h", "Inspección de juntas del coping y revoque: reparar antes de la temporada"],
  winter:  ["Dejar el equipo con agua + antifreeze si hay heladas, o vaciar cañerías por completo", "Nivel de agua 10 cm bajo skimmers si se vacía el circuito", "Lona o cobertura flotante: evita el 90% de la suciedad", "Dosis de invernada (algicida de invierno + oxidante suave) 1 vez al mes", "Filtrar 2-3 h cada 15 días en inviernos suaves: el agua quieta se enferma"]
};

/* ------------------------------------------------------------
   PRECIOS REFERENCIALES (ARS, septiembre 2026)
   Editables desde la pestaña Presupuesto (localStorage).
   ------------------------------------------------------------ */
const DEFAULT_PRICES = {
  excav:      { name: "Movimiento de suelo / excavación m³", unit: "m³", price: 18000, note: "A mano o minicargadora según acceso" },
  hormigon:   { name: "Hormigón H-21 estructurale (bomba incluida)", unit: "m³", price: 320000 },
  acero:      { name: "Acero AD420- malla + barras armado", unit: "kg", price: 4200 },
  venecita:   { name: "Venecita simil Bali 10x10 (Palau)", unit: "m²", price: 98000, note: "Verificar m²/caja real del proveedor" },
  adhesivo:   { name: "Adhesivo Klaukol Blanco Pro (bolsa 30 kg)", unit: "bolsa", price: 38000 },
  pastina:    { name: "Pastina de piscina (bolsa 10 kg, línea propia)", unit: "bolsa", price: 32000 },
  imperm:     { name: "Impermeabilizante cementicio (bolsa 25 kg, corralón)", unit: "bolsa", price: 58000, note: "2 manos cruzadas + malla en encuentros" },
  micro:      { name: "Revestimiento cementicio liso pulible (kg)", unit: "kg", price: 4200 },
  copingPiedra:{ name: "Coping piedra bola / laja (m lineal)", unit: "ml", price: 45000 },
  grcPanel:   { name: "Panel GRC prefabricado (m² puesto en obra)", unit: "m²", price: 145000 },
  epdm:       { name: "Geomembrana EPDM 1,5 mm (m² colocado)", unit: "m²", price: 42000 },
  grava:      { name: "Grava de regeneración 4-16 mm (m³)", unit: "m³", price: 28000 },
  plantas:    { name: "Plantas oxigenantes (10 plantines)", unit: "pack", price: 12000 },
  filtro:     { name: "Filtro (según tamaño calculado)", unit: "u", price: 520000 },
  bomba:      { name: "Bomba filtrante (según HP calculada)", unit: "u", price: 480000 },
  bombaInf:   { name: "Bomba de compensación borde infinito", unit: "u", price: 420000 },
  skimmer:    { name: "Skimmer ABS + registro", unit: "u", price: 65000 },
  ret:        { name: "Retorno / boquilla de pared", unit: "u", price: 22000 },
  drain:      { name: "Desagüe de fondo antivórtice", unit: "u", price: 48000 },
  multiv:     { name: "Válvula multivía 6 posiciones", unit: "u", price: 145000 },
  pipol:      { name: "Cañería PVC presión 63 mm (rollo + accesorios)", unit: "m", price: 9500 },
  electrovalv:{ name: "Electroválvula / tablero de comandos", unit: "u", price: 85000 },
  sal:        { name: "Electrolizador salino (opcional)", unit: "u", price: 850000 },
  cloro:      { name: "Balde dicloro 10 kg (arranque temporada)", unit: "u", price: 95000 },
  lucesLED:   { name: "Luz sumergible LED nicho RGB 12V", unit: "u", price: 180000, note: "1 cada 4 m de largo + transformador" },
  transfLED:  { name: "Transformador 12V estanco + cableado subacuático", unit: "u", price: 95000 },
  escaleraInox:{ name: "Escalera inoxidable 3 escalones c/ bordes", unit: "u", price: 260000 },
  bombaCalor: { name: "Bomba de calor piscina (según kW calculado)", unit: "u", price: 1950000 },
  cobertorM2: { name: "Cobertor térmico solar + enrollador", unit: "m²", price: 28000 },
  ducha:      { name: "Ducha exterior de pileta (termo/ducha solar)", unit: "u", price: 85000 },
  contenedor20:{ name: "Contenedor marítimo 20ft usado + arenado + refuerzos", unit: "u", price: 9800000 },
  epoxiM2:    { name: "Pintura epoxi 100% sólidos (2 manos + imprimación)", unit: "m²", price: 32000 },
  vidrioLam:  { name: "Paño vidrio laminado templado / acrílico instalado", unit: "m²", price: 850000 },
  estructuraElev:{ name: "Estructura de apoyo pileta elevada (acero calculado)", unit: "m²", price: 420000 },
  contraCorriente:{ name: "Equipo nado contra corriente 60-110 m³/h", unit: "u", price: 1650000 },
  kitHidro:   { name: "Kit hidromasaje (bomba jets + blower + boquillas)", unit: "u", price: 650000 },
  robot:      { name: "Robot limpiador de fondo (dolphin clase doméstica)", unit: "u", price: 950000 },
  copingGrc:  { name: "Coping losas GRC de fábrica (ml)", unit: "ml", price: 50000 },
  copingLadrillo:{ name: "Coping ladrillo / cerámico (ml)", unit: "ml", price: 28000 },
  copingMadera:{ name: "Coping madera composite (ml)", unit: "ml", price: 58000 },
  copingMosaico:{ name: "Coping bulón 40 / venecita enrollada (ml)", unit: "ml", price: 39000 },
  deckMadera: { name: "Deck madera composite (m² colocado)", unit: "m²", price: 62000 },
  deckPiedra: { name: "Deck laja / piedra (m²)", unit: "m²", price: 52000 },
  deckHormigon:{ name: "Deck hormigón pulido (m²)", unit: "m²", price: 38000 },
  deckCesped: { name: "Césped natural/sintético (m²)", unit: "m²", price: 18000 },
  deckAtermico:{ name: "Losetas atérmicas GRC — fabricación propia (m²)", unit: "m²", price: 95000 },
  innTanning: { name: "Innovación: tanning ledge", unit: "u", price: 850000 },
  innSwimbar: { name: "Innovación: swim-up bar", unit: "u", price: 1950000 },
  innCascada: { name: "Innovación: cascada sheetfall", unit: "u", price: 980000 },
  innFuente:  { name: "Innovación: fuente danzante + luces", unit: "u", price: 1400000 },
  innSolarHeat:{ name: "Innovación: calefacción solar híbrida", unit: "u", price: 1200000 },
  innAuto:    { name: "Innovación: automatización pH/ORP + app", unit: "u", price: 1850000 },
  innRgbMusic:{ name: "Innovación: luces RGB + audio sumergido", unit: "u", price: 1550000 },
  innArenaReal:{ name: "Innovación: playa de arena real", unit: "u", price: 680000 }
};

/* ------------------------------------------------------------
   PROVEEDORES — dónde se consigue cada rubro (rubro real:
   corralones, ferreterías, casas de piscina, importadores,
   viveros, vidrierías, metalúrgicas y nuestra propia fábrica).
   ------------------------------------------------------------ */
const PROVIDERS = {
  corralon:   { icon: "🧱", name: "Corralón de materiales" },
  ferreteria: { icon: "🔧", name: "Ferretería industrial" },
  piscina:    { icon: "🏊", name: "Casa de piscinas / pool shop" },
  importador: { icon: "📦", name: "Importador piletero" },
  vivero:     { icon: "🌿", name: "Vivero" },
  vidrieria:  { icon: "🪟", name: "Vidriería industrial" },
  metalurgica:{ icon: "⚙️", name: "Metalúrgica local" },
  naviera:    { icon: "🚢", name: "Vendedor de contenedores" },
  fabrica:    { icon: "🏭", name: "Nuestra fábrica (insumo)" }
};

/* mapeo rubro del presupuesto → proveedor sugerido */
const ITEM_PROVIDER = {
  excav: "corralon", hormigon: "corralon", acero: "corralon",
  imperm: "corralon", adhesivo: "corralon", copingPiedra: "corralon",
  copingLadrillo: "corralon", deckPiedra: "corralon", deckHormigon: "corralon",
  deckCesped: "vivero", grava: "corralon", plantas: "vivero",
  venecita: "importador", pastina: "fabrica", micro: "fabrica",
  grcPanel: "fabrica", copingGrc: "fabrica", deckAtermico: "fabrica",
  epdm: "importador",
  pvc: "piscina", filtro: "piscina", bomba: "piscina", bombaInf: "piscina",
  skimmer: "piscina", ret: "piscina", drain: "piscina", multiv: "piscina",
  pipol: "piscina", lucesLED: "piscina", transfLED: "piscina",
  escaleraInox: "piscina", bombaCalor: "piscina", cobertorM2: "piscina",
  ducha: "piscina", robot: "piscina", sal: "piscina", cloro: "piscina",
  contraCorriente: "piscina", kitHidro: "piscina", epoxiM2: "ferreteria",
  contenedor20: "naviera", vidrioLam: "vidrieria", estructuraElev: "metalurgica",
  copingMadera: "corralon", copingMosaico: "importador", deckMadera: "corralon",
  innTanning: "fabrica", innSwimbar: "metalurgica", innCascada: "piscina",
  innFuente: "piscina", innSolarHeat: "piscina", innAuto: "piscina",
  innRgbMusic: "piscina", innArenaReal: "corralon"
};

/* ------------------------------------------------------------
   DURACIONES DE OBRA por fase y tipo (semanas) — base del
   cronograma editable en la pestaña Obra.
   ------------------------------------------------------------ */
const PHASE_LABELS = {
  pre: "Pre-obra y relevamiento", struct: "Estructura",
  water: "Impermeab. y revestimiento", install: "Equipo e instalaciones",
  startup: "Puesta en marcha"
};

const PHASE_DURATIONS = {
  arena:        { pre: 1, struct: 3, water: 1.5, install: 0.5, startup: 0.5 },
  tradicional:  { pre: 1, struct: 3.5, water: 2, install: 0.5, startup: 0.5 },
  prefabricada: { pre: 1, struct: 0.5, water: 0.5, install: 0.5, startup: 0.5 },
  natural:      { pre: 1, struct: 2, water: 0.5, install: 0.5, startup: 2 },
  contenedor:   { pre: 1, struct: 1, water: 0.5, install: 0.5, startup: 0.5 },
  vidrio:       { pre: 1, struct: 3, water: 1.5, install: 0.5, startup: 0.5 },
  suspendida:   { pre: 1.5, struct: 4, water: 1.5, install: 1, startup: 0.5 },
  plunge:       { pre: 0.5, struct: 0.5, water: 0.5, install: 0.5, startup: 0.5 },
  endless:      { pre: 0.5, struct: 1.5, water: 1, install: 0.5, startup: 0.5 },
  spa:          { pre: 0.5, struct: 1.5, water: 1, install: 1, startup: 0.5 }
};

/* Plan de pagos por hitos (editable) */
const DEFAULT_PAYMENT_PLAN = [
  { pct: 30, label: "Anticipo (materiales y movilización)" },
  { pct: 40, label: "Estructura terminada + prueba hidráulica" },
  { pct: 30, label: "Entrega con equipo funcionando" }
];

/* ------------------------------------------------------------
   IVA DIFERENCIADO — en Argentina varios materiales de
   construcción facturan 10,5% cuando la obra está adherida al
   régimen (lista histórica RG-AFIP 83: cemento, hormigón,
   acero, ladrillos, caños, piedra…); el resto va al 21%.
   Fuera del régimen, todo 21%. Confirmá tu situación con el
   contador antes de facturar.
   ------------------------------------------------------------ */
const ITEM_IVA_REDUCIDO = [
  "hormigon", "acero", "imperm", "adhesivo", "grava",
  "copingLadrillo", "copingPiedra", "deckPiedra", "deckHormigon",
  "estructuraElev", "pipol"
];

const IVA_REGIMES = {
  general:  { label: "General — todos los productos al 21%", note: "Sin régimen de obra adherida: IVA 21% en todo." },
  reducido: { label: "Obra adherida — materiales de lista al 10,5%", note: "Materiales de la lista de construcción (cemento, hormigón, acero, ladrillos, caños, piedra…) al 10,5% · el resto 21%." }
};

function itemIVA(itemKey, regime) {
  return (regime === "reducido" && ITEM_IVA_REDUCIDO.includes(itemKey)) ? 10.5 : 21;
}

/* ------------------------------------------------------------
   BALANCE TÉRMICO — agua sin calentar por mes (litoral AR,
   temperatura media del agua a la sombra) y coeficientes de
   pérdida. Modelo simplificado de estándar de rubro:
   pérdida ≈ superficie × ΔT × k, con k en kWh/m²·día·°C.
   k descubierto ~0,20 (evapora + convecta) · con cobertor
   ~0,06 (el cobertor corta la evaporación, el 70% de la
   pérdida). La bomba de calor entrega COP≈4 (1 kWh eléctrico
   = 4 kWh de calor).
   ------------------------------------------------------------ */
const MONTHLY_WATER_TEMP = [
  { m: "Ene", t: 27 }, { m: "Feb", t: 27 }, { m: "Mar", t: 25 },
  { m: "Abr", t: 22 }, { m: "May", t: 18 }, { m: "Jun", t: 15 },
  { m: "Jul", t: 13 }, { m: "Ago", t: 15 }, { m: "Sep", t: 18 },
  { m: "Oct", t: 21 }, { m: "Nov", t: 24 }, { m: "Dic", t: 26 }
];
const THERMAL = { kUncovered: 0.20, kCover: 0.06, cop: 4, days: 30 };

/* ------------------------------------------------------------
   ÁREA CLIENTE — qué pedirle al constructor antes de firmar
   y el kit de compras de mantenimiento inicial.
   ------------------------------------------------------------ */
const CLIENT_QUESTIONS = [
  "¿Me mostrás piletas construidas por ustedes con más de 2 años de uso? (las fisuras y pérdidas aparecen al segundo año)",
  "¿La prueba de llenado de 72 horas ANTES de revestir está incluida? Es el control que separa una obra seria de un reclamo.",
  "¿Qué garantía dan por escrito? (obra: 1 a 3 años · equipos: según fabricante)",
  "¿El precio incluye bombeo de hormigón, vereda perimetral y la electricidad hasta el tablero? (el 80% de los sobrecostos nacen ahí)",
  "Para venecita: ¿aplican doble encolado? Si lo dudan, dudá vos también.",
  "¿Hacen prueba hidráulica de cañerías a 1,5× la presión de trabajo antes de tapar?",
  "¿Cuántas obras tienen en simultáneo? La tuya puede estirarse semanas si están repartidos.",
  "Forma de pago por hitos (anticipo/estructura/entrega), nunca 100% adelantado."
];

const CLIENT_KIT = [
  { item: "Kit medidor pH + cloro (DPD)", price: 25000, note: "lo primero que comprás: sin medir, es adivinar" },
  { item: "Dicloro de granulación rápida (10 kg)", price: 95000, note: "rinde 1-2 meses en 30-40 m³" },
  { item: "Correctores de pH (elevador + reductor)", price: 30000, note: "el pH se va solo; hay que traerlo de vuelta" },
  { item: "Algicida de mantenimiento (1 L)", price: 22000, note: "barato y evita el agua verde" },
  { item: "Jopi/hoja + manguera flotante", price: 28000, note: "2 minutos por día de hojas fuera" },
  { item: "Termómetro flotante", price: 8000, note: "con calefacción: sabés cuándo algo no anda" },
  { item: "Cobertor térmico (si climatizás)", price: 0, note: "obligatorio: sin él pagás el TRIPLE de electricidad — la app te lo calcula" }
];

/* profundidades predefinidas para el cliente */
const CLIENT_DEPTHS = {
  chapita: { label: "Chapita (1,0-1,3 m) — chicos y reposeras", dMin: 1.0, dMax: 1.3 },
  familiar: { label: "Familiar (1,4-1,7 m) — la que eligen 7 de 10", dMin: 1.4, dMax: 1.7 },
  nadadora: { label: "Nadadora (1,8-2,2 m) — trampoline y nado", dMin: 1.8, dMax: 2.2 }
};

/* ------------------------------------------------------------
   ZONAS — provincias y ciudades principales (para buscar
   proveedores cerca y armar los links de Google Maps/ML).
   ------------------------------------------------------------ */
const ZONES = {
  "Buenos Aires (GBA)": ["La Plata", "Mar del Plata", "Bahía Blanca", "Tigre", "Lomas de Zamora", "Quilmes", "Morón", "Pergamino", "Olavarría"],
  "CABA": ["Capital Federal"],
  "Catamarca": ["San Fernando del Valle", "Andalgalá", "Belén"],
  "Chaco": ["Resistencia", "Barranqueras", "Presidencia Roque Sáenz Peña", "Villa Ángela"],
  "Chubut": ["Rawson", "Trelew", "Comodoro Rivadavia", "Puerto Madryn", "Esquel"],
  "Córdoba": ["Córdoba Capital", "Río Cuarto", "Villa Carlos Paz", "San Francisco", "Alta Gracia"],
  "Corrientes": ["Corrientes Capital", "Goya", "Curuzú Cuatiá", "Paso de los Libres", "Mercedes", "Bella Vista", "Empedrado", "Santo Tomé"],
  "Entre Ríos": ["Paraná", "Concordia", "Gualeguaychú", "Concepción del Uruguay", "Chajarí"],
  "Formosa": ["Formosa Capital", "Clorinda", "Eldorado"],
  "Jujuy": ["San Salvador de Jujuy", "San Pedro", "Libertador Gral. San Martín"],
  "La Pampa": ["Santa Rosa", "General Pico", "Toay"],
  "La Rioja": ["La Rioja Capital", "Chilecito"],
  "Mendoza": ["Mendoza Capital", "Godoy Cruz", "San Rafael", "Maipú", "San Martín"],
  "Misiones": ["Posadas", "Oberá", "Eldorado", "Puerto Iguazú"],
  "Neuquén": ["Neuquén Capital", "Plottier", "San Martín de los Andes", "Zapala"],
  "Río Negro": ["Viedma", "Bariloche", "General Roca", "Cipolletti", "Villa Regina"],
  "Salta": ["Salta Capital", "San Ramón de la Nueva Orán", "Tartagal", "General Güemes"],
  "San Juan": ["San Juan Capital", "Rawson", "Chimbas"],
  "San Luis": ["San Luis Capital", "Villa Mercedes", "Merlo"],
  "Santa Cruz": ["Río Gallegos", "Caleta Olivia", "El Calafate"],
  "Santa Fe": ["Santa Fe Capital", "Rosario", "Rafaela", "Venado Tuerto", "Reconquista"],
  "Santiago del Estero": ["Santiago Capital", "La Banda", "Termas de Río Hondo"],
  "Tierra del Fuego": ["Ushuaia", "Río Grande", "Tolhuin"],
  "Tucumán": ["San Miguel de Tucumán", "Yerba Buena", "Concepción", "Tafí Viejo"]
};

/* ------------------------------------------------------------
   OPCIONES DE PROVEEDORES por categoría — cadenas nacionales
   REALES con cobertura aproximada, online real con links, y
   el query armado para buscar en Google Maps en tu ciudad.
   ------------------------------------------------------------ */
const SUPPLIER_OPTIONS = {
  corralon: {
    mapsQuery: "corralón de materiales",
    mlQuery: "materiales de construcción",
    chains: [
      { name: "Sodimac", type: "física", coverage: "grandes centros urbanos (CABA, GBA, Córdoba, Rosario, Mendoza, Neuquén y principales ciudades)", url: "https://www.sodimac.com.ar" },
      { name: "Easy", type: "física", coverage: "CABA, GBA y Mendoza", url: "https://www.easy.com.ar" },
      { name: "Corralón de barrio", type: "física", coverage: "en todas las ciudades — ver en Maps", maps: true }
    ],
    online: [
      { name: "MercadoLibre — materiales", url: "https://listado.mercadolibre.com.ar/materiales-construccion" },
      { name: "Sodimac online (envíos a todo el país)", url: "https://www.sodimac.com.ar" }
    ]
  },
  ferreteria: {
    mapsQuery: "ferretería industrial",
    mlQuery: "ferretería herramientas",
    chains: [
      { name: "Sodimac", type: "física", coverage: "grandes centros urbanos", url: "https://www.sodimac.com.ar" },
      { name: "Easy", type: "física", coverage: "CABA, GBA y Mendoza", url: "https://www.easy.com.ar" },
      { name: "Ferretería industrial local", type: "física", coverage: "en todas las ciudades — ver en Maps", maps: true }
    ],
    online: [
      { name: "MercadoLibre — ferretería", url: "https://listado.mercadolibre.com.ar/ferreteria" }
    ]
  },
  piscina: {
    mapsQuery: "venta de piscinas equipos",
    mlQuery: "equipos para piscinas filtros bombas",
    chains: [
      { name: "Distribuidores Sessa (fabricante argentino de bombas/filtros)", type: "física", coverage: "red de distribuidores en todo el país — ver en Maps", maps: true },
      { name: "Casa de piscinas local", type: "física", coverage: "en todas las ciudades — ver en Maps", maps: true }
    ],
    online: [
      { name: "MercadoLibre — equipos de pileta", url: "https://listado.mercadolibre.com.ar/equipos-piscina" },
      { name: "MercadoLibre — filtros para pileta", url: "https://listado.mercadolibre.com.ar/filtro-pileta" }
    ]
  },
  importador: {
    mapsQuery: "mayorista mosaicos piscinas revestimientos",
    mlQuery: "venecita mosaico pileta",
    chains: [
      { name: "Importadores mayoristas CABA (Once/Abasto)", type: "física", coverage: "concentrados en CABA con envío al interior", maps: true },
      { name: "Casa de piscinas local (pide catálogo de venecitas)", type: "física", coverage: "en todas las ciudades", maps: true }
    ],
    online: [
      { name: "MercadoLibre — venecita pileta", url: "https://listado.mercadolibre.com.ar/venecita-pileta" },
      { name: "Alibaba (importación directa por contenedor, MOG 500+ m²)", url: "https://www.alibaba.com/trade/search?SearchText=glass+mosaic+tile+pool" }
    ]
  },
  vivero: {
    mapsQuery: "vivero plantas acuáticas",
    mlQuery: "plantas acuáticas pileta",
    chains: [
      { name: "Vivero local", type: "física", coverage: "en todas las ciudades — ver en Maps", maps: true }
    ],
    online: [
      { name: "MercadoLibre — plantas acuáticas", url: "https://listado.mercadolibre.com.ar/plantas-acuaticas" }
    ]
  },
  vidrieria: {
    mapsQuery: "vidriería vidrio templado industrial",
    mlQuery: "vidrio templado laminado",
    chains: [
      { name: "Vidriería industrial local", type: "física", coverage: "en ciudades medianas y grandes — ver en Maps", maps: true },
      { name: "Fabricantes de acrílico para acuarios/piletas (Santafesina/Bonaerense)", type: "física", coverage: "envío a todo el país, cotización por medidas", maps: true }
    ],
    online: [
      { name: "MercadoLibre — vidrio templado", url: "https://listado.mercadolibre.com.ar/vidrio-templado" }
    ]
  },
  metalurgica: {
    mapsQuery: "metalmecánica estructura metálica",
    mlQuery: "estructura metálica pileta",
    chains: [
      { name: "Metalmecánica local", type: "física", coverage: "en todas las ciudades — ver en Maps", maps: true }
    ],
    online: [
      { name: "MercadoLibre — estructura metálica", url: "https://listado.mercadolibre.com.ar/estructura-metalica" }
    ]
  },
  naviera: {
    mapsQuery: "venta de contenedores marítimos usados",
    mlQuery: "contenedor marítimo usado",
    chains: [
      { name: "Depósitos de contenedores (puertos y nodos logísticos)", type: "física", coverage: "CABA/GBA, Rosario, Santa Fe, Córdoba, Bahía Blanca, Zarate — ver en Maps", maps: true }
    ],
    online: [
      { name: "MercadoLibre — contenedor usado", url: "https://listado.mercadolibre.com.ar/contenedor-usado" }
    ]
  },
  fabrica: {
    mapsQuery: "",
    mlQuery: "",
    chains: [],
    online: []
  }
};
