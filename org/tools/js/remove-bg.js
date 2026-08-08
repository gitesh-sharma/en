import imglyRemoveBackground from "https://cdn.jsdelivr.net/npm/@imgly/[email protected]/+esm";

const rbDrop = document.getElementById('rbDrop');
const rbInput = document.getElementById('rbInput');
const rbSub = document.getElementById('rbSub');
const rbStatus = document.getElementById('rbStatus');
const uploadWorkspace = document.getElementById('uploadWorkspace');
const rbWorkspace = document.getElementById('rbWorkspace');
const rbOriginalImg = document.getElementById('rbOriginalImg');
const rbResultImg = document.getElementById('rbResultImg');
const rbRunBtn = document.getElementById('rbRunBtn');
const rbDownloadBtn = document.getElementById('rbDownloadBtn');
const rbResetBtn = document.getElementById('rbResetBtn');
const rbStatus2 = document.getElementById('rbStatus2');
const rbProgressTrack = document.getElementById('rbProgressTrack');

let currentFile = null;
let resultBlob = null;

rbDrop.addEventListener('click', () => rbInput.click());
rbDrop.addEventListener('dragover', (e) => { e.preventDefault(); rbDrop.classList.add('drag'); });
rbDrop.addEventListener('dragleave', () => rbDrop.classList.remove('drag'));
rbDrop.addEventListener('drop', (e) => { e.preventDefault(); rbDrop.classList.remove('drag'); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
rbInput.addEventListener('change', () => { if (rbInput.files[0]) loadFile(rbInput.files[0]); });

function loadFile(file) {
  currentFile = file;
  resultBlob = null;
  rbOriginalImg.src = URL.createObjectURL(file);
  rbResultImg.style.display = 'none';
  rbDownloadBtn.style.display = 'none';
  rbStatus2.style.display = 'none';
  uploadWorkspace.style.display = 'none';
  rbWorkspace.style.display = 'block';
}

rbResetBtn.addEventListener('click', () => {
  currentFile = null;
  resultBlob = null;
  rbWorkspace.style.display = 'none';
  uploadWorkspace.style.display = 'block';
  rbInput.value = '';
  rbStatus.style.display = 'none';
});

rbRunBtn.addEventListener('click', async () => {
  if (!currentFile) return;
  rbRunBtn.disabled = true;
  rbProgressTrack.style.display = 'block';
  rbStatus2.style.display = 'none';
  showStatus(rbStatus2, 'Working on it — the first run downloads the model, so this can take a little while…', 'ok');
  rbStatus2.style.display = 'block';

  try {
    const blob = await imglyRemoveBackground(currentFile);
    resultBlob = blob;
    rbResultImg.src = URL.createObjectURL(blob);
    rbResultImg.style.display = 'block';
    rbDownloadBtn.style.display = 'inline-flex';
    showStatus(rbStatus2, 'Done — background removed.', 'ok');
    rbStatus2.style.display = 'block';
  } catch (err) {
    console.error(err);
    showStatus(rbStatus2, "Couldn't process that photo — please try again, or try a different image.", 'error');
    rbStatus2.style.display = 'block';
  } finally {
    rbRunBtn.disabled = false;
    rbProgressTrack.style.display = 'none';
  }
});

rbDownloadBtn.addEventListener('click', () => {
  if (resultBlob) downloadBlob(resultBlob, 'sharmaji-tools-no-bg.png');
});
