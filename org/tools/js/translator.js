(function () {
  const fromText = document.getElementById('fromText');
  const toText = document.getElementById('toText');
  const fromLabel = document.getElementById('fromLabel');
  const toLabel = document.getElementById('toLabel');
  const swapBtn = document.getElementById('swapBtn');
  const translateBtn = document.getElementById('translateBtn');
  const tStatus = document.getElementById('tStatus');

  let fromLang = 'hi', toLang = 'en';

  swapBtn.addEventListener('click', () => {
    [fromLang, toLang] = [toLang, fromLang];
    fromLabel.textContent = fromLang === 'hi' ? 'Hindi' : 'English';
    toLabel.textContent = toLang === 'hi' ? 'Hindi' : 'English';
    const tmp = fromText.value;
    fromText.value = toText.value || tmp;
    toText.value = '';
  });

  translateBtn.addEventListener('click', async () => {
    const text = fromText.value.trim();
    if (!text) {
      showStatus(tStatus, 'Type something to translate first.', 'error');
      tStatus.style.display = 'block';
      return;
    }
    if (text.length > 480) {
      showStatus(tStatus, 'Keep it under about 480 characters — the free service translates short text at a time.', 'error');
      tStatus.style.display = 'block';
      return;
    }
    translateBtn.disabled = true;
    tStatus.style.display = 'none';
    toText.value = '';
    try {
      const params = new URLSearchParams({ q: text, langpair: `${fromLang}|${toLang}` });
      const response = await fetch(`https://api.mymemory.translated.net/get?${params}`);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (data.responseStatus && data.responseStatus !== 200) {
        throw new Error(data.responseDetails || 'Translation failed');
      }
      toText.value = data.responseData.translatedText;
    } catch (err) {
      console.error(err);
      showStatus(tStatus, "Couldn't reach the translation service right now — please try again in a moment.", 'error');
      tStatus.style.display = 'block';
    } finally {
      translateBtn.disabled = false;
    }
  });
})();
