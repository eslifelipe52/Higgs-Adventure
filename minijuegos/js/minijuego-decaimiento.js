/* ══════════════════════════════════════════
   minijuegos/js/minijuego-decaimiento.js
   Minijuego: Decaimiento

   Flujo:
     1. Pantalla INTRO — tabla de leyes de conservación
     2. Módulo A — Elige el canal de decaimiento correcto
     3. Módulo B — Predice si el espectro es continuo o monoE
     4. Módulo C — Ordena partículas por vida media
   ══════════════════════════════════════════ */

/* ════════════════════════════════════════════
   ESTADO GLOBAL
   ════════════════════════════════════════════ */
let diScreen = null;
let diState  = {};     /* { modulo: 'intro'|'A'|'B'|'C', completado, … } */
let diRAF    = null;

/* Módulos (sin la intro, que no tiene pestaña) */
const DI_MODULOS = [
  { id:'A', label:'Decaimiento',  titulo:'Canales de Decaimiento' },
  { id:'B', label:'Espectro',     titulo:'El Espectro de Energía'  },
  { id:'C', label:'Vida media',   titulo:'La Vida Media'           },
];

/* ════════════════════════════════════════════
   ENTRADA
   ════════════════════════════════════════════ */
function iniciar_decaimiento() {
  diState = { modulo: 'intro' };
  diCrearPantalla();
  diMostrarIntro();
}

/* ════════════════════════════════════════════
   SHELL COMÚN
   ════════════════════════════════════════════ */
function diCrearPantalla() {
  if (diScreen) diScreen.remove();
  diScreen = document.createElement('div');
  diScreen.id        = 'di-screen';
  diScreen.className = 'di-screen';
  diScreen.innerHTML = `
    <div class="di-header">
      <div class="di-instruccion-wrap">
        <div class="di-instruccion-label">DECAIMIENTO</div>
        <div class="di-instruccion-icon">⚛️</div>
        <p class="di-instruccion" id="di-instruccion">Las leyes de conservación deciden qué decaimientos existen.</p>
      </div>
    </div>

    <div class="di-body" id="di-body"></div>

    <div class="di-nav-bar">
      <button class="di-btn di-btn-volver" onclick="cerrarDecaimiento()">← Volver al ME</button>
      <div class="di-nivel-dots" id="di-nivel-dots"></div>
      <div class="di-progreso-label" id="di-progreso-label"></div>
    </div>
  `;
  document.getElementById('app').appendChild(diScreen);
  diRenderDots();
}

function diRenderDots() {
  const dots = document.getElementById('di-nivel-dots');
  if (!dots) return;
  /* La intro no tiene pestaña; los módulos sí */
  dots.innerHTML = DI_MODULOS.map(m => `
    <button class="di-nivel-dot ${diState.modulo === m.id ? 'active' : ''}"
            onclick="diIrModulo('${m.id}')" title="${m.titulo}">
      ${m.label}
    </button>
  `).join('');
  const lbl = document.getElementById('di-progreso-label');
  const m = DI_MODULOS.find(x => x.id === diState.modulo);
  if (lbl) lbl.textContent = m ? `Módulo ${m.id} · ${m.titulo}` : 'Introducción';
}

function diIrModulo(id) {
  diCancelarRAF();
  diState.modulo = id;
  diRenderDots();
  const body = document.getElementById('di-body');
  if      (id === 'A') diModuloA(body);
  else if (id === 'B') diModuloB(body);
  else if (id === 'C') diModuloC(body);
}

function cerrarDecaimiento() {
  diCancelarRAF();
  window.removeEventListener('resize', diAjustarCanvas);
  if (diScreen) { diScreen.remove(); diScreen = null; }
  showScreen('me');
}

function diCancelarRAF() {
  if (diRAF) { cancelAnimationFrame(diRAF); diRAF = null; }
}

function diAjustarCanvas() {
  const cv = document.getElementById('di-canvas');
  if (cv) { cv.width = cv.offsetWidth || 560; cv.height = cv.offsetHeight || 340; }
}

/* ════════════════════════════════════════════
   HELPERS DE RETO
   ════════════════════════════════════════════ */
function diSetInstruccion(txt) {
  const el = document.getElementById('di-instruccion');
  if (el) el.textContent = txt;
}
function diProgreso(frac, lbl) {
  frac = Math.max(0, Math.min(1, frac));
  const b = document.getElementById('di-prog-barra');
  const l = document.getElementById('di-prog-lbl');
  if (b) b.style.width = (frac * 100) + '%';
  if (l && lbl !== undefined) l.textContent = lbl;
}
function diEstado(txt, ok) {
  const el = document.getElementById('di-estado');
  if (!el) return;
  el.innerHTML = txt;
  el.className = 'di-estado ' + (ok === true ? 'ok' : ok === false ? 'err' : '');
}
function diRetoCumplido(msg) {
  if (diState.completado) return;
  diState.completado = true;
  diProgreso(1, '¡Completado!');
  const cont = document.getElementById('di-logro-cont');
  if (!cont) return;
  const esUltimo = diState.modulo === 'C';
  cont.innerHTML = `
    <div class="di-exito">
      <span class="di-exito-icon">✓</span>
      <span>${msg}</span>
    </div>
    <button class="di-btn di-btn-next" onclick="diSiguiente()">
      ${esUltimo ? 'Terminar ✓' : 'Siguiente módulo →'}
    </button>`;
  cont.classList.remove('hidden');
  try { cont.scrollIntoView({ behavior:'smooth', block:'nearest' }); } catch(e) {}
}
function diSiguiente() {
  const idx = DI_MODULOS.findIndex(m => m.id === diState.modulo);
  if (idx < DI_MODULOS.length - 1) diIrModulo(DI_MODULOS[idx + 1].id);
  else cerrarDecaimiento();
}


/* ╔══════════════════════════════════════════════════════════╗
   ║  PANTALLA INTRO — Leyes de Conservación                    ║
   ╚══════════════════════════════════════════════════════════╝ */
