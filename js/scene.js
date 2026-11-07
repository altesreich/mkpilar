/* ==========================================================
   Archivo Orbital · escena 3D del "Museo oscuro"
   Three.js r160 · sin build, servido por import map
   ========================================================== */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Reflector } from "three/addons/objects/Reflector.js";

const ready = () => window.dispatchEvent(new Event("scene-ready"));

const canvas = document.getElementById("scene");
const mqMobile = window.matchMedia("(max-width: 760px)");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Fichas del archivo (solo datos del CV) ---------- */
const CARD_LABELS = [
  "2018", "Bogotá", "El Transportador", "2020", "Ibagué", "Salud Total",
  "Flash Noticias", "ONG", "2022", "Senado", "100K+", "Crisis",
  "Community", "KPIs", "2023", "JD Sports", "Londres", "Employer branding",
  "Cultura", "Storyboard", "2025", "IA generativa", "Prompting", "UX/UI",
  "Storytelling", "Contenido", "Canva", "CapCut", "Periodismo", "Tarancón"
];
const N = CARD_LABELS.length;

/* ---------- Estados por sala ---------- */
// cam/look: cámara · layout: disposición de las fichas · ring: escala de anillos · core: escala del núcleo
const KEYS = [
  { cam: [0.0, 2.3, 7.4], look: [-1.7, 2.0, 0.0], layout: "orbit",  ring: 1.0,  core: 1.0,  key: 1.0 },
  { cam: [5.0, 3.6, 6.8], look: [2.0, 1.9, 0.0],  layout: "halo",   ring: 1.2,  core: 0.85, key: 0.9 },
  { cam: [-6.0, 2.5, 5.8], look: [-0.9, 2.1, 2.0], layout: "helix", ring: 0.85, core: 0.7,  key: 0.85 },
  { cam: [1.2, 2.8, 9.2], look: [-2.9, 2.3, 0.0], layout: "sphere", ring: 1.3,  core: 1.1,  key: 1.0 },
  { cam: [0.0, 3.0, 9.0], look: [0.0, 2.6, 0.0],  layout: "grid",   ring: 1.15, core: 0.6,  key: 0.6 },
  { cam: [0.0, 1.5, 11.5], look: [0.0, 3.5, 0.0], layout: "orbit",  ring: 1.05, core: 1.0,  key: 1.0 }
];

