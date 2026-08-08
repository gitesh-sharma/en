import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.min.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs";

const { PDFDocument } = window.PDFLib;

/* ---------- elements ---------- */
const eDrop = document.getElementById('eDrop');
const eInput = document.getElementById('eInput');
const eSub = document.getElementById('eSub');
const eStatus = document.getElementById('eStatus');
const uploadWorkspace = document.getElementById('uploadWorkspace');
const sigWorkspace = document.getElementById('sigWorkspace');
const placeWorkspace = document.getElementById('placeWorkspace');

const sigDrawTab = document.getElementById('sigDrawTab');
const sigTypeTab = document.getElementById('sigTypeTab');
const sigDrawPanel = document.getElementById('sigDrawPanel');
const sigTypePanel = document.getElementById('sigTypePanel');
const sigPad = document.getElementById('sigPad');
const sigClearBtn = document.getElementById('sigClearBtn');
const sigUseDrawBtn = document.getElementById('sigUseDrawBtn');
const sigTypeInput = document.getElementById('sigTypeInput');
const sigTypePreview = document.getElementById('sigTypePreview');
const sigUseTypeBtn = document.getElementById('sigUseTypeBtn');

const ePrev = document.getElementById('ePrev');
const eNext = document.getElementById('eNext');
const ePageInfo = document.getElementById('ePageInfo');
const eCanvasBox = document.getElementById('eCanvasBox');
const eCanvas = document.getElementById('eCanvas');
const eCtx = eCanvas.getContext('2d');
const sigSizeSlider = document.getElementById('sigSizeSlider');
const sigDeleteBtn = document.getElementById('sigDeleteBtn');
const sigNewBtn = document.getElementById('sigNewBtn');
const eStatus2 = document.getElementById('eStatus2');
const eProgressTrack = document.getElementById('eProgressTrack');
const eProgress = document.getElementById('eProgress');
const eSaveBtn = document.getElementById('eSaveBtn');
const eResetBtn = document.getElementById('eResetBtn');

let sourceBytes = null;
let pages = [];        // { pdfWidth, pdfHeight, img }
let currentPage = 0;
let currentSignature = null; // { dataUrl, naturalW, naturalH }
let placements = [];   // { id, page, x, y, widthPts, heightPts, dataUrl, naturalW, naturalH }
let selectedId = null;
let nextId = 1;

/* =========================================================
   UPLOAD PDF
   ========================================================= */
eDrop.addEventListener('click', () => eInput.click());
eDrop.addEventListener('dragover', (e) => { e.preventDefault(); eDrop.classList.add('drag'); });
eDrop.addEventListener('dragleave', () => eDrop.classList.remove('drag'));
eDrop.addEventListener('drop', (e) => { e.preventDefault(); eDrop.classList.remove('drag'); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
eInput.addEventListener('change', () => { if (eInput.files[0]) loadFile(eInput.files[0]); });

async function loadFile(file) {
  eSub.textContent = 'Reading file and rendering pages…';
  eStatus.style.display = 'none';
  try {
    sourceBytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: sourceBytes.slice() }).promise;
    pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const baseViewport = page.getViewport({ scale: 1 });
      const targetWidth = 860;
      const scale = Math.min(2, targetWidth / baseViewport.width);
      const viewport = page.getViewport({ scale });
      const off = document.createElement('canvas');
      off.width = viewport.width; off.height = viewport.height;
      await page.render({ canvasContext: off.getContext('2d'), viewport }).promise;
      const img = new Image();
      img.src = off.toDataURL('image/png');
      await new Promise(res => { img.onload = res; });
      pages.push({ pdfWidth: baseViewport.width, pdfHeight: baseViewport.height, img });
    }
    uploadWorkspace.style.display = 'none';
    sigWorkspace.style.display = 'block';
  } catch (err) {
    console.error(err);
    showStatus(eStatus, 'Could not read that file — is it a valid, non-corrupted PDF?', 'error');
    eStatus.style.display = 'block';
  }
}

/* =========================================================
   SIGNATURE CREATION
   ========================================================= */
sigDrawTab.addEventListener('click', () => { sigDrawTab.classList.add('active'); sigTypeTab.classList.remove('active'); sigDrawPanel.style.display=''; sigTypePanel.style.display='none'; });
sigTypeTab.addEventListener('click', () => { sigTypeTab.classList.add('active'); sigDrawTab.classList.remove('active'); sigTypePanel.style.display=''; sigDrawPanel.style.display='none'; });

/* --- draw pad --- */
const padCtx = sigPad.getContext('2d');
padCtx.lineWidth = 3; padCtx.lineCap = 'round'; padCtx.lineJoin = 'round'; padCtx.strokeStyle = '#16223B';
let padDrawing = false, padHasInk = false;

