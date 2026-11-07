/* ==========================================================
   Campaign Studio · escena 3D
   Un portátil que, al hacer scroll, se fragmenta en un túnel de cristal
   del que emergen las piezas publicitarias de la trayectoria.
   Three.js r160 · sin build, servido por import map
   ========================================================== */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const ready = () => window.dispatchEvent(new Event("scene-ready"));
const canvas = document.getElementById("scene");
const mqMobile = window.matchMedia("(max-width: 760px)");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const BG = 0xeceeef;
const FONT_DISPLAY = '"Bodoni Moda", Didot, Georgia, serif';
const FONT_SANS = '"Inter Tight", system-ui, sans-serif';
const FONT_MONO = '"JetBrains Mono", Consolas, monospace';

/* ==========================================================
   PIEZAS PUBLICITARIAS
   Para usar una imagen real: pon el archivo en assets/ads/ y
   escribe su ruta en `image`, por ejemplo "assets/ads/jd.jpg".
   ========================================================== */
const POSTERS = [
  { client: "JD Sports Fashion", years: "2023 — 2025", headline: "Una marca.\nUn mismo\nrelato.", sub: "Cultura · Imagen corporativa", motif: "arches", bg: "#1e3a32", fg: "#f3ede2", accent: "#cdb07c", image: null },
  { client: "Senado de Colombia", years: "2022 — 2023", headline: "Cien mil\nvoces, un\nsolo tono.", sub: "Imagen pública · Crisis", motif: "rings", bg: "#4d1519", fg: "#f3ede2", accent: "#d9b98a", image: null },
  { client: "Flash Noticias", years: "2020 — 2021", headline: "La\ncomunidad\nprimero.", sub: "Contenidos · Alianzas ONG", motif: "circles", bg: "#b4532b", fg: "#fbf3e6", accent: "#2a1810", image: null },
  { client: "Salud Total EPS", years: "2020 — 2022", headline: "Comunicar\nhacia\ndentro.", sub: "Comunicación interna", motif: "lines", bg: "#1b2740", fg: "#eef1f6", accent: "#9fb4d6", image: null },
  { client: "El Transportador", years: "2018 — 2020", headline: "Eventos que\nhablan dos\nidiomas.", sub: "Relaciones institucionales", motif: "diagonal", bg: "#121212", fg: "#f1ece3", accent: "#c9ab7c", image: null },
  { client: "Atelier de IA", years: "2025 — hoy", headline: "Escuchar\nmás rápido.\nDecidir mejor.", sub: "IA generativa · Prompting", motif: "iridescent", bg: "#f6f3ee", fg: "#121318", accent: "#a8885a", image: null }
];

/* ---------- Estados por sección ---------- */
// e1: estallido · e2: túnel · pv: piezas visibles · focus: x de la pieza (para móvil) · fade: opacidad del lienzo
const PZ = (k) => -6 - k * 6;
const SIDE = (k) => (k % 2 === 0 ? 1 : -1);
const KEYS = [
  { cam: [0, 2.3, 7.4], look: [-1.25, 0.05, 0], e1: 0, e2: 0, pv: 0, focus: 0, fade: 1 },
  { cam: [0, 1.5, 8.6], look: [0, 0.9, -2], e1: 1, e2: 0, pv: 0, focus: 0, fade: 1 }
];
for (let k = 0; k < POSTERS.length; k++) {
  const s = SIDE(k);
  KEYS.push({ cam: [-s * 0.25, 1.15, PZ(k) + 4.6], look: [s * 0.25, 1.0, PZ(k)], e1: 1, e2: 1, pv: 1, focus: s * 1.35, fade: 1 });
}
KEYS.push({ cam: [0, 1.3, -30], look: [0, 1.1, -40], e1: 1, e2: 1, pv: 1, focus: 0, fade: 0.55 });
KEYS.push({ cam: [0, 2.0, 7.4], look: [1.45, 0.55, 0], e1: 0, e2: 0, pv: 0, focus: 0, fade: 1 });

/* ---------- Dimensiones del portátil ---------- */
const W = 3.0;        // ancho
const D = 2.05;       // fondo de la base
const T = 0.11;       // grosor base
const LH = 1.95;      // alto de la tapa
const LT = 0.055;     // grosor tapa
const OPEN = -0.3;    // ángulo abierto (rad)
const CLOSED = Math.PI / 2;

