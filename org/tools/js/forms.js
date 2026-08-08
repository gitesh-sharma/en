import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.min.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs";

const { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFOptionList } = window.PDFLib;

/* ---------- top-level tab switching ---------- */
const tabFillBtn = document.getElementById('tabFillBtn');
const tabCreateBtn = document.getElementById('tabCreateBtn');
const fillPanel = document.getElementById('fillPanel');
const createPanel = document.getElementById('createPanel');
tabFillBtn.addEventListener('click', () => { tabFillBtn.classList.add('active'); tabCreateBtn.classList.remove('active'); fillPanel.style.display=''; createPanel.style.display='none'; });
tabCreateBtn.addEventListener('click', () => { tabCreateBtn.classList.add('active'); tabFillBtn.classList.remove('active'); createPanel.style.display=''; fillPanel.style.display='none'; });

/* =========================================================
   FILL A FORM
   ========================================================= */
const fillDrop = document.getElementById('fillDrop');
const fillInput = document.getElementById('fillInput');
const fillStatus = document.getElementById('fillStatus');
const fillUploadWorkspace = document.getElementById('fillUploadWorkspace');
const fillFieldsWorkspace = document.getElementById('fillFieldsWorkspace');
const fillFieldsList = document.getElementById('fillFieldsList');
const flattenCheck = document.getElementById('flattenCheck');
const fillSaveBtn = document.getElementById('fillSaveBtn');
const fillResetBtn = document.getElementById('fillResetBtn');
const fillStatus2 = document.getElementById('fillStatus2');
const fillProgressTrack = document.getElementById('fillProgressTrack');
const fillProgress = document.getElementById('fillProgress');

let fillBytes = null;

fillDrop.addEventListener('click', () => fillInput.click());
fillDrop.addEventListener('dragover', (e) => { e.preventDefault(); fillDrop.classList.add('drag'); });
fillDrop.addEventListener('dragleave', () => fillDrop.classList.remove('drag'));
fillDrop.addEventListener('drop', (e) => { e.preventDefault(); fillDrop.classList.remove('drag'); if (e.dataTransfer.files[0]) loadFillFile(e.dataTransfer.files[0]); });
fillInput.addEventListener('change', () => { if (fillInput.files[0]) loadFillFile(fillInput.files[0]); });

async function loadFillFile(file) {
  fillStatus.style.display = 'none';
  try {
    fillBytes = new Uint8Array(await file.arrayBuffer());
    const doc = await PDFDocument.load(fillBytes, { ignoreEncryption: true });
    const form = doc.getForm();
    const fields = form.getFields();
    if (fields.length === 0) {
      showStatus(fillStatus, "This PDF doesn't have any fillable fields — try the \"Create a Fillable PDF\" tab instead.", 'error');
      fillStatus.style.display = 'block';
      return;
    }
    renderFillFields(fields);
    fillUploadWorkspace.style.display = 'none';
    fillFieldsWorkspace.style.display = 'block';
  } catch (err) {
    console.error(err);
    showStatus(fillStatus, 'Could not read that file — is it a valid, non-corrupted PDF?', 'error');
    fillStatus.style.display = 'block';
  }
}

