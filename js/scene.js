/* ==========================================================
   Campaign Studio · escena 3D
   Narrativa: todo nace en la pantalla y vuelve a ella.
   00 El portátil se abre · 01 La pantalla se despliega en capas
   02–07 Cada campaña se publica y sale proyectada de la pantalla
   08 Las campañas orbitan el estudio · 09 Vuelven a la pantalla
   Three.js r160 · sin build, servido por import map
   ========================================================== */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

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
const NP = POSTERS.length;

/* ---------- Cámara por sección ---------- */
const KEYS = [
  { cam: [0, 2.3, 7.4], look: [-1.25, 0.05, 0], fade: 1 },      // 00 inicio
  { cam: [3.6, 2.5, 6.6], look: [0.15, 1.25, 0.3], fade: 1 },   // 01 perfil (capas)
];
for (let k = 0; k < NP; k++) {
  KEYS.push({ cam: [-0.9 + k * 0.12, 2.1, 8.0 - k * 0.05], look: [0.35, 1.05, 0.5], fade: 1 }); // 02–07 campañas
}
KEYS.push({ cam: [0, 3.6, 10.4], look: [0, 1.7, -1.0], fade: 0.6 });   // 08 IA
KEYS.push({ cam: [0, 2.0, 7.4], look: [1.45, 0.55, 0], fade: 1 });     // 09 contacto
const ROOM_FIRST_PIECE = 2;
const ROOM_LAB = 2 + NP;
const ROOM_CONTACT = ROOM_LAB + 1;

/* ---------- Portátil ---------- */
const W = 3.0, D = 2.05, T = 0.072, LH = 1.95, LT = 0.034;
const OPEN = -0.3, CLOSED = Math.PI / 2 - 0.02;
const SCR_W = W - 0.08, SCR_H = LH - 0.1;

/* ---------- Carrusel ---------- */
const CAR_R = 3.3, CAR_Y = 1.35, CAR_Z = -0.4, THETA0 = 0.95;
// Muro curvo de campañas publicadas, detrás del portátil
const WALL_R = 5.4, WALL_CZ = 0.9, WALL_Y = 2.55, WALL_STEP = 0.255, WALL_SCALE = 0.82;

/* ==========================================================
   Utilidades de dibujo
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

function wrapText(g, text, x, y, maxW, lh) {
  let line = "";
  let yy = y;
  text.split(" ").forEach((wd) => {
    const test = line ? line + " " + wd : wd;
    if (g.measureText(test).width > maxW && line) { g.fillText(line, x, yy); line = wd; yy += lh; }
    else line = test;
  });
  g.fillText(line, x, yy);
  return { x: x + g.measureText(line).width, y: yy };
}

/* ==========================================================
   Pantalla
   ========================================================== */
const SW = 1024, SH = Math.round(1024 * (SCR_H / SCR_W));
const PAD = 8;

// Rectángulos de cada capa del panel (en píxeles de la pantalla)
function dashRects() {
  const x0 = PAD, y0 = PAD, w = SW - PAD * 2, h = SH - PAD * 2;
  const sb = 150;
  const cx = x0 + sb + 24, cw = w - sb - 48;
  const kw = (cw - 3 * 12) / 4;
  const gy = y0 + 190, gh = h - 190 - 20, gw = cw * 0.62;
  return {
    sidebar: [x0, y0, sb, h],
    header: [cx, y0 + 14, cw, 64],
    kpi0: [cx, y0 + 88, kw, 86],
    kpi1: [cx + (kw + 12), y0 + 88, kw, 86],
    kpi2: [cx + 2 * (kw + 12), y0 + 88, kw, 86],
    kpi3: [cx + 3 * (kw + 12), y0 + 88, kw, 86],
    chart: [cx, gy, gw, gh],
    ai: [cx + gw + 12, gy, cw - gw - 12, gh]
  };
}
const LAYERS = ["sidebar", "header", "kpi0", "kpi1", "kpi2", "kpi3", "chart", "ai"];
const LAYER_DEPTH = { sidebar: 0, header: 1, kpi0: 2, kpi1: 2, kpi2: 2, kpi3: 2, chart: 3, ai: 4 };

const PROMPT_LOOP = [
  "Analiza 200 comentarios y agrúpalos en 5 tensiones de la audiencia…",
  "Propón un calendario de 4 semanas con tono propio por red…",
  "Redacta 3 respuestas de crisis: aclaratoria, empática y de cierre…",
  "Resume los KPIs del mes en 3 hallazgos y 3 decisiones…"
];

function typed(t, period) {
  const idx = Math.floor(t / period) % PROMPT_LOOP.length;
  const full = PROMPT_LOOP[idx];
  return full.slice(0, Math.floor(((t % period) / (period * 0.65)) * full.length));
}

