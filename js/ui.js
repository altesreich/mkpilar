/* Adriana Bello · portafolio · interfaz (independiente de la escena 3D) */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Loader: línea de progreso ---------- */
  var loaded = false;
  var barEl = document.querySelector(".loader__bar i");
  var shown = 0;
  var loaderTimer = setInterval(function () {
    var target = loaded ? 100 : Math.min(90, shown + 6);
    shown += (target - shown) * 0.25;
    if (barEl) barEl.style.width = shown.toFixed(1) + "%";
    if (loaded && shown > 98.5) {
      clearInterval(loaderTimer);
      if (barEl) barEl.style.width = "100%";
      setTimeout(function () { root.classList.add("is-loaded"); }, 300);
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
    root.classList.toggle("is-scrolled", window.scrollY > 40);
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
        var name = entry.target.getAttribute("data-name");
        if (sectionEl.textContent === name) return;
        sectionEl.classList.add("is-changing");
        setTimeout(function () {
          sectionEl.textContent = name;
          sectionEl.classList.remove("is-changing");
        }, reduceMotion ? 0 : 300);
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
  // índice de cada hijo para la entrada en cascada
  reveals.forEach(function (el) {
    Array.prototype.forEach.call(el.children, function (child, i) { child.style.setProperty("--i", i); });
  });
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-visible");
        el.querySelectorAll("[data-count]").forEach(animateCount);
        revealObserver.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
    document.querySelectorAll("[data-count]").forEach(animateCount);
  }
})();