function renderFillFields(fields) {
  fillFieldsList.innerHTML = '';
  fields.forEach((field) => {
    const name = field.getName();
    const row = document.createElement('div');
    row.className = 'form-field-row';

    if (field instanceof PDFTextField) {
      const multiline = field.isMultiline && field.isMultiline();
      row.innerHTML = `<label>${escapeHtml(name)}</label>` +
        (multiline
          ? `<textarea data-field="${escapeAttr(name)}" data-type="text" rows="3">${escapeHtml(field.getText() || '')}</textarea>`
          : `<input type="text" data-field="${escapeAttr(name)}" data-type="text" value="${escapeAttr(field.getText() || '')}">`);
    } else if (field instanceof PDFCheckBox) {
      row.innerHTML = `<label style="display:flex; align-items:center; gap:8px;">
          <input type="checkbox" data-field="${escapeAttr(name)}" data-type="checkbox" ${field.isChecked() ? 'checked' : ''}>
          ${escapeHtml(name)}
        </label>`;
    } else if (field instanceof PDFRadioGroup) {
      const options = field.getOptions();
      const selected = field.getSelected();
      let html = `<label>${escapeHtml(name)}</label>`;
      options.forEach((opt, i) => {
        html += `<div class="radio-opt-row">
          <input type="radio" id="radio_${escapeAttr(name)}_${i}" name="radio_${escapeAttr(name)}" data-field="${escapeAttr(name)}" data-type="radio" value="${escapeAttr(opt)}" ${opt === selected ? 'checked' : ''}>
          <label for="radio_${escapeAttr(name)}_${i}">${escapeHtml(opt)}</label>
        </div>`;
      });
      row.innerHTML = html;
    } else if (field instanceof PDFDropdown) {
      const options = field.getOptions();
      const selected = field.getSelected() || [];
      let html = `<label>${escapeHtml(name)}</label><select data-field="${escapeAttr(name)}" data-type="dropdown">`;
      html += `<option value="">—</option>`;
      options.forEach(opt => { html += `<option value="${escapeAttr(opt)}" ${selected.includes(opt) ? 'selected' : ''}>${escapeHtml(opt)}</option>`; });
      html += `</select>`;
      row.innerHTML = html;
    } else if (field instanceof PDFOptionList) {
      const options = field.getOptions();
      const selected = field.getSelected() || [];
      let html = `<label>${escapeHtml(name)} (select any)</label><select multiple data-field="${escapeAttr(name)}" data-type="optionlist" size="${Math.min(6, options.length)}">`;
      options.forEach(opt => { html += `<option value="${escapeAttr(opt)}" ${selected.includes(opt) ? 'selected' : ''}>${escapeHtml(opt)}</option>`; });
      html += `</select>`;
      row.innerHTML = html;
    } else {
      row.innerHTML = `<label>${escapeHtml(name)} (unsupported field type — skipped)</label>`;
    }
    fillFieldsList.appendChild(row);
  });
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeAttr(s) { return escapeHtml(s); }

fillResetBtn.addEventListener('click', () => {
  fillBytes = null;
  fillFieldsWorkspace.style.display = 'none';
  fillUploadWorkspace.style.display = 'block';
  fillInput.value = '';
  fillStatus.style.display = 'none';
});

fillSaveBtn.addEventListener('click', async () => {
  if (!fillBytes) return;
  fillSaveBtn.disabled = true;
  fillProgressTrack.style.display = 'block';
  fillProgress.style.width = '15%';
  fillStatus2.style.display = 'none';
  try {
    const doc = await PDFDocument.load(fillBytes, { ignoreEncryption: true });
    const form = doc.getForm();
    fillProgress.style.width = '35%';

    const controls = fillFieldsList.querySelectorAll('[data-field]');
    const radiosSeen = new Set();
    controls.forEach(ctrl => {
      const name = ctrl.getAttribute('data-field');
      const type = ctrl.getAttribute('data-type');
      try {
        if (type === 'text') {
          form.getTextField(name).setText(ctrl.value);
        } else if (type === 'checkbox') {
          const cb = form.getCheckBox(name);
          if (ctrl.checked) cb.check(); else cb.uncheck();
        } else if (type === 'radio') {
          if (radiosSeen.has(name)) return;
          const checkedEl = fillFieldsList.querySelector(`input[data-field="${cssEscape(name)}"]:checked`);
          if (checkedEl) form.getRadioGroup(name).select(checkedEl.value);
          radiosSeen.add(name);
        } else if (type === 'dropdown') {
          if (ctrl.value) form.getDropdown(name).select(ctrl.value);
        } else if (type === 'optionlist') {
          const selected = Array.from(ctrl.selectedOptions).map(o => o.value);
          if (selected.length) form.getOptionList(name).select(selected);
        }
      } catch (e) { console.warn('Could not set field', name, e); }
    });

    fillProgress.style.width = '65%';
    if (flattenCheck.checked) form.flatten();

    const bytes = await doc.save();
    fillProgress.style.width = '100%';
    downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'sharmaji-tools-filled.pdf');
    showStatus(fillStatus2, 'Done — your filled PDF is ready.', 'ok');
    fillStatus2.style.display = 'block';
  } catch (err) {
    console.error(err);
    showStatus(fillStatus2, 'Something went wrong while saving — please try again.', 'error');
    fillStatus2.style.display = 'block';
  } finally {
    fillSaveBtn.disabled = false;
    setTimeout(() => { fillProgressTrack.style.display = 'none'; fillProgress.style.width = '0%'; }, 800);
  }
});

