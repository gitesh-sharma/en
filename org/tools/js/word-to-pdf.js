(function () {
  const wordDrop = document.getElementById('wordDrop');
  const wordInput = document.getElementById('wordInput');
  const wordSub = document.getElementById('wordSub');
  const wordStatus = document.getElementById('wordStatus');
  const wordBtn = document.getElementById('wordBtn');
  const wordProgressTrack = document.getElementById('wordProgressTrack');
  const wordProgress = document.getElementById('wordProgress');
  const renderPage = document.getElementById('wordRenderPage');

  let currentFile = null;

  wordDrop.addEventListener('click', () => wordInput.click());
  wordDrop.addEventListener('dragover', (e) => { e.preventDefault(); wordDrop.classList.add('drag'); });
  wordDrop.addEventListener('dragleave', () => wordDrop.classList.remove('drag'));
  wordDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    wordDrop.classList.remove('drag');
    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  });
  wordInput.addEventListener('change', () => { if (wordInput.files[0]) setFile(wordInput.files[0]); });

  function setFile(file) {
    const isDocx = file.name.toLowerCase().endsWith('.docx');
    if (!isDocx) {
      wordSub.textContent = "That doesn't look like a .docx file — please choose a Word (.docx) document.";
      wordBtn.disabled = true;
      currentFile = null;
      return;
    }
    currentFile = file;
    wordSub.textContent = `${file.name} — ${formatBytes(file.size)} — ready to convert.`;
    wordBtn.disabled = false;
    wordStatus.style.display = 'none';
  }

  wordBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    wordBtn.disabled = true;
    wordProgressTrack.style.display = 'block';
    wordProgress.style.width = '10%';
    wordStatus.style.display = 'none';

    try {
      const arrayBuffer = await currentFile.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      wordProgress.style.width = '35%';

      renderPage.innerHTML = result.value;

      // give the browser a moment to lay out images/fonts before capturing
      await new Promise(res => setTimeout(res, 150));
      wordProgress.style.width = '55%';

      const opt = {
        margin: 0,
        filename: currentFile.name.replace(/\.docx$/i, '') + '.pdf',
        image: { type: 'jpeg', quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      };

      await html2pdf().set(opt).from(renderPage).save();
      wordProgress.style.width = '100%';

      showStatus(wordStatus, 'Done — the PDF has been downloaded.', 'ok');
      wordStatus.style.display = 'block';

      if (result.messages && result.messages.length) {
        console.warn('mammoth conversion notes:', result.messages);
      }
    } catch (err) {
      console.error(err);
      showStatus(wordStatus, 'Something went wrong while converting — make sure the file is a valid, non-corrupted .docx.', 'error');
      wordStatus.style.display = 'block';
    } finally {
      renderPage.innerHTML = '';
      wordBtn.disabled = false;
      setTimeout(() => { wordProgressTrack.style.display = 'none'; wordProgress.style.width = '0%'; }, 800);
    }
  });
})();
