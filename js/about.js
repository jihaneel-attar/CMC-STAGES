/* CMC stages — À propos page
   Counts the key figures up once their row scrolls into view.
   Shared behaviour (menu, sticky header, session) lives in js/main.js. */

(function () {
  'use strict';

  var row = document.getElementById('key-figures');
  var figures = row ? row.querySelectorAll('[data-count]') : [];
  if (!figures.length) { return; }

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reduced motion or no IntersectionObserver: keep the final numbers from the HTML
  if (reduceMotion || !('IntersectionObserver' in window)) { return; }

  var DURATION_MS = 1400;

  // 34000 → "34 000" (non-breaking space as thousands separator, French style)
  var formatNumber = function (n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  var render = function (el, value) {
    el.textContent = formatNumber(value) + (el.dataset.suffix || '');
  };

  var animate = function (el) {
    var target = parseInt(el.dataset.count, 10);
    var start = null;

    var step = function (now) {
      if (start === null) { start = now; }
      var progress = Math.min((now - start) / DURATION_MS, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      render(el, Math.round(target * eased));
      if (progress < 1) { requestAnimationFrame(step); }
    };

    requestAnimationFrame(step);
  };

  // Start from zero; the accessible name keeps the real figure
  figures.forEach(function (el) {
    el.setAttribute('aria-label', el.textContent.trim());
    render(el, 0);
  });

  var observer = new IntersectionObserver(function (entries) {
    if (!entries.some(function (entry) { return entry.isIntersecting; })) { return; }
    figures.forEach(animate);
    observer.disconnect(); // runs once
  }, { threshold: 0.3 });

  observer.observe(row);
})();
