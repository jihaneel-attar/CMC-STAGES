/* CMC stages — profile page
   Header user, skills, attendance month blocks and project cards, rendered from data.
   Shared behaviour (menu, sticky header, session) lives in js/main.js,
   which must be loaded first. */

(function () {
  'use strict';

  /* ==================================================================
     SAMPLE DATA — replace with real data from the API.
     PROFILE_USER : what the header pill shows.
     ATTENDANCE   : one object per school year, keyed by the year the
                    year ends in (2026 = sept. 2025 → mai 2026):
                    { 'YYYY-MM-DD': 'present' | 'late' | 'absent' }.
                    A missing school day = no class that day.
                    Generated with a fixed seed so the picture is stable;
                    swap generateSampleAttendance(...) for the real object.
     PROJECTS     : one object per card, in display order.
  ================================================================== */
  var PROFILE_USER = { name: 'Sara', role: 'stagiaire', level: 7 };

  var DEFAULT_YEAR = 2026;

  var ATTENDANCE = {
    2026: generateSampleAttendance(2026, 7),
    2025: generateSampleAttendance(2025, 3)
  };

  var PROJECTS = [
    { title: 'Application mobile UI',      tag: 'UI',        time: 'il y a 1 mois', status: 'pending',   statusText: 'En attente du formateur' },
    { title: 'Portfolio UX case study',    tag: 'UX',        time: 'il y a 3 mois', status: 'validated', statusText: 'Validé par formateur' },
    { title: 'Plateforme anti-gaspillage', tag: 'Prototype', time: 'il y a 3 mois', status: 'validated', statusText: 'Validé par formateur' }
  ];
  /* ==================== end of sample data ==================== */

  // School year: September of the previous year to May
  var SCHOOL_MONTHS = [8, 9, 10, 11, 0, 1, 2, 3, 4];
  var MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
                   'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var STATE_LABELS = { present: 'présente', late: 'en retard', absent: 'absente', none: 'pas de cours' };

  /* ---------- Helpers ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function isoDate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  // Monday = 0 … Sunday = 6
  function weekday(d) { return (d.getDay() + 6) % 7; }

  // Calendar year a school month belongs to (sept.–déc. are in the previous year)
  function calendarYear(schoolYear, month) { return month >= 8 ? schoolYear - 1 : schoolYear; }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  // Small seeded PRNG (mulberry32) so the sample attendance never changes
  function seededRandom(seed) {
    var t = seed >>> 0;
    return function () {
      t = (t + 0x6D2B79F5) >>> 0;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- Sample attendance generator ----------
     Every Monday–Friday of the school year gets a state, except two
     holiday breaks (end of December, early April) which stay "no class". */
  function generateSampleAttendance(schoolYear, seed) {
    var rand = seededRandom(seed);
    var data = {};
    var breaks = [
      [new Date(schoolYear - 1, 11, 22), new Date(schoolYear, 0, 4)],
      [new Date(schoolYear, 3, 6), new Date(schoolYear, 3, 19)]
    ];

    var d = new Date(schoolYear - 1, 8, 1);
    var end = new Date(schoolYear, 4, 31);
    while (d <= end) {
      var onBreak = breaks.some(function (range) { return d >= range[0] && d <= range[1]; });
      if (weekday(d) < 5 && !onBreak) {
        var r = rand();
        data[isoDate(d)] = r < 0.06 ? 'absent' : r < 0.14 ? 'late' : 'present';
      }
      d.setDate(d.getDate() + 1);
    }
    return data;
  }

  /* ---------- Présence: four month blocks at a time (two on mobile) ----------
     buildMonths() turns the selected school year into ONE array of months;
     the arrows only move presence.end, the index of the latest visible
     month, and renderMonths() draws the slice that ends there.
     presence.last is the final month with data: "next" stops there. */
  var MOBILE_QUERY = window.matchMedia('(max-width: 767px)');
  var presence = { months: [], end: 0, last: 0 };

  function visibleCount() { return MOBILE_QUERY.matches ? 2 : 4; }

  function buildMonths(schoolYear) {
    var data = ATTENDANCE[schoolYear] || {};

    return SCHOOL_MONTHS.map(function (month) {
      var year = calendarYear(schoolYear, month);
      var days = []; // Monday–Friday only
      var d = new Date(year, month, 1);
      while (d.getMonth() === month) {
        if (weekday(d) < 5) { days.push({ date: new Date(d), state: data[isoDate(d)] || 'none' }); }
        d.setDate(d.getDate() + 1);
      }
      return {
        month: month,
        year: year,
        days: days,
        hasData: days.some(function (day) { return day.state !== 'none'; })
      };
    });
  }

  // Index of the final month with data (the last month when the year is empty)
  function lastDataIndex(months) {
    for (var i = months.length - 1; i >= 0; i--) {
      if (months[i].hasData) { return i; }
    }
    return months.length - 1;
  }

  // The current month when it is part of this school year, else the last month with data
  function defaultEnd(months, last) {
    var today = new Date();
    for (var i = 0; i <= last; i++) {
      if (months[i].year === today.getFullYear() && months[i].month === today.getMonth()) { return i; }
    }
    return last;
  }

  function monthBlock(m) {
    var block = el('div', 'month');
    block.appendChild(el('p', 'month-name', MONTHS_FR[m.month]));

    var grid = el('div', 'month-grid');
    grid.setAttribute('role', 'img');
    grid.setAttribute('aria-label', 'Présence en ' + MONTHS_FR[m.month] + ' ' + m.year);

    // Pad the first row so the first school day sits under its weekday
    for (var p = 0; m.days.length && p < weekday(m.days[0].date); p++) {
      grid.appendChild(el('span', 'day is-pad'));
    }
    m.days.forEach(function (day) {
      var cell = el('span', 'day is-' + day.state);
      cell.title = day.date.getDate() + ' ' + MONTHS_FR[m.month] + ' ' + m.year + ' : ' + STATE_LABELS[day.state];
      grid.appendChild(cell);
    });

    block.appendChild(grid);
    return block;
  }

  function renderMonths() {
    var container = document.getElementById('presence-months');
    var prev = document.getElementById('month-prev');
    var next = document.getElementById('month-next');
    if (!container) { return; }

    var last = presence.last;
    var count = Math.min(visibleCount(), presence.months.length);
    // Keep a full slice in range: never before sept., never past the last month with data
    presence.end = Math.max(Math.min(count - 1, presence.months.length - 1), Math.min(presence.end, last));
    var start = Math.max(0, presence.end - count + 1);

    var fragment = document.createDocumentFragment();
    presence.months.slice(start, presence.end + 1).forEach(function (m) {
      fragment.appendChild(monthBlock(m));
    });
    container.textContent = '';
    container.appendChild(fragment);

    if (prev) { prev.disabled = start <= 0; }
    if (next) { next.disabled = presence.end >= last; }
  }

  // Year dropdown: new month array, default position, whole-year figure
  function showYear(schoolYear) {
    presence.months = buildMonths(schoolYear);
    presence.last = lastDataIndex(presence.months);
    presence.end = defaultEnd(presence.months, presence.last);
    renderMonths();
    renderPresenceMeta(ATTENDANCE[schoolYear] || {});
  }

  function setupMonthNav() {
    var prev = document.getElementById('month-prev');
    var next = document.getElementById('month-next');
    if (!prev || !next) { return; }

    var step = function (delta, button, other) {
      presence.end += delta;
      renderMonths();
      if (button.disabled) { other.focus(); } // a disabled button would drop keyboard focus
    };

    prev.addEventListener('click', function () { step(-1, prev, next); });
    next.addEventListener('click', function () { step(1, next, prev); });

    // 4 months ↔ 2 months when the viewport crosses 768px
    if (MOBILE_QUERY.addEventListener) { MOBILE_QUERY.addEventListener('change', renderMonths); }
    else if (MOBILE_QUERY.addListener) { MOBILE_QUERY.addListener(renderMonths); }
  }

  // "152 jours de présence · 92 %" — late days count as attended
  function renderPresenceMeta(data) {
    var meta = document.getElementById('presence-meta');
    if (!meta) { return; }

    var keys = Object.keys(data);
    var attended = keys.filter(function (key) { return data[key] !== 'absent'; }).length;
    meta.textContent = keys.length
      ? attended + ' jour' + (attended > 1 ? 's' : '') + ' de présence · ' +
        Math.round(attended / keys.length * 100) + ' %'
      : 'Aucune donnée pour cette année';
  }

  /* ---------- Small inline icons ---------- */
  var ICONS = {
    validated: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'm8.5 12 2.5 2.5 4.5-5'],
    pending: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7.5V12l3 2'],
    close: ['M6 6l12 12', 'M18 6 6 18']
  };

  function icon(name) {
    var ns = 'http://www.w3.org/2000/svg';
    var node = document.createElementNS(ns, 'svg');
    node.setAttribute('viewBox', '0 0 24 24');
    node.setAttribute('fill', 'none');
    node.setAttribute('stroke', 'currentColor');
    node.setAttribute('stroke-width', '2.2');
    node.setAttribute('stroke-linecap', 'round');
    node.setAttribute('stroke-linejoin', 'round');
    node.setAttribute('aria-hidden', 'true');
    ICONS[name].forEach(function (d) {
      var path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      node.appendChild(path);
    });
    return node;
  }

  /* ---------- Project cards ---------- */
  function renderProjects() {
    var list = document.getElementById('projects-list');
    if (!list) { return; }

    PROJECTS.forEach(function (project) {
      var card = el('article', 'project-card');

      var top = el('div', 'project-top');
      top.appendChild(el('span', 'project-tag glass', project.tag));
      top.appendChild(el('span', 'project-time', project.time));
      card.appendChild(top);

      card.appendChild(el('h3', 'project-title', project.title));

      var bar = el('div', 'progress project-bar is-' + project.status);
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-label', 'Validation : ' + project.statusText);
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '1');
      bar.setAttribute('aria-valuenow', project.status === 'validated' ? '1' : '0');
      bar.appendChild(el('span', 'progress-fill'));
      card.appendChild(bar);

      // Status = icon + text, so it never relies on colour alone
      var status = el('p', 'project-status is-' + project.status);
      status.appendChild(icon(project.status));
      status.appendChild(el('span', '', project.statusText));
      card.appendChild(status);
      list.appendChild(card);
    });
  }

  /* ---------- Skills: "+ Compétence" opens an inline field ----------
     Enter adds the skill, Escape or leaving the field cancels. Added
     skills are kept in localStorage and can be removed by their owner. */
  var SKILLS_KEY = 'cmcSkills';
  var SKILL_MAX = 24; // characters

  function readSkills() {
    try {
      var saved = JSON.parse(localStorage.getItem(SKILLS_KEY));
      return Array.isArray(saved) ? saved.filter(function (s) { return typeof s === 'string' && s; }) : [];
    } catch (e) { return []; }
  }

  function writeSkills(skills) {
    try { localStorage.setItem(SKILLS_KEY, JSON.stringify(skills)); }
    catch (e) { /* storage blocked: added skills last for this page only */ }
  }

  function setupSkills(editable) {
    var box = document.getElementById('skills');
    var addButton = document.getElementById('add-skill');
    if (!box || !addButton) { return; }

    var skills = readSkills();

    var hasSkill = function (name) {
      var wanted = name.toLowerCase();
      return Array.prototype.some.call(box.querySelectorAll('[data-skill]'), function (chip) {
        return chip.dataset.skill.toLowerCase() === wanted;
      });
    };

    var addChip = function (name) {
      var chip = el('span', 'pchip pchip-custom glass');
      chip.dataset.skill = name;
      chip.appendChild(el('span', '', name));
      if (editable) {
        var remove = el('button', 'pchip-remove');
        remove.type = 'button';
        remove.setAttribute('aria-label', 'Retirer la compétence ' + name);
        remove.appendChild(icon('close'));
        remove.addEventListener('click', function () {
          skills = skills.filter(function (s) { return s !== name; });
          writeSkills(skills);
          box.removeChild(chip);
          addButton.focus();
        });
        chip.appendChild(remove);
      } else {
        chip.classList.remove('pchip-custom'); // same look as the built-in chips
      }
      box.insertBefore(chip, addButton);
    };

    // The chips already in the HTML take part in the duplicate check
    Array.prototype.forEach.call(box.querySelectorAll('span.pchip'), function (chip) {
      chip.dataset.skill = chip.textContent.trim();
    });
    skills.forEach(addChip);
    if (!editable) { return; }

    var form = el('form', 'pchip pchip-input glass');
    form.hidden = true;
    var input = el('input');
    input.type = 'text';
    input.maxLength = SKILL_MAX;
    input.placeholder = 'Nouvelle compétence';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Nouvelle compétence (Entrée pour ajouter, Échap pour annuler)');
    form.appendChild(input);
    box.insertBefore(form, addButton);

    var closeForm = function (refocus) {
      if (form.hidden) { return; }
      form.hidden = true;
      input.value = '';
      addButton.hidden = false;
      if (refocus) { addButton.focus(); }
    };

    addButton.addEventListener('click', function () {
      addButton.hidden = true;
      form.hidden = false;
      input.focus();
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var name = input.value.trim().replace(/\s+/g, ' ');
      if (name && !hasSkill(name)) {
        skills.push(name);
        writeSkills(skills);
        addChip(name);
      }
      closeForm(true);
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.stopPropagation(); closeForm(true); }
    });
    input.addEventListener('blur', function () { closeForm(false); });
  }

  /* ---------- Init ----------
     ?view=public is what a recruiter sees from entreprise.html: only the
     validated projects, no editing controls, "Proposer un stage" instead,
     and the navbar keeps the recruiter's own session (restored by js/main.js).
     Without the parameter the page is Sara's own dashboard. */
  var isPublicView = new URLSearchParams(window.location.search).get('view') === 'public';

  if (isPublicView) {
    PROJECTS = PROJECTS.filter(function (p) { return p.status === 'validated'; });
    document.querySelectorAll('[data-owner-only]').forEach(function (node) { node.hidden = true; });
    document.querySelectorAll('[data-public-only]').forEach(function (node) { node.hidden = false; });
  } else if (window.CMC) {
    window.CMC.showUser(PROFILE_USER); // header in logged-in state
  }

  var yearSelect = document.getElementById('presence-year');
  if (yearSelect) {
    yearSelect.value = String(DEFAULT_YEAR);
    yearSelect.addEventListener('change', function () { showYear(parseInt(yearSelect.value, 10)); });
  }

  setupMonthNav();
  showYear(DEFAULT_YEAR);
  renderProjects();
  setupSkills(!isPublicView);
})();
