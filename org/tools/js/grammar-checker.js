(function () {
  const gcText = document.getElementById('gcText');
  const gcBtn = document.getElementById('gcBtn');
  const gcStatus = document.getElementById('gcStatus');
  const gcResults = document.getElementById('gcResults');

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  gcBtn.addEventListener('click', async () => {
    const text = gcText.value.trim();
    if (!text) {
      showStatus(gcStatus, 'Type or paste some text first.', 'error');
      gcStatus.style.display = 'block';
      return;
    }
    gcBtn.disabled = true;
    gcResults.innerHTML = '';
    showStatus(gcStatus, 'Checking…', 'ok');
    gcStatus.style.display = 'block';

    try {
      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ text, language: 'en-US' }),
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      const matches = data.matches || [];

      if (matches.length === 0) {
        showStatus(gcStatus, 'No issues found — looks clean.', 'ok');
        gcStatus.style.display = 'block';
      } else {
        gcStatus.style.display = 'none';
        matches.forEach(m => {
          const before = text.slice(Math.max(0, m.offset - 25), m.offset);
          const bad = text.slice(m.offset, m.offset + m.length);
          const after = text.slice(m.offset + m.length, m.offset + m.length + 25);
          const suggestions = (m.replacements || []).slice(0, 5).map(r => r.value).filter(Boolean);

          const card = document.createElement('div');
          card.className = 'issue-card';
          card.innerHTML = `
            <div class="msg">${escapeHtml(m.message)}</div>
            <div class="ctx">…${escapeHtml(before)}<mark>${escapeHtml(bad)}</mark>${escapeHtml(after)}…</div>
            ${suggestions.length ? `<div>${suggestions.map(s => `<span class="issue-chip">${escapeHtml(s)}</span>`).join('')}</div>` : ''}
          `;
          gcResults.appendChild(card);
        });
      }
    } catch (err) {
      console.error(err);
      showStatus(gcStatus, "Couldn't reach the grammar-checking service right now — please try again in a moment.", 'error');
      gcStatus.style.display = 'block';
    } finally {
      gcBtn.disabled = false;
    }
  });
})();
