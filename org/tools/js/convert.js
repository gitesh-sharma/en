import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.min.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs";

const { PDFDocument } = window.PDFLib;

/* ---------- tab switching ---------- */
const tabImgBtn = document.getElementById('tabImgBtn');
const tabPdfBtn = document.getElementById('tabPdfBtn');
const tabWordBtn = document.getElementById('tabWordBtn');
const imgPanel = document.getElementById('imgPanel');
const pdfPanel = document.getElementById('pdfPanel');
const wordPanel = document.getElementById('wordPanel');

function showConvertTab(which) {
  [tabImgBtn, tabPdfBtn, tabWordBtn].forEach(b => b.classList.remove('active'));
  [imgPanel, pdfPanel, wordPanel].forEach(p => p.style.display = 'none');
  if (which === 'img') { tabImgBtn.classList.add('active'); imgPanel.style.display = ''; }
  if (which === 'pdf') { tabPdfBtn.classList.add('active'); pdfPanel.style.display = ''; }
  if (which === 'word') { tabWordBtn.classList.add('active'); wordPanel.style.display = ''; }
}
tabImgBtn.addEventListener('click', () => showConvertTab('img'));
tabPdfBtn.addEventListener('click', () => showConvertTab('pdf'));
tabWordBtn.addEventListener('click', () => showConvertTab('word'));

/* =========================================================
   IMAGES -> PDF
   ========================================================= */
const imgDrop = document.getElementById('imgDrop');
const imgInput = document.getElementById('imgInput');
const imgList = document.getElementById('imgList');
const imgBtn = document.getElementById('imgBtn');
const imgStatus = document.getElementById('imgStatus');
const imgProgressTrack = document.getElementById('imgProgressTrack');
const imgProgress = document.getElementById('imgProgress');

let imgFiles = [];
let pageSizeMode = 'fit';

imgDrop.addEventListener('click', () => imgInput.click());
imgDrop.addEventListener('dragover', (e) => { e.preventDefault(); imgDrop.classList.add('drag'); });
imgDrop.addEventListener('dragleave', () => imgDrop.classList.remove('drag'));
imgDrop.addEventListener('drop', (e) => { e.preventDefault(); imgDrop.classList.remove('drag'); addImgFiles(e.dataTransfer.files); });
imgInput.addEventListener('change', () => addImgFiles(imgInput.files));

document.querySelectorAll('[data-pagesize]').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('[data-pagesize]').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    pageSizeMode = el.getAttribute('data-pagesize');
  });
});

function addImgFiles(fileListObj) {
  const arr = Array.from(fileListObj).filter(f => f.type === 'image/png' || f.type === 'image/jpeg');
  imgFiles = imgFiles.concat(arr.map(f => ({ file: f })));
  renderImgList();
  imgInput.value = '';
}

function renderImgList() {
  imgList.innerHTML = '';
  imgFiles.forEach((entry, i) => {
    const li = document.createElement('li');
    li.className = 'file-row';
    li.innerHTML = `
      <span class="handle">⋮⋮</span>
      <span class="name">${i + 1}. ${entry.file.name}</span>
      <span class="size">${formatBytes(entry.file.size)}</span>
      <button data-act="up" title="Move up">↑</button>
      <button data-act="down" title="Move down">↓</button>
      <button data-act="remove" title="Remove">✕</button>
    `;
    li.querySelector('[data-act=up]').addEventListener('click', () => { if (i > 0) { [imgFiles[i-1], imgFiles[i]] = [imgFiles[i], imgFiles[i-1]]; renderImgList(); } });
    li.querySelector('[data-act=down]').addEventListener('click', () => { if (i < imgFiles.length - 1) { [imgFiles[i+1], imgFiles[i]] = [imgFiles[i], imgFiles[i+1]]; renderImgList(); } });
    li.querySelector('[data-act=remove]').addEventListener('click', () => { imgFiles.splice(i, 1); renderImgList(); });
    imgList.appendChild(li);
  });
  imgBtn.disabled = imgFiles.length < 1;
}

const A4 = { w: 595.28, h: 841.89 };
const LETTER = { w: 612, h: 792 };