function diMostrarIntro() {
  const body = document.getElementById('di-body');
  diSetInstruccion('Antes de jugar, aprende las reglas que gobiernan cada decaimiento.');
  diRenderDots();

  body.innerHTML = `
    <div class="di-intro">
      <div class="di-intro-titulo">🔬 Leyes de Conservación en Decaimientos</div>

      <div class="di-intro-sub">
        Cuando una partícula decae, <strong>no todo vale</strong>. La naturaleza exige que
        ciertas cantidades se conserven en el proceso. Si alguna se viola,
        <strong>el decaimiento no ocurre</strong>.
      </div>

      <div class="di-tabla-wrap">
        <table class="di-tabla">
          <thead>
            <tr>
              <th>Ley</th>
              <th>¿Qué significa?</th>
              <th>Ejemplo en μ⁻ → e⁻ + ν̄ₑ + νμ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>⚡ Energía</td>
              <td>La masa de la madre debe ser mayor que la suma de masas de las hijas.</td>
              <td>μ⁻ (105.6 MeV) &gt; e⁻ (0.5) + 0 + 0 ✓</td>
            </tr>
            <tr>
              <td>🔄 Momento</td>
              <td>El momento total antes y después debe ser igual (las hijas se lo reparten).</td>
              <td>Las hijas salen en ángulos que equilibran el momento ✓</td>
            </tr>
            <tr>
              <td>⚡ Carga</td>
              <td>La carga eléctrica total se conserva.</td>
              <td>−1 → −1 + 0 + 0 ✓</td>
            </tr>
            <tr>
              <td>🌀 Nº leptónico</td>
              <td>El nº de leptones de <em>cada sabor</em> (e, μ, τ) se conserva por separado.</td>
              <td>L_μ: 1 → 0 + 0 + 1 ✓&nbsp;&nbsp; L_e: 0 → 1 + (−1) + 0 ✓</td>
            </tr>
            <tr>
              <td>🔵 Nº bariónico</td>
              <td>El nº de bariones se conserva (quarks no se crean ni destruyen solos).</td>
              <td>B: 0 → 0 + 0 + 0 ✓</td>
            </tr>
            <tr>
              <td>🎲 Sabor (quarks)</td>
              <td>El sabor puede cambiar mediante la fuerza débil, pero solo según la matriz CKM.</td>
              <td>s → u + W⁻ ✓ (cambio de sabor permitido)</td>
            </tr>
            <tr>
              <td>🌀 Espín</td>
              <td>El espín total se conserva (combinando los espines de todas las hijas).</td>
              <td>1/2 → 1/2 ⊕ 1/2 ⊕ 1/2 ✓</td>
            </tr>
            <tr>
              <td>🎨 Color (QCD)</td>
              <td>La carga de color total se conserva; los hadrones son siempre neutros de color.</td>
              <td>R+G+B → R+G+B ✓</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="di-regla-oro">
        <strong>Regla de oro:</strong> Si una reacción <em>viola</em> cualquiera de estas leyes,
        la naturaleza la <strong>prohíbe</strong>. El sistema la rechaza sin importar cuánta energía haya disponible.
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:8px">
        <button class="di-btn di-btn-accion" style="width:auto;padding:10px 28px"
                onclick="diIrModulo('A')">Entendido — Empezar Módulo A →</button>
      </div>
    </div>
  `;
}


/* ╔══════════════════════════════════════════════════════════╗
   ║  MÓDULO A — Canales de Decaimiento                         ║
   ╚══════════════════════════════════════════════════════════╝
   El usuario ve una partícula y elige entre 4 canales de decaimiento.
   Uno o dos son permitidos; los demás violan alguna ley. Tras elegir,
   el sistema explica qué leyes se conservan o violan.
   Secuencia: μ⁻ → τ⁻ → charm quark → Λ⁰. */