function padPoint(e) {
  const rect = sigPad.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (sigPad.width / rect.width),
    y: (e.clientY - rect.top) * (sigPad.height / rect.height),
  };
}
sigPad.addEventListener('pointerdown', (e) => {
  padDrawing = true; padHasInk = true;
  sigPad.setPointerCapture(e.pointerId);
  const p = padPoint(e);
  padCtx.beginPath(); padCtx.moveTo(p.x, p.y);
});
sigPad.addEventListener('pointermove', (e) => {
  if (!padDrawing) return;
  const p = padPoint(e);
  padCtx.lineTo(p.x, p.y); padCtx.stroke();
});
sigPad.addEventListener('pointerup', () => { padDrawing = false; });
sigClearBtn.addEventListener('click', () => { padCtx.clearRect(0, 0, sigPad.width, sigPad.height); padHasInk = false; });

sigUseDrawBtn.addEventListener('click', () => {
  if (!padHasInk) { alert('Draw a signature first.'); return; }
  const trimmed = trimCanvas(sigPad);
  currentSignature = { dataUrl: trimmed.toDataURL('image/png'), naturalW: trimmed.width, naturalH: trimmed.height };
  enterPlacementMode();
});

/* --- type pad --- */
let sigFont = 'Dancing Script';
document.querySelectorAll('.font-pill').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.font-pill').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    sigFont = el.getAttribute('data-font');
    sigTypePreview.style.fontFamily = `'${sigFont}', cursive`;
  });
});
sigTypeInput.addEventListener('input', () => { sigTypePreview.textContent = sigTypeInput.value || 'Your name'; });

sigUseTypeBtn.addEventListener('click', async () => {
  const text = sigTypeInput.value.trim();
  if (!text) { alert('Type your name first.'); return; }
  try { await document.fonts.load(`56px "${sigFont}"`); } catch (e) { /* continue anyway */ }
  const off = document.createElement('canvas');
  const measureCtx = off.getContext('2d');
  measureCtx.font = `56px "${sigFont}"`;
  const metrics = measureCtx.measureText(text);
  off.width = Math.ceil(metrics.width) + 40;
  off.height = 120;
  const ctx = off.getContext('2d');
  ctx.font = `56px "${sigFont}"`;
  ctx.fillStyle = '#16223B';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 20, off.height / 2);
  const trimmed = trimCanvas(off);
  currentSignature = { dataUrl: trimmed.toDataURL('image/png'), naturalW: trimmed.width, naturalH: trimmed.height };
  enterPlacementMode();
});

function trimCanvas(srcCanvas) {
  const ctx = srcCanvas.getContext('2d');
  const { width, height } = srcCanvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width, minY = height, maxX = 0, maxY = 0, found = false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 10) {
        found = true;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) return srcCanvas;
  const pad = 6;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(width, maxX + pad); maxY = Math.min(height, maxY + pad);
  const w = maxX - minX, h = maxY - minY;
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  out.getContext('2d').drawImage(srcCanvas, minX, minY, w, h, 0, 0, w, h);
  return out;
}

/* =========================================================
   PLACEMENT
   ========================================================= */
function enterPlacementMode() {
  sigWorkspace.style.display = 'none';
  placeWorkspace.style.display = 'block';
  currentPage = 0;
  renderPage();
}
sigNewBtn.addEventListener('click', () => {
  placeWorkspace.style.display = 'none';
  sigWorkspace.style.display = 'block';
});

function renderPage() {
  const p = pages[currentPage];
  eCanvas.width = p.img.width;
  eCanvas.height = p.img.height;
  eCtx.clearRect(0, 0, eCanvas.width, eCanvas.height);
  eCtx.drawImage(p.img, 0, 0);
  ePageInfo.textContent = `Page ${currentPage + 1} of ${pages.length}`;
  layoutPlacements();
}
ePrev.addEventListener('click', () => { if (currentPage > 0) { currentPage--; renderPage(); } });
eNext.addEventListener('click', () => { if (currentPage < pages.length - 1) { currentPage++; renderPage(); } });
window.addEventListener('resize', () => { if (placeWorkspace.style.display !== 'none') layoutPlacements(); });

function pdfToCss(pt) {
  const p = pages[currentPage];
  const rect = eCanvas.getBoundingClientRect();
  const scaleCss = rect.width / p.pdfWidth;
  return { x: pt.x * scaleCss, y: (p.pdfHeight - pt.y) * scaleCss, scale: scaleCss };
}
function cssToPdf(cssX, cssY) {
  const p = pages[currentPage];
  const rect = eCanvas.getBoundingClientRect();
  const scaleCss = rect.width / p.pdfWidth;
  return { x: cssX / scaleCss, y: p.pdfHeight - (cssY / scaleCss) };
}

eCanvas.addEventListener('click', (e) => {
  if (!currentSignature) return;
  const rect = eCanvas.getBoundingClientRect();
  const cssX = e.clientX - rect.left, cssY = e.clientY - rect.top;
  const pdfPt = cssToPdf(cssX, cssY);
  const widthPts = 150;
  const heightPts = widthPts * (currentSignature.naturalH / currentSignature.naturalW);
  const placement = {
    id: nextId++, page: currentPage,
    x: pdfPt.x - widthPts / 2, y: pdfPt.y - heightPts / 2,
    widthPts, heightPts,
    dataUrl: currentSignature.dataUrl, naturalW: currentSignature.naturalW, naturalH: currentSignature.naturalH,
  };
  placements.push(placement);
  selectedId = placement.id;
  layoutPlacements();
});