function cssEscape(s) { return String(s).replace(/["\\]/g, '\\$&'); }

/* =========================================================
   CREATE A FILLABLE PDF
   ========================================================= */
const createDrop = document.getElementById('createDrop');
const createInput = document.getElementById('createInput');
const createStatus = document.getElementById('createStatus');
const createUploadWorkspace = document.getElementById('createUploadWorkspace');
const fieldToolbar = document.getElementById('fieldToolbar');
const createCanvasWrap = document.getElementById('createCanvasWrap');
const fieldName = document.getElementById('fieldName');
const fieldOptionValue = document.getElementById('fieldOptionValue');
const fieldOptionValueWrap = document.getElementById('fieldOptionValueWrap');
const fieldOptions = document.getElementById('fieldOptions');
const fieldOptionsWrap = document.getElementById('fieldOptionsWrap');
const cPrev = document.getElementById('cPrev');
const cNext = document.getElementById('cNext');
const cPageInfo = document.getElementById('cPageInfo');
const cCanvasBox = document.getElementById('cCanvasBox');
const cCanvas = document.getElementById('cCanvas');
const cCtx = cCanvas.getContext('2d');
const placedFieldsList = document.getElementById('placedFieldsList');
const createStatus2 = document.getElementById('createStatus2');
const createProgressTrack = document.getElementById('createProgressTrack');
const createProgress = document.getElementById('createProgress');
const createSaveBtn = document.getElementById('createSaveBtn');
const createResetBtn = document.getElementById('createResetBtn');

let createSourceBytes = null;
let cPages = [];       // { pdfWidth, pdfHeight, img }
let cCurrentPage = 0;
let ftype = 'text';
let counters = { text: 0, checkbox: 0, radio: 0, dropdown: 0 };
let placedFields = []; // { id, type, name, page, x, y, w, h, optionValue, options[] }
let nextFieldId = 1;
let dragBox = null;

createDrop.addEventListener('click', () => createInput.click());
createDrop.addEventListener('dragover', (e) => { e.preventDefault(); createDrop.classList.add('drag'); });
createDrop.addEventListener('dragleave', () => createDrop.classList.remove('drag'));
createDrop.addEventListener('drop', (e) => { e.preventDefault(); createDrop.classList.remove('drag'); if (e.dataTransfer.files[0]) loadCreateFile(e.dataTransfer.files[0]); });
createInput.addEventListener('change', () => { if (createInput.files[0]) loadCreateFile(createInput.files[0]); });

async function loadCreateFile(file) {
  createStatus.style.display = 'none';
  try {
    createSourceBytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: createSourceBytes.slice() }).promise;
    cPages = [];
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
      cPages.push({ pdfWidth: baseViewport.width, pdfHeight: baseViewport.height, img });
    }
    cCurrentPage = 0;
    createUploadWorkspace.style.display = 'none';
    fieldToolbar.style.display = 'block';
    createCanvasWrap.style.display = 'block';
    suggestName();
    renderCreatePage();
  } catch (err) {
    console.error(err);
    showStatus(createStatus, 'Could not read that file — is it a valid, non-corrupted PDF?', 'error');
    createStatus.style.display = 'block';
  }
}

document.querySelectorAll('[data-ftype]').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('[data-ftype]').forEach(x => x.classList.remove('active'));
    el.classList.add('active');
    ftype = el.getAttribute('data-ftype');
    fieldOptionValueWrap.style.display = ftype === 'radio' ? '' : 'none';
    fieldOptionsWrap.style.display = ftype === 'dropdown' ? '' : 'none';
    suggestName();
  });
});
fieldOptionValueWrap.style.display = 'none';
fieldOptionsWrap.style.display = 'none';

function suggestName() {
  if (ftype === 'radio') {
    fieldName.placeholder = 'group name';
    if (!fieldName.value) fieldName.value = `radio_${counters.radio + 1}`;
    fieldOptionValue.value = `option_${1}`;
  } else {
    counters[ftype] = (counters[ftype] || 0);
    fieldName.value = `${ftype}_${counters[ftype] + 1}`;
  }
  if (ftype === 'dropdown' && !fieldOptions.value) fieldOptions.value = 'Yes, No';
}

