/* ══════════════════════════════════════════
   js/calculadora.js
   Mini calculadora científica flotante reutilizable.

   API pública:
     Calculadora.abrir()   — muestra el widget
     Calculadora.cerrar()  — lo oculta
     Calculadora.toggle()  — alterna visible/oculto
     Calculadora.init()    — crea el DOM (llamado automáticamente)

   Soporta: + − × ÷, paréntesis ( ), raíz cuadrada √,
   potencia x², xⁿ (^), porcentaje, signo ±, borrado por
   carácter (⌫) y teclado físico. Evalúa la expresión
   completa con un parser propio (shunting-yard, sin eval).

   El widget es arrastrable y se mantiene encima de
   cualquier overlay (z-index 200).
   ══════════════════════════════════════════ */

const Calculadora = (() => {

  /* ── Estado interno ── */
  let _el      = null;   /* div raíz del widget */
  let _display = null;   /* input de expresión (editable visualmente) */
  let _expr    = '';     /* expresión en construcción (string) */
  let _resuelto = false; /* true tras pulsar = (el siguiente dígito reinicia) */

  /* ── Crear DOM ── */
  function _init() {
    if (document.getElementById('calc-widget')) return;

    const div = document.createElement('div');
    div.id        = 'calc-widget';
    div.className = 'calc-widget hidden';
    div.innerHTML = `
      <div class="calc-titlebar" id="calc-titlebar">
        <span class="calc-title">🧮 Calculadora</span>
        <button class="calc-close" onclick="Calculadora.cerrar()" title="Cerrar">✕</button>
      </div>
      <div class="calc-display-wrap">
        <div class="calc-expr"    id="calc-expr">&nbsp;</div>
        <input  class="calc-display" id="calc-display" type="text"
                value="0" readonly aria-label="Pantalla de calculadora">
      </div>
      <div class="calc-grid">
        <!-- Fila funciones -->
        <button class="calc-btn calc-btn-fn"  onclick="Calculadora._fn('AC')">AC</button>
        <button class="calc-btn calc-btn-fn"  onclick="Calculadora._fn('(')">(</button>
        <button class="calc-btn calc-btn-fn"  onclick="Calculadora._fn(')')">)</button>
        <button class="calc-btn calc-btn-fn"  onclick="Calculadora._fn('DEL')" title="Borrar">⌫</button>
        <!-- Fila científica -->
        <button class="calc-btn calc-btn-sci" onclick="Calculadora._fn('√')" title="Raíz cuadrada">√</button>
        <button class="calc-btn calc-btn-sci" onclick="Calculadora._fn('^2')" title="Al cuadrado">x²</button>
        <button class="calc-btn calc-btn-sci" onclick="Calculadora._fn('^')" title="Potencia">xⁿ</button>
        <button class="calc-btn calc-btn-op"  onclick="Calculadora._fn('÷')">÷</button>
        <!-- Fila 1 -->
        <button class="calc-btn" onclick="Calculadora._fn('7')">7</button>
        <button class="calc-btn" onclick="Calculadora._fn('8')">8</button>
        <button class="calc-btn" onclick="Calculadora._fn('9')">9</button>
        <button class="calc-btn calc-btn-op"  onclick="Calculadora._fn('×')">×</button>
        <!-- Fila 2 -->
        <button class="calc-btn" onclick="Calculadora._fn('4')">4</button>
        <button class="calc-btn" onclick="Calculadora._fn('5')">5</button>
        <button class="calc-btn" onclick="Calculadora._fn('6')">6</button>
        <button class="calc-btn calc-btn-op"  onclick="Calculadora._fn('−')">−</button>
        <!-- Fila 3 -->
        <button class="calc-btn" onclick="Calculadora._fn('1')">1</button>
        <button class="calc-btn" onclick="Calculadora._fn('2')">2</button>
        <button class="calc-btn" onclick="Calculadora._fn('3')">3</button>
        <button class="calc-btn calc-btn-op"  onclick="Calculadora._fn('+')">+</button>
        <!-- Fila 4 -->
        <button class="calc-btn calc-btn-sci" onclick="Calculadora._fn('±')" title="Cambiar signo">±</button>
        <button class="calc-btn" onclick="Calculadora._fn('0')">0</button>
        <button class="calc-btn" onclick="Calculadora._fn('.')">.</button>
        <button class="calc-btn calc-btn-eq"   onclick="Calculadora._fn('=')">=</button>
      </div>
    `;

    document.body.appendChild(div);
    _el      = div;
    _display = document.getElementById('calc-display');

    _hacerArrastrable(div, document.getElementById('calc-titlebar'));
    _render();
  }

  /* ════════════════════════════════════════
     LÓGICA DE BOTONES
     ════════════════════════════════════════ */
  function _fn(key) {
    switch (key) {
      case 'AC':
        _expr = ''; _resuelto = false; _render('0'); return;

      case 'DEL':
        _resuelto = false;
        /* borra el último token (los símbolos compuestos "√(" cuentan como 1) */
        if (_expr.endsWith('√(')) _expr = _expr.slice(0, -2);
        else                      _expr = _expr.slice(0, -1);
        _render(); return;

      case '=':
        _evaluar(); return;

      case '±':
        _toggleSigno(); return;

      case '%':
        _expr += '%'; _resuelto = false; _render(); return;

      case '√':
        if (_resuelto) { _expr = ''; _resuelto = false; }
        _expr += '√('; _render(); return;

      case '^2':
        if (_resuelto) _resuelto = false;
        _expr += '^2'; _render(); return;

      case '^':
        if (_resuelto) _resuelto = false;
        _expr += '^'; _render(); return;

      default:
        _agregar(key);
    }
  }

  /* Añade un carácter (dígito, operador, punto o paréntesis) a la expresión */
  function _agregar(key) {
    const esDigito = /[0-9]/.test(key);
    const esOp     = ['+','−','×','÷'].includes(key);

    /* Si acabamos de resolver: un dígito empieza de cero; un operador continúa */
    if (_resuelto) {
      if (esDigito || key === '(' || key === '√' ) _expr = '';
      _resuelto = false;
    }

    if (key === '.') {
      /* evitar dos puntos en el mismo número */
      const ultimoNum = _expr.split(/[+\-−×÷()^%√]/).pop();
      if (ultimoNum.includes('.')) return;
      if (ultimoNum === '') _expr += '0';
      _expr += '.';
    } else {
      _expr += key;
    }
    _render();
  }

  /* Cambia el signo del último número de la expresión.
     Envuelve el número en (0−n) usando el menos binario, que el parser
     ya interpreta como negación cuando aparece tras ( u operador. */
  function _toggleSigno() {
    const m = _expr.match(/(\d*\.?\d+)$/);
    if (!m) return;                 /* no hay número al final: ignorar */
    const num   = m[1];
    const antes = _expr.slice(0, _expr.length - num.length);
    if (antes.endsWith('(−')) {
      /* ya era negativo: quitar el "(−" y un ")" de cierre si existe */
      let base = antes.slice(0, -2) + num;
      if (base.endsWith(')')) base = base.slice(0, -1);
      _expr = base;
    } else {
      _expr = antes + '(−' + num + ')';
    }
    _render();
  }

  /* Evalúa la expresión completa */
  function _evaluar() {
    if (!_expr.trim()) return;
    try {
      const val = _calcular(_expr);
      if (!isFinite(val)) throw new Error('inf');
      _setExpr(_prettify(_expr) + ' =');
      _render(_fmt(val));
      _expr = String(val);
      _resuelto = true;
    } catch (e) {
      _setExpr(_prettify(_expr) + ' =');
      _render('Error');
      _expr = '';
      _resuelto = true;
    }
  }

  /* ════════════════════════════════════════
     PARSER: shunting-yard → RPN → evaluación
     (seguro, sin eval). Soporta + − × ÷ ^ √ ( ) %
     ════════════════════════════════════════ */
  function _tokenizar(expr) {
    const tokens = [];
    let i = 0;
    while (i < expr.length) {
      const ch = expr[i];
      if (ch === ' ') { i++; continue; }
      if (/[0-9.]/.test(ch)) {
        let num = '';
        while (i < expr.length && /[0-9.]/.test(expr[i])) { num += expr[i]; i++; }
        tokens.push({ t: 'num', v: parseFloat(num) });
        continue;
      }
      if (ch === '√') { tokens.push({ t: 'func', v: 'sqrt' }); i++; continue; }
      if ('+−×÷^'.includes(ch)) { tokens.push({ t: 'op', v: ch }); i++; continue; }
      if (ch === '%') { tokens.push({ t: 'op', v: '%' }); i++; continue; }
      if (ch === '(') { tokens.push({ t: 'lp' }); i++; continue; }
      if (ch === ')') { tokens.push({ t: 'rp' }); i++; continue; }
      if (ch === '-') { tokens.push({ t: 'op', v: '−' }); i++; continue; } /* por si aparece - */
      throw new Error('token inválido: ' + ch);
    }
    return tokens;
  }

  const _PREC = { '+':1, '−':1, '×':2, '÷':2, '%':2, '^':4 };
  const _DERECHA = { '^':true };

  function _calcular(exprRaw) {
    const expr = exprRaw.replace(/²/g, '^2');   /* normalizar notación bonita */
    const tokens = _tokenizar(expr);
    /* Insertar multiplicación implícita: 2(3) → 2×(3), )( → )×(, 2√ → 2×√ */
    const out = [], ops = [];
    const esValor = tk => tk && (tk.t === 'num' || tk.t === 'rp');

    for (let k = 0; k < tokens.length; k++) {
      const tk = tokens[k];
      const prev = tokens[k-1];

      if (tk.t === 'num') {
        if (esValor(prev)) throw new Error('num tras valor');
        out.push(tk);
      } else if (tk.t === 'func') {
        ops.push(tk);
      } else if (tk.t === 'op') {
        /* operador unario menos al inicio o tras ( u operador */
        if (tk.v === '−' && (!prev || prev.t === 'op' || prev.t === 'lp')) {
          out.push({ t:'num', v:0 });  /* 0 − x */
        }
        while (ops.length) {
          const top = ops[ops.length-1];
          if (top.t === 'func' ||
             (top.t === 'op' && (_PREC[top.v] > _PREC[tk.v] ||
             (_PREC[top.v] === _PREC[tk.v] && !_DERECHA[tk.v])))) {
            out.push(ops.pop());
          } else break;
        }
        ops.push(tk);
      } else if (tk.t === 'lp') {
        ops.push(tk);
      } else if (tk.t === 'rp') {
        while (ops.length && ops[ops.length-1].t !== 'lp') out.push(ops.pop());
        if (!ops.length) throw new Error('paréntesis');
        ops.pop(); /* saca el ( */
        if (ops.length && ops[ops.length-1].t === 'func') out.push(ops.pop());
      }
    }
    while (ops.length) {
      const o = ops.pop();
      if (o.t === 'lp') throw new Error('paréntesis');
      out.push(o);
    }

    /* Evaluar la RPN */
    const st = [];
    for (const tk of out) {
      if (tk.t === 'num') { st.push(tk.v); continue; }
      if (tk.t === 'func') {
        const a = st.pop();
        if (tk.v === 'sqrt') { if (a < 0) throw new Error('√ negativo'); st.push(Math.sqrt(a)); }
        continue;
      }
      if (tk.t === 'op') {
        if (tk.v === '%') { const a = st.pop(); st.push(a / 100); continue; }
        const b = st.pop(), a = st.pop();
        if (a === undefined || b === undefined) throw new Error('faltan operandos');
        switch (tk.v) {
          case '+': st.push(a + b); break;
          case '−': st.push(a - b); break;
          case '×': st.push(a * b); break;
          case '÷': if (b === 0) throw new Error('÷0'); st.push(a / b); break;
          case '^': st.push(Math.pow(a, b)); break;
        }
      }
    }
    if (st.length !== 1) throw new Error('expresión incompleta');
    return st[0];
  }

  /* ════════════════════════════════════════
     RENDER / FORMATO
     ════════════════════════════════════════ */
  function _render(forzar) {
    if (!_display) return;
    _display.value = forzar !== undefined ? forzar : (_prettify(_expr) || '0');
    /* desplazar el cursor visual al final */
    _display.scrollLeft = _display.scrollWidth;
  }

  function _setExpr(txt) {
    const el = document.getElementById('calc-expr');
    if (el) el.textContent = txt || '\u00A0';
  }

  /* Hace legible la expresión interna (ya usa símbolos bonitos) */
  function _prettify(expr) {
    return expr
      .replace(/\^2/g, '²')
      .replace(/\^/g, '^')
      .replace(/√\(/g, '√(');
  }

  function _fmt(n) {
    if (!isFinite(n)) return 'Error';
    /* redondear a 10 cifras significativas y quitar ceros sobrantes */
    const s = parseFloat(n.toPrecision(10)).toString();
    return s;
  }

  /* ── Drag ── */
  function _hacerArrastrable(el, handle) {
    let ox = 0, oy = 0, mx = 0, my = 0;
    handle.style.cursor = 'grab';
    handle.addEventListener('mousedown', e => {
      e.preventDefault();
      ox = el.offsetLeft; oy = el.offsetTop;
      mx = e.clientX;     my = e.clientY;
      handle.style.cursor = 'grabbing';
      function onMove(e) {
        el.style.left = (ox + e.clientX - mx) + 'px';
        el.style.top  = (oy + e.clientY - my) + 'px';
        el.style.right = 'auto'; el.style.bottom = 'auto';
      }
      function onUp() {
        handle.style.cursor = 'grab';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup',   onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    });
  }

  /* ── Teclado físico (solo cuando la calculadora está visible) ── */
  function _onKey(e) {
    if (!_el || _el.classList.contains('hidden')) return;
    const k = e.key;
    if (/[0-9]/.test(k))      { _fn(k); e.preventDefault(); return; }
    if (k === '.')            { _fn('.'); e.preventDefault(); return; }
    if (k === '+')            { _fn('+'); e.preventDefault(); return; }
    if (k === '-')            { _fn('−'); e.preventDefault(); return; }
    if (k === '*')            { _fn('×'); e.preventDefault(); return; }
    if (k === '/')            { _fn('÷'); e.preventDefault(); return; }
    if (k === '^')            { _fn('^'); e.preventDefault(); return; }
    if (k === '(')            { _fn('('); e.preventDefault(); return; }
    if (k === ')')            { _fn(')'); e.preventDefault(); return; }
    if (k === '%')            { _fn('%'); e.preventDefault(); return; }
    if (k === 'Enter' || k === '=') { _fn('='); e.preventDefault(); return; }
    if (k === 'Backspace')    { _fn('DEL'); e.preventDefault(); return; }
    if (k === 'Escape')       { _fn('AC'); e.preventDefault(); return; }
    if (k === 'r' || k === 'R'){ _fn('√'); e.preventDefault(); return; }
  }

  /* ── API pública ── */
  return {
    init() {
      _init();
      document.addEventListener('keydown', _onKey);
    },
    abrir()  { _init(); _el.classList.remove('hidden'); },
    cerrar() { if (_el) _el.classList.add('hidden'); },
    toggle() { _init(); _el.classList.toggle('hidden'); },
    _fn(key) { _fn(key); }
  };

})();

/* Auto-inicializar cuando el DOM esté listo */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Calculadora.init());
} else {
  Calculadora.init();
}