const DI_A_PARTICULAS = [
  {
    sym: 'μ⁻', nombre: 'Muón', col: '#4fc3f7',
    masa: '105.7 MeV',
    info: 'El muón es un leptón de la 2.ª generación. Decae por la fuerza débil en ≈ 2.2 μs. Solo UNA vía es dominante, pero comprueba si alguna otra también es posible.',
    canales: [
      { txt: 'μ⁻ → e⁻ + ν̄ₑ + νμ', ok: true,
        exp: '✓ Conserva todo: carga (−1=−1+0+0), L_e (0=1−1+0), L_μ (1=0+0+1). Canal dominante (~100%).' },
      { txt: 'μ⁻ → e⁻ + γ', ok: false,
        exp: '✗ Viola L_μ: antes 1, después 0. El γ no lleva número leptónico muónico.' },
      { txt: 'μ⁻ → e⁻ + e⁺ + e⁻', ok: false,
        exp: '✗ Viola L_μ=1: no hay νμ en el estado final que conserve el sabor muónico.' },
      { txt: 'μ⁻ → νμ + γ', ok: false,
        exp: '✗ Viola carga: −1 → 0 + 0 = 0 ≠ −1.' },
      { txt: 'μ⁻ → νμ + e⁻ + ν̄μ', ok: false,
        exp: '✗ Viola L_μ: 1 → 1 + 0 + (−1) = 0 ≠ 1. El ν̄μ lleva número leptónico −1.' },
      { txt: 'μ⁻ → νμ + ν̄ₑ + e⁻', ok: true,
        exp: '✓ Mismo decaimiento que la primera opción, escrito en distinto orden: μ⁻ → e⁻ + ν̄ₑ + νμ ✓.' },
    ],
  },
  {
    sym: 'τ⁻', nombre: 'Tau', col: '#ba68c8',
    masa: '1776.9 MeV',
    info: 'El tau es el leptón más pesado (3.ª gen.), vida media ~290 fs. Su masa le permite decaer a leptones O a hadrones — identifica todas las vías válidas.',
    canales: [
      { txt: 'τ⁻ → e⁻ + ν̄ₑ + ντ', ok: true,
        exp: '✓ Carga: −1→−1+0+0 ✓. L_τ: 1→0+0+1 ✓. L_e: 0→1−1+0 ✓.' },
      { txt: 'τ⁻ → μ⁻ + ν̄μ + ντ', ok: true,
        exp: '✓ Como el anterior pero con μ. L_τ: 1→0+0+1 ✓. L_μ: 0→1−1+0 ✓. La masa del τ alcanza para producir el μ.' },
      { txt: 'τ⁻ → π⁻ + ντ', ok: true,
        exp: '✓ Decaimiento hadrónico (~10.8%): s→u vía W⁻. Carga −1→−1+0 ✓. L_τ 1→0+1 ✓. B: 0→0+0 ✓.' },
      { txt: 'τ⁻ → μ⁻ + γ', ok: false,
        exp: '✗ Viola L_τ: 1 → 0+0 = 0 ≠ 1. No hay ντ en el estado final.' },
      { txt: 'τ⁻ → e⁻ + μ⁺ + μ⁻', ok: false,
        exp: '✗ Viola L_τ=1: el estado final tiene L_τ=0 (ninguna partícula lleva número tau).' },
      { txt: 'τ⁻ → ν̄τ + e⁺ + νₑ', ok: false,
        exp: '✗ Viola carga: −1 → 0 + (+1) + 0 = +1 ≠ −1.' },
    ],
  },
  {
    sym: 'c', nombre: 'Quark charm', col: '#ffb74d',
    masa: '1270 MeV',
    info: 'El charm decae por la fuerza débil emitiendo W⁺. La matriz CKM fija qué transiciones de sabor ocurren y cuán probables son.',
    canales: [
      { txt: 'c → s + W⁺', ok: true,
        exp: '✓ Transición c→s favorecida por CKM (Vcs≈0.97). Carga: +2/3 → −1/3 + 1 = +2/3 ✓.' },
      { txt: 'c → d + W⁺', ok: true,
        exp: '✓ Suprimido de Cabibbo (Vcd≈0.22), pero permitido. Conserva carga y número bariónico.' },
      { txt: 'c → u + Z⁰', ok: false,
        exp: '✗ Corriente neutra de sabor (FCNC). El mecanismo GIM cancela estos procesos a nivel árbol.' },
      { txt: 'c → b + W⁺', ok: false,
        exp: '✗ Vetado cinemáticamente: el quark b (4180 MeV) es más pesado que el charm (1270 MeV). No hay energía.' },
      { txt: 'c → s + γ', ok: false,
        exp: '✗ Cambio de sabor con fotón (FCNC radiativo). Muy suprimido por el mecanismo GIM; no ocurre a nivel árbol.' },
      { txt: 'c → s + s + ū', ok: false,
        exp: '✗ Viola carga: +2/3 → (−1/3) + (−1/3) + (−2/3) = −4/3 ≠ +2/3.' },
    ],
  },
  {
    sym: 'Λ⁰', nombre: 'Lambda', col: '#69ffa6',
    masa: '1115.7 MeV',
    info: 'El Λ⁰ es un barión extraño (uds), vida media ~260 ps. Decae débilmente cuando el quark s cambia a u vía W⁻ virtual.',
    canales: [
      { txt: 'Λ⁰ → p + π⁻', ok: true,
        exp: '✓ Carga: 0→+1+(−1)=0 ✓. B: 1→1+0=1 ✓ (π⁻ es mesón). Canal dominante (~64%).' },
      { txt: 'Λ⁰ → n + π⁰', ok: true,
        exp: '✓ Carga: 0→0+0=0 ✓. B: 1→1+0=1 ✓. También mediado por W⁻ virtual (~36%).' },
      { txt: 'Λ⁰ → p + e⁻', ok: false,
        exp: '✗ Viola L_e: aparece un e⁻ (L_e=1) sin ν̄ₑ que lo compense. L_e: 0→0+1 ≠ 0.' },
      { txt: 'Λ⁰ → n + n', ok: false,
        exp: '✗ Viola energía: Λ⁰ (1115 MeV) < 2×n (2×939=1878 MeV). No hay energía para producir dos neutrones.' },
      { txt: 'Λ⁰ → Λ⁰ + γ', ok: false,
        exp: '✗ Viola energía: el producto Λ⁰ tiene la misma masa que la madre; no queda energía para el fotón.' },
      { txt: 'Λ⁰ → p + π⁻ + π⁰', ok: false,
        exp: '✗ Violación de energía: Λ⁰ (1115 MeV) < p (938) + π⁻ (140) + π⁰ (135) = 1213 MeV.' },
    ],
  },
];

function diModuloA(body) {
  diSetInstruccion('Módulo A · Decaimiento — Elige el canal correcto y aprende por qué las leyes de conservación lo permiten o prohíben.');
  diState.completado = false;
  diState.aPartIdx = 0;
  diState.aResueltas = new Set();

  body.innerHTML = `
    <div class="di-wrap">
      <div class="di-panel">
        <div class="di-panel-card">
          <div class="di-panel-title">Progreso</div>
          <div class="di-reto" id="di-reto-txt">Selecciona <b>todos</b> los canales <b>permitidos</b> y pulsa «Confirmar».</div>
          <div class="di-prog-wrap"><div class="di-prog-barra" id="di-prog-barra"></div></div>
          <div class="di-prog-lbl" id="di-prog-lbl">0 / ${DI_A_PARTICULAS.length} partículas</div>
          <div class="di-particulas-tira" id="di-a-tira"></div>
        </div>
        <div class="di-panel-card">
          <div class="di-panel-title">Partícula</div>
          <div id="di-a-madre"></div>
        </div>
        <div class="di-panel-card">
          <div class="di-panel-title">Canales de decaimiento</div>
          <div class="di-canales" id="di-a-canales"></div>
          <button class="di-btn di-btn-accion" id="di-a-confirmar" onclick="diAConfirmar()" style="margin-top:8px">✓ Confirmar selección</button>
          <div class="di-estado" id="di-estado" style="margin-top:6px"></div>
        </div>
        <div class="di-panel-card">
          <div class="di-panel-title">Explicación</div>
          <div class="di-exp-box" id="di-a-exp">Selecciona canales y pulsa «Confirmar» para ver el análisis.</div>
        </div>
        <div class="di-logro-cont hidden" id="di-logro-cont"></div>
      </div>

      <div class="di-canvas-wrap">
        <canvas id="di-canvas" class="di-canvas"></canvas>
        <div class="di-canvas-legend" id="di-a-legend"></div>
      </div>
    </div>
  `;

  const cv = document.getElementById('di-canvas');
  diState.cvA = cv; diState.ctxA = cv.getContext('2d');
  diAjustarCanvas();
  window.addEventListener('resize', diAjustarCanvas);
  diProgreso(0, '0 / ' + DI_A_PARTICULAS.length + ' partículas');
  diARenderTira();
  diACargarParticula();
  diALoop();
}

function diARenderTira() {
  const tira = document.getElementById('di-a-tira');
  if (!tira) return;
  tira.innerHTML = DI_A_PARTICULAS.map((p, i) => {
    const cls = i < diState.aPartIdx ? 'hecho' : i === diState.aPartIdx ? 'actual' : '';
    return `<span class="di-part-chip ${cls}" style="color:${p.col};border-color:${p.col};text-shadow:0 0 8px ${p.col}"
              title="${p.nombre}">${p.sym}</span>`;
  }).join('');
}

