(function () {
  const modeLinkBtn = document.getElementById('modeLinkBtn');
  const modeWifiBtn = document.getElementById('modeWifiBtn');
  const linkPanel = document.getElementById('linkPanel');
  const wifiPanel = document.getElementById('wifiPanel');

  const qrText = document.getElementById('qrText');
  const wifiSsid = document.getElementById('wifiSsid');
  const wifiPass = document.getElementById('wifiPass');
  const wifiSecurity = document.getElementById('wifiSecurity');
  const wifiHidden = document.getElementById('wifiHidden');

  const qrFg = document.getElementById('qrFg');
  const qrBg = document.getElementById('qrBg');
  const qrSize = document.getElementById('qrSize');
  const qrLogoUpload = document.getElementById('qrLogoUpload');
  const qrLogoFileName = document.getElementById('qrLogoFileName');
  const qrLogoResetBtn = document.getElementById('qrLogoResetBtn');
  const qrCanvas = document.getElementById('qrCanvas');
  const qrGenBtn = document.getElementById('qrGenBtn');
  const qrDownloadBtn = document.getElementById('qrDownloadBtn');
  const qrStatus = document.getElementById('qrStatus');

  const DEFAULT_LOGO_SRC = 'assets/logo.png';

  /* ---------- mode switching ---------- */
  let qrMode = 'link';
  modeLinkBtn.addEventListener('click', () => {
    qrMode = 'link';
    modeLinkBtn.classList.add('active'); modeWifiBtn.classList.remove('active');
    linkPanel.style.display = ''; wifiPanel.style.display = 'none';
  });
  modeWifiBtn.addEventListener('click', () => {
    qrMode = 'wifi';
    modeWifiBtn.classList.add('active'); modeLinkBtn.classList.remove('active');
    wifiPanel.style.display = ''; linkPanel.style.display = 'none';
  });

  /* ---------- logo loading (default or user-uploaded) ---------- */
  let defaultLogoPromise = null;
  function loadDefaultLogo() {
    if (!defaultLogoPromise) defaultLogoPromise = loadImage(DEFAULT_LOGO_SRC);
    return defaultLogoPromise;
  }
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not load image: ' + src));
      img.src = src;
    });
  }

  let customLogoPromise = null;
  let customLogoObjectUrl = null;

  qrLogoUpload.addEventListener('change', () => {
    const file = qrLogoUpload.files[0];
    if (!file) return;
    if (customLogoObjectUrl) URL.revokeObjectURL(customLogoObjectUrl);
    customLogoObjectUrl = URL.createObjectURL(file);
    customLogoPromise = loadImage(customLogoObjectUrl);
    qrLogoFileName.textContent = `Using: ${file.name}`;
    qrLogoResetBtn.style.display = 'inline-flex';
  });

  qrLogoResetBtn.addEventListener('click', () => {
    customLogoPromise = null;
    if (customLogoObjectUrl) { URL.revokeObjectURL(customLogoObjectUrl); customLogoObjectUrl = null; }
    qrLogoUpload.value = '';
    qrLogoFileName.textContent = 'Using: Sharmaji Tools logo';
    qrLogoResetBtn.style.display = 'none';
  });

  /* ---------- WiFi QR string (standard WIFI: format read by phone cameras) ---------- */
  function escapeWifiField(s) {
    return String(s).replace(/([\\;,":])/g, '\\$1');
  }
  function buildWifiPayload() {
    const ssid = wifiSsid.value.trim();
    if (!ssid) throw new Error('Enter the network name (SSID) first.');
    const type = wifiSecurity.value;
    const hidden = wifiHidden.checked ? 'true' : 'false';
    const S = escapeWifiField(ssid);
    if (type === 'nopass') {
      return `WIFI:T:nopass;S:${S};H:${hidden};;`;
    }
    const P = escapeWifiField(wifiPass.value);
    return `WIFI:T:${type};S:${S};P:${P};H:${hidden};;`;
  }

  /* ---------- generate ---------- */
  function generate() {
    let payload;
    try {
      payload = qrMode === 'wifi' ? buildWifiPayload() : qrText.value.trim();
    } catch (e) {
      showStatus(qrStatus, e.message, 'error');
      qrStatus.style.display = 'block';
      return;
    }
    if (!payload) {
      showStatus(qrStatus, 'Type something to encode first.', 'error');
      qrStatus.style.display = 'block';
      return;
    }
    // the centre logo is always on now — no visible toggle, just the
    // choice of default logo vs. an uploaded one, further down
    const withLogo = true;

    QRCode.toCanvas(qrCanvas, payload, {
      width: Number(qrSize.value),
      margin: 2,
      // a logo covers part of the code, so use the highest error-correction
      // level whenever it's on — the code still scans reliably this way
      errorCorrectionLevel: withLogo ? 'H' : 'M',
      color: { dark: qrFg.value, light: qrBg.value },
    }, async (err) => {
      if (err) {
        console.error(err);
        showStatus(qrStatus, 'Could not generate a QR code for that.', 'error');
        qrStatus.style.display = 'block';
        return;
      }
      qrStatus.style.display = 'none';

      if (!withLogo) return;
      try {
        const logo = await (customLogoPromise || loadDefaultLogo());
        drawLogoOnCanvas(logo);
      } catch (e) {
        console.error(e);
        showStatus(qrStatus, "QR code is ready, but the logo couldn't be loaded — try a different image.", 'error');
        qrStatus.style.display = 'block';
      }
    });
  }

  function drawLogoOnCanvas(logo) {
    const ctx = qrCanvas.getContext('2d');
    const size = qrCanvas.width;

    // logo box: about 22% of the code's width — small enough that
    // "H" error correction can recover the covered modules
    const logoSize = Math.round(size * 0.22);
    const pad = Math.round(logoSize * 0.16);
    const boxSize = logoSize + pad * 2;
    const boxX = (size - boxSize) / 2;
    const boxY = (size - boxSize) / 2;

    // white backdrop (rounded) so the logo reads clearly against the code
    const radius = 10;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    roundedRect(ctx, boxX, boxY, boxSize, boxSize, radius);
    ctx.fill();
    ctx.restore();

    // fit the logo's own aspect ratio inside the square logo area
    const scale = Math.min(logoSize / logo.naturalWidth, logoSize / logo.naturalHeight);
    const drawW = logo.naturalWidth * scale;
    const drawH = logo.naturalHeight * scale;
    const drawX = (size - drawW) / 2;
    const drawY = (size - drawH) / 2;
    ctx.drawImage(logo, drawX, drawY, drawW, drawH);
  }

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  qrGenBtn.addEventListener('click', generate);
  qrDownloadBtn.addEventListener('click', () => {
    qrCanvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'sharmaji-tools-qrcode.png');
    }, 'image/png');
  });

  generate();
})();