function layoutPlacements() {
  eCanvasBox.querySelectorAll('.placed-sig').forEach(n => n.remove());
  placements.filter(pl => pl.page === currentPage).forEach(pl => {
    const topLeftPdf = { x: pl.x, y: pl.y + pl.heightPts };
    const css = pdfToCss(topLeftPdf);
    const div = document.createElement('div');
    div.className = 'placed-sig' + (pl.id === selectedId ? ' selected' : '');
    div.style.left = css.x + 'px';
    div.style.top = css.y + 'px';
    div.style.width = (pl.widthPts * css.scale) + 'px';
    div.style.height = (pl.heightPts * css.scale) + 'px';
    div.innerHTML = `<img src="${pl.dataUrl}" alt="signature">`;
    div.addEventListener('pointerdown', (e) => startDrag(e, pl));
    div.addEventListener('click', (e) => { e.stopPropagation(); selectedId = pl.id; layoutPlacements(); updateSizeSlider(); });
    eCanvasBox.appendChild(div);
  });
  updateSizeSlider();
}

function updateSizeSlider() {
  const pl = placements.find(p => p.id === selectedId && p.page === currentPage);
  sigSizeSlider.disabled = !pl;
  if (pl) sigSizeSlider.value = Math.round(pl.widthPts);
}

let dragCtx = null;
function startDrag(e, pl) {
  e.preventDefault(); e.stopPropagation();
  selectedId = pl.id;
  const rect = eCanvasBox.getBoundingClientRect();
  dragCtx = { pl, startClientX: e.clientX, startClientY: e.clientY, startPdf: { x: pl.x, y: pl.y } };
  const p = pages[currentPage];
  const canvasRect = eCanvas.getBoundingClientRect();
  dragCtx.scaleCss = canvasRect.width / p.pdfWidth;
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd);
  layoutPlacements();
}
function onDragMove(e) {
  if (!dragCtx) return;
  const dxCss = e.clientX - dragCtx.startClientX;
  const dyCss = e.clientY - dragCtx.startClientY;
  const dxPdf = dxCss / dragCtx.scaleCss;
  const dyPdf = -dyCss / dragCtx.scaleCss;
  dragCtx.pl.x = dragCtx.startPdf.x + dxPdf;
  dragCtx.pl.y = dragCtx.startPdf.y + dyPdf;
  layoutPlacements();
}
function onDragEnd() {
  dragCtx = null;
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragEnd);
}

sigSizeSlider.addEventListener('input', () => {
  const pl = placements.find(p => p.id === selectedId && p.page === currentPage);
  if (!pl) return;
  const newWidth = Number(sigSizeSlider.value);
  const ratio = pl.heightPts / pl.widthPts;
  pl.widthPts = newWidth;
  pl.heightPts = newWidth * ratio;
  layoutPlacements();
});

sigDeleteBtn.addEventListener('click', () => {
  placements = placements.filter(p => p.id !== selectedId);
  selectedId = null;
  layoutPlacements();
});

eResetBtn.addEventListener('click', () => {
  sourceBytes = null; pages = []; placements = []; currentSignature = null; selectedId = null;
  placeWorkspace.style.display = 'none';
  sigWorkspace.style.display = 'none';
  uploadWorkspace.style.display = 'block';
  eInput.value = '';
});

/* =========================================================
   SAVE
   ========================================================= */
eSaveBtn.addEventListener('click', async () => {
  if (placements.length === 0) {
    showStatus(eStatus2, 'Place at least one signature before saving.', 'error');
    eStatus2.style.display = 'block';
    return;
  }
  eSaveBtn.disabled = true;
  eProgressTrack.style.display = 'block';
  eProgress.style.width = '10%';
  eStatus2.style.display = 'none';
  try {
    const doc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
    const docPages = doc.getPages();
    const embedCache = new Map();
    for (let i = 0; i < placements.length; i++) {
      const pl = placements[i];
      let img = embedCache.get(pl.dataUrl);
      if (!img) {
        const bin = atob(pl.dataUrl.split(',')[1]);
        const arr = new Uint8Array(bin.length);
        for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
        img = await doc.embedPng(arr);
        embedCache.set(pl.dataUrl, img);
      }
      docPages[pl.page].drawImage(img, { x: pl.x, y: pl.y, width: pl.widthPts, height: pl.heightPts });
      eProgress.style.width = `${10 + Math.round(((i + 1) / placements.length) * 80)}%`;
    }
    const outBytes = await doc.save();
    eProgress.style.width = '100%';
    downloadBlob(new Blob([outBytes], { type: 'application/pdf' }), 'sharmaji-tools-signed.pdf');
    showStatus(eStatus2, 'Done — your signed PDF is ready.', 'ok');
    eStatus2.style.display = 'block';
  } catch (err) {
    console.error(err);
    showStatus(eStatus2, 'Something went wrong while saving — please try again.', 'error');
    eStatus2.style.display = 'block';
  } finally {
    eSaveBtn.disabled = false;
    setTimeout(() => { eProgressTrack.style.display = 'none'; eProgress.style.width = '0%'; }, 800);
  }
});