function diACargarParticula() {
  const p = DI_A_PARTICULAS[diState.aPartIdx];
  diState.aTransicion = false;
  diState.aSelSet = new Set();   /* índices (en el orden barajado) que el usuario marcó */

  /* Barajar los 6 canales */
  const orden = p.canales.map((c, i) => i);
  for (let i = orden.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [orden[i], orden[j]] = [orden[j], orden[i]];
  }
  diState.aOrdenCanales = orden;  /* orden[posición_visual] = índice_real */

  /* Madre */
  const madreEl = document.getElementById('di-a-madre');
  if (madreEl) madreEl.innerHTML = `
    <div class="di-madre">
      <div class="di-madre-sym" style="color:${p.col};text-shadow:0 0 16px ${p.col}">${p.sym}</div>
      <div class="di-madre-info">
        <b>${p.nombre}</b><br>Masa: ${p.masa}<br>${p.info}
      </div>
    </div>`;

  /* Renderizar canales en orden barajado; clic alterna la selección */
  const canalesEl = document.getElementById('di-a-canales');
  if (canalesEl) canalesEl.innerHTML = orden.map((ri, vi) =>
    `<button class="di-canal" id="di-canal-${vi}" onclick="diAElegir(${vi})">${p.canales[ri].txt}</button>`
  ).join('');

  /* Leyenda canvas */
  const leg = document.getElementById('di-a-legend');
  const nOk = p.canales.filter(c => c.ok).length;
  if (leg) leg.innerHTML = `<span style="color:${p.col}">● ${p.sym}</span>
    <span style="color:#80d8ff">${nOk} canal${nOk>1?'es':''} permitido${nOk>1?'s':''}</span>
    <span style="color:#69ffa6">✓ seleccionado</span>
    <span style="color:#ff8a80">✗ no</span>`;

  /* Exp y estado */
  const exp = document.getElementById('di-a-exp');
  if (exp) { exp.textContent = 'Selecciona canales y pulsa «Confirmar» para ver el análisis.'; exp.className = 'di-exp-box'; }
  diEstado('', null);

  /* habilitar el botón de confirmar */
  const conf = document.getElementById('di-a-confirmar');
  if (conf) conf.disabled = false;

  /* Canvas */
  diState.aFase = 'esperando';
  diState.aFrags = [];
  diState.aT = 0;
  diState.aPartColor = p.col;
  diState.aPartSym   = p.sym;
}

/* Alterna la selección de un canal (clic = marcar/desmarcar) */
function diAElegir(vi) {
  if (diState.aTransicion || diState.completado) return;
  const btn = document.getElementById('di-canal-' + vi);
  if (!btn || btn.disabled) return;
  if (diState.aSelSet.has(vi)) {
    diState.aSelSet.delete(vi);
    btn.classList.remove('seleccionado');
  } else {
    diState.aSelSet.add(vi);
    btn.classList.add('seleccionado');
  }
}

/* Evalúa si el usuario seleccionó EXACTAMENTE todos los canales permitidos */
function diAConfirmar() {
  if (diState.aTransicion || diState.completado) return;
  const p = DI_A_PARTICULAS[diState.aPartIdx];
  const orden = diState.aOrdenCanales;

  /* Índices visuales que son "ok" en el orden barajado */
  const okVis = new Set(orden.map((ri, vi) => p.canales[ri].ok ? vi : -1).filter(v => v >= 0));

  /* Compara los seleccionados con los correctos */
  const seleccionados = diState.aSelSet;
  const todosOk = [...okVis].every(vi => seleccionados.has(vi));
  const sinFalsos = [...seleccionados].every(vi => okVis.has(vi));
  const correcto = todosOk && sinFalsos;

  /* Colorear todos los botones según real */
  orden.forEach((ri, vi) => {
    const btn = document.getElementById('di-canal-' + vi);
    if (!btn) return;
    btn.disabled = true;
    btn.classList.remove('seleccionado');
    if (p.canales[ri].ok) btn.classList.add('ok');
    else                  btn.classList.add('err');
  });

  /* Deshabilitar confirmar */
  const conf = document.getElementById('di-a-confirmar');
  if (conf) conf.disabled = true;

  /* Mostrar explicación combinada */
  const exp = document.getElementById('di-a-exp');
  if (exp) {
    exp.innerHTML = orden.map((ri, vi) => {
      const c = p.canales[ri];
      const marcado = seleccionados.has(vi);
      const icono = c.ok ? '✓' : '✗';
      const cls   = c.ok ? 'ok' : 'err';
      return `<div class="di-exp-box ${cls}" style="margin-bottom:4px"><b>${icono} ${c.txt}</b><br>${c.exp}</div>`;
    }).join('');
    exp.className = 'di-exp-box';
  }

  diEstado(
    correcto
      ? '✔ ¡Correcto! Identificaste todos los canales permitidos.'
      : '✗ No exactamente — revisa cuáles leyes se violan en cada canal.',
    correcto
  );

  if (correcto) {
    /* Animar todos los canales permitidos */
    const primerOk = orden.findIndex((ri) => p.canales[ri].ok);
    if (primerOk >= 0) { diState.aFase = 'decae'; diAGenerarFrags(primerOk); }
  }

  diState.aTransicion = true;

  /* Avanzar siempre (tras corrección o intento) a los 2.5 s */
  setTimeout(() => {
    if (diState.completado) return;
    diState.aResueltas.add(diState.aPartIdx);
    diState.aPartIdx++;
    const hechas = diState.aResueltas.size;
    diProgreso(hechas / DI_A_PARTICULAS.length, hechas + ' / ' + DI_A_PARTICULAS.length + ' partículas');
    if (diState.aPartIdx >= DI_A_PARTICULAS.length) {
      diRetoCumplido('¡Todas las partículas resueltas! Las leyes de conservación determinan qué decaimientos existen en la naturaleza.');
    } else {
      diState.aTransicion = false;
      diARenderTira();
      diACargarParticula();
      const reto = document.getElementById('di-reto-txt');
      if (reto) reto.innerHTML = 'Selecciona <b>todos</b> los canales <b>permitidos</b> y pulsa «Confirmar».';
    }
  }, 2500);
}

