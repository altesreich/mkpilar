/* ==========================================================
   La Vitrina · Adriana Bello
   Experiencia 3D inspirada en el lenguaje de los sitios inmersivos,
   traducida al marketing:
   - intro: cuenta atrás de spot publicitario
   - pabellón de cristal (tienda insignia) en un paisaje de vallas
   - el pabellón se desmonta en sus paneles (manifiesto)
   - cada etapa profesional, un objeto en una vitrina de cristal
   - transiciones: flash de cámara de prensa + separación RGB
   - contacto: partículas que forman la figura del enlace
   Three.js r160 · sin build
   ========================================================== */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

const root = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mqMobile = window.matchMedia("(max-width: 760px)");
const isMobile = () => mqMobile.matches;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ease = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };

/* ==========================================================
   Texto "scramble"
   ========================================================== */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/[]·—+#";
function scramble(el, force) {
  if (!el || (el.dataset.scrambled && !force)) return;
  el.dataset.scrambled = "1";
  const final = el.dataset.final || el.textContent;
  el.dataset.final = final;
  if (reduceMotion) { el.textContent = final; return; }
  let frame = 0;
  const total = Math.min(34, 12 + final.length);
  cancelAnimationFrame(el._raf);
  const tick = () => {
    let out = "";
    for (let i = 0; i < final.length; i++) {
      const settle = (i / final.length) * total * 0.7 + total * 0.3;
      out += final[i] === " " || frame >= settle ? final[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    frame++;
    if (frame <= total) el._raf = requestAnimationFrame(tick);
    else el.textContent = final;
  };
  tick();
}

/* ==========================================================
   Sonido (sintetizado, sin archivos)
   ========================================================== */
const Sound = {
  ctx: null, master: null, on: false,
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    // ambiente: acorde suave filtrado con un LFO lento
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 700;
    filter.Q.value = 0.6;
    filter.connect(this.master);
    [110, 164.8, 220, 277.2].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? "triangle" : "sine";
      o.frequency.value = f;
      o.detune.value = (Math.random() - 0.5) * 8;
      const g = ctx.createGain();
      g.gain.value = 0.16 / (i + 1);
      o.connect(g).connect(filter);
      o.start();
    });
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 380;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
  },
  set(on) {
    this.on = on;
    if (on) this.init();
    if (!this.ctx) return;
    if (on && this.ctx.state === "suspended") this.ctx.resume();
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(on ? 0.22 : 0, this.ctx.currentTime + 0.8);
    const btn = $(".sound");
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    $(".sound__label").textContent = on ? "Sonido on" : "Sonido off";
  },
  // obturador de cámara: ráfaga de ruido corta
  shutter() {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * 0.09);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3) * (i < len * 0.4 || i > len * 0.55 ? 1 : 0.2);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    src.connect(hp).connect(g).connect(ctx.destination);
    src.start();
  },
  tick(freq = 1400) {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.05, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.09);
  }
};

/* ==========================================================
   Intro: cuenta atrás de spot
   ========================================================== */
const intro = $("#intro");
const leaderNum = $(".leader__num");
const pctEl = $(".intro__pct");
let sceneReady = false;
let countdownDone = false;
let pctShown = 0;
scramble($(".intro__label"));

(function countdown() {
  if (reduceMotion) { countdownDone = true; leaderNum.textContent = "AB"; return; }
  let n = 3;
  const step = () => {
    n--;
    if (n > 0) { leaderNum.textContent = n; setTimeout(step, 900); }
    else { leaderNum.textContent = "AB"; countdownDone = true; checkReady(); }
  };
  setTimeout(step, 900);
})();

const pctTimer = setInterval(() => {
  const target = sceneReady ? 100 : Math.min(90, pctShown + Math.random() * 6);
  pctShown += (target - pctShown) * 0.3;
  pctEl.textContent = String(Math.round(pctShown)).padStart(3, "0");
  if (sceneReady && pctShown > 99.5) { pctEl.textContent = "100"; clearInterval(pctTimer); }
}, 60);

function checkReady() {
  if (sceneReady && countdownDone) {
    root.classList.add("is-ready");
    $(".intro__status").innerHTML = '<span class="intro__pct">100</span> · Vitrina lista';
  }
}
window.addEventListener("scene-ready", () => { sceneReady = true; checkReady(); });
setTimeout(() => { sceneReady = true; checkReady(); }, 9000);

$$(".intro__btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    Sound.set(btn.dataset.sound === "on");
    root.classList.add("is-entered");
    root.classList.remove("is-locked");
    window.scrollTo(0, 0);
    setTimeout(() => {
      scramble($(".hud__brand"));
      $$(".sec--hero [data-scramble]").forEach((el) => scramble(el));
    }, 300);
  });
});
$(".sound").addEventListener("click", () => Sound.set(!Sound.on));

/* ==========================================================
   HUD
   ========================================================== */
const clockEl = $(".clock");
const fmtClock = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Madrid" });
setInterval(() => { clockEl.textContent = fmtClock.format(new Date()); }, 1000);
clockEl.textContent = fmtClock.format(new Date());
$$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

