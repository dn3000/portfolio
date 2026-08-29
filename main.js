/* ============================================================
   Dennis Nleya — dennisnleya.ca
   Vanilla JS. Two jobs: one page-load sequence, subtle scroll
   reveals. Everything short-circuits under reduced motion, and
   nothing is allowed to leave content permanently invisible.
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var supportsIO = "IntersectionObserver" in window;

  /* --- Footer year --------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* --- Other-work carousel (runs in every motion mode) ---- */
  (function () {
    var track = document.getElementById("work-carousel");
    if (!track) return;
    var prev = document.querySelector('.carousel__btn[data-dir="-1"]');
    var next = document.querySelector('.carousel__btn[data-dir="1"]');
    var controls = document.querySelector(".carousel__controls");

    function step() {
      var card = track.querySelector(".wcard");
      return card ? card.getBoundingClientRect().width + 16 : 300;
    }
    function scrollByDir(dir) {
      track.scrollBy({ left: step() * dir, behavior: reduced ? "auto" : "smooth" });
    }
    if (prev) prev.addEventListener("click", function () { scrollByDir(-1); });
    if (next) next.addEventListener("click", function () { scrollByDir(1); });

    function update() {
      var max = track.scrollWidth - track.clientWidth - 2;
      var overflowing = track.scrollWidth > track.clientWidth + 4;
      if (controls) controls.style.display = overflowing ? "" : "none";
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
    }
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  })();

  /* Hard-show: wins even over a transition that never got frames. */
  function settle(el) {
    el.classList.add("is-in");
    el.style.opacity = "1";
    el.style.transform = "none";
  }

  function showAll() {
    var all = document.querySelectorAll(".reveal, .reveal-on-scroll, .ledger__row");
    for (var i = 0; i < all.length; i++) all[i].classList.add("is-in");
  }

  /* --- Reduced motion / no IO: show everything, stop ------ */
  if (reduced || !supportsIO) {
    showAll();
    return;
  }

  /* --- 1. Page-load sequence ------------------------------
     Applied synchronously rather than inside requestAnimationFrame:
     rAF is throttled in background tabs, which would leave the hero
     stuck at opacity 0 until the tab is focused. The forced reflow
     gives the transition a start value to animate from. */
  var steps = document.querySelectorAll(".reveal[data-step]");
  var i;
  for (i = 0; i < steps.length; i++) {
    steps[i].style.setProperty(
      "--delay",
      ((parseInt(steps[i].getAttribute("data-step"), 10) || 1) - 1) * 90 + "ms"
    );
  }
  void document.body.offsetHeight;
  for (i = 0; i < steps.length; i++) steps[i].classList.add("is-in");

  /* Failsafe — hero only. The sequence finishes in <1s; if it has
     not, force the end state. Scroll reveals are deliberately not
     included, or they would fire before the user ever scrolls. */
  window.setTimeout(function () {
    for (var k = 0; k < steps.length; k++) settle(steps[k]);
  }, 2000);

  /* --- 2. Scroll reveals ---------------------------------- */
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
  );

  var targets = document.querySelectorAll(".reveal-on-scroll");
  for (i = 0; i < targets.length; i++) io.observe(targets[i]);

  /* --- 3. Ledger: hairlines resolve row by row ------------ */
  var ledger = document.getElementById("ledger-table");
  if (ledger) {
    ledger.classList.add("is-armed");
    var rows = ledger.querySelectorAll(".ledger__row");
    var ledgerIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var row = entry.target;
          var idx = Number(row.dataset.i || 0);
          window.setTimeout(function () {
            row.classList.add("is-in");
          }, idx * 110);
          ledgerIO.unobserve(row);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.2 }
    );
    for (i = 0; i < rows.length; i++) {
      rows[i].dataset.i = i;
      ledgerIO.observe(rows[i]);
    }
  }

  /* --- 4. Reduced motion switched on mid-session ---------- */
  var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  var onChange = function (e) {
    if (e.matches) showAll();
  };
  if (typeof mq.addEventListener === "function") mq.addEventListener("change", onChange);
  else if (typeof mq.addListener === "function") mq.addListener(onChange);
})();