function diAGenerarFrags(ci) {
  const p  = DI_A_PARTICULAS[diState.aPartIdx];
  const cv = diState.cvA;
  if (!cv) return;
  const cx = cv.width / 2, cy = cv.height * 0.45;
  /* Parsear los productos del canal elegido (texto descriptivo, simplificado) */
  const canal  = p.canales[ci].txt;
  const partes = canal.split('→')[1]?.split('+').map(s => s.trim()) || [];
  const cols   = ['#69ffa6','#ffd740','#80d8ff','#ff8a80','#b388ff'];
  diState.aFrags = partes.map((sym, i) => {
    const ang = (i / partes.length) * Math.PI * 2 - Math.PI / 2;
    return {
      sym: sym.split(' ')[0],
      col: cols[i % cols.length],
      x: cx, y: cy,
      vx: Math.cos(ang) * (2.4 + Math.random()),
      vy: Math.sin(ang) * (2.4 + Math.random()),
      r: 13
    };
  });
}

function diALoop() {
  diRAF = requestAnimationFrame(diALoop);
  const cv = diState.cvA, ctx = diState.ctxA;
  if (!cv || !ctx) return;
  const W = cv.width, H = cv.height;
  mjGridBackground(ctx, W, H);
  diState.aT += 0.05;
  const cx = W / 2, cy = H * 0.45;

  if (diState.aFase === 'esperando' || diState.aFase === 'resultado') {
    /* Partícula central pulsando */
    const r = 34 + Math.sin(diState.aT * 2) * 3;
    ctx.save();
    ctx.shadowColor = diState.aPartColor; ctx.shadowBlur = 28;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(cx - 10, cy - 10, 0, cx, cy, r);
    g.addColorStop(0, '#fff'); g.addColorStop(0.4, diState.aPartColor); g.addColorStop(1, diState.aPartColor);
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = '#06121f'; ctx.font = 'bold 16px "Orbitron",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(diState.aPartSym, cx, cy);
    ctx.restore();

    /* Anillo de preceso */
    ctx.save();
    ctx.strokeStyle = diState.aPartColor; ctx.globalAlpha = 0.18; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 56 + Math.sin(diState.aT) * 4, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    /* Pregunta */
    ctx.save();
    ctx.fillStyle = 'rgba(205,238,255,0.7)'; ctx.font = '12px "Exo 2",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('¿Cuál de los canales del panel es el permitido?', cx, cy + 76);
    ctx.restore();
  }

  if (diState.aFase === 'decae' || diState.aFase === 'resultado') {
    /* Destello de decaimiento */
    if (diState.aFase === 'decae') {
      const fl = Math.max(0, 1 - diState.aT * 0.7);
      ctx.save(); ctx.globalAlpha = fl;
      const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
      fg.addColorStop(0, 'rgba(255,255,255,0.8)');
      fg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    /* Fragmentos */
    diState.aFrags.forEach(f => {
      f.x += f.vx; f.y += f.vy; f.vx *= 0.97; f.vy *= 0.97;
      if (f.x < f.r || f.x > W - f.r) f.vx *= -1;
      if (f.y < f.r || f.y > H - f.r) f.vy *= -1;
      /* Traza */
      ctx.save();
      ctx.strokeStyle = f.col; ctx.globalAlpha = 0.3; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(f.x - f.vx * 6, f.y - f.vy * 6); ctx.lineTo(f.x, f.y); ctx.stroke();
      ctx.restore();
      /* Partícula */
      ctx.save();
      ctx.shadowColor = f.col; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(f.x - 4, f.y - 4, 0, f.x, f.y, f.r);
      g.addColorStop(0, '#fff'); g.addColorStop(0.4, f.col); g.addColorStop(1, f.col);
      ctx.fillStyle = g; ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.fillStyle = '#06121f'; ctx.font = 'bold 9px "Orbitron",monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(f.sym, f.x, f.y);
      ctx.restore();
    });
    if (diState.aFase === 'decae' && diState.aT > 0.6) diState.aFase = 'resultado';
  }
}


/* ╔══════════════════════════════════════════════════════════╗
   ║  MÓDULO B — El Espectro de Energía                         ║
   ╚══════════════════════════════════════════════════════════╝
   El usuario predice si el espectro es continuo o monoE para
   cada decaimiento, luego ve el espectro animado real y descubre
   que el nº de cuerpos en el estado final lo determina. */

const DI_B_CASOS = [
  {
    reaccion: 'μ⁻ → e⁻ + ν̄ₑ + νμ',
    cuerpos: 3, tipo: 'continuo',
    col: '#4fc3f7',
    exp: '3 cuerpos: la energía se distribuye entre 3 partículas → espectro <b>continuo</b>. El espectro del e⁻ va de 0 a E_max. Así se descubrió el neutrino.',
  },
  {
    reaccion: 'π⁺ → μ⁺ + νμ',
    cuerpos: 2, tipo: 'mono',
    col: '#ff8a80',
    exp: '2 cuerpos: por conservación de energía-momento, el μ⁺ sale siempre con la misma energía → espectro <b>monoenergético</b> (pico único).',
  },
  {
    reaccion: 'n → p + e⁻ + ν̄ₑ',
    cuerpos: 3, tipo: 'continuo',
    col: '#80d8ff',
    exp: '3 cuerpos: el e⁻ del decaimiento β tiene un espectro <b>continuo</b>. Este fue el enigma que llevó a Pauli a postular el neutrino en 1930.',
  },
  {
    reaccion: 'K⁺ → μ⁺ + νμ',
    cuerpos: 2, tipo: 'mono',
    col: '#ffd740',
    exp: '2 cuerpos: igual que π⁺→μ⁺+νμ. El μ⁺ siempre sale con la misma energía → pico <b>monoenergético</b>.',
  },
];

function diModuloB(body) {
  diSetInstruccion('Módulo B · Espectro de Energía — ¿El espectro del producto es continuo (muchas energías posibles) o monoenergético (una sola energía)?');
  diState.completado = false;
  diState.bIdx = 0;
  diState.bAciertos = 0;
  diState.bMostrandoEsp = false;
  diState.bTipo = null;

  body.innerHTML = `
    <div class="di-wrap">
      <div class="di-panel">
        <div class="di-panel-card">
          <div class="di-panel-title">Progreso</div>
          <div class="di-reto" id="di-reto-txt">—</div>
          <div class="di-prog-wrap"><div class="di-prog-barra" id="di-prog-barra"></div></div>
          <div class="di-prog-lbl" id="di-prog-lbl">0 / ${DI_B_CASOS.length}</div>
          <div class="di-estado" id="di-estado"></div>
        </div>
        <div class="di-panel-card">
          <div class="di-panel-title">¿Qué es el espectro?</div>
          <div class="di-hint">
            El <strong>espectro de energía</strong> muestra con qué energía puede salir cada producto.
            Si hay <strong>2 cuerpos</strong> en el estado final, la conservación de energía-momento fija
            una única energía posible → pico <strong>monoenergético</strong>.
            Si hay <strong>3 o más cuerpos</strong>, la energía puede repartirse de muchas formas →
            espectro <strong>continuo</strong>.
          </div>
        </div>
        <div class="di-panel-card">
          <div class="di-panel-title">Predicción</div>
          <div id="di-b-reaccion" style="font-family:'Orbitron',monospace;font-size:13px;color:#4fc3f7;text-align:center;padding:6px 0">—</div>
          <div class="di-pred-btns">
            <button class="di-pred-btn" id="di-pred-cont" onclick="diBPrediccion('continuo')">〜 Continuo</button>
            <button class="di-pred-btn" id="di-pred-mono" onclick="diBPrediccion('mono')">| Monoenergético</button>
          </div>
          <div class="di-exp-box" id="di-b-exp" style="margin-top:6px;display:none"></div>
        </div>
        <div class="di-logro-cont hidden" id="di-logro-cont"></div>
      </div>

      <div class="di-canvas-wrap">
        <canvas id="di-canvas" class="di-canvas"></canvas>
        <div class="di-canvas-legend">
          <span style="color:#4fc3f7">~ continuo</span>
          <span style="color:#ffd740">| monoenergético</span>
        </div>
      </div>
    </div>
  `;

  const cv = document.getElementById('di-canvas');
  diState.cvB = cv; diState.ctxB = cv.getContext('2d');
  diAjustarCanvas();
  window.addEventListener('resize', diAjustarCanvas);
  diProgreso(0, '0 / ' + DI_B_CASOS.length);
  diBCargar();
  diBLoop();
}

function diBCargar() {
  const c = DI_B_CASOS[diState.bIdx];
  const reacEl = document.getElementById('di-b-reaccion');
  if (reacEl) reacEl.textContent = c.reaccion;
  const reto = document.getElementById('di-reto-txt');
  if (reto) reto.innerHTML = 'Decaimiento <b>' + c.reaccion + '</b>. ¿El espectro del producto es continuo o monoenergético?';
  const exp = document.getElementById('di-b-exp');
  if (exp) { exp.style.display = 'none'; exp.className = 'di-exp-box'; }
  diEstado('', null);
  ['di-pred-cont','di-pred-mono'].forEach(id => {
    const b = document.getElementById(id);
    if (b) { b.classList.remove('selected'); b.disabled = false; }
  });
  diState.bMostrandoEsp = false;
  diState.bTipo = c.tipo;
  diState.bT = 0;
}

function diBPrediccion(tipo) {
  if (diState.completado) return;
  const c = DI_B_CASOS[diState.bIdx];
  const ok = tipo === c.tipo;
  const btnId = tipo === 'continuo' ? 'di-pred-cont' : 'di-pred-mono';
  const btn = document.getElementById(btnId);
  if (btn) btn.classList.add('selected');
  ['di-pred-cont','di-pred-mono'].forEach(id => { const b = document.getElementById(id); if (b) b.disabled = true; });

  diEstado(ok ? '✔ Correcto.' : '✗ No exactamente — observa el espectro.', ok);
  const exp = document.getElementById('di-b-exp');
  if (exp) { exp.innerHTML = c.exp; exp.style.display = 'block'; exp.className = 'di-exp-box ' + (ok?'ok':'err'); }
  diState.bMostrandoEsp = true;

  setTimeout(() => {
    if (diState.completado) return;
    if (ok) diState.bAciertos++;
    diState.bIdx++;
    const hechos = diState.bIdx;
    diProgreso(hechos / DI_B_CASOS.length, hechos + ' / ' + DI_B_CASOS.length);
    if (diState.bIdx >= DI_B_CASOS.length) {
      diRetoCumplido('¡Espectros dominados! 2 cuerpos → monoenergético; 3 cuerpos → continuo. El espectro continuo del decaimiento β fue la prueba de la existencia del neutrino.');
    } else {
      diBCargar();
    }
  }, 2400);
}

function diBLoop() {
  diRAF = requestAnimationFrame(diBLoop);
  const cv = diState.cvB, ctx = diState.ctxB;
  if (!cv || !ctx) return;
  const W = cv.width, H = cv.height;
  mjGridBackground(ctx, W, H);
  if (diState.bIdx >= DI_B_CASOS.length) return;
  diState.bT = (diState.bT || 0) + 0.04;
  const c   = DI_B_CASOS[diState.bIdx];
  const pad = { l: 70, r: 30, t: 50, b: 50 };
  const gW  = W - pad.l - pad.r;
  const gH  = H - pad.t - pad.b;

  /* Ejes */
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + gH);
  ctx.lineTo(pad.l + gW, pad.t + gH); ctx.stroke();
  ctx.fillStyle = 'rgba(205,238,255,0.6)'; ctx.font = '11px "Exo 2",sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Energía del producto →', pad.l + gW / 2, pad.t + gH + 34);
  ctx.textAlign = 'right';
  ctx.save(); ctx.translate(pad.l - 32, pad.t + gH / 2); ctx.rotate(-Math.PI/2);
  ctx.fillText('Nº de eventos', 0, 0); ctx.restore();
  ctx.restore();

  /* Etiqueta */
  ctx.save();
  ctx.fillStyle = c.col; ctx.font = 'bold 13px "Orbitron",monospace'; ctx.textAlign = 'center';
  ctx.fillText(c.reaccion, pad.l + gW / 2, pad.t - 14);
  ctx.restore();

  const rev = diState.bMostrandoEsp ? Math.min(1, (diState.bT - 0.3) * 1.5) : 0;

  ctx.save();
  ctx.strokeStyle = c.col; ctx.lineWidth = 3;
  ctx.shadowColor = c.col; ctx.shadowBlur = 12;
  ctx.beginPath();
  if (c.tipo === 'continuo') {
    /* Espectro continuo: forma de Kurie (crece, alcanza un máximo, cae) */
    const pts = 80;
    for (let i = 0; i <= pts; i++) {
      const xf = i / pts;
      if (xf > rev) break;
      const yf = xf * Math.sqrt(1 - xf) * 3.8;  /* forma β simplificada */
      const px = pad.l + xf * gW;
      const py = pad.t + gH - yf * gH * 0.88;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    /* E_max */
    if (rev > 0.98) {
      ctx.setLineDash([4,4]); ctx.strokeStyle = 'rgba(205,238,255,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.l + gW, pad.t); ctx.lineTo(pad.l + gW, pad.t + gH); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(205,238,255,0.6)'; ctx.font = '10px "Exo 2",sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('E_max', pad.l + gW, pad.t + gH + 18);
    }
  } else {
    /* Monoenergético: pico gaussiano estrecho */
    const xf = 0.62;
    const peakX = pad.l + xf * gW;
    const peakH = gH * 0.82 * rev;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const dx = (i / 60 - 0.5) * gW * 0.18;
      const yf = Math.exp(-dx * dx / (gW * 0.006));
      const px = peakX + dx;
      const py = pad.t + gH - peakH * yf;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    if (rev > 0.5) {
      ctx.fillStyle = 'rgba(205,238,255,0.65)'; ctx.font = '10px "Exo 2",sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('E₀ (fija)', peakX, pad.t + gH + 18);
    }
  }
  ctx.restore();
}