const pctHud = $(".pct");
const barHud = $(".hud__bar b");
window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? window.scrollY / max : 0;
  pctHud.textContent = String(Math.round(p * 100)).padStart(3, "0");
  barHud.style.transform = `scaleX(${p.toFixed(4)})`;
}, { passive: true });

const sectionEl = $(".hud__section");
const ticks = $$(".ticks a");
const rooms = $$("[data-room]");
const roomObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const i = entry.target.dataset.room;
    sectionEl.dataset.final = entry.target.dataset.label;
    scramble(sectionEl, true);
    ticks.forEach((a) => a.classList.toggle("is-active", a.dataset.i === i));
  });
}, { rootMargin: "-45% 0px -45% 0px" });
rooms.forEach((r) => roomObserver.observe(r));

$$("a, button").forEach((el) => el.addEventListener("pointerenter", () => Sound.tick(1600)));

/* ---------- Revelado + contadores ---------- */
function animateCount(el) {
  const target = parseInt(el.dataset.count, 10) || 0;
  const fmt = new Intl.NumberFormat("es-ES");
  if (reduceMotion) { el.textContent = fmt.format(target); return; }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / 1800);
    el.textContent = fmt.format(Math.round(target * (1 - Math.pow(1 - t, 4))));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    el.classList.add("is-visible");
    $$("[data-count]", el).forEach(animateCount);
    $$("[data-scramble]", el).forEach((s) => scramble(s));
    revealObserver.unobserve(el);
  });
}, { threshold: 0.15 });
$$(".reveal").forEach((el) => revealObserver.observe(el));

/* ==========================================================
   Consola de prompts (Atelier IA)
   ========================================================== */
const CASES = [
  { title: "Investigación de audiencia", tag: "Insight", objective: "Entender qué le importa a una comunidad antes de escribirle una sola línea.",
    prompt: "ROL: Actúa como analista de audiencias para una marca de moda deportiva.\nCONTEXTO: Te comparto 200 comentarios recientes de Instagram y X, anonimizados.\nTAREA: Agrúpalos en 5 tensiones o motivaciones, con 2 citas literales por grupo.\nFORMATO: Tabla · tensión · frecuencia estimada · cita · oportunidad de contenido.\nLÍMITES: No inventes datos. Marca con [?] lo que no se pueda inferir.",
    deliverable: "Mapa de tensiones de la audiencia y cinco territorios de contenido priorizados.", human: "Contrasto cada grupo con las métricas reales de engagement antes de decidir el plan." },
  { title: "Imagen de figura pública", tag: "Reputación", objective: "Que lo que se dice y lo que se muestra cuenten la misma historia.",
    prompt: "ROL: Asesor/a de imagen pública de un congresista.\nCONTEXTO: Agenda legislativa de la semana y tres temas prioritarios.\nTAREA: Define 3 mensajes clave y cómo se traducen en cada red.\nFORMATO: Mensaje · prueba · pieza visual · red · tono.\nLÍMITES: Solo hechos verificables. Nada que no pueda sostener en un debate.",
    deliverable: "Plataforma de mensajes y guía de tono por canal para la semana.", human: "Lo valido con la persona y su equipo de prensa: la IA propone, la vocería decide." },
  { title: "Gestión de crisis", tag: "Crisis", objective: "Responder rápido sin responder mal cuando la conversación se tuerce.",
    prompt: "ROL: Asesor/a de comunicación en una crisis en redes, en tiempo real.\nCONTEXTO: Una declaración se ha sacado de contexto y crece la conversación negativa.\nTAREA: Redacta 3 respuestas: aclaratoria, empática y de cierre.\nFORMATO: Máximo 280 caracteres cada una + riesgo principal de cada enfoque.\nLÍMITES: Sin confrontar, sin culpar a terceros, solo datos verificables.",
    deliverable: "Borradores de respuesta y matriz de riesgos en minutos, no en horas.", human: "La decisión y el tono final los fija la persona responsable: la IA acelera, no firma." },
  { title: "Canales corporativos", tag: "Interna", objective: "Que cada mensaje llegue por la vía adecuada a cada equipo.",
    prompt: "ROL: Consultor/a de comunicación interna.\nCONTEXTO: Equipos de tienda, oficina y remoto; hoy todo llega por email.\nTAREA: Propón un mapa de canales: qué se comunica, por dónde y con qué frecuencia.\nFORMATO: Tipo de mensaje · audiencia · canal · responsable · periodicidad.\nLÍMITES: Máximo 5 canales. Nada que el equipo no pueda mantener.",
    deliverable: "Mapa de canales internos listo para presentar a dirección.", human: "Lo ajusto con entrevistas reales a cada equipo antes de implantarlo." },
  { title: "Informe de KPIs", tag: "Analítica", objective: "Convertir una exportación de métricas en decisiones para dirección.",
    prompt: "ROL: Analista de redes sociales con foco en negocio.\nCONTEXTO: Exportación mensual de alcance, engagement y crecimiento por red.\nTAREA: Resume qué funcionó, qué no y por qué, en lenguaje ejecutivo.\nFORMATO: 3 hallazgos · 3 decisiones · 1 gráfico sugerido por hallazgo.\nLÍMITES: Cita la cifra exacta de la que sale cada conclusión.",
    deliverable: "Informe ejecutivo de una página: qué repetir y qué cambiar.", human: "Reviso cada cifra contra la fuente original y añado el contexto que los datos no cuentan." },
  { title: "Storyboard de campaña", tag: "Creatividad", objective: "Abrir varias rutas creativas para una campaña antes de diseñar.",
    prompt: "ROL: Director/a creativo/a de campañas internas para una marca global.\nCONTEXTO: Lanzamiento de un valor de marca para equipos de tienda y oficinas.\nTAREA: 3 conceptos de campaña, cada uno con un storyboard de 6 viñetas.\nFORMATO: Concepto · insight · viñeta (plano + texto en pantalla) · pieza física.\nLÍMITES: Coherente con la guía de marca. Lenguaje inclusivo.",
    deliverable: "Conceptos y storyboards listos para producir en Canva, Photoshop o CapCut.", human: "Elijo y adapto el concepto según la cultura real del equipo y la guía de marca." }
];

