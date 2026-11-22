// SHARMAJI MUSICS — "Play on…" chooser for album / EP / single pages
// Each release page defines window.SM_RELEASE before loading this file.
// For any platform without a direct link in that config, the chooser
// falls back to a search for the song on that platform.

(function () {
  var cfg = window.SM_RELEASE;
  var dlg = document.getElementById('playDialog');
  if (!cfg || !dlg) return;

  var titleEl = document.getElementById('playDialogTitle');
  var optsEl = document.getElementById('playOptions');

  var PLATFORMS = [
    { key: 'spotify',  name: 'Spotify',      search: 'https://open.spotify.com/search/' },
    { key: 'apple',    name: 'Apple Music',  search: 'https://music.apple.com/us/search?term=' },
    { key: 'amazon',   name: 'Amazon Music', search: 'https://music.amazon.com/search/' },
    { key: 'jiosaavn', name: 'JioSaavn',     search: 'https://www.jiosaavn.com/search/song/' },
    { key: 'gaana',    name: 'Gaana',        search: 'https://gaana.com/search/' }
  ];

  function urlFor(platform, title, ownLinks, fallbackLinks) {
    var direct = (ownLinks && ownLinks[platform.key]) ||
                 (fallbackLinks && fallbackLinks[platform.key]);
    if (direct) return direct;
    return platform.search + encodeURIComponent(title + ' ' + cfg.artist);
  }

  function openChooser(heading, title, ownLinks, fallbackLinks) {
    titleEl.textContent = heading;
    while (optsEl.firstChild) optsEl.removeChild(optsEl.firstChild);

    PLATFORMS.forEach(function (p) {
      var a = document.createElement('a');
      a.className = 'play-option';
      a.href = urlFor(p, title, ownLinks, fallbackLinks);
      a.target = '_blank';
      a.rel = 'noopener';

      var name = document.createElement('span');
      name.textContent = p.name;
      var arrow = document.createElement('span');
      arrow.textContent = '\u2192';
      a.appendChild(name);
      a.appendChild(arrow);
      optsEl.appendChild(a);
    });

    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
  }

  // a track row (or its play button)
  document.querySelectorAll('[data-track]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      // a click on the song-page link inside the row should just navigate
      if (e.target.closest && e.target.closest('a')) return;
      var t = cfg.tracks[parseInt(el.getAttribute('data-track'), 10)];
      if (!t) return;
      // a track without its own Apple link falls back to the album link
      openChooser(t.title, t.title, t.links, { apple: cfg.links && cfg.links.apple });
    });
  });

  // the big "Play Album / EP / Single" button
  document.querySelectorAll('[data-play-release]').forEach(function (el) {
    el.addEventListener('click', function () {
      openChooser(cfg.title, cfg.title, cfg.links, null);
    });
  });

  // close: X button, backdrop click
  dlg.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { dlg.close(); });
  });
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) dlg.close();
  });
})();