/* ==========================================================
   Texturas en canvas
   ========================================================== */

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function grain(g, w, h, amount, light) {
  for (let i = 0; i < amount; i++) {
    g.fillStyle = light ? `rgba(255,255,255,${Math.random() * 0.07})` : `rgba(0,0,0,${Math.random() * 0.07})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }
}

/* --- Pantalla: panel de marketing animado --- */
const PROMPT_LOOP = [
  "Analiza 200 comentarios y agrúpalos en 5 tensiones de la audiencia…",
  "Propón un calendario de 4 semanas con tono propio por red…",
  "Redacta 3 respuestas de crisis: aclaratoria, empática y de cierre…",
  "Resume los KPIs del mes en 3 hallazgos y 3 decisiones…"
];

function drawScreen(g, SW, SH, mode, t) {
  // marco
  g.fillStyle = "#0b0c0f";
  g.fillRect(0, 0, SW, SH);
  const pad = 22;
  const x0 = pad, y0 = pad, w = SW - pad * 2, h = SH - pad * 2;
  g.save();
  roundRect(g, x0, y0, w, h, 6);
  g.clip();
  g.fillStyle = "#f3f2ef";
  g.fillRect(x0, y0, w, h);

  if (mode === "contact") {
    g.fillStyle = "#f3f2ef";
    g.fillRect(x0, y0, w, h);
    g.fillStyle = "#a8885a";
    g.font = `500 15px ${FONT_MONO}`;
    g.textAlign = "center";
    g.fillText("09 / HABLEMOS", SW / 2, y0 + h * 0.3);
    g.fillStyle = "#101216";
    g.font = `italic 400 92px ${FONT_DISPLAY}`;
    g.fillText("Hablemos.", SW / 2, y0 + h * 0.52);
    g.font = `400 22px ${FONT_MONO}`;
    g.fillText("adriana.bello.guz@gmail.com", SW / 2, y0 + h * 0.66);
    g.fillStyle = "#737983";
    g.font = `400 14px ${FONT_MONO}`;
    g.fillText("INCORPORACIÓN INMEDIATA · PRESENCIAL O HÍBRIDO", SW / 2, y0 + h * 0.76);
    const blink = Math.floor(t * 2) % 2 === 0;
    if (blink) { g.fillStyle = "#a8885a"; g.fillRect(SW / 2 + 190, y0 + h * 0.645, 12, 24); }
    g.restore();
    g.textAlign = "left";
    return;
  }

  // barra lateral
  const sb = 150;
  g.fillStyle = "#121419";
  g.fillRect(x0, y0, sb, h);
  g.fillStyle = "#c9ab7c";
  g.fillRect(x0 + 20, y0 + 20, 34, 34);
  g.fillStyle = "#121419";
  g.font = `500 16px ${FONT_DISPLAY}`;
  g.fillText("AB", x0 + 25, y0 + 43);
  const items = ["Campañas", "Audiencias", "IA Studio", "KPIs", "Marca", "Prensa"];
  g.font = `400 13px ${FONT_SANS}`;
  items.forEach((it, i) => {
    const yy = y0 + 92 + i * 34;
    if (i === 0) { g.fillStyle = "rgba(201,171,124,0.16)"; g.fillRect(x0 + 10, yy - 20, sb - 20, 30); }
    g.fillStyle = i === 0 ? "#f3ede2" : "#8d929b";
    g.fillText(it, x0 + 22, yy);
  });

  // cabecera
  const cx = x0 + sb + 24;
  const cw = w - sb - 48;
  g.fillStyle = "#101216";
  g.font = `italic 400 30px ${FONT_DISPLAY}`;
  g.fillText("Campaign Studio", cx, y0 + 46);
  g.fillStyle = "#737983";
  g.font = `400 12px ${FONT_MONO}`;
  g.fillText("ADRIANA BELLO · MARKETING & COMUNICACIÓN", cx, y0 + 68);
  const live = 0.5 + 0.5 * Math.sin(t * 4);
  g.fillStyle = `rgba(168,136,90,${0.4 + live * 0.6})`;
  g.fillRect(cx + cw - 92, y0 + 34, 8, 8);
  g.fillStyle = "#101216";
  g.fillText("EN VIVO", cx + cw - 76, y0 + 42);

  // KPIs
  const kpis = [["COMUNIDAD", "100K+"], ["TRAYECTORIA", "7 años"], ["ORGANIZACIONES", "5"], ["PAÍSES", "3"]];
  const kw = (cw - 3 * 12) / 4;
  kpis.forEach(([label, val], i) => {
    const kx = cx + i * (kw + 12), ky = y0 + 88;
    g.fillStyle = "#ffffff";
    g.fillRect(kx, ky, kw, 86);
    g.strokeStyle = "rgba(16,18,22,0.1)";
    g.strokeRect(kx + 0.5, ky + 0.5, kw - 1, 85);
    g.fillStyle = "#737983";
    g.font = `400 10.5px ${FONT_MONO}`;
    g.fillText(label, kx + 14, ky + 24);
    g.fillStyle = "#101216";
    g.font = `400 34px ${FONT_DISPLAY}`;
    g.fillText(val, kx + 14, ky + 66);
    g.fillStyle = "#a8885a";
    g.fillRect(kx, ky + 84, kw * (0.35 + 0.15 * i), 2);
  });

  // gráfico de engagement
  const gx = cx, gy = y0 + 190, gw = cw * 0.62, gh = h - 190 - 20;
  g.fillStyle = "#ffffff";
  g.fillRect(gx, gy, gw, gh);
  g.fillStyle = "#737983";
  g.font = `400 10.5px ${FONT_MONO}`;
  g.fillText("ENGAGEMENT · ALCANCE", gx + 14, gy + 24);
  g.strokeStyle = "rgba(16,18,22,0.07)";
  g.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    const yy = gy + 40 + ((gh - 60) / 4) * i;
    g.beginPath(); g.moveTo(gx + 14, yy); g.lineTo(gx + gw - 14, yy); g.stroke();
  }
  const plot = (amp, phase, color, width) => {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.beginPath();
    for (let i = 0; i <= 60; i++) {
      const px = gx + 14 + ((gw - 28) / 60) * i;
      const base = gy + gh - 24 - (i / 60) * (gh - 90) * 0.75;
      const py = base - Math.sin(i * 0.35 + t * 1.4 + phase) * amp - Math.sin(i * 0.11 + phase) * amp * 0.8;
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.stroke();
  };
  plot(10, 0, "#101216", 2);
  plot(8, 2, "#a8885a", 2.5);

  // tarjeta IA
  const ax = gx + gw + 12, aw = cw - gw - 12;
  g.fillStyle = "#121419";
  g.fillRect(ax, gy, aw, gh);
  g.fillStyle = "#c9ab7c";
  g.font = `400 10.5px ${FONT_MONO}`;
  g.fillText("IA · PROMPT", ax + 14, gy + 24);
  const idx = Math.floor(t / 5) % PROMPT_LOOP.length;
  const full = PROMPT_LOOP[idx];
  const shown = full.slice(0, Math.floor(((t % 5) / 3.2) * full.length));
  g.fillStyle = "#d8dbe0";
  g.font = `400 13px ${FONT_MONO}`;
  const words = shown.split(" ");
  let line = "", ly = gy + 54;
  const maxW = aw - 28;
  words.forEach((wd) => {
    const test = line ? line + " " + wd : wd;
    if (g.measureText(test).width > maxW) { g.fillText(line, ax + 14, ly); line = wd; ly += 20; }
    else line = test;
  });
  g.fillText(line, ax + 14, ly);
  if (Math.floor(t * 2.5) % 2 === 0) {
    g.fillStyle = "#c9ab7c";
    g.fillRect(ax + 16 + g.measureText(line).width, ly - 12, 7, 15);
  }

  g.restore();
  // cámara del marco
  g.fillStyle = "#24272e";
  g.beginPath(); g.arc(SW / 2, 11, 3.5, 0, Math.PI * 2); g.fill();
}

/* --- Teclado + trackpad --- */
function makeDeckTexture() {
  const KW = 1024, KH = Math.round(1024 * (D / W));
  const c = document.createElement("canvas");
  c.width = KW; c.height = KH;
  const g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, KW, KH);
  grd.addColorStop(0, "#d8c4a2");
  grd.addColorStop(1, "#c4ab84");
  g.fillStyle = grd;
  g.fillRect(0, 0, KW, KH);
  grain(g, KW, KH, 9000, true);
  // teclas
  const kx = 120, ky = 60, kw = KW - 240, kh = KH * 0.5;
  g.fillStyle = "rgba(60,48,32,0.25)";
  roundRect(g, kx - 10, ky - 10, kw + 20, kh + 20, 10);
  g.fill();
  const cols = 14, rows = 6, gap = 7;
  const cw = (kw - gap * (cols - 1)) / cols, ch = (kh - gap * (rows - 1)) / rows;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      if (r === rows - 1 && col > 3 && col < 10) {
        if (col === 4) { g.fillStyle = "#1b1d22"; roundRect(g, kx + col * (cw + gap), ky + r * (ch + gap), cw * 6 + gap * 5, ch, 6); g.fill(); }
        continue;
      }
      g.fillStyle = "#1b1d22";
      roundRect(g, kx + col * (cw + gap), ky + r * (ch + gap), cw, ch, 6);
      g.fill();
    }
  }
  // trackpad
  g.fillStyle = "rgba(255,255,255,0.18)";
  roundRect(g, KW / 2 - 190, ky + kh + 46, 380, KH - (ky + kh + 46) - 34, 14);
  g.fill();
  g.strokeStyle = "rgba(80,62,38,0.25)";
  g.lineWidth = 2;
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* --- Pieza publicitaria --- */
function drawPoster(g, PW, PH, p, idx, img) {
  g.fillStyle = p.bg;
  g.fillRect(0, 0, PW, PH);

  if (img) {
    const s = Math.max(PW / img.width, PH / img.height);
    g.drawImage(img, (PW - img.width * s) / 2, (PH - img.height * s) / 2, img.width * s, img.height * s);
    const shade = g.createLinearGradient(0, PH * 0.35, 0, PH);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(0,0,0,0.65)");
    g.fillStyle = shade;
    g.fillRect(0, 0, PW, PH);
  } else {
    g.save();
    switch (p.motif) {
      case "arches": {
        for (let i = 0; i < 3; i++) {
          const aw = 420 - i * 110, ax = PW / 2 - aw / 2 + 90, top = 150 + i * 70, bottom = 760;
          g.fillStyle = i === 2 ? p.accent : `rgba(243,237,226,${0.06 + i * 0.05})`;
          g.beginPath();
          g.moveTo(ax, bottom);
          g.lineTo(ax, top + aw / 2);
          g.arc(ax + aw / 2, top + aw / 2, aw / 2, Math.PI, 0);
          g.lineTo(ax + aw, bottom);
          g.closePath();
          g.fill();
        }
        g.strokeStyle = p.accent; g.lineWidth = 2;
        g.beginPath(); g.arc(PW / 2 - 140, 230, 70, 0, Math.PI * 2); g.stroke();
        break;
      }
      case "rings": {
        for (let i = 0; i < 16; i++) {
          g.strokeStyle = `rgba(243,237,226,${0.5 - i * 0.028})`;
          g.lineWidth = 1.5;
          g.beginPath(); g.arc(PW * 0.7, PH * 0.3, 30 + i * 26, 0, Math.PI * 2); g.stroke();
        }
        g.fillStyle = p.accent;
        g.beginPath(); g.arc(PW * 0.7, PH * 0.3, 22, 0, Math.PI * 2); g.fill();
        g.fillStyle = "rgba(243,237,226,0.92)";
        g.font = `italic 400 190px ${FONT_DISPLAY}`;
        g.fillText("100K+", 40, PH * 0.56);
        break;
      }
      case "circles": {
        const pts = [[260, 300, 170], [470, 280, 150], [370, 470, 190], [560, 520, 120], [200, 560, 110]];
        pts.forEach(([x, y, r], i) => {
          g.fillStyle = i % 2 ? "rgba(251,243,230,0.22)" : "rgba(42,24,16,0.18)";
          g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
          g.strokeStyle = "rgba(251,243,230,0.7)"; g.lineWidth = 1.5; g.stroke();
        });
        break;
      }
      case "lines": {
        g.strokeStyle = "rgba(238,241,246,0.12)";
        for (let y = 80; y < PH * 0.72; y += 22) { g.beginPath(); g.moveTo(40, y); g.lineTo(PW - 40, y); g.stroke(); }
        for (let r = 0; r < 7; r++) for (let c = 0; c < 9; c++) {
          const on = (r * 9 + c) % 5 === 0;
          g.fillStyle = on ? p.accent : "rgba(238,241,246,0.55)";
          g.fillRect(110 + c * 64, 150 + r * 64, on ? 26 : 14, on ? 26 : 14);
        }
        break;
      }
      case "diagonal": {
        g.strokeStyle = p.accent; g.lineWidth = 2;
        for (let i = -PH; i < PW; i += 46) { g.beginPath(); g.moveTo(i, PH * 0.7); g.lineTo(i + PH * 0.7, 0); g.stroke(); }
        g.fillStyle = p.bg; g.fillRect(70, 170, PW - 140, 330);
        g.strokeStyle = p.accent; g.strokeRect(70, 170, PW - 140, 330);
        g.fillStyle = p.fg; g.textAlign = "center";
        g.font = `italic 400 150px ${FONT_DISPLAY}`;
        g.fillText("ES / EN", PW / 2, 390);
        g.textAlign = "left";
        break;
      }
      case "iridescent": {
        const blobs = [[200, 260, 300, "rgba(240,170,190,0.55)"], [560, 220, 280, "rgba(170,190,240,0.55)"], [420, 520, 320, "rgba(214,188,140,0.6)"], [160, 600, 240, "rgba(170,225,210,0.5)"]];
        blobs.forEach(([x, y, r, col]) => {
          const rg = g.createRadialGradient(x, y, 0, x, y, r);
          rg.addColorStop(0, col); rg.addColorStop(1, "rgba(246,243,238,0)");
          g.fillStyle = rg; g.fillRect(0, 0, PW, PH);
        });
        g.strokeStyle = "rgba(18,19,24,0.8)"; g.lineWidth = 1.5;
        g.beginPath(); g.arc(PW / 2, 400, 150, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.ellipse(PW / 2, 400, 150, 50, -0.4, 0, Math.PI * 2); g.stroke();
        g.fillStyle = "#121318"; g.beginPath(); g.arc(PW / 2, 400, 8, 0, Math.PI * 2); g.fill();
        break;
      }
    }
    g.restore();
  }

  grain(g, PW, PH, 14000, p.fg !== "#121318");

  // tipografía
  const fg = img ? "#ffffff" : p.fg;
  g.fillStyle = fg;
  g.font = `500 15px ${FONT_MONO}`;
  g.fillText(p.client.toUpperCase(), 44, 64);
  g.textAlign = "right";
  g.fillText("N° " + String(idx + 1).padStart(2, "0"), PW - 44, 64);
  g.textAlign = "left";
  g.fillRect(44, 82, PW - 88, 1.5);

  const lines = p.headline.split("\n");
  g.font = `400 84px ${FONT_DISPLAY}`;
  const lh = 86;
  const startY = PH - 96 - (lines.length - 1) * lh - 64;
  lines.forEach((ln, i) => {
    g.font = i === lines.length - 1 ? `italic 400 84px ${FONT_DISPLAY}` : `400 84px ${FONT_DISPLAY}`;
    g.fillText(ln, 40, startY + i * lh);
  });

  g.fillRect(44, PH - 112, PW - 88, 1.5);
  g.font = `400 14px ${FONT_MONO}`;
  g.fillText(p.sub.toUpperCase(), 44, PH - 78);
  g.textAlign = "right";
  g.fillText(p.years, PW - 44, PH - 78);
  g.textAlign = "left";
  g.globalAlpha = 0.7;
  g.font = `400 12px ${FONT_MONO}`;
  g.fillText("ADRIANA BELLO — VISUAL CONCEPTUAL", 44, PH - 48);
  g.globalAlpha = 1;
}

function makeRadialTexture(inner, outer) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, inner);
  grd.addColorStop(1, outer);
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ==========================================================
   Fragmentación: triángulos sobre una rejilla con jitter
   ========================================================== */
function makeShards(width, height, cols, rows, depth, materials) {
  const pts = [];
  for (let r = 0; r <= rows; r++) {
    pts[r] = [];
    for (let c = 0; c <= cols; c++) {
      let x = (c / cols) * width;
      let y = (r / rows) * height;
      const jx = (width / cols) * 0.38, jy = (height / rows) * 0.38;
      if (c > 0 && c < cols) x += (Math.random() - 0.5) * 2 * jx;
      if (r > 0 && r < rows) y += (Math.random() - 0.5) * 2 * jy;
      pts[r][c] = new THREE.Vector2(x, y);
    }
  }
  const shards = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = pts[r][c], b = pts[r][c + 1], cc = pts[r + 1][c + 1], d = pts[r + 1][c];
      const tris = Math.random() < 0.5 ? [[a, b, cc], [a, cc, d]] : [[a, b, d], [b, cc, d]];
      for (const tri of tris) {
        const shape = new THREE.Shape(tri);
        const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
        const uv = geo.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / width, uv.getY(i) / height);
        // grupos: 0 = cara trasera, 1 = cara frontal, 2 = cantos
        const total = geo.attributes.position.count;
        geo.clearGroups();
        geo.addGroup(0, 3, 1);
        geo.addGroup(3, 3, 0);
        geo.addGroup(6, total - 6, 2);
        const cx = (tri[0].x + tri[1].x + tri[2].x) / 3;
        const cy = (tri[0].y + tri[1].y + tri[2].y) / 3;
        geo.translate(-cx, -cy, -depth / 2);
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, materials);
        mesh.castShadow = true;
        shards.push({ mesh, cx, cy });
      }
    }
  }
  return shards;
}

/* ==========================================================
   Escena
   ========================================================== */
function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch (err) {
    document.documentElement.classList.add("no-webgl");
    ready();
    return;
  }

  const isMobile = () => mqMobile.matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile() ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 7, 26);

  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 90);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd5d9de, 1.25));
  const key = new THREE.DirectionalLight(0xfff6ea, 1.6);
  key.position.set(3, 7, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe9efff, 0.6);
  fill.position.set(-5, 2, 3);
  scene.add(fill);

  /* ---------- Materiales del portátil ---------- */
  const SW = 1024, SH = Math.round(1024 * (LH / W));
  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = SW; screenCanvas.height = SH;
  const sg = screenCanvas.getContext("2d");
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  drawScreen(sg, SW, SH, "dash", 0);

  const alu = new THREE.MeshStandardMaterial({ color: 0xd2bb95, metalness: 0.85, roughness: 0.3, envMapIntensity: 1.1 });
  const aluEdge = new THREE.MeshStandardMaterial({ color: 0xb59d77, metalness: 0.9, roughness: 0.25, envMapIntensity: 1.2 });
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
  const deckTex = makeDeckTexture();
  deckTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const deckMat = new THREE.MeshStandardMaterial({ map: deckTex, metalness: 0.55, roughness: 0.38, envMapIntensity: 0.9 });

  // [frontal, trasera, cantos]
  const lidShards = makeShards(W, LH, 8, 5, LT, [screenMat, alu, aluEdge]).map((s) => ({ ...s, part: "lid" }));
  const baseShards = makeShards(W, D, 8, 5, T, [deckMat, alu, aluEdge]).map((s) => ({ ...s, part: "base" }));
  const shards = [...lidShards, ...baseShards];

  const shardGroup = new THREE.Group();
  scene.add(shardGroup);

  // Datos de explosión por fragmento
  const tmpV = new THREE.Vector3();
  shards.forEach((s, i) => {
    shardGroup.add(s.mesh);
    if (s.part === "lid") s.local = new THREE.Vector3(s.cx - W / 2, s.cy, 0);
    else s.local = new THREE.Vector3(s.cx - W / 2, s.cy - D / 2, 0);

    // posición aproximada montada (portátil abierto) para calcular la dirección del estallido
    const approx = s.part === "lid"
      ? new THREE.Vector3(s.local.x, T + s.local.y * 0.95, -D / 2 - s.local.y * 0.3)
      : new THREE.Vector3(s.local.x, T / 2, -s.local.y);
    const dir = tmpV.copy(approx).sub(new THREE.Vector3(0, 0.5, -0.4)).normalize();
    dir.x += (Math.random() - 0.5) * 0.6;
    dir.y += (Math.random() - 0.2) * 0.8;
    dir.z += (Math.random() - 0.3) * 0.8;
    dir.normalize();
    s.burst = approx.clone().addScaledVector(dir, 1.4 + Math.random() * 2.6);

    // posición en el túnel (paredes laterales + techo, dejando libre el pasillo)
    const side = Math.random() < 0.5 ? -1 : 1;
    const roof = Math.random() < 0.25;
    s.field = new THREE.Vector3(
      roof ? (Math.random() - 0.5) * 5 : side * (2.4 + Math.random() * 3.4),
      roof ? 2.9 + Math.random() * 1.8 : -0.8 + Math.random() * 3.8,
      4 - Math.random() * 50
    );
    s.axis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    s.burstAngle = (Math.random() - 0.5) * Math.PI * 3;
    s.spin = (Math.random() - 0.5) * 0.7;
    // la grieta se propaga desde el centro de la pantalla
    const dCenter = s.part === "lid" ? Math.hypot(s.local.x, s.local.y - LH / 2) : 1.2 + Math.hypot(s.local.x, s.local.y) * 0.5;
    s.delay = Math.min(1, dCenter / 2.2) * 0.45 + Math.random() * 0.1;
    s.delay2 = Math.random() * 0.35;
  });

  // Sombra de contacto bajo el portátil
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 3.6),
    new THREE.MeshBasicMaterial({ map: makeRadialTexture("rgba(30,32,38,0.35)", "rgba(30,32,38,0)"), transparent: true, depthWrite: false })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, -0.02, -0.3);
  scene.add(contactShadow);

  /* ---------- Piezas publicitarias ---------- */
  const PW = 768, PH = 1024;
  const posterFrameMat = new THREE.MeshStandardMaterial({ color: 0xd2bb95, metalness: 0.85, roughness: 0.3 });
  const posters = POSTERS.map((p, k) => {
    const c = document.createElement("canvas");
    c.width = PW; c.height = PH;
    const g = c.getContext("2d");
    drawPoster(g, PW, PH, p, k, null);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (p.image) {
      const img = new Image();
      img.onload = () => { drawPoster(g, PW, PH, p, k, img); tex.needsUpdate = true; };
      img.src = p.image;
    }
    const group = new THREE.Group();
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.0), new THREE.MeshBasicMaterial({ map: tex, fog: false }));
    plane.position.z = 0.012;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.56, 2.06, 0.02), posterFrameMat);
    group.add(frame, plane);
    const s = SIDE(k);
    group.userData = { target: new THREE.Vector3(s * 1.35, 1.05, PZ(k)), rotY: -s * 0.32, k };
    group.scale.setScalar(0.001);
    scene.add(group);
    return group;
  });

  /* ---------- Partículas de ambiente ---------- */
  const PCOUNT = isMobile() ? 380 : 800;
  const pPos = new Float32Array(PCOUNT * 3);
  for (let i = 0; i < PCOUNT; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 16;
    pPos[i * 3 + 1] = -1.5 + Math.random() * 7;
    pPos[i * 3 + 2] = 9 - Math.random() * 62;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0x6f747c, size: 0.022, transparent: true, opacity: 0.6, depthWrite: false
  }));
  scene.add(particles);

  /* ---------- Scroll → progreso ---------- */
  const rooms = Array.from(document.querySelectorAll("[data-room]"));
  let roomTops = [];
  const measure = () => { roomTops = rooms.map((r) => r.getBoundingClientRect().top + window.scrollY); };
  measure();

  function scrollProgress() {
    const y = window.scrollY + window.innerHeight * 0.45;
    const n = roomTops.length;
    if (y <= roomTops[0]) return 0;
    for (let i = 0; i < n - 1; i++) {
      if (y < roomTops[i + 1]) {
        const f = (y - roomTops[i]) / (roomTops[i + 1] - roomTops[i]);
        return i + THREE.MathUtils.smoothstep(f, 0.4, 1.0);
      }
    }
    return n - 1;
  }

  const mouse = new THREE.Vector2();
  const mouseS = new THREE.Vector2();
  window.addEventListener("pointermove", (e) => {
    mouse.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile() ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    measure();
  });
  window.addEventListener("load", measure);
  if (window.ResizeObserver) new ResizeObserver(measure).observe(document.body);

  /* ---------- Bucle ---------- */
  const clock = new THREE.Clock();
  let progress = scrollProgress();
  let visible = true;
  let lastScreen = -1;
  let screenMode = "dash";
  let lastFade = -1;

  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    if (visible) clock.getDelta();
  });

  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), vB = new THREE.Vector3();
  const mRoot = new THREE.Matrix4(), mPart = new THREE.Matrix4(), mLocal = new THREE.Matrix4(), mTmp = new THREE.Matrix4();
  const mBase = new THREE.Matrix4().makeTranslation(0, T / 2, 0).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  const qRoot = new THREE.Quaternion(), qSpin = new THREE.Quaternion(), eRoot = new THREE.Euler();
  const aPos = new THREE.Vector3(), aQuat = new THREE.Quaternion(), aScale = new THREE.Vector3();
  const target = new THREE.Vector3();
  const ID_Q = new THREE.Quaternion();
  const ONE = new THREE.Vector3(1, 1, 1);

  const lerpKey = (a, b, f, prop, out) => out.fromArray(KEYS[a][prop]).lerp(vB.fromArray(KEYS[b][prop]), f);
  const lerpNum = (a, b, f, prop) => THREE.MathUtils.lerp(KEYS[a][prop], KEYS[b][prop], f);
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const ease = (x) => x * x * (3 - 2 * x);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const tm = reduceMotion ? 0 : t;

    progress += (scrollProgress() - progress) * (reduceMotion ? 1 : Math.min(1, dt * 3));
    const a = Math.floor(progress);
    const b = Math.min(a + 1, KEYS.length - 1);
    const f = progress - a;

    const e1 = lerpNum(a, b, f, "e1");
    const e2 = lerpNum(a, b, f, "e2");
    const pv = lerpNum(a, b, f, "pv");

    let fade = lerpNum(a, b, f, "fade");
    if (Math.abs(fade - lastFade) > 0.004) { canvas.style.opacity = fade.toFixed(3); lastFade = fade; }

    // Cámara
    lerpKey(a, b, f, "cam", camPos);
    lerpKey(a, b, f, "look", camLook);
    if (isMobile()) {
      const focus = lerpNum(a, b, f, "focus");
      camPos.x = focus * 0.9;
      camLook.x = focus;
      if (Math.abs(focus) > 0.01) { camLook.y -= 0.1; camPos.z += 2.4; }
      else { camPos.z = camPos.z * 1.5 + (camPos.z > 0 ? 0.5 : 0); camLook.y -= 0.35; }
    }
    mouseS.lerp(mouse, Math.min(1, dt * 2.5));
    camPos.x += mouseS.x * 0.25;
    camPos.y -= mouseS.y * 0.15;
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    // Intro: la tapa se abre
    const intro = reduceMotion ? 1 : ease(clamp01((t - 0.9) / 2.2));
    const lidAngle = THREE.MathUtils.lerp(CLOSED, OPEN, intro);

    // Portátil montado: raíz con giro suave
    const calm = 1 - e1;
    eRoot.set(mouseS.y * 0.05 * calm, (Math.sin(tm * 0.35) * 0.22 + mouseS.x * 0.25) * calm + (1 - intro) * -0.5, 0);
    qRoot.setFromEuler(eRoot);
    mRoot.compose(tmpV.set(0, Math.sin(tm * 0.9) * 0.03 * calm, 0), qRoot, ONE);
    const mLid = mTmp.makeTranslation(0, T + LT / 2, -D / 2 + LT / 2).multiply(new THREE.Matrix4().makeRotationX(lidAngle));

    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      mPart.multiplyMatrices(mRoot, s.part === "lid" ? mLid : mBase);
      mLocal.compose(s.local, ID_Q, ONE);
      mPart.multiply(mLocal);
      mPart.decompose(aPos, aQuat, aScale);

      const k1 = ease(clamp01((e1 - s.delay) / 0.5));
      const k2 = ease(clamp01((e2 - s.delay2) / 0.65));
      target.copy(s.burst).lerp(s.field, k2);
      target.y += Math.sin(tm * 0.6 + i) * 0.05 * k1;
      s.mesh.position.copy(aPos).lerp(target, k1);
      qSpin.setFromAxisAngle(s.axis, k1 * s.burstAngle + tm * s.spin * k1);
      s.mesh.quaternion.copy(aQuat).multiply(qSpin);
    }
    contactShadow.material.opacity = 1 - e1;

    // Pantalla: panel de marketing en vivo o contacto
    const mode = progress > KEYS.length - 1.5 ? "contact" : "dash";
    if (e1 < 0.98 && (t - lastScreen > 1 / 15 || mode !== screenMode)) {
      screenMode = mode;
      drawScreen(sg, SW, SH, mode, t);
      screenTex.needsUpdate = true;
      lastScreen = t;
    }

    // Piezas publicitarias
    for (const poster of posters) {
      const { target: tgt, rotY, k } = poster.userData;
      const s = ease(clamp01((pv - k * 0.05) / 0.7));
      poster.position.set(0, 0.9, -0.5).lerp(tgt, s);
      poster.position.y += Math.sin(tm * 0.7 + k) * 0.04 * s;
      poster.rotation.set(Math.sin(tm * 0.5 + k) * 0.02, rotY + (1 - s) * Math.PI * 0.8 + Math.sin(tm * 0.4 + k) * 0.04, 0);
      poster.scale.setScalar(Math.max(0.001, s));
      poster.visible = s > 0.002;
    }

    // Partículas
    if (!reduceMotion) {
      const arr = pGeo.attributes.position.array;
      for (let i = 0; i < PCOUNT; i++) {
        arr[i * 3 + 1] += dt * 0.05;
        if (arr[i * 3 + 1] > 5.5) arr[i * 3 + 1] = -1.5;
      }
      pGeo.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  frame();
  requestAnimationFrame(() => requestAnimationFrame(ready));
}

const fontsReady = document.fonts
  ? Promise.all([
      document.fonts.load('400 84px "Bodoni Moda"'),
      document.fonts.load('italic 400 84px "Bodoni Moda"'),
      document.fonts.load('400 14px "JetBrains Mono"'),
      document.fonts.load('400 13px "Inter Tight"')
    ]).catch(() => {})
  : Promise.resolve();

Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]).then(() => {
  try {
    init();
  } catch (err) {
    console.error(err);
    document.documentElement.classList.add("no-webgl");
    ready();
  }
});
