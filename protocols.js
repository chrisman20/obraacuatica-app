/* ============================================================
   ObraAcuática — protocols.js (VERSIÓN PÚBLICA)
   Protocolos de construcción por sistema constructivo.
   Formulaciones de fábrica: NO incluidas en esta versión.
   ============================================================ */

const PROTOCOLS = {
  arena: {
    pre: [
      { t: "Relevamiento del terreno: niveles, tipo de suelo, accesos de maquinaria, árboles cercanos (las raíces buscan agua).", cn: "CN: rozado de suelo a 1,5 m en 3 puntos para detectar rellenos." },
      { t: "Trazado con nivel láser: marcar el espejo de agua y hacia dónde drena el patio.", cn: "CN: patio con pendiente alejándose de la pileta." },
      { t: "Definir sala de máquinas: cerca del equipo, con desagüe y ventilación.", cn: "CN: distancia bomba-filtro < 6 m." }
    ],
    struct: [
      { t: "Excavación con sobreexcavación perimetral de 30-40 cm.", cn: "CN: verificar cotas de fondo con nivel." },
      { t: "Drenaje perimetral + platea de limpieza H-13 de 5 cm.", cn: "CN: caño de drenaje derivado a pozo de absorción." },
      { t: "Platea estructural H-21 e=15-20 cm con doble malla.", cn: "CN: curado húmedo 7 días." },
      { t: "Paredes de hormigón proyectado o encofrado e=12-15 cm.", cn: "CN: sin cangrejales — golpear a canto." },
      { t: "Media caña perimetral (elimina punto de fisura).", cn: "CN: media caña prolija y curada." }
    ],
    water: [
      { t: "Revoque de regularización 1:3 hidrofugado.", cn: "CN: regla de 2 m — sin huesos > 3 mm." },
      { t: "Impermeabilización en 2 manos cruzadas + malla en encuentros.", cn: "CN: prueba de llenado 72 h ANTES de revestir." },
      { t: "Revestimiento cementicio (2 capas de 2-3 mm).", cn: "CN: curado húmedo 48 h." },
      { t: "Coping de piedra asentada con mortero 1:3.", cn: "CN: junta con poliuretano." }
    ],
    install: [
      { t: "Skimmer(s) en pared opuesta a retornos, cañerías con pendiente.", cn: "CN: prueba de presión 1,5x durante 24 h." },
      { t: "Sala de máquinas: bomba, filtro, tablero con diferencial 30 mA.", cn: "CN: todo eléctrico a > 1,5 m del borde." }
    ],
    startup: [
      { t: "Lavado de cañerías + llenado suave.", cn: "CN: el primer tapón de suciedad mata impelencias." },
      { t: "Filtración continua 48 h + corrección química.", cn: "CN: medición completa al día 3." }
    ],
    maint: [{ t: "Chequeo anual: juntas, manómetro, prueba de estanqueidad." }],
    winter: [{ t: "Nivel bajo skimmers, purga de circuito, lona, algicida." }]
  },
  tradicional: {
    pre: [
      { t: "Estudio del suelo + niveles. Definir hormigón armado o mampostería reforzada.", cn: "CN: mampostería solo hasta ~30 m³." },
      { t: "Plano de replanteo con cotas interiores terminadas." }
    ],
    struct: [
      { t: "Excavación + drenaje + platea limpieza + membrana.", cn: "CN: el 80% de las piletas fisuradas falló en el apoyo." },
      { t: "Platea H-21 + paredes e=15 cm.", cn: "CN: curado húmedo 7 días." },
      { t: "Vaciado escalera, pases embutidos con camisas.", cn: "CN: PRUEBA HIDRÁULICA antes de tapar." }
    ],
    water: [
      { t: "Revoque 1:3 hidrofugado + media caña.", cn: "CN: dejar 10-15 días de fraguado." },
      { t: "Impermeabilización cementicia en 2 manos.", cn: "CN: prueba de llenado 72 h." },
      { t: "Encolado venecita a DOBLE ENCOLADO.", cn: "CN: sin huecos — golpear, sonido a hueco se rehace." },
      { t: "Fragüe con pastina de pileta (NO de construcción).", cn: "CN: curado 48 h antes del primer llenado." }
    ],
    install: [{ t: "Idem protocolo Bali.", cn: "CN: skimmer cada 25-40 m²." }],
    startup: [{ t: "Lavado + llenado + filtración 48 h + química.", cn: "CN: turbiedad inicial es lechada de fragüe." }],
    maint: [{ t: "Anual: juntas, coping, manómetro, medidor de agua.", cn: "CN: pérdida > 3 cm/semana = investigar." }],
    winter: [{ t: "Idem Bali: nunca vaciar del todo en suelo arcilloso." }]
  },
  prefabricada: {
    pre: [
      { t: "Definir formato del catálogo (3x6, 4x8, 5x10).", cn: "CN: cada formato nuevo = nuevo molde." },
      { t: "Relevamiento de obra: platea y servidumbres listas ANTES del camión." }
    ],
    struct: [
      { t: "Platea H-21 con anclajes pre-posicionados, tolerancia ±5 mm.", cn: "CN: nivelación milimétrica innegociable." },
      { t: "Paneles GRC anclados, aplomados con calzas, junta 15-20 mm.", cn: "CN: control de plomo cada 2 paneles." },
      { t: "Sellado de juntas: malla + mortero polímero + banda elastomérica.", cn: "CN: prueba hidráulica de juntas antes del relleno." },
      { t: "Relleno perimetral compactado alternando con llenado de agua.", cn: "CN: diferencia agua-relleno siempre < 30 cm." }
    ],
    water: [{ t: "Cara vista terminada del molde — solo sellado de pases.", cn: "CN: muestra de color aprobada ANTES de la tanda." }],
    install: [{ t: "Hidráulica pre-instalada: solo conectar y probar.", cn: "CN: prueba de presión integral 24 h." }],
    startup: [{ t: "Llenado gradual + arranque + química.", cn: "CN: primer mes revisar juntas selladas." }],
    maint: [{ t: "Anual: juntas, anclajes, relleno perimetral." }],
    winter: [{ t: "Purga de circuito, lona, nivel bajo skimmers." }]
  },
  natural: {
    pre: [
      { t: "Diseño con zona de natación (60-70%) y regeneración (30-50%).", cn: "CN: relación mínima 1:1 en clima cálido." },
      { t: "Elección del sellado: EPDM 1,5 mm, GCL bentonita, o arcilla.", cn: "CN: solapes de 30-50 cm LEJOS de esquinas." }
    ],
    struct: [
      { t: "Excavación con taludes suaves (1:2 mínimo).", cn: "CN: lecho de arena + geotextil bajo el EPDM." },
      { t: "Tendido del EPDM con solapes soldados.", cn: "CN: PRUEBA DE LLENADO por etapas." },
      { t: "Gravas por capas en zona de regeneración.", cn: "CN: gravas LAVADAS de cantera." },
      { t: "Plantación: 2-3 plantas/m².", cn: "CN: esperar 4-8 semanas de maduración." }
    ],
    water: [{ t: "Zona de nado puede llevar recubrimiento cementicio sobre EPDM.", cn: "CN: validar en muestra 1x1 m." }],
    install: [{ t: "Bomba de baja velocidad + cañerías de gran diámetro.", cn: "CN: timer 8-12 h/día en verano." }],
    startup: [{ t: "Llenado + circulación + paciencia (2-4 semanas verdes iniciales).", cn: "CN: NO clorar — mata el biofilm." }],
    maint: [{ t: "Poda 2-3 veces/año + retiro de hojas.", cn: "CN: nunca dejar recortes en el agua." }],
    winter: [{ t: "Bajar ritmo a 4-6 h/día. NO vaciar.", cn: "CN: sistema invernado lleno arranca con biología viva." }]
  },
  contenedor: {
    pre: [
      { t: "Compra del contenedor: inspección ANTES de comprar.", cn: "CN: rechazar contenedores con reparaciones o olor a químico." },
      { t: "Definir emplazamiento: apoyada, enterrada o mixta.", cn: "CN: enterrada = anclaje antiflotación OBLIGATORIO." }
    ],
    struct: [
      { t: "Refuerzo estructural: perfiles UPN cada 60-80 cm + viga puntera.", cn: "CN: cálculo por presión hidrostática de 12-15 kPa." },
      { t: "Arenado Sa 2,5 + imprimación epoxi.", cn: "CN: test de adherencia por corte." },
      { t: "Pases hidráulicos con camisa soldada estanca.", cn: "CN: prueba de estanqueidad a 1 bar." },
      { t: "Izaje y colocación con grúa, nivelación ±3 mm.", cn: "CN: nivel en las dos diagonales." }
    ],
    water: [
      { t: "Revestimiento interior: epoxi 100% sólidos o liner PVC.", cn: "CN: con epoxi, curado total 7 días antes del llenado." },
      { t: "Deck perimetral + barandas.", cn: "CN: baranda en todo el borde libre." }
    ],
    install: [{ t: "Equipo en gabinete dentro del módulo.", cn: "CN: separar con tabique estanco." }],
    startup: [{ t: "Llenado por etapas verificando paredes.", cn: "CN: inspector presente en primer llenado." }],
    maint: [{ t: "Anual: sellados, epoxi línea de agua, anclajes." }],
    winter: [{ t: "Nivel bajo skimmers. Enterrada en zona de napa: JAMÁS vaciar." }]
  },
  vidrio: {
    pre: [
      { t: "Definir el paño: lateral, lateral + infinito, o fondo total.", cn: "CN: vidrio laminado hasta 1,2 m / acrílico sobre eso." },
      { t: "Cálculo estructural del paño Y de la perfilería.", cn: "CN: ingeniería firmada." }
    ],
    struct: [
      { t: "Hormigón en lados ciegos + bancada/perfilería de apoyo.", cn: "CN: tolerancia de bancada ±2 mm." },
      { t: "Junta en U con neopeno + cámara de sellado.", cn: "CN: doble sello estructural." },
      { t: "Montaje del paño con ventosas, asentado sobre calzas.", cn: "CN: sin punto duro bajo el vidrio." }
    ],
    water: [
      { t: "Impermeabilización de lados de hormigón.", cn: "CN: membrana termina DENTRO de la cámara del paño." },
      { t: "Revestimiento de lados ciejos.", cn: "CN: fondo oscuro realza el efecto acuario." }
    ],
    install: [{ t: "Luces LED enfocadas HACIA el paño.", cn: "CN: luces del lado opuesto." }],
    startup: [
      { t: "Llenado por etapas con inspección del paño en cada nivel.", cn: "CN: deflexión admisible según ficha del fabricante." }
    ],
    maint: [{ t: "Limpieza del paño con esponja y detergente neutro.", cn: "CN: revisar bordes por delaminación." }],
    winter: [{ t: "Dejar aire entre cobertor y vidrio." }]
  },
  suspendida: {
    pre: [
      { t: "Cálculo estructural completo con memoria firmada.", cn: "CN: carga de proyecto 1,5 t/m² mínimo." },
      { t: "Verificación del edificio base.", cn: "CN: relevar con plano estructural o sondeos." }
    ],
    struct: [
      { t: "Estructura de apoyo metálica con anclajes verificados.", cn: "CN: prueba de carga de anclajes." },
      { t: "Cuba: hormigón sobre bandeja colaborante, paneles GRC + liner, o contenedor.", cn: "CN: privilegiar sistemas livianos." },
      { t: "Impermeabilización DOBLE.", cn: "CN: cámara de inspección permanente con drenaje." }
    ],
    water: [{ t: "Grating perimetral de rebalse.", cn: "CN: el rebalse es funcional Y de seguridad." }],
    install: [
      { t: "Doble circulación + bombas con aislación antivibratoria.", cn: "CN: nivel sonoro < 35 dB en ambiente inferior." },
      { t: "Pararrayos + puesta a tierra.", cn: "CN: medición de resistencia con telurómetro." }
    ],
    startup: [{ t: "Llenado con monitoreo de deflectometría.", cn: "CN: flecha > 1,15× teórica = detener." }],
    maint: [{ t: "Semestral: cámara de inspección, anclajes, liner." }],
    winter: [{ t: "Nunca vaciar del todo en altura — viento sobre cuba liviana." }]
  },
  plunge: {
    pre: [{ t: "Definir: monobloque GRC de fábrica u obra in situ.", cn: "CN: el monobloque es el producto estrella." }],
    struct: [
      { t: "Platea simple + monobloque izado con grúa.", cn: "CN: prueba de fábrica de cada unidad." },
      { t: "Conexión rápida: kit de cartucho monobloque." }
    ],
    water: [{ t: "Terminación sale del molde — solo sellado de pases." }],
    install: [{ t: "Kit cartucho monobloque.", cn: "CN: borde antiderrapante de fábrica." }],
    startup: [{ t: "Llenado + arranque.", cn: "CN: volúmenes chicos: dosificar la MITAD." }],
    maint: [{ t: "Medir cada 2 días en uso. Cartucho semanal." }],
    winter: [{ t: "Cobertor rígido + vaciar el 30% si hay helada fuerte." }]
  },
  endless: {
    pre: [
      { t: "Formato: 3,5-5 × 2-2,5 m, profundidad uniforme 1,2-1,4 m.", cn: "CN: acceso eléctrico 1,5-2,2 HP dedicado." },
      { t: "Elegir: contracorriente empotrado vs portátil.", cn: "CN: el empotreo se define ANTES del hormigón." }
    ],
    struct: [
      { t: "Obra: platea + paredes o monobloque GRC con nicho del jet.", cn: "CN: nicho con camisa estanca y fijaciones ancladas." },
      { t: "Rebalse ancho en pared opuesta al jet.", cn: "CN: grating en el 60-80% de la pared opuesta." }
    ],
    water: [{ t: "Revestimiento + línea de nado en el fondo." }],
    install: [{ t: "Montaje del contracorriente con junta EPDM.", cn: "CN: prueba de caudal del jet." }],
    startup: [{ t: "Puesta a punto del caudal con nadador real." }],
    maint: [{ t: "Mensual: bridas, sellado del jet, reja de aspiración." }],
    winter: [{ t: "Desmontar propulsor portátil / verificar cámara empotrada." }]
  },
  spa: {
    pre: [
      { t: "Definir: prefabricado de acrílico u obra de hormigón aislada.", cn: "CN: prever los 3 servicios (agua, desagüe, trifásica)." }
    ],
    struct: [
      { t: "Hormigón armado con AISLACIÓN TÉRMICA total (EPS 5 cm).", cn: "CN: la aislación se interrumpe en NINGÚN punto." },
      { t: "Banca y asientos moldeados con nichos para jets.", cn: "CN: probar ergonomía con personas reales." }
    ],
    water: [{ t: "Revestimiento: microcemento o venecita color oscuro.", cn: "CN: sellado perimetral elastomérico de jets." }],
    install: [
      { t: "Tres circuitos: filtración + jets + blower.", cn: "CN: succión antivórtice DOBLE obligatoria." },
      { t: "Calefacción + cobertor rígido.", cn: "CN: sin cobertor, pérdida de 2-3 °C por noche." }
    ],
    startup: [{ t: "Subida gradual 2-3 °C/día.", cn: "CN: revisar sellados a los 7 días a 36-38 °C." }],
    maint: [
      { t: "Mensual: drenaje parcial + limpieza de línea de grasa.", cn: "CN: jets con olor a humedad = biofilm — purga." }
    ],
    winter: [{ t: "Si se usa: standby 20°C + cobertor. Si no: drenaje total." }]
  },
  infinity: {
    pre: [
      { t: "El borde infinito ES NIVEL: relevamiento topográfico con ±5 mm.", cn: "CN: una arista 3 mm torcida se ve el primer día." }
    ],
    struct: [
      { t: "Pared del weir en hormigón armado con doble armadura.", cn: "CN: arista superior enrasada con regla + láser." },
      { t: "Canaleta de recolección con pendiente 1%.", cn: "CN: sección calculada para caudal + lluvia." },
      { t: "Estanque compensador: 5-10% del volumen + flotante eléctrico.", cn: "CN: SIN reposición automática = bomba fundida." }
    ],
    water: [{ t: "Impermeabilizar canaleta y estanque.", cn: "CN: prueba de llenado antes de cerrar." }],
    install: [
      { t: "Dos circuitos: filtración + compensación.", cn: "CN: bomba de compensación por caudal moderado." },
      { t: "Puesta a punto del nivel.", cn: "CN: demasiado caudal = ruido + pérdida de agua." }
    ],
    startup: [{ t: "Capacitar: el sistema consume agua extra por evaporación del film." }],
    maint: [{ t: "Semanal: canaleta + flotante. Mensual: arista sin calcáreo." }],
    winter: [{ t: "Purga de compensación + estanque al mínimo + lona." }]
  }
};

/* ============================================================
   VERSIÓN PÚBLICA — formulaciones y moldes NO incluidos.
   Contacto: obraacuatica.com
   ============================================================ */
const FACTORY_FORMULAS = {
  locked: {
    name: "🔒 Formulaciones — versión completa",
    batchBase: 1, rend: "Disponible en la versión para fabricantes",
    components: [], water: "", notes: ["Contactanos para acceso a las formulaciones exactas."]
  }
};

const MOLDS_GUIDE = [
  { k: "🔒", v: "Guía de moldes disponible en la versión completa." }
];
