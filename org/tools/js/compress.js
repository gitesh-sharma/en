import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.min.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs";

const { PDFDocument } = window.PDFLib;

const cDrop = document.getElementById('cDrop');
const cInput = document.getElementById('cInput');
const cSub = document.getElementById('cSub');
const cStatus = document.getElementById('cStatus');
const uploadWorkspace = document.getElementById('uploadWorkspace');
const cWorkspace = document.getElementById('cWorkspace');
const cFileName = document.getElementById('cFileName');
const cFileSize = document.getElementById('cFileSize');
const cBtn = document.getElementById('cBtn');
const cResetBtn = document.getElementById('cResetBtn');
const cStatus2 = document.getElementById('cStatus2');
const cProgressTrack = document.getElementById('cProgressTrack');
const cProgress = document.getElementById('cProgress');

let currentFile = null;
let level = 'balanced';

const LEVELS = {
  high:     { dpi: 150, quality: 0.82 },
  balanced: { dpi: 110, quality: 0.62 },
  max:      { dpi: 80,  quality: 0.42 },
};

cDrop.addEventListener('click', () => cInput.click());
cDrop.addEventListener('dragover', (e) => { e.preventDefault(); cDrop.classList.add('drag'); });
cDrop.addEventListener('dragleave', () => cDrop.classList.remove('drag'));
cDrop.addEventListener('drop', (e) => { e.preventDefault(); cDrop.classList.remove('drag'); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
cInput.addEventListener('change', () => { if (cInput.files[0]) loadFile(cInput.files[0]); });

document.querySelectorAll('[data-level]').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('[data-level]').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    level = el.getAttribute('data-level');
  });
});

function loadFile(file) {
  currentFile = file;
  cFileName.textContent = file.name;
  cFileSize.textContent = formatBytes(file.size);
  uploadWorkspace.style.display = 'none';
  cWorkspace.style.display = 'block';
}

cResetBtn.addEventListener('click', () => {
  currentFile = null;
  cWorkspace.style.display = 'none';
  uploadWorkspace.style.display = 'block';
  cInput.value = '';
  cStatus2.style.display = 'none';
});

cBtn.addEventListener('click', async () => {
  if (!currentFile) return;
  cBtn.disabled = true;
  cProgressTrack.style.display = 'block';
  cProgress.style.width = '5%';
  cStatus2.style.display = 'none';

  const { dpi, quality } = LEVELS[level];
  const scale = dpi / 72;

  try {
    const originalBytes = new Uint8Array(await currentFile.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: originalBytes.slice() }).promise;
    const outDoc = await PDFDocument.create();

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const baseViewport = page.getViewport({ scale: 1 });
      const renderViewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = renderViewport.width;
      canvas.height = renderViewport.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;

      const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
      const jpegBytes = Uint8Array.from(atob(jpegDataUrl.split(',')[1]), c => c.charCodeAt(0));
      const embedded = await outDoc.embedJpg(jpegBytes);

      const outPage = outDoc.addPage([baseViewport.width, baseViewport.height]);
      outPage.drawImage(embedded, { x: 0, y: 0, width: baseViewport.width, height: baseViewport.height });

      cProgress.style.width = `${10 + Math.round((i / pdf.numPages) * 80)}%`;
    }

    const outBytes = await outDoc.save();
    cProgress.style.width = '100%';

    const originalSize = currentFile.size;
    const newSize = outBytes.byteLength;
    const savedPct = Math.max(0, Math.round((1 - newSize / originalSize) * 100));

    downloadBlob(new Blob([outBytes], { type: 'application/pdf' }), 'sharmaji-tools-compressed.pdf');

    if (newSize < originalSize) {
      showStatus(cStatus2, `Done — ${formatBytes(originalSize)} → ${formatBytes(newSize)} (about ${savedPct}% smaller).`, 'ok');
    } else {
      showStatus(cStatus2, `Done — but this file was already efficient, so the result (${formatBytes(newSize)}) isn't smaller. Try "Maximum compression", or this file may not need compressing.`, 'ok');
    }
    cStatus2.style.display = 'block';
  } catch (err) {
    console.error(err);
    showStatus(cStatus2, 'Something went wrong while compressing — make sure the file is a valid PDF.', 'error');
    cStatus2.style.display = 'block';
  } finally {
    cBtn.disabled = false;
    setTimeout(() => { cProgressTrack.style.display = 'none'; cProgress.style.width = '0%'; }, 800);
  }
});
