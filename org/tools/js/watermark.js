import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.min.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs";

const { PDFDocument, StandardFonts, rgb, degrees } = window.PDFLib;

/* ---------- tab switching ---------- */
const tabAddBtn = document.getElementById('tabAddBtn');
const tabRemoveBtn = document.getElementById('tabRemoveBtn');
const addPanel = document.getElementById('addPanel');
const removePanel = document.getElementById('removePanel');
tabAddBtn.addEventListener('click', () => { tabAddBtn.classList.add('active'); tabRemoveBtn.classList.remove('active'); addPanel.style.display=''; removePanel.style.display='none'; });
tabRemoveBtn.addEventListener('click', () => { tabRemoveBtn.classList.add('active'); tabAddBtn.classList.remove('active'); removePanel.style.display=''; addPanel.style.display='none'; });

function hexToRgb01(hex) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.substring(0,2),16)/255, g: parseInt(h.substring(2,4),16)/255, b: parseInt(h.substring(4,6),16)/255 };
}

/* =========================================================
   ADD WATERMARK
   ========================================================= */
const addDrop = document.getElementById('addDrop');
const addInput = document.getElementById('addInput');
const addSub = document.getElementById('addSub');
const addOptions = document.getElementById('addOptions');
const addBtn = document.getElementById('addBtn');
const addStatus = document.getElementById('addStatus');
const addProgressTrack = document.getElementById('addProgressTrack');
const addProgress = document.getElementById('addProgress');
const wmText = document.getElementById('wmText');
const wmColor = document.getElementById('wmColor');
const wmOpacity = document.getElementById('wmOpacity');
const wmSize = document.getElementById('wmSize');
const wmAngle = document.getElementById('wmAngle');

let addFile = null;
let wmLayout = 'tiled';

addDrop.addEventListener('click', () => addInput.click());
addDrop.addEventListener('dragover', (e) => { e.preventDefault(); addDrop.classList.add('drag'); });
addDrop.addEventListener('dragleave', () => addDrop.classList.remove('drag'));
addDrop.addEventListener('drop', (e) => { e.preventDefault(); addDrop.classList.remove('drag'); if (e.dataTransfer.files[0]) { addFile = e.dataTransfer.files[0]; addSub.textContent = addFile.name; addOptions.style.display = 'block'; } });
addInput.addEventListener('change', () => { if (addInput.files[0]) { addFile = addInput.files[0]; addSub.textContent = addFile.name; addOptions.style.display = 'block'; } });

document.querySelectorAll('[data-layout]').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('[data-layout]').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    wmLayout = el.getAttribute('data-layout');
  });
});

addBtn.addEventListener('click', async () => {
  if (!addFile || !wmText.value.trim()) return;
  addBtn.disabled = true;
  addProgressTrack.style.display = 'block';
  addProgress.style.width = '10%';
  addStatus.style.display = 'none';
  try {
    const bytes = new Uint8Array(await addFile.arrayBuffer());
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const col = hexToRgb01(wmColor.value);
    const opacity = Number(wmOpacity.value) / 100;
    const size = Number(wmSize.value);
    const angle = Number(wmAngle.value);
    const text = wmText.value;
    const textWidth = font.widthOfTextAtSize(text, size);

    const pages = doc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width: pw, height: ph } = page.getSize();
      if (wmLayout === 'single') {
        page.drawText(text, {
          x: (pw - textWidth) / 2, y: ph / 2, size, font,
          color: rgb(col.r, col.g, col.b), opacity, rotate: degrees(angle),
        });
      } else {
        const spacingX = textWidth + 90;
        const spacingY = size * 4.2;
        let row = 0;
        for (let y = -spacingY; y < ph + spacingY; y += spacingY) {
          const offset = (row % 2) * (spacingX / 2);
          for (let x = -spacingX - offset; x < pw + spacingX; x += spacingX) {
            page.drawText(text, {
              x, y, size, font, color: rgb(col.r, col.g, col.b), opacity, rotate: degrees(angle),
            });
          }
          row++;
        }
      }
      addProgress.style.width = `${10 + Math.round(((i + 1) / pages.length) * 80)}%`;
    }

    const outBytes = await doc.save();
    addProgress.style.width = '100%';
    downloadBlob(new Blob([outBytes], { type: 'application/pdf' }), 'sharmaji-tools-watermarked.pdf');
    showStatus(addStatus, 'Done — the watermark has been applied to every page.', 'ok');
    addStatus.style.display = 'block';
  } catch (err) {
    console.error(err);
    showStatus(addStatus, 'Something went wrong — make sure the file is a valid PDF.', 'error');
    addStatus.style.display = 'block';
  } finally {
    addBtn.disabled = false;
    setTimeout(() => { addProgressTrack.style.display = 'none'; addProgress.style.width = '0%'; }, 800);
  }
});

