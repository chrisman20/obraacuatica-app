#!/usr/bin/env node
/* ============================================================
   gen-splash.js — splash screens iOS de ObraAcuática (estándar §7.1-3)
   Genera PNGs 750/1170/1290/2048 con Node puro (zlib + chunks PNG):
   fondo de marca, tile redondeado con el monograma OA (O anillada +
   A triangular, fiel a icon.svg) y tres olas sinusoidales en la base.
   El arte lo genera el agente (regla 12: jamás placeholder).
   Uso: node tools/gen-splash.js
   ============================================================ */
"use strict";
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

/* ---------- PNG writer (RGB 8-bit, filtro 0) ---------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function writePNG(file, w, h, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit, truecolor RGB
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0; // filtro none
    rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
  fs.writeFileSync(file, png);
  return png.length;
}

/* ---------- helpers de color / geometría ---------- */
const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = d => clamp(0.5 - d, 0, 1); // d en px: <0 dentro; suaviza 1px

// SDF caja redondeada centrada en (cx,cy), medio-lado h, radio r
function sdfRRect(px, py, cx, cy, h, r) {
  const qx = Math.abs(px - cx) - (h - r);
  const qy = Math.abs(py - cy) - (h - r);
  const ax = Math.max(qx, 0), ay = Math.max(qy, 0);
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(ax, ay) - r;
}
// SDF anillo
function sdfRing(px, py, cx, cy, rm) {
  return Math.abs(Math.hypot(px - cx, py - cy) - rm.mid) - rm.half;
}

/* SDF triángulo genérico (Iñigo Quilez) */
function sdfTriangle(px, py, p0, p1, p2) {
  const e = [[p1[0] - p0[0], p1[1] - p0[1]], [p2[0] - p1[0], p2[1] - p1[1]], [p0[0] - p2[0], p0[1] - p2[1]]];
  const v = [[px - p0[0], py - p0[1]], [px - p1[0], py - p1[1]], [px - p2[0], py - p2[1]]];
  const pq = [];
  for (let i = 0; i < 3; i++) {
    const t = clamp((v[i][0] * e[i][0] + v[i][1] * e[i][1]) / (e[i][0] * e[i][0] + e[i][1] * e[i][1]), 0, 1);
    pq.push([v[i][0] - e[i][0] * t, v[i][1] - e[i][1] * t]);
  }
  let s = Math.sign(e[0][0] * e[2][1] - e[0][1] * e[2][0]);
  let d = Math.min(Math.min(pq[0][0] ** 2 + pq[0][1] ** 2, pq[1][0] ** 2 + pq[1][1] ** 2), pq[2][0] ** 2 + pq[2][1] ** 2);
  return s * Math.sqrt(d);
}

/* SDF cápsula (segmento a→b con radio r): trazo parejo para el monograma */
function sdfCapsule(px, py, ax, ay, bx, by, r) {
  const pax = px - ax, pay = py - ay, bax = bx - ax, bay = by - ay;
  const h = clamp((pax * bax + pay * bay) / (bax * bax + bay * bay), 0, 1);
  return Math.hypot(pax - bax * h, pay - bay * h) - r;
}

/* ---------- composición ---------- */
function over(dst, i, c, a) {
  dst[i] = Math.round(dst[i] * (1 - a) + c[0] * a);
  dst[i + 1] = Math.round(dst[i + 1] * (1 - a) + c[1] * a);
  dst[i + 2] = Math.round(dst[i + 2] * (1 - a) + c[2] * a);
}