(function lab() {
  const labEl = $("#lab");
  if (!labEl) return;
  const tabs = $(".lab__tabs", labEl), code = $("code", labEl);
  let current = -1, timer = null;
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const hl = (t) => esc(t).replace(/^([A-ZÁÉÍÓÚÑ]+):/gm, '<span class="k">$1:</span>');
  function select(i, focus) {
    if (i === current) return;
    current = i;
    const c = CASES[i];
    $$(".lab__tab", tabs).forEach((b, j) => { b.setAttribute("aria-selected", j === i); b.tabIndex = j === i ? 0 : -1; if (j === i && focus) b.focus(); });
    $(".lab__objective", labEl).textContent = c.objective;
    $(".lab__deliverable", labEl).textContent = c.deliverable;
    $(".lab__human", labEl).textContent = c.human;
    clearTimeout(timer);
    if (reduceMotion) { code.innerHTML = hl(c.prompt); return; }
    let k = 0;
    code.classList.add("is-typing");
    (function step() {
      k = Math.min(c.prompt.length, k + 3);
      code.innerHTML = hl(c.prompt.slice(0, k));
      if (k < c.prompt.length) timer = setTimeout(step, 14);
      else code.classList.remove("is-typing");
    })();
  }
  CASES.forEach((c, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "lab__tab";
    b.setAttribute("role", "tab");
    b.innerHTML = `<small>${String(i + 1).padStart(2, "0")} · ${c.tag}</small>${c.title}`;
    b.addEventListener("click", () => { select(i); Sound.tick(900); });
    b.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); select((i + 1) % CASES.length, true); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); select((i - 1 + CASES.length) % CASES.length, true); }
    });
    tabs.appendChild(b);
  });
  const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { select(0); io.disconnect(); } }, { threshold: 0.3 });
  io.observe(labEl);
})();

/* ==========================================================
   ESCENA 3D
   ========================================================== */
const BG = 0xe8edf1;
const NV = 6;
const VPOS = (k) => new THREE.Vector3(1.8, 0, -16 - k * 10);
const PART_POS = new THREE.Vector3(2.0, 2.6, -88);
const GLASS_TINTS = [0xeef6f2, 0xf6eef0, 0xf7f1ea, 0xedf2f8, 0xf2f2f0, 0xf4f0fb];

// Cámara por sección: cam, look y punto "sujeto" (encuadre en móvil)
const KEYS = [
  { cam: [0, 2.6, 13.2], look: [-2.6, 0.7, 0], subject: [0, 1.6, 0], fade: 1 },
  { cam: [0.8, 2.2, 5.6], look: [-1.7, 2.0, 0], subject: [0, 2, 0], fade: 1 }
];
for (let k = 0; k < NV; k++) {
  const v = VPOS(k);
  KEYS.push({ cam: [v.x - 2.5, 2.05, v.z + 5.5], look: [v.x - 1.2, 1.55, v.z], subject: [v.x, 1.6, v.z], fade: 1 });
}
KEYS.push({ cam: [-3.2, 4.4, -40], look: [2.2, 1.2, -64], subject: [1.8, 1.6, -60], fade: 0.55 });
KEYS.push({ cam: [0, 2.6, -79], look: [0.6, 2.6, -88], subject: [PART_POS.x, PART_POS.y, PART_POS.z], fade: 1 });

