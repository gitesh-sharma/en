import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.min.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs";

const { PDFDocument, rgb, StandardFonts } = window.PDFLib;

const aDrop = document.getElementById('aDrop');
const aInput = document.getElementById('aInput');
const aSub = document.getElementById('aSub');
const aStatus = document.getElementById('aStatus');
const uploadWorkspace = document.getElementById('uploadWorkspace');
const annoToolbar = document.getElementById('annoToolbar');
const annoCanvasWrap = document.getElementById('annoCanvasWrap');
const canvas = document.getElementById('annoCanvas');
const canvasBox = document.getElementById('annoCanvasBox');
const ctx = canvas.getContext('2d');
const annoPrev = document.getElementById('annoPrev');
const annoNext = document.getElementById('annoNext');
const annoPageInfo = document.getElementById('annoPageInfo');
const annoColor = document.getElementById('annoColor');
const annoWidth = document.getElementById('annoWidth');
const annoUndo = document.getElementById('annoUndo');
const annoClear = document.getElementById('annoClear');
const annoSaveBtn = document.getElementById('annoSaveBtn');
const annoResetBtn = document.getElementById('annoResetBtn');
const annoStatus = document.getElementById('annoStatus');
const annoProgressTrack = document.getElementById('annoProgressTrack');
const annoProgress = document.getElementById('annoProgress');

let sourceBytes = null;
let pages = [];           // { pdfWidth, pdfHeight, img: HTMLImageElement }
let annotations = {};     // { [pageIndex]: [ {type, ...} ] }
let currentPage = 0;
let tool = 'highlight';
let dragging = false;
let dragStart = null;
let liveShape = null;
let freehandPoints = null;

/* ---------- upload ---------- */
aDrop.addEventListener('click', () => aInput.click());
aDrop.addEventListener('dragover', (e) => { e.preventDefault(); aDrop.classList.add('drag'); });
aDrop.addEventListener('dragleave', () => aDrop.classList.remove('drag'));
aDrop.addEventListener('drop', (e) => { e.preventDefault(); aDrop.classList.remove('drag'); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
aInput.addEventListener('change', () => { if (aInput.files[0]) loadFile(aInput.files[0]); });

async function loadFile(file) {
  aSub.textContent = 'Reading file and rendering pages…';
  aStatus.style.display = 'none';
  try {
    sourceBytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: sourceBytes.slice() }).promise;
    pages = [];
    annotations = {};
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
      annotations[i - 1] = [];
    }
    currentPage = 0;
    uploadWorkspace.style.display = 'none';
    annoToolbar.style.display = 'block';
    annoCanvasWrap.style.display = 'block';
    renderPage();
  } catch (err) {
    console.error(err);
    showStatus(aStatus, 'Could not read that file — is it a valid, non-corrupted PDF?', 'error');
    aStatus.style.display = 'block';
  }
}

/* ---------- tool selection ---------- */
document.querySelectorAll('[data-tool]').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('[data-tool]').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    tool = el.getAttribute('data-tool');
  });
});

/* ---------- page nav ---------- */
annoPrev.addEventListener('click', () => { if (currentPage > 0) { currentPage--; renderPage(); } });
annoNext.addEventListener('click', () => { if (currentPage < pages.length - 1) { currentPage++; renderPage(); } });

function renderPage() {
  const p = pages[currentPage];
  canvas.width = p.img.width;
  canvas.height = p.img.height;
  annoPageInfo.textContent = `Page ${currentPage + 1} of ${pages.length}`;
  redraw();
}

