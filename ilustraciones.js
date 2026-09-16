/* ============================================================
   ObraAcuática — ilustraciones.js
   Viñetas arquitectónicas SVG por tipo de pileta (estilo
   sección/elevación: tinta + acuarela suave). Todo dibujado
   en código — sin imágenes externas, funciona offline.
   Olas con animación SMIL nativa de SVG.
   ============================================================ */

const Ilustracion = (() => {

  const INK = "#22303c", AQUA = "#1FB6CD", AQUA_D = "#0d7c93";
  const WATER = "#cfeef5", SAND = "#e8dcc4", SAND2 = "#d9c9a3";
  const PAPER = "#fdfaf3", SKY = "#e8f6fa", SKY2 = "#cfeaf2";
  const GREEN = "#5da58a", GREEN_D = "#3d7a63";

  const W = 320, H = 180, GY = 132; // GY = línea de terreno

  const defs = `
    <defs>
      <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${SKY}"/><stop offset="1" stop-color="${SKY2}"/>
      </linearGradient>
      <linearGradient id="agua" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#bde9f2"/><stop offset="1" stop-color="#8fd4e4"/>
      </linearGradient>
      <linearGradient id="papelG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.0"/><stop offset="1" stop-color="#e9ddc2" stop-opacity="0.5"/>
      </linearGradient>
    </defs>`;

  const ln = (x1, y1, x2, y2, o = {}) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || INK}" stroke-width="${o.w || 2}" ${o.d ? `stroke-dasharray="${o.d}"` : ""} ${o.cap ? `stroke-linecap="${o.cap}"` : ""}/>`;

  const r = (x, y, w, h, o = {}) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${o.f || "none"}" stroke="${o.c || INK}" stroke-width="${o.w || 2}" ${o.rx ? `rx="${o.rx}"` : ""}/>`;

  const cir = (cx, cy, rr, o = {}) =>
    `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="${o.f || "none"}" stroke="${o.c || INK}" stroke-width="${o.w || 2}"/>`;

  const pth = (d, o = {}) =>
    `<path d="${d}" fill="${o.f || "none"}" stroke="${o.c || INK}" stroke-width="${o.w || 2}" ${o.lj ? `stroke-linejoin="${o.lj}"` : "round"} ${o.lc ? `stroke-linecap="${o.lc}" : round"`.replace(' : round', "") : ""}/>`;

  /* olas animadas (SMIL): 2-3 líneas onduladas dentro del agua */
  const waves = (x, y, w, n = 3, amp = 4) => {
    let out = "";
    for (let i = 0; i < n; i++) {
      const yy = y + i * 11;
      out += `<path d="M${x},${yy} q${w / 8},${-amp} ${w / 4},0 t${w / 4},0 t${w / 4},0 t${w / 4},0"
        fill="none" stroke="${AQUA_D}" stroke-width="1.6" opacity="${0.75 - i * 0.18}">
        <animateTransform attributeName="transform" type="translate" values="0,0; ${9 + i * 5},0; 0,0"
          dur="${3.2 + i * 0.9}s" repeatCount="indefinite"/></path>`;
    }
    return out;
  };

  /* elementos de escena */
  const sun = (x, y, rr = 13) => {
    let rayos = "";
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      rayos += ln(x + Math.cos(a) * (rr + 4), y + Math.sin(a) * (rr + 4), x + Math.cos(a) * (rr + 10), y + Math.sin(a) * (rr + 10), { c: "#e8b64c", w: 2.2, cap: "round" });
    }
    return cir(x, y, rr, { f: "#ffd97a", c: "#e8b64c", w: 2 }) + rayos;
  };

  const cloud = (x, y, s = 1) =>
    `<g transform="translate(${x},${y}) scale(${s})">
      <path d="M0,0 a7,7 0 0 1 12,-6 a9,9 0 0 1 16,2 a6,6 0 0 1 8,5 z" fill="#fff" stroke="#a9ccd8" stroke-width="1.6"/>
    </g>`;

  const palm = (x, y, s = 1) => {
    const t = `translate(${x},${y}) scale(${s})`;
    let hojas = "";
    [[-26, -8, -40, -30], [-18, -18, -20, -44], [8, -20, 22, -46], [24, -8, 42, -26], [0, -14, 2, -50]].forEach(h => {
      hojas += `<path d="M0,-44 Q${(h[0] + h[2]) / 2},${(h[1] + h[3]) / 2 - 8} ${h[2]},${h[3]}" fill="none" stroke="${GREEN}" stroke-width="3.4" stroke-linecap="round"/>`;
      hojas += `<path d="M0,-44 Q${(h[0] + h[2]) / 2},${(h[1] + h[3]) / 2 - 8} ${h[2]},${h[3]}" fill="none" stroke="${GREEN_D}" stroke-width="1.2" stroke-linecap="round"/>`;
    });
    return `<g transform="${t}">
      <path d="M0,0 C-2,-18 2,-34 0,-46" stroke="#8a6a48" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <path d="M-1,-10 q8,2 9,10" stroke="#8a6a48" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${hojas}</g>`;
  };

  const person = (x, y, c = "#e2604a") =>
    `<g stroke="${c}" stroke-width="3" stroke-linecap="round" fill="none">
      <circle cx="${x}" cy="${y - 22}" r="4.6" fill="${c}" stroke="none"/>
      <path d="M${x},${y - 17} L${x},${y - 6} M${x},${y - 14} l7,5 M${x},${y - 14} l-7,4 M${x},${y - 6} l5,9 M${x},${y - 6} l-6,9"/>
    </g>`;

  const chair = (x, y, c = "#c96f4a") =>
    `<g transform="translate(${x},${y})" stroke="${c}" stroke-width="2.6" stroke-linecap="round" fill="none">
      <path d="M0,0 l0,-13 l10,-4"/><path d="M0,-13 l9,-9 M0,-13 l-8,-8"/>
      <path d="M-2,0 l0,4 M2,0 l0,4 M9,-4 l0,4" stroke-width="2"/>
    </g>`;

  const plant = (x, y, s = 1) =>
    `<g transform="translate(${x},${y}) scale(${s})" stroke="${GREEN_D}" stroke-width="2" fill="none" stroke-linecap="round">
      <path d="M0,0 L0,-16 M0,-6 L-8,-14 M0,-9 L8,-18 M0,-12 L-5,-22"/>
      <circle cx="-8" cy="-15" r="1.6" fill="${GREEN_D}" stroke="none"/>
    </g>`;

  const groundHatch = (x, y, w) => {
    let h = "";
    for (let i = 0; i < w; i += 11) h += ln(x + i, y, x + i - 6, y + 7, { c: "#b9ab8c", w: 1.2 });
    return ln(x, y, x + w, y, { w: 2.2 }) + h;
  };

  const frame = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block" preserveAspectRatio="xMidYMid meet">
    ${defs}<rect width="${W}" height="${H}" fill="url(#cielo)" rx="10"/>
    <rect width="${W}" height="${H}" fill="url(#papelG)" rx="10"/>${body}</svg>`;

  /* ============ VIÑETAS POR TIPO ============ */

  const dibujos = {

    /* ARENA / BALI: pileta orgánica, palmeras, piedras, playas */
    arena() {
      let b = sun(285, 30) + cloud(52, 26, 1) + palm(36, GY, 1.15) + palm(58, GY - 4, 0.8);
      // pileta orgánica: curvas Bali con playa
      b += pth("M92,120 C92,102 150,96 190,98 C240,100 268,106 268,118 C268,130 220,138 172,138 C130,138 92,134 92,120 Z", { f: "url(#agua)" });
      b += pth("M92,120 C92,102 150,96 190,98 C240,100 268,106 268,118 C268,130 220,138 172,138 C130,138 92,134 92,120 Z", { w: 2.4 });
      // playa de ingreso (franja arena dentro)
      b += pth("M96,128 C140,122 220,120 264,126", { c: SAND2, w: 9, lc: "round" });
      // bordes de piedra
      b += cir(100, 100, 7, { f: "#cbb98f" }) + cir(178, 96, 8, { f: "#d8c8a0" }) + cir(258, 112, 6.5, { f: "#cbb98f" });
      b += waves(112, 112, 130, 3, 3.2);
      // persona en la playa + reposera
      b += chair(146, GY - 8, "#c96f4a") + person(196, GY - 10, "#3f8f6f");
      b += groundHatch(70, GY, 190);
      b += plant(286, GY, 1.1);
      return frame(b);
    },

    /* TRADICIONAL: recta clásica, escalera, borde ladrillo */
    tradicional() {
      let b = sun(288, 32) + cloud(60, 30);
      // muro de fondo (casa)
      b += r(24, 34, 42, GY - 34, { f: "#efe6d2" }) + ln(24, 58, 66, 58, { c: "#b9ab8c", w: 1.4 });
      b += r(38, 48, 14, 12, { c: "#b9ab8c", w: 1.4 }); // ventana
      // pileta rectangular enterrada
      b += r(96, 104, 168, 34, { f: "url(#agua)" });
      b += ln(96, 104, 96, 138, { w: 2.6 }) + ln(264, 104, 264, 138, { w: 2.6 });
      // borde ladrillo
      b += r(90, 98, 180, 7, { f: SAND, rx: 2 });
      // escalera inox
      b += `<path d="M150,104 v14 M160,104 v14 M150,118 q5,6 10,0" stroke="#8d9aa5" stroke-width="2.6" fill="none"/>`;
      b += waves(110, 116, 140, 3);
      b += person(210, GY - 8, "#3f7fae") + chair(240, GY - 8);
      b += groundHatch(76, GY, 200);
      b += plant(290, GY);
      return frame(b);
    },

    /* PREFABRICADA: grúa levantando un panel GRC */
    prefabricada() {
      let b = cloud(46, 28) + sun(287, 30, 11);
      // pileta monobloque montada
      b += r(120, 96, 130, 38, { f: "url(#agua)", rx: 6 });
      b += r(114, 90, 142, 8, { f: SAND, rx: 3 });
      b += waves(132, 108, 100, 2);
      // panel suspendido por grúa
      b += r(212, 40, 34, 22, { f: "#e6dcc6", rx: 3 });
      b += ln(229, 40, 229, 26, { c: "#8d9aa5", w: 1.6 });
      b += `<path d="M258,14 L258,44 M258,14 L206,14 L206,26" stroke="#e8a13c" stroke-width="3" fill="none"/>`;
      b += cir(258, 14, 4, { c: "#e8a13c", w: 2.6 });
      // flechas de montaje
      b += `<path d="M206,34 l0,26 m-4,-7 l4,7 l4,-7" stroke="${AQUA_D}" stroke-width="2.2" fill="none"/>`;
      b += person(112, GY - 8, "#e2604a") + groundHatch(84, GY, 190);
      b += `<text x="84" y="166" font-family="Segoe UI" font-size="10" fill="#84A9BB">montaje de paneles GRC en 2-4 días</text>`;
      return frame(b);
    },

    /* NATURAL: juncos, nenúfares, libélula */
    natural() {
      let b = sun(34, 32) + cloud(238, 28);
      // vaso orgánico con zona de regeneración
      b += pth("M88,118 C88,100 160,94 214,97 C258,100 276,108 274,119 C272,131 216,139 166,139 C122,139 88,132 88,118 Z", { f: "url(#agua)" });
      b += pth("M88,118 C88,100 160,94 214,97 C258,100 276,108 274,119 C272,131 216,139 166,139 C122,139 88,132 88,118 Z", { w: 2.4 });
      // zona regeneración: gravas + plantas (franja derecha)
      b += pth("M214,100 C258,102 276,108 274,119 C272,130 240,137 210,138", { c: GREEN_D, w: 2, d: "4 4" });
      b += plant(224, 112, 1.2) + plant(244, 118, 1.05) + plant(262, 108, 0.9) + plant(230, 130, 0.8);
      // nenúfar
      b += cir(160, 128, 6, { f: GREEN, c: GREEN_D, w: 1.6 });
      b += ln(160, 122, 160, 128, { c: GREEN_D, w: 1.2 });
      b += waves(104, 112, 88, 2, 3);
      // libélula
      b += `<g transform="translate(146,66)"><path d="M0,0 l10,-3 M0,0 l10,3" stroke="${AQUA_D}" stroke-width="1.8"/><circle cx="-2" cy="0" r="2.2" fill="${AQUA_D}"/><path d="M-4,0 l-8,2" stroke="${AQUA_D}" stroke-width="1.2"/></g>`;
      b += palm(300, GY, 0.9) + groundHatch(72, GY, 200);
      return frame(b);
    },

    /* CONTENEDOR: contenedor cortado con agua y deck */
    contenedor() {
      let b = sun(286, 30) + cloud(58, 30);
      // contenedor en elevación (corte mostrando agua)
      b += r(84, 74, 168, 58, { f: "url(#agua)", rx: 3 });
      b += r(84, 74, 168, 58, { c: "#c96f4a", w: 3, rx: 3 });
      // ondulaciones laterales de contenedor
      for (let i = 96; i < 250; i += 14) b += ln(i, 77, i, 90, { c: "#e0916a", w: 1.6 });
      // agua interna
      b += waves(100, 100, 130, 3);
      b += ln(84, 92, 252, 92, { c: AQUA_D, w: 2, d: "8 5" });
      // escalera exterior + deck
      b += `<path d="M258,132 h14 M262,132 v-26 M266,132 v-26 M262,106 h8" stroke="#8d9aa5" stroke-width="2.4" fill="none"/>`;
      b += r(60, 126, 26, 6, { f: SAND2, rx: 2 }) + r(250, 126, 26, 6, { f: SAND2, rx: 2 });
      b += chair(64, GY - 6) + person(150, 92, "#ffffff");
      b += groundHatch(56, GY, 220);
      b += `<text x="60" y="166" font-family="Segoe UI" font-size="10" fill="#84A9BB">20-40 pies · del puerto a tu patio</text>`;
      return frame(b);
    },

    /* VIDRIO: paño lateral con persona visible, atardecer */
    vidrio() {
      let b = `<circle cx="270" cy="98" r="17" fill="#ff9d5c" stroke="#e2732e" stroke-width="2"/>`;
      // franjas atardecer
      b += `<rect width="${W}" height="${H}" fill="#fbd9a8" opacity="0.25" rx="10"/>`;
      // pileta elevada con paño de vidrio al frente
      b += r(74, 78, 180, 40, { f: "url(#agua)", rx: 3 });
      b += r(74, 78, 180, 40, { c: "#0aa5c9", w: 3.2, rx: 3 });
      // reflejo diagonal del paño
      b += `<path d="M96,114 L150,80 M130,116 L184,80 M164,116 L218,80" stroke="#ffffff" stroke-width="2" opacity="0.55"/>`;
      b += waves(92, 92, 120, 2);
      // persona nadando visible tras el vidrio
      b += person(160, 108, "#e2604a");
      // marco de apoyo inox
      b += ln(74, 118, 74, 126, { c: "#8d9aa5", w: 4 }) + ln(254, 118, 254, 126, { c: "#8d9aa5", w: 4 });
      // base/estructura
      b += r(64, 126, 200, 8, { f: SAND2, rx: 2 });
      b += groundHatch(60, GY, 210);
      b += palm(40, GY, 1) + palm(292, GY, 0.85);
      return frame(b);
    },

    /* SUSPENDIDA: rooftop con ciudad */
    suspendida() {
      let b = cloud(50, 26) + sun(280, 26, 11);
      // skyline de fondo
      [[20, 62, 22], [48, 46, 16], [122, 54, 20], [206, 50, 18], [236, 62, 26], [272, 58, 20]].forEach(bd => {
        b += r(bd[0], bd[1], bd[2], GY - bd[1], { f: "#dde8ec", c: "#a9c3cc", w: 1.3 });
      });
      // edificio protagonista
      b += r(86, 44, 108, GY - 44, { f: "#eef3f5", c: "#8fb0ba", w: 1.8 });
      for (let fy = 56; fy < 118; fy += 16) b += ln(94, fy, 186, fy, { c: "#b9cdd4", w: 1.2 });
      // pileta en la terraza, desbordando
      b += r(96, 78, 88, 22, { f: "url(#agua)" });
      b += ln(96, 78, 96, 100, { w: 2.6 }) + ln(184, 78, 184, 100, { w: 2.6 });
      b += waves(104, 86, 66, 2, 2.6);
      // lámina cayendo (borde infinito del frente)
      b += `<path d="M96,100 q-3,14 0,26" stroke="${AQUA}" stroke-width="2.4" fill="none" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.35;0.8" dur="2.6s" repeatCount="indefinite"/></path>`;
      b += person(130, 78, "#3f7fae");
      b += `<text x="70" y="166" font-family="Segoe UI" font-size="10" fill="#84A9BB">1 m³ de agua = 1.000 kg sobre la estructura</text>`;
      return frame(b);
    },

    /* PLUNGE: mini pileta con mesa de tragos */
    plunge() {
      let b = sun(34, 30) + cloud(210, 28);
      // monobloque chico
      b += r(110, 92, 96, 34, { f: "url(#agua)", rx: 10 });
      b += r(104, 86, 108, 8, { f: SAND, rx: 4 });
      b += waves(122, 104, 66, 2, 2.6);
      // copa sobre el borde
      b += `<path d="M196,80 q0,8 -6,8 q-6,0 -6,-8 z M190,88 l0,5 M185,93 h10" stroke="#c96f4a" stroke-width="2" fill="none"/>`;
      b += person(140, GY - 8, "#e2604a") + chair(228, GY - 6, "#3f8f6f");
      // sombrilla
      b += `<path d="M252,96 a26,16 0 0 1 52,0 z" fill="#f2c1a0" stroke="#c96f4a" stroke-width="2"/><path d="M278,96 l0,36" stroke="#8a6a48" stroke-width="3"/>`;
      b += groundHatch(80, GY, 200) + plant(84, GY, 1.2);
      return frame(b);
    },

    /* CONTRA CORRIENTE: nadador con flujo */
    endless() {
      let b = cloud(60, 28) + sun(286, 30, 11);
      // canal de nado
      b += r(70, 100, 190, 32, { f: "url(#agua)" });
      b += ln(70, 100, 70, 132, { w: 2.6 }) + ln(260, 100, 260, 132, { w: 2.6 });
      b += r(64, 94, 202, 7, { f: SAND, rx: 3 });
      // jet contra corriente
      b += `<g><path d="M86,116 h16 m-16,-5 l-7,5 l7,5" stroke="${AQUA_D}" stroke-width="2.8" fill="none"/>
        <path d="M78,116 h-12" stroke="${AQUA_D}" stroke-width="2" opacity="0.5">
        <animate attributeName="x2" values="66;58;66" dur="1.6s" repeatCount="indefinite"/></path></g>`;
      // líneas de flujo
      b += [110, 130, 150, 170].map((x, i) =>
        `<path d="M${x},116 h26" stroke="${AQUA_D}" stroke-width="2" opacity="${0.5 - i * 0.09}">
         <animate attributeName="opacity" values="${0.5 - i * 0.09};0.15;${0.5 - i * 0.09}" dur="${1.8 + i * 0.4}s" repeatCount="indefinite"/></path>`).join("");
      // nadador en el lugar
      b += person(196, 116, "#3f7fae");
      b += groundHatch(60, GY, 220) + plant(290, GY);
      b += `<text x="70" y="166" font-family="Segoe UI" font-size="10" fill="#84A9BB">nadás kilómetros sin moverte de casa</text>`;
      return frame(b);
    },

    /* SPA: vapor, jets, copos de contraste */
    spa() {
      let b = `<rect width="${W}" height="${H}" fill="#e4edf2" opacity="0.5" rx="10"/>`;
      b += cloud(54, 28) + cloud(230, 24);
      // spa elevado de madera
      b += r(104, 88, 118, 42, { f: "url(#agua)", rx: 14 });
      b += r(98, 82, 130, 10, { f: "#a9825c", rx: 4 }) + ln(98, 120, 228, 120, { c: "#8a6a48", w: 3 });
      // vapor
      [[150, 66], [176, 58], [202, 68]].forEach((s, i) => {
        b += `<path d="M${s[0]},${s[1] + 14} q6,-8 0,-14 q-6,-6 0,-12" stroke="#9fb9c4" stroke-width="2.4" fill="none" opacity="0.75">
          <animate attributeName="opacity" values="0.75;0.2;0.75" dur="${2.4 + i * 0.7}s" repeatCount="indefinite"/></path>`;
      });
      // burbujas de jets
      [[128, 118], [140, 122], [152, 117], [190, 119], [204, 123], [216, 118]].forEach((bb, i) => {
        b += `<circle cx="${bb[0]}" cy="${bb[1]}" r="2.4" fill="#fff" stroke="${AQUA_D}" stroke-width="1.2">
          <animate attributeName="cy" values="${bb[1]};${bb[1] - 10};${bb[1]}" dur="${1.4 + i * 0.3}s" repeatCount="indefinite"/></circle>`;
      });
      b += person(166, 104, "#e2604a");
      // copo de nieve (contraste frío exterior)
      b += `<g transform="translate(52,96)" stroke="#7fb6d9" stroke-width="1.8">
        <path d="M0,-12 L0,12 M-10,-6 L10,6 M-10,6 L10,-6"/><path d="M0,-12 l-3,3 M0,-12 l3,3 M0,12 l-3,-3 M0,12 l3,-3"/></g>`;
      b += groundHatch(76, GY, 200) + plant(280, GY, 1.15);
      return frame(b);
    }
  };

  /* fallback genérico (no debería usarse) */
  function generico() {
    return frame(r(110, 96, 100, 36, { f: "url(#agua)" }) + waves(124, 110, 70, 2) + groundHatch(80, GY, 160));
  }

  function tipo(id) {
    return (dibujos[id] || generico)();
  }

  return { tipo };
})();