/* ---------- escena de splash ---------- */
function renderSplash(w, h) {
  const rgb = Buffer.alloc(w * h * 3);
  const BG1 = hex("#04141D"), BG2 = hex("#072433"), BG3 = hex("#0B3547");
  const AQUA_B = hex("#4FD8EC"), AQUA = hex("#1FB6CD"), AQUA_D = hex("#0B6E88");
  const INK = hex("#041820");

  // tile del monograma
  const side = Math.round(Math.min(w, h) * 0.34);
  const cx = w / 2, cy = h * 0.44;
  const half = side / 2, rad = side * 0.22;
  const stroke = side * 0.085; // grosor del trazo del monograma

  for (let y = 0; y < h; y++) {
    const ty = y / h;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      // fondo: degradado vertical con tinte aqua abajo
      let bg = ty < 0.55 ? mix(BG1, BG2, ty / 0.55) : mix(BG2, BG3, (ty - 0.55) / 0.45);
      rgb[i] = bg[0]; rgb[i + 1] = bg[1]; rgb[i + 2] = bg[2];

      // tile redondeado con gradiente diagonal (como icon.svg)
      const dTile = sdfRRect(x, y, cx, cy, half, rad);
      const aT = smooth(dTile);
      if (aT > 0) {
        // t diagonal dentro del tile [-1..1]
        const tt = clamp(((x - (cx - half)) + (y - (cy - half))) / (side * 2), 0, 1);
        const g = tt < 0.5 ? mix(AQUA_B, AQUA, tt * 2) : mix(AQUA, AQUA_D, (tt - 0.5) * 2);
        over(rgb, i, g, aT * 0.96);
      }

      // monograma OA: O anillada + A de cápsulas (trazo parejo, fiel al icono)
      const ink = INK;
      // O: anillo a la izquierda del tile
      const oCx = cx - side * 0.20, oCy = cy, oR = side * 0.155;
      const aO = smooth(sdfRing(x, y, oCx, oCy, { mid: oR, half: stroke / 2 }));
      if (aO > 0) over(rgb, i, ink, aO * 0.94);
      // A: dos patas (cápsulas) + barra horizontal
      const aCx = cx + side * 0.185;
      const apexY = cy - side * 0.180, baseY = cy + side * 0.180;
      const legX = side * 0.130;
      const aLegL = smooth(sdfCapsule(x, y, aCx, apexY, aCx - legX, baseY, stroke * 0.52));
      const aLegR = smooth(sdfCapsule(x, y, aCx, apexY, aCx + legX, baseY, stroke * 0.52));
      const barY = cy + side * 0.040, barHalfW = side * 0.105;
      const aBar = smooth(sdfCapsule(x, y, aCx - barHalfW, barY, aCx + barHalfW, barY, stroke * 0.40));
      const aA = Math.max(aLegL, aLegR, aBar);
      if (aA > 0) over(rgb, i, ink, aA * 0.94);

      // olas en la base (3 capas sinusoidales, como la app)
      const layers = [
        { y0: h * 0.870, amp: h * 0.012, lam: w * 0.55, a: 0.20, c: AQUA_B },
        { y0: h * 0.905, amp: h * 0.016, lam: w * 0.42, a: 0.34, c: AQUA },
        { y0: h * 0.945, amp: h * 0.020, lam: w * 0.34, a: 0.55, c: AQUA_D }
      ];
      for (const L of layers) {
        const wy = L.y0 + L.amp * Math.sin((x / L.lam) * Math.PI * 2 + (L === layers[0] ? 1.3 : L === layers[1] ? 2.6 : 0.4));
        const d = y - wy;
        if (d > -2) over(rgb, i, L.c, L.a * smooth(-d));
      }
    }
  }
  return rgb;
}

/* ---------- main ---------- */
const SIZES = [
  [750, 1334, "splash-750.png"],     // iPhone SE/8 @2x
  [1170, 2532, "splash-1170.png"],   // iPhone 12/13/14
  [1290, 2796, "splash-1290.png"],   // iPhone 14 Pro Max / 15 Plus
  [2048, 2732, "splash-2048.png"]   // iPad Pro 12.9
];
const outDir = path.join(__dirname, "..");
for (const [w, h, name] of SIZES) {
  const bytes = writePNG(path.join(outDir, name), w, h, renderSplash(w, h));
  console.log(`generado ${name} ${w}x${h} (${(bytes / 1024).toFixed(1)} KB)`);
}
