(function () {
  const { PDFDocument } = PDFLib;

  /* ---------- tab switching ---------- */
  const tabMergeBtn = document.getElementById('tabMergeBtn');
  const tabSplitBtn = document.getElementById('tabSplitBtn');
  const mergePanel = document.getElementById('mergePanel');
  const splitPanel = document.getElementById('splitPanel');

  tabMergeBtn.addEventListener('click', () => {
    tabMergeBtn.classList.add('active');
    tabSplitBtn.classList.remove('active');
    mergePanel.style.display = '';
    splitPanel.style.display = 'none';
  });
  tabSplitBtn.addEventListener('click', () => {
    tabSplitBtn.classList.add('active');
    tabMergeBtn.classList.remove('active');
    splitPanel.style.display = '';
    mergePanel.style.display = 'none';
  });

  /* =========================================================
     MERGE
     ========================================================= */
  const mergeDrop = document.getElementById('mergeDrop');
  const mergeInput = document.getElementById('mergeInput');
  const mergeList = document.getElementById('mergeList');
  const mergeBtn = document.getElementById('mergeBtn');
  const mergeStatus = document.getElementById('mergeStatus');
  const mergeProgressTrack = document.getElementById('mergeProgressTrack');
  const mergeProgress = document.getElementById('mergeProgress');

  let mergeFiles = []; // { file }

  mergeDrop.addEventListener('click', () => mergeInput.click());
  mergeDrop.addEventListener('dragover', (e) => { e.preventDefault(); mergeDrop.classList.add('drag'); });
  mergeDrop.addEventListener('dragleave', () => mergeDrop.classList.remove('drag'));
  mergeDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    mergeDrop.classList.remove('drag');
    addMergeFiles(e.dataTransfer.files);
  });
  mergeInput.addEventListener('change', () => addMergeFiles(mergeInput.files));

  function addMergeFiles(fileListObj) {
    const arr = Array.from(fileListObj).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    mergeFiles = mergeFiles.concat(arr.map(f => ({ file: f })));
    renderMergeList();
    mergeInput.value = '';
  }

  function renderMergeList() {
    mergeList.innerHTML = '';
    mergeFiles.forEach((entry, i) => {
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
      li.querySelector('[data-act=up]').addEventListener('click', () => { if (i > 0) { [mergeFiles[i-1], mergeFiles[i]] = [mergeFiles[i], mergeFiles[i-1]]; renderMergeList(); } });
      li.querySelector('[data-act=down]').addEventListener('click', () => { if (i < mergeFiles.length - 1) { [mergeFiles[i+1], mergeFiles[i]] = [mergeFiles[i], mergeFiles[i+1]]; renderMergeList(); } });
      li.querySelector('[data-act=remove]').addEventListener('click', () => { mergeFiles.splice(i, 1); renderMergeList(); });
      mergeList.appendChild(li);
    });
    mergeBtn.disabled = mergeFiles.length < 2;
  }

  mergeBtn.addEventListener('click', async () => {
    mergeBtn.disabled = true;
    mergeProgressTrack.style.display = 'block';
    mergeProgress.style.width = '5%';
    mergeStatus.style.display = 'none';
    try {
      const outDoc = await PDFDocument.create();
      for (let i = 0; i < mergeFiles.length; i++) {
        const buf = await mergeFiles[i].file.arrayBuffer();
        const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await outDoc.copyPages(srcDoc, srcDoc.getPageIndices());
        pages.forEach(p => outDoc.addPage(p));
        mergeProgress.style.width = `${10 + Math.round(((i + 1) / mergeFiles.length) * 80)}%`;
      }
      const bytes = await outDoc.save();
      mergeProgress.style.width = '100%';
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'sharmaji-tools-merged.pdf');
      showStatus(mergeStatus, `Done — merged ${mergeFiles.length} files into one PDF.`, 'ok');
    } catch (err) {
      console.error(err);
      showStatus(mergeStatus, 'Could not merge these files — make sure every file is a valid, non-corrupted PDF.', 'error');
    } finally {
      mergeBtn.disabled = mergeFiles.length < 2;
      setTimeout(() => { mergeProgressTrack.style.display = 'none'; mergeProgress.style.width = '0%'; }, 800);
    }
  });

  /* =========================================================
     SPLIT
     ========================================================= */
  const splitDrop = document.getElementById('splitDrop');
  const splitInput = document.getElementById('splitInput');
  const splitSub = document.getElementById('splitSub');
  const splitOptions = document.getElementById('splitOptions');
  const splitRanges = document.getElementById('splitRanges');
  const modeRangesBtn = document.getElementById('modeRangesBtn');
  const modeEachBtn = document.getElementById('modeEachBtn');
  const splitBtn = document.getElementById('splitBtn');
  const splitStatus = document.getElementById('splitStatus');
  const splitProgressTrack = document.getElementById('splitProgressTrack');
  const splitProgress = document.getElementById('splitProgress');

  let splitFile = null;
  let splitPageCount = 0;
  let splitUseRanges = true;

  splitDrop.addEventListener('click', () => splitInput.click());
  splitDrop.addEventListener('dragover', (e) => { e.preventDefault(); splitDrop.classList.add('drag'); });
  splitDrop.addEventListener('dragleave', () => splitDrop.classList.remove('drag'));
  splitDrop.addEventListener('drop', (e) => { e.preventDefault(); splitDrop.classList.remove('drag'); if (e.dataTransfer.files[0]) loadSplitFile(e.dataTransfer.files[0]); });
  splitInput.addEventListener('change', () => { if (splitInput.files[0]) loadSplitFile(splitInput.files[0]); });

  async function loadSplitFile(file) {
    splitFile = file;
    splitSub.textContent = 'Reading file…';
    try {
      const buf = await file.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      splitPageCount = doc.getPageCount();
      splitSub.textContent = `${file.name} — ${splitPageCount} pages loaded.`;
      splitOptions.style.display = 'block';
    } catch (err) {
      console.error(err);
      splitSub.textContent = 'Could not read that file — is it a valid PDF?';
      splitOptions.style.display = 'none';
    }
  }

  modeRangesBtn.addEventListener('click', () => { splitUseRanges = true; modeRangesBtn.classList.add('active'); modeEachBtn.classList.remove('active'); splitRanges.closest('.field').style.display = ''; });
  modeEachBtn.addEventListener('click', () => { splitUseRanges = false; modeEachBtn.classList.add('active'); modeRangesBtn.classList.remove('active'); splitRanges.closest('.field').style.display = 'none'; });

  function parseRanges(str, maxPage) {
    const groups = [];
    const tokens = str.split(',').map(t => t.trim()).filter(Boolean);
    for (const tok of tokens) {
      const m = tok.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        let a = parseInt(m[1], 10), b = parseInt(m[2], 10);
        if (a > b) [a, b] = [b, a];
        a = Math.max(1, a); b = Math.min(maxPage, b);
        if (a > maxPage) continue;
        const idx = [];
        for (let p = a; p <= b; p++) idx.push(p - 1);
        groups.push(idx);
      } else if (/^\d+$/.test(tok)) {
        const p = parseInt(tok, 10);
        if (p >= 1 && p <= maxPage) groups.push([p - 1]);
      }
    }
    return groups;
  }

  splitBtn.addEventListener('click', async () => {
    if (!splitFile) return;
    splitBtn.disabled = true;
    splitProgressTrack.style.display = 'block';
    splitProgress.style.width = '5%';
    splitStatus.style.display = 'none';

    let groups;
    if (splitUseRanges) {
      groups = parseRanges(splitRanges.value, splitPageCount);
      if (groups.length === 0) {
        showStatus(splitStatus, 'Enter at least one valid range, e.g. "1-3, 5, 7-9".', 'error');
        splitBtn.disabled = false;
        splitProgressTrack.style.display = 'none';
        return;
      }
    } else {
      groups = Array.from({ length: splitPageCount }, (_, i) => [i]);
    }

    try {
      const buf = await splitFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const outputs = [];
      for (let i = 0; i < groups.length; i++) {
        const outDoc = await PDFDocument.create();
        const pages = await outDoc.copyPages(srcDoc, groups[i]);
        pages.forEach(p => outDoc.addPage(p));
        const bytes = await outDoc.save();
        const label = groups[i].length === 1 ? `page-${groups[i][0] + 1}` : `pages-${groups[i][0] + 1}-${groups[i][groups[i].length - 1] + 1}`;
        outputs.push({ name: `${label}.pdf`, bytes });
        splitProgress.style.width = `${10 + Math.round(((i + 1) / groups.length) * 80)}%`;
      }

      if (outputs.length === 1) {
        downloadBlob(new Blob([outputs[0].bytes], { type: 'application/pdf' }), `sharmaji-tools-${outputs[0].name}`);
      } else {
        const zip = new JSZip();
        outputs.forEach(o => zip.file(o.name, o.bytes));
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, 'sharmaji-tools-split.zip');
      }
      splitProgress.style.width = '100%';
      showStatus(splitStatus, `Done — created ${outputs.length} file${outputs.length > 1 ? 's' : ''}.`, 'ok');
    } catch (err) {
      console.error(err);
      showStatus(splitStatus, 'Something went wrong while splitting — check the ranges and try again.', 'error');
    } finally {
      splitBtn.disabled = false;
      setTimeout(() => { splitProgressTrack.style.display = 'none'; splitProgress.style.width = '0%'; }, 800);
    }
  });
})();
