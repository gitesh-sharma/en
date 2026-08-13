// Sharmaji Technology Media — shared behaviour

document.addEventListener('DOMContentLoaded', function () {

  /* ---- logo swaps for social icons on scroll down, restores on scroll up ---- */
  var headerLeft = document.querySelector('.header-left');
  if (headerLeft) {
    var lastScrollY = window.scrollY;
    window.addEventListener('scroll', function () {
      var currentY = window.scrollY;
      if (currentY > lastScrollY && currentY > 80) {
        headerLeft.classList.add('scrolled');
      } else if (currentY < lastScrollY) {
        headerLeft.classList.remove('scrolled');
      }
      lastScrollY = currentY;
    }, { passive: true });
  }

  /* ---- mobile menu ---- */
  var toggle = document.querySelector('.menu-toggle');
  var mobileNav = document.querySelector('.nav-mobile');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('open');
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      var sp = document.querySelector('.search-panel');
      var st = document.querySelector('.search-toggle');
      if (open && sp && st) { sp.classList.remove('open'); st.setAttribute('aria-expanded', 'false'); }
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  /* ---- site search ---- */
  var SITE_PAGES = [
    { title: 'Home', url: 'index.html', desc: 'Company overview and both products' },
    { title: 'About', url: 'about.html', desc: 'Our story — how Tools and Musics were built' },
    { title: 'Contact', url: 'contact.html', desc: 'Get in touch about Tools, Musics, or a general enquiry' },
    { title: 'Blog', url: 'https://gitesh-sharma.github.io/en/blog/', desc: 'Latest posts and updates' },
    { title: 'Legal', url: 'legal.html', desc: 'Privacy policy, terms, disclaimer, cookies, DMCA' },
    { title: 'Sitemap', url: 'sitemap.html', desc: 'Every page across the company and both products' },
    { title: 'Sharmaji Tools', url: 'tools/index.html', desc: 'Free browser-based PDF tools and everyday utilities' },
    { title: 'Sharmaji Musics', url: 'musics/index.html', desc: 'Free music distribution for independent artists' }
  ];

  var searchToggle = document.querySelector('.search-toggle');
  var searchPanel = document.querySelector('.search-panel');
  var searchInput = document.getElementById('search-input');
  var searchResults = document.getElementById('search-results');
  var searchClose = document.querySelector('.search-close');

  function renderResults(query) {
    if (!searchResults) return;
    searchResults.innerHTML = '';
    if (!query) return;
    var q = query.toLowerCase();
    var matches = SITE_PAGES.filter(function (p) {
      return p.title.toLowerCase().indexOf(q) !== -1 || p.desc.toLowerCase().indexOf(q) !== -1;
    });
    if (matches.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'search-empty';
      empty.textContent = 'No pages match "' + query + '".';
      searchResults.appendChild(empty);
      return;
    }
    matches.forEach(function (p) {
      var a = document.createElement('a');
      a.className = 'search-result';
      a.href = p.url;
      var strong = document.createElement('strong');
      strong.textContent = p.title;
      var span = document.createElement('span');
      span.textContent = p.desc;
      a.appendChild(strong);
      a.appendChild(span);
      searchResults.appendChild(a);
    });
  }

  function closeSearch() {
    if (!searchPanel || !searchToggle) return;
    searchPanel.classList.remove('open');
    searchToggle.setAttribute('aria-expanded', 'false');
  }

  if (searchToggle && searchPanel) {
    searchToggle.addEventListener('click', function () {
      var open = searchPanel.classList.toggle('open');
      searchToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && mobileNav && toggle) {
        mobileNav.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      }
      if (open && searchInput) {
        setTimeout(function () { searchInput.focus(); }, 60);
      }
    });
    if (searchClose) searchClose.addEventListener('click', closeSearch);
    if (searchInput) searchInput.addEventListener('input', function () { renderResults(this.value.trim()); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSearch();
    });
  }

  /* ---- close the "Divisions" dropdown on outside click ---- */
  document.querySelectorAll('.nav-divisions').forEach(function (dd) {
    document.addEventListener('click', function (e) {
      if (!dd.contains(e.target)) dd.removeAttribute('open');
    });
  });

  /* ---- dynamic contact form ---- */
  var deptSelect = document.getElementById('inquiry-about');
  if (deptSelect) {
    var subjectField   = document.getElementById('form-subject');
    var refLabel       = document.getElementById('ref-label');
    var refInput       = document.getElementById('ref-field');
    var refHint        = document.getElementById('ref-hint');
    var submitBtn      = document.getElementById('contact-submit');
    var formPanel      = document.querySelector('.form-panel');
    var toggleTools    = document.getElementById('toggle-tools');
    var toggleMusic    = document.getElementById('toggle-music');

    var copy = {
      tools: {
        subject: 'New enquiry — Sharmaji Tools',
        refLabel: 'Which tool is this about? (optional)',
        refPlaceholder: 'e.g. Compress, OCR, Watermark…',
        hint: 'Bug, feature request, or a question about any of the 19 PDF and utility tools.',
        button: 'Send to the Tools desk',
        accent: 'tools'
      },
      music: {
        subject: 'New enquiry — Sharmaji Musics',
        refLabel: 'Song or release title (optional)',
        refPlaceholder: 'e.g. name of the track you submitted',
        hint: 'Upload status, distribution, royalties, or a platform-specific question.',
        button: 'Send to the Musics desk',
        accent: 'music'
      },
      both: {
        subject: 'New enquiry — Sharmaji Technology Media (General)',
        refLabel: 'Reference (optional)',
        refPlaceholder: 'Order ID, song title, or tool name — if relevant',
        hint: 'Partnerships, press, or anything that doesn\u2019t fit either one alone.',
        button: 'Send message',
        accent: 'both'
      }
    };

    function applyDept(key) {
      var c = copy[key] || copy.both;
      if (subjectField) subjectField.value = c.subject;
      if (refLabel) refLabel.textContent = c.refLabel;
      if (refInput) refInput.setAttribute('placeholder', c.refPlaceholder);
      if (refHint) refHint.textContent = c.hint;
      if (submitBtn) submitBtn.textContent = c.button;
      if (formPanel) {
        formPanel.style.setProperty('--accent-live', c.accent === 'tools' ? '#E07A3E' : c.accent === 'music' ? '#9C82E0' : '#C9A227');
      }
    }

    deptSelect.addEventListener('change', function () { applyDept(this.value); });
    applyDept(deptSelect.value);

    if (toggleTools) toggleTools.addEventListener('click', function(){ deptSelect.value = 'tools'; applyDept('tools'); deptSelect.focus(); });
    if (toggleMusic) toggleMusic.addEventListener('click', function(){ deptSelect.value = 'music'; applyDept('music'); deptSelect.focus(); });

    // set the redirect target for FormSubmit so we can show an inline thank-you
    var nextField = document.getElementById('form-next');
    if (nextField) {
      nextField.value = window.location.origin + window.location.pathname + '?sent=true';
    }

    // show thank-you state if we've bounced back from FormSubmit
    if (window.location.search.indexOf('sent=true') !== -1) {
      var statusBox = document.getElementById('form-status');
      var formEl = document.getElementById('contact-form');
      if (statusBox) { statusBox.classList.add('ok'); statusBox.textContent = 'Message sent — thanks. We reply from info.giteshsharma@gmail.com, usually within a couple of days.'; }
      if (formEl) formEl.style.display = 'none';
    }
  }

  /* ---- legal page: highlight active section in the side index ---- */
  var tocLinks = document.querySelectorAll('.legal-toc a');
  if (tocLinks.length) {
    var sections = Array.prototype.map.call(tocLinks, function (a) {
      return document.querySelector(a.getAttribute('href'));
    });
    var setActive = function () {
      var pos = window.scrollY + 140;
      var current = sections[0];
      sections.forEach(function (sec) { if (sec && sec.offsetTop <= pos) current = sec; });
      tocLinks.forEach(function (a) {
        a.classList.toggle('active', current && a.getAttribute('href') === '#' + current.id);
      });
    };
    document.addEventListener('scroll', setActive, { passive: true });
    setActive();

    // open the accordion item a TOC link points to
    tocLinks.forEach(function (a) {
      a.addEventListener('click', function () {
        var target = document.querySelector(a.getAttribute('href'));
        if (target && target.tagName === 'DETAILS') target.setAttribute('open', '');
      });
    });
  }
});
