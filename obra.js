/* ============================================================
   ObraAcuática — obra.js
   Seguimiento de obra (checklist con % de avance), planificación
   (cronograma por semanas con fechas reales), informe para el
   cliente (HTML autocontenido) y exportaciones:
   Excel (.xls) · Word (.doc) · Markdown (.md) · PDF (impresión).
   El estado de obra se guarda por proyecto en localStorage.
   ============================================================ */

const Obra = (() => {

  const TRACK_PHASES = ["pre", "struct", "water", "install", "startup"];
  const $ = id => document.getElementById(id);
  const fmtARS = n => "$ " + Math.round(n).toLocaleString("es-AR");
  const fmtDate = d => d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const addWeeks = (d, w) => addDays(d, Math.round(w * 7));

  /* ---------- persistencia por proyecto ---------- */
  function projectKey(cfg) {
    return `piletalab_obra_${cfg.type}_${cfg.L}x${cfg.W}`;
  }

  function load(cfg) {
    const key = projectKey(cfg);
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (saved && saved._v === 1) return saved;
    } catch (e) { /* corrupto → nuevo */ }
    return {
      _v: 1,
      checks: {},                       // { "phase:step": {done, date, note} }
      startDate: new Date().toISOString().slice(0, 10),
      durations: null,                  // null = PHASE_DURATIONS del tipo
      clientName: "", clientPhone: "", clientMail: ""
    };
  }

  function save(cfg, st) {
    localStorage.setItem(projectKey(cfg), JSON.stringify(st));
  }

  /* ---------- progreso ---------- */
  function progress(cfg, st) {
    let total = 0, done = 0;
    const perPhase = {};
    TRACK_PHASES.forEach(ph => {
      const steps = PROTOCOLS[cfg.type]?.[ph] || [];
      let d = 0;
      steps.forEach((s, i) => { total++; if (st.checks[`${ph}:${i}`]?.done) { done++; d++; } });
      perPhase[ph] = { total: steps.length, done: d };
    });
    return { total, done, pct: total ? Math.round(done / total * 100) : 0, perPhase };
  }

  /* ---------- cronograma ---------- */
  function schedule(cfg, st) {
    const dur = st.durations || PHASE_DURATIONS[cfg.type] || { pre: 1, struct: 2, water: 1, install: 0.5, startup: 0.5 };
    const start = new Date(st.startDate + "T00:00:00");
    let acc = 0;
    const rows = TRACK_PHASES.map(ph => {
      const w = dur[ph] ?? 1;
      const row = {
        ph, label: PHASE_LABELS[ph], weeks: w,
        from: addWeeks(start, acc), to: addWeeks(start, acc + w),
        offset: acc
      };
      acc += w;
      return row;
    });
    return { rows, totalWeeks: acc, start, end: addWeeks(start, acc) };
  }

  /* ============================================================
     RENDER de la pestaña Obra
     ============================================================ */
  function render(STATE) {
    const { cfg } = STATE;
    const box = $("obraBody");
    if (!box) return;
    const st = load(cfg);
    const prog = progress(cfg, st);
    const sch = schedule(cfg, st);

    let html = "";

    /* --- datos del cliente + inicio --- */
    html += `<div class="card">
      <h2>Proyecto y cliente</h2>
      <div class="form-row">
        <label>Cliente <input type="text" id="obClient" value="${st.clientName}" placeholder="Nombre del cliente"></label>
        <label>Teléfono <input type="text" id="obPhone" value="${st.clientPhone}" placeholder="+54 ..."></label>
        <label>Inicio de obra <input type="date" id="obStart" value="${st.startDate}"></label>
        <label>Fin estimado <input type="text" value="${fmtDate(sch.end)}" readonly></label>
      </div>
      <p class="hint">Sistema: <b>${cfg.tdef.name}</b> · ${cfg.L} × ${cfg.W} m · ${fmt(STATE.geo.volume)} m³ · El avance y el cronograma quedan guardados en este navegador para este proyecto.</p>
    </div>`;

    /* --- avance global --- */
    html += `<div class="card">
      <h2>Avance de obra — ${prog.pct}%</h2>
      <div class="progress-track"><div class="progress-fill" style="width:${prog.pct}%"></div>
        <span class="progress-label">${prog.done} de ${prog.total} controles hechos</span></div>
      <div class="kpi-grid" style="margin-top:0.8rem">
        ${TRACK_PHASES.map(ph => {
          const p = prog.perPhase[ph];
          const pct = p.total ? Math.round(p.done / p.total * 100) : 0;
          return `<div class="kpi ${pct === 100 ? "hl" : ""}">
            <div class="k-label">${PHASE_LABELS[ph]}</div>
            <div class="k-value">${pct}%</div>
            <div class="k-sub">${p.done}/${p.total} pasos</div></div>`;
        }).join("")}
      </div>
    </div>`;

    /* --- cronograma --- */
    const total = sch.totalWeeks || 1;
    html += `<div class="card">
      <h2>Cronograma — ${total} semanas (${fmtDate(sch.start)} → ${fmtDate(sch.end)})</h2>
      <div class="gantt">
        <div class="gantt-head">
          <div class="g-label"></div>
          <div class="g-weeks" style="display:grid;grid-template-columns:repeat(${Math.ceil(total)},1fr)">
            ${Array.from({ length: Math.ceil(total) }, (_, i) => `<div class="g-week">S${i + 1}</div>`).join("")}
          </div>
        </div>
        ${sch.rows.map(r => {
          const left = r.offset / total * 100, width = Math.max(r.weeks / total * 100, 4);
          const p = prog.perPhase[r.ph];
          const pct = p.total ? p.done / p.total * 100 : 0;
          return `<div class="gantt-row">
            <div class="g-label">${r.label}<br><small>${fmtDate(r.from)} → ${fmtDate(r.to)}</small></div>
            <div class="g-track">
              <div class="g-bar phase-${r.ph}" style="left:${left}%;width:${width}%"><div class="g-done" style="width:${pct}%"></div></div>
            </div>
          </div>`;
        }).join("")}
      </div>
      <p class="hint">Duraciones por fase (semanas, editables — defaults del sistema ${cfg.tdef.name}):</p>
      <div class="form-row">
        ${TRACK_PHASES.map(ph => `<label>${PHASE_LABELS[ph]}
          <input type="number" step="0.5" min="0.5" max="20" value="${st.durations?.[ph] ?? PHASE_DURATIONS[cfg.type]?.[ph] ?? 1}" data-dur="${ph}"></label>`).join("")}
      </div>
    </div>`;

    /* --- checklist por fase --- */
    html += `<div class="card">
      <h2>Seguimiento paso a paso</h2>
      <p class="hint">Tildá cada control al completarlo: queda la fecha y alimenta el avance. Los <b>CN</b> son los controles de calidad del protocolo — no se saltea ninguno sin tilde.</p>
      ${TRACK_PHASES.map(ph => {
        const steps = PROTOCOLS[cfg.type]?.[ph] || [];
        if (!steps.length) return "";
        return `<h3 class="phase-title">${PHASE_LABELS[ph]}</h3>
        <ul class="obra-list">${steps.map((s, i) => {
          const k = `${ph}:${i}`;
          const c = st.checks[k];
          return `<li class="${c?.done ? "done" : ""}">
            <label class="ob-check">
              <input type="checkbox" data-k="${k}" ${c?.done ? "checked" : ""}>
              <span class="ob-step">${s.t}${s.cn ? `<span class="cn">⚠ ${s.cn.replace(/^CN:?\s*/, "")}</span>` : ""}</span>
            </label>
            <span class="ob-date">${c?.done && c.date ? "✔ " + c.date : ""}</span>
          </li>`;
        }).join("")}</ul>`;
      }).join("")}
    </div>`;

    /* --- compartir con cliente --- */
    html += `<div class="card">
      <h2>Compartir con el cliente</h2>
      <p class="hint">Genera un <b>informe HTML autocontenido</b> (dibujo + planos + avance + cronograma + presupuesto) que podés mandar por WhatsApp o mail: se abre en cualquier navegador sin instalar nada.</p>
      <div class="next-step" style="justify-content:flex-start">
        <button class="btn primary" id="btnClientReport" type="button">📥 Informe para el cliente</button>
        <button class="btn" id="btnClientLink" type="button">🔗 Copiar resumen para WhatsApp</button>
      </div>
    </div>`;

    box.innerHTML = html;
    wire(STATE, st);
  }

  function fmt(n) { return n.toLocaleString("es-AR", { maximumFractionDigits: 2 }); }

  /* ---------- eventos ---------- */
  function wire(STATE, st) {
    const { cfg } = STATE;

    $("obClient").addEventListener("input", e => { st.clientName = e.target.value; save(cfg, st); });
    $("obPhone").addEventListener("input", e => { st.clientPhone = e.target.value; save(cfg, st); });
    $("obStart").addEventListener("change", e => { st.startDate = e.target.value; save(cfg, st); render(STATE); });

    document.querySelectorAll("[data-dur]").forEach(inp => {
      inp.addEventListener("change", () => {
        st.durations = st.durations || { ...PHASE_DURATIONS[cfg.type] };
        st.durations[inp.dataset.dur] = Math.max(0.5, parseFloat(inp.value) || 1);
        save(cfg, st); render(STATE);
      });
    });

    document.querySelectorAll(".ob-check input[data-k]").forEach(chk => {
      chk.addEventListener("change", () => {
        const k = chk.dataset.k;
        if (chk.checked) st.checks[k] = { done: true, date: new Date().toLocaleDateString("es-AR") };
        else delete st.checks[k];
        save(cfg, st); render(STATE);
      });
    });

    $("btnClientReport").addEventListener("click", () => {
      download(clientReport(STATE), `informe-pileta-${cfg.type}-${cfg.L}x${cfg.W}.html`, "text/html");
    });
    $("btnClientLink").addEventListener("click", () => {
      const txt = whatsappSummary(STATE);
      navigator.clipboard?.writeText(txt);
      const b = $("btnClientLink");
      b.textContent = "✅ Copiado"; setTimeout(() => b.textContent = "🔗 Copiar resumen para WhatsApp", 1800);
    });
  }

  /* ============================================================
     INFORME CLIENTE — HTML autocontenido
     ============================================================ */
  function clientReport(STATE) {
    const { cfg, geo, hyd } = STATE;
    const st = load(cfg);
    const prog = progress(cfg, st);
    const sch = schedule(cfg, st);
    const clientMode = document.getElementById("bClientMode")?.checked;
    const margin = parseFloat(document.getElementById("bMargin")?.value || 35) / 100;
    const withIVA = document.getElementById("bIva")?.checked !== false;
    const cont = parseFloat(document.getElementById("bCont")?.value || 10) / 100;

    // presupuesto para el cliente
    const P = (typeof UI !== "undefined" && UI.getPrices) ? UI.getPrices() : DEFAULT_PRICES;
    const adj = (parseFloat(document.getElementById("bAdj")?.value) || 0) / 100;
    const budget = Engine.computeBudget(cfg, geo, hyd, STATE.mat, P);
    const cost = budget.items.reduce((s, i) => s + i.qty * i.price, 0) * (1 + adj);
    const price = cost * (1 + cont) * (1 + margin) * (withIVA ? 1.21 : 1);

    const plan = DEFAULT_PAYMENT_PLAN.map(h => ({ ...h, amount: price * h.pct / 100 }));
    const today = new Date();
    const validity = addDays(today, 15);

    const budgetRows = clientMode
      ? budget.items.map(i => { const iva = itemIVA(i.key, document.getElementById("bIvaRegime")?.value || "general"); return `<tr><td>${i.name}</td><td>${fmt(i.qty)} ${i.unit}</td><td>${iva}%</td></tr>`; }).join("")
      : budget.items.map(i => { const iva = itemIVA(i.key, document.getElementById("bIvaRegime")?.value || "general"); return `<tr><td>${i.name}</td><td>${fmt(i.qty)} ${i.unit}</td><td>${iva}%</td><td style="text-align:right">${fmtARS(i.qty * i.price * (1 + adj))}</td></tr>`; }).join("");

    return `<!DOCTYPE html><html lang="es-AR"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Informe de proyecto — Pileta ${cfg.L}×${cfg.W} ${cfg.tdef.name}</title>
<style>
  body{font-family:"Segoe UI",system-ui,sans-serif;max-width:860px;margin:2rem auto;padding:0 1.2rem;color:#1d2b35;background:#fbfbf8;line-height:1.55}
  h1{color:#0d7c93;margin-bottom:0.2rem}h2{color:#0d7c93;border-bottom:2px solid #bde9f2;padding-bottom:0.3rem;margin-top:2rem}
  .meta{color:#6b7c8a;font-size:0.9rem}
  .hero{border:1px solid #d9e6ea;border-radius:14px;overflow:hidden;margin:1rem 0}
  .plano{border:1px solid #d9e6ea;border-radius:14px;padding:10px;background:#fff;margin:0.6rem 0;overflow-x:auto}
  table{width:100%;border-collapse:collapse;font-size:0.9rem;margin:0.6rem 0}
  th{background:#eaf6f9;color:#0d5f73;text-align:left;padding:0.5rem;border:1px solid #cfe4ea;font-size:0.78rem;text-transform:uppercase}
  td{padding:0.5rem;border:1px solid #dfe9ec}
  .total{font-size:1.5rem;font-weight:800;color:#0d7c93}
  .track{background:#e3edf0;border-radius:99px;height:22px;overflow:hidden;margin:0.6rem 0}
  .fill{background:linear-gradient(90deg,#1FB6CD,#0d7c93);height:100%;border-radius:99px}
  .fase{display:flex;gap:0.8rem;flex-wrap:wrap;margin:0.5rem 0}
  .fase div{background:#eaf6f9;border-radius:10px;padding:0.4rem 0.8rem;font-size:0.85rem}
  .firma{display:flex;gap:3rem;margin-top:3rem}
  .firma div{flex:1;border-top:1.5px solid #1d2b35;padding-top:0.4rem;font-size:0.85rem}
  footer{margin-top:2.5rem;border-top:1px solid #d9e6ea;padding-top:0.8rem;color:#8aa0ac;font-size:0.78rem}
</style></head><body>

<h1>Pileta ${cfg.L} × ${cfg.W} m — ${cfg.tdef.name}</h1>
<p class="meta">Informe de proyecto · ${fmtDate(today)} · <b>Precios vigentes al ${priceDateTxt()}</b>${st.clientName ? " · Cliente: <b>" + Sec.escapeHtml(st.clientName) + "</b>" : ""} · ObraAcuática</p>

<div class="hero">${Ilustracion.tipo(cfg.type)}</div>

<h2>Resumen técnico</h2>
<table>
<tr><th>Sistema</th><td>${cfg.tdef.name}</td><th>Borde</th><td>${BORDERS[cfg.borderType].name}</td></tr>
<tr><th>Volumen</th><td>${fmt(geo.volume)} m³ (${geo.liters.toLocaleString("es-AR")} litros)</td><th>Profundidad</th><td>${cfg.dMin} a ${cfg.dMax} m</td></tr>
<tr><th>Revestimiento</th><td>${FINISHES[cfg.finish].name}</td><th>Coping</th><td>${COPINGS[cfg.copingType]?.name || "—"}</td></tr>
<tr><th>Filtración</th><td>${hyd.filterDesc}</td><th>Bomba</th><td>${hyd.pumpHP} HP (${fmt(hyd.flowDesign)} m³/h diseño)</td></tr>
<tr><th>Desinfección</th><td>${SANITIZERS[cfg.sanitizer].name}</td><th>Luces</th><td>${hyd.lights || "—"}</td></tr>
</table>

<h2>Planos</h2>
<div class="plano">${Plano.render("planta", "simple", cfg, geo, hyd)}</div>
<div class="plano">${Plano.render("axo", "full", cfg, geo, hyd)}</div>

<h2>Estado de la obra</h2>
<p>Avance general: <b>${prog.pct}%</b> (${prog.done} de ${prog.total} controles)</p>
<div class="track"><div class="fill" style="width:${prog.pct}%"></div></div>
<div class="fase">${sch.rows.map(r => {
      const p = prog.perPhase[r.ph];
      const pct = p.total ? Math.round(p.done / p.total * 100) : 0;
      return `<div>${r.label}: <b>${pct}%</b></div>`;
    }).join("")}</div>

<h2>Cronograma</h2>
<table><tr><th>Fase</th><th>Desde</th><th>Hasta</th><th>Semanas</th><th>Estado</th></tr>
${sch.rows.map(r => {
      const p = prog.perPhase[r.ph];
      const pct = p.total ? p.done / p.total * 100 : 0;
      const estado = pct === 100 ? "✅ completa" : pct > 0 ? "🔄 en curso" : "🗓 pendiente";
      return `<tr><td>${r.label}</td><td>${fmtDate(r.from)}</td><td>${fmtDate(r.to)}</td><td>${r.weeks}</td><td>${estado}</td></tr>`;
    }).join("")}
<tr><td colspan="3"><b>TOTAL</b></td><td><b>${sch.totalWeeks}</b></td><td>fin ${fmtDate(sch.end)}</td></tr></table>

<h2>Alcance y presupuesto</h2>
<p class="meta">Régimen de IVA: ${IVA_REGIMES[document.getElementById("bIvaRegime")?.value || "general"].label}</p>
<table><tr><th>Rubro</th><th>Cantidad</th><th>IVA</th>${clientMode ? "" : "<th>Subtotal neto</th>"}</tr>${budgetRows}</table>
${clientMode ? "" : `<p>Subtotal materiales + contingencia ${Math.round(cont * 100)}%: <b>${fmtARS(cost * (1 + cont))}</b><br>
Precio de obra llave en mano${withIVA ? " (IVA incl.)" : ""}: <span class="total">${fmtARS(price)}</span></p>`}

<h2>Plan de pagos</h2>
<table><tr><th>Hito</th><th>%</th><th>Monto</th></tr>
${plan.map(h => `<tr><td>${h.label}</td><td>${h.pct}%</td><td>${fmtARS(h.amount)}</td></tr>`).join("")}</table>

<p class="meta">Propuesta válida hasta el <b>${fmtDate(validity)}</b> (precios de referencia con ajuste por inflación al momento de la firma). Mediciones y volúmenes estimados; planos orientativos de proyecto — el ejecutivo lo firma ingeniería matriculada.</p>

<div class="firma"><div> Firma del contratista</div><div>Conformidad del cliente</div></div>

<footer>Generado con ObraAcuática · ${DATA_VERSION} · ${fmtDate(today)}</footer>
</body></html>`;
  }

  /* ---------- resumen WhatsApp ---------- */
  function whatsappSummary(STATE) {
    const { cfg, geo, hyd } = STATE;
    const st = load(cfg);
    const prog = progress(cfg, st);
    const sch = schedule(cfg, st);
    return `🏊 *PILETA ${cfg.L}×${cfg.W} m — ${cfg.tdef.name}*
• Volumen: ${fmt(geo.volume)} m³ · Borde: ${BORDERS[cfg.borderType].name}
• Equipo: ${hyd.pumpHP} HP + ${hyd.filterD ? "filtro Ø" + hyd.filterD + " mm" : cfg.filter}
• ${hyd.lights ? hyd.lights + " luces LED · " : ""}${hyd.heatKW ? "climatizada " + hyd.heatKW + " kW · " : ""}
• Obra: ${sch.totalWeeks} semanas (${fmtDate(sch.start)} → ${fmtDate(sch.end)})
• Avance: ${prog.pct}%
Informe completo con planos en el HTML adjunto 📐`;
  }

  /* ============================================================
     EXPORTACIONES — Excel / Word / Markdown
     ============================================================ */
  function download(content, filename, mime) {
    const blob = new Blob(["\uFEFF" + content], { type: mime + ";charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  function tableHTML(STATE, opts = {}) {
    const { cfg, geo, hyd } = STATE;
    const P = (typeof UI !== "undefined" && UI.getPrices) ? UI.getPrices() : DEFAULT_PRICES;
    const regime = document.getElementById("bIvaRegime")?.value || "general";
    const adj = (parseFloat(document.getElementById("bAdj")?.value) || 0) / 100;
    const cont = (parseFloat(document.getElementById("bCont")?.value) || 0) / 100;
    const margin = (parseFloat(document.getElementById("bMargin")?.value) || 0) / 100;
    const withIVA = document.getElementById("bIva")?.checked !== false;
    const budget = Engine.computeBudget(cfg, geo, hyd, STATE.mat, P);
    const cost = budget.items.reduce((s, i) => s + i.qty * i.price, 0) * (1 + adj);
    const subtotal = cost * (1 + cont);
    const price = subtotal * (1 + margin) * (withIVA ? 1.21 : 1);
    const prov = k => { const p = ITEM_PROVIDER[k]; return p ? PROVIDERS[p].name : ""; };
    const rows = budget.items.map(i => {
      const iva = itemIVA(i.key, document.getElementById("bIvaRegime")?.value || "general");
      return `<tr><td>${i.name}</td><td>${i.note}</td><td>${fmt(i.qty)}</td><td>${i.unit}</td><td>${prov(i.key)}</td><td>${i.price}</td><td>${Math.round(i.qty * i.price * (1 + adj))}</td><td>${iva}%</td><td>${Math.round(i.qty * i.price * (1 + adj) * (1 + iva / 100))}</td></tr>`;
    }).join("");
    const iva10 = budget.items.filter(i => itemIVA(i.key, regime) === 10.5).reduce((s, i) => s + i.qty * i.price * (1 + adj) * 0.105, 0);
    const iva21 = budget.items.filter(i => itemIVA(i.key, regime) === 21).reduce((s, i) => s + i.qty * i.price * (1 + adj) * 0.21, 0);
    return {
      html: `<table border="1"><tr><th>Rubro</th><th>Detalle</th><th>Cantidad</th><th>Unidad</th><th>Dónde comprarlo</th><th>Precio unit. ARS</th><th>Subtotal neto ARS</th><th>IVA</th><th>Subtotal c/IVA ARS</th></tr>${rows}
      <tr><td colspan="6"><b>SUBTOTAL MATERIALES (neto)</b></td><td>${Math.round(cost)}</td><td></td><td></td></tr>
      <tr><td colspan="6"><b>IVA DE COMPRA ${regime === "reducido" ? "(régimen 10,5+21)" : "(21%)"}</b></td><td></td><td></td><td>${Math.round(iva10 + iva21)}</td></tr>
      <tr><td colspan="6"><b>CON CONTINGENCIA ${Math.round(cont * 100)}%</b></td><td>${Math.round(subtotal)}</td><td></td><td></td></tr>
      <tr><td colspan="6"><b>PRECIO DE OBRA (margen ${Math.round(margin * 100)}%${withIVA ? " + IVA 21% venta" : ""})</b></td><td></td><td></td><td><b>${Math.round(price)}</b></td></tr></table>`,
      md: mdBudget(STATE, budget, { adj, cont, margin, withIVA, cost, subtotal, price, regime, iva10, iva21 }),
      meta: { cfg, price, subtotal, cost }
    };
  }

  const priceDateTxt = () => {
    const d = localStorage.getItem("piletalab_price_date") || new Date().toISOString().slice(0, 10);
    return new Date(d + "T12:00:00").toLocaleDateString("es-AR");
  };

  function mdBudget(STATE, budget, x) {
    const { cfg } = STATE;
    const regime = x.regime || "general";
    const prov = k => { const p = ITEM_PROVIDER[k]; return p ? PROVIDERS[p].name : ""; };
    const lines = [
      `# Presupuesto — Pileta ${cfg.L}×${cfg.W} m · ${cfg.tdef.name}`,
      ``,
      `Fecha: ${fmtDate(new Date())} · Volumen: ${fmt(STATE.geo.volume)} m³ · Borde: ${BORDERS[cfg.borderType].name}`,
      `**Precios vigentes al ${priceDateTxt()}** · Régimen IVA: ${IVA_REGIMES[regime].label}`,
      ``,
      `| Rubro | Detalle | Cant. | Unidad | Dónde comprarlo | Precio ARS | Subtotal neto | IVA | Subtotal c/IVA |`,
      `|---|---|---|---|---|---:|---:|---:|---:|`
    ];
    budget.items.forEach(i => {
      const iva = itemIVA(i.key, regime);
      lines.push(`| ${i.name} | ${i.note} | ${fmt(i.qty)} | ${i.unit} | ${prov(i.key)} | ${i.price} | ${Math.round(i.qty * i.price * (1 + x.adj))} | ${iva}% | ${Math.round(i.qty * i.price * (1 + x.adj) * (1 + iva / 100))} |`);
    });
    lines.push(``, `- Subtotal materiales (neto): **$${Math.round(x.cost).toLocaleString("es-AR")}**`);
    lines.push(`- IVA de compra${regime === "reducido" ? " (10,5% lista + 21% resto)" : " (21%)"}: **$${Math.round((x.iva10 || 0) + (x.iva21 || 0)).toLocaleString("es-AR")}**${x.iva10 ? ` — de los cuales al 10,5%: $${Math.round(x.iva10).toLocaleString("es-AR")}` : ""}`);
    lines.push(`- Con contingencia ${Math.round(x.cont * 100)}%: **$${Math.round(x.subtotal).toLocaleString("es-AR")}**`);
    lines.push(`- Precio de obra (margen ${Math.round(x.margin * 100)}%${x.withIVA ? " + IVA 21% venta" : " sin IVA"}): **$${Math.round(x.price).toLocaleString("es-AR")}**`);
    lines.push(``, `_Generado con ObraAcuática ${DATA_VERSION} · precios referenciales — validez 15 días. El 10,5% rige con la obra adherida al régimen: confirmalo con tu contador._`);
    return lines.join("\n");
  }

  function exportExcel(STATE) {
    const t = tableHTML(STATE);
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>
      <h3>ObraAcuática — Presupuesto ${STATE.cfg.L}×${STATE.cfg.W} ${STATE.cfg.tdef.name}</h3>${t.html}</body></html>`;
    download(html, `presupuesto-pileta-${STATE.cfg.type}.xls`, "application/vnd.ms-excel");
  }

  function exportWord(STATE) {
    const t = tableHTML(STATE);
    const { cfg } = STATE;
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8">
      <style>body{font-family:"Segoe UI",sans-serif;font-size:11pt}h1{color:#0d7c93}h3{color:#0d5f73}td,th{font-size:10pt;padding:4pt}</style></head><body>
      <h1>Pileta ${cfg.L}×${cfg.W} m — ${cfg.tdef.name}</h1>
      <p>Sistema: ${cfg.tdef.name} · Borde: ${BORDERS[cfg.borderType].name} · Volumen: ${fmt(STATE.geo.volume)} m³</p>
      <h3>Presupuesto de materiales</h3>${t.html}
      <h3>Plan de pagos</h3>
      <table border="1">${DEFAULT_PAYMENT_PLAN.map(h => `<tr><td>${h.label}</td><td>${h.pct}%</td><td>$${Math.round(t.meta.price * h.pct / 100).toLocaleString("es-AR")}</td></tr>`).join("")}</table>
      <p><i>Generado con ObraAcuática · validez 15 días.</i></p></body></html>`;
    download(html, `presupuesto-pileta-${cfg.type}.doc`, "application/msword");
  }

  function exportMD(STATE) {
    download(tableHTML(STATE).md, `presupuesto-pileta-${STATE.cfg.type}.md`, "text/markdown");
  }

  /* export para Odoo: columnas de importación de líneas (name, quantity, price_unit) */
  function exportOdoo(STATE) {
    const { cfg, geo, hyd } = STATE;
    const P = (typeof UI !== "undefined" && UI.getPrices) ? UI.getPrices() : DEFAULT_PRICES;
    const budget = Engine.computeBudget(cfg, geo, hyd, STATE.mat, P);
    const rows = [["name", "quantity", "price_unit"]];
    budget.items.forEach(i => rows.push([i.name, i.qty, i.price]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    download("\uFEFF" + csv, `odoo-lineas-pileta-${cfg.type}.csv`, "text/csv");
  }

  return { render, progress, schedule, clientReport, whatsappSummary, exportExcel, exportWord, exportMD, exportOdoo, download };
})();
