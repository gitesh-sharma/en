(function () {
  const modeBasicBtn = document.getElementById('modeBasicBtn');
  const modeSciBtn = document.getElementById('modeSciBtn');
  const sciExtra = document.getElementById('sciExtra');
  const degBtn = document.getElementById('degBtn');
  const radBtn = document.getElementById('radBtn');
  const calcExpr = document.getElementById('calcExpr');
  const calcVal = document.getElementById('calcVal');
  const calcError = document.getElementById('calcError');

  let expr = '';
  let angleMode = 'deg';
  let justEvaluated = false;

  modeBasicBtn.addEventListener('click', () => { modeBasicBtn.classList.add('active'); modeSciBtn.classList.remove('active'); sciExtra.style.display = 'none'; });
  modeSciBtn.addEventListener('click', () => { modeSciBtn.classList.add('active'); modeBasicBtn.classList.remove('active'); sciExtra.style.display = 'block'; });
  degBtn.addEventListener('click', () => { degBtn.classList.add('active'); radBtn.classList.remove('active'); angleMode = 'deg'; });
  radBtn.addEventListener('click', () => { radBtn.classList.add('active'); degBtn.classList.remove('active'); angleMode = 'rad'; });

  document.querySelectorAll('[data-ins]').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.getAttribute('data-ins');
      if (justEvaluated && /^[0-9.]$/.test(v)) { expr = ''; }
      justEvaluated = false;
      if (['sin','cos','tan','log','ln','sqrt'].includes(v)) { /* unused here */ }
      expr += v;
      render();
    });
  });
  document.querySelectorAll('[data-fn]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (justEvaluated) expr = '';
      justEvaluated = false;
      expr += btn.getAttribute('data-fn') + '(';
      render();
    });
  });
  document.querySelector('[data-act="clear"]').addEventListener('click', () => { expr = ''; calcError.style.display = 'none'; render(); });
  document.querySelector('[data-act="back"]').addEventListener('click', () => { expr = expr.slice(0, -1); render(); });
  document.querySelector('[data-act="equals"]').addEventListener('click', () => {
    try {
      const result = evaluateExpression(expr || '0', angleMode);
      calcExpr.textContent = expr || ' ';
      calcVal.textContent = formatResult(result);
      expr = formatResult(result);
      justEvaluated = true;
      calcError.style.display = 'none';
    } catch (err) {
      showStatus(calcError, 'Could not evaluate that — check the expression.', 'error');
      calcError.style.display = 'block';
    }
  });

  function render() {
    calcExpr.textContent = expr || ' ';
    calcVal.textContent = expr === '' ? '0' : expr;
  }

  function formatResult(n) {
    if (!isFinite(n)) return 'Error';
    if (Number.isInteger(n)) return String(n);
    return String(Math.round(n * 1e10) / 1e10);
  }

  /* ---------- expression parser (no eval) ---------- */
  function evaluateExpression(str, angleMode) {
    const tokens = tokenize(str);
    let pos = 0;

    function peek() { return tokens[pos]; }
    function next() { return tokens[pos++]; }

    function parseExpr() {
      let v = parseTerm();
      while (peek() === '+' || peek() === '-') {
        const op = next();
        const rhs = parseTerm();
        v = op === '+' ? v + rhs : v - rhs;
      }
      return v;
    }
    function parseTerm() {
      let v = parseUnary();
      while (peek() === '*' || peek() === '/') {
        const op = next();
        const rhs = parseUnary();
        v = op === '*' ? v * rhs : v / rhs;
      }
      return v;
    }
    function parseUnary() {
      if (peek() === '-') { next(); return -parseUnary(); }
      if (peek() === '+') { next(); return parseUnary(); }
      return parsePower();
    }
    function parsePower() {
      let v = parsePostfix();
      if (peek() === '^') { next(); const rhs = parseUnary(); v = Math.pow(v, rhs); }
      return v;
    }
    function parsePostfix() {
      let v = parsePrimary();
      while (peek() === '!') { next(); v = factorial(v); }
      return v;
    }
    function parsePrimary() {
      const t = peek();
      if (t === undefined) throw new Error('Unexpected end');
      if (t === '(') { next(); const v = parseExpr(); if (next() !== ')') throw new Error('Expected )'); return v; }
      if (typeof t === 'number') { next(); return t; }
      if (typeof t === 'string' && /^[a-z]+$/.test(t)) {
        next();
        if (peek() === '(') {
          next();
          const arg = parseExpr();
          if (next() !== ')') throw new Error('Expected )');
          return applyFn(t, arg, angleMode);
        }
        if (t === 'pi') return Math.PI;
        if (t === 'e') return Math.E;
        throw new Error('Unknown identifier: ' + t);
      }
      throw new Error('Unexpected token: ' + t);
    }

    const result = parseExpr();
    if (pos !== tokens.length) throw new Error('Unexpected trailing input');
    return result;
  }

  function applyFn(name, arg, angleMode) {
    const toRad = (x) => angleMode === 'deg' ? x * Math.PI / 180 : x;
    switch (name) {
      case 'sin': return Math.sin(toRad(arg));
      case 'cos': return Math.cos(toRad(arg));
      case 'tan': return Math.tan(toRad(arg));
      case 'log': return Math.log10(arg);
      case 'ln': return Math.log(arg);
      case 'sqrt': return Math.sqrt(arg);
      default: throw new Error('Unknown function: ' + name);
    }
  }

  function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  function tokenize(str) {
    const tokens = [];
    let i = 0;
    while (i < str.length) {
      const c = str[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) {
        let j = i;
        while (j < str.length && /[0-9.]/.test(str[j])) j++;
        tokens.push(parseFloat(str.slice(i, j)));
        i = j;
        continue;
      }
      if (/[a-zA-Z]/.test(c)) {
        let j = i;
        while (j < str.length && /[a-zA-Z]/.test(str[j])) j++;
        tokens.push(str.slice(i, j));
        i = j;
        continue;
      }
      if ('+-*/^()!'.includes(c)) { tokens.push(c); i++; continue; }
      throw new Error('Unexpected character: ' + c);
    }
    return tokens;
  }

  render();
})();
