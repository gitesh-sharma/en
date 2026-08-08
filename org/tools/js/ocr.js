import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.min.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs";
import { createWorker } from "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.esm.min.js";

const { PDFDocument, StandardFonts, TextRenderingMode } = window.PDFLib;

const oDrop = document.getElementById('oDrop');
const oInput = document.getElementById('oInput');
const oSub = document.getElementById('oSub');
const oStatus = document.getElementById('oStatus');
const uploadWorkspace = document.getElementById('uploadWorkspace');
const oWorkspace = document.getElementById('oWorkspace');
const oFileName = document.getElementById('oFileName');
const oFileSize = document.getElementById('oFileSize');
const oBtn = document.getElementById('oBtn');
const oResetBtn = document.getElementById('oResetBtn');
const oStatus2 = document.getElementById('oStatus2');
const oProgressTrack = document.getElementById('oProgressTrack');
const oProgress = document.getElementById('oProgress');
const oProgressLabel = document.getElementById('oProgressLabel');

let currentFile = null;
let dpi = 200;

oDrop.addEventListener('click', () => oInput.click());
oDrop.addEventListener('dragover', (e) => { e.preventDefault(); oDrop.classList.add('drag'); });
oDrop.addEventListener('dragleave', () => oDrop.classList.remove('drag'));
oDrop.addEventListener('drop', (e) => { e.preventDefault(); oDrop.classList.remove('drag'); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
oInput.addEventListener('change', () => { if (oInput.files[0]) loadFile(oInput.files[0]); });

document.querySelectorAll('[data-dpi]').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('[data-dpi]').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    dpi = parseInt(el.getAttribute('data-dpi'), 10);
  });
});

function loadFile(file) {
  currentFile = file;
  oFileName.textContent = file.name;
  oFileSize.textContent = formatBytes(file.size);
  uploadWorkspace.style.display = 'none';
  oWorkspace.style.display = 'block';
}

oResetBtn.addEventListener('click', () => {
  currentFile = null;
  oWorkspace.style.display = 'none';
  uploadWorkspace.style.display = 'block';
  oInput.value = '';
  oStatus2.style.display = 'none';
});

oBtn.addEventListener('click', async () => {
  if (!currentFile) return;
  oBtn.disabled = true;
  oProgressTrack.style.display = 'block';
  oProgressLabel.style.display = 'block';
  oProgress.style.width = '3%';
  oStatus2.style.display = 'none';

  let worker = null;
  try {
    const originalBytes = new Uint8Array(await currentFile.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: originalBytes.slice() }).promise;
    const outDoc = await PDFDocument.create();
    const font = await outDoc.embedFont(StandardFonts.Helvetica);

    oProgressLabel.textContent = 'Starting the OCR engine…';
    worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          oProgressLabel.textContent = `Reading page ${currentPageNum} of ${pdf.numPages} — ${Math.round(m.progress * 100)}%`;
        }
      },
    });

    const scale = dpi / 72;
    var currentPageNum = 0;

    for (let i = 1; i <= pdf.numPages; i++) {
      currentPageNum = i;
      const page = await pdf.getPage(i);
      const baseViewport = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;

      oProgressLabel.textContent = `Reading page ${i} of ${pdf.numPages}…`;
      const result = await worker.recognize(canvas);

      const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const jpegBytes = Uint8Array.from(atob(jpegDataUrl.split(',')[1]), c => c.charCodeAt(0));
      const embedded = await outDoc.embedJpg(jpegBytes);
      const outPage = outDoc.addPage([baseViewport.width, baseViewport.height]);
      outPage.drawImage(embedded, { x: 0, y: 0, width: baseViewport.width, height: baseViewport.height });

      const words = (result.data.words || []);
      for (const w of words) {
        if (!w.text || !w.text.trim() || w.confidence < 35) continue;
        if (!/^[\x00-\x7F]*$/.test(w.text)) continue; // keep to WinAnsi-safe characters for the built-in font
        const x0 = w.bbox.x0 / scale, x1 = w.bbox.x1 / scale;
        const y0 = w.bbox.y0 / scale, y1 = w.bbox.y1 / scale;
        const boxW = Math.max(1, x1 - x0);
        const boxH = Math.max(1, y1 - y0);
        const size = boxH * 0.92;
        let fitSize = size;
        const textWidth = font.widthOfTextAtSize(w.text, size);
        if (textWidth > 0) fitSize = size * (boxW / textWidth);
        try {
          outPage.drawText(w.text, {
            x: x0,
            y: baseViewport.height - y1,
            size: Math.min(size, fitSize) || size,
            font,
            renderingMode: TextRenderingMode.Invisible,
          });
        } catch (e) { /* skip words the base font can't encode */ }
      }

      oProgress.style.width = `${5 + Math.round((i / pdf.numPages) * 90)}%`;
    }

    await worker.terminate();
    worker = null;

    const outBytes = await outDoc.save();
    oProgress.style.width = '100%';
    oProgressLabel.textContent = 'Done.';
    downloadBlob(new Blob([outBytes], { type: 'application/pdf' }), 'sharmaji-tools-searchable.pdf');
    showStatus(oStatus2, 'Done — the PDF now has selectable, searchable text.', 'ok');
    oStatus2.style.display = 'block';
  } catch (err) {
    console.error(err);
    showStatus(oStatus2, 'Something went wrong during OCR — please try again, or try a different page quality setting.', 'error');
    oStatus2.style.display = 'block';
  } finally {
    if (worker) { try { await worker.terminate(); } catch (e) {} }
    oBtn.disabled = false;
    setTimeout(() => { oProgressTrack.style.display = 'none'; oProgressLabel.style.display = 'none'; oProgress.style.width = '0%'; }, 1200);
  }
});
