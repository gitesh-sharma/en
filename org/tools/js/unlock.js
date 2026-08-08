import createQpdfModule from "https://cdn.jsdelivr.net/npm/@neslinesli93/qpdf-wasm@0.3.0/+esm";

const QPDF_WASM_URL = "https://cdn.jsdelivr.net/npm/@neslinesli93/qpdf-wasm@0.3.0/dist/qpdf.wasm";

const uDrop = document.getElementById('uDrop');
const uInput = document.getElementById('uInput');
const uSub = document.getElementById('uSub');
const uStatus = document.getElementById('uStatus');
const uploadWorkspace = document.getElementById('uploadWorkspace');
const uWorkspace = document.getElementById('uWorkspace');
const uFileName = document.getElementById('uFileName');
const uFileSize = document.getElementById('uFileSize');
const uPass = document.getElementById('uPass');
const uBtn = document.getElementById('uBtn');
const uResetBtn = document.getElementById('uResetBtn');
const uStatus2 = document.getElementById('uStatus2');
const uProgressTrack = document.getElementById('uProgressTrack');
const uProgress = document.getElementById('uProgress');

let currentFile = null;

uDrop.addEventListener('click', () => uInput.click());
uDrop.addEventListener('dragover', (e) => { e.preventDefault(); uDrop.classList.add('drag'); });
uDrop.addEventListener('dragleave', () => uDrop.classList.remove('drag'));
uDrop.addEventListener('drop', (e) => { e.preventDefault(); uDrop.classList.remove('drag'); if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]); });
uInput.addEventListener('change', () => { if (uInput.files[0]) loadFile(uInput.files[0]); });

function loadFile(file) {
  currentFile = file;
  uFileName.textContent = file.name;
  uFileSize.textContent = formatBytes(file.size);
  uploadWorkspace.style.display = 'none';
  uWorkspace.style.display = 'block';
  uPass.value = '';
}

uResetBtn.addEventListener('click', () => {
  currentFile = null;
  uWorkspace.style.display = 'none';
  uploadWorkspace.style.display = 'block';
  uInput.value = '';
  uStatus2.style.display = 'none';
});

uBtn.addEventListener('click', async () => {
  if (!currentFile) return;
  uBtn.disabled = true;
  uProgressTrack.style.display = 'block';
  uProgress.style.width = '10%';
  uStatus2.style.display = 'none';

  try {
    const bytes = new Uint8Array(await currentFile.arrayBuffer());
    uProgress.style.width = '25%';

    let stderrOutput = '';
    const qpdf = await createQpdfModule({
      locateFile: () => QPDF_WASM_URL,
      noInitialRun: true,
      printErr: (msg) => { stderrOutput += msg + '\n'; },
    });
    uProgress.style.width = '45%';

    qpdf.FS.writeFile('/input.pdf', bytes);

    const args = [];
    if (uPass.value) args.push('--password=' + uPass.value);
    args.push('/input.pdf', '--decrypt', '/output.pdf');

    let failed = false;
    try {
      qpdf.callMain(args);
    } catch (runErr) {
      failed = true;
    }
    uProgress.style.width = '80%';

    let outBytes = null;
    try {
      outBytes = qpdf.FS.readFile('/output.pdf');
    } catch (readErr) {
      failed = true;
    }

    if (failed || !outBytes || outBytes.length === 0) {
      const wrongPass = /password/i.test(stderrOutput) || /invalid/i.test(stderrOutput);
      showStatus(
        uStatus2,
        wrongPass
          ? "That password didn't work — double-check it and try again."
          : "Couldn't unlock this file. If it has an open password, make sure you've entered it correctly.",
        'error'
      );
      uStatus2.style.display = 'block';
    } else {
      uProgress.style.width = '100%';
      downloadBlob(new Blob([outBytes], { type: 'application/pdf' }), 'sharmaji-tools-unlocked.pdf');
      showStatus(uStatus2, 'Done — the PDF has been unlocked and downloaded.', 'ok');
      uStatus2.style.display = 'block';
    }
  } catch (err) {
    console.error(err);
    showStatus(uStatus2, 'Something went wrong loading the unlock engine — please try again.', 'error');
    uStatus2.style.display = 'block';
  } finally {
    uPass.value = '';
    uBtn.disabled = false;
    setTimeout(() => { uProgressTrack.style.display = 'none'; uProgress.style.width = '0%'; }, 800);
  }
});
