(function () {
  const wDrop = document.getElementById('wDrop');
  const wInput = document.getElementById('wInput');
  const wList = document.getElementById('wList');
  const wQuality = document.getElementById('wQuality');
  const qualityVal = document.getElementById('qualityVal');
  const wBtn = document.getElementById('wBtn');
  const wStatus = document.getElementById('wStatus');
  const wProgressTrack = document.getElementById('wProgressTrack');
  const wProgress = document.getElementById('wProgress');

  let files = [];

  wDrop.addEventListener('click', () => wInput.click());
  wDrop.addEventListener('dragover', (e) => { e.preventDefault(); wDrop.classList.add('drag'); });
  wDrop.addEventListener('dragleave', () => wDrop.classList.remove('drag'));
  wDrop.addEventListener('drop', (e) => { e.preventDefault(); wDrop.classList.remove('drag'); addFiles(e.dataTransfer.files); });
  wInput.addEventListener('change', () => addFiles(wInput.files));
  wQuality.addEventListener('input', () => { qualityVal.textContent = wQuality.value; });

  function addFiles(fileListObj) {
    const arr = Array.from(fileListObj).filter(f => f.type === 'image/png' || f.type === 'image/jpeg');
    files = files.concat(arr);
    renderList();
    wInput.value = '';
  }

  function renderList() {
    wList.innerHTML = '';
    files.forEach((f, i) => {
      const li = document.createElement('li');
      li.className = 'file-row';
      li.innerHTML = `<span class="name">${i + 1}. ${f.name}</span><span class="size">${formatBytes(f.size)}</span><button data-i="${i}">✕</button>`;
      li.querySelector('button').addEventListener('click', () => { files.splice(i, 1); renderList(); });
      wList.appendChild(li);
    });
    wBtn.disabled = files.length === 0;
  }

  function convertOne(file, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(img.src);
          if (!blob) { reject(new Error('WebP encoding failed')); return; }
          resolve(blob);
        }, 'image/webp', quality);
      };
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  wBtn.addEventListener('click', async () => {
    if (files.length === 0) return;
    wBtn.disabled = true;
    wProgressTrack.style.display = 'block';
    wProgress.style.width = '5%';
    wStatus.style.display = 'none';
    const quality = Number(wQuality.value) / 100;

    try {
      const outputs = [];
      for (let i = 0; i < files.length; i++) {
        const blob = await convertOne(files[i], quality);
        const name = files[i].name.replace(/\.(jpe?g|png)$/i, '') + '.webp';
        outputs.push({ name, blob });
        wProgress.style.width = `${10 + Math.round(((i + 1) / files.length) * 80)}%`;
      }

      if (outputs.length === 1) {
        downloadBlob(outputs[0].blob, outputs[0].name);
      } else {
        const zip = new JSZip();
        for (const o of outputs) zip.file(o.name, o.blob);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, 'sharmaji-tools-webp.zip');
      }
      wProgress.style.width = '100%';
      showStatus(wStatus, `Done — converted ${outputs.length} image${outputs.length > 1 ? 's' : ''} to WebP.`, 'ok');
      wStatus.style.display = 'block';
    } catch (err) {
      console.error(err);
      showStatus(wStatus, "Something went wrong. Note: WebP export needs a fairly modern browser.", 'error');
      wStatus.style.display = 'block';
    } finally {
      wBtn.disabled = false;
      setTimeout(() => { wProgressTrack.style.display = 'none'; wProgress.style.width = '0%'; }, 800);
    }
  });
})();
