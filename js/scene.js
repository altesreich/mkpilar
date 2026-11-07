/* ==========================================================
   Adriana Bello · portafolio profesional · escena 3D
   00 El portátil se abre y se enciende
   01 Perfil: la pantalla se despliega en capas
   02–06 Experiencia: cada puesto tiene su ficha 3D. Las fichas
         forman una columna que se desplaza con el scroll (la
         activa al frente, la siguiente asoma abajo, la anterior
         sale por arriba): nunca se montan unas sobre otras.
   07 Proyectos · 08 Contacto
   Three.js r160 · sin build, servido por import map
   ========================================================== */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";

const ready = () => window.dispatchEvent(new Event("scene-ready"));
const canvas = document.getElementById("scene");
const mqMobile = window.matchMedia("(max-width: 760px)");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const BG = 0xf6f5f2;
// Paleta de la marca personal (la misma del CV): verde petróleo, terracota, blanco roto
const INK = "#14201f", PAPER = "#fbfaf8", ACCENT = "#2b5d57", ACCENT_L = "#9cc3bc", TERRA = "#c0654a", MUTED = "#7b8483";
const FONT_DISPLAY = '"Bodoni Moda", Didot, Georgia, serif';
const FONT_SANS = '"Inter Tight", system-ui, sans-serif';
const FONT_MONO = '"JetBrains Mono", Consolas, monospace';

// Estado compartido entre el portátil 3D y lo que dibuja su pantalla
const FX = {
  cmd: "",          // texto que el portátil está tecleando (clic del usuario)
  cmdUntil: 0,      // hasta cuándo se muestra
  cursor: null,     // { u, v, a }: brillo del ratón sobre la pantalla
  cam: 0            // piloto verde de la cámara (0..1)
};
const cmdActive = (t) => FX.cmd && t < FX.cmdUntil;

/* ==========================================================
   FICHAS DE EXPERIENCIA (una por puesto, mismo orden que el HTML)
   El texto sale del CV: si cambias un puesto, cámbialo también aquí.
   Para usar una imagen real de fondo: ponla en assets/ads/ y
   escribe su ruta en `image`, por ejemplo "assets/ads/jd.jpg".
   ========================================================== */
const POSTERS = [
  {
    company: "JD Sports Fashion", years: "2023 — 2025", place: "Londres · remoto",
    category: "Comunicación interna · Cultura",
    headline: "Una marca, el mismo relato dentro y fuera.",
    role: "Estratega de Comunicación Corporativa y Cultura",
    tags: ["Campañas internas", "Employer branding", "Imagen corporativa"],
    motif: "arches", theme: "dark", image: null
  },
  {
    company: "Senado de Colombia", years: "2022 — 2023", place: "Colombia",
    category: "Campañas políticas · Redes sociales",
    headline: "Cien mil voces, un solo tono.",
    metric: { value: "+100.000", label: "seguidores en 4 redes" },
    role: "Community Manager y Estratega de Comunicación",
    tags: ["Imagen pública", "Crisis en directo", "Informes de KPIs"],
    motif: "rings", theme: "light", image: null
  },
  {
    company: "Salud Total EPS", years: "2020 — 2022", place: "Ibagué, Colombia",
    category: "Comunicación interna",
    headline: "Comunicar hacia dentro, con claridad.",
    role: "Soporte de RR. HH. y Operaciones",
    tags: ["Comunicación interna", "Onboarding", "Salud"],
    motif: "lines", theme: "dark", image: null
  },
  {
    company: "Flash Noticias", years: "2020 — 2021", place: "Ibagué, Colombia",
    category: "Redes sociales · Comunidad",
    headline: "La comunidad, primero.",
    role: "Estrategia de Comunicación y Contenidos",
    tags: ["Contenidos", "Concienciación", "Alianzas ONG"],
    motif: "circles", theme: "light", image: null
  },
  {
    company: "El Transportador", years: "2018 — 2020", place: "Bogotá, Colombia",
    category: "Relaciones institucionales · Eventos",
    headline: "Una marca que habla dos idiomas.",
    role: "Asistente de Comunicación y Relaciones Institucionales",
    tags: ["Comunicación bilingüe", "Eventos de marca", "Campañas impresas"],
    motif: "diagonal", theme: "dark", image: null
  }
];
// dos temas alternos, misma tipografía y retícula: la serie se lee como un conjunto
const THEMES = {
  dark: { bg: ACCENT, fg: PAPER, soft: ACCENT_L, accent: "#e7a68f" },
  light: { bg: PAPER, fg: INK, soft: MUTED, accent: TERRA }
};

// "#rrggbb" + alfa → rgba()
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
const NP = POSTERS.length;

/* ---------- Cámara por sección ---------- */
const KEYS = [
  { cam: [0, 2.3, 7.4], look: [-1.45, -0.15, 0], fade: 1 },     // 00 inicio
  { cam: [3.2, 2.7, 5.9], look: [-1.0, 1.0, 0.1], fade: 1 },    // 01 perfil (capas, en diagonal)
];
for (let k = 0; k < NP; k++) {
  KEYS.push({ cam: [-0.9, 2.1, 8.2], look: [0.0, 1.15, 0.5], fade: 1 }); // 02–06 experiencia (cámara fija: se mueven las fichas)
}
KEYS.push({ cam: [0, 3.6, 10.4], look: [0, 1.7, -1.0], fade: 0.4 });   // 07 proyectos
KEYS.push({ cam: [0, 2.0, 7.4], look: [1.45, 0.55, 0], fade: 1 });     // 08 contacto
const ROOM_FIRST_PIECE = 2;
const ROOM_LAB = 2 + NP;
const ROOM_CONTACT = ROOM_LAB + 1;

/* ---------- Portátil ---------- */
const W = 3.0, D = 2.05, T = 0.072, LH = 1.95, LT = 0.034;
const OPEN = -0.3, CLOSED = Math.PI / 2 - 0.02;
const SCR_W = W - 0.08, SCR_H = LH - 0.1;

/* ---------- Columna de fichas ---------- */
const CAR_R = 3.3, CAR_Y = 1.35, CAR_Z = -0.4, THETA0 = 0.95;
// las fichas giran sobre un cilindro horizontal invisible: radio y ángulo entre fichas
const RAIL_R = 6.2, RAIL_STEP = 0.46;
// posición y orientación de la ficha activa: casi de frente a la cámara
const CARD_POS = new THREE.Vector3(2.38, 1.3, 1.7);
const CARD_DIR = new THREE.Vector3(-0.28, 0.05, 1).normalize();

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

// lo que el portátil escribe solo (tareas reales de su día a día)
const PROMPT_LOOP = [
  "Plan de contenidos del mes con tono propio por red…",
  "Comunicado interno para presentar la nueva campaña…",
  "Respuesta de crisis: clara, empática y con datos…",
  "Informe de KPIs: alcance, engagement y crecimiento…"
];
// lo que escribe en la sección de proyectos
const PROJECT_LOOP = [
  "Campañas políticas: +100.000 seguidores en 4 redes…",
  "Lanzamiento de una empresa: mensajes y primeras piezas…",
  "Redes sociales con foco en la comunidad…",
  "Comunicación asertiva e interna para una marca global…"
];

function typed(t, period, list = PROMPT_LOOP) {
  const idx = Math.floor(t / period) % list.length;
  const full = list[idx];
  return full.slice(0, Math.floor(((t % period) / (period * 0.65)) * full.length));
}