// Dibuja una capa del panel en su propio canvas (origen 0,0)
function drawLayer(name, g, w, h, t) {
  g.clearRect(0, 0, w, h);
  if (name === "sidebar") {
    g.fillStyle = "#121419"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#c9ab7c"; g.fillRect(20, 20, 34, 34);
    g.fillStyle = "#121419"; g.font = `500 16px ${FONT_DISPLAY}`; g.fillText("AB", 25, 43);
    ["Campañas", "Audiencias", "IA Studio", "KPIs", "Marca", "Prensa"].forEach((it, i) => {
      const yy = 92 + i * 34;
      if (i === 0) { g.fillStyle = "rgba(201,171,124,0.16)"; g.fillRect(10, yy - 20, w - 20, 30); }
      g.fillStyle = i === 0 ? "#f3ede2" : "#8d929b";
      g.font = `400 13px ${FONT_SANS}`;
      g.fillText(it, 22, yy);
    });
  } else if (name === "header") {
    g.fillStyle = "#f3f2ef"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#101216"; g.font = `italic 400 30px ${FONT_DISPLAY}`; g.fillText("Campaign Studio", 0, 32);
    g.fillStyle = "#737983"; g.font = `400 12px ${FONT_MONO}`; g.fillText("ADRIANA BELLO · MARKETING & COMUNICACIÓN", 0, 54);
    const live = 0.5 + 0.5 * Math.sin(t * 4);
    g.fillStyle = `rgba(168,136,90,${0.4 + live * 0.6})`; g.fillRect(w - 92, 20, 8, 8);
    g.fillStyle = "#101216"; g.fillText("EN VIVO", w - 76, 28);
  } else if (name.startsWith("kpi")) {
    const i = +name[3];
    const [label, val] = [["COMUNIDAD", "100K+"], ["TRAYECTORIA", "7 años"], ["ORGANIZACIONES", "5"], ["PAÍSES", "3"]][i];
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(16,18,22,0.12)"; g.strokeRect(0.5, 0.5, w - 1, h - 1);
    g.fillStyle = "#737983"; g.font = `400 10.5px ${FONT_MONO}`; g.fillText(label, 14, 24);
    g.fillStyle = "#101216"; g.font = `400 34px ${FONT_DISPLAY}`; g.fillText(val, 14, 66);
    g.fillStyle = "#a8885a"; g.fillRect(0, h - 3, w * (0.35 + 0.15 * i), 3);
  } else if (name === "chart") {
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#737983"; g.font = `400 10.5px ${FONT_MONO}`; g.fillText("ENGAGEMENT · ALCANCE", 14, 24);
    g.strokeStyle = "rgba(16,18,22,0.07)"; g.lineWidth = 1;
    for (let i = 1; i < 5; i++) { const yy = 40 + ((h - 60) / 4) * i; g.beginPath(); g.moveTo(14, yy); g.lineTo(w - 14, yy); g.stroke(); }
    const plot = (amp, phase, color, lw) => {
      g.strokeStyle = color; g.lineWidth = lw; g.beginPath();
      for (let i = 0; i <= 60; i++) {
        const px = 14 + ((w - 28) / 60) * i;
        const base = h - 24 - (i / 60) * (h - 90) * 0.75;
        const py = base - Math.sin(i * 0.35 + t * 1.4 + phase) * amp - Math.sin(i * 0.11 + phase) * amp * 0.8;
        i ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.stroke();
    };
    plot(10, 0, "#101216", 2);
    plot(8, 2, "#a8885a", 2.5);
  } else if (name === "ai") {
    g.fillStyle = "#121419"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#c9ab7c"; g.font = `400 10.5px ${FONT_MONO}`; g.fillText("IA · PROMPT", 14, 24);
    g.fillStyle = "#d8dbe0"; g.font = `400 13px ${FONT_MONO}`;
    const end = wrapText(g, typed(t, 5), 14, 54, w - 28, 20);
    if (Math.floor(t * 2.5) % 2 === 0) { g.fillStyle = "#c9ab7c"; g.fillRect(end.x + 2, end.y - 12, 7, 15); }
  }
}

// Fondo de la pantalla según el modo
function drawScreenBase(g, mode, t, info) {
  g.fillStyle = "#0b0c0f";
  g.fillRect(0, 0, SW, SH);
  const x0 = PAD, y0 = PAD, w = SW - PAD * 2, h = SH - PAD * 2;
  g.save();
  roundRect(g, x0, y0, w, h, 16);
  g.clip();
  g.fillStyle = "#f3f2ef";
  g.fillRect(x0, y0, w, h);

  if (mode === "dash") {
    // huecos de las capas (visibles cuando se despliegan)
    const R = dashRects();
    g.strokeStyle = "rgba(168,136,90,0.35)";
    g.setLineDash([5, 5]);
    LAYERS.forEach((n) => { const [x, y, ww, hh] = R[n]; g.strokeRect(x + 0.5, y + 0.5, ww - 1, hh - 1); });
    g.setLineDash([]);
  } else if (mode === "publish") {
    const { k, posterCanvas, since } = info;
    const p = POSTERS[k];
    // miniatura de la pieza
    const th = h - 80, tw = th * 0.75;
    g.fillStyle = "#d9cdb8";
    g.fillRect(x0 + 38, y0 + 38, tw + 8, th + 8);
    g.drawImage(posterCanvas, x0 + 42, y0 + 42, tw, th);
    const tx = x0 + 42 + tw + 48;
    const tw2 = x0 + w - 40 - tx;
    g.fillStyle = "#a8885a";
    g.font = `500 13px ${FONT_MONO}`;
    g.fillText(`CAMPAÑA ${String(k + 1).padStart(2, "0")} / ${String(NP).padStart(2, "0")}`, tx, y0 + 66);
    g.fillStyle = "#101216";
    g.font = `400 46px ${FONT_DISPLAY}`;
    g.fillText(p.client, tx, y0 + 124);
    g.fillStyle = "#737983";
    g.font = `400 14px ${FONT_MONO}`;
    g.fillText(p.sub.toUpperCase() + " · " + p.years, tx, y0 + 156);
    // progreso de publicación
    const prog = Math.min(1, Math.max(0, (t - since) / 2.2));
    g.fillStyle = "rgba(16,18,22,0.1)";
    g.fillRect(tx, y0 + 200, tw2, 4);
    g.fillStyle = "#101216";
    g.fillRect(tx, y0 + 200, tw2 * prog, 4);
    g.font = `500 13px ${FONT_MONO}`;
    g.fillText(prog < 1 ? `PUBLICANDO… ${Math.round(prog * 100)}%` : "PUBLICADA ✓", tx, y0 + 232);
    // canales
    ["Instagram", "X", "Facebook", "LinkedIn"].forEach((ch, i) => {
      const done = prog > (i + 1) / 4.4;
      const yy = y0 + 290 + i * 44;
      g.strokeStyle = "rgba(16,18,22,0.12)";
      g.beginPath(); g.moveTo(tx, yy + 14); g.lineTo(tx + tw2, yy + 14); g.stroke();
      g.fillStyle = "#101216";
      g.font = `400 18px ${FONT_SANS}`;
      g.fillText(ch, tx, yy);
      g.fillStyle = done ? "#a8885a" : "rgba(16,18,22,0.25)";
      g.font = `500 13px ${FONT_MONO}`;
      g.textAlign = "right";
      g.fillText(done ? "EN LÍNEA ●" : "EN COLA ○", tx + tw2, yy);
      g.textAlign = "left";
    });
  } else if (mode === "studio") {
    g.fillStyle = "#101216";
    g.fillRect(x0, y0, w, h);
    g.fillStyle = "#c9ab7c";
    g.font = `500 14px ${FONT_MONO}`;
    g.fillText("IA · PROMPT STUDIO", x0 + 50, y0 + 70);
    g.fillStyle = "rgba(201,171,124,0.3)";
    g.fillRect(x0 + 50, y0 + 88, w - 100, 1);
    g.fillStyle = "#eae6de";
    g.font = `italic 400 44px ${FONT_DISPLAY}`;
    const end = wrapText(g, typed(t, 6), x0 + 50, y0 + 160, w - 100, 56);
    if (Math.floor(t * 2.5) % 2 === 0) { g.fillStyle = "#c9ab7c"; g.fillRect(end.x + 6, end.y - 34, 4, 42); }
    g.fillStyle = "#737983";
    g.font = `400 13px ${FONT_MONO}`;
    g.fillText("LA IA ACELERA · EL CRITERIO FIRMA", x0 + 50, y0 + h - 50);
  } else if (mode === "contact") {
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
    g.textAlign = "left";
  }
  g.restore();
  // notch con cámara
  g.fillStyle = "#050506";
  roundRect(g, SW / 2 - 62, -12, 124, 34, 12);
  g.fill();
  g.fillStyle = "#1d2230";
  g.beginPath(); g.arc(SW / 2, 10, 4.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(120,140,190,0.6)";
  g.beginPath(); g.arc(SW / 2 - 1.2, 8.8, 1.4, 0, Math.PI * 2); g.fill();
}

/* --- Cubierta: aluminio cepillado, hueco del teclado, altavoces, trackpad --- */
// Zonas en unidades locales (x: -W/2..W/2, y: -D/2..D/2; +y = hacia la bisagra)
const KB = { cx: 0, cy: D * 0.165, w: W * 0.79, h: D * 0.42 };
const TP = { cx: 0, cy: -D * 0.275, w: W * 0.4, h: D * 0.3 };
const SPK = { x: W * 0.445, cy: KB.cy, w: W * 0.055, h: KB.h };

function makeDeckTexture() {
  const KW = 2048, KH = Math.round(2048 * (D / W));
  const c = document.createElement("canvas");
  c.width = KW; c.height = KH;
  const g = c.getContext("2d");
  const px = (x) => (x / W + 0.5) * KW;
  const py = (y) => (0.5 - y / D) * KH;
  const sx = (w) => (w / W) * KW;
  const sy = (h) => (h / D) * KH;

  // aluminio anodizado con cepillado fino
  const grd = g.createLinearGradient(0, 0, KW, KH);
  grd.addColorStop(0, "#e3d8c6");
  grd.addColorStop(0.5, "#d8cab4");
  grd.addColorStop(1, "#cfc0a8");
  g.fillStyle = grd;
  g.fillRect(0, 0, KW, KH);
  for (let i = 0; i < 1400; i++) {
    const y = Math.random() * KH;
    g.strokeStyle = Math.random() < 0.5 ? `rgba(255,255,255,${Math.random() * 0.06})` : `rgba(90,70,40,${Math.random() * 0.04})`;
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, y); g.lineTo(KW, y + (Math.random() - 0.5) * 2); g.stroke();
  }

  // hueco del teclado
  const kx = px(KB.cx - KB.w / 2), ky = py(KB.cy + KB.h / 2), kw = sx(KB.w), kh = sy(KB.h);
  g.fillStyle = "rgba(40,34,26,0.85)";
  roundRect(g, kx - 10, ky - 10, kw + 20, kh + 20, 18);
  g.fill();
  const inner = g.createLinearGradient(0, ky, 0, ky + kh);
  inner.addColorStop(0, "rgba(0,0,0,0.35)");
  inner.addColorStop(0.08, "rgba(0,0,0,0)");
  g.fillStyle = inner;
  g.fillRect(kx - 10, ky - 10, kw + 20, kh + 20);

  // rejillas de altavoz perforadas
  [-1, 1].forEach((side) => {
    const gx = px(side * SPK.x - SPK.w / 2), gy = py(SPK.cy + SPK.h / 2), gw = sx(SPK.w), gh = sy(SPK.h);
    g.fillStyle = "rgba(50,40,28,0.55)";
    let row = 0;
    for (let yy = gy + 6; yy < gy + gh - 4; yy += 11, row++) {
      for (let xx = gx + 6; xx < gx + gw - 8; xx += 11) {
        g.beginPath(); g.arc(xx + (row % 2 ? 5 : 0), yy, 2.4, 0, Math.PI * 2); g.fill();
      }
    }
  });

  // contorno del trackpad
  const tx = px(TP.cx - TP.w / 2), ty = py(TP.cy + TP.h / 2), tw = sx(TP.w), th = sy(TP.h);
  g.strokeStyle = "rgba(255,255,255,0.55)";
  g.lineWidth = 3;
  roundRect(g, tx - 3, ty - 3, tw + 6, th + 6, 26);
  g.stroke();
  g.strokeStyle = "rgba(90,70,40,0.25)";
  g.lineWidth = 2;
  roundRect(g, tx - 6, ty - 6, tw + 12, th + 12, 28);
  g.stroke();

  // muesca frontal para abrir la tapa
  const notch = g.createRadialGradient(KW / 2, KH, 0, KW / 2, KH, 150);
  notch.addColorStop(0, "rgba(70,55,35,0.45)");
  notch.addColorStop(1, "rgba(70,55,35,0)");
  g.fillStyle = notch;
  g.beginPath(); g.ellipse(KW / 2, KH, 150, 38, 0, Math.PI, 0); g.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function rrShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function makeLogoTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.strokeStyle = "#fff";
  g.lineWidth = 6;
  g.beginPath(); g.arc(128, 128, 110, 0, Math.PI * 2); g.stroke();
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `400 112px ${FONT_DISPLAY}`;
  g.fillText("AB", 128, 136);
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
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile() ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 13, 32);

  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 80);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();

  /* ---------- Luz de estudio ---------- */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8dce1, 1.2));
  const key = new THREE.DirectionalLight(0xfff5e6, 1.5);
  key.position.set(4, 9, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 });
  key.shadow.bias = -0.0004;
  key.shadow.radius = 5;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe9efff, 0.55);
  fill.position.set(-5, 2, 4);
  scene.add(fill);

  // Suelo invisible que solo recibe sombras: se funde con el fondo
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ color: 0x1d2026, opacity: 0.1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const radial = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(30,32,38,0.32)");
    grd.addColorStop(1, "rgba(30,32,38,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 3.4),
    new THREE.MeshBasicMaterial({ map: radial, transparent: true, depthWrite: false })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, 0.002, -0.2);
  scene.add(contactShadow);

  /* ---------- Portátil (modelo refinado) ---------- */
  const alu = new THREE.MeshPhysicalMaterial({
    color: 0xd9ccb6, metalness: 0.78, roughness: 0.34, clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 1.15
  });
  const laptop = new THREE.Group();
  scene.add(laptop);

  // base fina con esquinas suaves
  const base = new THREE.Mesh(new RoundedBoxGeometry(W, T, D, 6, 0.03), alu);
  base.position.y = T / 2;
  base.castShadow = true;
  laptop.add(base);

  const deckTex = makeDeckTexture();
  deckTex.anisotropy = maxAniso;
  const deckGeo = new THREE.ShapeGeometry(rrShape(W - 0.03, D - 0.03, 0.05), 8);
  {
    const uv = deckGeo.attributes.uv, pos = deckGeo.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / W + 0.5, pos.getY(i) / D + 0.5);
  }
  const deck = new THREE.Mesh(
    deckGeo,
    new THREE.MeshPhysicalMaterial({ map: deckTex, metalness: 0.6, roughness: 0.38, clearcoat: 0.2, envMapIntensity: 1 })
  );
  deck.rotation.x = -Math.PI / 2;
  deck.position.y = T + 0.0006;
  deck.receiveShadow = true;
  laptop.add(deck);

  // filo pulido (diamond-cut) alrededor de la cubierta
  const edgePts = rrShape(W - 0.012, D - 0.012, 0.035).getPoints(24).map((p) => new THREE.Vector3(p.x, T + 0.0008, -p.y));
  laptop.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(edgePts), new THREE.LineBasicMaterial({ color: 0xfff6e8 })));

  // teclas 3D
  const keyMat = new THREE.MeshStandardMaterial({ color: 0x1b1c20, roughness: 0.55, metalness: 0.15 });
  const rowsDef = [
    { units: Array(14).fill(1), h: 0.6 },
    { units: [...Array(13).fill(1), 1.55], h: 1 },
    { units: [1.55, ...Array(13).fill(1)], h: 1 },
    { units: [1.85, ...Array(11).fill(1), 1.85], h: 1 },
    { units: [2.35, ...Array(10).fill(1), 2.35], h: 1 },
    { units: [1, 1, 1, 1.3, 5.6, 1.3, 1, 1, 1], h: 1 }
  ];
  const keyGap = 0.012, kbMargin = 0.03;
  const kbW = KB.w - kbMargin * 2, kbH = KB.h - kbMargin * 2;
  const unitH = (kbH - keyGap * (rowsDef.length - 1)) / rowsDef.reduce((acc, r) => acc + r.h, 0);
  const keyCount = rowsDef.reduce((acc, r) => acc + r.units.length, 0);
  const keys = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 2, 0.18), keyMat, keyCount);
  keys.castShadow = true;
  const km = new THREE.Matrix4();
  let ki = 0;
  let rowTop = KB.cy + KB.h / 2 - kbMargin;
  rowsDef.forEach((row) => {
    const rh = unitH * row.h;
    const totalU = row.units.reduce((acc, u) => acc + u, 0);
    const unitW = (kbW - keyGap * (row.units.length - 1)) / totalU;
    let x = KB.cx - kbW / 2;
    row.units.forEach((u) => {
      const kw = unitW * u;
      km.compose(
        new THREE.Vector3(x + kw / 2, T + 0.0045, -(rowTop - rh / 2)),
        new THREE.Quaternion(),
        new THREE.Vector3(kw - 0.004, 0.009, rh - 0.004)
      );
      keys.setMatrixAt(ki++, km);
      x += kw + keyGap;
    });
    rowTop -= rh + keyGap;
  });
  laptop.add(keys);

  // trackpad de cristal
  const trackpad = new THREE.Mesh(
    new THREE.ShapeGeometry(rrShape(TP.w, TP.h, 0.035), 8),
    new THREE.MeshPhysicalMaterial({ color: 0xcdbfa8, metalness: 0.35, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 0.55 })
  );
  trackpad.rotation.x = -Math.PI / 2;
  trackpad.position.set(TP.cx, T + 0.0012, -TP.cy);
  laptop.add(trackpad);

  // puertos laterales
  const portMat = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.6 });
  [[-W / 2, -0.45, 0.075], [-W / 2, -0.25, 0.075], [W / 2, 0.55, 0.035]].forEach(([x, z, len]) => {
    const port = new THREE.Mesh(new RoundedBoxGeometry(0.01, 0.022, len, 2, 0.004), portMat);
    port.position.set(x, T * 0.5, z);
    laptop.add(port);
  });

  // bisagra
  const hinge = new THREE.Mesh(
    new THREE.CylinderGeometry(LT * 0.55, LT * 0.55, W - 0.7, 32),
    new THREE.MeshStandardMaterial({ color: 0x2a2b30, metalness: 0.6, roughness: 0.35 })
  );
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, T + LT * 0.2, -D / 2 + LT * 0.55);
  laptop.add(hinge);

  // tapa
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, T + LT / 2, -D / 2 + LT / 2);
  laptop.add(lidPivot);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(W, LH, LT, 6, 0.016), alu);
  lid.position.y = LH / 2;
  lid.castShadow = true;
  lidPivot.add(lid);

  // cristal negro de borde a borde
  const bezel = new THREE.Mesh(
    new THREE.ShapeGeometry(rrShape(W - 0.018, LH - 0.018, 0.05), 10),
    new THREE.MeshPhysicalMaterial({ color: 0x07080a, metalness: 0, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4 })
  );
  bezel.position.set(0, LH / 2, LT / 2 + 0.0008);
  lidPivot.add(bezel);
  const lidEdgePts = rrShape(W - 0.006, LH - 0.006, 0.02).getPoints(24).map((p) => new THREE.Vector3(p.x, p.y + LH / 2, LT / 2 + 0.0004));
  lidPivot.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(lidEdgePts), new THREE.LineBasicMaterial({ color: 0xf6ecdc })));

  // logo grabado en la parte trasera
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.34),
    new THREE.MeshStandardMaterial({ color: 0xfff3dd, map: makeLogoTexture(), transparent: true, alphaTest: 0.4, metalness: 1, roughness: 0.12 })
  );
  logo.position.set(0, LH / 2, -LT / 2 - 0.0012);
  logo.rotation.y = Math.PI;
  lidPivot.add(logo);

  const screenRoot = new THREE.Group();
  screenRoot.position.set(0, LH / 2, LT / 2 + 0.0018);
  lidPivot.add(screenRoot);

  const scrCanvas = document.createElement("canvas");
  scrCanvas.width = SW; scrCanvas.height = SH;
  const sg = scrCanvas.getContext("2d");
  const scrTex = new THREE.CanvasTexture(scrCanvas);
  scrTex.colorSpace = THREE.SRGBColorSpace;
  scrTex.anisotropy = maxAniso;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCR_W, SCR_H), new THREE.MeshBasicMaterial({ map: scrTex }));
  screenRoot.add(screen);

  // reflejo del cristal (cambia con el ángulo de visión)
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.02, LH - 0.02),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.08, envMapIntensity: 2, depthWrite: false })
  );
  glass.position.set(0, LH / 2, LT / 2 + 0.0035);
  glass.renderOrder = 2;
  lidPivot.add(glass);

  /* ---------- Capas del panel (vista desplegada) ---------- */
  const R = dashRects();
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xa8885a, transparent: true, opacity: 0 });
  const layers = LAYERS.map((name) => {
    const [x, y, w, h] = R[name];
    const c = document.createElement("canvas");
    c.width = Math.round(w); c.height = Math.round(h);
    const g = c.getContext("2d");
    drawLayer(name, g, c.width, c.height, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    const pw = (w / SW) * SCR_W, ph = (h / SH) * SCR_H;
    const geo = new THREE.PlaneGeometry(pw, ph);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
    mesh.add(edges);
    const rest = new THREE.Vector2(((x + w / 2) / SW - 0.5) * SCR_W, (0.5 - (y + h / 2) / SH) * SCR_H);
    screenRoot.add(mesh);
    return { name, mesh, g, c, tex, rest, depth: LAYER_DEPTH[name], animated: ["header", "chart", "ai"].includes(name) };
  });

  /* ---------- Piezas publicitarias ---------- */
  const PW = 768, PH = 1024;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xd2bb95, metalness: 0.85, roughness: 0.3 });
  const posters = POSTERS.map((p, k) => {
    const c = document.createElement("canvas");
    c.width = PW; c.height = PH;
    const g = c.getContext("2d");
    drawPoster(g, PW, PH, p, k, null);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    if (p.image) {
      const img = new Image();
      img.onload = () => { drawPoster(g, PW, PH, p, k, img); tex.needsUpdate = true; };
      img.src = p.image;
    }
    const group = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.56, 2.06, 0.03), frameMat);
    frame.castShadow = true;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.0), new THREE.MeshBasicMaterial({ map: tex }));
    plane.position.z = 0.017;
    group.add(frame, plane);
    group.visible = false;
    scene.add(group);
    return { group, canvas: c };
  });

  /* ---------- Haz de proyección pantalla → pieza ---------- */
  const beamGeo = new THREE.BufferGeometry();
  beamGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(24 * 3), 3));
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xc9ab7c, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.frustumCulled = false;
  scene.add(beam);
  const beamLineGeo = new THREE.BufferGeometry();
  beamLineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(8 * 3), 3));
  const beamLineMat = new THREE.LineBasicMaterial({ color: 0xa8885a, transparent: true, opacity: 0 });
  const beamLines = new THREE.LineSegments(beamLineGeo, beamLineMat);
  beamLines.frustumCulled = false;
  scene.add(beamLines);

  const SC = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const sCorners = SC.map(() => new THREE.Vector3());
  const pCorners = SC.map(() => new THREE.Vector3());
  function updateBeam(poster, w) {
    beamMat.opacity = 0.07 * w;
    beamLineMat.opacity = 0.55 * w;
    beam.visible = beamLines.visible = w > 0.01;
    if (!beam.visible) return;
    SC.forEach(([sx, sy], i) => {
      sCorners[i].set(sx * SCR_W * 0.45, sy * SCR_H * 0.44, 0.01);
      screenRoot.localToWorld(sCorners[i]);
      pCorners[i].set(sx * 0.75, sy * 1.0, 0.02);
      poster.localToWorld(pCorners[i]);
    });
    const pos = beamGeo.attributes.position.array;
    let o = 0;
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      for (const v of [sCorners[i], sCorners[j], pCorners[j], sCorners[i], pCorners[j], pCorners[i]]) {
        pos[o++] = v.x; pos[o++] = v.y; pos[o++] = v.z;
      }
    }
    beamGeo.attributes.position.needsUpdate = true;
    const lp = beamLineGeo.attributes.position.array;
    o = 0;
    for (let i = 0; i < 4; i++) {
      for (const v of [sCorners[i], pCorners[i]]) { lp[o++] = v.x; lp[o++] = v.y; lp[o++] = v.z; }
    }
    beamLineGeo.attributes.position.needsUpdate = true;
  }

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
        return i + THREE.MathUtils.smoothstep(f, 0.35, 1.0);
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
  let lastDraw = -1;
  let lastFade = -1;
  let screenKey = "";
  let publishSince = 0;

  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    if (visible) clock.getDelta();
  });

  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), vB = new THREE.Vector3();
  const S = new THREE.Vector3(), qS = new THREE.Quaternion(), nS = new THREE.Vector3();
  const P1 = new THREE.Vector3(), P2 = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  const qOut = new THREE.Quaternion(), qRing = new THREE.Quaternion();
  const dummy = new THREE.Object3D();
  const slot0 = new THREE.Vector3(CAR_R * Math.sin(THETA0), CAR_Y, CAR_Z + CAR_R * Math.cos(THETA0));

  const lerpKey = (a, b, f, prop, out) => out.fromArray(KEYS[a][prop]).lerp(vB.fromArray(KEYS[b][prop]), f);
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const ease = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
  const slot = (theta, out, r = CAR_R, y = CAR_Y) => out.set(r * Math.sin(theta), y, CAR_Z + r * Math.cos(theta));
  const tmp3 = new THREE.Vector3();
  const faceDir = (pos, dir, out) => { dummy.position.copy(pos); dummy.lookAt(tmp3.copy(pos).add(dir)); out.copy(dummy.quaternion); };

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

    const fade = THREE.MathUtils.lerp(KEYS[a].fade, KEYS[b].fade, f);
    if (Math.abs(fade - lastFade) > 0.004) { canvas.style.opacity = fade.toFixed(3); lastFade = fade; }

    /* --- Cámara --- */
    lerpKey(a, b, f, "cam", camPos);
    lerpKey(a, b, f, "look", camLook);
    if (isMobile()) {
      camLook.x *= 0.12;
      camPos.x *= 0.8;
      camPos.z = camPos.z * 1.5 + 0.5;
      camLook.y -= 0.35;
      const wp = clamp01(progress - 1.3) * (1 - clamp01(progress - (ROOM_LAB - 0.6)));
      camLook.lerp(slot0, wp);
      camPos.lerp(tmp.set(slot0.x + Math.sin(THETA0) * 5.2, slot0.y + 0.4, slot0.z + Math.cos(THETA0) * 5.2), wp);
    }
    mouseS.lerp(mouse, Math.min(1, dt * 2.5));
    camPos.x += mouseS.x * 0.25;
    camPos.y -= mouseS.y * 0.15;
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    /* --- 00: el portátil se abre --- */
    const intro = reduceMotion ? 1 : ease((t - 0.9) / 2.2);
    lidPivot.rotation.x = THREE.MathUtils.lerp(CLOSED, OPEN, intro);
    const sway = 1 - 0.75 * clamp01(progress);
    laptop.rotation.y = ((Math.sin(tm * 0.3) * 0.12 + mouseS.x * 0.15) * sway) - (1 - intro) * 0.5;

    /* --- 01: la pantalla se despliega en capas --- */
    const ex = ease(progress) * (1 - ease((progress - 1) / 0.5));
    const layerAlpha = 1 - ease((progress - 1.5) / 0.2);
    edgeMat.opacity = 0.8 * ex;
    layers.forEach((L) => {
      const d = L.depth;
      L.mesh.position.set(L.rest.x * (1 + ex * 0.16), L.rest.y * (1 + ex * 0.16), 0.003 + d * 0.0006 + ex * (0.16 + d * 0.17));
      L.mesh.material.opacity = layerAlpha;
      L.mesh.visible = layerAlpha > 0.01;
    });

    /* --- Modo de la pantalla --- */
    let mode = "dash";
    let kActive = 0;
    if (progress >= ROOM_LAB + 0.7) mode = "contact";
    else if (progress >= ROOM_LAB - 0.4) mode = "studio";
    else if (progress >= 1.6) { mode = "publish"; kActive = Math.min(NP - 1, Math.max(0, Math.floor(progress - 1.6))); }
    const sKey = mode + kActive;
    if (sKey !== screenKey) { screenKey = sKey; publishSince = t; lastDraw = -1; }
    if (t - lastDraw > 1 / 15) {
      drawScreenBase(sg, mode, t, { k: kActive, posterCanvas: posters[kActive].canvas, since: publishSince });
      scrTex.needsUpdate = true;
      if (layerAlpha > 0.01) {
        layers.forEach((L) => {
          if (!L.animated) return;
          drawLayer(L.name, L.g, L.c.width, L.c.height, t);
          L.tex.needsUpdate = true;
        });
      }
      lastDraw = t;
    }

    /* --- 02–09: campañas proyectadas, carrusel, anillo y regreso --- */
    laptop.updateMatrixWorld(true);
    screenRoot.getWorldPosition(S);
    screenRoot.getWorldQuaternion(qS);
    nS.set(0, 0, 1).applyQuaternion(qS);
    const wc = ease((progress - (ROOM_LAB + 0.3)) / 0.5);

    let beamPoster = null, beamW = 0;
    posters.forEach(({ group }, k) => {
      const s = progress - (1.6 + k);
      const em = ease(s / 0.4);
      // se cuelga en el muro cuando sale la siguiente campaña (la última, al entrar en IA)
      const mv = k < NP - 1 ? ease((s - 1) / 0.4) : ease((progress - (ROOM_LAB - 0.5)) / 0.5);

      // 1) sale de la pantalla hacia el primer plano
      slot(THETA0, P2);
      P1.copy(S).addScaledVector(nS, 1.5).add(tmp.set(0.3, 0.3, 0));
      const u = em, iu = 1 - u;
      group.position.set(
        iu * iu * S.x + 2 * iu * u * P1.x + u * u * P2.x,
        iu * iu * S.y + 2 * iu * u * P1.y + u * u * P2.y,
        iu * iu * S.z + 2 * iu * u * P1.z + u * u * P2.z
      );
      faceDir(P2, tmp.set(Math.sin(THETA0), 0, Math.cos(THETA0) + 0.9).normalize(), qOut);
      group.quaternion.copy(qS).slerp(qOut, em);

      // 2) pasa al muro de campañas publicadas
      const tw = (k - (NP - 1) / 2) * WALL_STEP;
      tmp.set(WALL_R * Math.sin(tw), WALL_Y, WALL_CZ - WALL_R * Math.cos(tw));
      group.position.lerp(tmp, mv);
      faceDir(tmp, tmp2.set(-Math.sin(tw), 0, Math.cos(tw)), qRing);
      group.quaternion.slerp(qRing, mv);

      // 3) contacto: todas vuelven a la pantalla
      group.position.lerp(S, wc);
      group.quaternion.slerp(qS, wc);
      group.position.y += Math.sin(tm * 0.7 + k) * 0.03 * em * (1 - wc);

      const sc = (0.18 + 0.82 * em) * THREE.MathUtils.lerp(1, WALL_SCALE, mv) * (1 - 0.82 * wc);
      group.scale.setScalar(Math.max(0.001, sc));
      group.visible = em > 0.002 && wc < 0.995;

      const w = em * (1 - mv) * (1 - wc);
      if (w > beamW) { beamW = w; beamPoster = group; }
    });
    if (beamPoster) { beamPoster.updateMatrixWorld(true); updateBeam(beamPoster, beamW); }
    else updateBeam(null, 0);

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
