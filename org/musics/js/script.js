// SHARMAJI MUSICS

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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

  /* show chosen filename under file-drop inputs */
  document.querySelectorAll('.file-drop input[type="file"]').forEach(input => {
    const nameEl = input.parentElement.querySelector('.file-drop-name');
    input.addEventListener('change', () => {
      if (input.files && input.files[0] && nameEl) {
        nameEl.textContent = input.files[0].name;
      }
    });
  });

  /* upload form — sends metadata + files straight to the site
     owner's Google Drive + inbox via an Apps Script Web App
     (see js/config.js for the endpoint URL) */
  const uploadForm = document.getElementById('upload-form');
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!uploadForm.checkValidity()) {
        uploadForm.reportValidity();
        return;
      }

      const endpoint = window.SM_UPLOAD_ENDPOINT;
      const errorEl = document.getElementById('upload-error');
      const submitBtn = document.getElementById('upload-submit-btn');

      if (errorEl) errorEl.style.display = 'none';

      if (!endpoint || endpoint.indexOf('PASTE_') === 0) {
        if (errorEl) {
          errorEl.textContent = 'Upload isn\'t connected yet — the site owner still needs to add the backend link in js/config.js.';
          errorEl.style.display = 'block';
        }
        return;
      }

      const posterFile = document.getElementById('poster').files[0];
      const audioFile = document.getElementById('audio').files[0];

      submitBtn.disabled = true;
      submitBtn.textContent = 'Uploading…';

      try {
        const [posterBase64, audioBase64] = await Promise.all([
          fileToBase64(posterFile),
          fileToBase64(audioFile)
        ]);

        const params = new URLSearchParams();
        ['song_title', 'artist_name', 'genre', 'language', 'release_date',
         'singer', 'lyricist', 'producer', 'label', 'submitted_by', 'email', 'phone']
          .forEach(name => {
            const field = document.getElementById(name);
            params.append(name, field ? field.value : '');
          });
        params.append('rights', document.getElementById('rights').checked ? 'yes' : 'no');

        params.append('poster_filename', posterFile.name);
        params.append('poster_mimetype', posterFile.type || 'image/jpeg');
        params.append('poster_data', posterBase64);

        params.append('audio_filename', audioFile.name);
        params.append('audio_mimetype', audioFile.type || 'audio/mpeg');
        params.append('audio_data', audioBase64);

        // Apps Script Web Apps don't reliably return a CORS-readable
        // response, so a failed .catch() here can mean either a real
        // network failure or just a blocked-but-successful request.
        // We swallow it and treat "request sent" as success — do one
        // real test submission after setup to confirm delivery.
        await fetch(endpoint, { method: 'POST', body: params }).catch(() => {});

        const successTitle = document.getElementById('success-song-title');
        const successArtist = document.getElementById('success-artist');
        if (successTitle) successTitle.textContent = document.getElementById('song_title').value;
        if (successArtist) successArtist.textContent = document.getElementById('artist_name').value;
        const codeEl = document.getElementById('success-code');
        if (codeEl) codeEl.textContent = 'SM-' + Math.floor(100000 + Math.random() * 900000);

        document.getElementById('upload-form-wrap').style.display = 'none';
        const success = document.getElementById('upload-success');
        if (success) {
          success.style.display = 'grid';
          success.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = 'Something went wrong sending your files. Please try again.';
          errorEl.style.display = 'block';
        }
        submitBtn.disabled = false;
        submitBtn.textContent = 'Get Your Release Ticket';
      }
    });
  }

});
