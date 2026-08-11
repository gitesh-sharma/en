// Sharmaji Technology Media — shared behaviour

document.addEventListener('DOMContentLoaded', function () {

  /* ---- mobile menu ---- */
  var toggle = document.querySelector('.menu-toggle');
  var mobileNav = document.querySelector('.nav-mobile');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('open');
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
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