/* ╔══════════════════════════════════════════════════════════╗
   ║  MÓDULO C — La Vida Media                                  ║
   ╚══════════════════════════════════════════════════════════╝
   El usuario arrastra las partículas para ordenarlas de mayor a
   menor vida media. Luego asocia cada una con la fuerza que media
   su decaimiento y ve la barra logarítmica que las compara. */

const DI_C_PARTAS = [
  { sym:'Δ⁺⁺', col:'#ff8a80', tau:'~10⁻²³ s',  log:-23, fuerza:'fuerte',  exp:'Fuerza fuerte: decae casi instantáneamente.' },
  { sym:'t',    col:'#ffb74d', tau:'~5×10⁻²⁵ s', log:-24.3, fuerza:'debil', exp:'El quark top es tan masivo que decae antes de poder hadronizar (sin confinamiento).' },
  { sym:'Σ⁰',  col:'#ffd740', tau:'~10⁻¹⁹ s',  log:-19, fuerza:'em',     exp:'Decaimiento EM (Σ⁰→Λγ): más lento que la fuerte, más rápido que la débil.' },
  { sym:'b',    col:'#ba68c8', tau:'~1.5×10⁻¹²s',log:-12, fuerza:'debil',  exp:'Quark bottom: débil suprimida por CKM (Vcb pequeño) → bastante estable.' },
  { sym:'K⁺',  col:'#69ffa6', tau:'~1.2×10⁻⁸s', log:-8,  fuerza:'debil',  exp:'Débil suprimida de Cabibbo (s→u): más corta que π⁺ por diferencia de masa.' },
  { sym:'π⁺',  col:'#4fc3f7', tau:'~2.6×10⁻⁸s', log:-7.6, fuerza:'debil', exp:'Débil: π⁺→μ⁺+νμ. La supresión helicidad alargar algo su vida respecto al kaón.' },
  { sym:'μ⁻',  col:'#80d8ff', tau:'~2.2×10⁻⁶s', log:-6,  fuerza:'debil',  exp:'Débil pura: μ⁻→e⁻+ν̄ₑ+νμ. Leptón ligero, sin supresión CKM → larga vida.' },
  { sym:'Λ⁰',  col:'#a5d6a7', tau:'~2.6×10⁻¹⁰s',log:-10, fuerza:'debil', exp:'Barión extraño: cambio s→u via W⁻ virtual. Supresión por Vus en CKM.' },
  { sym:'n',   col:'#b388ff', tau:'~880 s',       log:3,   fuerza:'debil',  exp:'El neutrón libre decae en ~15 min. Dentro del núcleo puede ser estable.' },
];