// Dibuja una capa del panel en su propio canvas (origen 0,0)
function drawLayer(name, g, w, h, t) {
  g.clearRect(0, 0, w, h);
  if (name === "sidebar") {
    g.fillStyle = INK; g.fillRect(0, 0, w, h);
    g.fillStyle = ACCENT; g.fillRect(20, 20, 34, 34);
    g.fillStyle = PAPER; g.font = `500 16px ${FONT_DISPLAY}`; g.fillText("AB", 25, 43);
    ["Experiencia", "Proyectos", "Contenidos", "KPIs", "Interna", "Prensa"].forEach((it, i) => {
      const yy = 92 + i * 34;
      if (i === 0) { g.fillStyle = "rgba(156,195,188,0.16)"; g.fillRect(10, yy - 20, w - 20, 30); }
      g.fillStyle = i === 0 ? PAPER : "#8f9a98";
      g.font = `400 13px ${FONT_SANS}`;
      g.fillText(it, 22, yy);
    });
  } else if (name === "header") {
    g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
    g.fillStyle = "#101216"; g.font = `italic 400 30px ${FONT_DISPLAY}`; g.fillText("Adriana Bello", 0, 32);
    g.fillStyle = "#737983"; g.font = `400 12px ${FONT_MONO}`; g.fillText("COMUNICACIÓN CORPORATIVA · INTERNA · MARKETING", 0, 54);
    const live = 0.5 + 0.5 * Math.sin(t * 3);
    g.fillStyle = `rgba(43,93,87,${0.45 + live * 0.55})`; g.beginPath(); g.arc(w - 112, 24, 4.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#101216"; g.fillText("DISPONIBLE", w - 100, 28);
  } else if (name.startsWith("kpi")) {
    const i = +name[3];
    const [label, val] = [["SEGUIDORES", "100K+"], ["EXPERIENCIA", "7 años"], ["ORGANIZACIONES", "5"], ["REDES", "4"]][i];
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(16,18,22,0.12)"; g.strokeRect(0.5, 0.5, w - 1, h - 1);
    g.fillStyle = "#737983"; g.font = `400 10.5px ${FONT_MONO}`; g.fillText(label, 14, 24);
    g.fillStyle = "#101216"; g.font = `400 34px ${FONT_DISPLAY}`; g.fillText(val, 14, 66);
    g.fillStyle = ACCENT; g.fillRect(0, h - 3, w * (0.35 + 0.15 * i), 3);
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
    plot(10, 0, "rgba(16,18,22,0.35)", 1.5);
    plot(8, 2, ACCENT, 2.5);
  } else if (name === "ai") {
    g.fillStyle = INK; g.fillRect(0, 0, w, h);
    g.fillStyle = ACCENT_L; g.font = `400 10.5px ${FONT_MONO}`; g.fillText("BORRADOR", 14, 24);
    g.fillStyle = "#d8dbe0"; g.font = `400 13px ${FONT_MONO}`;
    const end = wrapText(g, cmdActive(t) ? FX.cmd : typed(t, 5), 14, 54, w - 28, 20);
    if (Math.floor(t * 2.5) % 2 === 0) { g.fillStyle = ACCENT_L; g.fillRect(end.x + 2, end.y - 12, 7, 15); }
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
  g.fillStyle = PAPER;
  g.fillRect(x0, y0, w, h);

  if (mode === "dash") {
    // huecos de las capas (visibles cuando se despliegan)
    const R = dashRects();
    g.strokeStyle = "rgba(16,18,22,0.14)";
    g.setLineDash([5, 5]);
    LAYERS.forEach((n) => { const [x, y, ww, hh] = R[n]; g.strokeRect(x + 0.5, y + 0.5, ww - 1, hh - 1); });
    g.setLineDash([]);
  } else if (mode === "case") {
    const { k } = info;
    const p = POSTERS[k];
    const th = THEMES.dark; // banda siempre en verde petróleo: todas las pantallas comparten color
    // banda lateral de color
    g.fillStyle = th.bg;
    g.fillRect(x0, y0, 250, h);
    g.fillStyle = th.fg;
    g.font = `400 120px ${FONT_DISPLAY}`;
    g.fillText(String(k + 1).padStart(2, "0"), x0 + 36, y0 + 150);
    g.font = `500 12px ${FONT_SANS}`;
    g.fillText("EXPERIENCIA", x0 + 40, y0 + 186);
    // progreso: en qué experiencia estamos
    for (let i = 0; i < NP; i++) {
      g.fillStyle = i === k ? th.fg : rgba(th.fg, 0.3);
      g.fillRect(x0 + 40 + i * 30, y0 + h - 60, 22, i === k ? 4 : 2);
    }
    const tx = x0 + 300, tw2 = x0 + w - 50 - tx;
    g.fillStyle = TERRA;
    g.font = `500 14px ${FONT_SANS}`;
    g.fillText(p.category.toUpperCase(), tx, y0 + 80);
    g.fillStyle = INK;
    g.font = `400 52px ${FONT_DISPLAY}`;
    g.fillText(p.company, tx, y0 + 146);
    g.fillStyle = "#4a5453";
    g.font = `400 21px ${FONT_SANS}`;
    const rl = wrapLines(g, p.role, tw2);
    rl.forEach((ln, i) => g.fillText(ln, tx, y0 + 190 + i * 30));
    const yMeta = y0 + 190 + rl.length * 30 + 14;
    g.fillStyle = MUTED;
    g.font = `500 14px ${FONT_SANS}`;
    g.fillText(p.years + "  ·  " + p.place, tx, yMeta);
    g.fillStyle = "rgba(20,32,31,0.12)";
    g.fillRect(tx, yMeta + 30, tw2, 1);
    // áreas, apareciendo una a una tras cada cambio
    p.tags.forEach((tag, i) => {
      const a = Math.min(1, Math.max(0, (t - info.since - 0.25 - i * 0.18) / 0.35));
      const yy = yMeta + 84 + i * 46;
      g.fillStyle = rgba(ACCENT, a);
      g.beginPath(); g.arc(tx + 7, yy - 7, 5, 0, Math.PI * 2); g.fill();
      g.fillStyle = rgba(INK, a);
      g.font = `400 22px ${FONT_SANS}`;
      g.fillText(tag, tx + 28 + (1 - a) * 12, yy);
    });
  } else if (mode === "studio") {
    g.fillStyle = ACCENT;
    g.fillRect(x0, y0, w, h);
    g.fillStyle = ACCENT_L;
    g.font = `500 14px ${FONT_MONO}`;
    g.fillText("PROYECTOS DESTACADOS", x0 + 50, y0 + 70);
    g.fillStyle = "rgba(251,250,248,0.3)";
    g.fillRect(x0 + 50, y0 + 88, w - 100, 1);
    g.fillStyle = PAPER;
    g.font = `italic 400 44px ${FONT_DISPLAY}`;
    const end = wrapText(g, cmdActive(t) ? FX.cmd : typed(t, 6, PROJECT_LOOP), x0 + 50, y0 + 160, w - 100, 56);
    if (Math.floor(t * 2.5) % 2 === 0) { g.fillStyle = ACCENT_L; g.fillRect(end.x + 6, end.y - 34, 4, 42); }
    g.fillStyle = ACCENT_L;
    g.font = `400 13px ${FONT_MONO}`;
    g.fillText("ESTRATEGIA · EJECUCIÓN · MEDICIÓN", x0 + 50, y0 + h - 50);
  } else if (mode === "contact") {
    // mismo verde que el resto de pantallas
    g.fillStyle = ACCENT;
    g.fillRect(x0, y0, w, h);
    g.fillStyle = ACCENT_L;
    g.font = `500 15px ${FONT_MONO}`;
    g.textAlign = "center";
    g.fillText("08 / CONTACTO", SW / 2, y0 + h * 0.3);
    g.fillStyle = PAPER;
    g.font = `italic 400 92px ${FONT_DISPLAY}`;
    g.fillText("Hablemos.", SW / 2, y0 + h * 0.52);
    g.font = `400 22px ${FONT_MONO}`;
    g.fillText("pilarbello1085@gmail.com", SW / 2, y0 + h * 0.66);
    g.fillStyle = ACCENT_L;
    g.font = `400 14px ${FONT_MONO}`;
    g.fillText("INCORPORACIÓN INMEDIATA · PRESENCIAL O HÍBRIDO", SW / 2, y0 + h * 0.76);
    g.textAlign = "left";
  }

  // barra de comando: lo que el portátil teclea al hacer clic
  if (cmdActive(t) && (mode === "case" || mode === "contact")) {
    g.font = `400 17px ${FONT_MONO}`;
    const label = "› " + FX.cmd;
    const bw = Math.min(w - 120, g.measureText(label).width + 70);
    const bx = SW / 2 - bw / 2, by = y0 + h - 78;
    g.fillStyle = "rgba(17,19,23,0.92)";
    roundRect(g, bx, by, bw, 46, 23);
    g.fill();
    g.fillStyle = "#e9ebef";
    g.fillText(label, bx + 26, by + 29);
    if (Math.floor(t * 2.5) % 2 === 0) { g.fillStyle = ACCENT_L; g.fillRect(bx + 30 + g.measureText(label).width, by + 14, 8, 18); }
  }

  // brillo del ratón sobre la pantalla
  if (FX.cursor && FX.cursor.a > 0.01) {
    const cx = FX.cursor.u * SW, cy = (1 - FX.cursor.v) * SH, a = FX.cursor.a;
    const light = mode === "studio" || mode === "contact"; // pantallas verdes: cursor claro
    const glow = g.createRadialGradient(cx, cy, 0, cx, cy, 170);
    glow.addColorStop(0, light ? `rgba(156,195,188,${0.22 * a})` : `rgba(43,93,87,${0.1 * a})`);
    glow.addColorStop(1, "rgba(43,93,87,0)");
    g.fillStyle = glow;
    g.fillRect(cx - 170, cy - 170, 340, 340);
    g.strokeStyle = light ? `rgba(234,236,240,${0.8 * a})` : `rgba(17,19,23,${0.7 * a})`;
    g.lineWidth = 1.5;
    g.beginPath(); g.arc(cx, cy, 13, 0, Math.PI * 2); g.stroke();
    g.fillStyle = g.strokeStyle;
    g.beginPath(); g.arc(cx, cy, 2.5, 0, Math.PI * 2); g.fill();
  }

  // barrido de refresco al cambiar de evento
  const wp = (t - info.since) / 0.6;
  if (wp >= 0 && wp < 1) {
    const yy = y0 + wp * (h + 120) - 60;
    const band = g.createLinearGradient(0, yy - 90, 0, yy);
    band.addColorStop(0, "rgba(43,93,87,0)");
    band.addColorStop(1, `rgba(43,93,87,${0.16 * (1 - wp)})`);
    g.fillStyle = band;
    g.fillRect(x0, yy - 90, w, 90);
    g.fillStyle = `rgba(43,93,87,${0.5 * (1 - wp)})`;
    g.fillRect(x0, yy, w, 1.5);
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
  // piloto de la cámara: se enciende cuando el ratón está sobre el portátil
  if (FX.cam > 0.02) {
    g.fillStyle = `rgba(80,220,120,${FX.cam})`;
    g.beginPath(); g.arc(SW / 2 + 14, 10, 2.2, 0, Math.PI * 2); g.fill();
  }
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
  grd.addColorStop(0, "#dadcdf");
  grd.addColorStop(0.5, "#cfd2d6");
  grd.addColorStop(1, "#c6c9ce");
  g.fillStyle = grd;
  g.fillRect(0, 0, KW, KH);
  for (let i = 0; i < 1400; i++) {
    const y = Math.random() * KH;
    g.strokeStyle = Math.random() < 0.5 ? `rgba(255,255,255,${Math.random() * 0.06})` : `rgba(50,56,64,${Math.random() * 0.04})`;
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, y); g.lineTo(KW, y + (Math.random() - 0.5) * 2); g.stroke();
  }

  // hueco del teclado
  const kx = px(KB.cx - KB.w / 2), ky = py(KB.cy + KB.h / 2), kw = sx(KB.w), kh = sy(KB.h);
  g.fillStyle = "rgba(26,28,32,0.85)";
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
    g.fillStyle = "rgba(34,37,42,0.55)";
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
  g.strokeStyle = "rgba(50,56,64,0.22)";
  g.lineWidth = 2;
  roundRect(g, tx - 6, ty - 6, tw + 12, th + 12, 28);
  g.stroke();

  // muesca frontal para abrir la tapa
  const notch = g.createRadialGradient(KW / 2, KH, 0, KW / 2, KH, 150);
  notch.addColorStop(0, "rgba(50,56,64,0.4)");
  notch.addColorStop(1, "rgba(50,56,64,0)");
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

/* --- Ficha de experiencia (plantilla editorial común) --- */
function wrapLines(g, text, maxW) {
  const out = [];
  let line = "";
  text.split(" ").forEach((wd) => {
    const test = line ? line + " " + wd : wd;
    if (g.measureText(test).width > maxW && line) { out.push(line); line = wd; }
    else line = test;
  });
  if (line) out.push(line);
  return out;
}

function drawMotif(g, motif, x, y, w, h, col) {
  g.save();
  g.strokeStyle = col;
  g.fillStyle = col;
  g.lineWidth = 1.5;
  const cx = x + w / 2, cy = y + h / 2;
  switch (motif) {
    case "arches":
      for (let i = 0; i < 4; i++) {
        const aw = w * (0.9 - i * 0.2), ax = cx - aw / 2, top = y + i * 22;
        g.beginPath();
        g.moveTo(ax, y + h);
        g.lineTo(ax, top + aw / 2);
        g.arc(cx, top + aw / 2, aw / 2, Math.PI, 0);
        g.lineTo(ax + aw, y + h);
        g.stroke();
      }
      break;
    case "rings":
      for (let i = 1; i <= 7; i++) { g.globalAlpha = 1 - i * 0.11; g.beginPath(); g.arc(cx, cy, i * (h / 15), 0, Math.PI * 2); g.stroke(); }
      g.globalAlpha = 1;
      g.beginPath(); g.arc(cx, cy, 6, 0, Math.PI * 2); g.fill();
      break;
    case "lines":
      for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) {
        const on = (r * 7 + c) % 4 === 0;
        const px = x + 10 + c * (w - 20) / 6, py = y + 10 + r * (h - 20) / 5;
        g.beginPath(); g.arc(px, py, on ? 6 : 2.2, 0, Math.PI * 2);
        on ? g.stroke() : g.fill();
      }
      break;
    case "circles":
      [[0.36, 0.42, 0.3], [0.62, 0.38, 0.26], [0.5, 0.66, 0.28]].forEach(([fx, fy, fr]) => {
        g.beginPath(); g.arc(x + w * fx, y + h * fy, h * fr, 0, Math.PI * 2); g.stroke();
      });
      break;
    case "diagonal":
      g.beginPath(); g.rect(x, y, w, h); g.clip();
      g.globalAlpha = 0.6;
      for (let i = -h; i < w; i += 22) { g.beginPath(); g.moveTo(x + i, y + h); g.lineTo(x + i + h, y); g.stroke(); }
      g.globalAlpha = 1;
      break;
  }
  g.restore();
}

function drawPoster(g, PW, PH, p, idx, img) {
  const th = THEMES[p.theme];
  const M = 56;
  g.fillStyle = th.bg;
  g.fillRect(0, 0, PW, PH);
  if (img) {
    const s = Math.max(PW / img.width, PH / img.height);
    g.drawImage(img, (PW - img.width * s) / 2, (PH - img.height * s) / 2, img.width * s, img.height * s);
    g.fillStyle = rgba(th.bg, 0.72);
    g.fillRect(0, 0, PW, PH);
  }
  grain(g, PW, PH, 6000, p.theme === "dark");
  if ("letterSpacing" in g) g.letterSpacing = "0px";
  const spaced = (px) => { if ("letterSpacing" in g) g.letterSpacing = px; };

  // cabecera: número de experiencia y fechas
  g.fillStyle = th.fg;
  g.font = `500 21px ${FONT_SANS}`;
  spaced("3px");
  g.fillText(`EXPERIENCIA ${String(idx + 1).padStart(2, "0")}`, M, 78);
  g.textAlign = "right";
  g.fillText(p.years, PW - M, 78);
  g.textAlign = "left";
  g.fillStyle = rgba(th.fg, 0.3);
  g.fillRect(M, 104, PW - M * 2, 2);

  // área (acento terracota)
  g.fillStyle = th.accent;
  g.font = `600 20px ${FONT_SANS}`;
  spaced("2px");
  wrapLines(g, p.category.toUpperCase(), PW - M * 2).slice(0, 1).forEach((ln) => g.fillText(ln, M, 158));
  spaced("0px");

  // titular
  g.fillStyle = th.fg;
  g.font = `400 76px ${FONT_DISPLAY}`;
  const lines = wrapLines(g, p.headline, PW - M * 2);
  lines.forEach((ln, i) => {
    g.font = i === lines.length - 1 ? `italic 400 76px ${FONT_DISPLAY}` : `400 76px ${FONT_DISPLAY}`;
    g.fillText(ln, M - 2, 252 + i * 84);
  });
  const afterHead = 252 + (lines.length - 1) * 84;

  // dato clave o motivo gráfico
  const zoneY = Math.max(afterHead + 60, 470), zoneH = PH - 300 - zoneY;
  if (p.metric) {
    g.fillStyle = th.fg;
    g.font = `400 112px ${FONT_DISPLAY}`;
    g.fillText(p.metric.value, M - 4, zoneY + zoneH * 0.62);
    g.fillStyle = rgba(th.fg, 0.75);
    g.font = `500 20px ${FONT_SANS}`;
    spaced("3px");
    g.fillText(p.metric.label.toUpperCase(), M, zoneY + zoneH * 0.62 + 44);
    spaced("0px");
  } else {
    drawMotif(g, p.motif, PW - M - 250, zoneY, 250, zoneH, rgba(th.fg, 0.45));
  }

  // pie: empresa, puesto y etiquetas
  const base = PH - 268;
  g.fillStyle = rgba(th.fg, 0.3);
  g.fillRect(M, base, PW - M * 2, 1.5);
  g.fillStyle = th.fg;
  g.font = `400 50px ${FONT_DISPLAY}`;
  g.fillText(p.company, M - 1, base + 66);
  g.fillStyle = rgba(th.fg, 0.8);
  g.font = `400 23px ${FONT_SANS}`;
  wrapLines(g, p.role, PW - M * 2).slice(0, 2).forEach((ln, i) => g.fillText(ln, M, base + 108 + i * 30));

  // etiquetas: solo las que caben en una línea, sin cortar
  let tx = M;
  const ty = PH - 86;
  g.font = `500 19px ${FONT_SANS}`;
  let full = false;
  p.tags.forEach((tag) => {
    const tw = g.measureText(tag).width + 34;
    if (full || tx + tw > PW - M) { full = true; return; }
    g.strokeStyle = rgba(th.fg, 0.5);
    g.lineWidth = 2;
    roundRect(g, tx, ty, tw, 44, 22);
    g.stroke();
    g.fillStyle = th.fg;
    g.fillText(tag, tx + 17, ty + 29);
    tx += tw + 10;
  });
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

  RectAreaLightUniformsLib.init();
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
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
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
    color: 0xc9ccd1, metalness: 0.8, roughness: 0.32, clearcoat: 0.25, clearcoatRoughness: 0.4, envMapIntensity: 1.15
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
  laptop.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(edgePts), new THREE.LineBasicMaterial({ color: 0xf4f6f8 })));

  /* --- Teclado: distribución española, serigrafía, retroiluminación y pulsación --- */
  const KEY_ROWS = [
    { h: 0.62, keys: ["esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", { l: "tid" }] },
    { h: 1, keys: ["º", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "'", "¡", { l: "⌫", u: 1.55 }] },
    { h: 1, keys: [{ l: "⇥", u: 1.55 }, "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "`", "+", "Ç"] },
    { h: 1, keys: [{ l: "⇪", u: 1.85 }, "A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ", "´", { l: "↵", u: 1.85 }] },
    { h: 1, keys: [{ l: "⇧", u: 2.35 }, "Z", "X", "C", "V", "B", "N", "M", ",", ".", "-", { l: "⇧", u: 2.35 }] },
    { h: 1, keys: ["fn", "⌃", "⌥", { l: "⌘", u: 1.3 }, { l: "space", u: 5 }, { l: "⌘", u: 1.3 }, "⌥", { l: "◀", half: true }, { l: "▲▼", split: true }, { l: "▶", half: true }] }
  ];
  const keyGap = 0.012, kbMargin = 0.03;
  const kbW = KB.w - kbMargin * 2, kbH = KB.h - kbMargin * 2;
  const kbLeft = KB.cx - kbW / 2, kbTop = KB.cy + KB.h / 2 - kbMargin;
  const unitH = (kbH - keyGap * (KEY_ROWS.length - 1)) / KEY_ROWS.reduce((acc, r) => acc + r.h, 0);
  const KEY_H = 0.009;

  // lista plana de teclas con su rectángulo (x, y en el plano de la cubierta; +y hacia la bisagra)
  const keyList = [];
  {
    let rowTop = kbTop;
    KEY_ROWS.forEach((row, ri) => {
      const rh = unitH * row.h;
      const specs = row.keys.map((k) => (typeof k === "string" ? { l: k, u: 1 } : { u: 1, ...k }));
      const totalU = specs.reduce((acc, k) => acc + k.u, 0);
      const unitW = (kbW - keyGap * (specs.length - 1)) / totalU;
      let x = kbLeft;
      specs.forEach((k) => {
        const kw = unitW * k.u;
        const halfH = (rh - keyGap * 0.5) / 2;
        const add = (l, y, h) => keyList.push({ l, row: ri, x: x + kw / 2, y, w: kw, h });
        if (k.split) {
          add("▲", rowTop - halfH / 2, halfH);
          add("▼", rowTop - rh + halfH / 2, halfH);
        } else if (k.half) {
          add(k.l, rowTop - rh + halfH / 2, halfH);
        } else {
          add(k.l, rowTop - rh / 2, rh);
        }
        x += kw + keyGap;
      });
      rowTop -= rh + keyGap;
    });
  }
  const NK = keyList.length;

  // atlas de serigrafía: un lienzo con la misma distribución que el teclado
  const LCW = 2048, LCH = Math.round(2048 * (kbH / kbW));
  const legendCanvas = document.createElement("canvas");
  legendCanvas.width = LCW; legendCanvas.height = LCH;
  {
    const g = legendCanvas.getContext("2d");
    g.fillStyle = "#fff"; g.strokeStyle = "#fff";
    g.textBaseline = "middle";
    const MODS = "⌫⇥⇪↵⇧⌘⌥⌃";
    keyList.forEach((k) => {
      const px = ((k.x - k.w / 2 - kbLeft) / kbW) * LCW, pw = (k.w / kbW) * LCW;
      const py = ((kbTop - (k.y + k.h / 2)) / kbH) * LCH, ph = (k.h / kbH) * LCH;
      k.rect = [px / LCW, 1 - (py + ph) / LCH, pw / LCW, ph / LCH];
      const cx = px + pw / 2, cy = py + ph / 2;
      const l = k.l;
      const fullH = (unitH / kbH) * LCH;
      if (l === "space") return;
      if (l === "tid") { g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, ph * 0.28, 0, Math.PI * 2); g.stroke(); return; }
      if (l === "esc" || /^F\d+$/.test(l)) {
        g.textAlign = "center";
        g.font = `500 ${Math.round(ph * 0.4)}px ${FONT_SANS}`;
        g.fillText(l.toLowerCase(), cx, cy + 1);
      } else if ("◀▶▲▼".includes(l)) {
        g.textAlign = "center";
        g.font = `400 ${Math.round(ph * 0.5)}px ${FONT_SANS}`;
        g.fillText(l, cx, cy + 1);
      } else if (l.length === 1 && !MODS.includes(l)) {
        g.textAlign = "center";
        g.font = `500 ${Math.round(fullH * 0.42)}px ${FONT_SANS}`;
        g.fillText(l, cx, cy + 1);
      } else {
        // modificadores: símbolo pequeño en la esquina, como en un teclado real
        const right = k.x > KB.cx + 0.3;
        g.textAlign = right ? "right" : "left";
        g.font = `500 ${Math.round(fullH * 0.32)}px ${FONT_SANS}`;
        g.fillText(l, right ? px + pw - fullH * 0.18 : px + fullH * 0.18, py + ph * 0.7);
      }
    });
  }
  const legendTex = new THREE.CanvasTexture(legendCanvas);
  legendTex.anisotropy = maxAniso;

  const keyUniforms = {
    legendMap: { value: legendTex },
    backlight: { value: 0 },
    glowColor: { value: new THREE.Color(0xdfe8ff) }
  };
  const keyMat = new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.62, metalness: 0.05, envMapIntensity: 0.45 });
  keyMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, keyUniforms);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>
        attribute vec4 legendRect;
        attribute float keyGlow;
        varying vec2 vLegendUv;
        varying float vTop;
        varying float vGlow;`)
      .replace("#include <uv_vertex>", `#include <uv_vertex>
        vLegendUv = legendRect.xy + uv * legendRect.zw;
        vTop = step(0.7, normal.y);
        vGlow = keyGlow;`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
        uniform sampler2D legendMap;
        uniform float backlight;
        uniform vec3 glowColor;
        varying vec2 vLegendUv;
        varying float vTop;
        varying float vGlow;`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        float lg = texture2D(legendMap, vLegendUv).a * vTop;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.8, 0.82, 0.86), lg * 0.9);
        totalEmissiveRadiance += glowColor * lg * (backlight * 0.85 + vGlow * 1.4);
        totalEmissiveRadiance += glowColor * vTop * vGlow * 0.32;`);
  };

  const keyGeo = new RoundedBoxGeometry(1, 1, 1, 3, 0.2);
  const legendAttr = new THREE.InstancedBufferAttribute(new Float32Array(NK * 4), 4);
  const glowAttr = new THREE.InstancedBufferAttribute(new Float32Array(NK), 1);
  glowAttr.setUsage(THREE.DynamicDrawUsage);
  keyGeo.setAttribute("legendRect", legendAttr);
  keyGeo.setAttribute("keyGlow", glowAttr);
  const keys = new THREE.InstancedMesh(keyGeo, keyMat, NK);
  keys.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  keys.castShadow = true;
  keys.frustumCulled = false;
  const keyPress = new Float32Array(NK);
  const keyIndex = {};
  keyList.forEach((k, i) => {
    legendAttr.setXYZW(i, k.rect[0], k.rect[1], k.rect[2], k.rect[3]);
    const id = k.l.toLowerCase();
    if (!(id in keyIndex)) keyIndex[id] = i;
  });
  laptop.add(keys);

  // retroiluminación que se escapa entre las teclas
  const backGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(KB.w - 0.02, KB.h - 0.02),
    new THREE.MeshBasicMaterial({ color: 0xc9d8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  backGlow.rotation.x = -Math.PI / 2;
  backGlow.position.set(KB.cx, T + 0.0011, -KB.cy);
  laptop.add(backGlow);

  // carácter → tecla (teclado español)
  const plain = (c) => c.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const PUNCT = { " ": "space", "?": "'", "¿": "¡", "!": "1", ":": ".", ";": ",", "_": "-", "·": "3", "/": "7", "(": "8", ")": "9", "=": "0" };
  const SHIFTED = "?!:;_()=/·";
  function keyFor(ch) {
    if (ch === "ñ" || ch === "Ñ") return keyIndex["ñ"];
    const c = PUNCT[ch] || plain(ch).toLowerCase();
    return keyIndex[c];
  }
  function pressChar(ch) {
    const i = keyFor(ch);
    if (i !== undefined) keyPress[i] = 1;
    // mayúsculas y signos que en el teclado español van con mayúsculas
    if (ch !== ch.toLowerCase() || SHIFTED.includes(ch)) keyPress[keyIndex["⇧"]] = 1;
  }
  const pressKey = (id) => { if (keyIndex[id] !== undefined) keyPress[keyIndex[id]] = 1; };

  // trackpad de cristal
  const trackpad = new THREE.Mesh(
    new THREE.ShapeGeometry(rrShape(TP.w, TP.h, 0.035), 8),
    new THREE.MeshPhysicalMaterial({ color: 0xc2c5ca, metalness: 0.35, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 0.55 })
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
  lidPivot.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(lidEdgePts), new THREE.LineBasicMaterial({ color: 0xeef0f3 })));

  // logo grabado en la parte trasera
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.34),
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: makeLogoTexture(), transparent: true, alphaTest: 0.4, metalness: 1, roughness: 0.12 })
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

  // la pantalla ilumina el teclado y la cubierta (luz de área, como un panel real)
  const scrLight = new THREE.RectAreaLight(0xeef2ff, 0, SCR_W, SCR_H);
  scrLight.position.set(0, LH / 2, LT / 2 + 0.01);
  scrLight.rotation.y = Math.PI; // las luces emiten hacia -Z local; la pantalla mira a +Z
  lidPivot.add(scrLight);

  // firma serigrafiada en el marco inferior de la pantalla
  {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 32;
    const g = c.getContext("2d");
    g.fillStyle = "#8d929a";
    g.font = `500 15px ${FONT_SANS}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("A D R I A N A   B E L L O", 256, 16);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.026), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    label.position.set(0, LH / 2 - SCR_H / 2 - 0.026, LT / 2 + 0.0016);
    lidPivot.add(label);
  }

  // luz que sigue al ratón y hace brillar el aluminio
  const cursorLight = new THREE.PointLight(0xf2f6ff, 0, 0.9, 2);
  scene.add(cursorLight);

  // volúmenes invisibles para detectar el ratón (más baratos que las mallas reales)
  const hitMat = new THREE.MeshBasicMaterial();
  const hitBase = new THREE.Mesh(new THREE.BoxGeometry(W, T + 0.03, D), hitMat);
  hitBase.position.y = (T + 0.03) / 2;
  hitBase.visible = false;
  laptop.add(hitBase);
  const hitLid = new THREE.Mesh(new THREE.BoxGeometry(W, LH, LT + 0.02), hitMat);
  hitLid.position.y = LH / 2;
  hitLid.visible = false;
  lidPivot.add(hitLid);

  /* ---------- Capas del panel (vista desplegada) ---------- */
  const R = dashRects();
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x2b5d57, transparent: true, opacity: 0 });
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

  /* ---------- Fichas de experiencia ---------- */
  const PW = 768, PH = 1024, CW = 1.5, CH = 2.0, CT = 0.03;
  // reflejo de luz que sigue al ratón sobre la ficha
  const glareCanvas = document.createElement("canvas");
  glareCanvas.width = glareCanvas.height = 256;
  {
    const g = glareCanvas.getContext("2d");
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, "rgba(255,255,255,0.9)");
    grd.addColorStop(0.35, "rgba(255,255,255,0.25)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
  }
  const cardShape = rrShape(CW, CH, 0.014);
  const cardGeo = new THREE.ShapeGeometry(cardShape, 6);
  {
    const uv = cardGeo.attributes.uv, pos = cardGeo.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / CW + 0.5, pos.getY(i) / CH + 0.5);
  }
  const bodyGeo = new RoundedBoxGeometry(CW, CH, CT, 4, 0.014);
  const GLARE_REP = new THREE.Vector2(1.25, 1.25 * (CH / CW));

  const posters = POSTERS.map((p, k) => {
    const th = THEMES[p.theme];
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
    const group = new THREE.Group();   // posición en la columna
    const tilt = new THREE.Group();    // inclinación al pasar el ratón
    group.add(tilt);
    // cuerpo de la ficha (cartón grueso del color del tema)
    const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: new THREE.Color(th.bg).multiplyScalar(0.82), roughness: 0.7, metalness: 0, transparent: true }));
    body.castShadow = true;
    const front = new THREE.Mesh(cardGeo, new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    front.position.z = CT / 2 + 0.001;
    const gTex = new THREE.CanvasTexture(glareCanvas);
    gTex.repeat.copy(GLARE_REP);
    const glare = new THREE.Mesh(cardGeo, new THREE.MeshBasicMaterial({ map: gTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    glare.position.z = CT / 2 + 0.003;
    tilt.add(body, front, glare);
    group.visible = false;
    scene.add(group);
    front.userData.k = k;
    return { group, tilt, body, front, glare, gTex, canvas: c, hover: 0, tx: 0, ty: 0, u: 0.5, v: 0.5 };
  });

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

  /* ---------- Ratón: hover y clic sobre el portátil ---------- */
  const mouse = new THREE.Vector2();
  const mouseS = new THREE.Vector2();
  const ndc = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  let pointerIn = false, overUI = false, isTouch = false;
  // solo cuenta como "texto encima" lo que de verdad tiene letras (el título es un bloque a todo el ancho)
  const UI_SEL = ".panel, .lab, a, button, .hero__title .line > span, .hero__role, .hero__lead, .tag, .hud-top, .scroll-hint";

  // cursor propio que aparece sobre el portátil
  const pcCursor = document.createElement("div");
  pcCursor.className = "pc-cursor";
  pcCursor.setAttribute("aria-hidden", "true");
  pcCursor.innerHTML = "<i></i><span>Haz clic · el portátil escribe</span>";
  document.body.appendChild(pcCursor);
  const pcLabel = pcCursor.querySelector("span");
  let hoverCard = -1, lastCursorMode = "";

  window.addEventListener("pointermove", (e) => {
    mouse.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    pointerIn = true;
    isTouch = e.pointerType === "touch";
    overUI = !!(e.target.closest && e.target.closest(UI_SEL));
    pcCursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { pointerIn = false; });

  // ¿qué parte del portátil hay bajo el ratón?
  const hitLocal = new THREE.Vector3();
  function hitTest(nx, ny) {
    ndc.set(nx, -ny);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects([hitLid, hitBase], false);
    if (!hits.length) return null;
    const h = hits[0];
    hitLocal.copy(h.point);
    if (h.object === hitLid) {
      screenRoot.worldToLocal(hitLocal);
      if (hitLocal.z < -0.005) return { part: "lid", world: h.point, dist: h.distance };
      return { part: "screen", u: hitLocal.x / SCR_W + 0.5, v: hitLocal.y / SCR_H + 0.5, world: h.point, dist: h.distance };
    }
    laptop.worldToLocal(hitLocal);
    return { part: "deck", x: hitLocal.x, y: -hitLocal.z, world: h.point, dist: h.distance };
  }

  // ¿hay una ficha bajo el ratón? (solo las visibles)
  function cardTest(nx, ny) {
    ndc.set(nx, -ny);
    raycaster.setFromCamera(ndc, camera);
    const fronts = posters.filter((P) => P.group.visible && P.front.material.opacity > 0.5).map((P) => P.front);
    const hits = raycaster.intersectObjects(fronts, false);
    return hits.length ? { k: hits[0].object.userData.k, u: hits[0].uv.x, v: hits[0].uv.y, dist: hits[0].distance } : null;
  }

  // ondas de luz que recorren el teclado
  const ripples = [];
  const addRipple = (x, y, t0, s = 1) => { ripples.push({ x, y, t0, s }); if (ripples.length > 6) ripples.shift(); };
  const kbCenter = () => [KB.cx, KB.cy];

  // clic: el portátil teclea una frase y la pantalla la muestra
  const PHRASES = ["Hola, soy Adriana.", "Comunicación interna y corporativa.", "Campañas, redes y comunidad.", "Disponible para incorporarme ya."];
  let phraseIdx = 0, typeQueue = [], nextTypeAt = 0, enterAt = -1, trackPulse = 0;
  function startTyping(t) {
    FX.cmd = "";
    FX.cmdUntil = t + 99;
    typeQueue = PHRASES[phraseIdx++ % PHRASES.length].split("");
    nextTypeAt = t + 0.12;
    enterAt = -1;
  }
  window.addEventListener("click", (e) => {
    if (e.target.closest && e.target.closest(UI_SEL)) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1, ny = (e.clientY / window.innerHeight) * 2 - 1;
    const card = cardTest(nx, ny);
    const hit = hitTest(nx, ny);
    if (card && (!hit || card.dist < hit.dist)) {
      const el = document.getElementById("experiencia-" + (card.k + 1));
      if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      return;
    }
    if (!hit) return;
    const t = clock.elapsedTime;
    trackPulse = 1;
    const [rx, ry] = hit.part === "deck" ? [hit.x, hit.y] : kbCenter();
    addRipple(rx, ry, t, 1.5);
    if (isTouch || e.pointerType === "touch") touchHoverUntil = t + 3.2;
    startTyping(t);
  });

  // estado del hover entre fotogramas
  let hoverS = 0, deckS = 0, screenS = 0, wasHover = false, booted = false, touchHoverUntil = -1;
  let autoLen = -1;
  const deckPt = new THREE.Vector2(), lightTarget = new THREE.Vector3(), km2 = new THREE.Matrix4();
  const uvS = new THREE.Vector2(0.5, 0.5);
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
  const qOut = new THREE.Quaternion(), qTmp = new THREE.Quaternion();
  const railUp = new THREE.Vector3(), railN = new THREE.Vector3(), X_AXIS = new THREE.Vector3(1, 0, 0);
  const dummy = new THREE.Object3D();
  const slot0 = CARD_POS.clone();

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
      camLook.y -= 0.35 + 1.3 * (1 - clamp01(progress)); // en la portada, el portátil más arriba (sobre el texto)
      // un poco más lejos para que el portátil (y su despiece) quepa en vertical
      tmp.copy(camPos).sub(camLook).multiplyScalar(1.14);
      camPos.copy(camLook).add(tmp);
      // en las campañas, la cámara encuadra la pieza publicada con algo de aire
      const wp = clamp01(progress - 1.3) * (1 - clamp01(progress - (ROOM_LAB - 0.6)));
      tmp2.copy(slot0).add(tmp.set(-0.05, 0.15, 0));
      camLook.lerp(tmp2, wp);
      camPos.lerp(tmp.copy(tmp2).addScaledVector(CARD_DIR, 7.6).add(tmp3.set(0, 0.5, 0)), wp); // de frente a la ficha
    }
    mouseS.lerp(mouse, Math.min(1, dt * 2.5));
    camPos.x += mouseS.x * 0.25;
    camPos.y -= mouseS.y * 0.15;
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    camera.updateMatrixWorld();

    /* --- Hover: ¿el ratón está sobre el portátil? --- */
    const canHover = pointerIn && !overUI && !isTouch && fade > 0.8;
    const card = canHover ? cardTest(mouse.x, mouse.y) : null;
    let hit = canHover ? hitTest(mouse.x, mouse.y) : null;
    if (card && hit && card.dist < hit.dist) hit = null;
    hoverCard = card && !hit ? card.k : -1;
    if (hoverCard >= 0) { posters[hoverCard].u = card.u; posters[hoverCard].v = card.v; }
    const cursorMode = hoverCard >= 0 ? "card" : hit ? "pc" : "";
    if (cursorMode !== lastCursorMode) {
      document.documentElement.classList.toggle("pc-hover", !!cursorMode);
      if (cursorMode) pcLabel.textContent = cursorMode === "card" ? "Ver experiencia" : "Haz clic · el portátil escribe";
      lastCursorMode = cursorMode;
    }
    // en móvil no hay hover: al tocar el portátil reacciona igual durante unos segundos
    const hovering = !!hit || t < touchHoverUntil;
    const k4 = Math.min(1, dt * 4);
    hoverS += ((hovering ? 1 : 0) - hoverS) * k4;
    deckS += ((hit && hit.part === "deck" ? 1 : 0) - deckS) * Math.min(1, dt * 6);
    screenS += ((hit && hit.part === "screen" ? 1 : 0) - screenS) * Math.min(1, dt * 6);
    if (hit && hit.part === "deck") deckPt.set(hit.x, hit.y);
    if (hit && hit.part === "screen") uvS.lerp(ndc.set(hit.u, hit.v), Math.min(1, dt * 14));
    if (hovering !== wasHover) {
      // al entrar, una onda de luz recorre el teclado desde el punto del ratón
      if (hovering) {
        const [rx, ry] = hit && hit.part === "deck" ? [hit.x, hit.y] : kbCenter();
        addRipple(rx, ry, t, 1);
      }
      wasHover = hovering;
    }
    FX.cursor = { u: uvS.x, v: uvS.y, a: screenS };
    FX.cam = hoverS;

    // luz que sigue al ratón por el aluminio
    if (hit) lightTarget.copy(hit.world).add(tmp.copy(camera.position).sub(hit.world).normalize().multiplyScalar(0.22));
    cursorLight.position.lerp(lightTarget, Math.min(1, dt * 8));
    cursorLight.intensity = hoverS * 0.3;

    /* --- 00: el portátil se abre y se enciende --- */
    const intro = reduceMotion ? 1 : ease((t - 0.9) / 2.2);
    const power = reduceMotion ? 1 : ease((t - 2.0) / 0.8);
    if (!booted && power > 0.05) { booted = true; addRipple(...kbCenter(), t, 1.2); }
    const bootGlow = reduceMotion ? 0 : power * (1 - ease((t - 2.8) / 1.6));
    lidPivot.rotation.x = THREE.MathUtils.lerp(CLOSED, OPEN - 0.07 * hoverS, intro);
    const sway = 1 - 0.75 * clamp01(progress);
    laptop.rotation.y = ((Math.sin(tm * 0.3) * 0.12 + mouseS.x * 0.15) * sway) - (1 - intro) * 0.5 + mouseS.x * 0.1 * hoverS;
    laptop.rotation.x = mouseS.y * 0.05 * hoverS;
    // levita un poco mientras el ratón está encima
    laptop.position.y = hoverS * (0.09 + Math.sin(tm * 1.7) * 0.008);
    contactShadow.scale.setScalar(1 + 0.2 * hoverS);
    contactShadow.material.opacity = 1 - 0.4 * hoverS;

    /* --- 01: la pantalla se despliega en capas (y el hover lo insinúa) --- */
    const exScroll = ease(progress) * (1 - ease((progress - 1) / 0.5));
    const ex = Math.max(exScroll, hoverS * 0.3 * (1 - clamp01((progress - 1.2) / 0.3)));
    const layerAlpha = 1 - ease((progress - 1.5) / 0.2);
    edgeMat.opacity = 0.35 * ex;
    layers.forEach((L) => {
      const d = L.depth;
      L.mesh.position.set(
        L.rest.x * (1 + ex * 0.16) + mouseS.x * d * 0.03 * hoverS,
        L.rest.y * (1 + ex * 0.16) - mouseS.y * d * 0.02 * hoverS,
        0.003 + d * 0.0006 + ex * (0.16 + d * 0.17)
      );
      L.mesh.material.opacity = layerAlpha;
      L.mesh.material.color.setScalar(power);
      L.mesh.visible = layerAlpha > 0.01;
    });
    screen.material.color.setScalar(power);

    /* --- Modo de la pantalla: cada cambio es un evento del portátil --- */
    let mode = "dash";
    let kActive = 0;
    if (progress >= ROOM_LAB + 0.7) mode = "contact";
    else if (progress >= ROOM_LAB - 0.4) mode = "studio";
    else if (progress >= ROOM_FIRST_PIECE - 0.5) { mode = "case"; kActive = Math.min(NP - 1, Math.max(0, Math.round(progress - ROOM_FIRST_PIECE))); }
    const sKey = mode + kActive;
    if (sKey !== screenKey) {
      if (screenKey) {
        // cada cambio de experiencia = Intro + clic en el trackpad; la onda sale de la tecla
        const ent = keyList[keyIndex["↵"]];
        pressKey("↵");
        if (mode === "case") trackPulse = 1;
        addRipple(ent.x, ent.y, t, mode === "contact" ? 1.6 : 1.1);
      }
      screenKey = sKey; publishSince = t; lastDraw = -1;
    }
    const fps = screenS > 0.01 || typeQueue.length || cmdActive(t) ? 30 : 15;
    if (t - lastDraw > 1 / fps) {
      drawScreenBase(sg, mode, t, { k: kActive, since: publishSince });
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
    // la pantalla ilumina el teclado (menos cuando es oscura)
    scrLight.intensity = power * (mode === "studio" || mode === "contact" ? 0.3 : 0.7);

    /* --- Teclado sincronizado con lo que se escribe en pantalla --- */
    if (typeQueue.length && t >= nextTypeAt) {
      const ch = typeQueue.shift();
      FX.cmd += ch;
      pressChar(ch);
      nextTypeAt = t + 0.05 + Math.random() * 0.07 + (ch === " " ? 0.06 : 0);
      if (!typeQueue.length) enterAt = t + 0.35;
    }
    if (enterAt > 0 && t >= enterAt) { pressKey("↵"); FX.cmdUntil = t + 2.4; enterAt = -1; }

    let autoStr = null;
    if (!cmdActive(t) && power > 0.9) {
      if (mode === "dash" && layerAlpha > 0.01) autoStr = typed(t, 5);
      else if (mode === "studio") autoStr = typed(t, 6);
    }
    if (autoStr === null) autoLen = -1;
    else {
      if (autoLen < 0 || autoStr.length < autoLen) autoLen = autoStr.length; // sin ráfaga al entrar
      for (let i = autoLen; i < autoStr.length; i++) pressChar(autoStr[i]);
      if (autoStr.endsWith("…") && autoLen < autoStr.length) pressKey("↵"); // el prompt se envía
      autoLen = autoStr.length;
    }

    const typing = typeQueue.length > 0 || cmdActive(t);
    const backlight = Math.max(hoverS * 0.9, bootGlow, typing ? 0.6 : 0, exScroll * 0.5);
    keyUniforms.backlight.value = backlight;
    backGlow.material.opacity = backlight * 0.32;

    const decay = Math.exp(-dt * 9);
    for (let i = ripples.length - 1; i >= 0; i--) if (t - ripples[i].t0 > 1.8) ripples.splice(i, 1);
    for (let i = 0; i < NK; i++) {
      const k = keyList[i];
      keyPress[i] *= decay;
      let glow = keyPress[i] * 0.9, lift = 0;
      for (const r of ripples) {
        const age = t - r.t0;
        const dd = Math.hypot(k.x - r.x, k.y - r.y) - age * 1.6;
        const band = Math.exp(-(dd * dd) / 0.018) * (1 - age / 1.8) * r.s;
        glow += band;
        lift += band * 0.014;
      }
      if (deckS > 0.01) {
        const d2 = (k.x - deckPt.x) ** 2 + (k.y - deckPt.y) ** 2;
        const p = Math.exp(-d2 / 0.03) * deckS;
        glow += p * 0.9;
        lift += p * 0.007;
      }
      // vista despiezada: las filas de teclas se elevan en cascada
      lift += exScroll * 0.07 * (0.35 + 0.65 * (k.row / 5));
      km2.makeScale(k.w - 0.004, KEY_H, k.h - 0.004).setPosition(k.x, T + KEY_H / 2 + lift - keyPress[i] * 0.0055, -k.y);
      keys.setMatrixAt(i, km2);
      glowAttr.setX(i, Math.min(glow, 1.6));
    }
    keys.instanceMatrix.needsUpdate = true;
    glowAttr.needsUpdate = true;

    // trackpad: se hunde con cada clic/publicación
    trackPulse *= Math.exp(-dt * 7);
    trackpad.position.y = T + 0.0012 - trackPulse * 0.0018;
    trackpad.material.emissive.setRGB(0.12 * trackPulse, 0.14 * trackPulse, 0.2 * trackPulse);

    /* --- 02–06: columna de fichas que gira con el scroll --- */
    laptop.updateMatrixWorld(true);
    P2.copy(CARD_POS);
    faceDir(P2, CARD_DIR, qOut);
    railUp.set(0, 1, 0).applyQuaternion(qOut);
    railN.set(0, 0, 1).applyQuaternion(qOut);
    const kSmooth = Math.min(1, dt * 8);

    posters.forEach((P, k) => {
      // d < 0: la ficha viene por abajo · d = 0: al frente · d > 0: sale por arriba
      const d = progress - (ROOM_FIRST_PIECE + k);
      // al salir de la experiencia (hacia Proyectos) la columna desaparece del todo
      const leave = 1 - ease((progress - (ROOM_LAB - 0.7)) / 0.35);
      const vis = (reduceMotion ? (Math.abs(d) < 0.5 ? 1 : 0) : 1 - ease((Math.abs(d) - 0.7) / 0.55)) * leave;
      P.group.visible = vis > 0.01;
      if (!P.group.visible) { P.hover = 0; return; }
      const a = THREE.MathUtils.clamp(d, -2, 2) * RAIL_STEP;
      const focus = 1 - Math.min(1, Math.abs(d));
      P.group.position.copy(P2)
        .addScaledVector(railUp, Math.sin(a) * RAIL_R)
        .addScaledVector(railN, -(1 - Math.cos(a)) * RAIL_R);
      P.group.position.y += Math.sin(tm * 0.8 + k) * 0.018 * focus;
      P.group.quaternion.copy(qOut).multiply(qTmp.setFromAxisAngle(X_AXIS, -a));
      P.group.scale.setScalar(1.0 + 0.18 * focus);

      // hover: se inclina hacia el ratón, se adelanta y la recorre un reflejo
      const on = hoverCard === k;
      P.hover += ((on ? 1 : 0) - P.hover) * Math.min(1, dt * 6);
      P.tx += ((on ? -(P.v - 0.5) * 0.34 : 0) - P.tx) * kSmooth;
      P.ty += ((on ? (P.u - 0.5) * 0.4 : 0) - P.ty) * kSmooth;
      P.tilt.rotation.set(P.tx, P.ty, 0);
      P.tilt.position.z = 0.18 * P.hover;
      P.tilt.scale.setScalar(1 + 0.035 * P.hover);
      P.gTex.offset.set(0.5 - P.u * GLARE_REP.x, 0.5 - P.v * GLARE_REP.y);
      P.glare.material.opacity = 0.3 * P.hover * vis;

      const dim = 0.78 + 0.22 * Math.max(focus, P.hover);
      P.front.material.color.setScalar(dim);
      P.front.material.opacity = vis;
      P.body.material.opacity = vis;
    });

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
