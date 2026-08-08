(function () {
  const qrText = document.getElementById('qrText');
  const qrFg = document.getElementById('qrFg');
  const qrBg = document.getElementById('qrBg');
  const qrSize = document.getElementById('qrSize');
  const qrCanvas = document.getElementById('qrCanvas');
  const qrGenBtn = document.getElementById('qrGenBtn');
  const qrDownloadBtn = document.getElementById('qrDownloadBtn');
  const qrStatus = document.getElementById('qrStatus');

  function generate() {
    const text = qrText.value.trim();
    if (!text) {
      showStatus(qrStatus, 'Type something to encode first.', 'error');
      qrStatus.style.display = 'block';
      return;
    }
    QRCode.toCanvas(qrCanvas, text, {
      width: Number(qrSize.value),
      margin: 2,
      color: { dark: qrFg.value, light: qrBg.value },
    }, (err) => {
      if (err) {
        console.error(err);
        showStatus(qrStatus, 'Could not generate a QR code for that text.', 'error');
        qrStatus.style.display = 'block';
      } else {
        qrStatus.style.display = 'none';
      }
    });
  }

  qrGenBtn.addEventListener('click', generate);
  qrDownloadBtn.addEventListener('click', () => {
    qrCanvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'sharmaji-tools-qrcode.png');
    }, 'image/png');
  });

  generate();
})();