imgBtn.addEventListener('click', async () => {
  imgBtn.disabled = true;
  imgProgressTrack.style.display = 'block';
  imgProgress.style.width = '5%';
  imgStatus.style.display = 'none';
  try {
    const outDoc = await PDFDocument.create();
    for (let i = 0; i < imgFiles.length; i++) {
      const file = imgFiles[i].file;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const image = file.type === 'image/png' ? await outDoc.embedPng(bytes) : await outDoc.embedJpg(bytes);
      const iw = image.width, ih = image.height;

      let page, drawW, drawH, x, y;
      if (pageSizeMode === 'fit') {
        const maxDim = 1000;
        const scale = (iw > maxDim || ih > maxDim) ? Math.min(maxDim / iw, maxDim / ih) : 1;
        drawW = iw * scale; drawH = ih * scale;
        page = outDoc.addPage([drawW, drawH]);
        x = 0; y = 0;
      } else {
        const box = pageSizeMode === 'a4' ? A4 : LETTER;
        const scale = Math.min(box.w / iw, box.h / ih);
        drawW = iw * scale; drawH = ih * scale;
        page = outDoc.addPage([box.w, box.h]);
        x = (box.w - drawW) / 2; y = (box.h - drawH) / 2;
        page.drawRectangle({ x: 0, y: 0, width: box.w, height: box.h, color: window.PDFLib.rgb(1, 1, 1) });
      }
      page.drawImage(image, { x, y, width: drawW, height: drawH });
      imgProgress.style.width = `${10 + Math.round(((i + 1) / imgFiles.length) * 80)}%`;
    }
    const outBytes = await outDoc.save();
    imgProgress.style.width = '100%';
    downloadBlob(new Blob([outBytes], { type: 'application/pdf' }), 'sharmaji-tools-images.pdf');
    showStatus(imgStatus, `Done — ${imgFiles.length} image${imgFiles.length > 1 ? 's' : ''} converted to one PDF.`, 'ok');
  } catch (err) {
    console.error(err);
    showStatus(imgStatus, 'Something went wrong — check that every file is a valid JPG or PNG.', 'error');
  } finally {
    imgBtn.disabled = imgFiles.length < 1;
    setTimeout(() => { imgProgressTrack.style.display = 'none'; imgProgress.style.width = '0%'; }, 800);
  }
});

/* =========================================================
   PDF -> IMAGES
   ========================================================= */
const pdfDrop = document.getElementById('pdfDrop');
const pdfInput = document.getElementById('pdfInput');
const pdfSub = document.getElementById('pdfSub');
const pdfOptions = document.getElementById('pdfOptions');
const pdfBtn = document.getElementById('pdfBtn');
const pdfStatus = document.getElementById('pdfStatus');
const pdfProgressTrack = document.getElementById('pdfProgressTrack');
const pdfProgress = document.getElementById('pdfProgress');

let pdfFile = null;
let pdfPageCount = 0;
let fmt = 'jpeg';
let dpi = 150;

pdfDrop.addEventListener('click', () => pdfInput.click());
pdfDrop.addEventListener('dragover', (e) => { e.preventDefault(); pdfDrop.classList.add('drag'); });
pdfDrop.addEventListener('dragleave', () => pdfDrop.classList.remove('drag'));
pdfDrop.addEventListener('drop', (e) => { e.preventDefault(); pdfDrop.classList.remove('drag'); if (e.dataTransfer.files[0]) loadPdf(e.dataTransfer.files[0]); });
pdfInput.addEventListener('change', () => { if (pdfInput.files[0]) loadPdf(pdfInput.files[0]); });

document.querySelectorAll('[data-fmt]').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('[data-fmt]').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    fmt = el.getAttribute('data-fmt');
  });
});
document.querySelectorAll('[data-dpi]').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('[data-dpi]').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    dpi = parseInt(el.getAttribute('data-dpi'), 10);
  });
});

async function loadPdf(file) {
  pdfFile = file;
  pdfSub.textContent = 'Reading file…';
  try {
    const buf = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
    pdfPageCount = doc.getPageCount();
    pdfSub.textContent = `${file.name} — ${pdfPageCount} pages loaded.`;
    pdfOptions.style.display = 'block';
  } catch (err) {
    console.error(err);
    pdfSub.textContent = 'Could not read that file — is it a valid PDF?';
    pdfOptions.style.display = 'none';
  }
}

pdfBtn.addEventListener('click', async () => {
  if (!pdfFile) return;
  pdfBtn.disabled = true;
  pdfProgressTrack.style.display = 'block';
  pdfProgress.style.width = '5%';
  pdfStatus.style.display = 'none';

  try {
    const bytes = new Uint8Array(await pdfFile.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
    const scale = dpi / 72;
    const outputs = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (fmt === 'jpeg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      await page.render({ canvasContext: ctx, viewport }).promise;

      const mime = fmt === 'jpeg' ? 'image/jpeg' : 'image/png';
      const dataUrl = canvas.toDataURL(mime, fmt === 'jpeg' ? 0.9 : undefined);
      const bin = atob(dataUrl.split(',')[1]);
      const arr = new Uint8Array(bin.length);
      for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
      outputs.push({ name: `page-${i}.${fmt === 'jpeg' ? 'jpg' : 'png'}`, data: arr, mime });

      pdfProgress.style.width = `${10 + Math.round((i / pdf.numPages) * 80)}%`;
    }

    if (outputs.length === 1) {
      downloadBlob(new Blob([outputs[0].data], { type: outputs[0].mime }), `sharmaji-tools-${outputs[0].name}`);
    } else {
      const zip = new JSZip();
      outputs.forEach(o => zip.file(o.name, o.data));
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, 'sharmaji-tools-pages.zip');
    }
    pdfProgress.style.width = '100%';
    showStatus(pdfStatus, `Done — exported ${outputs.length} image${outputs.length > 1 ? 's' : ''}.`, 'ok');
  } catch (err) {
    console.error(err);
    showStatus(pdfStatus, 'Something went wrong while converting — please try again.', 'error');
  } finally {
    pdfBtn.disabled = false;
    setTimeout(() => { pdfProgressTrack.style.display = 'none'; pdfProgress.style.width = '0%'; }, 800);
  }
});
