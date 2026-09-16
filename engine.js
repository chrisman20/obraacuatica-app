/* ============================================================
   ObraAcuática — engine.js
   Motor de cálculo puro: geometría, hidráulica, materiales,
   borde infinito, química y presupuesto.
   La lógica de superficies replica el Excel "pileta 4x8 simil
   Bali" (solarium interno 3x4, muro drop, escalera, desperdicio).
   ============================================================ */

const Engine = (() => {

  /* ---------- helpers ---------- */
  const r1 = x => Math.round(x * 10) / 10;
  const r2 = x => Math.round(x * 100) / 100;
  const fmt = x => x.toLocaleString("es-AR", { maximumFractionDigits: 2 });
  const fmtARS = x => "$ " + Math.round(x).toLocaleString("es-AR");
  const ceil1 = x => Math.ceil(x * 10) / 10;

  /* perímetro según forma */
  function perimeter(shape, L, W) {
    switch (shape) {
      case "oval": {
        // Ramanujan para elipse de semiejes L/2, W/2
        const a = L / 2, b = W / 2;
        const h = ((a - b) ** 2) / ((a + b) ** 2);
        return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
      }
      case "roman": return 2 * (L + W) * 1.05; // escaleras romanas agregan borde
      case "free": return 2 * (L + W) * 1.15;  // curvas orgánicas suman desarrollo
      default: return 2 * (L + W);
    }
  }

  /* factor de área para formas curvas (piso equivalente) */
  function areaFactor(shape) {
    if (shape === "oval") return Math.PI / 4;     // elipse / rect
    if (shape === "free") return 0.95;            // curvas restan esquinas
    return 1;
  }

  /* ------------------------------------------------------------
     ESTADO DE CONFIGURACIÓN (lee el DOM)
     ------------------------------------------------------------ */
  function readConfig() {
    const type = document.querySelector("#typeCards .ts-card.selected")?.dataset.type || "arena";
    const tdef = POOL_TYPES.find(t => t.id === type) || POOL_TYPES[0];
    const borderType = val("fBorderType") || "skimmer";
    const BT = {
      skimmer: { inf: false, sides: 1 },
      rebose: { inf: true, sides: 4 },
      infinity1: { inf: true, sides: 1 },
      infinityP: { inf: true, sides: 4 }
    }[borderType];
    const cfg = {
      type, tdef,
      shape: val("fShape"),
      L: num("fLen", 8), W: num("fWidth", 4),
      dMin: num("fDepthMin", 1.0), dMax: num("fDepthMax", 1.7),
      solarium: chk("fSolarium"), solW: num("fSolW", 3),
      use: val("fUse"),
      borderType, infinity: BT.inf, infSides: BT.sides,
      terrain: val("fTerrain"),
      copingType: val("fCopingType"),
      deck: chk("fDeck"), deckW: num("fDeckW", 2), deckMat: val("fDeckMat") || "madera",
      finish: val("fFinish"),
      waste: num("fWaste", 8) / 100,
      boxM2: num("fBoxM2", 2.07),
      filter: val("fFilter") || "arena",
      sanitizer: val("fSanitizer") || "cl",
      lights: chk("fLights"), ladder: chk("fLadder"),
      heat: chk("fHeat"), cover: chk("fCover"),
      shower: chk("fShower"), robot: chk("fRobot"),
      innovations: [...document.querySelectorAll("#innChips .chip.on")].map(c => c.dataset.id)
    };

    // el finish puede no ser compatible con el tipo → fallback
    if (!tdef.finishes.includes(cfg.finish)) cfg.finish = tdef.finishes[0];

    // ajustes por tipo
    if (tdef.natural) { cfg.filter = "bio"; }
    return cfg;
  }

  const val = id => document.getElementById(id)?.value;
  const num = (id, d) => { const v = parseFloat(val(id)); return isNaN(v) ? d : v; };
  const chk = id => document.getElementById(id)?.checked;

  /* ------------------------------------------------------------
     GEOMETRÍA — superficies y volumen
     ------------------------------------------------------------ */
  function computeGeometry(cfg) {
    const { L, W, shape, dMin, dMax, solarium, solW } = cfg;
    const g = {};

    g.floorArea = r2(L * W * areaFactor(shape));
    g.perimeter = r2(perimeter(shape, L, W));

    // profundidad media de paredes (zona nado)
    const dAvg = (dMin + dMax) / 2;

    if (solarium && solW < L - 1) {
      // lógica del Excel 4x8: solarium interno en un extremo a 0,30 m
      g.solArea = r2(solW * W * areaFactor(shape));
      g.swimLen = r1(L - solW);
      g.swimArea = r2(g.swimLen * W * areaFactor(shape));
      // paredes: solarium a 0,30 · nado a altura media · muro drop (fondo nado − 0,30)
      g.wallsSol = r2((W + 2 * solW) * 0.30);
      g.wallsSwim = r2((W + 2 * g.swimLen) * dAvg);
      g.dropWall = r2(W * Math.max(0.4, dMin - 0.30));
      g.stairs = r2(3 * (0.30 + 0.35) * Math.min(1.2, W / 3));
      g.wallArea = r2(g.wallsSol + g.wallsSwim + g.dropWall + g.stairs);
      // volumen: solarium a 0,30 + zona de nado a profundidad media
      g.volume = r2(g.solArea * 0.30 + g.swimArea * dAvg);
    } else {
      g.solArea = 0; g.swimLen = L; g.swimArea = g.floorArea;
      g.wallsSwim = r2(g.perimeter * dAvg);
      g.wallsSol = 0; g.dropWall = 0; g.stairs = r2(3 * (0.30 + 0.35) * Math.min(1.2, W / 3));
      g.wallArea = r2(g.wallsSwim + g.stairs);
      g.volume = r2(g.floorArea * dAvg);
    }

    g.surfacTotal = r2(g.floorArea + g.wallArea);          // a revestir neto
    g.surfacBuy = r2(g.surfacTotal * (1 + cfg.waste));      // con desperdicio
    g.liters = Math.round(g.volume * 1000);
    g.copingML = r2(g.perimeter);                           // se recalcula si infinito
    if (cfg.infinity) {
      const side = cfg.infSides >= 4 ? g.perimeter : (cfg.infSides === 2 ? (L + W) : L);
      g.copingML = r2(g.perimeter - side);
      g.weirLen = r2(side);
    } else g.weirLen = 0;

    //Warnings geométricos
    g.warns = [];
    if (dMax < dMin) g.warns.push("La profundidad máxima es menor que la mínima — revisá los valores.");
    if (solarium && solW >= L - 1) g.warns.push("El solarium es casi tan largo como la pileta: reducir ancho de solarium o desmarcarlo.");
    if (dAvg > 0 && g.volume / g.surfacTotal > 1.8) g.warns.push("Relación volumen/superficie alta: verificá que las profundidades no estén duplicadas.");
    if (shape === "oval" || shape === "free") g.warns.push("Forma curva: las medidas L×W son la caja envolvente; el perímetro y área ya llevan el factor de forma aplicado.");
    if (cfg.infinity && cfg.terrain === "flat") g.warns.push("Borde infinito en terreno plano: hay que generar el desnivel con estructura elevada (encarece la pared del weir).");

    return g;
  }

  /* ------------------------------------------------------------
     HIDRÁULICA — recambio, caudal, bomba, filtro, accesorios
     ------------------------------------------------------------ */
  const TURNOVER_BY_USE = { res: null, semi: 4, pub: 3 }; // null = usa el del tipo
  const PUMP_TABLE = [
    { maxQ: 6, hp: 0.5 }, { maxQ: 9, hp: 0.75 }, { maxQ: 13, hp: 1.0 },
    { maxQ: 18, hp: 1.5 }, { maxQ: 24, hp: 2.0 }, { maxQ: 32, hp: 2.5 }, { maxQ: 99, hp: 3.0 }
  ];
  // área filtrante aproximada de filtros de arena/vidrio comerciales por diámetro
  const FILTER_SIZES = [
    { d: 450, area: 0.16, maxQ: 8 }, { d: 500, area: 0.20, maxQ: 10 },
    { d: 600, area: 0.28, maxQ: 14 }, { d: 750, area: 0.44, maxQ: 22 },
    { d: 900, area: 0.64, maxQ: 32 }
  ];

  function computeHydraulics(cfg, geo) {
    const h = {};
    const natural = cfg.tdef.natural;

    // 1) recambio (turnover) y caudal
    h.turnover = natural ? 36 : (TURNOVER_BY_USE[cfg.use] || cfg.tdef.turnoverH || 6);
    h.flow = r2(geo.volume / h.turnover);              // m³/h necesarios
    h.flowDesign = r2(h.flow * 1.1);                   // +10% de margen

    // 2) bomba principal (por curva aproximada + pérdida de carga estimada)
    h.headEst = 8 + (natural ? 2 : 4);                 // m columna de agua estimada (casa de máquinas cercana)
    const pump = PUMP_TABLE.find(p => h.flowDesign <= p.maxQ) || PUMP_TABLE[PUMP_TABLE.length - 1];
    h.pumpHP = natural ? 0.5 : pump.hp;

    // 3) filtro
    const fs = FILTER_SYSTEMS[cfg.filter];
    h.filterName = fs.name;
    if (cfg.filter === "cartucho") {
      // dimensionar por capacidad de cartucho (m² de tela cada ~0,7 m³/h)
      h.cartArea = r1(h.flowDesign / 0.7);
      h.filterDesc = `Cartucho(s) de ${h.cartArea} m² de tela equivalente`;
    } else if (cfg.filter === "diatomeas") {
      h.deKg = r2(h.flowDesign * 0.6 / 10) || 0.5;     // precoat aprox 0,6 kg por m² de tela /10 normalizado
      h.filterDesc = `Equipo DE para ${h.flowDesign} m³/h · precoat ~${(h.flowDesign * 0.08).toFixed(1)} kg por carga`;
    } else {
      const vel = fs.velFiltr || 40;
      h.filterArea = r2(h.flowDesign / vel);
      const size = FILTER_SIZES.find(s => h.flowDesign <= s.maxQ) || FILTER_SIZES[FILTER_SIZES.length - 1];
      h.filterD = size.d;
      h.filterDesc = `Filtro Ø ${size.d} mm (${r2(size.area)} m² de lecho) · velocidad real ${r1(h.flowDesign / size.area)} m/h`;
      h.mediaKg = Math.round(size.area * 1400);        // lecho cargado típico (sílica ≈ 1,4 t/m³ × ~1 m de altura)
    }

    // 4) accesorios
    h.skimmers = natural ? 1 : Math.max(1, Math.ceil(geo.floorArea / 35));
    h.returns = Math.max(2, Math.ceil(geo.perimeter / 3.5));
    h.drain = 1;
    h.vacuum = 1;
    if (cfg.infinity) h.skimmers = 0; // el rebalse reemplaza skimmers en los lados del weir

    // 5) cañería principal por caudal (velocidad < 1,5-2 m/s)
    const q = h.flowDesign;
    h.pipeMM = q <= 6 ? 50 : q <= 10 ? 63 : q <= 18 ? 75 : 90;
    h.pipeLen = r1(geo.perimeter * 0.6 + 18);          // ida + vuelta + sala de máquinas

    // 6) diario de operación
    h.filtHoursDay = natural ? 12 : Math.max(4, Math.ceil(h.turnover));
    h.backwashL = fs.backwashL || 0;
    h.makeupNote = natural
      ? "Solo reposición de evaporación + top-up de lluvia"
      : `Retrolavado ~${h.backwashL} L por ciclo · evaporación estival 3-5 mm/día`;

    // 7) borde infinito
    if (cfg.infinity) {
      const wind = 1.3; // margen viento
      h.infFlow = r2(geo.weirLen * 2.0 * wind);        // 2 m³/h por m de weir + margen → lámina plena
      h.infPumpHP = h.infFlow <= 4 ? 0.5 : h.infFlow <= 8 ? 0.75 : h.infFlow <= 14 ? 1.0 : 1.5;
      h.basinPct = 7;                                  // 5-10% del volumen
      h.basinVol = r2(geo.volume * 0.07 + 300 / 1000); // + lámina de guardia aprox
      h.basinDim = basinDims(h.basinVol);
      h.gratingM = r2(geo.weirLen);
    }

    // 8) detalles y confort
    h.lights = cfg.lights ? Math.max(1, Math.ceil(cfg.L / 4)) : 0;   // 1 LED cada 4 m de largo
    if (h.lights) h.transformers = Math.ceil(h.lights / 3);          // 1 transformador cada 3 luces
    if (cfg.heat) {
      // sizing de bomba de calor por volumen (ΔT 10 °C, arranque estándar)
      const v = geo.volume;
      h.heatKW = v <= 10 ? 9 : v <= 25 ? 13 : v <= 45 ? 19 : v <= 70 ? 26 : v <= 100 ? 35 : 45;
    }
    if (cfg.type === "endless") h.ccFlow = "60-110 m³/h regulable";  // contracorriente
    return h;
  }

  function basinDims(vol) {
    // estanque prismático típico: prof 1,2 m → superficie necesaria
    const surf = vol / 1.2;
    const w = r1(Math.sqrt(surf / 2.5));               // relación 2,5:1
    const l = r1(w * 2.5);
    return `${w} × ${l} × 1,2 m`;
  }

  /* ------------------------------------------------------------
     MATERIALES — revestimiento y consumos
     ------------------------------------------------------------ */
  function computeMaterials(cfg, geo) {
    const m = {};
    const f = FINISHES[cfg.finish] || FINISHES.venecita;
    m.finishName = f.name;
    m.surfacBuy = geo.surfacBuy;

    if (cfg.finish === "venecita") {
      m.boxes = Math.ceil(geo.surfacBuy / (cfg.boxM2 || f.boxM2 || 2.07));
      m.plates = Math.ceil(geo.surfacBuy / 0.09);      // placas 30x30 aprox
    }
    if (f.adherKgM2 > 0) {
      m.adhKg = Math.ceil(geo.surfacBuy * f.adherKgM2);
      m.adhBags = Math.ceil(m.adhKg / 30);
    }
    if (f.pastinaKgM2 > 0) {
      m.pastKg = Math.ceil(geo.surfacBuy * f.pastinaKgM2);
      m.pastBags = Math.ceil(m.pastKg / 10);
    }
    if (cfg.finish === "micro" || cfg.finish === "cemento-arena") {
      m.microKg = Math.ceil(geo.surfacBuy / 0.55);     // rendimiento medio 0,55 m²/kg
    }

    // impermeabilización (todos menos geo/grc-integrado)
    if (!["geo", "grc-integrado"].includes(cfg.finish)) {
      m.impKg = Math.ceil(geo.surfacTotal * 2.2);      // 2 manos cruzadas + encuentros
      m.impBags = Math.ceil(m.impKg / 25);
    }

    // coping
    if (cfg.copingType !== "none" && geo.copingML > 0.2) {
      m.copingML = geo.copingML;
      if (cfg.copingType === "grc") m.copingPieces = Math.ceil(geo.copingML / 0.5); // losas 50 cm
    }

    // solarium seco / deck perimetral
    if (cfg.deck && cfg.deckW > 0) {
      m.deckArea = r2((geo.perimeter * cfg.deckW + 4 * cfg.deckW * cfg.deckW) * 1.05); // +5% cortes
      m.deckMat = DECK_MATERIALS[cfg.deckMat]?.name || "";
    }

    // estructura estimada por tipo (volumetría indicativa para presupuesto)
    const wallT = 0.15, floorT = 0.18;
    if (cfg.type === "tradicional" || cfg.type === "arena") {
      m.hormigonM3 = r1(geo.wallArea * wallT + geo.floorArea * floorT + 1);
      m.aceroKg = Math.round(m.hormigonM3 * 85);       // ~85 kg/m³ doble malla
      m.excavM3 = r1(geo.volume * 1.45);
    }
    if (cfg.type === "prefabricada" || cfg.type === "plunge") {
      m.grcM2 = r2(geo.wallArea + geo.floorArea);
      m.hormigonM3 = r1(geo.floorArea * 0.15 + 0.5);
      m.aceroKg = Math.round(m.hormigonM3 * 60);
      m.excavM3 = r1(geo.volume * 1.45);
    }
    if (cfg.type === "natural") {
      m.epdmM2 = r2((geo.floorArea + geo.wallArea) * 1.25);         // solapes y anclajes
      m.regArea = r2(geo.floorArea * 0.45);                          // zona de regeneración 45%
      m.gravelM3 = r1(m.regArea * 0.6);
      m.plantPacks = Math.max(2, Math.ceil(m.regArea * 2.5 / 10));
      m.excavM3 = r1(geo.volume * 1.5);
    }
    if (cfg.type === "contenedor") {
      m.container = geo.L > 8 ? "40ft" : "20ft";
      m.epoxiM2 = r2(geo.surfacTotal * 1.05);                        // interior + refuerzos
      m.aceroKg = Math.round(geo.perimeter * 45);                    // refuerzos UPN + puntera
      m.excavM3 = r1(geo.volume * 1.5);                              // solo si va enterrada
    }
    if (cfg.type === "vidrio") {
      // paño lateral en pared larga: largo × profundidad media + marcos
      m.glassM2 = r2(cfg.L * ((cfg.dMin + cfg.dMax) / 2) * 1.05);
      m.hormigonM3 = r1(geo.wallArea * 0.75 * wallT + geo.floorArea * floorT + 1); // 3 lados hormigón
      m.aceroKg = Math.round(m.hormigonM3 * 90);
      m.excavM3 = r1(geo.volume * 1.45);
    }
    if (cfg.type === "suspendida") {
      m.estructuraM2 = r2(geo.floorArea);                            // acero de apoyo por m² de espejo
      m.hormigonM3 = r1(geo.wallArea * wallT + geo.floorArea * 0.13);
      m.aceroKg = Math.round(m.hormigonM3 * 95);
    }
    if (cfg.type === "endless" || cfg.type === "spa") {
      m.hormigonM3 = r1(geo.wallArea * wallT + geo.floorArea * floorT + 1);
      m.aceroKg = Math.round(m.hormigonM3 * 85);
      m.excavM3 = r1(geo.volume * 1.45);
    }

    // hidráulica → ítems para presupuesto
    return m;
  }

  /* ------------------------------------------------------------
     QUÍMICA — correcciones
     ------------------------------------------------------------ */
  function computeChemistry(vol, measured) {
    const out = [];
    const m = measured;

    // alcalinidad primero (arrastre del pH)
    if (m.alk < 80) {
      const g = Math.round(vol * ((80 - m.alk) / 10) * CHEM_DOSING.raiseAlk.perM3Per10);
      out.push({ sev: "warn", title: "Alcalinidad baja — subir PRIMERO esto", txt: `${fmt(g)} g de bicarbonato de sodio (sube ~${80 - m.alk} ppm). ${CHEM_DOSING.raiseAlk.note}` });
    } else if (m.alk > 120) {
      out.push({ sev: "warn", title: "Alcalinidad alta", txt: `Bajarla exige ácido muriático en dosis fraccionadas + aeración (proceso en 2-3 días). Bajá primero el pH a 7,0 con ${fmt(vol * 8)} ml de ácido, aireá (cascada/skimmer) y repetí hasta alcalinidad objetivo. No intentes hacerlo en un solo día.` });
    }

    // pH
    const dpH = r2(7.4 - m.ph);
    if (dpH > 0.15) {
      const g = Math.round(vol * dpH * 10 * CHEM_DOSING.raisePH.perM3Per01);
      out.push({ sev: "bad", title: `pH bajo (${m.ph}) — subir a 7,4`, txt: `${fmt(g)} g de carbonato de sodio. ${CHEM_DOSING.raisePH.note}` });
    } else if (dpH < -0.15) {
      const ml = Math.round(vol * (-dpH) * 10 * CHEM_DOSING.lowerPH.perM3Per01);
      out.push({ sev: "bad", title: `pH alto (${m.ph}) — bajar a 7,4`, txt: `${fmt(ml)} ml de ácido muriático 31%. ${CHEM_DOSING.lowerPH.note}` });
    } else {
      out.push({ sev: "ok", title: "pH en rango", txt: `Mantenelo en 7,2-7,6 (ideal 7,4). Medilo 2-3 veces por semana en temporada.` });
    }

    // cloro
    if (m.cl < 1) {
      const g = Math.round(vol * CHEM_DOSING.shock.perM3);
      out.push({ sev: "bad", title: "Cloro libre bajo — riesgo real", txt: `Supercloración: ${fmt(g)} g de hipoclorito de calcio 65% (≈ +5 ppm). Al atardecer, sin bañistas, filtrar 8 h. ${CHEM_DOSING.shock.note}` });
    } else if (m.cl > 3) {
      out.push({ sev: "warn", title: "Cloro libre alto", txt: `Sobre 3 ppm desperdiciás producto y en venecita clara puede decolorar juntas. Dejar de dosificar y dejar que baje solo (o diluir si hay exceso grande).` });
    } else {
      out.push({ sev: "ok", title: "Cloro en rango", txt: "Residual correcto. Medir junto con pH siempre." });
    }

    // dureza
    if (m.hard < 200) {
      const g = Math.round(vol * ((250 - m.hard) / 50) * CHEM_DOSING.raiseHard.perM3Per50);
      out.push({ sev: "warn", title: "Dureza baja — el agua está disolviendo tu revestimiento", txt: `${fmt(g)} g de cloruro de calcio (objetivo 250-300 ppm). ${CHEM_DOSING.raiseHard.note}` });
    } else if (m.hard > 500) {
      out.push({ sev: "warn", title: "Dureza alta", txt: `Sobre 500 ppm incrusta en venecita, juntas y serpentin del calefactor. Dilución con agua blanda o secuestrante de calcio como paliativo.` });
    }

    // cianúrico
    if (m.cya > 70) {
      const pct = Math.round((m.cya - 50) / m.cya * 100);
      out.push({ sev: "warn", title: `Cianúrico alto (${m.cya} ppm)`, txt: `Cloro bloqueado. Reemplazar ~${pct}% del volumen con agua nueva (el CYA no se filtra ni se evapora). ${CHEM_DOSING.lowerCyA.note}` });
    }

    return out;
  }

  /* ------------------------------------------------------------
     PRESUPUESTO — lista de materiales con precios editables
     ------------------------------------------------------------ */
  function computeBudget(cfg, geo, hyd, mat, prices) {
    const items = [];
    const add = (key, qty, note) => {
      const p = prices[key] || DEFAULT_PRICES[key];
      if (!p || !qty) return;
      items.push({ key, name: p.name, unit: p.unit, qty: r2(qty), price: p.price, note: note || p.note || "" });
    };

    if (mat.excavM3) add("excav", mat.excavM3);
    if (mat.hormigonM3) add("hormigon", mat.hormigonM3);
    if (mat.aceroKg) add("acero", mat.aceroKg);
    if (mat.impBags) add("imperm", mat.impBags, "2 manos cruzadas + malla en encuentros");
    if (cfg.finish === "venecita") add("venecita", geo.surfacBuy, `${mat.boxes} cajas de ${cfg.boxM2} m²`);
    if (mat.adhBags) add("adhesivo", mat.adhBags, "doble encolado");
    if (mat.pastBags) add("pastina", mat.pastBags, "línea propia formada");
    if (mat.microKg) add("micro", mat.microKg, "revestimiento cementicio propio");
    if (cfg.type === "prefabricada" || cfg.type === "plunge") add("grcPanel", mat.grcM2, "paneles + juntas selladas");
    if (cfg.type === "natural") {
      add("epdm", mat.epdmM2, "solapes +30 cm");
      add("grava", mat.gravelM3, "zona de regeneración");
      add("plantas", mat.plantPacks, "2-3 plantines/m²");
    }
    if (cfg.type === "contenedor") {
      add("contenedor20", 1, mat.container + " reforzado y arenado");
      add("epoxiM2", mat.epoxiM2, "epoxi 100% sólidos interior");
    }
    if (cfg.type === "vidrio") add("vidrioLam", mat.glassM2, "paño lateral laminado/acrílico + marcos");
    if (cfg.type === "suspendida") add("estructuraElev", mat.estructuraM2, "acero de apoyo calculado");
    if (cfg.type === "endless") add("contraCorriente", 1, hyd.ccFlow || "60-110 m³/h regulable");
    if (cfg.type === "spa") add("kitHidro", 1, "bomba jets + blower + boquillas");
    const ck = COPINGS[cfg.copingType]?.priceKey;
    if (mat.copingML && ck) add(ck, mat.copingML, cfg.copingType === "grc" ? `${mat.copingPieces} losas de 50 cm` : "");
    if (mat.deckArea) {
      const dk = { madera: "deckMadera", piedra: "deckPiedra", hormigon: "deckHormigon", cesped: "deckCesped", atermico: "deckAtermico" }[cfg.deckMat];
      add(dk, mat.deckArea, `solarium seco ${cfg.deckW} m · ${mat.deckMat}`);
    }
    (cfg.innovations || []).forEach(id => {
      const inn = INNOVATIONS.find(i => i.id === id);
      if (!inn) return;
      if (inn.perM2) add("deckAtermico", mat.deckArea || r2(geo.surfacBuy * 0.5), "atérmicas GRC en deck/pisos");
      else add("inn" + id.charAt(0).toUpperCase() + id.slice(1), 1, inn.name.replace(/ \(.*\)$/, ""));
    });

    add("filtro", 1, hyd.filterDesc);
    add("bomba", 1, `${hyd.pumpHP} HP · ${hyd.flowDesign} m³/h diseño`);
    if (hyd.filterD) add("multiv", 1, `válvula 6 vías para Ø ${hyd.filterD} mm`);
    if (hyd.skimmers) add("skimmer", hyd.skimmers);
    add("ret", hyd.returns);
    add("drain", hyd.drain, "fondo antivórtice");
    add("pipol", hyd.pipeLen, `Ø ${hyd.pipeMM} mm ida y vuelta`);
    if (cfg.sanitizer === "salt") add("sal", 1, "electrolizador + sal inicial");
    else add("cloro", 1, "arranque de temporada");
    if (cfg.infinity) {
      add("bombaInf", 1, `${hyd.infPumpHP} HP · ${hyd.infFlow} m³/h de rebalse`);
    }

    // detalles y confort
    if (hyd.lights) {
      add("lucesLED", hyd.lights, "1 cada 4 m de largo");
      add("transfLED", hyd.transformers, "12V estanco");
    }
    if (cfg.ladder) add("escaleraInox", 1, "3 escalones desmontable");
    if (cfg.heat) add("bombaCalor", 1, `${hyd.heatKW} kW según volumen`);
    if (cfg.cover) add("cobertorM2", r2(geo.floorArea * 1.1), "espejo + margen");
    if (cfg.shower) add("ducha", 1);
    if (cfg.robot) add("robot", 1, "limpieza automática de fondo");

    const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
    return { items, subtotal };
  }

  /* ------------------------------------------------------------
     BALANCE TÉRMICO — costo mensual de mantener la temperatura
     objetivo (bomba de calor). Devuelve 12 meses con kWh
     térmicos, kWh eléctricos y costo según tarifa.
     ------------------------------------------------------------ */
  function computeThermal(cfg, geo, target, tariffARS) {
    const surf = geo.floorArea;
    const k = cfg.cover ? THERMAL.kCover : THERMAL.kUncovered;
    const months = MONTHLY_WATER_TEMP.map(mm => {
      const dT = Math.max(0, target - mm.t);
      const kwhTh = surf * dT * k * THERMAL.days;          // calor a reponer
      const kwhElec = kwhTh / THERMAL.cop;                 // electricidad (COP 4)
      return { m: mm.m, t: mm.t, dT: r1(dT), kwhElec: Math.round(kwhElec), cost: Math.round(kwhElec * tariffARS) };
    });
    return {
      target, k, coverOn: !!cfg.cover,
      months, annualKwh: months.reduce((s, x) => s + x.kwhElec, 0),
      annualCost: months.reduce((s, x) => s + x.cost, 0),
      worstMonth: months.reduce((a, b) => (b.cost > a.cost ? b : a))
    };
  }

  /* ---------- API pública ---------- */
  return {
    readConfig, computeGeometry, computeHydraulics,
    computeMaterials, computeChemistry, computeBudget, computeThermal,
    fmt, fmtARS, r1, r2
  };
})();