/* ---------- Postproceso: separación RGB + grano + viñeta ---------- */
const FinishShader = {
  uniforms: { tDiffuse: { value: null }, uAmount: { value: 0.002 }, uTime: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uAmount; uniform float uTime; varying vec2 vUv;
    float rand(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 dir = vUv - 0.5;
      float d = length(dir);
      vec2 off = dir * uAmount * (0.4 + d * 1.6);
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;
      col += (rand(vUv * 731.0 + uTime) - 0.5) * 0.025;
      col *= 1.0 - smoothstep(0.6, 1.15, d) * 0.12;
      gl_FragColor = vec4(col, 1.0);
    }`
};

function initScene() {
  const canvas = $("#scene");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch (e) {
    root.classList.add("no-webgl");
    window.dispatchEvent(new Event("scene-ready"));
    return;
  }
  const dpr = () => Math.min(window.devicePixelRatio, isMobile() ? 1.4 : 1.75);
  renderer.setPixelRatio(dpr());
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.FogExp2(BG, 0.032);

  const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 220);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c2ca, 1.05));
  const sun = new THREE.DirectionalLight(0xfff6ea, 1.25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 });
  sun.shadow.bias = -0.0004;
  sun.shadow.radius = 6;
  scene.add(sun, sun.target);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const finish = new ShaderPass(FinishShader);
  composer.addPass(finish);
  composer.addPass(new OutputPass());

  /* ---------- Materiales ---------- */
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xd8b26e, metalness: 1, roughness: 0.2, clearcoat: 0.3, envMapIntensity: 1.2 });
  const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xf4f1ec, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.1 });
  const ink = new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.4, metalness: 0.2 });
  const stone = new THREE.MeshStandardMaterial({ color: 0xdfe2e5, roughness: 0.6 });
  const glassMat = (tint) => new THREE.MeshPhysicalMaterial({
    color: tint, metalness: 0, roughness: 0.05, transmission: 1, thickness: 0.9, ior: 1.45,
    attenuationColor: new THREE.Color(tint), attenuationDistance: 2.5,
    clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 0.25, iridescenceIOR: 1.3, envMapIntensity: 1.1
  });

  /* ---------- Paisaje: suelo y vallas en blanco ---------- */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color: 0xc8cfd5, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const billboardMat = new THREE.MeshStandardMaterial({ color: 0xe9edf0, roughness: 0.5 });
  const postMat = new THREE.MeshStandardMaterial({ color: 0xd9dee3, roughness: 0.6 });
  const rnd = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < 70; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const z = rnd(-130, 25);
    const x = side * (z < -66 ? rnd(17, 44) : rnd(7, 42));
    const g = new THREE.Group();
    if (Math.random() < 0.55) {
      // valla publicitaria sobre postes
      const w = rnd(3, 6), h = w * rnd(0.42, 0.55), lift = rnd(2.5, 5);
      const board = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.18), billboardMat);
      board.position.y = lift + h / 2;
      board.castShadow = true;
      g.add(board);
      [-1, 1].forEach((s) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, lift, 0.16), postMat);
        post.position.set(s * w * 0.3, lift / 2, 0);
        g.add(post);
      });
    } else {
      // monolito / tótem
      const h = rnd(3, 11);
      const m = new THREE.Mesh(new THREE.BoxGeometry(rnd(0.8, 2.2), h, rnd(0.25, 0.6)), billboardMat);
      m.position.y = h / 2;
      m.castShadow = true;
      g.add(m);
    }
    g.position.set(x, 0, z);
    g.rotation.y = rnd(-0.7, 0.7) + (side < 0 ? 0.3 : -0.3);
    scene.add(g);
  }

  /* ---------- Pabellón de cristal ---------- */
  const PAV = 3.4, PAV_Y = 0.25;
  const platform = new THREE.Mesh(new RoundedBoxGeometry(4.6, PAV_Y, 4.6, 3, 0.04), stone);
  platform.position.y = PAV_Y / 2;
  platform.receiveShadow = true;
  platform.castShadow = true;
  scene.add(platform);

  const pavGlass = glassMat(0xf1f6f8);
  const pieces = [];
  const blockGeo = new THREE.BoxGeometry(PAV / 3 - 0.03, PAV / 3 - 0.03, 0.05);
  const cy = PAV_Y + PAV / 2;
  const faces = [
    { n: new THREE.Vector3(0, 0, 1), c: new THREE.Vector3(0, cy, PAV / 2) },
    { n: new THREE.Vector3(0, 0, -1), c: new THREE.Vector3(0, cy, -PAV / 2) },
    { n: new THREE.Vector3(1, 0, 0), c: new THREE.Vector3(PAV / 2, cy, 0) },
    { n: new THREE.Vector3(-1, 0, 0), c: new THREE.Vector3(-PAV / 2, cy, 0) },
    { n: new THREE.Vector3(0, 1, 0), c: new THREE.Vector3(0, PAV_Y + PAV, 0) }
  ];
  const dummy = new THREE.Object3D();
  faces.forEach((f) => {
    dummy.position.set(0, 0, 0);
    dummy.lookAt(f.n);
    const q = dummy.quaternion.clone();
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const local = new THREE.Vector3((c - 1) * (PAV / 3), (r - 1) * (PAV / 3), 0).applyQuaternion(q);
        const mesh = new THREE.Mesh(blockGeo, pavGlass);
        mesh.position.copy(f.c).add(local);
        mesh.quaternion.copy(q);
        scene.add(mesh);
        pieces.push(mesh);
      }
    }
  });
  // perfilería de latón en las aristas
  const e = PAV / 2, t = 0.035;
  const edges = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) edges.push([[sx * e, cy, sz * e], [t, PAV, t]]);
  for (const sy of [PAV_Y, PAV_Y + PAV]) {
    for (const sz of [-1, 1]) edges.push([[0, sy, sz * e], [PAV, t, t]]);
    for (const sx of [-1, 1]) edges.push([[sx * e, sy, 0], [t, t, PAV]]);
  }
  edges.forEach(([p, s]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...s), gold);
    m.position.set(...p);
    m.castShadow = true;
    scene.add(m);
    pieces.push(m);
  });
  pieces.forEach((m) => {
    const out = m.position.clone().sub(new THREE.Vector3(0, cy, 0)).normalize();
    m.userData = {
      p0: m.position.clone(), q0: m.quaternion.clone(),
      dir: out.add(new THREE.Vector3(rnd(-0.4, 0.4), rnd(0, 0.6), rnd(-0.4, 0.4))).normalize(),
      dist: rnd(3.5, 8), up: rnd(0.5, 3), axis: new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize(),
      ang: rnd(-2.5, 2.5), delay: rnd(0, 0.3)
    };
  });

  // monograma AB dentro del pabellón
  const monoPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.7, 64), stone);
  monoPlinth.position.y = PAV_Y + 0.35;
  monoPlinth.castShadow = monoPlinth.receiveShadow = true;
  scene.add(monoPlinth);
  const monogram = new THREE.Group();
  monogram.position.set(0, 2.15, 0);
  scene.add(monogram);
  new FontLoader().load(
    "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/gentilis_bold.typeface.json",
    (font) => {
      const geo = new TextGeometry("AB", { font, size: 0.85, height: 0.16, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.018, bevelSegments: 4 });
      geo.center();
      const mesh = new THREE.Mesh(geo, gold);
      mesh.castShadow = true;
      monogram.add(mesh);
    },
    undefined,
    () => {
      const mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(0.4, 0.1, 160, 16), gold);
      monogram.add(mesh);
    }
  );
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.008, 8, 160), gold);
  monogram.add(halo);

  /* ---------- Vitrinas ---------- */
  const OBJECTS = [
    // 01 JD Sports · arco (espacios corporativos)
    () => {
      const g = new THREE.Group();
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 20, 64, Math.PI), gold);
      arc.position.y = 0.12;
      g.add(arc);
      [-0.3, 0.3].forEach((x) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 24), gold); c.position.set(x, -0.09, 0); g.add(c); });
      const inner = new THREE.Mesh(new THREE.CircleGeometry(0.22, 48, 0, Math.PI), ceramic);
      inner.position.set(0, 0.12, -0.02);
      const innerRect = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.3), ceramic);
      innerRect.position.set(0, -0.03, -0.02);
      g.add(inner, innerRect);
      return g;
    },
    // 02 Senado · micrófono (voz pública)
    () => {
      const g = new THREE.Group();
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 24), ink);
      head.position.y = 0.26;
      const grill = new THREE.Mesh(new THREE.SphereGeometry(0.165, 16, 12), new THREE.MeshStandardMaterial({ color: 0xd8b26e, metalness: 1, roughness: 0.3, wireframe: true }));
      grill.position.y = 0.26;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 12, 48), gold);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.13;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.42, 32), ink);
      body.position.y = -0.08;
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.04, 48), gold);
      base.position.y = -0.31;
      g.add(head, grill, ring, body, base);
      return g;
    },
    // 03 Flash Noticias · megáfono (comunidad)
    () => {
      const g = new THREE.Group();
      const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.08, 0.55, 48, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xd8b26e, metalness: 1, roughness: 0.2, side: THREE.DoubleSide }));
      horn.rotation.z = -Math.PI / 2;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.018, 12, 64), ceramic);
      rim.rotation.y = Math.PI / 2;
      rim.position.x = 0.275;
      const back = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.16, 32), ceramic);
      back.rotation.z = Math.PI / 2;
      back.position.x = -0.34;
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.06), ink);
      grip.position.set(-0.18, -0.17, 0);
      g.add(horn, rim, back, grip);
      g.rotation.z = 0.25;
      return g;
    },
    // 04 Salud Total · sobre (comunicación interna)
    () => {
      const g = new THREE.Group();
      const env = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.46, 0.04, 2, 0.01), ceramic);
      const flapShape = new THREE.Shape([new THREE.Vector2(-0.35, 0.23), new THREE.Vector2(0.35, 0.23), new THREE.Vector2(0, -0.03)]);
      const flap = new THREE.Mesh(new THREE.ExtrudeGeometry(flapShape, { depth: 0.01, bevelEnabled: false }), gold);
      flap.position.z = 0.021;
      const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 32), new THREE.MeshPhysicalMaterial({ color: 0x7a1f24, roughness: 0.4, clearcoat: 1 }));
      seal.rotation.x = Math.PI / 2;
      seal.position.set(0, -0.02, 0.04);
      g.add(env, flap, seal);
      g.rotation.x = -0.15;
      return g;
    },
    // 05 El Transportador · globo (bilingüe)
    () => {
      const g = new THREE.Group();
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.28, 48, 32), ceramic);
      g.add(sphere);
      for (let i = 0; i < 3; i++) {
        const r = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.008, 8, 96), gold);
        r.rotation.y = (i * Math.PI) / 3;
        g.add(r);
      }
      const eq = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 8, 96), gold);
      eq.rotation.x = Math.PI / 2;
      g.add(eq);
      const stand = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.014, 8, 96, Math.PI), gold);
      stand.rotation.z = Math.PI / 2 + 0.4;
      g.add(stand);
      return g;
    },
    // 06 IA · cristal facetado
    () => {
      const g = new THREE.Group();
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), new THREE.MeshPhysicalMaterial({ color: 0xf6f2ff, roughness: 0.1, metalness: 0.1, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.6, flatShading: true }));
      crystal.scale.y = 1.35;
      g.add(crystal);
      for (let i = 0; i < 3; i++) {
        const o = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), gold);
        o.userData.orbit = i;
        g.add(o);
      }
      return g;
    }
  ];

  const vitrines = [];
  for (let k = 0; k < NV; k++) {
    const v = VPOS(k);
    const grp = new THREE.Group();
    grp.position.copy(v);
    scene.add(grp);
    const plinth = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.7, 1.5, 3, 0.03), stone);
    plinth.position.y = 0.35;
    plinth.castShadow = plinth.receiveShadow = true;
    const trim = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.02, 1.52), gold);
    trim.position.y = 0.7;
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.12), gold);
    plaque.position.set(0, 0.45, 0.751);
    const glass = new THREE.Mesh(new RoundedBoxGeometry(1.36, 1.7, 1.36, 4, 0.05), glassMat(GLASS_TINTS[k]));
    glass.position.y = 0.71 + 0.85;
    // inclusiones (como el hielo cristalizado)
    const incl = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const p = new THREE.Mesh(
        new THREE.PlaneGeometry(rnd(0.2, 0.7), rnd(0.2, 0.9)),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: rnd(0.08, 0.22), side: THREE.DoubleSide, depthWrite: false })
      );
      p.position.set(rnd(-0.5, 0.5), rnd(-0.6, 0.6), rnd(-0.5, 0.5));
      p.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
      incl.add(p);
    }
    incl.position.y = glass.position.y;
    const obj = OBJECTS[k]();
    obj.position.y = 1.5;
    obj.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    grp.add(plinth, trim, plaque, glass, incl, obj);
    vitrines.push({ grp, obj, glass });
  }

  /* ---------- Partículas de contacto ---------- */
  const NPART = isMobile() ? 3200 : 6500;
  const pPos = new Float32Array(NPART * 3);
  const pVel = new Float32Array(NPART * 3);
  const pCol = new Float32Array(NPART * 3);
  const pSize = new Float32Array(NPART);
  for (let i = 0; i < NPART; i++) {
    const r = Math.cbrt(Math.random()) * 4, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pPos[i * 3 + 1] = r * Math.cos(ph);
    pPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    pSize[i] = 1;
    pCol[i * 3] = 0.1; pCol[i * 3 + 1] = 0.11; pCol[i * 3 + 2] = 0.13;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("aColor", new THREE.BufferAttribute(pCol, 3));
  pGeo.setAttribute("aSize", new THREE.BufferAttribute(pSize, 1));
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uScale: { value: window.innerHeight * 0.5 } },
    vertexShader: `
      attribute vec3 aColor; attribute float aSize; uniform float uScale; varying vec3 vColor;
      void main(){ vColor = aColor; vec4 mv = modelViewMatrix * vec4(position,1.0);
        gl_PointSize = aSize * uScale * 0.042 / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `
      varying vec3 vColor;
      void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        gl_FragColor = vec4(vColor, smoothstep(0.5, 0.15, d)); }`
  });
  const particles = new THREE.Points(pGeo, pMat);
  particles.position.copy(PART_POS);
  particles.frustumCulled = false;
  scene.add(particles);

  // Figuras: se muestrean de un canvas (texto o dibujo)
  function sampleShape(draw) {
    const S = 256;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d");
    g.fillStyle = "#000";
    g.strokeStyle = "#000";
    g.textAlign = "center";
    g.textBaseline = "middle";
    draw(g, S);
    const data = g.getImageData(0, 0, S, S).data;
    const pts = [];
    for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) if (data[(y * S + x) * 4 + 3] > 128) pts.push(x, y);
    const out = new Float32Array(NPART * 3);
    const W = 5.2;
    for (let i = 0; i < NPART; i++) {
      const j = ((Math.random() * (pts.length / 2)) | 0) * 2;
      out[i * 3] = (pts[j] / S - 0.5) * W + (Math.random() - 0.5) * 0.03;
      out[i * 3 + 1] = (0.5 - pts[j + 1] / S) * W + (Math.random() - 0.5) * 0.03;
      out[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
    }
    return out;
  }
  const SHAPES = {
    ab: sampleShape((g, S) => { g.font = `400 ${S * 0.62}px "Instrument Serif", Georgia, serif`; g.fillText("AB", S / 2, S / 2 + 8); }),
    at: sampleShape((g, S) => { g.font = `400 ${S * 0.8}px "Instrument Serif", Georgia, serif`; g.fillText("@", S / 2, S / 2); }),
    cv: sampleShape((g, S) => {
      g.lineWidth = 10;
      g.strokeRect(S * 0.3, S * 0.14, S * 0.4, S * 0.72);
      g.font = `400 ${S * 0.26}px "Instrument Serif", Georgia, serif`;
      g.fillText("CV", S / 2, S * 0.46);
      g.fillRect(S * 0.37, S * 0.64, S * 0.26, 6);
      g.fillRect(S * 0.37, S * 0.72, S * 0.18, 6);
    }),
    up: sampleShape((g, S) => {
      g.beginPath();
      g.moveTo(S / 2, S * 0.12); g.lineTo(S * 0.8, S * 0.45); g.lineTo(S * 0.6, S * 0.45);
      g.lineTo(S * 0.6, S * 0.88); g.lineTo(S * 0.4, S * 0.88); g.lineTo(S * 0.4, S * 0.45); g.lineTo(S * 0.2, S * 0.45);
      g.closePath(); g.fill();
    })
  };
  let shape = "ab";
  function setShape(name) {
    if (shape === name) return;
    shape = name;
    for (let i = 0; i < NPART * 3; i++) pVel[i] += (Math.random() - 0.5) * 0.12;
    Sound.tick(name === "ab" ? 700 : 1000);
  }
  $$(".links a").forEach((a) => {
    a.addEventListener("pointerenter", () => setShape(a.dataset.shape));
    a.addEventListener("focus", () => setShape(a.dataset.shape));
    a.addEventListener("pointerleave", () => setShape("ab"));
    a.addEventListener("blur", () => setShape("ab"));
  });
  const INK = new THREE.Color(0x1a1d22), GOLD = new THREE.Color(0xc4a674);

  /* ---------- Scroll → progreso ---------- */
  let roomTops = [];
  const measure = () => { roomTops = rooms.map((r) => r.getBoundingClientRect().top + window.scrollY); };
  measure();
  function scrollProgress() {
    const y = window.scrollY + window.innerHeight * 0.45;
    const n = roomTops.length;
    if (y <= roomTops[0]) return 0;
    for (let i = 0; i < n - 1; i++) {
      if (y < roomTops[i + 1]) return i + THREE.MathUtils.smoothstep((y - roomTops[i]) / (roomTops[i + 1] - roomTops[i]), 0.35, 1);
    }
    return n - 1;
  }

  const mouse = new THREE.Vector2(), mouseS = new THREE.Vector2(), ndc = new THREE.Vector2(2, 2);
  window.addEventListener("pointermove", (ev) => {
    mouse.set((ev.clientX / window.innerWidth) * 2 - 1, (ev.clientY / window.innerHeight) * 2 - 1);
    ndc.set(mouse.x, -mouse.y);
  }, { passive: true });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(dpr());
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    composer.setPixelRatio(dpr());
    composer.setSize(window.innerWidth, window.innerHeight);
    pMat.uniforms.uScale.value = window.innerHeight * 0.5 * renderer.getPixelRatio();
    measure();
  });
  pMat.uniforms.uScale.value = window.innerHeight * 0.5 * renderer.getPixelRatio();
  window.addEventListener("load", measure);
  new ResizeObserver(measure).observe(document.body);

  /* ---------- Bucle ---------- */
  const clock = new THREE.Clock();
  const flashEl = $(".flash");
  let progress = scrollProgress(), lastProgress = progress, lastRoom = Math.round(progress);
  let flash = 0, lastFade = -1, visible = true;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), vB = new THREE.Vector3(), sub = new THREE.Vector3(), off = new THREE.Vector3();
  const raycaster = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -PART_POS.z), hit = new THREE.Vector3();
  const qa = new THREE.Quaternion();
  document.addEventListener("visibilitychange", () => { visible = !document.hidden; if (visible) clock.getDelta(); });

  const lerpKey = (a, b, f, prop, out) => out.fromArray(KEYS[a][prop]).lerp(vB.fromArray(KEYS[b][prop]), f);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const tm = reduceMotion ? 0 : t;

    progress += (scrollProgress() - progress) * (reduceMotion ? 1 : Math.min(1, dt * 3));
    const velocity = Math.abs(progress - lastProgress) / Math.max(dt, 0.001);
    lastProgress = progress;
    const a = Math.floor(progress), b = Math.min(a + 1, KEYS.length - 1), f = progress - a;

    // Flash de cámara al llegar a cada vitrina
    const room = Math.round(progress);
    if (room !== lastRoom) {
      if (room >= 2 && room <= 7 && !reduceMotion) { flash = 1; Sound.shutter(); }
      lastRoom = room;
    }
    flash = Math.max(0, flash - dt * 2.4);
    flashEl.style.opacity = (flash * flash * 0.75).toFixed(3);

    const fade = THREE.MathUtils.lerp(KEYS[a].fade, KEYS[b].fade, f);
    if (Math.abs(fade - lastFade) > 0.004) { canvas.style.opacity = fade.toFixed(3); lastFade = fade; }

    // Cámara
    lerpKey(a, b, f, "cam", camPos);
    lerpKey(a, b, f, "look", camLook);
    if (isMobile()) {
      lerpKey(a, b, f, "subject", sub);
      off.copy(camPos).sub(camLook);
      camLook.copy(sub);
      camPos.copy(sub).addScaledVector(off, 1.45);
      camPos.y += 0.3;
    }
    mouseS.lerp(mouse, Math.min(1, dt * 2.5));
    camPos.x += mouseS.x * 0.3;
    camPos.y -= mouseS.y * 0.18;
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    sun.position.copy(camLook).add(off.set(6, 12, 8));
    sun.target.position.copy(camLook);

    // Separación RGB: más intensa a mitad de transición y con la velocidad
    const pulse = Math.pow(Math.sin(Math.PI * f), 2);
    finish.uniforms.uAmount.value = reduceMotion ? 0 : 0.0025 + pulse * 0.012 + Math.min(0.025, velocity * 0.01) + flash * 0.02;
    finish.uniforms.uTime.value = t % 100;

    // Pabellón: se desmonta en sus paneles
    const ex = ease(progress / 1.0);
    pieces.forEach((m) => {
      const u = m.userData;
      const k = ease((ex - u.delay) / 0.7);
      m.position.copy(u.p0).addScaledVector(u.dir, u.dist * k);
      m.position.y += u.up * k * k + Math.sin(tm * 0.6 + u.ang) * 0.05 * k;
      qa.setFromAxisAngle(u.axis, u.ang * k + tm * 0.05 * k);
      m.quaternion.copy(u.q0).multiply(qa);
    });
    monogram.rotation.y = Math.sin(tm * 0.45) * 0.55 + mouseS.x * 0.3;
    monogram.position.y = 2.15 + Math.sin(tm * 0.8) * 0.05;
    halo.rotation.x = Math.PI / 2 + Math.sin(tm * 0.4) * 0.2;

    // Vitrinas: objetos girando
    vitrines.forEach(({ obj }, k) => {
      obj.rotation.y = tm * 0.45 + k;
      obj.position.y = 1.5 + Math.sin(tm * 0.9 + k) * 0.03;
      obj.children.forEach((c) => {
        if (c.userData.orbit === undefined) return;
        const ang = tm * 1.2 + (c.userData.orbit * Math.PI * 2) / 3;
        c.position.set(Math.cos(ang) * 0.42, Math.sin(ang * 1.3) * 0.15, Math.sin(ang) * 0.42);
      });
    });

    // Partículas de contacto (solo visibles y simuladas cerca del final)
    particles.visible = progress > KEYS.length - 2.4;
    if (particles.visible) {
      raycaster.setFromCamera(ndc, camera);
      const has = raycaster.ray.intersectPlane(plane, hit);
      const mx = has ? hit.x - PART_POS.x : 99, my = has ? hit.y - PART_POS.y : 99;
      const T = SHAPES[shape];
      const swirl = 0.012;
      for (let i = 0; i < NPART; i++) {
        const i3 = i * 3;
        const x = pPos[i3], y = pPos[i3 + 1], z = pPos[i3 + 2];
        const dx = T[i3] - x, dy = T[i3 + 1] - y, dz = T[i3 + 2] - z;
        let vx = pVel[i3] + dx * 0.04 - dy * swirl;
        let vy = pVel[i3 + 1] + dy * 0.04 + dx * swirl;
        let vz = pVel[i3 + 2] + dz * 0.04;
        const rx = x - mx, ry = y - my, d2 = rx * rx + ry * ry;
        if (d2 < 0.5) { const fr = (0.5 - d2) * 0.09; vx += rx * fr; vy += ry * fr; vz += fr * 0.5; }
        vx *= 0.86; vy *= 0.86; vz *= 0.86;
        pVel[i3] = vx; pVel[i3 + 1] = vy; pVel[i3 + 2] = vz;
        pPos[i3] = x + vx; pPos[i3 + 1] = y + vy; pPos[i3 + 2] = z + vz;
        const sp = Math.min(1, Math.sqrt(vx * vx + vy * vy + vz * vz) * 14);
        pCol[i3] = INK.r + (GOLD.r - INK.r) * sp;
        pCol[i3 + 1] = INK.g + (GOLD.g - INK.g) * sp;
        pCol[i3 + 2] = INK.b + (GOLD.b - INK.b) * sp;
        pSize[i] = 1 + sp * 1.4;
      }
      pGeo.attributes.position.needsUpdate = true;
      pGeo.attributes.aColor.needsUpdate = true;
      pGeo.attributes.aSize.needsUpdate = true;
    }

    composer.render();
  }

  frame();
  requestAnimationFrame(() => requestAnimationFrame(() => window.dispatchEvent(new Event("scene-ready"))));
}

const fontsReady = document.fonts
  ? Promise.all([document.fonts.load('400 120px "Instrument Serif"'), document.fonts.load('400 12px "JetBrains Mono"')]).catch(() => {})
  : Promise.resolve();
Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]).then(() => {
  try { initScene(); }
  catch (err) { console.error(err); root.classList.add("no-webgl"); window.dispatchEvent(new Event("scene-ready")); }
});
