/* Campaign Studio · interfaz (independiente de la escena 3D) */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Texto "scramble" ---------- */
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·—+#";
  function scramble(el) {
    if (el.dataset.scrambled) return;
    el.dataset.scrambled = "1";
    var final = el.textContent;
    if (reduceMotion) return;
    var frame = 0;
    var total = Math.min(36, 14 + final.length);
    (function tick() {
      var out = "";
      for (var i = 0; i < final.length; i++) {
        var settle = (i / final.length) * total * 0.7 + total * 0.3;
        if (final[i] === " " || frame >= settle) out += final[i];
        else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      frame++;
      if (frame <= total) requestAnimationFrame(tick);
      else el.textContent = final;
    })();
  }

  /* ---------- Loader con contador ---------- */
  var loaded = false;
  var countEl = document.querySelector(".loader__count span");
  var barEl = document.querySelector(".loader__bar i");
  var shown = 0;
  var target = 0;
  var loaderTimer = setInterval(function () {
    target = Math.min(loaded ? 100 : 92, target + Math.random() * 9);
    shown += (target - shown) * 0.35;
    var v = Math.round(shown);
    if (countEl) countEl.textContent = v;
    if (barEl) barEl.style.width = v + "%";
    if (loaded && v >= 99) {
      clearInterval(loaderTimer);
      if (countEl) countEl.textContent = 100;
      setTimeout(function () {
        root.classList.add("is-loaded");
        document.querySelectorAll(".stage--hero [data-scramble]").forEach(scramble);
      }, 250);
    }
  }, 60);
  function finishLoading() { loaded = true; }
  window.addEventListener("scene-ready", finishLoading);
  window.addEventListener("load", function () { setTimeout(finishLoading, 3000); });
  setTimeout(finishLoading, 7000);

  /* ---------- Año ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- HUD: progreso + sección ---------- */
  var bar = document.querySelector(".hud-progress i");
  var pct = document.querySelector(".hud-pct");
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    if (bar) bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
    if (pct) pct.textContent = String(Math.round(p * 100)).padStart(3, "0");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var rooms = Array.prototype.slice.call(document.querySelectorAll("[data-room]"));
  var sectionEl = document.querySelector(".hud-section");
  if ("IntersectionObserver" in window && sectionEl) {
    var roomObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sectionEl.textContent = entry.target.getAttribute("data-name");
        delete sectionEl.dataset.scrambled;
        scramble(sectionEl);
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    rooms.forEach(function (r) { roomObserver.observe(r); });
  }

  /* ---------- Revelado + contadores ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var fmt = new Intl.NumberFormat("es-ES");
    if (reduceMotion) { el.textContent = fmt.format(target); return; }
    var start = performance.now();
    var dur = 1800;
    function tick(now) {
      var t = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - t, 4);
      el.textContent = fmt.format(Math.round(target * e));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-visible");
        el.querySelectorAll("[data-count]").forEach(animateCount);
        el.querySelectorAll("[data-scramble]").forEach(scramble);
        revealObserver.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
    document.querySelectorAll("[data-count]").forEach(animateCount);
  }

  /* ---------- Laboratorio de IA ---------- */
  var CASES = [
    {
      title: "Investigación de audiencia",
      tag: "Insight",
      objective: "Entender qué le importa a una comunidad antes de escribirle una sola línea.",
      prompt:
        "ROL: Actúa como analista de audiencias para una marca de moda deportiva.\n" +
        "CONTEXTO: Te comparto 200 comentarios recientes de Instagram y X, anonimizados.\n" +
        "TAREA: Agrúpalos en 5 tensiones o motivaciones, con 2 citas literales por grupo.\n" +
        "FORMATO: Tabla · tensión · frecuencia estimada · cita · oportunidad de contenido.\n" +
        "LÍMITES: No inventes datos. Marca con [?] lo que no se pueda inferir.",
      deliverable: "Mapa de tensiones de la audiencia y cinco territorios de contenido priorizados.",
      human: "Contrasto cada grupo con las métricas reales de engagement antes de decidir el plan."
    },
    {
      title: "Plan de contenidos",
      tag: "Estrategia",
      objective: "Un calendario editorial con tono propio para cada red, en una mañana.",
      prompt:
        "ROL: Eres estratega de contenidos de una figura pública institucional.\n" +
        "CONTEXTO: Tono sobrio y cercano. Canales: Instagram, X, Facebook y LinkedIn.\n" +
        "TAREA: Propón un calendario de 4 semanas sobre 3 pilares temáticos.\n" +
        "FORMATO: Semana · red · formato · gancho · llamada a la acción · métrica a vigilar.\n" +
        "LÍMITES: Adapta el tono a cada red. Nada de promesas que no podamos cumplir.",
      deliverable: "Calendario editorial por canal, listo para revisión del equipo.",
      human: "Ajusto la voz de cada perfil y lo valido con prensa y asesores antes de publicar."
    },
    {
      title: "Gestión de crisis",
      tag: "Reputación",
      objective: "Responder rápido sin responder mal cuando la conversación se tuerce.",
      prompt:
        "ROL: Asesor/a de comunicación en una crisis en redes, en tiempo real.\n" +
        "CONTEXTO: Una declaración se ha sacado de contexto y crece la conversación negativa.\n" +
        "TAREA: Redacta 3 respuestas: aclaratoria, empática y de cierre.\n" +
        "FORMATO: Máximo 280 caracteres cada una + riesgo principal de cada enfoque.\n" +
        "LÍMITES: Sin confrontar, sin culpar a terceros, solo datos verificables.",
      deliverable: "Borradores de respuesta y matriz de riesgos en minutos, no en horas.",
      human: "La decisión y el tono final los fija la persona responsable: la IA acelera, no firma."
    },
    {
      title: "Informe de KPIs",
      tag: "Analítica",
      objective: "Convertir una exportación de métricas en decisiones para dirección.",
      prompt:
        "ROL: Analista de redes sociales con foco en negocio.\n" +
        "CONTEXTO: Exportación mensual de alcance, engagement y crecimiento por red.\n" +
        "TAREA: Resume qué funcionó, qué no y por qué, en lenguaje ejecutivo.\n" +
        "FORMATO: 3 hallazgos · 3 decisiones · 1 gráfico sugerido por hallazgo.\n" +
        "LÍMITES: Cita la cifra exacta de la que sale cada conclusión.",
      deliverable: "Informe ejecutivo de una página: qué repetir y qué cambiar.",
      human: "Reviso cada cifra contra la fuente original y añado el contexto que los datos no cuentan."
    },
    {
      title: "Storyboard de campaña",
      tag: "Creatividad",
      objective: "Abrir varias rutas creativas para una campaña interna antes de diseñar.",
      prompt:
        "ROL: Director/a creativo/a de campañas internas para una marca global.\n" +
        "CONTEXTO: Lanzamiento de un valor de marca para equipos de tienda y oficinas.\n" +
        "TAREA: 3 conceptos de campaña, cada uno con un storyboard de 6 viñetas.\n" +
        "FORMATO: Concepto · insight · viñeta (plano + texto en pantalla) · pieza física.\n" +
        "LÍMITES: Coherente con la guía de marca. Lenguaje inclusivo.",
      deliverable: "Conceptos y storyboards listos para producir en Canva, Photoshop o CapCut.",
      human: "Elijo y adapto el concepto según la cultura real del equipo y la guía de marca."
    },
    {
      title: "Employer branding",
      tag: "Cultura",
      objective: "Contar la cultura de una empresa con la voz de quienes la viven.",
      prompt:
        "ROL: Especialista en cultura y marca empleadora.\n" +
        "CONTEXTO: Testimonios de nuevas incorporaciones, compartidos con su permiso.\n" +
        "TAREA: Conviértelos en una serie de 5 historias para LinkedIn.\n" +
        "FORMATO: Titular · historia de 120 palabras · cita destacada · visual sugerido.\n" +
        "LÍMITES: Respeta la voz real de cada persona. No añadas logros que no contó.",
      deliverable: "Serie de historias de equipo con voz auténtica y coherencia de marca.",
      human: "Cada texto lo valida su protagonista antes de publicarse."
    }
  ];

  var lab = document.getElementById("lab");
  if (lab) {
    var tabsEl = lab.querySelector(".lab__tabs");
    var objEl = lab.querySelector(".lab__objective");
    var codeEl = lab.querySelector(".lab__prompt code");
    var delEl = lab.querySelector(".lab__deliverable");
    var humEl = lab.querySelector(".lab__human");
    var typingTimer = null;
    var current = -1;

    function escapeHtml(s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function highlight(text) {
      return escapeHtml(text).replace(/^([A-ZÁÉÍÓÚÑ]+):/gm, '<span class="k">$1:</span>');
    }

    function typePrompt(text) {
      clearTimeout(typingTimer);
      if (reduceMotion) {
        codeEl.classList.remove("is-typing");
        codeEl.innerHTML = highlight(text);
        return;
      }
      var i = 0;
      codeEl.classList.add("is-typing");
      (function step() {
        i = Math.min(text.length, i + 3);
        codeEl.innerHTML = highlight(text.slice(0, i));
        if (i < text.length) {
          typingTimer = setTimeout(step, 14);
        } else {
          codeEl.classList.remove("is-typing");
        }
      })();
    }

    function select(idx, focus) {
      if (idx === current) return;
      current = idx;
      var c = CASES[idx];
      tabsEl.querySelectorAll(".lab__tab").forEach(function (btn, i) {
        var on = i === idx;
        btn.setAttribute("aria-selected", on ? "true" : "false");
        btn.tabIndex = on ? 0 : -1;
        if (on && focus) btn.focus();
      });
      objEl.textContent = c.objective;
      delEl.textContent = c.deliverable;
      humEl.textContent = c.human;
      typePrompt(c.prompt);
    }

    CASES.forEach(function (c, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lab__tab";
      btn.setAttribute("role", "tab");
      btn.innerHTML = "<small>" + String(i + 1).padStart(2, "0") + " · " + c.tag + "</small>" + c.title;
      btn.addEventListener("click", function () { select(i, false); });
      btn.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); select((i + 1) % CASES.length, true); }
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); select((i - 1 + CASES.length) % CASES.length, true); }
      });
      tabsEl.appendChild(btn);
    });

    // Escribe el primer prompt cuando la consola entra en pantalla
    if ("IntersectionObserver" in window) {
      var labObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          select(0, false);
          labObserver.disconnect();
        }
      }, { threshold: 0.3 });
      labObserver.observe(lab);
    } else {
      select(0, false);
    }
  }
})();
