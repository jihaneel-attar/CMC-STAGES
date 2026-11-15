/* CMC stages — recruiter dashboard (entreprise.html)
   Company header, key numbers, candidate search with filters, saved
   profiles and the company's offers, all rendered from data.
   Shared behaviour (menu, sticky header, session) lives in js/main.js,
   which must be loaded first. */

(function () {
  'use strict';

  /* ==================================================================
     SAMPLE DATA — replace with real data from the API.
     COMPANY      : the signed-in company (page header). COMPANY_USER is
                    what the navbar pill shows when no company session is
                    stored (e.g. the page is opened directly).
     SECTORS      : the 9 pôles, same keys and names as the home page chips.
     CANDIDATES   : one object per trainee. Only trainees with at least one
                    validated project are listed (validated > 0); "skills"
                    are the chips shown on the card. No contact details.
     OFFERS       : the company's internship offers; status is one of
                    active / review / closed (labels in OFFER_STATUS).
  ================================================================== */
  var COMPANY = { name: 'Atlas Digital Solutions', initials: 'AD', city: 'Casablanca', sector: 'digital' };
  var COMPANY_USER = { name: 'Atlas Digital', role: 'entreprise', email: 'recrutement@atlasdigital.ma' };

  var SECTORS = {
    digital: 'Digital & IA',
    sante: 'Santé',
    industrie: 'Industrie',
    agriculture: 'Agriculture',
    agro: 'Agro-industrie',
    peche: 'Pêche',
    arts: 'Arts & Industries Graphiques',
    gestion: 'Gestion & Commerce',
    tourisme: 'Tourisme, Hôtellerie & Restauration'
  };

  var CANDIDATES = [
    { id: 'sara-benani',      name: 'Sara Benani',       sector: 'digital',     track: 'Digital Design',          cmc: 'CMC Casablanca-Settat',            level: 7, validated: 2, skills: ['Figma', 'UI/UX', 'Prototype'] },
    { id: 'yassine-idrissi',  name: 'Yassine El Idrissi', sector: 'digital',     track: 'Développement Web',       cmc: 'CMC Rabat-Salé-Kénitra',           level: 6, validated: 3, skills: ['JavaScript', 'React', 'Node.js'] },
    { id: 'imane-tazi',       name: 'Imane Tazi',        sector: 'sante',       track: 'Soins infirmiers',        cmc: 'CMC Fès-Meknès',                   level: 5, validated: 1, skills: ['Soins', 'Hygiène', 'Urgences'] },
    { id: 'omar-bouazza',     name: 'Omar Bouazza',      sector: 'industrie',   track: 'Maintenance industrielle', cmc: 'CMC Tanger-Tétouan-Al Hoceïma',   level: 8, validated: 4, skills: ['Automatisme', 'Électrotechnique', 'GMAO'] },
    { id: 'khadija-amrani',   name: 'Khadija Amrani',    sector: 'agriculture', track: 'Agroécologie',            cmc: 'CMC Souss-Massa',                  level: 4, validated: 1, skills: ['Irrigation', 'Cultures bio', 'Sols'] },
    { id: 'mehdi-ouazzani',   name: 'Mehdi Ouazzani',    sector: 'agro',        track: 'Qualité alimentaire',     cmc: 'CMC Béni Mellal-Khénifra',         level: 6, validated: 2, skills: ['HACCP', 'Contrôle qualité', 'Traçabilité'] },
    { id: 'salma-chraibi',    name: 'Salma Chraibi',     sector: 'arts',        track: 'Infographie',             cmc: 'CMC Marrakech-Safi',               level: 5, validated: 3, skills: ['Illustrator', 'Photoshop', 'Impression'] },
    { id: 'hamza-lahlou',     name: 'Hamza Lahlou',      sector: 'gestion',     track: 'Logistique',              cmc: 'CMC Oriental',                     level: 7, validated: 2, skills: ['Supply chain', 'Excel', 'SAP'] },
    // Not listed yet: no validated project
    { id: 'nour-fassi',       name: 'Nour El Fassi',     sector: 'tourisme',    track: 'Gestion hôtelière',       cmc: 'CMC Laâyoune-Sakia El Hamra',      level: 3, validated: 0, skills: ['Accueil', 'Réservation'] }
  ];

  var OFFERS = [
    { title: 'Stage UI/UX Designer',          sector: 'digital', city: 'Casablanca', duration: '3 mois', applications: 14, status: 'active' },
    { title: 'Stage Développeur Front-end',   sector: 'digital', city: 'Casablanca', duration: '6 mois', applications: 21, status: 'active' },
    { title: 'Stage Assistant logistique',    sector: 'gestion', city: 'Tanger',     duration: '2 mois', applications: 6,  status: 'review' },
    { title: 'Stage Data Analyst',            sector: 'digital', city: 'Rabat',      duration: '4 mois', applications: 9,  status: 'closed' }
  ];
  var OFFER_STATUS = { active: 'Active', review: 'En révision', closed: 'Clôturée' };
  /* ==================== end of sample data ==================== */

  var SAVED_KEY = 'cmcSavedProfiles';
  var PUBLIC_PROFILE = 'profile.html?view=public';

  var LISTED = CANDIDATES.filter(function (c) { return c.validated > 0; });

  /* ---------- Helpers ---------- */
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  function svg(paths, extraClass) {
    var node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    node.setAttribute('viewBox', '0 0 24 24');
    node.setAttribute('fill', 'none');
    node.setAttribute('stroke', 'currentColor');
    node.setAttribute('stroke-width', '2');
    node.setAttribute('stroke-linecap', 'round');
    node.setAttribute('stroke-linejoin', 'round');
    node.setAttribute('aria-hidden', 'true');
    if (extraClass) { node.setAttribute('class', extraClass); }
    paths.forEach(function (d) {
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d);
      node.appendChild(p);
    });
    return node;
  }

  var ICON_LEVEL = ['M12 2 15 8.5l7 .8-5.2 4.8 1.4 7L12 17.8 5.8 21l1.4-7L2 9.3l7-.8z'];
  var ICON_CHECK = ['M20 6 9 17l-5-5'];
  var ICON_BOOKMARK = ['M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z'];

  function initials(name) {
    return name.split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0).toUpperCase(); }).join('');
  }

  // Accent- and case-insensitive text for the search box ("sante" finds "Santé")
  function fold(text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function plural(n, singular, pluralForm) {
    return n + ' ' + (n > 1 ? pluralForm : singular);
  }

  /* ---------- Saved profiles (localStorage) ---------- */
  function readSaved() {
    try {
      var saved = JSON.parse(localStorage.getItem(SAVED_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch (e) { return []; }
  }

  function writeSaved(ids) {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(ids)); }
    catch (e) { /* storage blocked: saved profiles last for this page only */ }
  }

  var saved = readSaved().filter(function (id) {
    return LISTED.some(function (c) { return c.id === id; });
  });

  function isSaved(id) { return saved.indexOf(id) !== -1; }

  function toggleSaved(id) {
    var index = saved.indexOf(id);
    if (index === -1) { saved.push(id); } else { saved.splice(index, 1); }
    writeSaved(saved);
    renderStats();
  }

  /* ---------- Header ---------- */
  function renderCompany() {
    var avatar = document.getElementById('company-avatar');
    var sectorChip = document.getElementById('company-sector');
    avatar.textContent = COMPANY.initials;
    avatar.dataset.sector = COMPANY.sector;
    document.getElementById('company-name').textContent = COMPANY.name;
    sectorChip.dataset.sector = COMPANY.sector;
    sectorChip.lastElementChild.textContent = SECTORS[COMPANY.sector];
    document.getElementById('company-city').textContent = COMPANY.city;
  }

  /* ---------- Key numbers ---------- */
  function renderStats() {
    var active = OFFERS.filter(function (o) { return o.status === 'active'; }).length;
    var applications = OFFERS.reduce(function (sum, o) { return sum + o.applications; }, 0);

    document.getElementById('stat-offers').textContent = active;
    document.getElementById('stat-offers-help').textContent = 'sur ' + plural(OFFERS.length, 'offre publiée', 'offres publiées');
    document.getElementById('stat-applications').textContent = applications;
    document.getElementById('stat-applications-help').textContent = 'toutes offres confondues';
    document.getElementById('stat-saved').textContent = saved.length;
    document.getElementById('stat-saved-help').textContent = saved.length
      ? 'à recontacter'
      : 'Sauvegardez un profil depuis la liste';
  }

  /* ---------- Filters ---------- */
  var form = document.getElementById('filters');
  var grid = document.getElementById('candidates');
  var emptyState = document.getElementById('empty-state');
  var resultsCount = document.getElementById('results-count');

  function fillSelects() {
    var sectorSelect = form.elements.sector;
    Object.keys(SECTORS).forEach(function (key) {
      var option = el('option', '', SECTORS[key]);
      option.value = key;
      sectorSelect.appendChild(option);
    });

    var cmcSelect = form.elements.cmc;
    var cmcs = [];
    LISTED.forEach(function (c) { if (cmcs.indexOf(c.cmc) === -1) { cmcs.push(c.cmc); } });
    cmcs.sort(function (a, b) { return a.localeCompare(b, 'fr'); }).forEach(function (name) {
      var option = el('option', '', name);
      option.value = name;
      cmcSelect.appendChild(option);
    });
  }

  function currentFilters() {
    return {
      q: fold(form.elements.q.value.trim()),
      sector: form.elements.sector.value,
      cmc: form.elements.cmc.value,
      level: parseInt(form.elements.level.value, 10) || 0
    };
  }

  function matches(candidate, f) {
    var haystack = fold(candidate.name + ' ' + candidate.skills.join(' ') + ' ' + candidate.track);
    return (!f.q || haystack.indexOf(f.q) !== -1) &&
      (!f.sector || candidate.sector === f.sector) &&
      (!f.cmc || candidate.cmc === f.cmc) &&
      candidate.level >= f.level;
  }

  /* ---------- Candidate cards ---------- */
  function candidateCard(c) {
    var card = el('article', 'glass-card candidate-card');
    card.dataset.sector = c.sector;
    card.setAttribute('aria-labelledby', 'cand-' + c.id);

    // Avatar + identity
    var head = el('div', 'candidate-head');
    head.appendChild(el('div', 'avatar-md', initials(c.name))).setAttribute('aria-hidden', 'true');
    var identity = el('div', 'min-w-0');
    var name = el('h3', 'candidate-name', c.name);
    name.id = 'cand-' + c.id;
    identity.appendChild(name);
    var track = el('p', 'candidate-track');
    track.appendChild(el('span', 'pchip-dot')).setAttribute('aria-hidden', 'true');
    track.appendChild(el('span', '', SECTORS[c.sector] + ' · ' + c.track));
    identity.appendChild(track);
    identity.appendChild(el('p', 'candidate-cmc', c.cmc));
    head.appendChild(identity);
    card.appendChild(head);

    // Skills
    var skills = el('ul', 'skills');
    skills.setAttribute('aria-label', 'Compétences');
    c.skills.forEach(function (skill) { skills.appendChild(el('li', 'pchip pchip-sm glass', skill)); });
    card.appendChild(skills);

    // Level + validated projects
    var meta = el('p', 'candidate-meta');
    var level = el('span');
    level.appendChild(svg(ICON_LEVEL));
    level.appendChild(document.createTextNode('Niveau ' + c.level));
    var validated = el('span');
    validated.appendChild(svg(ICON_CHECK));
    validated.appendChild(document.createTextNode(plural(c.validated, 'projet validé', 'projets validés')));
    meta.appendChild(level);
    meta.appendChild(validated);
    card.appendChild(meta);

    // Actions
    var actions = el('div', 'candidate-actions');
    var view = el('a', 'btn-primary btn-view', 'Voir le profil');
    view.href = PUBLIC_PROFILE;
    view.setAttribute('aria-label', 'Voir le profil de ' + c.name);
    actions.appendChild(view);

    var save = el('button', 'btn-save glass');
    save.type = 'button';
    save.dataset.save = c.id;
    save.appendChild(svg(ICON_BOOKMARK));
    save.appendChild(el('span'));
    setSaveState(save, isSaved(c.id), c.name);
    actions.appendChild(save);
    card.appendChild(actions);

    return card;
  }

  // Pressed state is carried by aria-pressed and the label text, not colour alone
  function setSaveState(button, pressed, name) {
    button.setAttribute('aria-pressed', String(pressed));
    button.lastElementChild.textContent = pressed ? 'Sauvegardé' : 'Sauvegarder';
    button.setAttribute('aria-label', (pressed ? 'Retirer ' : 'Sauvegarder ') + 'le profil de ' + name);
  }

  function renderCandidates() {
    var f = currentFilters();
    var results = LISTED.filter(function (c) { return matches(c, f); });

    grid.textContent = '';
    var fragment = document.createDocumentFragment();
    results.forEach(function (c) { fragment.appendChild(candidateCard(c)); });
    grid.appendChild(fragment);

    emptyState.hidden = results.length > 0;
    grid.hidden = results.length === 0;
    resultsCount.textContent = results.length === 0
      ? 'Aucun profil trouvé'
      : plural(results.length, 'profil trouvé', 'profils trouvés') + ' sur ' + LISTED.length;
  }

  function resetFilters() {
    form.reset();
    renderCandidates();
    form.elements.q.focus();
  }

  /* ---------- Offers ---------- */
  function renderOffers() {
    var list = document.getElementById('offers-list');
    var meta = document.getElementById('offers-meta');
    var active = OFFERS.filter(function (o) { return o.status === 'active'; }).length;

    meta.textContent = plural(OFFERS.length, 'offre', 'offres') + ' · ' + plural(active, 'active', 'actives');

    OFFERS.forEach(function (offer) {
      var item = el('li', 'offer');
      item.dataset.status = offer.status;

      var main = el('div', 'min-w-0');
      main.appendChild(el('h3', 'offer-title', offer.title));
      var details = el('p', 'offer-meta');
      var sector = el('span');
      sector.dataset.sector = offer.sector;
      sector.appendChild(el('span', 'pchip-dot')).setAttribute('aria-hidden', 'true');
      sector.appendChild(document.createTextNode(SECTORS[offer.sector]));
      details.appendChild(sector);
      details.appendChild(el('span', '', offer.city));
      details.appendChild(el('span', '', offer.duration));
      main.appendChild(details);
      item.appendChild(main);

      var side = el('div', 'offer-side');
      var apps = el('p', 'offer-apps');
      apps.appendChild(el('strong', '', String(offer.applications)));
      apps.appendChild(document.createTextNode(' ' + (offer.applications > 1 ? 'candidatures' : 'candidature')));
      side.appendChild(apps);
      var status = el('span', 'offer-status');
      status.appendChild(el('span', 'offer-status-dot')).setAttribute('aria-hidden', 'true');
      status.appendChild(document.createTextNode(OFFER_STATUS[offer.status]));
      side.appendChild(status);
      item.appendChild(side);

      list.appendChild(item);
    });
  }

  /* ---------- Events ---------- */
  form.addEventListener('submit', function (event) { event.preventDefault(); });
  form.addEventListener('input', renderCandidates);
  form.addEventListener('change', renderCandidates);
  document.getElementById('reset-filters').addEventListener('click', resetFilters);

  grid.addEventListener('click', function (event) {
    var button = event.target.closest('[data-save]');
    if (!button) { return; }
    var candidate = LISTED.filter(function (c) { return c.id === button.dataset.save; })[0];
    toggleSaved(candidate.id);
    setSaveState(button, isSaved(candidate.id), candidate.name);
  });

  /* ---------- Init ---------- */
  // Navbar: the signed-in company, or the sample company when none is stored
  if (window.CMC) {
    var session = window.CMC.readUser();
    window.CMC.showUser(session && session.role === 'entreprise' ? session : COMPANY_USER);
  }
  renderCompany();
  renderStats();
  fillSelects();
  renderCandidates();
  renderOffers();
})();
