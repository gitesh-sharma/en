import { encryptPDF } from "https://cdn.jsdelivr.net/npm/@pdfsmaller/pdf-encrypt-lite/+esm";

const pDrop = document.getElementById('pDrop');
const pInput = document.getElementById('pInput');
const pSub = document.getElementById('pSub');
const pStatus = document.getElementById('pStatus');
const uploadWorkspace = document.getElementById('uploadWorkspace');
const pWorkspace = document.getElementById('pWorkspace');
const pFileName = document.getElementById('pFileName');
const pFileSize = document.getElementById('pFileSize');
const pPass1 = document.getElementById('pPass1');
const pPass2 = document.getElementById('pPass2');
const pMatchMsg = document.getElementById('pMatchMsg');
const pBtn = document.getElementById('pBtn');
const pResetBtn = document.getElementById('pResetBtn');
const pStatus2 = document.getElementById('pStatus2');
const pProgressTrack = document.getElementById('pProgressTrack');
const pProgress = document.getElementById('pProgress');

let currentFile = null;

pDrop.addEventListener('click', () => pInput.click());
pDrop.addEventListener('dragover', (e) => { e.preventDefault(); pDrop.classList.add('drag'); });
pDrop.addEventListener('dragleave', () => pDrop.classList.remove('drag'));
pDrop.addEventListener('drop', (e) => { e.preventDefault(); pDrop.classList.remove('drag'); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
pInput.addEventListener('change', () => { if (pInput.files[0]) loadFile(pInput.files[0]); });

function loadFile(file) {
  currentFile = file;
  pFileName.textContent = file.name;
  pFileSize.textContent = formatBytes(file.size);
  uploadWorkspace.style.display = 'none';
  pWorkspace.style.display = 'block';
  pPass1.value = ''; pPass2.value = '';
  validate();
}

pResetBtn.addEventListener('click', () => {
  currentFile = null;
  pWorkspace.style.display = 'none';
  uploadWorkspace.style.display = 'block';
  pInput.value = '';
  pStatus2.style.display = 'none';
  pPass1.value = ''; pPass2.value = '';
});

function validate() {
  const p1 = pPass1.value, p2 = pPass2.value;
  const mismatch = p2.length > 0 && p1 !== p2;
  pMatchMsg.style.display = mismatch ? 'block' : 'none';
  pBtn.disabled = !(p1.length > 0 && p1 === p2);
}
pPass1.addEventListener('input', validate);
pPass2.addEventListener('input', validate);

pBtn.addEventListener('click', async () => {
  if (!currentFile) return;
  const password = pPass1.value;
  if (!password || password !== pPass2.value) return;

  pBtn.disabled = true;
  pProgressTrack.style.display = 'block';
  pProgress.style.width = '15%';
  pStatus2.style.display = 'none';

  try {
    const bytes = new Uint8Array(await currentFile.arrayBuffer());
    pProgress.style.width = '40%';
    const encrypted = await encryptPDF(bytes, password, password);
    pProgress.style.width = '95%';
    downloadBlob(new Blob([encrypted], { type: 'application/pdf' }), 'sharmaji-tools-protected.pdf');
    pProgress.style.width = '100%';
    showStatus(pStatus2, 'Done — the PDF is locked. Open it once to confirm the password works before you rely on it.', 'ok');
    pStatus2.style.display = 'block';
  } catch (err) {
    console.error(err);
    showStatus(pStatus2, 'Could not lock this file — it may already be encrypted, or not a valid PDF.', 'error');
    pStatus2.style.display = 'block';
  } finally {
    // clear the password fields either way — no reason to keep them in memory
    pPass1.value = ''; pPass2.value = '';
    pBtn.disabled = true;
    setTimeout(() => { pProgressTrack.style.display = 'none'; pProgress.style.width = '0%'; }, 800);
  }
});