cPrev.addEventListener('click', () => { if (cCurrentPage > 0) { cCurrentPage--; renderCreatePage(); } });
cNext.addEventListener('click', () => { if (cCurrentPage < cPages.length - 1) { cCurrentPage++; renderCreatePage(); } });

function renderCreatePage() {
  const p = cPages[cCurrentPage];
  cCanvas.width = p.img.width;
  cCanvas.height = p.img.height;
  cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
  cCtx.drawImage(p.img, 0, 0);
  cPageInfo.textContent = `Page ${cCurrentPage + 1} of ${cPages.length}`;
  layoutPlacedFields();
  renderFieldsListPanel();
}

function eventToPdf(e) {
  const rect = cCanvas.getBoundingClientRect();
  const cssX = e.clientX - rect.left, cssY = e.clientY - rect.top;
  const px = cssX * (cCanvas.width / rect.width);
  const py = cssY * (cCanvas.height / rect.height);
  const p = cPages[cCurrentPage];
  const scale = cCanvas.width / p.pdfWidth;
  return { x: px / scale, y: p.pdfHeight - (py / scale) };
}
function pdfToCss(pt) {
  const p = cPages[cCurrentPage];
  const rect = cCanvas.getBoundingClientRect();
  const scale = rect.width / p.pdfWidth;
  return { x: pt.x * scale, y: (p.pdfHeight - pt.y) * scale, scale };
}

let dragging = false, dragStartPdf = null;
cCanvas.addEventListener('mousedown', (e) => { dragging = true; dragStartPdf = eventToPdf(e); dragBox = { x1: dragStartPdf.x, y1: dragStartPdf.y, x2: dragStartPdf.x, y2: dragStartPdf.y }; });
cCanvas.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const pt = eventToPdf(e);
  dragBox.x2 = pt.x; dragBox.y2 = pt.y;
  drawDragPreview();
});
window.addEventListener('mouseup', () => {
  if (!dragging) return;
  dragging = false;
  if (dragBox) {
    const w = Math.abs(dragBox.x2 - dragBox.x1);
    const h = Math.abs(dragBox.y2 - dragBox.y1);
    if (w > 8 && h > 8) commitField(dragBox);
  }
  dragBox = null;
  renderCreatePage();
});

function drawDragPreview() {
  renderCreatePage_noFieldsRedraw();
  if (!dragBox) return;
  const c1 = pdfToCss({ x: dragBox.x1, y: dragBox.y1 });
  const c2 = pdfToCss({ x: dragBox.x2, y: dragBox.y2 });
  cCtx.save();
  cCtx.strokeStyle = '#b5342a'; cCtx.lineWidth = 2; cCtx.setLineDash([5, 4]);
  cCtx.strokeRect(Math.min(c1.x, c2.x), Math.min(c1.y, c2.y), Math.abs(c2.x - c1.x), Math.abs(c2.y - c1.y));
  cCtx.restore();
}
function renderCreatePage_noFieldsRedraw() {
  const p = cPages[cCurrentPage];
  cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
  cCtx.drawImage(p.img, 0, 0);
}

function commitField(box) {
  const x = Math.min(box.x1, box.x2), y = Math.min(box.y1, box.y2);
  const w = Math.abs(box.x2 - box.x1), h = Math.abs(box.y2 - box.y1);
  const field = {
    id: nextFieldId++, type: ftype, page: cCurrentPage, x, y, w, h,
    name: fieldName.value.trim() || `${ftype}_${nextFieldId}`,
    optionValue: fieldOptionValue.value.trim() || `option_${nextFieldId}`,
    options: fieldOptions.value.split(',').map(s => s.trim()).filter(Boolean),
  };
  placedFields.push(field);
  if (ftype !== 'radio') counters[ftype] = (counters[ftype] || 0) + 1;
  suggestName();
}

