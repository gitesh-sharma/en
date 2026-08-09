// SHARMAJI MUSICS

document.addEventListener('DOMContentLoaded', () => {

  /* mobile nav toggle */
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => links.classList.remove('open'));
    });
  }

  /* show chosen filename under file-drop inputs */
  document.querySelectorAll('.file-drop input[type="file"]').forEach(input => {
    const nameEl = input.parentElement.querySelector('.file-drop-name');
    input.addEventListener('change', () => {
      if (input.files && input.files[0] && nameEl) {
        nameEl.textContent = input.files[0].name;
      }
    });
  });

  /* partner badges: fall back to the platform name if a logo file
     hasn't been dropped into assets/partners/ yet — once the real
     file is added at that exact path it displays automatically */
  document.querySelectorAll('.badge-label img').forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
      const fallback = img.nextElementSibling;
      if (fallback) fallback.style.display = 'block';
    });
  });

  /* upload form — front-end only demo submit */
  const uploadForm = document.getElementById('upload-form');
  if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!uploadForm.checkValidity()) {
        uploadForm.reportValidity();
        return;
      }
      const titleField = uploadForm.querySelector('#song_title');
      const artistField = uploadForm.querySelector('#artist_name');
      const successTitle = document.getElementById('success-song-title');
      const successArtist = document.getElementById('success-artist');
      if (successTitle) successTitle.textContent = titleField ? titleField.value : '';
      if (successArtist) successArtist.textContent = artistField ? artistField.value : '';

      const codeEl = document.getElementById('success-code');
      if (codeEl) {
        const code = 'SM-' + Math.floor(100000 + Math.random() * 900000);
        codeEl.textContent = code;
      }

      document.getElementById('upload-form-wrap').style.display = 'none';
      const success = document.getElementById('upload-success');
      if (success) {
        success.style.display = 'grid';
        success.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

});
