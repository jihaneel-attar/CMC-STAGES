/* CMC stages — page interactivity
   Mobile menu, category chips, search form. */

(function () {
  'use strict';

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById('menu-toggle');
  var menu = document.getElementById('mobile-menu');
  var iconOpen = document.getElementById('icon-open');
  var iconClose = document.getElementById('icon-close');

  function setMenu(open) {
    menu.classList.toggle('hidden', !open);
    iconOpen.classList.toggle('hidden', open);
    iconClose.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
    // Labels can be localised per page via data-label-open / data-label-close
    toggle.setAttribute('aria-label', open
      ? (toggle.dataset.labelClose || 'Close menu')
      : (toggle.dataset.labelOpen || 'Open menu'));
  }

  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { setMenu(false); }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024) { setMenu(false); }
  });

  /* ---------- Category chips fill the search bar ---------- */
  var input = document.getElementById('search-input');
  var chips = document.querySelectorAll('.chip');

  function clearChips() {
    chips.forEach(function (chip) {
      chip.setAttribute('aria-pressed', 'false');
      chip.classList.remove('bg-white', 'text-slate-900');
      chip.classList.add('glass', 'text-white/90');
    });
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      clearChips();
      chip.setAttribute('aria-pressed', 'true');
      chip.classList.remove('glass', 'text-white/90');
      chip.classList.add('bg-white', 'text-slate-900');
      input.value = PREFIX + chip.dataset.category; // PREFIX follows the signed-in role
      input.focus();
    });
  });

  // Typing a custom search un-highlights the chips
  if (input) { input.addEventListener('input', clearChips); } // no search bar on profile.html

  /* ---------- Category chips scroller ----------
     Chevrons scroll the row by ~60% of its width. Edge fades and chevrons
     are shown only when there is more content in that direction. */
  var chipsBox = document.querySelector('.chips');
  var chipsTrack = chipsBox && chipsBox.querySelector('.chips-track');

  if (chipsTrack) {
    var updateChipsEdges = function () {
      var maxScroll = chipsTrack.scrollWidth - chipsTrack.clientWidth;
      chipsBox.classList.toggle('can-scroll-left', chipsTrack.scrollLeft > 2);
      chipsBox.classList.toggle('can-scroll-right', chipsTrack.scrollLeft < maxScroll - 2);
    };

    var scrollChips = function (direction) {
      var motion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      chipsTrack.scrollBy({
        left: direction * chipsTrack.clientWidth * 0.6,
        behavior: motion
      });
    };

    chipsBox.querySelector('.chips-arrow-prev').addEventListener('click', function () { scrollChips(-1); });
    chipsBox.querySelector('.chips-arrow-next').addEventListener('click', function () { scrollChips(1); });

    chipsTrack.addEventListener('scroll', updateChipsEdges, { passive: true });
    window.addEventListener('resize', updateChipsEdges);
    window.addEventListener('load', updateChipsEdges); // widths settle once fonts load
    updateChipsEdges();
  }

  /* ---------- Typing placeholder ----------
     "Internship for " stays fixed; only the category word is typed
     and deleted in a loop. The words come from the chips' data-category,
     so the pôle list lives only in index.html. The HTML placeholder
     already shows the first word, so the loop starts by deleting it. */
  var PREFIX = 'Internship for ';
  var words = Array.prototype.map.call(chips, function (chip) {
    return chip.dataset.category;
  });
  var TYPE_MS = 85;      // per character typed
  var DELETE_MS = 45;    // per character deleted
  var HOLD_MS = 1800;    // full word stays visible
  var GAP_MS = 350;      // empty pause before the next word
  var START_MS = 1600;   // let the hero entrance finish first

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (input && words.length && !reduceMotion) {
    var wordIndex = 0;
    var charCount = words[0].length;
    var deleting = true;

    var tick = function () {
      var delay;

      if (deleting) {
        charCount--;
        if (charCount === 0) {
          deleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          delay = GAP_MS;
        } else {
          delay = DELETE_MS;
        }
      } else {
        charCount++;
        if (charCount === words[wordIndex].length) {
          deleting = true;
          delay = HOLD_MS;
        } else {
          delay = TYPE_MS;
        }
      }

      input.placeholder = PREFIX + words[wordIndex].slice(0, charCount);
      setTimeout(tick, delay);
    };

    setTimeout(tick, START_MS);
  }

  /* ---------- Logo marquee ----------
     Clones the logos (aria-hidden) until the row is long enough to
     fill the visible width, then scrolls by exactly one set so the
     loop has no visible seam. Rebuilt when the width changes. */
  var marquee = document.querySelector('.marquee');
  var track = marquee && marquee.querySelector('.marquee-track');

  if (track && !reduceMotion) {
    var originals = Array.prototype.slice.call(track.children);
    var SPEED = 35; // pixels per second
    var lastWidth = 0;
    var resizeTimer;

    var appendCopy = function () {
      originals.forEach(function (item) {
        var copy = item.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        copy.setAttribute('data-clone', '');
        track.appendChild(copy);
      });
    };

    var buildMarquee = function () {
      lastWidth = marquee.clientWidth;
      track.querySelectorAll('[data-clone]').forEach(function (node) {
        node.parentNode.removeChild(node);
      });

      // Single-row layout first, so the measurement is correct
      marquee.classList.add('is-animated');
      appendCopy();

      // Distance from the first logo to its first copy = one set + one gap
      var shift = track.children[originals.length].offsetLeft - originals[0].offsetLeft;
      var copies = Math.ceil(lastWidth / shift);
      for (var i = 1; i < copies; i++) { appendCopy(); }

      track.style.setProperty('--marquee-shift', shift + 'px');
      track.style.setProperty('--marquee-duration', (shift / SPEED) + 's');
    };

    buildMarquee();

    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (marquee.clientWidth !== lastWidth) { buildMarquee(); }
      }, 150);
    });
  }

  /* ---------- Mouse spotlight (desktop pointers only) ----------
     Skipped with reduced motion, like the other animations. */
  var finePointer = window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (finePointer && !reduceMotion) {
    var spotlight = document.createElement('div');
    spotlight.className = 'spotlight';
    spotlight.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(spotlight, document.body.firstChild);

    var pointerX = 0;
    var pointerY = 0;
    var frameQueued = false;

    var moveSpotlight = function () {
      frameQueued = false;
      spotlight.style.transform = 'translate3d(' + pointerX + 'px, ' + pointerY + 'px, 0)';
    };

    document.addEventListener('mousemove', function (event) {
      pointerX = event.clientX;
      pointerY = event.clientY;

      // Appearing: jump to the pointer instead of gliding in from the old spot
      if (!spotlight.classList.contains('is-visible')) {
        spotlight.style.transition = 'none';
        moveSpotlight();
        void spotlight.offsetWidth; // apply the position before re-enabling transitions
        spotlight.style.transition = '';
        spotlight.classList.add('is-visible');
        return;
      }

      if (!frameQueued) {
        frameQueued = true;
        requestAnimationFrame(moveSpotlight);
      }
    });

    // Fade out when the pointer leaves the window
    document.addEventListener('mouseout', function (event) {
      if (!event.relatedTarget) { spotlight.classList.remove('is-visible'); }
    });
  }

  /* ---------- Sticky header: white after 50px of scroll ---------- */
  var header = document.querySelector('.site-header');

  var updateHeader = function () {
    if (header) { header.classList.toggle('is-scrolled', window.scrollY > 50); }
  };

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader(); // page may load already scrolled (reload, back button)

  /* ---------- Current page link (aria-current from the URL) ----------
     Compares each nav link's path with the page path. Hash-only links
     ("#") point nowhere yet, so they are never marked. */
  var normalizePath = function (pathname) {
    return pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/';
  };

  var currentPath = normalizePath(window.location.pathname);

  document.querySelectorAll('.nav-link, #mobile-menu a').forEach(function (link) {
    var href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#') { return; }

    if (normalizePath(new URL(href, window.location.href).pathname) === currentPath) {
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ---------- Login / Sign up modals + demo session ----------
     Native <dialog> gives focus trapping, Escape and the backdrop; this
     code only adds the closing animation, the forms and the demo users.
     The signed-in user is kept in localStorage ("cmcUser"). The page then
     shows a personalised state: header pill, hero badge, search wording. */
  var STORAGE_KEY = 'cmcUser';
  var ROLE_LABELS = { stagiaire: 'Stagiaire', entreprise: 'Entreprise' };
  var DASHBOARD = { stagiaire: 'profile.html', entreprise: 'entreprise.html' }; // opened after sign-in; the user pill links there
  var SEARCH_PREFIX = { stagiaire: 'Internship for ', entreprise: 'Trainees in ' };
  var DEMO_USERS = {
    stagiaire: { name: 'Sara', role: 'stagiaire', level: 7, email: 'sara.benani@cmc.ac.ma' },
    entreprise: { name: 'Recruteur', role: 'entreprise', email: 'recruteur@entreprise.ma' }
  };
  var CMC_EMAIL = /@cmc\.ac\.ma$/i;
  var CLOSE_MS = 200; // matches the .is-closing animation in style.css

  var badgeText = document.querySelector('[data-user="welcome"]');
  var defaultBadge = badgeText ? badgeText.textContent : '';
  var modalEls = document.querySelectorAll('dialog.modal');

  var readUser = function () {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved && saved.name && ROLE_LABELS[saved.role] ? saved : null;
    } catch (e) { return null; }
  };

  var writeUser = function (user) {
    try {
      if (user) { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); }
      else { localStorage.removeItem(STORAGE_KEY); }
    } catch (e) { /* storage blocked: the session lasts for this page only */ }
  };

  var setAll = function (selector, text) {
    document.querySelectorAll(selector).forEach(function (el) { el.textContent = text; });
  };

  // Puts the page in the guest or signed-in state (shared by every page)
  var applySession = function (user) {
    document.body.classList.toggle('is-signed-in', !!user);
    PREFIX = SEARCH_PREFIX[user ? user.role : 'stagiaire'];
    if (input) { input.placeholder = PREFIX + words[0]; } // the typing loop keeps it fresh

    var roleText = '';
    if (user) {
      roleText = ROLE_LABELS[user.role] + (user.level ? ' · Level ' + user.level : '');
      setAll('[data-user="name"]', user.name);
      setAll('[data-user="role"]', roleText);
      setAll('[data-user="initial"]', user.name.charAt(0).toUpperCase());
      document.querySelectorAll('.user-pill').forEach(function (pill) { pill.href = DASHBOARD[user.role]; });
    }
    if (badgeText) { // hero badge, home page only
      badgeText.textContent = user ? 'Welcome back, ' + user.name + ' · ' + roleText : defaultBadge;
    }
  };

  var closeModal = function (dlg, instantly) {
    if (!dlg || !dlg.open || dlg.classList.contains('is-closing')) { return; }
    if (instantly || reduceMotion) { dlg.close(); return; }
    dlg.classList.add('is-closing');
    setTimeout(function () {
      dlg.classList.remove('is-closing');
      dlg.close();
    }, CLOSE_MS);
  };

  var openModal = function (name) {
    var dlg = document.getElementById('modal-' + name);
    if (!dlg || typeof dlg.showModal !== 'function') { return; }
    modalEls.forEach(function (other) { if (other !== dlg) { closeModal(other, true); } });
    if (!dlg.open) { dlg.showModal(); }
  };

  // Shows the "loading" overlay, stores the user, then opens the page of their role
  var enterDashboard = function (dlg, user) {
    dlg.querySelector('.modal-status-text').textContent = user.role === 'entreprise'
      ? 'Welcome, ' + user.name + '. Loading the trainee search…'
      : 'Welcome, ' + user.name + '. Loading your dashboard…';
    dlg.classList.add('is-loading');
    writeUser(user);

    setTimeout(function () {
      window.location.href = DASHBOARD[user.role];
    }, reduceMotion ? 300 : 1200);
  };

  // One listener for every trigger: open (data-modal), close (data-close), log out
  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-modal]');
    if (trigger) {
      event.preventDefault();
      setMenu(false);
      openModal(trigger.dataset.modal);
      return;
    }
    if (event.target.closest('[data-close]')) {
      closeModal(event.target.closest('dialog'));
      return;
    }
    if (event.target.closest('[data-action="logout"]')) {
      writeUser(null);
      applySession(null);
      setMenu(false);
      // Pages without the login modals (profile.html) go back home
      if (!modalEls.length) { window.location.href = 'index.html'; }
    }
  });

  modalEls.forEach(function (dlg) {
    // The dialog box fills the viewport, so a click on it (not the panel) is "outside"
    dlg.addEventListener('click', function (event) {
      if (event.target === dlg) { closeModal(dlg); }
    });
    // Escape: animate out instead of the browser's instant close
    dlg.addEventListener('cancel', function (event) {
      event.preventDefault();
      closeModal(dlg);
    });
    // Clean slate for the next opening
    dlg.addEventListener('close', function () {
      dlg.classList.remove('is-loading');
      var form = dlg.querySelector('form');
      if (form) { form.reset(); }
    });
  });

  // Sign up: trainees must use a CMC address; companies may use any email
  var signupForm = document.querySelector('[data-form="signup"]');
  if (signupForm) {
    var signupEmail = signupForm.elements.email;
    var checkCmcEmail = function () {
      var isTrainee = signupForm.elements.role.value === 'stagiaire';
      var ok = !isTrainee || CMC_EMAIL.test(signupEmail.value.trim());
      signupEmail.setCustomValidity(ok ? '' : 'Trainees must use their CMC address (…@cmc.ac.ma).');
    };

    signupForm.addEventListener('input', checkCmcEmail);
    signupForm.addEventListener('submit', function (event) {
      event.preventDefault();
      checkCmcEmail();
      if (!signupForm.reportValidity()) { return; }
      enterDashboard(signupForm.closest('dialog'), {
        name: signupForm.elements.fullname.value.trim(),
        role: signupForm.elements.role.value,
        email: signupEmail.value.trim()
      });
    });
  }

  // Login: no backend yet, so the name comes from the email and the role from its domain
  var loginForm = document.querySelector('[data-form="login"]');
  if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var email = loginForm.elements.email.value.trim();
      var first = email.split('@')[0].split(/[._-]/)[0] || 'there';
      enterDashboard(loginForm.closest('dialog'), {
        name: first.charAt(0).toUpperCase() + first.slice(1),
        role: CMC_EMAIL.test(email) ? 'stagiaire' : 'entreprise',
        email: email
      });
    });
  }

  // Quick demo buttons
  document.querySelectorAll('[data-demo]').forEach(function (button) {
    button.addEventListener('click', function () {
      enterDashboard(button.closest('dialog'), DEMO_USERS[button.dataset.demo]);
    });
  });

  // Restore a previous session on load
  applySession(readUser());

  // Other pages link here with index.html#login / #signup: open that modal
  var hashModal = window.location.hash.slice(1);
  if (hashModal === 'login' || hashModal === 'signup') { openModal(hashModal); }

  /* ---------- Search submit (no results page yet) ---------- */
  var searchForm = document.getElementById('search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', function (event) {
      event.preventDefault();
    });
  }

  /* ---------- Shared hooks for other pages (js/profile.js) ---------- */
  window.CMC = {
    readUser: readUser,
    writeUser: writeUser,
    showUser: applySession // updates the header pill without touching storage
  };
})();