function layoutPlacedFields() {
  cCanvasBox.querySelectorAll('.placed-field').forEach(n => n.remove());
  placedFields.filter(f => f.page === cCurrentPage).forEach(f => {
    const topLeft = pdfToCss({ x: f.x, y: f.y + f.h });
    const div = document.createElement('div');
    div.className = 'placed-field';
    div.style.left = topLeft.x + 'px';
    div.style.top = topLeft.y + 'px';
    div.style.width = (f.w * topLeft.scale) + 'px';
    div.style.height = (f.h * topLeft.scale) + 'px';
    div.textContent = f.type === 'radio' ? `${f.name}:${f.optionValue}` : f.name;
    cCanvasBox.appendChild(div);
  });
}

function renderFieldsListPanel() {
  placedFieldsList.innerHTML = '';
  if (placedFields.length === 0) return;
  const heading = document.createElement('div');
  heading.style.cssText = 'font-family:var(--font-mono); font-size:0.8rem; color:var(--ink-soft); margin-bottom:8px;';
  heading.textContent = `${placedFields.length} field(s) placed`;
  placedFieldsList.appendChild(heading);
  placedFields.forEach(f => {
    const row = document.createElement('div');
    row.className = 'file-row';
    row.innerHTML = `<span class="name">${escapeHtml(f.type)} — ${escapeHtml(f.name)}${f.type==='radio' ? ' ('+escapeHtml(f.optionValue)+')' : ''} — page ${f.page+1}</span><button data-act="del">✕</button>`;
    row.querySelector('[data-act=del]').addEventListener('click', () => {
      placedFields = placedFields.filter(x => x.id !== f.id);
      renderCreatePage();
    });
    placedFieldsList.appendChild(row);
  });
}

createResetBtn.addEventListener('click', () => {
  createSourceBytes = null; cPages = []; placedFields = []; counters = { text:0, checkbox:0, radio:0, dropdown:0 };
  createCanvasWrap.style.display = 'none';
  fieldToolbar.style.display = 'none';
  createUploadWorkspace.style.display = 'block';
  createInput.value = '';
});

createSaveBtn.addEventListener('click', async () => {
  if (placedFields.length === 0) {
    showStatus(createStatus2, 'Draw at least one field on the page before saving.', 'error');
    createStatus2.style.display = 'block';
    return;
  }
  createSaveBtn.disabled = true;
  createProgressTrack.style.display = 'block';
  createProgress.style.width = '15%';
  createStatus2.style.display = 'none';
  try {
    const doc = await PDFDocument.load(createSourceBytes, { ignoreEncryption: true });
    const docPages = doc.getPages();
    const form = doc.getForm();
    const radioGroups = {};

    placedFields.forEach(f => {
      const page = docPages[f.page];
      if (f.type === 'text') {
        const tf = form.createTextField(f.name);
        tf.addToPage(page, { x: f.x, y: f.y, width: f.w, height: f.h });
      } else if (f.type === 'checkbox') {
        const cb = form.createCheckBox(f.name);
        cb.addToPage(page, { x: f.x, y: f.y, width: f.w, height: f.h });
      } else if (f.type === 'dropdown') {
        const dd = form.createDropdown(f.name);
        if (f.options.length) dd.addOptions(f.options);
        dd.addToPage(page, { x: f.x, y: f.y, width: f.w, height: f.h });
      } else if (f.type === 'radio') {
        (radioGroups[f.name] = radioGroups[f.name] || []).push(f);
      }
    });

    Object.keys(radioGroups).forEach(name => {
      const rg = form.createRadioGroup(name);
      radioGroups[name].forEach(f => {
        rg.addOptionToPage(f.optionValue, docPages[f.page], { x: f.x, y: f.y, width: f.w, height: f.h });
      });
    });

    createProgress.style.width = '80%';
    const bytes = await doc.save();
    createProgress.style.width = '100%';
    downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'sharmaji-tools-fillable.pdf');
    showStatus(createStatus2, `Done — ${placedFields.length} field(s) added.`, 'ok');
    createStatus2.style.display = 'block';
  } catch (err) {
    console.error(err);
    showStatus(createStatus2, 'Something went wrong while saving — check field names are filled in and try again.', 'error');
    createStatus2.style.display = 'block';
  } finally {
    createSaveBtn.disabled = false;
    setTimeout(() => { createProgressTrack.style.display = 'none'; createProgress.style.width = '0%'; }, 800);
  }
});