/* =========================================================
   REMOVE WATERMARK
   ========================================================= */
const removeDrop = document.getElementById('removeDrop');
const removeInput = document.getElementById('removeInput');
const removeSub = document.getElementById('removeSub');
const removeOptions = document.getElementById('removeOptions');
const removeBtn = document.getElementById('removeBtn');
const removeStatus = document.getElementById('removeStatus');
const removeProgressTrack = document.getElementById('removeProgressTrack');
const removeProgress = document.getElementById('removeProgress');
const rmText = document.getElementById('rmText');
const rmColor = document.getElementById('rmColor');

let removeFile = null;

removeDrop.addEventListener('click', () => removeInput.click());
removeDrop.addEventListener('dragover', (e) => { e.preventDefault(); removeDrop.classList.add('drag'); });
removeDrop.addEventListener('dragleave', () => removeDrop.classList.remove('drag'));
removeDrop.addEventListener('drop', (e) => { e.preventDefault(); removeDrop.classList.remove('drag'); if (e.dataTransfer.files[0]) setRemoveFile(e.dataTransfer.files[0]); });
removeInput.addEventListener('change', () => { if (removeInput.files[0]) setRemoveFile(removeInput.files[0]); });

function setRemoveFile(file) {
  removeFile = file;
  removeSub.textContent = `${file.name} — ready.`;
  removeOptions.style.display = 'block';
}

removeBtn.addEventListener('click', async () => {
  const search = rmText.value.trim();
  if (!removeFile || !search) return;
  removeBtn.disabled = true;
  removeProgressTrack.style.display = 'block';
  removeProgress.style.width = '10%';
  removeStatus.style.display = 'none';

  try {
    const originalBytes = new Uint8Array(await removeFile.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: originalBytes.slice() }).promise;
    const doc = await PDFDocument.load(originalBytes, { ignoreEncryption: true });
    const docPages = doc.getPages();
    const col = hexToRgb01(rmColor.value);
    const needle = search.toUpperCase();
    let matchCount = 0;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const outPage = docPages[i - 1];

      for (const item of content.items) {
        if (!item.str || !item.str.toUpperCase().includes(needle)) continue;
        const [a, b, , , e, f] = item.transform;
        const angleDeg = Math.atan2(b, a) * (180 / Math.PI);
        const fontHeight = Math.hypot(a, b) || item.height || 12;
        const width = item.width || (fontHeight * item.str.length * 0.55);
        outPage.drawRectangle({
          x: e, y: f - fontHeight * 0.25,
          width, height: fontHeight * 1.3,
          rotate: degrees(angleDeg),
          color: rgb(col.r, col.g, col.b),
        });
        matchCount++;
      }
      removeProgress.style.width = `${10 + Math.round((i / pdf.numPages) * 80)}%`;
    }

    if (matchCount === 0) {
      showStatus(removeStatus, `Couldn't find "${search}" on any page — check the spelling matches exactly.`, 'error');
      removeStatus.style.display = 'block';
    } else {
      const outBytes = await doc.save();
      removeProgress.style.width = '100%';
      downloadBlob(new Blob([outBytes], { type: 'application/pdf' }), 'sharmaji-tools-unwatermarked.pdf');
      showStatus(removeStatus, `Done — covered ${matchCount} match${matchCount > 1 ? 'es' : ''} of "${search}".`, 'ok');
      removeStatus.style.display = 'block';
    }
  } catch (err) {
    console.error(err);
    showStatus(removeStatus, 'Something went wrong — make sure the file is a valid, non-corrupted PDF.', 'error');
    removeStatus.style.display = 'block';
  } finally {
    removeBtn.disabled = false;
    setTimeout(() => { removeProgressTrack.style.display = 'none'; removeProgress.style.width = '0%'; }, 800);
  }
});
