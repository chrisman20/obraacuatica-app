/* ============================================================
   ObraAcuática — planos.js
   Generador de planos SVG en vivo: planta con equipamiento,
   corte transversal A-A y corte longitudinal B-B.
   Coordenadas en metros → escala S px/m. Plano orientativo:
   el ejecutable lo firma ingeniería matriculada.
   ============================================================ */

const Plano = (() => {

  const S = 90;                       // px por metro
  const INK = "#22303c";              // línea principal
  const AQUA = "#1FB6CD";             // agua
  const SAND = "#d9c9a3";             // coping
  const DECKC = "#c9b48a";            // deck
  const MUTE = "#6b7c8a";             // cotas y textos secundarios
  const fmt = n => n.toLocaleString("es-AR", { maximumFractionDigits: 2 });

  const defs = `
    <defs>
      <pattern id="hSol" width="9" height="9" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <rect width="9" height="9" fill="#e8f4f7"/>
        <line x1="0" y1="0" x2="0" y2="9" stroke="${AQUA}" stroke-width="2" opacity="0.45"/>
      </pattern>
      <pattern id="hTer" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="#f2ede2"/>
        <line x1="0" y1="0" x2="0" y2="10" stroke="#b9ab8c" stroke-width="1.4"/>
      </pattern>
      <pattern id="hHor" width="12" height="12" patternTransform="rotate(-45)" patternUnits="userSpaceOnUse">
        <rect width="12" height="12" fill="#e7e2d6"/>
        <line x1="0" y1="0" x2="0" y2="12" stroke="#8d9aa5" stroke-width="1.2"/>
      </pattern>
      <marker id="dimA" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="${MUTE}"/>
      </marker>
      <linearGradient id="aguaG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#cfeef5"/><stop offset="1" stop-color="#8fd4e4"/>
      </linearGradient>
    </defs>`;

  /* marco de lámina + cartela profesional (todas las vistas) */
  let SHEET = { vol: 0 };
  function sheetFrame(fullW, fullH, cfg, sheetName, no) {
    const d = new Date().toLocaleDateString("es-AR");
    const cw = 330, ch = 86, cx = fullW - cw - 18, cy = fullH - ch - 16;
    return `
    <rect x="6" y="6" width="${(fullW - 12).toFixed(0)}" height="${(fullH - 12).toFixed(0)}" fill="none" stroke="${INK}" stroke-width="2.6"/>
    <rect x="12" y="12" width="${(fullW - 24).toFixed(0)}" height="${(fullH - 24).toFixed(0)}" fill="none" stroke="${INK}" stroke-width="0.9"/>
    <g>
      <rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="#fff" stroke="${INK}" stroke-width="1.6"/>
      <line x1="${cx}" y1="${cy + 27}" x2="${cx + cw}" y2="${cy + 27}" stroke="${INK}" stroke-width="1"/>
      <line x1="${cx}" y1="${cy + 57}" x2="${cx + cw}" y2="${cy + 57}" stroke="${INK}" stroke-width="0.8"/>
      <line x1="${cx + 56}" y1="${cy}" x2="${cx + 56}" y2="${cy + 27}" stroke="${INK}" stroke-width="0.8"/>
      <rect x="${cx + 8}" y="${cy + 5.5}" width="17" height="17" rx="4" fill="${AQUA}"/>
      <text x="${cx + 16.5}" y="${cy + 18}" font-family="Segoe UI" font-size="10" font-weight="800" fill="#041820" text-anchor="middle">OA</text>
      <text x="${cx + 64}" y="${cy + 18}" font-family="Segoe UI" font-size="11.5" font-weight="800" fill="${INK}">OBRA ACUÁTICA · estudio de piletas</text>
      <text x="${cx + 10}" y="${cy + 41}" font-family="Segoe UI" font-size="9.5" fill="${MUTE}">${cfg.tdef.name} · ${fmt(cfg.L)}×${fmt(cfg.W)} m · ${BORDERS[cfg.borderType].name.split("(")[0].trim()}</text>
      <text x="${cx + 10}" y="${cy + 52}" font-family="Segoe UI" font-size="9" fill="${MUTE}">volumen ${fmt(SHEET.vol)} m³ · ${FINISHES[cfg.finish].name.split("(")[0].trim()} · ${d}</text>
      <text x="${cx + 10}" y="${cy + 76}" font-family="Segoe UI" font-size="14" font-weight="800" fill="${INK}">${sheetName}</text>
      <text x="${cx + cw - 12}" y="${cy + 76}" font-family="Segoe UI" font-size="11" font-weight="700" fill="#0d7c93" text-anchor="end">LÁMINA ${no}/04</text>
    </g>`;
  }

  const txt = (x, y, s, opt = {}) =>
    `<text x="${x}" y="${y}" font-family="Segoe UI,sans-serif" font-size="${opt.fs || 13}"
       fill="${opt.c || INK}" text-anchor="${opt.a || "middle"}"
       font-weight="${opt.w || "600"}" ${opt.rot ? `transform="rotate(${opt.rot} ${x} ${y})"` : ""}>${s}</text>`;

  const line = (x1, y1, x2, y2, opt = {}) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${opt.c || INK}"
       stroke-width="${opt.w || 2}" ${opt.d ? `stroke-dasharray="${opt.d}"` : ""}
       ${opt.m ? `marker-start="url(#dimA)" marker-end="url(#dimA)"` : ""}/>`;

  const rect = (x, y, w, h, opt = {}) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${opt.f || "none"}"
       stroke="${opt.c || INK}" stroke-width="${opt.w || 2}" ${opt.rx ? `rx="${opt.rx}"` : ""}/>`;

  /* ---------- contorno de la pileta según forma (path/shape) ---------- */
  function poolShape(cfg, x, y, L, W, inset = 0) {
    const l = L - inset * 2, w = W - inset * 2, px = x + inset, py = y + inset;
    if (cfg.shape === "oval") return `<ellipse cx="${px + l / 2}" cy="${py + w / 2}" rx="${l / 2}" ry="${w / 2}" fill="none"/>`;
    const rx = cfg.shape === "free" ? w * 0.48 : (cfg.shape === "roman" ? w * 0.12 : 0);
    return `<rect x="${px}" y="${py}" width="${l}" height="${w}" rx="${rx}" fill="none"/>`;
  }

  /* ============================================================
     PLANTA
     ============================================================ */
  function planta(cfg, geo, hyd, detail) {
    const { L, W } = cfg;
    const cop = 0.3;                                    // ancho coping en m
    const dk = cfg.deck ? cfg.deckW + cop : 0;          // ancho total deck+coping
    const mLeft = 2.0, mTop = 1.6, mRight = 1.4, mBot = 2.9;
    const px0 = mLeft * S, py0 = mTop * S;              // esquina coping exterior
    const plx = px0 + dk * S, ply = py0 + dk * S;       // borde interior pileta
    const plW = L * S, plH = W * S;
    const fullW = (mLeft + dk * 2 + L + mRight) * S;
    const fullH = (mTop + dk * 2 + W + mBot) * S;
    let g = "";

    // deck seco
    if (cfg.deck) {
      g += rect(px0, py0, (L + 2 * dk) * S, (W + 2 * dk) * S, { f: DECKC, c: "#a8926b", w: 1.5, rx: cfg.shape === "free" || cfg.shape === "oval" ? 24 : 6 });
      g += txt(px0 + dk * S, py0 + 12, `DECK ${DECK_MATERIALS[cfg.deckMat]?.name || ""}`, { fs: 11, c: "#5c4f33", a: "start", w: "700" });
    }
    // coping (banda arena)
    g += rect(plx - cop * S, ply - cop * S, plW + 2 * cop * S, plH + 2 * cop * S, { f: SAND, c: "#a8926b", w: 1.5, rx: cfg.shape === "free" || cfg.shape === "oval" ? 18 : 4 });

    // espejo de agua + paredes
    g += rect(plx, ply, plW, plH, { f: "url(#aguaG)", c: INK, w: 2.5, rx: cfg.shape === "free" ? 14 : 0 });
    g += poolShape(cfg, plx, ply, L * S, W * S, 0.14 * S).replace("<rect", "<rect stroke-width=\"4\"").replace("<ellipse", "<ellipse stroke-width=\"4\"");

    // solarium húmedo
    if (cfg.solarium && geo.solArea) {
      const sw = cfg.solW * S;
      g += `<path d="M${plx + 0.14 * S},${ply + 0.14 * S} h${sw - 0.28 * S} v${plH - 0.28 * S} h-${sw - 0.28 * S} z" fill="url(#hSol)" stroke="${AQUA}" stroke-width="1.5" ${cfg.shape === "oval" || cfg.shape === "free" ? `rx="12"` : ""}/>`;
      g += txt(plx + sw / 2, ply + plH / 2, "SOLARIUM", { c: "#0d7c93", fs: 13 });
      g += txt(plx + sw / 2, ply + plH / 2 + 15, "HÚMEDO 0,30 m", { c: "#0d7c93", fs: 11 });
    }

    // muro drop + escalera
    if (cfg.solarium && geo.solArea) {
      const sx = plx + cfg.solW * S;
      g += line(sx, ply + 0.2 * S, sx, ply + plH - 0.2 * S, { c: INK, w: 2.5 });
      for (let i = 1; i <= 3; i++) {
        const yy = ply + plH * 0.28 + i * 0.35 * S;
        if (yy < ply + plH * 0.28 + 3 * 0.35 * S + 1) g += line(sx + 4, yy, sx + 1.1 * S, yy, { c: MUTE, w: 1.4 });
      }
      g += txt(sx + 0.55 * S, ply + plH * 0.28 + 3 * 0.35 * S + 16, "ESC", { c: MUTE, fs: 11 });
    }

    // pendiente de fondo (línea punteada hacia el profundo)
    if (!cfg.tdef.natural) {
      g += line(plx + (cfg.solarium ? cfg.solW * S : 0) + 0.3 * S, ply + plH - 0.25 * S, plx + plW - 0.3 * S, ply + plH - 0.25 * S, { c: "#0d7c93", w: 1.2, d: "7 5" });
      g += txt(plx + plW - 0.6 * S, ply + plH - 0.35 * S, `fondo hasta ${fmt(cfg.dMax)} m ↘`, { c: "#0d7c93", fs: 10.5, a: "end" });
    }

    // olas de agua en el espejo (vida al plano)
    {
      const wx = plx + (cfg.solarium ? cfg.solW * S * 0.55 : plW * 0.22);
      const ww = plW * (cfg.solarium ? 0.5 : 0.6);
      for (let i = 0; i < 3; i++) {
        const wy = ply + plH * (0.34 + i * 0.16);
        g += `<path d="M${wx},${wy} q${ww / 8},-5 ${ww / 4},0 t${ww / 4},0 t${ww / 4},0 t${ww / 4},0" fill="none" stroke="${AQUA}" stroke-width="1.4" opacity="${0.5 - i * 0.12}"/>`;
      }
    }

    if (detail === "full") {
      // skimmers (pared superior)
      for (let i = 0; i < (hyd.skimmers || 0); i++) {
        const x = plx + plW * (0.25 + 0.5 * (hyd.skimmers === 1 ? 0 : i / (hyd.skimmers - 1)));
        g += rect(x - 11, ply - 13, 22, 16, { f: "#fff", c: INK, w: 1.6 });
        g += txt(x, ply - 1, `S${i + 1}`, { fs: 9.5 });
      }
      // luces (pared superior, entre skimmers / extremos)
      for (let i = 0; i < (hyd.lights || 0); i++) {
        const x = plx + plW * ((i + 1) / ((hyd.lights || 1) + 1));
        g += rect(x - 8, ply + 10, 16, 12, { f: "#ffe9a8", c: "#b98a00", w: 1.4 });
        g += txt(x, ply + 19.5, "✕", { fs: 9, c: "#8a6a00" });
      }
      // retornos (pared inferior + laterales)
      const rets = hyd.returns || 0;
      for (let i = 0; i < Math.max(1, Math.floor(rets * 0.6)); i++) {
        const x = plx + plW * ((i + 1) / (Math.max(1, Math.floor(rets * 0.6)) + 1));
        g += `<circle cx="${x}" cy="${ply + plH - 12}" r="7" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`;
        g += txt(x, ply + plH - 8.5, "R", { fs: 9 });
      }
      for (let i = 0; i < Math.max(1, Math.ceil(rets * 0.2)); i++) {
        const y = ply + plH * ((i + 1) / (Math.max(1, Math.ceil(rets * 0.2)) + 1));
        [[plx + 12, "R"], [plx + plW - 12, "R"]].forEach(([x]) => {
          g += `<circle cx="${x}" cy="${y}" r="7" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`;
          g += txt(x, y + 3.5, "R", { fs: 9 });
        });
      }
      // desagüe de fondo (zona profunda)
      g += `<circle cx="${plx + plW * 0.62}" cy="${ply + plH * 0.42}" r="9" fill="#fff" stroke="${INK}" stroke-width="1.8"/>`;
      g += `<line x1="${plx + plW * 0.62 - 6}" y1="${ply + plH * 0.42 - 6}" x2="${plx + plW * 0.62 + 6}" y2="${ply + plH * 0.42 + 6}" stroke="${INK}" stroke-width="1.4"/>`;
      g += txt(plx + plW * 0.62, ply + plH * 0.42 - 13, "DF", { fs: 10 });
      // contra corriente (endless)
      if (cfg.type === "endless") {
        g += `<polygon points="${plx + 4},${ply + plH / 2 - 16} ${plx + 4},${ply + plH / 2 + 16} ${plx + 30},${ply + plH / 2}" fill="${AQUA}"/>`;
        g += txt(plx + 40, ply + plH / 2 + 4, "CONTRA CORRIENTE", { fs: 10, a: "start", c: "#0d7c93" });
      }
      // banca spa
      if (cfg.type === "spa") {
        g += rect(plx + 0.55 * S, ply + 0.55 * S, plW - 1.1 * S, plH - 1.1 * S, { c: MUTE, w: 1.3, d: "6 4", rx: cfg.shape === "oval" ? 30 : 8 });
        g += txt(plx + plW / 2, ply + plH / 2 - 4, "BANCA + JETS", { c: MUTE, fs: 11 });
      }
    }

    // paño de vidrio
    if (cfg.type === "vidrio") {
      g += line(plx - 2, ply + plH + 2, plx + plW + 2, ply + plH + 2, { c: "#0aa5c9", w: 7 });
      g += txt(plx + plW / 2, ply + plH + 22, "◤ PAÑO VIDRIO / ACRÍLICO ◢", { c: "#0aa5c9", fs: 12, w: "800" });
    }

    // weir / rebalse
    if (cfg.infinity) {
      if (cfg.infSides >= 4) {
        g += rect(plx - 3, ply - 3, plW + 6, plH + 6, { c: "#e08a00", w: 4, d: "10 5" });
        g += txt(plx + plW / 2, ply - 12, "REBALSE PERIMETRAL (ESPEJO A RAS)", { c: "#a86600", fs: 11.5, w: "800" });
      } else {
        g += line(plx - 2, ply + plH + 2, plx + plW + 2, ply + plH + 2, { c: "#e08a00", w: 7 });
        g += txt(plx + plW / 2, ply + plH + 22, "◤ BORDE INFINITO / WEIR ◢", { c: "#a86600", fs: 12, w: "800" });
      }
    }

    // cotas
    const dy = ply + plH + (cfg.deck ? dk * S : cop * S) + 0.55 * S;
    g += line(plx, dy, plx + plW, dy, { c: MUTE, w: 1.3, m: 1 });
    g += txt(plx + plW / 2, dy - 7, `${fmt(L)} m`, { c: MUTE, fs: 13 });
    const dx = plx - (cfg.deck ? dk * S : cop * S) - 0.55 * S;
    g += line(dx, ply, dx, ply + plH, { c: MUTE, w: 1.3, m: 1 });
    g += txt(dx - 8, ply + plH / 2, `${fmt(W)} m`, { c: MUTE, fs: 13, rot: -90 });

    // rueda de escala + título
    const bx = plx, by = fullH - 1.9 * S;
    g += rect(bx, by, 3.4 * S, 1.35 * S, { c: INK, w: 1.5, f: "#fff" });
    g += line(bx + 12, by + 30, bx + 12 + 2 * S, by + 30, { c: INK, w: 2.5, m: 1 });
    [0, 1, 2].forEach(m => g += txt(bx + 12 + m * S, by + 50, `${m}`, { fs: 10.5, c: MUTE }));
    g += txt(bx + 12, by + 22, "escala gráfica (m)", { fs: 10.5, c: MUTE, a: "start" });
    g += txt(bx + 12, by + 78, `PILETA ${fmt(L)} × ${fmt(W)} m · ${cfg.tdef.name.toUpperCase()}`, { fs: 13.5, a: "start" });
    g += txt(bx + 12, by + 98, `${BORDERS[cfg.borderType].name} · V ${fmt(geo.volume)} m³ · ${FINISHES[cfg.finish].name.split("(")[0].trim()}`, { fs: 11, a: "start", c: MUTE, w: "500" });
    g += txt(bx + 12, by + 116, `ObraAcuática ${DATA_VERSION} · plano orientativo — ejecutivo: ingeniería matriculada`, { fs: 9.5, a: "start", c: "#9aa7b1", w: "500" });

    // norte
    g += `<circle cx="${fullW - 40}" cy="${mTop * S - 20}" r="17" fill="#fff" stroke="${MUTE}" stroke-width="1.2"/>`;
    g += txt(fullW - 40, mTop * S - 14, "N", { fs: 12, c: MUTE });
    g += `<polygon points="${fullW - 40},${mTop * S - 34} ${fullW - 45},${mTop * S - 20} ${fullW - 40},${mTop * S - 23} ${fullW - 35},${mTop * S - 20}" fill="${MUTE}"/>`;

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fullW} ${fullH}" style="max-width:100%;height:auto">
      ${defs}<rect width="${fullW}" height="${fullH}" fill="#ffffff"/>${g}${sheetFrame(fullW, fullH, cfg, "PLANTA · VISTA SUPERIOR", "01")}</svg>`;
  }

  /* ============================================================
     CORTE TRANSVERSAL A-A (a través de la zona de nado)
     ============================================================ */
  function corteT(cfg, geo, hyd) {
    const { W } = cfg;
    const dAvg = (cfg.dMin + cfg.dMax) / 2;
    const mS = 1.6, gr = 0.6;                        // margen y ancho terreno lateral
    const fullW = (W + 2 * gr + 2 * mS) * S;
    const fullH = (dAvg + 2.4) * S;
    const x0 = mS * S, y0 = 0.9 * S;                 // nivel terreno
    const bw = W * S;                                // ancho interior
    let g = "";

    // terreno
    g += rect(0, y0, (mS + gr) * S, fullH - y0, { f: "url(#hTer)", c: "none", w: 0 });
    g += rect(fullW - (mS + gr) * S, y0, (mS + gr) * S, fullH - y0, { f: "url(#hTer)", w: 0 });
    g += line(0, y0, fullW, y0, { c: MUTE, w: 1.2, d: "3 4" });

    // agua
    g += rect(x0, y0 + 0.12 * S, bw, dAvg * S - 0.12 * S, { f: "url(#aguaG)", w: 0 });
    g += line(x0, y0 + 0.12 * S, x0 + bw, y0 + 0.12 * S, { c: AQUA, w: 2, d: "10 5" });
    g += txt(x0 + bw / 2, y0 + 0.12 * S - 6, "N.A.G. nivel de agua", { c: "#0d7c93", fs: 10.5 });

    // muros hormigón
    const t = 0.15 * S;
    g += rect(x0 - t, y0 - 0.18 * S, t, dAvg * S + 0.3 * S, { f: "url(#hHor)" });
    g += rect(x0 + bw, y0 - 0.18 * S, t, dAvg * S + 0.3 * S, { f: "url(#hHor)" });
    g += rect(x0 - t, y0 + dAvg * S, bw + 2 * t, 0.18 * S, { f: "url(#hHor)" });

    // coping + vereda
    g += rect(x0 - t - 0.3 * S, y0 - 0.34 * S, 0.3 * S, 0.22 * S, { f: SAND, c: "#a8926b", w: 1.3 });
    g += rect(x0 + bw + t, y0 - 0.34 * S, 0.3 * S, 0.22 * S, { f: SAND, c: "#a8926b", w: 1.3 });
    if (cfg.deck) {
      g += rect(x0 - t - 0.3 * S - cfg.deckW * S, y0 - 0.3 * S, cfg.deckW * S, 0.18 * S, { f: DECKC, c: "#a8926b", w: 1.3 });
      g += rect(x0 + bw + t + 0.3 * S, y0 - 0.3 * S, cfg.deckW * S, 0.18 * S, { f: DECKC, c: "#a8926b", w: 1.3 });
    }
    // borde infinito (lado derecho desborda)
    if (cfg.infinity) {
      g += txt(x0 + bw + t + 12, y0 + 0.5 * S, "WEIR ↓", { c: "#a86600", fs: 12, w: "800", a: "start" });
    }

    // cotas: ancho y profundidad
    const dy = y0 + dAvg * S + 0.75 * S;
    g += line(x0, dy, x0 + bw, dy, { c: MUTE, w: 1.2, m: 1 });
    g += txt(x0 + bw / 2, dy - 7, `${fmt(W)} m`, { c: MUTE });
    const dx = x0 - t - (cfg.deck ? cfg.deckW + 0.3 : 0.3) * S - 0.55 * S;
    g += line(dx, y0, dx, y0 + dAvg * S, { c: MUTE, w: 1.2, m: 1 });
    g += txt(dx - 8, y0 + dAvg * S / 2, `h=${fmt(dAvg)} m (med.)`, { c: MUTE, fs: 11, rot: -90 });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fullW} ${fullH}" style="max-width:100%;height:auto">
      ${defs}<rect width="${fullW}" height="${fullH}" fill="#ffffff"/>${g}${sheetFrame(fullW, fullH, cfg, "CORTE TRANSVERSAL A-A", "03")}</svg>`;
  }

  /* ============================================================
     CORTE LONGITUDINAL B-B (solarium → drop → pendiente → hondo)
     ============================================================ */
  function corteL(cfg, geo, hyd) {
    const { L, dMin, dMax } = cfg;
    const sol = cfg.solarium && geo.solArea ? cfg.solW : 0;
    const mS = 1.6, gr = 0.6;
    const fullW = (L + 2 * gr + 2 * mS) * S;
    const fullH = (dMax + 2.4) * S;
    const x0 = mS * S, y0 = 0.9 * S;
    const bl = L * S;
    let g = "";

    // terreno + napa
    g += rect(0, y0, (mS + gr) * S, fullH - y0, { f: "url(#hTer)", w: 0 });
    g += rect(fullW - (mS + gr) * S, y0, (mS + gr) * S, fullH - y0, { f: "url(#hTer)", w: 0 });
    g += line(0, y0, fullW, y0, { c: MUTE, w: 1.2, d: "3 4" });
    g += line(0.3 * S, y0 + (dMax + 0.9) * S, fullW - 0.3 * S, y0 + (dMax + 0.9) * S, { c: "#3f7fae", w: 1.4, d: "4 6" });
    g += txt(fullW - 0.4 * S, y0 + (dMax + 0.9) * S - 6, "napa estimada — verificar en obra", { c: "#3f7fae", fs: 9.5, a: "end" });

    const t = 0.15 * S;
    const ySol = y0 + 0.30 * S;                          // fondo solarium
    const yMin = y0 + dMin * S, yMax = y0 + dMax * S;
    const xSol = x0 + sol * S;                           // fin zona solarium
    const ySwimStart = sol ? y0 + (dMin - 0.15) * S : yMin;

    // agua (perfil: solarium → drop → pendiente → hondo)
    g += `<path d="M${x0},${y0 + 0.12 * S}
      L${x0 + bl},${y0 + 0.12 * S}
      L${x0 + bl},${yMax}
      ${sol ? `L${xSol},${ySwimStart} L${xSol},${ySol} L${x0},${ySol}` : `L${x0},${yMin}`}
      Z" fill="url(#aguaG)" stroke="none"/>`;
    g += line(x0, y0 + 0.12 * S, x0 + bl, y0 + 0.12 * S, { c: AQUA, w: 2, d: "10 5" });

    // muros y fondo (polígono estructura)
    g += `<path d="M${x0 - t},${y0 - 0.18 * S}
      L${x0 + bl + t},${y0 - 0.18 * S}
      L${x0 + bl + t},${yMax + 0.18 * S}
      L${x0 - t},${yMax + 0.18 * S} Z" fill="none"/>`;
    g += `<path d="M${x0 - t},${y0 - 0.18 * S} L${x0},${y0 - 0.18 * S}
      L${x0},${sol ? ySol : yMin} L${x0 - t},${sol ? ySol : yMin} Z" fill="url(#hHor)"/>`;
    g += `<path d="M${x0 + bl},${y0 - 0.18 * S} L${x0 + bl + t},${y0 - 0.18 * S}
      L${x0 + bl + t},${yMax + 0.18 * S} L${x0 + bl},${yMax + 0.18 * S} Z" fill="url(#hHor)"/>`;
    // fondo con pendiente (losa)
    g += `<path d="M${x0 - t},${yMax + 0.18 * S}
      ${sol ? `L${x0 - t},${ySol} L${x0},${ySol}` : `L${x0 - t},${yMin}`}
      ${sol ? `L${xSol},${ySwimStart}` : ""}
      L${x0 + bl},${yMax}
      L${x0 + bl + t},${yMax + 0.18 * S} L${x0 - t},${yMax + 0.18 * S} Z"
      fill="url(#hHor)" stroke="${INK}" stroke-width="1.4"/>`;

    // coping + deck
    g += rect(x0 - t - 0.3 * S, y0 - 0.34 * S, 0.3 * S, 0.22 * S, { f: SAND, c: "#a8926b", w: 1.3 });
    g += rect(x0 + bl + t, y0 - 0.34 * S, 0.3 * S, 0.22 * S, { f: SAND, c: "#a8926b", w: 1.3 });
    if (cfg.deck) {
      g += rect(x0 - t - 0.3 * S - cfg.deckW * S, y0 - 0.3 * S, cfg.deckW * S, 0.18 * S, { f: DECKC, c: "#a8926b", w: 1.3 });
      g += rect(x0 + bl + t + 0.3 * S, y0 - 0.3 * S, cfg.deckW * S, 0.18 * S, { f: DECKC, c: "#a8926b", w: 1.3 });
    }

    // etiquetas de profundidad
    if (sol) {
      g += txt(x0 + sol * S / 2, ySol - 8, `playa 0,30 m`, { c: "#0d7c93", fs: 10.5 });
      g += txt(x0 + sol * S + 0.5 * S, ySwimStart - 10, `${fmt(dMin)} m`, { c: "#0d7c93", fs: 11 });
    } else {
      g += txt(x0 + 0.6 * S, yMin - 10, `${fmt(dMin)} m`, { c: "#0d7c93", fs: 11 });
    }
    g += txt(x0 + bl - 0.6 * S, yMax - 10, `${fmt(dMax)} m`, { c: "#0d7c93", fs: 11 });
    g += txt(x0 + bl * 0.5, y0 + 0.12 * S - 6, "N.A.G.", { c: "#0d7c93", fs: 10 });

    // cota largo
    const dy = yMax + 0.8 * S;
    g += line(x0, dy, x0 + bl, dy, { c: MUTE, w: 1.2, m: 1 });
    g += txt(x0 + bl / 2, dy - 7, `${fmt(L)} m`, { c: MUTE });


    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fullW} ${fullH}" style="max-width:100%;height:auto">
      ${defs}<rect width="${fullW}" height="${fullH}" fill="#ffffff"/>${g}${sheetFrame(fullW, fullH, cfg, "CORTE LONGITUDINAL B-B", "04")}</svg>`;
  }

  /* ============================================================
     AXONOMÉTRICA — vista 3D caballera del conjunto
     Ejes: x → derecha-abajo (0.86, 0.43) · y → izquierda-abajo
     (-0.86, 0.43) · z → arriba. Escala S/2 para entrar entera.
     ============================================================ */
  function axo(cfg, geo, hyd) {
    const s = S * 0.52;
    const P = (x, y, z) => [ (x - y) * 0.86 * s, (x + y) * 0.43 * s - z * s ];
    const pt = (x, y, z) => { const p = P(x, y, z); return `${p[0].toFixed(1)},${p[1].toFixed(1)}`; };
    const { L, W } = cfg;
    const cop = 0.3, dV = cfg.dMax;                       // coping y altura visual de paredes
    const dk = cfg.deck ? cfg.deckW + cop : cop;          // ancho total deck+coping
    const mX = 2.2, mTop = 1.6;
    const extL = L + 2 * dk, extW = W + 2 * dk;
    // extensión del dibujo
    const [ex0, ey0] = [0, 0];
    const corners = [P(-dk, -dk, 0), P(L + dk, -dk, 0), P(L + dk, W + dk, 0), P(-dk, W + dk, 0), P(L, W, -dV), P(L, 0, -dV)];
    const minX = Math.min(...corners.map(c => c[0])), maxX = Math.max(...corners.map(c => c[0]));
    const minY = Math.min(...corners.map(c => c[1])), maxY = Math.max(...corners.map(c => c[1]));
    const fullW = maxX - minX + 2 * mX * s;
    const fullH = maxY - minY + (mTop + 2.2) * s;
    const ox = mX * s - minX, oy = mTop * s - minY;       // traslación al marco
    let g = "";

    const T = `translate(${ox},${oy})`;

    // sombra en "terreno"
    g += `<g transform="${T}"><path d="M${pt(-dk, -dk, 0)} L${pt(L + dk, -dk, 0)} L${pt(L + dk, W + dk, 0)} L${pt(-dk, W + dk, 0)} Z"
      fill="url(#hTer)" stroke="#b9ab8c" stroke-width="1.2"/></g>`;

    // deck perimetral
    if (cfg.deck) {
      g += `<g transform="${T}"><path d="M${pt(-dk, -dk, 0)} L${pt(L + dk, -dk, 0)} L${pt(L + dk, W + dk, 0)} L${pt(-dk, W + dk, 0)} Z" fill="${DECKC}" opacity="0.9"/>
      <path d="M${pt(L + dk - cfg.deckW * 0.5, -dk, 0)} L${pt(L + dk - cfg.deckW * 0.5, W + dk, 0)}" stroke="#a8926b" stroke-width="1"/></g>`;
    }

    // coping (marco superior)
    g += `<g transform="${T}"><path d="M${pt(-cop, -cop, 0)} L${pt(L + cop, -cop, 0)} L${pt(L + cop, W + cop, 0)} L${pt(-cop, W + cop, 0)} Z"
      fill="${SAND}" stroke="#a8926b" stroke-width="1.6"/></g>`;

    // agua (espejo a nivel 0, un pelo bajo el coping)
    g += `<g transform="${T}"><path d="M${pt(0, 0, 0.05)} L${pt(L, 0, 0.05)} L${pt(L, W, 0.05)} L${pt(0, W, 0.05)} Z"
      fill="url(#aguaG)" stroke="none"/></g>`;

    // solarium en el agua (esquina 0,0)
    if (cfg.solarium && geo.solArea) {
      g += `<g transform="${T}"><path d="M${pt(0, 0, 0.04)} L${pt(cfg.solW, 0, 0.04)} L${pt(cfg.solW, W, 0.04)} L${pt(0, W, 0.04)} Z"
        fill="url(#hSol)" stroke="${AQUA}" stroke-width="1.2"/></g>`;
    }

    // paredes visibles: frente (y=W) y lateral derecho (x=L), extruidas hacia abajo
    g += `<g transform="${T}">
      <path d="M${pt(0, W, 0)} L${pt(L, W, 0)} L${pt(L, W, -dV)} L${pt(0, W, -dV)} Z" fill="#e7e2d6" stroke="${INK}" stroke-width="1.6"/>
      <path d="M${pt(L, 0, 0)} L${pt(L, W, 0)} L${pt(L, W, -dV)} L${pt(L, 0, -dV)} Z" fill="#dcd6c6" stroke="${INK}" stroke-width="1.6"/>
    </g>`;

    // borde infinito: cara frontal cae en lámina
    if (cfg.infinity && cfg.infSides === 1) {
      g += `<g transform="${T}"><path d="M${pt(0, W, 0)} L${pt(L, W, 0)} L${pt(L, W, -0.12)} L${pt(0, W, -0.12)} Z" fill="${AQUA}" opacity="0.65"/>
      <path d="M${pt(L * 0.3, W, -0.1)} q2,8 0,16 M${pt(L * 0.6, W, -0.1)} q2,8 0,16" stroke="${AQUA}" stroke-width="2" fill="none" opacity="0.8"/></g>`;
    }
    // paño de vidrio en la cara frontal
    if (cfg.type === "vidrio") {
      g += `<g transform="${T}"><path d="M${pt(0.4, W, -0.1)} L${pt(L - 0.4, W, -0.1)} L${pt(L - 0.4, W, -dV + 0.25)} L${pt(0.4, W, -dV + 0.25)} Z"
        fill="#9fdcec" opacity="0.55" stroke="#0aa5c9" stroke-width="2"/></g>`;
    }

    // olas suaves en el espejo
    g += `<g transform="${T}"><path d="M${pt(L * 0.15, W * 0.45, 0.03)} q${L * 0.08 * s},-4 ${L * 0.16 * s},0 t${L * 0.16 * s},0" fill="none" stroke="${AQUA}" stroke-width="1.5" opacity="0.6"/></g>`;

    // flecha norte + título
    g += txt(ox + (maxX - minX) + 0.6 * s, oy + 0.5 * s, "AXO", { fs: 12, a: "start" });
    const ty = fullH - 0.7 * s;
    g += txt(fullW / 2, ty, `AXONOMÉTRICA · ${cfg.tdef.name.toUpperCase()} · ${fmt(L)} × ${fmt(W)} m · ${BORDERS[cfg.borderType].name} · ObraAcuática ${DATA_VERSION}`, { c: MUTE, fs: 11.5 });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fullW.toFixed(0)} ${fullH.toFixed(0)}" style="max-width:100%;height:auto">
      ${defs}<rect width="100%" height="100%" fill="#ffffff"/>${g}${sheetFrame(fullW, fullH, cfg, "AXONOMÉTRICA DEL CONJUNTO", "02")}</svg>`;
  }

  function render(view, detail, cfg, geo, hyd) {
    SHEET.vol = geo.volume;
    if (view === "corteT") return corteT(cfg, geo, hyd);
    if (view === "corteL") return corteL(cfg, geo, hyd);
    if (view === "axo") return axo(cfg, geo, hyd);
    return planta(cfg, geo, hyd, detail);
  }

  return { render };
})();
