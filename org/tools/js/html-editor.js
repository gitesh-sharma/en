(function () {
  const tabs = document.querySelectorAll('.code-tab');
  const htmlCode = document.getElementById('htmlCode');
  const cssCode = document.getElementById('cssCode');
  const jsCode = document.getElementById('jsCode');
  const runBtn = document.getElementById('runBtn');
  const autoRun = document.getElementById('autoRun');
  const previewFrame = document.getElementById('previewFrame');

  const panes = { html: htmlCode, css: cssCode, js: jsCode };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      Object.values(panes).forEach(p => p.style.display = 'none');
      panes[tab.getAttribute('data-tab')].style.display = 'block';
    });
  });

  function buildDoc() {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>${cssCode.value}</style>
</head>
<body>
${htmlCode.value}
<script>
try {
${jsCode.value}
} catch (e) {
  document.body.insertAdjacentHTML('beforeend', '<pre style="color:#b5342a;background:#fdecea;padding:10px;border-radius:4px;margin-top:12px;">' + e.message + '</pre>');
}
<\/script>
</body>
</html>`;
  }

  function run() {
    previewFrame.srcdoc = buildDoc();
  }

  runBtn.addEventListener('click', run);

  let debounceTimer = null;
  [htmlCode, cssCode, jsCode].forEach(area => {
    area.addEventListener('input', () => {
      if (!autoRun.checked) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(run, 500);
    });
  });

  run();
})();