/* Ordenadas de mayor a menor log (= de más larga a más corta vida) */
const DI_C_ORDEN_CORRECTO = [...DI_C_PARTAS]
  .sort((a, b) => b.log - a.log)
  .map(p => p.sym);

function diModuloC(body) {
  diSetInstruccion('Módulo C · Vida Media — Ordena las partículas de mayor a menor vida media y descubre qué fuerza rige cada decaimiento.');
  diState.completado = false;
  diState.cOrden = [...DI_C_PARTAS].sort(() => Math.random() - 0.5);  /* barajado */
  diState.cVerificado = false;
  diState.cDragIdx = null;
  diState.cT = 0;

  body.innerHTML = `
    <div class="di-wrap">
      <div class="di-panel">
        <div class="di-panel-card">
          <div class="di-panel-title">Reto</div>
          <div class="di-reto" id="di-reto-txt">Arrastra las partículas para ordenarlas de <b>mayor</b> a <b>menor</b> vida media. Luego pulsa «Verificar».</div>
          <div class="di-prog-wrap"><div class="di-prog-barra" id="di-prog-barra"></div></div>
          <div class="di-prog-lbl" id="di-prog-lbl">—</div>
          <div class="di-estado" id="di-estado"></div>
        </div>
        <div class="di-panel-card">
          <div class="di-panel-title">Orden (mayor → menor vida)</div>
          <div class="di-vm-lista" id="di-c-lista"></div>
          <button class="di-btn di-btn-accion" style="margin-top:8px" onclick="diCVerificar()">✓ Verificar orden</button>
          <button class="di-btn di-btn-sutil" onclick="diCMostrarSolucion()">👁 Ver solución</button>
        </div>
        <div class="di-panel-card">
          <div class="di-panel-title">Conceptos clave</div>
          <div class="di-hint">
            La <strong>vida media</strong> depende de:<br>
            • La <em>fuerza que media</em> el decaimiento (fuerte &gt; EM &gt; débil).<br>
            • El <em>espacio de fase</em> (más masa disponible = decae más rápido).<br>
            • Las <em>reglas CKM</em> (cambios de sabor suprimidos = vida más larga).
          </div>
          <div class="di-vm-orden" id="di-c-exp">—</div>
        </div>
        <div class="di-logro-cont hidden" id="di-logro-cont"></div>
      </div>

      <div class="di-canvas-wrap">
        <canvas id="di-canvas" class="di-canvas"></canvas>
        <div class="di-canvas-legend">
          <span style="color:#ff8a80">fuerte (~10⁻²³s)</span>
          <span style="color:#ffd740">EM (~10⁻¹⁹s)</span>
          <span style="color:#4fc3f7">débil (&gt;10⁻¹⁰s)</span>
        </div>
      </div>
    </div>
  `;

  const cv = document.getElementById('di-canvas');
  diState.cvC = cv; diState.ctxC = cv.getContext('2d');
  diAjustarCanvas();
  window.addEventListener('resize', diAjustarCanvas);
  diCRenderLista();
  diCLoop();
}

