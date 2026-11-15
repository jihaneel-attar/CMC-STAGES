/* CMC stages — profile page
   Header user, activity heatmap and project cards, rendered from data.
   Shared behaviour (menu, sticky header, session) lives in js/main.js,
   which must be loaded first. */

(function () {
  'use strict';

  /* ==================================================================
     SAMPLE DATA — replace with real data from the API.
     PROFILE_USER : what the header pill shows.
     ACTIVITY     : { 'YYYY-MM-DD': contributions } — a missing day = 0.
                    Generated with a fixed seed so the picture is stable;
                    swap generateSampleActivity(...) for the real object.
     PROJECTS     : one object per card (see the fields used below).
  ================================================================== */
  var PROFILE_USER = { name: 'Sara', role: 'stagiaire', level: 7 };

  var PERIOD_START = new Date(2025, 8, 1);   // 1 sept. 2025 (a Monday)
  var PERIOD_END   = new Date(2026, 4, 31);  // 31 mai 2026 → 39 weeks
  var STREAK_START = '2025-09-01';
  var STREAK_END   = '2025-09-30';           // inclusive → 30 days (1 sept. – 30 sept.)

  var ACTIVITY = generateSampleActivity(2025, 175, 510); // seed, active days, total

  var PROJECTS = [
    {
      title: 'Plateforme anti-gaspillage',
      tag: 'Prototype',
      time: 'il y a 7 jours',
      steps: ['done', 'current', 'todo'],      // Formateur / Pôle orientation / Recruteur
      status: 'validated',
      statusText: 'Validé par formateur'
    },
    {
      title: 'Application mobile · UI',
      tag: 'UI',
      time: 'il y a 1 mois',
      steps: ['done', 'current', 'todo'],
      status: 'validated',
      statusText: 'Validé par formateur'
    },
    {
      title: 'Portfolio UX case study',
      tag: 'UX',
      time: 'il y a 3 mois',
      steps: ['current', 'todo', 'todo'],
      status: 'pending',
      statusText: 'En attente du formateur'
    }
  ];
  /* ==================== end of sample data ==================== */

  var STEP_LABELS = ['Formateur', 'Pôle orientation', 'Recruteur'];
  var STEP_STATES = { done: 'validé', current: 'en cours', todo: 'à venir' };
  var MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
                   'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

  /* ---------- Helpers ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function isoDate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function formatDay(d) { return d.getDate() + ' ' + MONTHS_FR[d.getMonth()]; }

  function inStreak(key) { return key >= STREAK_START && key <= STREAK_END; }

  // 5 intensity levels: 0, 1–2, 3–4, 5–7, 8+
  function levelFor(count) {
    if (count === 0) { return 0; }
    if (count <= 2) { return 1; }
    if (count <= 4) { return 2; }
    if (count <= 7) { return 3; }
    return 4;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  // Calls fn(date, index) for every day of the period
  function eachDay(fn) {
    var d = new Date(PERIOD_START);
    var i = 0;
    while (d <= PERIOD_END) {
      fn(new Date(d), i++);
      d.setDate(d.getDate() + 1);
    }
  }

  // Small seeded PRNG (mulberry32) so the sample heatmap never changes
  function seededRandom(seed) {
    var t = seed >>> 0;
    return function () {
      t = (t + 0x6D2B79F5) >>> 0;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- Sample activity generator ----------
     Exactly `activeDays` days with at least one contribution (the streak
     days always included) and exactly `total` contributions overall. */
  function generateSampleActivity(seed, activeDays, total) {
    var rand = seededRandom(seed);
    var streakDays = [];
    var otherDays = [];

    eachDay(function (d) {
      var key = isoDate(d);
      (inStreak(key) ? streakDays : otherDays).push(key);
    });

    // Fisher–Yates shuffle, then take as many extra days as needed
    for (var i = otherDays.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var tmp = otherDays[i]; otherDays[i] = otherDays[j]; otherDays[j] = tmp;
    }
    var picked = streakDays.concat(otherDays.slice(0, Math.max(0, activeDays - streakDays.length)));

    var data = {};
    picked.forEach(function (key) { data[key] = 1; });

    var remaining = total - picked.length;
    while (remaining > 0) {
      var key = picked[Math.floor(rand() * picked.length)];
      if (data[key] < 12) { data[key]++; remaining--; }
    }
    return data;
  }

  /* ---------- Heatmap ---------- */
  function renderHeatmap() {
    var grid = document.getElementById('heatmap-grid');
    var months = document.getElementById('heatmap-months');
    var meta = document.getElementById('activity-meta');
    if (!grid || !months) { return; }

    var cells = document.createDocumentFragment();
    var labels = document.createDocumentFragment();
    var total = 0;
    var activeDays = 0;
    var columns = 0;
    var lastMonth = -1;

    // Monday-first grid: pad the first column if the period starts mid-week
    var offset = (PERIOD_START.getDay() + 6) % 7;
    for (var p = 0; p < offset; p++) { cells.appendChild(el('span', 'hm-cell hm-pad')); }

    eachDay(function (d, i) {
      var key = isoDate(d);
      var count = ACTIVITY[key] || 0;

      if ((i + offset) % 7 === 0) {           // a new week column starts
        columns++;
        if (d.getMonth() !== lastMonth) {      // first column of a new month
          var label = el('span', '', MONTHS_FR[d.getMonth()]);
          label.style.gridColumnStart = columns;
          labels.appendChild(label);
          lastMonth = d.getMonth();
        }
      }

      var cell = el('span', 'hm-cell hm-l' + levelFor(count));
      if (inStreak(key)) { cell.classList.add('hm-streak'); }
      cell.title = formatDay(d) + ' : ' + (count === 0
        ? 'aucune contribution'
        : count + ' contribution' + (count > 1 ? 's' : ''));
      cells.appendChild(cell);

      if (count > 0) { activeDays++; total += count; }
    });

    months.style.gridTemplateColumns = 'repeat(' + columns + ', var(--hm-cell))';
    months.appendChild(labels);
    grid.appendChild(cells);

    var range = MONTHS_FR[PERIOD_START.getMonth()] + ' – ' + MONTHS_FR[PERIOD_END.getMonth()];
    grid.setAttribute('aria-label', total + ' contributions sur ' + activeDays + ' jours actifs, ' + range);
    if (meta) { meta.textContent = total + ' contributions · ' + activeDays + ' jours actifs · ' + range; }
  }

  /* ---------- Project cards ---------- */
  function trackLabel(steps) {
    return steps.map(function (state, i) {
      return STEP_LABELS[i] + ' : ' + STEP_STATES[state];
    }).join(', ');
  }

  function renderProjects() {
    var grid = document.getElementById('projects-grid');
    if (!grid) { return; }

    PROJECTS.forEach(function (project) {
      var card = el('article', 'project-card');
      card.dataset.status = project.status;

      var top = el('div', 'project-top');
      top.appendChild(el('span', 'project-tag glass', project.tag));
      top.appendChild(el('span', 'project-time', project.time));
      card.appendChild(top);

      card.appendChild(el('h3', 'project-title', project.title));

      var track = el('div', 'track');
      track.setAttribute('role', 'img');
      track.setAttribute('aria-label', trackLabel(project.steps));
      project.steps.forEach(function (state) {
        track.appendChild(el('span', 'track-seg is-' + state));
      });
      card.appendChild(track);

      var stepLabels = el('div', 'track-labels');
      STEP_LABELS.forEach(function (name) { stepLabels.appendChild(el('span', '', name)); });
      card.appendChild(stepLabels);

      var status = el('p', 'project-status');
      status.appendChild(el('span', 'status-dot is-' + project.status));
      status.appendChild(el('span', '', project.statusText));
      card.appendChild(status);

      grid.appendChild(card);
    });
  }

  /* ---------- Filter pills ---------- */
  function setupFilters() {
    var pills = document.querySelectorAll('.filter-pill');
    var cards = document.querySelectorAll('.project-card');

    pills.forEach(function (pill) {
      var filter = pill.dataset.filter;
      var count = filter === 'all'
        ? PROJECTS.length
        : PROJECTS.filter(function (p) { return p.status === filter; }).length;
      var badge = pill.querySelector('.filter-count');
      if (badge) { badge.textContent = count; }

      pill.addEventListener('click', function () {
        pills.forEach(function (other) {
          other.setAttribute('aria-pressed', String(other === pill));
        });
        cards.forEach(function (card) {
          card.hidden = filter !== 'all' && card.dataset.status !== filter;
        });
      });
    });
  }

  /* ---------- Init ----------
     ?view=public is what a recruiter sees from entreprise.html: only the
     validated projects, no editing controls, "Proposer un stage" instead,
     and the navbar keeps the recruiter's own session (restored by js/main.js).
     Without the parameter the page is Sara's own dashboard, as before. */
  var isPublicView = new URLSearchParams(window.location.search).get('view') === 'public';

  if (isPublicView) {
    PROJECTS = PROJECTS.filter(function (p) { return p.status === 'validated'; });
    document.querySelectorAll('[data-owner-only]').forEach(function (node) { node.hidden = true; });
    document.querySelectorAll('[data-public-only]').forEach(function (node) { node.hidden = false; });
  } else if (window.CMC) {
    window.CMC.showUser(PROFILE_USER); // header in logged-in state
  }
  renderHeatmap();
  renderProjects();
  setupFilters();
})();