/* ---------- coordinate helpers ---------- */
function eventToPdf(e) {
  const rect = canvas.getBoundingClientRect();
  const cssX = e.clientX - rect.left, cssY = e.clientY - rect.top;
  const px = cssX * (canvas.width / rect.width);
  const py = cssY * (canvas.height / rect.height);
  const p = pages[currentPage];
  const scale = canvas.width / p.pdfWidth;
  return { x: px / scale, y: p.pdfHeight - (py / scale) };
}
function pdfToCanvas(pt) {
  const p = pages[currentPage];
  const scale = canvas.width / p.pdfWidth;
  return { x: pt.x * scale, y: (p.pdfHeight - pt.y) * scale };
}
function eventToCss(e) {
  const rect = canvasBox.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

/* ---------- drawing / redraw ---------- */
function redraw() {
  const p = pages[currentPage];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(p.img, 0, 0);
  (annotations[currentPage] || []).forEach(a => drawAnnotation(a));
  if (liveShape) drawAnnotation(liveShape);
}

function drawAnnotation(a) {
  ctx.save();
  ctx.strokeStyle = a.color; ctx.fillStyle = a.color; ctx.lineWidth = a.width || 3;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  if (a.type === 'highlight') {
    const c1 = pdfToCanvas({ x: a.x1, y: a.y1 }), c2 = pdfToCanvas({ x: a.x2, y: a.y2 });
    ctx.globalAlpha = 0.35;
    ctx.fillRect(Math.min(c1.x, c2.x), Math.min(c1.y, c2.y), Math.abs(c2.x - c1.x), Math.abs(c2.y - c1.y));
  } else if (a.type === 'underline') {
    const c1 = pdfToCanvas({ x: a.x1, y: a.y1 }), c2 = pdfToCanvas({ x: a.x2, y: a.y2 });
    const y = Math.max(c1.y, c2.y);
    ctx.beginPath(); ctx.moveTo(Math.min(c1.x, c2.x), y); ctx.lineTo(Math.max(c1.x, c2.x), y); ctx.stroke();
  } else if (a.type === 'rect') {
    const c1 = pdfToCanvas({ x: a.x1, y: a.y1 }), c2 = pdfToCanvas({ x: a.x2, y: a.y2 });
    ctx.strokeRect(Math.min(c1.x, c2.x), Math.min(c1.y, c2.y), Math.abs(c2.x - c1.x), Math.abs(c2.y - c1.y));
  } else if (a.type === 'draw') {
    if (a.points.length > 1) {
      ctx.beginPath();
      const start = pdfToCanvas(a.points[0]);
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < a.points.length; i++) { const c = pdfToCanvas(a.points[i]); ctx.lineTo(c.x, c.y); }
      ctx.stroke();
    }
  } else if (a.type === 'text') {
    const c = pdfToCanvas({ x: a.x, y: a.y });
    ctx.font = `${a.fontSize}px 'IBM Plex Sans', sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(a.text, c.x, c.y);
  }
  ctx.restore();
}

/* ---------- mouse interaction ---------- */
canvas.addEventListener('mousedown', (e) => {
  const pt = eventToPdf(e);
  if (tool === 'text') {
    openTextInput(e, pt);
    return;
  }
  dragging = true;
  dragStart = pt;
  if (tool === 'draw') {
    freehandPoints = [pt];
    liveShape = { type: 'draw', points: freehandPoints, color: annoColor.value, width: Number(annoWidth.value) };
  } else {
    liveShape = { type: tool, x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y, color: annoColor.value, width: Number(annoWidth.value) };
  }
});
canvas.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const pt = eventToPdf(e);
  if (tool === 'draw') {
    freehandPoints.push(pt);
  } else if (liveShape) {
    liveShape.x2 = pt.x; liveShape.y2 = pt.y;
  }
  redraw();
});
window.addEventListener('mouseup', () => {
  if (!dragging) return;
  dragging = false;
  if (liveShape) {
    const tiny = (liveShape.type !== 'draw') && Math.abs((liveShape.x2 - liveShape.x1)) < 3 && Math.abs((liveShape.y2 - liveShape.y1)) < 3;
    if (!tiny) {
      annotations[currentPage] = annotations[currentPage] || [];
      annotations[currentPage].push(liveShape);
    }
  }
  liveShape = null;
  freehandPoints = null;
  redraw();
});

function openTextInput(e, pdfPt) {
  const css = eventToCss(e);
  const existing = canvasBox.querySelector('input.anno-text-input');
  if (existing) existing.remove();
  const inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'anno-text-input';
  inp.placeholder = 'Type, then press Enter';
  inp.style.cssText = `position:absolute; left:${css.x}px; top:${css.y}px; font-family:'IBM Plex Sans',sans-serif; font-size:14px; border:1px solid var(--stamp); border-radius:3px; padding:3px 6px; background:#fff; z-index:10; min-width:160px;`;
  canvasBox.appendChild(inp);
  inp.focus();
  const commit = () => {
    if (inp.value.trim()) {
      annotations[currentPage] = annotations[currentPage] || [];
      annotations[currentPage].push({ type: 'text', x: pdfPt.x, y: pdfPt.y, text: inp.value.trim(), color: annoColor.value, fontSize: 16 });
      redraw();
    }
    inp.remove();
  };
  inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') commit(); if (ev.key === 'Escape') inp.remove(); });
  inp.addEventListener('blur', commit);
}

/* ---------- undo / clear ---------- */
annoUndo.addEventListener('click', () => {
  const list = annotations[currentPage];
  if (list && list.length) { list.pop(); redraw(); }
});
annoClear.addEventListener('click', () => { annotations[currentPage] = []; redraw(); });

annoResetBtn.addEventListener('click', () => {
  sourceBytes = null; pages = []; annotations = {}; currentPage = 0;
  annoToolbar.style.display = 'none';
  annoCanvasWrap.style.display = 'none';
  uploadWorkspace.style.display = 'block';
  aInput.value = '';
});

/* ---------- export ---------- */
annoSaveBtn.addEventListener('click', async () => {
  annoSaveBtn.disabled = true;
  annoProgressTrack.style.display = 'block';
  annoProgress.style.width = '10%';
  annoStatus.style.display = 'none';
  try {
    const doc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
    const docPages = doc.getPages();
    const font = await doc.embedFont(StandardFonts.Helvetica);

    const pageIndices = Object.keys(annotations).map(Number).filter(i => annotations[i].length);
    for (let n = 0; n < pageIndices.length; n++) {
      const idx = pageIndices[n];
      const page = docPages[idx];
      for (const a of annotations[idx]) {
        const col = hexToRgb01(a.color);
        if (a.type === 'highlight') {
          const x = Math.min(a.x1, a.x2), y = Math.min(a.y1, a.y2);
          const w = Math.abs(a.x2 - a.x1), h = Math.abs(a.y2 - a.y1);
          page.drawRectangle({ x, y, width: w, height: h, color: rgb(col.r, col.g, col.b), opacity: 0.35 });
        } else if (a.type === 'underline') {
          const y = Math.max(a.y1, a.y2);
          page.drawLine({ start: { x: Math.min(a.x1, a.x2), y }, end: { x: Math.max(a.x1, a.x2), y }, thickness: a.width, color: rgb(col.r, col.g, col.b) });
        } else if (a.type === 'rect') {
          const x = Math.min(a.x1, a.x2), y = Math.min(a.y1, a.y2);
          const w = Math.abs(a.x2 - a.x1), h = Math.abs(a.y2 - a.y1);
          page.drawRectangle({ x, y, width: w, height: h, borderColor: rgb(col.r, col.g, col.b), borderWidth: a.width });
        } else if (a.type === 'draw') {
          for (let i = 0; i < a.points.length - 1; i++) {
            page.drawLine({ start: a.points[i], end: a.points[i + 1], thickness: a.width, color: rgb(col.r, col.g, col.b) });
          }
        } else if (a.type === 'text') {
          page.drawText(a.text, { x: a.x, y: a.y - a.fontSize, size: a.fontSize, font, color: rgb(col.r, col.g, col.b) });
        }
      }
      annoProgress.style.width = `${10 + Math.round(((n + 1) / Math.max(1, pageIndices.length)) * 80)}%`;
    }

    const bytes = await doc.save();
    annoProgress.style.width = '100%';
    downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'sharmaji-tools-annotated.pdf');
    showStatus(annoStatus, 'Done — your marked-up PDF is ready.', 'ok');
    annoStatus.style.display = 'block';
  } catch (err) {
    console.error(err);
    showStatus(annoStatus, 'Something went wrong while saving — please try again.', 'error');
    annoStatus.style.display = 'block';
  } finally {
    annoSaveBtn.disabled = false;
    setTimeout(() => { annoProgressTrack.style.display = 'none'; annoProgress.style.width = '0%'; }, 800);
  }
});

function hexToRgb01(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16) / 255,
    g: parseInt(h.substring(2, 4), 16) / 255,
    b: parseInt(h.substring(4, 6), 16) / 255,
  };
}