function diCRenderLista() {
  const lista = document.getElementById('di-c-lista');
  if (!lista) return;
  lista.innerHTML = diState.cOrden.map((p, i) => {
    const fuerzaCls = p.fuerza === 'fuerte' ? 'fuerte' : p.fuerza === 'em' ? 'em' : 'debil';
    const fuerzaTxt = p.fuerza === 'fuerte' ? 'Fuerte' : p.fuerza === 'em' ? 'EM' : 'Débil';
    const estadoCls = diState.cVerificado
      ? (DI_C_ORDEN_CORRECTO[i] === p.sym ? 'correcto' : 'incorrecto')
      : 'arrastrable';
    return `<div class="di-vm-item ${estadoCls}" draggable="true"
              ondragstart="diCDragStart(${i})"
              ondragover="event.preventDefault()"
              ondrop="diCDrop(${i})"
              id="di-c-item-${i}">
      <span class="di-vm-sym" style="color:${p.col}">${p.sym}</span>
      <span style="font-size:9px;color:rgba(205,238,255,0.6)">${p.tau}</span>
      <span class="di-vm-fuerza ${fuerzaCls}">${fuerzaTxt}</span>
    </div>`;
  }).join('');
}

function diCDragStart(i) { diState.cDragIdx = i; }
function diCDrop(i) {
  if (diState.cVerificado || diState.completado) return;
  const arr = diState.cOrden;
  const tmp = arr[diState.cDragIdx];
  arr[diState.cDragIdx] = arr[i];
  arr[i] = tmp;
  diCRenderLista();
}

function diCVerificar() {
  if (diState.completado) return;
  diState.cVerificado = true;
  const correctos = diState.cOrden.filter((p, i) => DI_C_ORDEN_CORRECTO[i] === p.sym).length;
  const total = DI_C_PARTAS.length;
  diProgreso(correctos / total, correctos + ' / ' + total + ' en posición correcta');
  diCRenderLista();
  if (correctos === total) {
    diEstado('✔ ¡Orden perfecto!', true);
    diRetoCumplido('¡Vida media dominada! La fuerza fuerte (~10⁻²³s), la EM (~10⁻¹⁹s) y la débil (>10⁻¹⁰s) difieren en 13 órdenes de magnitud.');
  } else {
    diEstado('✗ ' + (total - correctos) + ' fuera de lugar — revisa y vuelve a intentarlo, o pulsa «Ver solución».', false);
    /* Resetear para nuevo intento */
    setTimeout(() => { diState.cVerificado = false; diCRenderLista(); }, 1800);
  }
}

function diCMostrarSolucion() {
  diState.cOrden = DI_C_ORDEN_CORRECTO.map(sym => DI_C_PARTAS.find(p => p.sym === sym));
  diState.cVerificado = true;
  diProgreso(1, DI_C_PARTAS.length + ' / ' + DI_C_PARTAS.length + ' en posición correcta');
  diCRenderLista();
  diEstado('Orden correcto mostrado.', true);
  if (!diState.completado)
    diRetoCumplido('¡Vida media dominada! La fuerza fuerte (~10⁻²³s), la EM (~10⁻¹⁹s) y la débil (>10⁻¹⁰s) difieren en 13 órdenes de magnitud.');
}

function diCLoop() {
  diRAF = requestAnimationFrame(diCLoop);
  const cv = diState.cvC, ctx = diState.ctxC;
  if (!cv || !ctx) return;
  const W = cv.width, H = cv.height;
  mjGridBackground(ctx, W, H);
  diState.cT += 0.04;

  /* Escala logarítmica de tiempo horizontal */
  const logMin = -25, logMax = 4;
  const logRange = logMax - logMin;
  const padL = 60, padR = 20, padT = 30, padB = 50;
  const gW = W - padL - padR, gH = H - padT - padB;

  /* Eje */
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(padL, padT + gH); ctx.lineTo(padL + gW, padT + gH); ctx.stroke();
  ctx.fillStyle = 'rgba(205,238,255,0.55)'; ctx.font = '10px "Exo 2",sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('log₁₀(τ / s)', padL + gW / 2, padT + gH + 36);
  /* Marcas cada 5 décadas */
  for (let l = logMin; l <= logMax; l += 5) {
    const x = padL + ((l - logMin) / logRange) * gW;
    ctx.beginPath(); ctx.moveTo(x, padT + gH - 4); ctx.lineTo(x, padT + gH + 4); ctx.stroke();
    ctx.fillText(l, x, padT + gH + 18);
  }
  ctx.restore();

  /* Bandas de color por fuerza */
  const bandas = [
    { label:'Fuerte',logL:-25, logR:-22, col:'rgba(255,138,128,0.07)' },
    { label:'EM',    logL:-21, logR:-17, col:'rgba(255,215,64,0.07)'  },
    { label:'Débil', logL:-15, logR:4,   col:'rgba(79,195,247,0.07)'  },
  ];
  bandas.forEach(b => {
    const x1 = padL + ((b.logL - logMin) / logRange) * gW;
    const x2 = padL + ((b.logR - logMin) / logRange) * gW;
    ctx.save();
    ctx.fillStyle = b.col; ctx.fillRect(x1, padT, x2 - x1, gH);
    ctx.fillStyle = 'rgba(205,238,255,0.35)'; ctx.font = '9px "Exo 2",sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(b.label, (x1 + x2) / 2, padT + 14);
    ctx.restore();
  });

  /* Puntos de cada partícula */
  DI_C_PARTAS.forEach((p, i) => {
    const x = padL + ((p.log - logMin) / logRange) * gW;
    const y = padT + gH * 0.45 + Math.sin(diState.cT * 1.2 + i) * 8;
    ctx.save();
    ctx.shadowColor = p.col; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(x-3, y-3, 0, x, y, 11);
    g.addColorStop(0, '#fff'); g.addColorStop(0.4, p.col); g.addColorStop(1, p.col);
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = '#06121f'; ctx.font = 'bold 7px "Orbitron",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.sym, x, y);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = 'rgba(205,238,255,0.55)'; ctx.font = '8px "Exo 2",sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(p.tau, x, y + 20);
    ctx.restore();
  });
}
