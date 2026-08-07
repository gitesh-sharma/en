import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.min.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs";

const { PDFDocument, degrees } = window.PDFLib;

const orgDrop = document.getElementById('orgDrop');
const orgInput = document.getElementById('orgInput');
const orgSub = document.getElementById('orgSub');
const orgStatus = document.getElementById('orgStatus');
const uploadWorkspace = document.getElementById('uploadWorkspace');
const orgWorkspace = document.getElementById('orgWorkspace');
const thumbGrid = document.getElementById('thumbGrid');
const orgSaveBtn = document.getElementById('orgSaveBtn');
const orgResetBtn = document.getElementById('orgResetBtn');
const orgStatus2 = document.getElementById('orgStatus2');
const orgProgressTrack = document.getElementById('orgProgressTrack');
const orgProgress = document.getElementById('orgProgress');

let sourceBytes = null;
let pages = []; // { originalIndex, rotationDelta, dataUrl, removed:false }
let resizeMode = 'original';
let dragFromIndex = null;

orgDrop.addEventListener('click', () => orgInput.click());
orgDrop.addEventListener('dragover', (e) => { e.preventDefault(); orgDrop.classList.add('drag'); });
orgDrop.addEventListener('dragleave', () => orgDrop.classList.remove('drag'));
orgDrop.addEventListener('drop', (e) => { e.preventDefault(); orgDrop.classList.remove('drag'); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
orgInput.addEventListener('change', () => { if (orgInput.files[0]) loadFile(orgInput.files[0]); });

document.querySelectorAll('[data-resize]').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('[data-resize]').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    resizeMode = el.getAttribute('data-resize');
  });
});

orgResetBtn.addEventListener('click', () => {
  pages = []; sourceBytes = null;
  orgWorkspace.style.display = 'none';
  uploadWorkspace.style.display = 'block';
  orgInput.value = '';
  orgSub.textContent = "Thumbnails will appear below once it's loaded — this can take a moment for long files.";
});

async function loadFile(file) {
  orgSub.textContent = 'Reading file and rendering thumbnails…';
  orgStatus.style.display = 'none';
  try {
    sourceBytes = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjsLib.getDocument({ data: sourceBytes.slice() });
    const pdf = await loadingTask.promise;
    pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const baseViewport = page.getViewport({ scale: 1 });
      const targetWidth = 260;
      const scale = targetWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      pages.push({
        originalIndex: i - 1,
        rotationDelta: 0,
        dataUrl: canvas.toDataURL('image/jpeg', 0.82),
        removed: false,
      });
    }
    uploadWorkspace.style.display = 'none';
    orgWorkspace.style.display = 'block';
    renderThumbs();
  } catch (err) {
    console.error(err);
    showStatus(orgStatus, 'Could not read that file — is it a valid, non-corrupted PDF?', 'error');
    orgStatus.style.display = 'block';
  }
}

function renderThumbs() {
  thumbGrid.innerHTML = '';
  pages.forEach((p, i) => {
    if (p.removed) return;
    const div = document.createElement('div');
    div.className = 'page-thumb';
    div.draggable = true;
    div.dataset.index = i;
    div.innerHTML = `
      <span class="pg-no">${i + 1}</span>
      <img src="${p.dataUrl}" style="transform: rotate(${p.rotationDelta}deg);" alt="Page ${i + 1}">
      <div class="pg-actions">
        <button data-act="rotate" title="Rotate">⟳</button>
        <button data-act="remove" title="Remove">✕</button>
      </div>
    `;
    div.querySelector('[data-act=rotate]').addEventListener('click', () => {
      p.rotationDelta = (p.rotationDelta + 90) % 360;
      renderThumbs();
    });
    div.querySelector('[data-act=remove]').addEventListener('click', () => {
      p.removed = true;
      renderThumbs();
    });
    div.addEventListener('dragstart', () => { dragFromIndex = i; div.classList.add('dragging'); });
    div.addEventListener('dragend', () => div.classList.remove('dragging'));
    div.addEventListener('dragover', (e) => e.preventDefault());
    div.addEventListener('drop', (e) => {
      e.preventDefault();
      if (dragFromIndex === null || dragFromIndex === i) return;
      const moved = pages.splice(dragFromIndex, 1)[0];
      const targetPos = pages.indexOf(p);
      pages.splice(targetPos, 0, moved);
      dragFromIndex = null;
      renderThumbs();
    });
    thumbGrid.appendChild(div);
  });
}

const A4 = { w: 595.28, h: 841.89 };
const LETTER = { w: 612, h: 792 };

orgSaveBtn.addEventListener('click', async () => {
  const remaining = pages.filter(p => !p.removed);
  if (remaining.length === 0) {
    showStatus(orgStatus2, 'Every page has been removed — nothing to save.', 'error');
    orgStatus2.style.display = 'block';
    return;
  }
  orgSaveBtn.disabled = true;
  orgProgressTrack.style.display = 'block';
  orgProgress.style.width = '10%';
  try {
    const srcDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
    const outDoc = await PDFDocument.create();
    for (let i = 0; i < remaining.length; i++) {
      const entry = remaining[i];
      const [copied] = await outDoc.copyPages(srcDoc, [entry.originalIndex]);
      const baseRotation = copied.getRotation().angle;
      copied.setRotation(degrees((baseRotation + entry.rotationDelta) % 360));

      if (resizeMode !== 'original') {
        const { width, height } = copied.getSize();
        let factor = 1;
        if (resizeMode === 'a4') factor = Math.min(A4.w / width, A4.h / height);
        else if (resizeMode === 'letter') factor = Math.min(LETTER.w / width, LETTER.h / height);
        else factor = parseFloat(resizeMode);
        if (factor && factor !== 1) copied.scale(factor, factor);
      }

      outDoc.addPage(copied);
      orgProgress.style.width = `${10 + Math.round(((i + 1) / remaining.length) * 80)}%`;
    }
    const bytes = await outDoc.save();
    orgProgress.style.width = '100%';
    downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'sharmaji-tools-organized.pdf');
    showStatus(orgStatus2, `Done — saved a ${remaining.length}-page PDF.`, 'ok');
    orgStatus2.style.display = 'block';
  } catch (err) {
    console.error(err);
    showStatus(orgStatus2, 'Something went wrong while saving — please try again.', 'error');
    orgStatus2.style.display = 'block';
  } finally {
    orgSaveBtn.disabled = false;
    setTimeout(() => { orgProgressTrack.style.display = 'none'; orgProgress.style.width = '0%'; }, 800);
  }
});