const BRASS = 0xc9a66b;
const SCULPT_Y = 2.15;

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !mqMobile.matches,
      powerPreference: "high-performance"
    });
  } catch (err) {
    document.documentElement.classList.add("no-webgl");
    ready();
    return;
  }

  const isMobile = () => mqMobile.matches;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile() ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const BG = new THREE.Color(0x070709);
  scene.background = BG;
  scene.fog = new THREE.FogExp2(BG, 0.06);

  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 80);
  camera.position.set(0, 2.3, 7.4);

  // Entorno de estudio para los reflejos metálicos / cerámicos
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  pmrem.dispose();

  /* ---------- Luces de galería ---------- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.04));

  const key = new THREE.SpotLight(0xffe2bd, 140, 22, 0.34, 0.65, 2);
  key.position.set(0.4, 9.5, 1.6);
  key.target.position.set(0, SCULPT_Y - 0.6, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  key.shadow.radius = 4;
  scene.add(key, key.target);

  const rim = new THREE.SpotLight(0x9db5c8, 60, 20, 0.5, 0.9, 2);
  rim.position.set(-3.5, 6.5, -5.5);
  rim.target.position.set(0, SCULPT_Y, 0);
  scene.add(rim, rim.target);

  const warm = new THREE.PointLight(BRASS, 3.2, 6, 2);
  warm.position.set(2.2, 0.8, 2.2);
  scene.add(warm);

  /* ---------- Suelo pulido ---------- */
  const floorGeo = new THREE.PlaneGeometry(60, 60);
  let reflector = null;
  if (!isMobile()) {
    reflector = new Reflector(floorGeo, {
      textureWidth: Math.floor(window.innerWidth * 0.5),
      textureHeight: Math.floor(window.innerHeight * 0.5),
      color: 0x3a3a3e,
      clipBias: 0.003
    });
    reflector.rotation.x = -Math.PI / 2;
    scene.add(reflector);
  }
  const floor = new THREE.Mesh(
    floorGeo,
    new THREE.MeshStandardMaterial({
      color: 0x0a0a0c,
      roughness: 0.55,
      metalness: 0.2,
      envMapIntensity: 0.12,
      transparent: !!reflector,
      opacity: reflector ? 0.74 : 1
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.002;
  floor.receiveShadow = true;
  scene.add(floor);

  /* ---------- Arquitectura del museo ---------- */
  const stone = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.5, metalness: 0.15, envMapIntensity: 0.18 });
  const brassMat = new THREE.MeshStandardMaterial({ color: BRASS, roughness: 0.28, metalness: 1, envMapIntensity: 1.2 });

  // Pedestal principal
  const plinth = new THREE.Group();
  const plinthBody = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.95, 1.7), stone);
  plinthBody.position.y = 0.475;
  plinthBody.castShadow = true;
  plinthBody.receiveShadow = true;
  const plinthTrim = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.018, 1.72), brassMat);
  plinthTrim.position.y = 0.9;
  const plinthBase = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.06, 1.86), stone);
  plinthBase.position.y = 0.03;
  plinth.add(plinthBody, plinthTrim, plinthBase);
  scene.add(plinth);

  // Columnas que se pierden en la oscuridad
  const columnGeo = new THREE.BoxGeometry(0.8, 14, 0.8);
  const columns = new THREE.InstancedMesh(columnGeo, stone, 12);
  const m4 = new THREE.Matrix4();
  let ci = 0;
  for (const x of [-7.5, 7.5]) {
    for (const z of [-18, -12, -6, 0, 6, 12]) {
      m4.makeTranslation(x, 7, z);
      columns.setMatrixAt(ci++, m4);
    }
  }
  scene.add(columns);

  // Haces de luz falsos (volumétricos) + pedestales secundarios
  const coneMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(0xffe2bd) }, uOpacity: { value: 0.16 } },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float edge = pow(abs(dot(vN, vV)), 2.2);
        float fade = smoothstep(0.0, 0.9, vUv.y) * (1.0 - smoothstep(0.92, 1.0, vUv.y) * 0.6);
        gl_FragColor = vec4(uColor, edge * fade * uOpacity);
      }`
  });

  function lightCone(x, z, height, radius, opacity) {
    const geo = new THREE.ConeGeometry(radius, height, 48, 1, true);
    const mat = coneMat.clone();
    mat.uniforms.uOpacity.value = opacity;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, height / 2, z);
    scene.add(mesh);
    return mesh;
  }

  const mainCone = lightCone(0.1, 0.3, 9.6, 1.9, 0.13);

  const sideExhibits = [
    [-4.2, -5.5], [4.2, -6.5], [-4.6, -12], [4.4, -13.5]
  ];
  const artifactGeos = [
    new THREE.TorusKnotGeometry(0.22, 0.06, 96, 12),
    new THREE.OctahedronGeometry(0.3, 0),
    new THREE.TorusGeometry(0.26, 0.05, 16, 64),
    new THREE.DodecahedronGeometry(0.28, 0)
  ];
  const ceramic = new THREE.MeshPhysicalMaterial({
    color: 0xe8e2d6, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12
  });
  const artifacts = [];
  sideExhibits.forEach(([x, z], i) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.9), stone);
    p.position.set(x, 0.55, z);
    scene.add(p);
    const a = new THREE.Mesh(artifactGeos[i], i % 2 ? brassMat : ceramic);
    a.position.set(x, 1.55, z);
    scene.add(a);
    artifacts.push(a);
    lightCone(x, z, 9, 0.9, 0.07);
  });

  // Polvo suspendido en el haz de luz
  const DUST = isMobile() ? 220 : 520;
  const dustPos = new Float32Array(DUST * 3);
  const dustSpeed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    const r = Math.sqrt(Math.random()) * 1.8;
    const a = Math.random() * Math.PI * 2;
    dustPos[i * 3] = Math.cos(a) * r;
    dustPos[i * 3 + 1] = Math.random() * 8.5;
    dustPos[i * 3 + 2] = Math.sin(a) * r + 0.3;
    dustSpeed[i] = 0.04 + Math.random() * 0.1;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: 0xffe9c9, size: 0.018, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    })
  );
  scene.add(dust);

  /* ---------- Escultura: Archivo Orbital ---------- */
  const sculpture = new THREE.Group();
  sculpture.position.y = SCULPT_Y;
  scene.add(sculpture);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.6, 0),
    new THREE.MeshPhysicalMaterial({
      color: 0xebe5d9, roughness: 0.26, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08,
      flatShading: true, envMapIntensity: 1.1
    })
  );
  core.castShadow = true;
  sculpture.add(core);

  const coreCage = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.86, 1)),
    new THREE.LineBasicMaterial({ color: BRASS, transparent: true, opacity: 0.35 })
  );
  sculpture.add(coreCage);

  // Anillos armilares
  const RING_DEF = [
    { r: 1.35, tilt: new THREE.Euler(Math.PI / 2 - 0.35, 0, 0.2), speed: 0.12 },
    { r: 1.75, tilt: new THREE.Euler(Math.PI / 2 + 0.28, 0, -0.55), speed: -0.085 },
    { r: 2.15, tilt: new THREE.Euler(Math.PI / 2 - 0.12, 0, 0.95), speed: 0.06 }
  ];
  const ringGroup = new THREE.Group();
  sculpture.add(ringGroup);
  const ringPivots = RING_DEF.map((d) => {
    const pivot = new THREE.Group();
    pivot.rotation.copy(d.tilt);
    const torus = new THREE.Mesh(new THREE.TorusGeometry(d.r, 0.007, 8, 200), brassMat);
    pivot.add(torus);
    const spinner = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), brassMat);
      const a = (k / 3) * Math.PI * 2;
      bead.position.set(Math.cos(a) * d.r, Math.sin(a) * d.r, 0);
      spinner.add(bead);
    }
    pivot.add(spinner);
    ringGroup.add(pivot);
    return { pivot, spinner };
  });

  /* ---------- Fichas de archivo (texturas en canvas) ---------- */
  function makeCardTexture(label, idx) {
    const W = 256, H = 352;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#1a191d");
    grd.addColorStop(1, "#0b0b0d");
    g.fillStyle = grd;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(201,166,107,0.9)";
    g.lineWidth = 2;
    g.strokeRect(9, 9, W - 18, H - 18);
    g.strokeStyle = "rgba(201,166,107,0.28)";
    g.lineWidth = 1;
    g.strokeRect(18, 18, W - 36, H - 36);

    g.fillStyle = "#c9a66b";
    g.font = '500 14px "IBM Plex Mono", monospace';
    g.textAlign = "left";
    g.fillText("Nº " + String(idx + 1).padStart(2, "0"), 32, 48);
    g.textAlign = "right";
    g.fillText("AB", W - 32, 48);

    g.beginPath();
    g.moveTo(32, 62); g.lineTo(W - 32, 62);
    g.strokeStyle = "rgba(201,166,107,0.35)";
    g.stroke();

    g.fillStyle = "#ece6da";
    g.textAlign = "center";
    g.textBaseline = "middle";
    const maxW = W - 56;
    const words = label.split(" ");
    let size = 58;
    const setFont = (s) => (g.font = `500 ${s}px "Cormorant Garamond", Georgia, serif`);
    setFont(size);
    if (words.length > 1 && g.measureText(label).width > maxW) {
      size = 44;
      setFont(size);
      while (size > 22 && Math.max(...words.map((w) => g.measureText(w).width)) > maxW) setFont(--size);
      const lh = size * 1.05;
      words.forEach((w, i) => g.fillText(w, W / 2, H / 2 + (i - (words.length - 1) / 2) * lh));
    } else {
      while (size > 22 && g.measureText(label).width > maxW) setFont(--size);
      g.fillText(label, W / 2, H / 2);
    }

    g.textBaseline = "alphabetic";
    g.fillStyle = "rgba(236,230,218,0.42)";
    g.font = '500 11px "IBM Plex Mono", monospace';
    g.fillText("ARCHIVO ORBITAL", W / 2, H - 40);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tex;
  }

  function makeBackTexture() {
    const W = 256, H = 352;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    g.fillStyle = "#0e0e10";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(201,166,107,0.55)";
    g.lineWidth = 2;
    g.strokeRect(9, 9, W - 18, H - 18);
    g.beginPath();
    g.arc(W / 2, H / 2, 46, 0, Math.PI * 2);
    g.lineWidth = 1.5;
    g.stroke();
    g.fillStyle = "#c9a66b";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = '500 40px "Cormorant Garamond", Georgia, serif';
    g.fillText("AB", W / 2, H / 2 + 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const cardGeo = new THREE.PlaneGeometry(0.32, 0.44);
  const backTex = makeBackTexture();
  const backMat = new THREE.MeshStandardMaterial({
    map: backTex, emissiveMap: backTex, emissive: 0xffffff, emissiveIntensity: 0.3,
    roughness: 0.5, metalness: 0.2, envMapIntensity: 0.35
  });
  const cards = CARD_LABELS.map((label, i) => {
    const tex = makeCardTexture(label, i);
    const mat = new THREE.MeshStandardMaterial({
      map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.42,
      roughness: 0.45, metalness: 0.15, envMapIntensity: 0.35
    });
    const card = new THREE.Group();
    const front = new THREE.Mesh(cardGeo, mat);
    const back = new THREE.Mesh(cardGeo, backMat);
    back.rotation.y = Math.PI;
    front.castShadow = back.castShadow = true;
    card.add(front, back);
    sculpture.add(card);
    return card;
  });

  /* ---------- Disposiciones de las fichas ---------- */
  const dummy = new THREE.Object3D();
  const tmpV = new THREE.Vector3();

  function faceOutward(out, pos) {
    dummy.position.copy(pos);
    dummy.lookAt(tmpV.copy(pos).multiplyScalar(2));
    out.quaternion.copy(dummy.quaternion);
  }

  const LAYOUTS = {
    orbit(i, t, out) {
      const ring = i % 3;
      const k = Math.floor(i / 3);
      const d = RING_DEF[ring];
      const a = (k / (N / 3)) * Math.PI * 2 + t * d.speed * 1.6 + ring;
      out.position.set(Math.cos(a) * d.r, Math.sin(a) * d.r, 0).applyEuler(d.tilt);
      faceOutward(out, out.position);
    },
    halo(i, t, out) {
      const a = (i / N) * Math.PI * 2 + t * 0.05;
      const r = 2.5;
      out.position.set(Math.cos(a) * r, Math.sin(i * 1.7) * 0.08 - 0.1, Math.sin(a) * r);
      dummy.position.copy(out.position);
      dummy.lookAt(out.position.x * 2, out.position.y, out.position.z * 2);
      out.quaternion.copy(dummy.quaternion);
    },
    helix(i, t, out) {
      // Línea de tiempo: de 2018 (abajo) a 2025 (arriba)
      const a = i * 0.46 + t * 0.06;
      const y = (i / (N - 1) - 0.5) * 3.4;
      const r = 1.85;
      out.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      dummy.position.copy(out.position);
      dummy.lookAt(out.position.x * 2, y, out.position.z * 2);
      out.quaternion.copy(dummy.quaternion);
    },
    sphere(i, t, out) {
      const golden = Math.PI * (3 - Math.sqrt(5));
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const a = golden * i + t * 0.08;
      const R = 2.1;
      out.position.set(Math.cos(a) * rad * R, y * R * 0.92, Math.sin(a) * rad * R);
      faceOutward(out, out.position);
    },
    grid(i, t, out) {
      const cols = 10;
      const c = i % cols;
      const r = Math.floor(i / cols);
      const x = (c - (cols - 1) / 2) * 0.42;
      const y = (1 - r) * 0.56 + Math.sin(t * 0.6 + i) * 0.01;
      out.position.set(x, y, -1.6 + x * x * 0.11);
      dummy.position.copy(out.position);
      dummy.lookAt(0, y, 6);
      out.quaternion.copy(dummy.quaternion);
    }
  };

  const stateA = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() };
  const stateB = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() };

  /* ---------- Scroll → progreso por salas ---------- */
  const rooms = Array.from(document.querySelectorAll("[data-room]"));
  let roomTops = [];
  function measure() {
    roomTops = rooms.map((r) => r.getBoundingClientRect().top + window.scrollY);
  }
  measure();

  function scrollProgress() {
    const y = window.scrollY + window.innerHeight * 0.4;
    const n = roomTops.length;
    if (y <= roomTops[0]) return 0;
    for (let i = 0; i < n - 1; i++) {
      if (y < roomTops[i + 1]) {
        const f = (y - roomTops[i]) / (roomTops[i + 1] - roomTops[i]);
        // mantiene el estado la mayor parte de la sala y transiciona al final
        const e = THREE.MathUtils.smoothstep(f, 0.45, 1.0);
        return i + e;
      }
    }
    return n - 1;
  }

  /* ---------- Interacción ---------- */
  const mouse = new THREE.Vector2();
  const mouseS = new THREE.Vector2();
  window.addEventListener("pointermove", (e) => {
    mouse.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile() ? 1.5 : 2));
    renderer.setSize(w, h, false);
    measure();
  }
  window.addEventListener("resize", onResize);
  window.addEventListener("load", measure);
  if (window.ResizeObserver) new ResizeObserver(measure).observe(document.body);

  /* ---------- Bucle ---------- */
  const clock = new THREE.Clock();
  let progress = scrollProgress();
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const vB = new THREE.Vector3();
  let intro = reduceMotion ? 1 : 0;
  let visible = true;

  document.addEventListener("visibilitychange", () => {
    visible = !document.hidden;
    if (visible) clock.getDelta();
  });

  function lerpKey(a, b, f, prop, out) {
    return out.fromArray(KEYS[a][prop]).lerp(vB.fromArray(KEYS[b][prop]), f);
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = reduceMotion ? 0 : clock.elapsedTime;

    intro = Math.min(1, intro + dt / 2.4);
    const introE = 1 - Math.pow(1 - intro, 3);

    const target = scrollProgress();
    progress += (target - progress) * (reduceMotion ? 1 : Math.min(1, dt * 3.2));

    const a = Math.floor(progress);
    const b = Math.min(a + 1, KEYS.length - 1);
    const f = progress - a;

    // Cámara
    lerpKey(a, b, f, "cam", camPos);
    lerpKey(a, b, f, "look", camLook);
    if (isMobile()) {
      camLook.x *= 0.15;
      camPos.x *= 0.8;
      camPos.z *= 1.32;
      camPos.y += 0.4;
      camLook.y += 1.5;
    }
    mouseS.lerp(mouse, Math.min(1, dt * 2.5));
    camPos.x += mouseS.x * 0.35;
    camPos.y -= mouseS.y * 0.18;
    // pequeño "dolly" de entrada
    camPos.z += (1 - introE) * 3.5;
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    // Escultura
    const ringScale = THREE.MathUtils.lerp(KEYS[a].ring, KEYS[b].ring, f);
    const coreScale = THREE.MathUtils.lerp(KEYS[a].core, KEYS[b].core, f);
    ringGroup.scale.setScalar(ringScale * (0.6 + 0.4 * introE));
    core.scale.setScalar(Math.max(0.001, coreScale * introE));
    coreCage.scale.setScalar(Math.max(0.001, coreScale * introE));
    core.rotation.set(t * 0.13, t * 0.21, 0);
    coreCage.rotation.set(-t * 0.07, -t * 0.11, 0);
    sculpture.rotation.y = mouseS.x * 0.18;
    sculpture.rotation.x = mouseS.y * 0.06;
    sculpture.position.y = SCULPT_Y + Math.sin(t * 0.8) * 0.04;
    ringPivots.forEach((rp, i) => { rp.spinner.rotation.z = t * RING_DEF[i].speed * 1.6 + i; });

    // Fichas: mezcla entre la disposición de la sala actual y la siguiente
    const layA = LAYOUTS[KEYS[a].layout];
    const layB = LAYOUTS[KEYS[b].layout];
    for (let i = 0; i < N; i++) {
      const card = cards[i];
      layA(i, t, stateA);
      if (f > 0.0001 && b !== a) {
        layB(i, t, stateB);
        // cascada: cada ficha arranca un poco después
        const stagger = (i / N) * 0.35;
        const fi = THREE.MathUtils.smoothstep(THREE.MathUtils.clamp((f - stagger) / 0.65, 0, 1), 0, 1);
        card.position.copy(stateA.position).lerp(stateB.position, fi);
        card.quaternion.copy(stateA.quaternion).slerp(stateB.quaternion, fi);
      } else {
        card.position.copy(stateA.position);
        card.quaternion.copy(stateA.quaternion);
      }
      const ci = THREE.MathUtils.clamp(introE * 1.6 - (i / N) * 0.6, 0, 1);
      card.position.multiplyScalar(ci);
      card.scale.setScalar(Math.max(0.001, ci));
    }

    // Luces
    key.intensity = 140 * THREE.MathUtils.lerp(KEYS[a].key, KEYS[b].key, f) * introE;
    mainCone.material.uniforms.uOpacity.value = 0.13 * introE;

    // Piezas secundarias
    artifacts.forEach((obj, i) => {
      obj.rotation.y = t * (0.2 + i * 0.05);
      obj.rotation.x = t * 0.1;
    });

    // Polvo
    if (!reduceMotion) {
      const pos = dustGeo.attributes.position.array;
      for (let i = 0; i < DUST; i++) {
        pos[i * 3 + 1] += dustSpeed[i] * dt;
        pos[i * 3] += Math.sin(t * 0.3 + i) * 0.0008;
        if (pos[i * 3 + 1] > 8.5) pos[i * 3 + 1] = 0.2;
      }
      dustGeo.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  frame();
  // un frame pintado antes de quitar el loader
  requestAnimationFrame(() => requestAnimationFrame(ready));
}

/* Espera a las fuentes para que las fichas se dibujen con la tipografía correcta */
const fontsReady = document.fonts
  ? Promise.all([
      document.fonts.load('500 58px "Cormorant Garamond"'),
      document.fonts.load('500 14px "IBM Plex Mono"')
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
