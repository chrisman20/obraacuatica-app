/* ============================================================
   ObraAcuática — ui.js
   Render de pestañas, estado global de cálculo y presupuesto.
   ============================================================ */

const UI = (() => {

  let PRICES = loadPrices();
  let STATE = { cfg: null, geo: null, hyd: null, mat: null };

  const $ = id => document.getElementById(id);
  const E = Engine;

  /* ---------- precios editables (localStorage) ---------- */
  function loadPrices() {
    try {
      const saved = JSON.parse(localStorage.getItem("piletalab_prices") || "{}");
      return { ...DEFAULT_PRICES };
    } catch (e) { return { ...DEFAULT_PRICES }; }
  }
  function savePrices() {
    const out = {};
    Object.keys(PRICES).forEach(k => out[k] = PRICES[k].price);
    localStorage.setItem("piletalab_prices", JSON.stringify(out));
  }
  function restorePrices() {
    try {
      const saved = JSON.parse(localStorage.getItem("piletalab_prices") || "{}");
      Object.keys(saved).forEach(k => { if (PRICES[k]) PRICES[k].price = saved[k]; });
    } catch (e) { /* sin datos guardados */ }
  }

  /* ---------- tabs ---------- */
  function initTabs() {
    $("mainTabs").addEventListener("click", e => {
      const btn = e.target.closest("button[data-tab]");
      if (!btn) return;
      document.querySelectorAll("#mainTabs button").forEach(b => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.id === "tab-" + btn.dataset.tab));
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    $("goResults").addEventListener("click", () => {
      document.querySelector('#mainTabs button[data-tab="results"]').click();
    });
  }

  /* ---------- config: tipos, finishes, filtros ---------- */
  /* ---------- tira horizontal de tipos (compacta: todo en una línea, sin scrollear) ---------- */
  const SHORT_NAMES = {
    arena: "Arena/Bali", tradicional: "Tradicional", prefabricada: "Prefabricada",
    natural: "Natural", contenedor: "Contenedor", vidrio: "Vidrio",
    suspendida: "Rooftop", plunge: "Plunge", endless: "Contracorriente", spa: "Spa"
  };

  function renderTypeStrip(container, selectedId, onSelect) {
    container.innerHTML = `
      <div class="type-strip">
        <button class="ts-arrow" data-dir="-1" type="button" aria-label="anterior">‹</button>
        <div class="ts-scroll" tabindex="0">
          ${POOL_TYPES.map(t => `
            <button class="ts-card ${t.id === selectedId ? "selected" : ""}" data-type="${t.id}" type="button" title="${Sec.escapeHtml(t.name)} — ${t.timeLabel}">
              ${PHOTOS[t.id] ? `<img src="${PHOTOS[t.id]}" alt="" loading="lazy">` : `<span class="ts-emoji">${t.icon}</span>`}
              <span class="ts-name">${t.icon} ${SHORT_NAMES[t.id] || t.name}</span>
              ${t.exotic ? '<span class="ts-exotic">★</span>' : ""}
            </button>`).join("")}
        </div>
        <button class="ts-arrow" data-dir="1" type="button" aria-label="siguiente">›</button>
      </div>
      <p class="hint" style="margin:0.6rem 0 0" data-ts-desc></p>`;
    const scroll = container.querySelector(".ts-scroll");
    container.querySelectorAll(".ts-arrow").forEach(a =>
      a.addEventListener("click", () => scroll.scrollBy({ left: 276 * parseInt(a.dataset.dir), behavior: "auto" })));
    const descEl = container.querySelector("[data-ts-desc]");
    const paintDesc = id => {
      const t = POOL_TYPES.find(p => p.id === id);
      if (descEl && t) descEl.innerHTML = `<b>${Sec.escapeHtml(t.name)}</b> — ${Sec.escapeHtml(t.desc.split(".")[0])}. <i>${t.timeLabel}.</i>`;
    };
    paintDesc(selectedId);
    container.querySelectorAll(".ts-card").forEach(c => c.addEventListener("click", () => {
      container.querySelectorAll(".ts-card").forEach(x => x.classList.remove("selected"));
      c.classList.add("selected");
      c.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      paintDesc(c.dataset.type);
      onSelect(c.dataset.type);
    }));
  }

  function renderTypeCards(selected) {
    renderTypeStrip($("typeCards"), selected, typeId => {
      applyTypePreset(typeId);
      syncFinishOptions();
      recalc();
    });
  }

  /* ---------- hero illustration (solo cambia con el tipo) ---------- */
  let heroTypeCache = null;
  function renderHero(typeId) {
    if (heroTypeCache === typeId) return;
    heroTypeCache = typeId;
    const t = POOL_TYPES.find(p => p.id === typeId) || POOL_TYPES[0];
    const art = $("heroArt");
    art.innerHTML = PHOTOS[typeId]
      ? `<img src="${PHOTOS[typeId]}" alt="${t.name}" onerror="this.outerHTML=Ilustracion.tipo('${typeId}')"><div class="hero-photo-veil"></div>`
      : Ilustracion.tipo(typeId);
    $("heroName").textContent = t.name;
    $("heroDesc").textContent = t.desc;
    $("heroTime").textContent = "⏱ " + t.timeLabel;
    $("heroBorder").textContent = t.infinity ? "∞ borde infinito disponible" : "borde: skimmer";
    // landing bg también cambia al tipo elegido
    const lb = $("landingBg");
    if (lb) { lb.style.backgroundImage = `url('${PHOTOS[typeId] || PHOTOS.hero}')`; }
  }

  /* presets de geometría por tipo (contenedor/plunge/endless/spa vienen con formato propio) */
  const TYPE_PRESETS = {
    contenedor: { shape: "rect", L: 6.1, W: 2.44, dMin: 1.1, dMax: 1.3, solarium: false },
    plunge:     { shape: "rect", L: 2.5, W: 2.0, dMin: 1.0, dMax: 1.2, solarium: false },
    endless:    { shape: "rect", L: 4.0, W: 2.2, dMin: 1.3, dMax: 1.3, solarium: false },
    spa:        { shape: "rect", L: 2.2, W: 2.2, dMin: 0.85, dMax: 0.95, solarium: false }
  };
  function applyTypePreset(typeId) {
    const p = TYPE_PRESETS[typeId];
    if (!p) return;
    const setField = (id, v) => { const el = $(id); if (el == null) return; el.value = v; };
    setField("fShape", p.shape);
    setField("fLen", p.L); setField("fWidth", p.W);
    setField("fDepthMin", p.dMin); setField("fDepthMax", p.dMax);
    const sol = $("fSolarium"); if (sol) sol.checked = !!p.solarium;
  }

  function currentType() {
    return POOL_TYPES.find(t => t.id === (document.querySelector("#typeCards .ts-card.selected")?.dataset.type || "arena")) || POOL_TYPES[0];
  }

  function syncFinishOptions() {
    const t = currentType();
    const sel = $("fFinish");
    const cur = sel.value;
    sel.innerHTML = t.finishes.map(fid => `<option value="${fid}">${FINISHES[fid].name}</option>`).join("");
    if (t.finishes.includes(cur)) sel.value = cur;
    syncFilterOptions();
  }

  function syncFilterOptions() {
    const t = currentType();
    const sel = $("fFilter");
    if (t.natural) {
      sel.innerHTML = `<option value="bio">${FILTER_SYSTEMS.bio.name}</option>`;
      sel.value = "bio";
      sel.disabled = true;
    } else {
      sel.disabled = false;
      const cur = sel.value;
      const opts = ["arena", "vidrio", "cartucho", "diatomeas"];
      sel.innerHTML = opts.map(k => `<option value="${k}">${FILTER_SYSTEMS[k].name}</option>`).join("");
      if (opts.includes(cur)) sel.value = cur;
    }
  }

  /* ---------- render pestaña resultados ---------- */
  function kpi(label, value, sub, hl) {
    return `<div class="kpi ${hl ? "hl" : ""}"><div class="k-label">${label}</div><div class="k-value">${value}</div>${sub ? `<div class="k-sub">${sub}</div>` : ""}</div>`;
  }

  function renderResults() {
    const { cfg, geo, hyd, mat } = STATE;

    $("resGeo").innerHTML =
      kpi("Volumen", `${E.fmt(geo.volume)} m³`, `${geo.liters.toLocaleString("es-AR")} litros de agua`, true) +
      kpi("Espejo de agua", `${E.fmt(geo.floorArea)} m²`, cfg.shape === "oval" ? "elipse" : cfg.shape === "free" ? "caja envolvente ×0,95" : "L × W") +
      kpi("Perímetro", `${E.fmt(geo.perimeter)} m`) +
      kpi("Prof. media nado", `${E.fmt((cfg.dMin + cfg.dMax) / 2)} m`, `${cfg.dMin} → ${cfg.dMax} m con pendiente`) +
      kpi("Superficie a revestir", `${E.fmt(geo.surfacTotal)} m²`, `+ desperdicio ${Math.round(cfg.waste * 100)}% = ${E.fmt(geo.surfacBuy)} m²`, true) +
      (geo.solArea ? kpi("Solarium húmedo", `${E.fmt(geo.solArea)} m²`, `${cfg.solW} × ${cfg.W} m a 0,30 m`) : "");

    $("geoBreakdown").innerHTML = `<div class="breakdown">
      <div class="row"><span>Piso total (fondo + solarium)</span><b>${E.fmt(geo.floorArea)} m²</b></div>
      ${geo.wallsSol ? `<div class="row"><span>Paredes zona solarium (a 0,30 m)</span><b>${E.fmt(geo.wallsSol)} m²</b></div>` : ""}
      <div class="row"><span>Paredes zona nado (${E.fmt((cfg.dMin + cfg.dMax) / 2)} m medio)</span><b>${E.fmt(geo.wallsSwim)} m²</b></div>
      ${geo.dropWall ? `<div class="row"><span>Muro drop del solarium al fondo</span><b>${E.fmt(geo.dropWall)} m²</b></div>` : ""}
      <div class="row"><span>Escalera (3 escalones × 1,20 m)</span><b>${E.fmt(geo.stairs)} m²</b></div>
      <div class="row"><span><b>TOTAL NETO a revestir</b></span><b>${E.fmt(geo.surfacTotal)} m²</b></div>
    </div>
    ${geo.warns.length ? `<div class="warn" style="margin-top:0.8rem">${geo.warns.map(w => "⚠ " + w).join("<br>")}</div>` : ""}`;

    $("resHyd").innerHTML =
      kpi("Recambio total", `${hyd.turnover} h`, cfg.tdef.natural ? "régimen biológico" : `uso ${cfg.use === "res" ? "privado" : cfg.use === "semi" ? "semi-público" : "público"}`) +
      kpi("Caudal de diseño", `${E.fmt(hyd.flowDesign)} m³/h`, `+10% sobre el mínimo (${E.fmt(hyd.flow)} m³/h)`, true) +
      kpi("Bomba principal", `${hyd.pumpHP} HP`, `~${hyd.headEst} m de columna estimados`) +
      kpi("Filtración diaria", `${hyd.filtHoursDay} h/día`) +
      kpi(hyd.filterD ? "Filtro" : "Equipo", hyd.filterD ? `Ø ${hyd.filterD} mm` : "según detalle", hyd.filterDesc) +
      kpi("Cañería principal", `Ø ${hyd.pipeMM} mm`, `${E.fmt(hyd.pipeLen)} m entre ida y vuelta`) +
      (hyd.lights ? kpi("Luces sumergibles", `${hyd.lights} LED`, `${hyd.transformers} transformador(es) 12V estancos`, true) : kpi("Luces sumergibles", "—", "sin marcar en Detalles")) +
      (hyd.heatKW ? kpi("Bomba de calor", `${hyd.heatKW} kW`, "ΔT 10 °C arranque estándar", true) : "") +
      (hyd.ccFlow ? kpi("Contracorriente", hyd.ccFlow, "circuito dedicado 1,5-2,2 HP") : "");

    $("resMat").innerHTML =
      kpi("Revestimiento", mat.boxes ? `${mat.boxes} cajas` : mat.microKg ? `${mat.microKg} kg` : cfg.type === "natural" ? "geomembrana" : "integrado", mat.finishName, true) +
      (mat.adhBags ? kpi("Adhesivo", `${mat.adhBags} bolsas 30 kg`, `${mat.adhKg} kg a doble encolado`) : "") +
      (mat.pastBags ? kpi("Pastina", `${mat.pastBags} bolsas 10 kg`, `${mat.pastKg} kg · línea propia`) : "") +
      (mat.impBags ? kpi("Impermeabilizante", `${mat.impBags} bolsas 25 kg`, "2 manos cruzadas + malla") : "") +
      (mat.copingML ? kpi("Coping", `${E.fmt(mat.copingML)} ml`, COPINGS[cfg.copingType]?.name || "", true) : "") +
      (mat.deckArea ? kpi("Deck / solarium seco", `${E.fmt(mat.deckArea)} m²`, mat.deckMat, true) : "") +
      (mat.hormigonM3 ? kpi("Hormigón H-21", `${mat.hormigonM3} m³`, `${mat.aceroKg} kg de acero (≈85 kg/m³)`) : "") +
      (mat.excavM3 ? kpi("Excavación", `${mat.excavM3} m³`, "incluye exceso de trabajo") : "");

    $("matBreakdown").innerHTML = `<div class="breakdown">
      ${cfg.finish === "venecita" ? `<div class="row"><span>Venecita a comprar (desperdicio incl.)</span><b>${E.fmt(geo.surfacBuy)} m² · ${mat.boxes} cajas · ~${mat.plates} placas 30x30</b></div>
      <div class="row"><span>Consumo adhesivo doble encolado</span><b>${FINISHES.venecita.adherKgM2} kg/m² → ${mat.adhKg} kg</b></div>
      <div class="row"><span>Pastina juntas 1,5-2 mm</span><b>~0,9 kg/m² → ${mat.pastKg} kg</b></div>` : ""}
      ${mat.microKg ? `<div class="row"><span>Revestimiento cementicio (0,55 m²/kg medio)</span><b>${mat.microKg} kg</b></div>` : ""}
      ${cfg.type === "prefabricada" || cfg.type === "plunge" ? `<div class="row"><span>Paneles GRC (paredes + fondo)</span><b>${E.fmt(mat.grcM2)} m² a ~31 kg/m² (15 mm)</b></div>` : ""}
      ${cfg.type === "natural" ? `<div class="row"><span>EPDM + solapes</span><b>${E.fmt(mat.epdmM2)} m²</b></div>
      <div class="row"><span>Grava regeneración (45% del área)</span><b>${mat.gravelM3} m³</b></div>
      <div class="row"><span>Plantas (2-3/m² de regeneración)</span><b>${mat.plantPacks} packs de 10</b></div>` : ""}
      ${cfg.type === "contenedor" ? `<div class="row"><span>Contenedor (${mat.container}) + refuerzos</span><b>${mat.aceroKg} kg de perfiles UPN + puntera</b></div>
      <div class="row"><span>Epoxi interior 2 manos</span><b>${E.fmt(mat.epoxiM2)} m²</b></div>` : ""}
      ${cfg.type === "vidrio" ? `<div class="row"><span>Paño de vidrio/acrílico lateral</span><b>${E.fmt(mat.glassM2)} m² + marcos de apoyo</b></div>` : ""}
      ${cfg.type === "suspendida" ? `<div class="row"><span>Estructura de apoyo (acero)</span><b>${E.fmt(mat.estructuraM2)} m² de espejo × 1,5 t/m² de carga</b></div>` : ""}
      ${cfg.type === "endless" ? `<div class="row"><span>Equipo contra corriente</span><b>${hyd.ccFlow}</b></div>` : ""}
      ${cfg.type === "spa" ? `<div class="row"><span>Kit hidromasaje</span><b>bomba jets + blower + boquillas</b></div>` : ""}
      <div class="row"><span>Detalles marcados</span><b>${[hyd.lights ? `${hyd.lights} luces LED` : null, cfg.ladder ? "escalera inox" : null, hyd.heatKW ? `bomba calor ${hyd.heatKW} kW` : null, cfg.cover ? "cobertor térmico" : null, cfg.shower ? "ducha" : null, cfg.robot ? "robot" : null].filter(Boolean).join(" · ") || "ninguno"}</b></div>
      <div class="row"><span>Estructura (${cfg.tdef.name})</span><b>${mat.hormigonM3 ? `${mat.hormigonM3} m³ hormigón · ${mat.aceroKg} kg acero` : "ver protocolo del sistema"}</b></div>
    </div>`;

    // borde infinito
    const infCard = $("infResultsCard");    if (cfg.infinity) {
      infCard.classList.remove("hidden");
      $("resInf").innerHTML =
        kpi("Largo del weir", `${E.fmt(geo.weirLen)} m`, cfg.infSides >= 4 ? "rebalse perimetral" : `${cfg.infSides} lado(s)`) +
        kpi("Caudal de rebalse", `${E.fmt(hyd.infFlow)} m³/h`, "2 m³/h por m + margen viento 1,3x", true) +
        kpi("Bomba compensadora", `${hyd.infPumpHP} HP`) +
        kpi("Estanque compensador", `${E.fmt(hyd.basinVol)} m³`, `7% del volumen · ${hyd.basinDim}`, true) +
        kpi("Grating / canaleta", `${E.fmt(hyd.gratingM)} m`, "pendiente 1% al punto de succión");
    } else infCard.classList.add("hidden");

    // balance térmico (visible si hay calefacción marcada)
    renderThermal(cfg, geo, hyd);

    // 🛡️ verificación de flotación: pileta VACÍA con napa a nivel
    // (el riesgo real del litoral: el agua del terreno empuja la cuba vacía hacia arriba)
    const flotBox = $("flotBox");    if (flotBox) {
      const enterrada = !["suspendida", "contenedor"].includes(cfg.type);
      if (enterrada && STATE.mat) {
        const m3 = STATE.mat.hormigonM3 || 0;
        const grc = STATE.mat.grcM2 || 0;
        const peso = m3 * 2.4 + grc * 0.031 * 2.1;                 // t: hormigón + GRC
        const empuje = geo.volume * 1.0;                            // t: napa a nivel del terreno
        const ratio = peso > 0 ? empuje / peso : 9;
        let nivel, txt;
        if (ratio >= 1)      { nivel = "ALTO"; txt = `El empuje de la napa (${empuje.toFixed(0)} t) SUPERÁN el peso propio (${peso.toFixed(0)} t): la pileta vacía FLOTA. Anclaje obligatorio: muertos de hormigón o zapatas + drenaje perimetral conectado a pozo. Nunca la dejes vacía en temporada de lluvias.`; }
        else if (ratio >= 0.7) { nivel = "MEDIO"; txt = `Empuje ${empuje.toFixed(0)} t vs peso ${peso.toFixed(0)} t (${Math.round(ratio * 100)}%): con napa alta hay margen justo. Drenaje perimetral obligatorio y evaluar anclaje según rozamiento del suelo.`; }
        else                 { nivel = "BAJO"; txt = `Peso propio ${peso.toFixed(0)} t vs empuje ${empuje.toFixed(0)} t: la pileta no flota sola. Igual: drenaje perimetral siempre (agua estancada bajo el fondo = hongos y presión).`; }
        flotBox.classList.remove("hidden");
        flotBox.innerHTML = `<div class="warn" style="${nivel === "ALTO" ? "" : nivel === "MEDIO" ? "border-color:var(--warn)" : "border-color:rgba(61,220,151,.4)"}">
          ⚓ <b>Riesgo de flotación con napa alta: ${nivel}</b> — ${txt}</div>`;
      } else flotBox.classList.add("hidden");
    }

    // comparador A/B (si hay una configuración A fijada)
    renderCompare();
  }

  /* ---------- color de agua y paleta según revestimiento ---------- */
  function renderColors(cfg) {
    const box = $("colorBody");
    if (!box) return;
    const fc = FINISH_COLORS[cfg.finish];
    if (!fc) { $("colorCard").classList.add("hidden"); return; }
    $("colorCard").classList.remove("hidden");
    const sw = (c, label, big) => `
      <div class="swatch ${big ? "big" : ""}">
        <div class="sw-chip" style="background:${c}"></div>
        <div class="sw-name">${label}</div>
      </div>`;
    box.innerHTML = `
      <div class="color-grid">
        <div class="agua-mock">
          <svg viewBox="0 0 320 150" style="width:100%;height:auto;border-radius:14px;display:block">
            <defs>
              <linearGradient id="aguaFin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="${fc.agua.c1}"/><stop offset="1" stop-color="${fc.agua.c2}"/>
              </linearGradient>
            </defs>
            <rect width="320" height="150" fill="${fc.paleta[1].c}"/>
            <rect x="22" y="22" width="276" height="106" rx="26" fill="${fc.paleta[0].c}"/>
            <rect x="32" y="32" width="256" height="86" rx="18" fill="url(#aguaFin)"/>
            <path d="M52,60 q20,-6 40,0 t40,0 t40,0 t40,0 t40,0" stroke="#ffffff" stroke-width="2.5" fill="none" opacity="0.5"/>
            <path d="M52,84 q20,-6 40,0 t40,0 t40,0 t40,0 t40,0" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.3"/>
            <text x="160" y="142" text-anchor="middle" font-family="Segoe UI" font-size="11" fill="#44525e">${fc.agua.txt}</text>
          </svg>
        </div>
        <div>
          <p class="hint" style="margin-bottom:0.5rem"><b>Colores de fondo recomendados</b> (elegí en Configurá → Revestimiento):</p>
          <div class="swatch-row">${fc.base.map(b => sw(b.c, b.n)).join("")}</div>
          <p class="hint" style="margin:0.7rem 0 0.5rem"><b>Combina con</b> (coping y deck a tono):</p>
          <div class="swatch-row">${fc.paleta.map(p => sw(p.c, p.n)).join("")}</div>
          <ul class="color-tips">${fc.tips.map(t => `<li>${t}</li>`).join("")}</ul>
        </div>
      </div>`;
  }

  function renderThermal(cfg, geo, hyd) {
    const card = $("thermalCard");
    if (!cfg.heat || !hyd.heatKW) { card.classList.add("hidden"); return; }
    card.classList.remove("hidden");
    // persistencia de inputs — listeners UNA sola vez (flag), no en cada recalc
    const persist = (id, key) => {
      const el = $(id);
      if (el.dataset.wired) { if (!el.value) el.value = localStorage.getItem(key) || el.value; return; }
      el.dataset.wired = "1";
      const saved = localStorage.getItem(key);
      if (saved) el.value = saved;
      el.addEventListener("change", () => { localStorage.setItem(key, el.value); renderThermal(cfg, geo, hyd); });
    };
    persist("thTarget", "piletalab_th_target");
    persist("thTariff", "piletalab_th_tariff");
    // evitar duplicar listeners en re-render: clonar inputs sería más limpio; con change-only es aceptable
    const target = Math.min(34, Math.max(24, parseFloat($("thTarget").value) || 28));
    const tariff = Math.max(10, parseFloat($("thTariff").value) || 350);
    const th = Engine.computeThermal(cfg, geo, target, tariff);
    $("thermalBody").innerHTML = `
      <div class="kpi-grid">
        ${kpi("Equipo", hyd.heatKW + " kW", "bomba de calor COP ≈ 4", true)}
        ${kpi("Cobertor térmico", cfg.cover ? "✅ sí (k=0,06)" : "❌ no (k=0,20)", cfg.cover ? "corta ~70% de la pérdida" : "sin él pagás ~3× más — marcalo en Detalles", !cfg.cover ? true : false)}
        ${kpi("Peor mes", th.worstMonth.m, `${th.worstMonth.kwhElec.toLocaleString("es-AR")} kWh · ${E.fmtARS(th.worstMonth.cost)}`, true)}
        ${kpi("Anual", Math.round(th.annualKwh).toLocaleString("es-AR") + " kWh", E.fmtARS(th.annualCost) + "/año", true)}
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Mes</th><th>Agua sin calef.</th><th>ΔT a ${target}°C</th><th>kWh eléctricos</th><th>Costo ARS</th></tr></thead>
        <tbody>${th.months.map(x => `<tr class="${x.cost === th.worstMonth.cost && x.cost > 0 ? "hl" : ""}">
          <td>${x.m}</td><td>${x.t}°C</td><td>${x.dT ? "+" + x.dT + "°C" : "—"}</td>
          <td>${x.kwhElec ? x.kwhElec.toLocaleString("es-AR") : "—"}</td>
          <td>${x.cost ? E.fmtARS(x.cost) : "—"}</td></tr>`).join("")}</tbody>
      </table></div>
      <p class="hint">Modelo orientativo del rubro (pérdida ≈ superficie × ΔT × ${th.k} kWh/m²·día·°C, ${THERMAL.days} días/mes, COP 4). El viento, la sombra y el uso real mueven el número ±30%. ${cfg.cover ? "" : "<b>Con cobertor térmico el costo cae a un tercio</b> — marcalo en Detalles y compará."}</p>`;
  }

  /* ---------- render pestaña filtración ---------- */
  function renderFiltration() {
    const { cfg, hyd, geo } = STATE;

    const rows = Object.entries(FILTER_SYSTEMS).map(([k, f]) => {
      const active = k === cfg.filter;
      return `<tr class="${active ? "hl" : ""}">
        <td><b>${f.name}</b> ${active ? '<span class="tag aqua">seleccionado</span>' : ""}</td>
        <td>${f.velFiltr && f.type === "mecánica" ? E.fmt(f.velFiltr) + " m/h" : "—"}</td>
        <td>${f.pros}</td><td>${f.cons}</td>
        <td>${f.maintenance}</td><td>${f.priceRef}</td></tr>`;
    }).join("");
    $("filterCompare").innerHTML = `<table>
      <thead><tr><th>Sistema</th><th>Vel. filtración</th><th>Ventajas</th><th>Contras</th><th>Mantenimiento</th><th>Precio ref. (ARS)</th></tr></thead>
      <tbody>${rows}</tbody></table>`;

    const sanRows = Object.entries(SANITIZERS).map(([k, s]) => {
      const active = k === cfg.sanitizer;
      return `<tr class="${active ? "hl" : ""}">
        <td><b>${s.name}</b> ${active ? '<span class="tag aqua">seleccionado</span>' : ""}</td>
        <td>${s.residual}</td><td>${s.pros}</td><td>${s.cons}</td><td>${s.priceRef}</td></tr>`;
    }).join("");
    $("filterCompare").innerHTML += `<h3 style="margin:1.1rem 0 0.5rem;color:var(--txt)">Desinfección (combinable con cualquier filtro mecánico)</h3>
      <table><thead><tr><th>Sistema</th><th>Residual</th><th>Ventajas</th><th>Contras</th><th>Precio ref. (ARS)</th></tr></thead>
      <tbody>${sanRows}</tbody></table>`;

    $("filterSizing").innerHTML =
      kpi("Caudal a filtrar", `${E.fmt(hyd.flowDesign)} m³/h`, `volumen ${E.fmt(geo.volume)} m³ ÷ ${hyd.turnover} h × 1,1`, true) +
      kpi("Skimmers", hyd.skimmers || "—", hyd.skimmers ? "1 cada 35 m² de espejo" : "reemplazados por rebalse") +
      kpi("Retornos", hyd.returns, "cada 3,5 m de perímetro, en espiral") +
      kpi("Desagüe de fondo", hyd.drain, "antivórtice + válvula");

    const fs = FILTER_SYSTEMS[cfg.filter];
    const detail = [`<div class="breakdown">
      <div class="row"><span>Equipo</span><b>${hyd.filterDesc}</b></div>
      ${hyd.mediaKg ? `<div class="row"><span>Carga de media</span><b>~${hyd.mediaKg} kg (${fs.mediaCost})</b></div>` : ""}
      <div class="row"><span>Mantenimiento</span><b>${fs.maintenance}</b></div>
      ${hyd.makeupNote ? `<div class="row"><span>Agua de reposición</span><b>${hyd.makeupNote}</b></div>` : ""}
      <div class="row"><span>Desinfección elegida</span><b>${SANITIZERS[cfg.sanitizer].name} · residual ${SANITIZERS[cfg.sanitizer].residual}</b></div>
      </div>`].join("");
    $("filterDetail").innerHTML = detail;

    const inf = cfg.infinity
      ? `\n<span class="hl">CIRCUITO 2 — BORDE INFINITO</span>\n  Pileta ──rebalse weir ${E.fmt(geo.weirLen)} m──▶ canaleta 1%\n  canaleta ──▶ ESTANQUE COMPENSADOR ${E.fmt(hyd.basinVol)} m³\n  estanque ──bomba ${hyd.infPumpHP} HP──▶ retorno a pileta (${E.fmt(hyd.infFlow)} m³/h)\n  flotante de nivel ──▶ reposición automática + protección bomba`
      : "";
    $("machineRoom").innerHTML =
      `<span class="hl">ESQUEMA HIDRÁULICO — ${cfg.tdef.name.toUpperCase()}</span>

PILETA
  ├─ skimmer(s): ${hyd.skimmers || "(rebalse perimetral)"} .............. succión superficie
  ├─ desagüe de fondo antivórtice ${hyd.drain} ...... succión fondo
  └─ boca de barrido ${hyd.vacuum} .............. limpieza
        │  Ø ${hyd.pipeMM} mm
        ▼
SALA DE MÁQUINAS (bajo nivel de agua, a menos de 6 m)
  ├─ BOMBA ${hyd.pumpHP} HP (${E.fmt(hyd.flowDesign)} m³/h diseño)
  ├─ FILTRO ${hyd.filterD ? "Ø " + hyd.filterD + " mm" : cfg.filter.toUpperCase()}
  │    └─ válvula multivía: filtrar/lavar/enjuagar/recircular/drenar/cerrar
  ├─ ${cfg.sanitizer === "salt" ? "ELECTROLIZADOR salino (tras el filtro)" : cfg.sanitizer === "uv" ? "REACTOR UV (tras el filtro)" : cfg.sanitizer === "ozone" ? "GENERADOR O₃ (inyección post-filtro)" : "dosificación de cloro manual"}
  ├─ ${hyd.lights ? `TRANSFORMADOR 12V (${hyd.lights} luces LED sumergidas)` : "sin luces sumergidas"}
  ${hyd.heatKW ? `├─ BOMBA DE CALOR ${hyd.heatKW} kW (bypass + cañería de 50 mm)\n  ` : ""}└─ Tablero: diferencial 30 mA + térmica + timer ${hyd.filtHoursDay} h/día
        │  Ø ${hyd.pipeMM} mm
        ▼
  RETORNOS: ${hyd.returns} bocas en espiral → agua barre hacia los skimmers${inf}`;
  }

  /* ---------- render pestaña química ---------- */
  function renderChemistry() {
    $("chemTargets").innerHTML = `<table>
      <thead><tr><th>Parámetro</th><th>Rango</th><th>Ideal</th><th>Por qué importa</th><th>Cómo medirlo</th></tr></thead>
      <tbody>${CHEM_TARGETS.map(t => `<tr>
        <td><b>${t.param}</b></td><td>${t.range}</td><td><span class="tag aqua">${t.ideal}</span></td>
        <td>${t.why}</td><td>${t.tool}</td></tr>`).join("")}</tbody></table>`;

    const R = CHEM_ROUTINE;
    $("chemRoutine").innerHTML = `<div class="grid-2">
      ${routineCard("A diario (2 min)", R.daily)}
      ${routineCard("Semanal (30 min)", R.weekly)}
      ${routineCard("Mensual (1 h)", R.monthly)}
      ${routineCard("Apertura de temporada", R.opening)}
      ${routineCard("Invernada", R.winter)}
    </div>`;

    if (STATE.geo) $("cVol").value = STATE.geo.volume;
  }

  function routineCard(title, items) {
    return `<div class="sub-box"><h3 style="color:var(--aqua);font-size:0.9rem;margin-bottom:0.5rem">${title}</h3>
      <ul style="list-style:none">${items.map(i => `<li style="padding:0.25rem 0 0.25rem 1.2rem;position:relative;font-size:0.84rem;line-height:1.45"><span style="position:absolute;left:0;color:var(--aqua)">✓</span>${i}</li>`).join("")}</ul></div>`;
  }

  function runChemCheck() {
    const vol = STATE.geo ? STATE.geo.volume : parseFloat($("cVol").value) || 40;
    const measured = {
      ph: parseFloat($("cPH").value),
      cl: parseFloat($("cCl").value),
      alk: parseFloat($("cAlk").value),
      hard: parseFloat($("cHard").value),
      cya: parseFloat($("cCyA").value)
    };
    const actions = Engine.computeChemistry(vol, measured);
    $("chemActions").innerHTML = actions.map(a =>
      `<div class="chem-action ${a.sev}"><div class="ca-title">${a.sev === "ok" ? "✅" : a.sev === "warn" ? "⚠️" : "🛑"} ${a.title}</div>${a.txt}</div>`
    ).join("");
  }

  /* ---------- render pestaña protocolos ---------- */
  function renderProtocols() {
    const tSel = $("pType"), phSel = $("pPhase");
    const curT = tSel.value || STATE.cfg?.type || "arena";
    const curP = phSel.value || "pre";

    if (!tSel.options.length) {
      tSel.innerHTML = [...Object.keys(PROTOCOLS).map(k => {
        const t = POOL_TYPES.find(p => p.id === k);
        return t ? `<option value="${k}">${t.icon} ${t.name}</option>` : `<option value="${k}">Borde infinito (complemento)</option>`;
      })].join("");
      tSel.value = curT;
    }
    const key = tSel.value || curT;
    const proto = PROTOCOLS[key];
    if (!proto) return;

    const title = key === "infinity"
      ? "Protocolo complementario — Borde infinito (se suma al sistema constructivo elegido)"
      : `Protocolo — ${POOL_TYPES.find(p => p.id === key)?.name}`;

    const steps = proto[phSel.value || curP] || [];
    $("protocolBody").innerHTML = `
      <h3 style="color:var(--txt);margin:0.4rem 0 0.8rem">${title} · fase: ${phSel.options[phSel.selectedIndex]?.text}</h3>
      ${steps.length ? `<ol class="step-list">${steps.map(s =>
        `<li>${s.t}${s.cn ? `<span class="cn"><b>CN — control de calidad:</b> ${s.cn}</span>` : ""}</li>`).join("")}</ol>`
        : '<p class="hint">Fase sin pasos definidos para este sistema.</p>'}`;

    if (key !== "infinity" && STATE.cfg?.infinity && (phSel.value || curP) === "struct") {
      $("protocolBody").innerHTML += `<p class="hint" style="margin-top:0.6rem">📍 Tu proyecto tiene borde infinito: agregá encima el protocolo <b>Borde infinito (complemento)</b> — la pared del weir y el estanque compensador se construyen en esta misma fase.</p>`;
    }
  }

  /* ---------- render pestaña fábrica ---------- */
  function renderFactory() {
    const sel = $("ffFormula");
    if (!sel.options.length) {
      sel.innerHTML = Object.entries(FACTORY_FORMULAS).map(([k, f]) => `<option value="${k}">${f.name}</option>`).join("");
    }
    const f = FACTORY_FORMULAS[sel.value];
    const batch = Math.max(1, parseFloat($("ffBatch").value) || f.batchBase);
    const scale = batch / f.batchBase;

    // 🔒 Las formulaciones son secreto industrial: solo el dueño con sesión iniciada ve componentes.
    const isOwner = typeof Auth !== "undefined" && Auth.current()?.role === "dueño";

    if (!isOwner) {
      $("factoryBody").innerHTML = `
        <div class="kpi-grid">
          ${kpi("Producto", f.name.split("—")[0].trim(), "línea de fábrica propia", true)}
          ${kpi("Rendimiento", f.rend, "", true)}
        </div>
        <div class="warn">🔒 <b>Formulación restringida.</b> Los componentes y dosificaciones de nuestros productos son secreto industrial: solo el dueño los ve, con su sesión iniciada en la pestaña Cuenta.</div>
        <p class="hint" style="margin-top:0.6rem">Lo que sí es público: qué producto es, para qué sirve y cuánto rinde — lo que necesitamos para presupuestar y vender.</p>`;
      $("grcBody").innerHTML = "";
      return;
    }

    $("factoryBody").innerHTML = `
      <div class="kpi-grid">
        ${kpi("Lote a fabricar", E.fmt(batch) + " kg", `base de fórmula: ${f.batchBase} kg`, true)}
        ${kpi("Rendimiento", f.rend, "", true)}
      </div>
      <table>
        <thead><tr><th>Componente</th><th>Por ${f.batchBase} kg</th><th>Para lote de ${E.fmt(batch)} kg</th><th>% en mezcla</th></tr></thead>
        <tbody>${f.components.map(c => {
          const base = typeof c.g === "number" ? c.g : null;
          const scaled = base !== null ? E.fmt(base * scale) : "según tabla";
          const gTxt = base !== null ? (c.g < 10 ? c.g.toFixed(1) : E.fmt(c.g)) + (c.rel ? "" : " g") : c.g;
          return `<tr><td>${c.n}</td><td>${gTxt}${c.rel ? ` <span class="tag aqua">${c.rel}</span>` : ""}</td><td><b>${scaled}${base !== null ? " g" : ""}</b></td><td>${c.pct}%</td></tr>`;
        }).join("")}</tbody>
      </table>
      <p class="hint" style="margin-top:0.7rem">💧 <b>Agua:</b> ${f.water} · ${f.notes.join(" · ")}</p>
      <p class="hint" style="margin-top:0.4rem">🔒 Formulación visible solo para el dueño — no se exporta en presupuestos ni informes de cliente.</p>`;

    $("grcBody").innerHTML = `<table>
      <thead><tr><th style="width:30%">Clave</th><th>Guía</th></tr></thead>
      <tbody>${MOLDS_GUIDE.map(g => `<tr><td><b>${g.k}</b></td><td>${g.v}</td></tr>`).join("")}</tbody></table>
      <p class="hint" style="margin-top:0.7rem">Fuente: ESTUDIO-MOLDES-PROPIOS.md (09/2026) — silicona RTV-2 por capas para arrancar, matriz CNC cuando el formato vende. Los paneles de la pileta prefabricada y el coping GRC salen de esta línea.</p>`;
  }

  /* ---------- render pestaña presupuesto ---------- */
  function renderBudget() {
    const { cfg, geo, hyd, mat } = STATE;
    const adj = (parseFloat($("bAdj").value) || 0) / 100;
    const cont = (parseFloat($("bCont").value) || 0) / 100;
    const margin = (parseFloat($("bMargin").value) || 0) / 100;
    const withIVA = $("bIva").checked;
    const clientMode = $("bClientMode").checked;
    const regime = $("bIvaRegime").value;
    const budget = Engine.computeBudget(cfg, geo, hyd, mat, PRICES);
    document.body.classList.toggle("client-mode", clientMode);
    const prov = k => { const p = ITEM_PROVIDER[k]; return p ? PROVIDERS[p] : null; };

    $("budgetTable").innerHTML = `<table id="bTable">
      <thead><tr><th>Rubro</th><th>Detalle</th><th>Cant.</th><th>Unidad</th><th>Dónde comprarlo</th><th class="price-col">Precio unit. (ARS)</th><th class="price-col">IVA</th><th class="price-col">Subtotal</th></tr></thead>
      <tbody>${budget.items.map(i => {
        const pv = prov(i.key);
        const iva = itemIVA(i.key, regime);
        return `<tr>
        <td><b>${i.name}</b></td><td style="color:var(--muted);font-size:0.78rem">${i.note}</td>
        <td>${E.fmt(i.qty)}</td><td>${i.unit}</td>
        <td>${pv ? `<button class="prov-btn" data-item="${i.key}" data-name="${i.name.replace(/"/g, "&quot;")}">${pv.icon} ${pv.name} ▾</button>` : "—"}</td>
        <td class="price-col"><input type="number" data-key="${i.key}" value="${i.price}" step="1000"></td>
        <td class="price-col"><span class="tag ${iva === 10.5 ? "warn" : ""}" style="font-size:0.68rem">${iva}%</span></td>
        <td class="price-col"><b>${E.fmtARS(i.qty * i.price * (1 + adj))}</b></td></tr>`;
      }).join("")}</tbody>
    </table>`;

    const subtotal = budget.items.reduce((s, i) => s + i.qty * i.price, 0) * (1 + adj);
    const total = subtotal * (1 + cont);
    const price = total * (1 + margin) * (withIVA ? 1.21 : 1);
    // desglose de IVA de compra según régimen
    const iva10 = budget.items.filter(i => itemIVA(i.key, regime) === 10.5).reduce((s, i) => s + i.qty * i.price * (1 + adj) * 0.105, 0);
    const iva21 = budget.items.filter(i => itemIVA(i.key, regime) === 21).reduce((s, i) => s + i.qty * i.price * (1 + adj) * 0.21, 0);

    // fecha de precios: persistida, default hoy
    const pdKey = "piletalab_price_date";
    if (!$("bPriceDate").value) $("bPriceDate").value = localStorage.getItem(pdKey) || new Date().toISOString().slice(0, 10);
    $("bPriceDate").addEventListener("change", () => localStorage.setItem(pdKey, $("bPriceDate").value));
    const priceDateTxt = new Date($("bPriceDate").value + "T12:00:00").toLocaleDateString("es-AR");

    $("budgetTotals").innerHTML = `<div class="total-bar">
      ${clientMode ? "" : `<div><div class="t-label">Subtotal materiales neto (${budget.items.length} rubros, ajuste ${Math.round(adj * 100)}%)</div>
      <div class="t-value" style="font-size:1.1rem">${E.fmtARS(subtotal)}</div></div>
      <div><div class="t-label">IVA compra ${regime === "reducido" ? "10,5+21%" : "21%"} · ${IVA_REGIMES[regime].label.split("—")[0].trim()}</div>
      <div class="t-value" style="font-size:1.1rem">${E.fmtARS(iva10 + iva21)}${regime === "reducido" && iva10 > 0 ? ` <small style="font-size:0.65em;color:var(--warn)">(10,5: ${E.fmtARS(iva10)})</small>` : ""}</div></div>`}
      <div><div class="t-label">Precio de obra llave en mano (margen ${Math.round(margin * 100)}%${withIVA ? " + IVA 21% venta" : " sin IVA"})</div>
      <div class="t-value">${E.fmtARS(price)}</div></div>
      <div style="max-width:340px;font-size:0.75rem;color:var(--muted);line-height:1.5">${clientMode ? "Modo cliente activo: costos internos ocultos." : IVA_REGIMES[regime].note + " Confirmá con tu contador: el 10,5% rige con la obra adherida al régimen."}<br>📅 <b>Precios vigentes al ${priceDateTxt}</b> — validez sugerida 15 días.</div>
    </div>`;

    // plan de pagos sobre el precio final
    $("paymentPlan").innerHTML = `<h3 style="color:var(--aqua-bright);font-size:0.9rem;margin:1rem 0 0.5rem">Plan de pagos por hitos</h3>
      <div class="kpi-grid">${DEFAULT_PAYMENT_PLAN.map(h => `
        <div class="kpi"><div class="k-label">${h.label}</div>
        <div class="k-value">${h.pct}%</div>
        <div class="k-sub">${E.fmtARS(price * h.pct / 100)}</div></div>`).join("")}
      </div>`;

    $("budgetTable").querySelectorAll("input[data-key]").forEach(inp => {
      inp.addEventListener("change", () => {
        const k = inp.dataset.key;
        if (PRICES[k]) { PRICES[k].price = parseFloat(inp.value) || 0; savePrices(); renderBudget(); }
      });
    });

    // proveedores por zona: click en la celda → modal de opciones
    $("budgetTable").querySelectorAll(".prov-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (typeof Proveedores !== "undefined") Proveedores.openModal(btn.dataset.item, btn.dataset.name);
      });
    });

    // 🛡️ enforcement de permisos + FREEMIUM (3 exports gratis/mes → plan Pro)
    const guardExport = fn => () => {
      if (!can("exportar")) {
        Enterprise.toast("🔒 Los exportaciones son del área profesional");
        return;
      }
      const free = Freemium.canExport();
      if (!free.ok) {
        // se acabaron los gratis del mes → mostrar upsell Pro
        const el = document.createElement("div");
        el.className = "prov-modal";
        el.innerHTML = `<div class="prov-box" style="max-width:420px;text-align:center">
          <h3>🎁 Usaste tus ${CONFIG.freeExportsMes} exports gratis del mes</h3>
          <p class="hint" style="margin:0.8rem 0">Con el <b>Plan Pro</b> (${CONFIG.precioPro}) exportás ilimitado:</p>
          <ul style="list-style:none;text-align:left;font-size:0.85rem;line-height:1.8;padding:0 1.5rem">
            <li>📊 Excel · 📝 Word · 🗂 MD · ⚙ CSV · 📦 Odoo · 🖨 PDF</li>
            <li>📐 Planos SVG descargables sin marca</li>
            <li>📥 Informe de cliente sin marca de agua</li>
            <li>🏗️ Seguimiento de obra completo</li>
          </ul>
          <a class="btn primary" href="${CONFIG.mpLink}" target="_blank" rel="noopener" style="margin-top:1rem;display:inline-flex;text-decoration:none">💳 Activar Pro — ${CONFIG.precioPro}</a>
          <p class="hint" style="margin:0.7rem 0 0">O escribinos: <a href="https://wa.me/${CONFIG.whatsapp}" target="_blank" style="color:var(--aqua-bright)">WhatsApp</a></p>
        </div>`;
        document.body.appendChild(el);
        el.addEventListener("click", e => { if (e.target === el) el.remove(); });
        return;
      }
      fn();
      Freemium.consumeExport();
      if (!free.pro && free.remaining <= 2) {
        Enterprise.toast(`🎁 Te quedan ${free.remaining} exports gratis este mes — Plan Pro ilimitado`);
      }
    };
    $("btnXLS").onclick = guardExport(() => Obra.exportExcel(STATE));
    $("btnDOC").onclick = guardExport(() => Obra.exportWord(STATE));
    $("btnMD").onclick = guardExport(() => Obra.exportMD(STATE));
    $("btnOdoo").onclick = guardExport(() => Obra.exportOdoo(STATE));
    $("btnCSV").onclick = guardExport(exportCSV);
    $("btnPrint").onclick = guardExport(() => window.print());
  }

  function exportCSV() {
    const { cfg, geo, hyd, mat } = STATE;
    const adj = (parseFloat($("bAdj").value) || 0) / 100;
    const cont = (parseFloat($("bCont").value) || 0) / 100;
    const budget = Engine.computeBudget(cfg, geo, hyd, mat, PRICES);
    const rows = [["Rubro", "Detalle", "Cantidad", "Unidad", "PrecioARS", "SubtotalARS"]];
    budget.items.forEach(i => rows.push([i.name, i.note, i.qty, i.unit, i.price, Math.round(i.qty * i.price * (1 + adj))]));
    const subtotal = budget.items.reduce((s, i) => s + i.qty * i.price, 0) * (1 + adj);
    rows.push(["SUBTOTAL", "", "", "", "", Math.round(subtotal)]);
    rows.push(["TOTAL c/ contingencia", "", "", "", "", Math.round(subtotal * (1 + cont))]);
    const csv = "\uFEFF" + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `piletalab-${cfg.type}-${cfg.L}x${cfg.W}.csv`;
    a.click();
  }

  /* ---------- recálculo global ---------- */
  function recalc() {
    const cfg = Engine.readConfig();
    const geo = Engine.computeGeometry(cfg);
    const hyd = Engine.computeHydraulics(cfg, geo);
    const mat = Engine.computeMaterials(cfg, geo);
    STATE = { cfg, geo, hyd, mat };

    // 🏢 enterprise: push al undo stack
    if (typeof Enterprise !== "undefined" && Enterprise.UndoRedo) Enterprise.UndoRedo.push();

    renderHero(cfg.type);

    // warns en config
    const w = $("geoWarn");
    if (geo.warns.length) { w.innerHTML = geo.warns.map(x => "⚠ " + x).join("<br>"); w.classList.remove("hidden"); }
    else w.classList.add("hidden");

    // infinity box + descripción de borde visible según tipo
    $("infinityBox").classList.toggle("hidden", !cfg.infinity);
    $("fTerrain").disabled = !cfg.infinity;
    renderPlano();

    renderResults();
    renderColors(cfg);
    renderFiltration();
    if (STATE.geo) $("cVol").value = STATE.geo.volume;
    renderBudget();
    if (typeof Obra !== "undefined") Obra.render(STATE);
  }

  /* ---------- chips de innovaciones ---------- */
  function renderInnovationChips() {
    const box = $("innChips");
    box.innerHTML = INNOVATIONS.map(i => `
      <button class="chip" type="button" data-id="${i.id}" title="${i.desc}">
        <span class="ch-ic">${i.icon}</span>
        <span class="ch-tx">${i.name}${i.perM2 ? " · $/m²" : ""}</span>
        ${i.id === "aterrmico" ? '<span class="tag aqua">FÁBRICA</span>' : ""}
      </button>`).join("");
    box.querySelectorAll(".chip").forEach(c => c.addEventListener("click", () => {
      c.classList.toggle("on");
      recalc();
    }));
  }

  /* ---------- planos ---------- */
  function renderPlano() {
    const wrap = $("planoWrap");
    if (!wrap || !STATE.cfg) return;
    const view = $("plView").value, detail = $("plDetail").value;
    wrap.innerHTML = Plano.render(view, detail, STATE.cfg, STATE.geo, STATE.hyd);
  }
  function downloadSVG() {
    const svg = $("planoWrap").querySelector("svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const { cfg } = STATE;
    a.download = `plano-${$("plView").value}-${cfg.type}-${cfg.L}x${cfg.W}.svg`;
    a.click();
  }

  /* ---------- proyectos guardados (por cliente) ---------- */
  const PJ_KEY = "piletalab_projects";
  const CFG_FIELDS = ["fShape", "fLen", "fWidth", "fDepthMin", "fDepthMax", "fSolarium", "fSolW", "fUse",
    "fBorderType", "fTerrain", "fCopingType", "fFinish", "fWaste", "fBoxM2",
    "fFilter", "fSanitizer", "fDeck", "fDeckW", "fDeckMat",
    "fLights", "fLadder", "fHeat", "fCover", "fShower", "fRobot"];

  function loadProjects() {
    try { return JSON.parse(localStorage.getItem(PJ_KEY)) || []; } catch (e) { return []; }
  }
  function saveProjectsList(p) { localStorage.setItem(PJ_KEY, JSON.stringify(p)); }

  function renderProjects() {
    const list = loadProjects();
    const card = $("pjListCard");
    if (!list.length) { card.classList.add("hidden"); return; }
    card.classList.remove("hidden");
    $("pjList").innerHTML = list.map(p => `
      <button class="chip" type="button" data-load="${p.id}" title="Guardado ${p.date}">
        📁 ${Sec.escapeHtml(p.name)} · ${Sec.escapeHtml(p.label)}
        <span class="tag bad" data-del="${p.id}" title="borrar" style="margin-left:0.4rem">✕</span>
      </button>`).join("");
    $("pjList").querySelectorAll("[data-load]").forEach(b => b.addEventListener("click", e => {
      if (e.target.dataset.del) return;
      loadProject(b.dataset.load);
    }));
    $("pjList").querySelectorAll("[data-del]").forEach(x => x.addEventListener("click", e => {
      e.stopPropagation();
      saveProjectsList(loadProjects().filter(p => p.id !== x.dataset.del));
      renderProjects();
      $("pjMsg").textContent = "Proyecto borrado.";
    }));
  }

  function snapshotConfig() {
    const data = { fields: {}, innov: [] };
    CFG_FIELDS.forEach(id => {
      const el = $(id);
      if (!el) return;
      data.fields[id] = el.type === "checkbox" ? el.checked : el.value;
    });
    data.innov = [...document.querySelectorAll("#innChips .chip.on")].map(c => c.dataset.id);
    return data;
  }

  function saveProject() {
    const name = $("pjName").value.trim();
    if (!name) { $("pjMsg").textContent = "⚠️ Poné un nombre al proyecto (ej: Pileta García)."; $("pjListCard").classList.remove("hidden"); return; }
    const list = loadProjects();
    const snap = snapshotConfig();
    const type = document.querySelector("#typeCards .ts-card.selected")?.dataset.type || "arena";
    const t = POOL_TYPES.find(p => p.id === type);
    const pj = {
      id: Date.now().toString(36), name, date: new Date().toLocaleDateString("es-AR"),
      label: `${t.name.split(" ")[0]} ${$("fLen").value}×${$("fWidth").value}`, type, snap
    };
    // si ya existe uno con el mismo nombre, lo reemplaza
    const filtered = list.filter(p => p.name !== name);
    filtered.push(pj);
    saveProjectsList(filtered);
    renderProjects();
    $("pjMsg").textContent = `💾 "${name}" guardado (${pj.label}). Guardar de nuevo con el mismo nombre lo actualiza.`;
  }

  function loadProject(id) {
    const pj = loadProjects().find(p => p.id === id);
    if (!pj) return;
    // tipo
    const card = document.querySelector(`.type-card[data-type="${pj.type}"]`);
    if (card) { document.querySelectorAll(".type-card").forEach(c => c.classList.remove("selected")); card.classList.add("selected"); }
    applyTypePreset(pj.type);
    // campos
    Object.entries(pj.snap.fields).forEach(([idv, v]) => {
      const el = $(idv);
      if (!el) return;
      if (el.type === "checkbox") el.checked = v; else el.value = v;
    });
    // innovaciones
    document.querySelectorAll("#innChips .chip").forEach(c =>
      c.classList.toggle("on", pj.snap.innov.includes(c.dataset.id)));
    $("pjName").value = pj.name;
    syncFinishOptions();
    recalc();
    $("pjMsg").textContent = `📂 "${pj.name}" cargado.`;
    document.getElementById("tab-config").scrollIntoView({ behavior: "smooth" });
  }

  /* ---------- sistema de roles (cliente / pro / proveedor) ---------- */
  const ROLE_KEY = "piletalab_role";
  let currentRole = localStorage.getItem(ROLE_KEY) || "pro";

  function applyRole() {
    document.body.dataset.role = currentRole;
    const isPro = currentRole === "pro";
    // grupos visibles solo para pro (cliente y proveedor tienen su área propia)
    ["grpDiseno", "grpConstruccion", "grpNegocio", "grpRecursos"].forEach(id => {
      const g = document.getElementById(id);
      if (g) g.style.display = isPro ? "" : "none";
    });
    const bc = $("btnTabCliente"), bp = $("btnTabProveedor");
    bc.style.display = currentRole === "cliente" ? "" : "none";
    bp.style.display = currentRole === "proveedor" ? "" : "none";
    // chip de rol en el header
    const chips = { cliente: "👤 cliente", pro: "🏗️ profesional", proveedor: "🚚 proveedor" };
    let chip = document.getElementById("roleChip");
    if (!chip) {
      chip = document.createElement("button");
      chip.id = "roleChip";
      chip.className = "btn mini";
      chip.style.marginLeft = "auto";
      document.querySelector(".tabs").prepend(chip);
      chip.addEventListener("click", () => {
        document.getElementById("roles").scrollIntoView({ behavior: "smooth" });
      });
    }
    chip.textContent = chips[currentRole] + " · cambiar";
    // navegar al área del rol si no es pro
    if (!isPro) {
      const target = currentRole === "cliente" ? "cliente" : "proveedor";
      const btn = document.querySelector(`#mainTabs button[data-tab="${target}"]`);
      if (btn && !document.getElementById("tab-" + target).classList.contains("active")) btn.click();
    }
    if (currentRole === "cliente") renderCliente();
    if (currentRole === "proveedor") renderProveedor();
  }

  function setRole(r) {
    currentRole = r;
    localStorage.setItem(ROLE_KEY, r);
    applyRole();
  }

  /* ---------- ÁREA CLIENTE ---------- */
  let clTypeCache = null;
  function renderCliente() {
    // tira compacta de tipos (misma que usa el profesional)
    const box = $("clTypes");
    if (!clTypeCache) {
      clTypeCache = true;
      renderTypeStrip(box, "arena", () => clienteCalc());
      $("clQuestions").innerHTML = CLIENT_QUESTIONS.map((q, i) => `<li><b>${i + 1}.</b> ${q}</li>`).join("");
      $("clKit").innerHTML = `<table><thead><tr><th>Qué comprar</th><th>Precio aprox.</th><th>Para qué</th></tr></thead>
        <tbody>${CLIENT_KIT.map(k => `<tr><td><b>${k.item}</b></td><td>${k.price ? E.fmtARS(k.price) : "según superficie"}</td><td style="color:var(--muted);font-size:0.8rem">${k.note}</td></tr>`).join("")}</tbody></table>`;
      ["clL", "clW", "clDepth", "clLights", "clHeat", "clInfinity"].forEach(id =>
        $(id).addEventListener("change", clienteCalc));
      ["clL", "clW"].forEach(id => $(id).addEventListener("input", clienteCalc));
    }
    clienteCalc();
  }

  function clienteCalc() {
    const typeId = document.querySelector("#clTypes .ts-card.selected")?.dataset.type || "arena";
    const t = POOL_TYPES.find(p => p.id === typeId);
    const L = parseFloat($("clL").value), W = parseFloat($("clW").value);
    const dep = CLIENT_DEPTHS[$("clDepth").value];
    const lights = $("clLights").checked, heat = $("clHeat").checked;
    const infinity = $("clInfinity").checked && t.infinity;
    // config interna para usar el motor SIN mostrar tripas
    const cfg = {
      type: typeId, tdef: t, shape: "rect", L, W, dMin: dep.dMin, dMax: dep.dMax,
      solarium: false, solW: 3, use: "res", borderType: infinity ? "infinity1" : "skimmer",
      infinity, infSides: 1, terrain: "slope", copingType: "stone",
      deck: false, deckW: 2, deckMat: "madera", finish: t.finishes.includes("venecita") ? "venecita" : t.finishes[0],
      waste: 0.08, boxM2: 2.07, filter: "arena", sanitizer: "cl",
      lights, ladder: true, heat, cover: heat, shower: false, robot: false, innovations: []
    };
    try {
      const geo = Engine.computeGeometry(cfg);
      const hyd = Engine.computeHydraulics(cfg, geo);
      const mat = Engine.computeMaterials(cfg, geo);
      const budget = Engine.computeBudget(cfg, geo, hyd, mat, DEFAULT_PRICES);
      const cost = budget.items.reduce((s, i) => s + i.qty * i.price, 0) * 1.10; // +contingencia
      const price = cost * 1.35 * 1.21;  // margen de mercado + IVA
      const from = price * 0.85, to = price * 1.25;
      $("clResult").innerHTML = `
        <div class="kpi-grid">
          <div class="kpi hl"><div class="k-label">Precio estimado de obra</div>
            <div class="k-value" style="font-size:1.15rem">${E.fmtARS(from)}</div>
            <div class="k-sub">hasta ${E.fmtARS(to)} según zona y terminaciones</div></div>
          <div class="kpi"><div class="k-label">Obra de</div><div class="k-value">${t.timeLabel.split("obra")[0].trim()}</div><div class="k-sub">${t.timeLabel}</div></div>
          <div class="kpi"><div class="k-label">Capacidad</div><div class="k-value">${E.fmt(geo.volume)} m³</div><div class="k-sub">≈ ${Math.round(geo.volume / 2.5)} bañistas a la vez</div></div>
          ${heat ? `<div class="kpi hl"><div class="k-label">Calefacción</div><div class="k-value">${hyd.heatKW} kW</div><div class="k-sub">pileta a 28° todo el año (pedí cobertor SIEMPRE)</div></div>` : ""}
          ${infinity ? `<div class="kpi"><div class="k-label">Borde infinito</div><div class="k-value">sí ∞</div><div class="k-sub">el look premium — suma entre 15 y 25% a la obra</div></div>` : ""}
        </div>
        <div class="warn" style="margin-top:0.6rem">📋 Estimación orientativa de mercado para ${t.name.toLowerCase()} ${L}×${W} m (${dep.label.split("(")[0].trim()}). El precio final lo arma un constructor con tu terreno a la vista — usá las 8 preguntas de abajo para elegirlo bien.</div>
        <div class="next-step" style="justify-content:flex-start;margin-top:0.8rem">
          <a class="btn primary" href="https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent("Hola! Vi ObraAcuática y quiero una pileta " + t.name + " de " + L + "x" + W + " m. Me pasan presupuesto?")}" target="_blank" rel="noopener">📩 Pedir presupuesto real</a>
        </div>`;
    } catch (e) {
      $("clResult").innerHTML = `<div class="warn">Elegí medidas más estándar (ej: 8×4) para la estimación.</div>`;
    }
  }

  /* ---------- ÁREA PROVEEDOR ---------- */
  const OFFERS_KEY = "piletalab_offers";
  function loadOffers() { try { return JSON.parse(localStorage.getItem(OFFERS_KEY)) || []; } catch (e) { return []; } }

  function renderProveedor() {
    // categorías en el select
    const sel = $("pvCat");
    if (!sel.options.length) {
      sel.innerHTML = Object.entries(PROVIDERS).map(([k, p]) => `<option value="${k}">${p.icon} ${p.name}</option>`).join("");
      $("pvPublish").addEventListener("click", publishOffer);
      $("pvRegister").addEventListener("click", registerProvider);
    }
    // demanda: presupuesto de una 8x4 familiar agrupado por categoría
    const cfg = {
      type: "arena", tdef: POOL_TYPES[0], shape: "rect", L: 8, W: 4, dMin: 1.4, dMax: 1.7,
      solarium: false, solW: 3, use: "res", borderType: "skimmer", infinity: false, infSides: 1,
      terrain: "slope", copingType: "stone", deck: false, deckW: 2, deckMat: "madera", finish: "venecita",
      waste: 0.08, boxM2: 2.07, filter: "arena", sanitizer: "cl", lights: true, ladder: true,
      heat: false, cover: false, shower: false, robot: false, innovations: []
    };
    const geo = Engine.computeGeometry(cfg);
    const hyd = Engine.computeHydraulics(cfg, geo);
    const mat = Engine.computeMaterials(cfg, geo);
    const budget = Engine.computeBudget(cfg, geo, hyd, mat, DEFAULT_PRICES);
    const byCat = {};
    budget.items.forEach(i => {
      const cat = ITEM_PROVIDER[i.key] || "otros";
      if (!byCat[cat]) byCat[cat] = { items: [], total: 0 };
      byCat[cat].items.push(`${i.name} — ${E.fmt(i.qty)} ${i.unit}`);
      byCat[cat].total += i.qty * i.price;
    });
    $("pvDemanda").innerHTML = `<table><thead><tr><th>Categoría</th><th>Qué piden</th><th>Ticket aprox. de la compra</th></tr></thead>
      <tbody>${Object.entries(byCat).map(([cat, d]) => {
        const p = PROVIDERS[cat] || { icon: "📦", name: "Otros" };
        return `<tr><td><b>${p.icon} ${p.name}</b></td><td style="font-size:0.8rem;color:var(--muted)">${d.items.join("<br>")}</td><td><b>${E.fmtARS(d.total)}</b></td></tr>`;
      }).join("")}</tbody></table>`;
    renderOffers();
  }

  function renderOffers() {
    const offers = loadOffers();
    $("pvOffers").innerHTML = offers.length ? offers.map((o, i) => `
      <div class="offer-row">
        <div><b>${Sec.escapeHtml(o.title)}</b> ${o.price ? `<span class="tag aqua">${E.fmtARS(o.price)}</span>` : ""}
        <br><small style="color:var(--muted)">${Sec.escapeHtml(o.detail || "")} · ${Sec.escapeHtml(o.name)} · ${Sec.escapeHtml(o.city || "")}</small></div>
        <div>
          ${o.phone ? `<a class="btn mini" href="https://wa.me/${o.phone.replace(/[^0-9]/g, "")}" target="_blank">WhatsApp</a>` : ""}
          <button class="btn mini danger" data-offer-del="${i}">borrar</button>
        </div>
      </div>`).join("") : `<p class="hint">Todavía no hay ofertas publicadas en esta computadora — publicá la primera al lado. (En la versión online, las ofertas de todos los proveedores de tu zona aparecen acá.)</p>`;
    $("pvOffers").querySelectorAll("[data-offer-del]").forEach(b => b.addEventListener("click", () => {
      const list = loadOffers();
      list.splice(parseInt(b.dataset.offerDel), 1);
      localStorage.setItem(OFFERS_KEY, JSON.stringify(list));
      renderOffers();
    }));
  }

  function publishOffer() {
    const name = $("pvName").value.trim();
    if (!name) { $("pvMsg").textContent = "⚠️ Poné el nombre de tu negocio."; return; }
    const offers = loadOffers();
    offers.unshift({
      title: $("pvOfferTitle").value.trim() || "Oferta de " + name,
      price: parseFloat($("pvOfferPrice").value) || 0,
      detail: $("pvOfferDetail").value.trim(),
      cat: $("pvCat").value, name, city: $("pvCity").value.trim(),
      phone: $("pvPhone").value.trim(), when: new Date().toLocaleDateString("es-AR")
    });
    localStorage.setItem(OFFERS_KEY, JSON.stringify(offers));
    $("pvMsg").textContent = "✅ Oferta publicada.";
    $("pvOfferTitle").value = ""; $("pvOfferPrice").value = ""; $("pvOfferDetail").value = "";
    renderOffers();
  }

  function registerProvider() {
    const name = $("pvName").value.trim();
    if (!name) { $("pvMsg").textContent = "⚠️ Completá tu nombre de negocio primero."; return; }
    const dir = JSON.parse(localStorage.getItem("piletalab_directorio") || "[]");
    if (!dir.some(p => p.name === name)) {
      dir.push({ cat: $("pvCat").value, name, km: null, phone: $("pvPhone").value.trim(), city: $("pvCity").value.trim(), registered: true });
      localStorage.setItem("piletalab_directorio", JSON.stringify(dir));
      $("pvMsg").textContent = "✅ Agregado al directorio: los constructores te van a ver al presupuestar rubros de tu categoría.";
    } else $("pvMsg").textContent = "Ya estás en el directorio 👍";
  }

  /* ---------- asistente IA ---------- */
  let chatHistory = [];
  const CHAT_KEY = "piletalab_chat";

  function saveChat() {
    try { localStorage.setItem(CHAT_KEY, JSON.stringify(chatHistory.slice(-30))); } catch (e) { }
  }
  function loadChatUI() {
    try {
      const saved = JSON.parse(localStorage.getItem(CHAT_KEY) || "[]");
      if (!saved.length) return false;
      $("chatBox").innerHTML = "";
      saved.forEach(m => {
        if (m.role === "user") addMsg(m.content, "user");
        else { const b = document.createElement("div"); b.className = "msg bot"; b.innerHTML = miniMD(m.content); $("chatBox").appendChild(b); }
      });
      $("chatBox").scrollTop = 1e9;
      return true;
    } catch (e) { return false; }
  }

  function miniMD(txt) {
    // mini markdown: escape → negritas → tablas → saltos
    let s = txt.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    s = s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    // tabla | a | b |
    const lines = s.split("\n");
    let html = "", inTable = false;
    lines.forEach(ln => {
      const cells = ln.trim().startsWith("|") ? ln.trim().split("|").slice(1, -1) : null;
      if (cells) {
        if (!inTable) { html += '<table>'; inTable = true; }
        const isHead = cells.every(c => /^[\s-:]+$/.test(c));
        if (!isHead) html += "<tr>" + cells.map(c => `<td>${c.trim()}</td>`).join("") + "</tr>";
      } else {
        if (inTable) { html += "</table>"; inTable = false; }
        html += ln + "\n";
      }
    });
    if (inTable) html += "</table>";
    return html.replace(/\n/g, "<br>").replace(/<br><table>/g, "<table>").replace(/<\/table><br>/g, "</table>");
  }

  function addMsg(text, who, src) {
    const box = $("chatBox");
    const div = document.createElement("div");
    div.className = "msg " + who;
    if (who === "bot") div.innerHTML = miniMD(text);
    else div.textContent = text;   // 🛡️ el input del usuario NUNCA se renderiza como HTML (anti-XSS)
    if (src) div.innerHTML += `<span class="src">${src === "online" ? "🟢 motor IA conectado" : src === "fallback" ? "⚠️ fallback a experto offline" : "⚪ experto offline (sin conexión requerida)"}</span>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function showTyping() {
    const box = $("chatBox");
    const div = document.createElement("div");
    div.className = "msg bot typing";
    div.id = "typingMsg";
    div.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }
  function hideTyping() { $("typingMsg")?.remove(); }

  async function sendIA(q) {
    if (!q.trim()) return;
    addMsg(q, "user");
    $("iaInput").value = "";
    chatHistory.push({ role: "user", content: q });
    saveChat();
    showTyping();
    // burbuja viva: el streaming la va llenando; en offline queda vacía y se usa al final
    let live = document.getElementById("liveBubble");
    if (!live) {
      live = document.createElement("div");
      live.className = "msg bot";
      live.id = "liveBubble";
      $("chatBox").appendChild(live);
    }
    const scroll = () => { $("chatBox").scrollTop = 1e9; };
    const res = await IA.ask(q, chatHistory, STATE, (delta, full) => {
      hideTyping();
      live.innerHTML = miniMD(full);
      scroll();
    });
    hideTyping();
    const srcTag = res.source === "online" ? "🟢 motor IA conectado" : res.source === "fallback" ? "⚠️ fallback a experto offline" : "⚪ experto offline (sin conexión requerida)";
    live.innerHTML = miniMD(res.text) + `<span class="src">${srcTag}</span>`;
    live.removeAttribute("id");
    scroll();
    chatHistory.push({ role: "assistant", content: res.text });
    if (chatHistory.length > 30) chatHistory = chatHistory.slice(-26);
    saveChat();
  }

  function refreshIAStatus() {
    const st = $("iaStatus");
    if (IA.isOnlineReady()) { st.textContent = "🟢 IA conectada"; st.classList.add("on"); }
    else { st.textContent = "⚪ offline (experto local)"; st.classList.remove("on"); }
  }

  function initIA() {
    // settings guardados
    const s = IA.loadSettings();
    if (s.preset) $("iaPreset").value = s.preset;
    if (s.base) $("iaBase").value = s.base;
    if (s.model) $("iaModel").value = s.model;
    if (s.key) $("iaKey").value = s.key;
    if (s.mode) $("iaMode").value = s.mode;
    refreshIAStatus();

    $("iaPreset").addEventListener("change", () => {
      const p = IA.PRESETS[$("iaPreset").value];
      if (p && p.base) { $("iaBase").value = p.base; $("iaModel").value = p.model; }
    });

    $("iaSave").addEventListener("click", () => {
      IA.saveSettings({
        preset: $("iaPreset").value, base: $("iaBase").value.trim(),
        model: $("iaModel").value.trim(), key: $("iaKey").value.trim(),
        mode: $("iaMode").value
      });
      refreshIAStatus();
      $("iaTestMsg").textContent = "💾 Guardado en este navegador.";
    });

    $("iaTest").addEventListener("click", async () => {
      // guarda silenciosamente antes de probar para usar lo que está en pantalla
      IA.saveSettings({
        preset: $("iaPreset").value, base: $("iaBase").value.trim(),
        model: $("iaModel").value.trim(), key: $("iaKey").value.trim(),
        mode: $("iaMode").value
      });
      $("iaTestMsg").textContent = "⏳ Probando…";
      const r = await IA.testConnection();
      $("iaTestMsg").textContent = r.msg;
      refreshIAStatus();
    });

    $("iaSend").addEventListener("click", () => sendIA($("iaInput").value));
    $("iaInput").addEventListener("keydown", e => { if (e.key === "Enter") sendIA($("iaInput").value); });

    document.querySelectorAll("#iaChips .chip").forEach(c =>
      c.addEventListener("click", () => sendIA(c.textContent)));

    // limpiar conversación
    $("iaClear").addEventListener("click", () => {
      if (!confirm("¿Borrar toda la conversación?")) return;
      chatHistory = [];
      localStorage.removeItem(CHAT_KEY);
      $("chatBox").innerHTML = "";
      addMsg("Conversación borrada. ¿En qué te ayudo?", "bot");
    });

    // bienvenida o memoria de la sesión anterior
    chatHistory = JSON.parse(localStorage.getItem(CHAT_KEY) || "[]");
    const restored = loadChatUI();
    if (!restored) {
      addMsg("¡Hola! Soy tu asistente especialista de ObraAcuática 🤖 — arquitecto, constructor y comprador de piletas. Preguntame por recomendaciones, comparativas, química del agua, compras o el negocio. Si conectás tu motor IA (⚙ arriba) respondo cualquier consulta abierta.", "bot");
    } else {
      addMsg(`📂 Retomamos donde dejaste (${chatHistory.length} mensajes en memoria).`, "bot");
    }
  }

  /* ---------- comparador A/B ---------- */
  let compareA = null;

  function metricsNow() {
    const { cfg, geo, hyd, mat } = STATE;
    const adj = (parseFloat($("bAdj")?.value) || 0) / 100;
    const cont = (parseFloat($("bCont")?.value) || 10) / 100;
    const margin = (parseFloat($("bMargin")?.value) || 35) / 100;
    const withIVA = $("bIva")?.checked !== false;
    const b = Engine.computeBudget(cfg, geo, hyd, mat, PRICES);
    const cost = b.items.reduce((s, i) => s + i.qty * i.price, 0) * (1 + adj);
    const price = cost * (1 + cont) * (1 + margin) * (withIVA ? 1.21 : 1);
    const d = PHASE_DURATIONS[cfg.type] || {};
    const weeks = Object.values(d).reduce((a, c) => a + c, 0);
    return {
      label: `${cfg.tdef.name.split(" ")[0]} ${cfg.L}×${cfg.W} · ${FINISHES[cfg.finish].name.split("(")[0].trim().slice(0, 18)}`,
      vol: geo.volume, hp: hyd.pumpHP, weeks, cost, price, items: b.items.length,
      filter: hyd.filterDesc.split("·")[0].trim()
    };
  }

  function renderCompare() {
    const card = $("abCard");
    if (!card) return;
    if (!compareA) { card.classList.add("hidden"); return; }
    card.classList.remove("hidden");
    const A = compareA, B = metricsNow();
    const row = (label, va, vb, fmtFn, lowerBetter) => {
      const same = va === vb;
      const arrow = same ? "＝" : (vb > va ? "▲" : "▼");
      const color = same ? "var(--muted)" : ((lowerBetter ? vb < va : vb > va) ? "var(--ok)" : "var(--bad)");
      return `<tr><td>${label}</td><td><b>${fmtFn(va)}</b></td><td style="color:${color}"><b>${fmtFn(vb)}</b> ${arrow}</td></tr>`;
    };
    $("abBody").innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th></th><th>⚖️ A (fijada)</th><th>live — configuración actual (B)</th></tr></thead>
        <tbody>
          <tr><td>Sistema</td><td><b>${A.label}</b></td><td><b>${B.label}</b></td></tr>
          ${row("Volumen", A.vol, B.vol, v => E.fmt(v) + " m³")}
          ${row("Plazo de obra", A.weeks, B.weeks, v => E.fmt(v) + " sem", true)}
          ${row("Bomba", A.hp, B.hp, v => v + " HP", true)}
          ${row("Costo neto materiales", A.cost, B.cost, E.fmtARS, true)}
          ${row("Precio de venta (llave en mano)", A.price, B.price, E.fmtARS)}
          ${row("Rubros del presupuesto", A.items, B.items, v => v, true)}
          <tr><td>Filtración</td><td>${A.filter}</td><td>${B.filter}</td></tr>
        </tbody>
      </table></div>
      <div class="next-step" style="justify-content:flex-start;margin-top:0.6rem">
        <button class="btn" id="abSet2" type="button">🔄 Fijar la actual como nueva A</button>
        <button class="btn mini danger" id="abClear" type="button">quitar comparación</button>
      </div>`;
    $("abSet2").onclick = () => { compareA = metricsNow(); renderCompare(); };
    $("abClear").onclick = () => { compareA = null; renderCompare(); };
  }

  /* ---------- robustez: errores globales visibles + auditados ---------- */
  function initGlobalErrors() {
    let last = 0;
    const toast = msg => {
      if (Date.now() - last < 10000) return;
      last = Date.now();
      if (typeof Sec !== "undefined") Sec.audit("error_js", String(msg).slice(0, 100));
      const n = document.createElement("div");
      n.className = "warn";
      n.style.cssText = "position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:200;max-width:92vw";
      n.textContent = "⚠️ Error inesperado (registrado en auditoría): " + String(msg).slice(0, 140);
      document.body.appendChild(n);
      setTimeout(() => n.remove(), 6000);
    };
    window.addEventListener("error", e => toast(e.message));
    window.addEventListener("unhandledrejection", e => toast(e.reason?.message || String(e.reason)));
  }

  /* ---------- cuenta / seguridad ---------- */
  let twoFASetup = null;

  function renderAuth() {
    const box = $("authBody");
    if (!box) return;
    const u = Auth.current();
    const chip = $("userChip");
    if (u) {
      chip.classList.remove("hidden");
      chip.innerHTML = `<span class="uc-avatar">${u.name.charAt(0).toUpperCase()}</span>
        <span class="uc-info"><b>${u.name}</b><small>${u.role === "dueño" ? "👑 dueño/admin" : "usuario"}${u.twofaOn ? " · 2FA ✓" : ""}${u.passkeyOn ? " · 🔑" : ""}</small></span>
        <button class="btn mini" id="ucLogout">salir</button>`;
      $("ucLogout").onclick = () => { Auth.logout(); renderAuth(); if (typeof renderFactory === "function") renderFactory(); };
    } else chip.classList.add("hidden");

    if (!u) {
      box.innerHTML = `
      <div class="grid-2">
        <div class="card">
          <h2>Iniciar sesión</h2>
          <div class="form-row"><label>Email <input type="email" id="liEmail"></label></div>
          <div class="form-row"><label>Contraseña <input type="password" id="liPass"></label></div>
          <div class="form-row hidden" id="li2FARow"><label>Código 2FA (6 dígitos o código de recuperación) <input type="text" id="liCode" maxlength="10"></label></div>
          <label class="chk" style="margin-bottom:0.6rem"><input type="checkbox" id="liKeep" checked> 💾 Recordarme en esta computadora (no volver a entrar)</label>
          <p class="hint" id="liMsg"></p>
          <div class="next-step" style="justify-content:flex-start">
            <button class="btn primary" id="liGo">Entrar</button>
            <button class="btn" id="liPasskey">🔑 Passkey (huella / Face ID)</button>
          </div>
          <p class="hint" style="margin-top:0.7rem">👤 <b>Primer uso:</b> create tu cuenta al lado — el primero que se registra queda como <b>dueño</b>. Marcá "recordarme" y de acá en más la app abre con tu sesión activa y las fórmulas de fábrica a la vista, sin pedirte nada.</p>
        </div>
        <div class="card">
          <h2>Registrarse</h2>
          <p class="hint">El <b>primer usuario registrado queda como dueño/admin</b> (panel de administración, backup y control de cambios). Después: rol usuario.</p>
          <div class="form-row"><label>Nombre <input type="text" id="rgName"></label></div>
          <div class="form-row"><label>Email <input type="email" id="rgEmail"></label></div>
          <div class="form-row"><label>Contraseña (8+ caracteres) <input type="password" id="rgPass"></label></div>
          <p class="hint" id="rgMsg"></p>
          <div class="next-step" style="justify-content:flex-start"><button class="btn" id="rgGo">Crear cuenta</button></div>
        </div>
        <div class="card" style="grid-column:1/-1">
          <h2>Ingreso social — próximo paso (requiere versión online)</h2>
          <p class="hint">Google, Telegram, LinkedIn, WhatsApp, iPhone (Apple), Facebook e Instagram exigen backend propio + dominio HTTPS + cuentas de desarrollador aprobadas (y WhatsApp ni ofrece login público OAuth). En la versión online con backend se activan con sus claves de desarrollador; acá quedan listadas para el roadmap:</p>
          <div class="chip-grid">
            ${["🔵 Google", "✈️ Telegram", "💼 LinkedIn", "🟢 WhatsApp*", "", "🍎 iPhone / Apple", "📘 Facebook", "📸 Instagram"].filter(Boolean).map(s => `<button class="chip" type="button" disabled style="opacity:0.45;cursor:not-allowed">${s}</button>`).join("")}
          </div>
          <p class="hint" style="margin:0.6rem 0 0">* WhatsApp no provee login OAuth público: la vía real es OTP por WhatsApp Business API (pago). Mientras tanto: contraseña + 2FA TOTP (Google Authenticator/Authy/Microsoft) + passkey biométrica — todas funcionando ya en esta app.</p>
        </div>
      </div>`;
      wireLoggedOut();
      return;
    }

    /* ---- sesión activa ---- */
    box.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <h2>Tu sesión</h2>
        <div class="kpi-grid">
          <div class="kpi hl"><div class="k-label">Usuario</div><div class="k-value" style="font-size:1.05rem">${u.name}</div><div class="k-sub">${u.email}</div></div>
          <div class="kpi"><div class="k-label">Rol</div><div class="k-value" style="font-size:1.05rem">${u.role === "dueño" ? "👑 Dueño" : "Usuario"}</div><div class="k-sub">desde ${u.created}</div></div>
          <div class="kpi"><div class="k-label">2FA</div><div class="k-value" style="font-size:1.05rem">${u.twofaOn ? "✅ activo" : "—inactivo"}</div><div class="k-sub">TOTP 30 s</div></div>
          <div class="kpi"><div class="k-label">Passkey</div><div class="k-value" style="font-size:1.05rem">${u.passkeyOn ? "✅ activo" : "—sin"}</div><div class="k-sub">huella / Face ID</div></div>
        </div>
        <div class="next-step" style="justify-content:flex-start"><button class="btn" id="ucOut2">Cerrar sesión</button></div>
      </div>

      <div class="card">
        <h2>Doble factor (2FA)</h2>
        ${u.twofaOn ? `
          <p class="hint">✅ 2FA activo. Para desactivarlo (no recomendado):</p>
          <button class="btn" id="twoOff">Desactivar 2FA</button>`
        : `
          <p class="hint">Activalo con cualquier app autenticadora: <b>Google Authenticator, Authy, Microsoft Authenticator, FreeOTP</b>. Código TOTP real (RFC 6238) que cambia cada 30 segundos.</p>
          <button class="btn primary" id="twoStart">Activar 2FA</button>
          <div id="twoSetupBox" class="sub-box hidden" style="margin-top:0.8rem"></div>`}
      </div>

      <div class="card">
        <h2>Passkey biométrica</h2>
        <p class="hint">Entrar con <b>huella, Face ID o Windows Hello</b> sin escribir contraseña. Usa el autenticador de plataforma del dispositivo.</p>
        <button class="btn" id="pkAdd">${u.passkeyOn ? "Reemplazar passkey" : "Registrar passkey"}</button>
        <p class="hint" id="pkMsg" style="margin:0.5rem 0 0"></p>
      </div>

      ${Auth.isAdmin() ? `
      <div class="card" style="grid-column:1/-1">
        <h2>👑 Panel del dueño</h2>
        <p class="hint">Control de la app: usuarios, backup completo (precios, proveedores, obras, IA settings) y restauración.</p>
        <div id="adminBox"></div>
        <div id="auditBox"></div>
        <div class="next-step" style="justify-content:flex-start;margin-top:0.8rem">
          <button class="btn" id="adBackup">💾 Descargar backup total (.json)</button>
          <label class="btn" style="display:inline-flex;align-items:center">📂 Restaurar backup
            <input type="file" id="adRestore" accept=".json" style="display:none">
          </label>
        </div>
        <p class="hint" id="adMsg" style="margin:0.5rem 0 0"></p>
      </div>` : ""}
    </div>`;
    wireLoggedIn(u);
  }

  function wireLoggedOut() {
    $("rgGo").onclick = async () => {
      const r = await Auth.register($("rgName").value, $("rgEmail").value, $("rgPass").value);
      $("rgMsg").textContent = r.ok ? (r.isFirst ? "✅ Cuenta creada como DUEÑO/Admin (sos el primer usuario). Iniciá sesión →" : "✅ Cuenta creada. Iniciá sesión →") : "❌ " + r.msg;
      if (r.ok) { $("liEmail").value = $("rgEmail").value; }
    };
    $("liGo").onclick = async () => {
      const r = await Auth.login($("liEmail").value, $("liPass").value, $("liCode")?.value, $("liKeep").checked);
      $("liMsg").textContent = r.ok ? "✅ Bienvenido." : "❌ " + r.msg;
      if (r.need2FA) $("li2FARow").classList.remove("hidden");
      if (r.ok) { await new Promise(x => setTimeout(x, 300)); renderAuth(); if (typeof renderFactory === "function") renderFactory(); }
    };
    $("liPasskey").onclick = async () => {
      const r = await Auth.loginPasskey($("liKeep").checked);
      $("liMsg").textContent = r.ok ? "✅ " + r.user.name : "❌ " + r.msg;
      if (r.ok) renderAuth();
    };
    $("liPass").addEventListener("keydown", e => { if (e.key === "Enter") $("liGo").click(); });
  }

  function wireLoggedIn(u) {
    $("ucOut2").onclick = () => { Auth.logout(); renderAuth(); };

    if (u.twofaOn) {
      $("twoOff").onclick = () => { Auth.disable2FA(); renderAuth(); };
    } else {
      $("twoStart").onclick = () => {
        twoFASetup = Auth.begin2FA();
        const bx = $("twoSetupBox");
        bx.classList.remove("hidden");
        bx.innerHTML = `
          <p class="hint" style="margin-bottom:0.5rem"><b>Paso 1:</b> abrí tu app autenticadora → "Agregar cuenta" → "Clave de configuración" y cargá:</p>
          <div class="secret-box">${twoFASetup.secret}</div>
          <p class="hint" style="margin:0.4rem 0">o pegá esta URI en apps que lo permiten:</p>
          <div class="secret-box" style="font-size:0.68rem">${twoFASetup.uri}</div>
          <p class="hint" style="margin:0.6rem 0 0.4rem"><b>Paso 2:</b> escribí el código de 6 dígitos que te muestra la app para confirmar:</p>
          <div class="form-row" style="margin-bottom:0.4rem"><label style="flex:0 0 160px">Código <input type="text" id="twoCode" maxlength="6" inputmode="numeric"></label></div>
          <button class="btn primary" id="twoConfirm">Confirmar y activar</button>
          <p class="hint" id="twoMsg" style="margin:0.5rem 0 0"></p>`;
        $("twoConfirm").onclick = async () => {
          const r = await Auth.confirm2FA(twoFASetup.secret, $("twoCode").value);
          $("twoMsg").textContent = r.ok ? "✅ 2FA activado." : "❌ " + r.msg;
          if (r.ok) {
            $("twoMsg").innerHTML += `<br><br><b>Guardá estos códigos de recuperación de un solo uso</b> (para entrar si perdés el teléfono):<br>
            <div class="secret-box" style="text-align:left">${r.codes.join("<br>")}</div>`;
            setTimeout(renderAuth, 8000);
          }
        };
      };
    }

    $("pkAdd").onclick = async () => {
      const r = await Auth.addPasskey();
      $("pkMsg").textContent = (r.ok ? "✅ " : "❌ ") + r.msg;
      if (r.ok) setTimeout(renderAuth, 1200);
    };

    if (Auth.isAdmin()) {
      const renderAdmin = () => {
        const L = Auth.adminList();
        if (!L.ok) return;
        $("adminBox").innerHTML = `<table><thead><tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Desde</th><th></th></tr></thead>
          <tbody>${L.users.map(x => `<tr>
            <td><b>${x.name}</b></td><td>${x.email}</td><td>${x.role === "dueño" ? "👑 dueño" : x.role}</td><td>${x.created}</td>
            <td>${x.email !== u.email ? `<button class="btn mini danger" onclick="UI.adminDel('${x.email}')">quitar</button>` : "(vos)"}</td>
          </tr>`).join("")}</tbody></table>`;
      };
      renderAdmin();
      window.UI_adminRender = renderAdmin;

      $("adBackup").onclick = async () => {
        const b = Auth.exportAll();
        if (!b.ok) return;
        // 🛡️ backup CIFRADO AES-256-GCM: sin la passphrase es un ladrillo
        const pass1 = prompt("🔐 Passphrase del backup (mínimo 10 caracteres — sin ella NO se puede restaurar):");
        if (!pass1 || pass1.length < 10) { $("adMsg").textContent = "⚠️ Passphrase demasiado corta: backup cancelado."; return; }
        if (prompt("Repetí la passphrase para confirmar:") !== pass1) { $("adMsg").textContent = "⚠️ No coinciden: backup cancelado."; return; }
        const enc = await Sec.aesEncrypt(b, pass1);
        const blob = new Blob([JSON.stringify(enc, null, 1)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "piletalab-backup-CIFRADO-" + new Date().toISOString().slice(0, 10) + ".json.enc";
        a.click();
        Sec.audit("backup_exportado", "AES-256-GCM");
        $("adMsg").textContent = "💾 Backup CIFRADO descargado. Guardá la passphrase aparte del archivo.";
      };
      $("adRestore").onchange = async e => {
        const f = e.target.files[0];
        if (!f) return;
        try {
          const payload = JSON.parse(await f.text());
          const pass = prompt("🔐 Passphrase del backup:");
          const data = await Sec.aesDecrypt(payload, pass);   // GCM autentica: clave mala = error
          const r = Auth.importAll(JSON.stringify(data.data));
          Sec.audit("backup_importado", "ok");
          $("adMsg").textContent = r.ok ? "✅ Restaurado y verificado — recargando…" : "❌ " + r.msg;
          if (r.ok) setTimeout(() => location.reload(), 900);
        } catch (err) {
          Sec.audit("backup_rechazado", "passphrase incorrecta o archivo inválido");
          $("adMsg").textContent = "❌ Passphrase incorrecta o archivo inválido (el cifrado autentica el contenido).";
        }
      };

      // 🛡️ visor de auditoría (cadena hash verificable)
      const renderAudit = async () => {
        const events = Sec.auditGet().slice(-12).reverse();
        const v = await Sec.auditVerify();
        const boxA = document.getElementById("auditBox");
        if (boxA) boxA.innerHTML = `
          <h3 class="phase-title">🛡️ Registro de seguridad ${v.ok ? '<span class="tag ok">cadena íntegra ✓</span>' : '<span class="tag bad">CADENA ROTA ⚠️</span>'}</h3>
          <div class="table-wrap"><table>
            <thead><tr><th>Cuándo</th><th>Evento</th><th>Detalle</th></tr></thead>
            <tbody>${events.map(x => `<tr><td style="font-size:0.75rem">${new Date(x.t).toLocaleString("es-AR")}</td><td><b>${Sec.escapeHtml(x.event)}</b></td><td style="font-size:0.78rem;color:var(--muted)">${x.detail}</td></tr>`).join("")}</tbody>
          </table></div>
          <p class="hint" style="margin-top:0.4rem">Cada entrada encadena el hash SHA-256 de la anterior: si alguien edita o borra una entrada, la cadena deja de cuadrar.</p>`;
      };
      renderAudit();
      window.UI_auditRender = renderAudit;
    }
  }

  function adminDel(email) {
    const r = Auth.adminRemove(email);
    if (r.ok) { renderAuth(); }
  }

  /* ---------- init ---------- */
  function init() {
    $("dbVersion").textContent = DATA_VERSION;
    restorePrices();
    initTabs();
    renderTypeCards("arena");
    syncFinishOptions();
    syncFilterOptions();
    renderInnovationChips();

    const ids = ["fShape", "fLen", "fWidth", "fDepthMin", "fDepthMax", "fSolarium", "fSolW", "fUse",
      "fBorderType", "fTerrain", "fCopingType", "fFinish", "fWaste", "fBoxM2",
      "fFilter", "fSanitizer", "bAdj", "bCont", "bMargin", "bIva", "bIvaRegime", "bClientMode",
      "fDeck", "fDeckW", "fDeckMat",
      "fLights", "fLadder", "fHeat", "fCover", "fShower", "fRobot"];
    ids.forEach(id => $(id).addEventListener("change", recalc));
    ids.forEach(id => $(id).addEventListener("input", recalc));

    $("btnChem").addEventListener("click", runChemCheck);
    $("pType").addEventListener("change", renderProtocols);
    $("pPhase").addEventListener("change", renderProtocols);
    $("ffFormula").addEventListener("change", renderFactory);
    $("ffBatch").addEventListener("input", renderFactory);
    $("plView").addEventListener("change", renderPlano);
    $("plDetail").addEventListener("change", renderPlano);
    $("btnSVG").addEventListener("click", downloadSVG);
    $("btnPrint2").addEventListener("click", () => window.print());

    renderChemistry();
    renderProtocols();
    renderFactory();
    if (typeof Proveedores !== "undefined") Proveedores.renderZone();
    if (typeof IA !== "undefined") initIA();
    if (typeof Auth !== "undefined") renderAuth();

    // 🛡️ cierre por inactividad (30 min sin actividad = sesión cerrada, estilo banca)
    if (typeof Sec !== "undefined") {
      Sec.setIdleLogout(30, () => {
        if (typeof Auth !== "undefined" && Auth.current()) {
          Auth.logout(); renderAuth();
          const n = document.createElement("div");
          n.className = "warn"; n.style.cssText = "position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:99;padding:0.8rem 1.4rem";
          n.textContent = "🔒 Sesión cerrada por inactividad (30 min) — volvé a entrar para ver la fábrica.";
          document.body.appendChild(n);
          setTimeout(() => n.remove(), 6000);
        }
      });
    }

    // proyectos: guardar y lista
    $("pjSave").addEventListener("click", saveProject);
    renderProjects();

    // landing: fondo con foto hero + CTAs
    const lb = $("landingBg");
    if (lb && !lb.style.backgroundImage) lb.style.backgroundImage = `url('${PHOTOS.hero}')`;
    $("ctaConfig").addEventListener("click", () => {
      document.querySelector('#mainTabs button[data-tab="config"]').click();
      document.getElementById("tab-config").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("ctaPlanos").addEventListener("click", () => {
      document.querySelector('#mainTabs button[data-tab="planos"]').click();
      document.getElementById("tab-planos").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // roles: cards del landing + área activa
    document.querySelectorAll(".role-card").forEach(rc => rc.addEventListener("click", () => {
      setRole(rc.dataset.role);
      document.getElementById("tab-cliente").scrollIntoView({ behavior: "smooth" });
    }));
    applyRole();

    // CTAs comerciales desde CONFIG (un solo lugar: data.js)
    const wa = (txt) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(txt)}`;
    // Pro: directo a Mercado Pago (cambia CONFIG.mpLink por tu link real)
    if ($("ctaPro")) $("ctaPro").href = CONFIG.mpLink || wa("Quiero el plan Pro de ObraAcuática");
    if ($("ctaWhite")) $("ctaWhite").href = wa("Quiero ObraAcuática white-label para mi constructora");

    // PWA: registrar service worker (solo en http/https)
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("sw.js").catch(() => { /* offline file:// o no soportado */ });
    }

    recalc();
    runChemCheck();
    initExtras();
  }

  document.addEventListener("DOMContentLoaded", init);

  function initExtras() {
    $("abSet").addEventListener("click", () => {
      compareA = metricsNow();
      $("abMsg").textContent = `⚖️ "${compareA.label}" fijada como A — cambiá lo que quieras en Configurá y mirá la comparación en Resultados.`;
      renderCompare();
    });
    initGlobalErrors();
    // matriz de permisos por rol (Planes)
    const pb = $("permBox");
    if (pb) pb.innerHTML = `<table>
      <thead><tr><th>Función</th><th>👤 Cliente</th><th>🏗️ Profesional</th><th>🚚 Proveedor</th></tr></thead>
      <tbody>${ROLE_PERMS.features.map(r => `<tr><td>${r.f}</td><td style="text-align:center">${r.c}</td><td style="text-align:center">${r.p}</td><td style="text-align:center">${r.v}</td></tr>`).join("")}</tbody></table>
      <p class="hint" style="margin-top:0.5rem">${ROLE_PERMS.nota}</p>`;
  }

  return { recalc, getPrices: () => PRICES, getIAMode: () => (typeof IA !== "undefined" ? (IA.loadSettings().mode || "auto") : "auto"), adminDel, renderAuth };
})();
