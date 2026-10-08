/* ══════════════════════════════════════════
   minijuegos/js/minijuego-carga-electrica.js
   Minijuego: Carga Eléctrica

   Etapa 1 — "Carga como Etiqueta de Comportamiento"
     Módulo A: Fuerzas (arrastre libre + desafíos de predicción)
     Módulo B: El Cable Mágico (corriente → campo magnético)
     Módulo C: Generador de Ondas (carga oscilante → onda EM)
   ══════════════════════════════════════════ */

/* ════════════════════════════════════════════
   ESTADO GLOBAL
   ════════════════════════════════════════════ */
let ceScreen   = null;
let ceState    = {};
let ceRAF      = null;

/* ════════════════════════════════════════════
   ENTRADA
   ════════════════════════════════════════════ */
function iniciar_carga_electrica() {
  ceState = { etapa: 0, modulo: 0 };
  crearPantallaCE();
  ceLanzarModulo();
}

/* ════════════════════════════════════════════
   CREAR PANTALLA
   ════════════════════════════════════════════ */
function crearPantallaCE() {
  if (ceScreen) ceScreen.remove();
  ceScreen = document.createElement('div');
  ceScreen.id        = 'ce-screen';
  ceScreen.className = 'ce-screen';
  ceScreen.innerHTML = `
    <div class="ce-header">
      <div class="ce-instruccion-wrap">
        <div class="ce-instruccion-label">CARGA ELÉCTRICA</div>
        <div class="ce-instruccion-icon">⚡</div>
        <p class="ce-instruccion" id="ce-instruccion"></p>
      </div>
      <!-- Selector de etapa -->
      <div class="ce-etapa-tabs" id="ce-etapa-tabs"></div>
    </div>
    <div class="ce-body" id="ce-body"></div>
    <div class="ce-nav-bar">
      <button class="ce-btn ce-btn-volver" onclick="cerrarCE()">← Volver al ME</button>
      <div class="ce-nivel-dots" id="ce-nivel-dots"></div>
      <div class="ce-progreso-label" id="ce-progreso-label"></div>
    </div>
  `;
  document.getElementById('app').appendChild(ceScreen);
  ceRenderEtapaTabs();
  ceRenderDots();
}

/* ════════════════════════════════════════════
   NAVEGACIÓN POR ETAPAS Y MÓDULOS
   Cada etapa tiene su propio conjunto de módulos.
   ════════════════════════════════════════════ */
const CE_ETAPAS = [
  {
    id: 'electromagnetismo',
    label: 'Etapa 1 · Electromagnetismo clásico',
    modulos: [
      { id: 'fuerzas', label: 'Fuerzas', icon: '🔵', fn: 'ceModuloFuerzas' },
      { id: 'cable',   label: 'Cable',   icon: '⚡', fn: 'ceModuloCable'   },
      { id: 'ondas',   label: 'Ondas',   icon: '🌊', fn: 'ceModuloOndas'   },
    ]
  },
  {
    id: 'qed',
    label: 'Etapa 2 · QED (Electrodinámica cuántica)',
    modulos: [
      { id: 'intercambio', label: 'Fotón virtual', icon: '🏐', fn: 'ceModuloIntercambio' },
      { id: 'fotones',     label: 'Onda y fotón',  icon: '💡', fn: 'ceModuloFotones'     },
      { id: 'familias',    label: 'Familias',      icon: '🧲', fn: 'ceModuloFamilias'    },
    ]
  },
  {
    id: 'enjambre',
    label: 'Etapa 3 · El Enjambre Electromagnético',
    modulos: [
      { id: 'acoplamiento', label: 'Acoplamiento', icon: '🪝', fn: 'ceModuloAcoplamiento' },
      { id: 'nube',         label: 'Nube cuántica', icon: '☁️', fn: 'ceModuloNube'        },
      { id: 'colectivo',    label: 'Enjambre',      icon: '🐝', fn: 'ceModuloColectivo'   },
    ]
  },
];

/* Cancela todos los loops de animación activos de cualquier módulo */
function ceCancelarRAFs() {
  if (ceRAF)           { cancelAnimationFrame(ceRAF);           ceRAF = null; }
  if (ceFuerzas.rafId) { cancelAnimationFrame(ceFuerzas.rafId); ceFuerzas.rafId = null; }
  if (ceCable.rafId)   { cancelAnimationFrame(ceCable.rafId);   ceCable.rafId = null; }
  if (ceOndas.rafId)   { cancelAnimationFrame(ceOndas.rafId);   ceOndas.rafId = null; }
  if (ceQED.rafId)     { cancelAnimationFrame(ceQED.rafId);     ceQED.rafId = null; }
  if (ceFot.rafId)     { cancelAnimationFrame(ceFot.rafId);     ceFot.rafId = null; }
  if (typeof ceFam !== 'undefined' && ceFam.rafId) { cancelAnimationFrame(ceFam.rafId); ceFam.rafId = null; }
  if (typeof ceAco !== 'undefined' && ceAco.rafId) { cancelAnimationFrame(ceAco.rafId); ceAco.rafId = null; }
  if (typeof ceNube !== 'undefined' && ceNube.rafId) { cancelAnimationFrame(ceNube.rafId); ceNube.rafId = null; }
  if (typeof ceCol !== 'undefined' && ceCol.rafId) { cancelAnimationFrame(ceCol.rafId); ceCol.rafId = null; }
}

/* ceState.etapa = índice de etapa, ceState.modulo = índice de módulo */
function ceIrEtapa(etapaIdx) {
  ceCancelarRAFs();
  ceState = { etapa: etapaIdx, modulo: 0 };
  ceRenderEtapaTabs();
  ceRenderDots();
  ceLanzarModulo();
}

function ceIniciarEtapa(moduloIdx) {
  /* Cambia el módulo dentro de la etapa actual */
  ceCancelarRAFs();
  if (ceState.etapa === undefined) ceState.etapa = 0;
  ceState.modulo = moduloIdx;
  ceRenderDots();
  ceLanzarModulo();
}

function ceLanzarModulo() {
  const etapa = CE_ETAPAS[ceState.etapa];
  const mod   = etapa.modulos[ceState.modulo];
  const body  = document.getElementById('ce-body');
  const fn    = window[mod.fn];
  if (typeof fn === 'function') fn(body);
}

function ceRenderEtapaTabs() {
  const cont = document.getElementById('ce-etapa-tabs');
  if (!cont) return;
  if (ceState.etapa === undefined) ceState.etapa = 0;
  cont.innerHTML = CE_ETAPAS.map((e, i) => `
    <button class="ce-etapa-tab ${ceState.etapa === i ? 'active' : ''}"
            onclick="ceIrEtapa(${i})" title="${e.label}">
      Etapa ${i + 1}
    </button>
  `).join('');
}

function ceRenderDots() {
  const dots = document.getElementById('ce-nivel-dots');
  if (!dots) return;
  if (ceState.etapa === undefined) ceState.etapa = 0;
  const etapa = CE_ETAPAS[ceState.etapa];
  dots.innerHTML = etapa.modulos.map((m, i) => `
    <button class="ce-nivel-dot ${ceState.modulo === i ? 'active' : ''}"
            onclick="ceIniciarEtapa(${i})">
      ${m.label}
    </button>
  `).join('');
  const lbl = document.getElementById('ce-progreso-label');
  const m = etapa.modulos[ceState.modulo];
  if (lbl && m) lbl.textContent = `Etapa ${ceState.etapa + 1} · ${m.label}`;
}

/* ════════════════════════════════════════════════════════
   MÓDULO A — FUERZAS
   Libre: arrastrar esferas + y - y observar fuerzas
   Desafíos: predecir la dirección de una nueva carga
   ════════════════════════════════════════════════════════ */
const CE_NIVELES_FUERZAS = [
  {
    nivel: 1,
    titulo: 'Igual se repele, opuesto se atrae',
    desc: 'Introduce una nueva carga y observa cómo el campo la mueve.',
    cargas: [
      { x: 0.3, y: 0.5, q: +1, fija: true },
      { x: 0.7, y: 0.5, q: -1, fija: true },
    ],
    nuevaCarga:    { q: +1 },
    nuevaCargaPos: { x: 0.5, y: 0.5 },   /* centro entre las dos */
    pregunta: 'Colocamos una carga positiva (+) en el centro, entre una carga + a la izquierda y una − a la derecha. ¿Hacia cuál se moverá?',
    respuestas: [
      { label: 'Hacia la carga positiva (repulsión)', ok: false,
        exp: 'No. Dos cargas del mismo signo (+ y +) se repelen, así que la carga del centro se alejaría de la positiva, no iría hacia ella.' },
      { label: 'Hacia la carga negativa (atracción)', ok: true,
        exp: '¡Correcto! Cargas de signo opuesto (+ y −) se atraen. La carga positiva del centro es jalada hacia la negativa.' },
      { label: 'Se queda quieta en el centro', ok: false,
        exp: 'No se queda quieta: la carga negativa la atrae y la positiva la empuja en la misma dirección, así que acaba moviéndose hacia la negativa.' },
    ]
  },
  {
    nivel: 2,
    titulo: 'Dos cargas iguales al frente',
    desc: 'El campo de dos cargas del mismo signo crea una zona de "presión".',
    cargas: [
      { x: 0.25, y: 0.4, q: +1, fija: true },
      { x: 0.75, y: 0.4, q: +1, fija: true },
    ],
    nuevaCarga:    { q: -1 },
    nuevaCargaPos: { x: 0.5, y: 0.4 },   /* punto medio entre las dos */
    pregunta: 'Hay dos cargas positivas iguales, una a cada lado. Colocamos una carga negativa (−) justo en el punto medio entre ellas. ¿Qué hará?',
    respuestas: [
      { label: 'Se moverá hacia una de las dos cargas positivas', ok: false,
        exp: 'No tiene por qué irse hacia un lado: las dos cargas positivas son iguales y están a la misma distancia, así que la atraen con la misma fuerza en sentidos opuestos.' },
      { label: 'Saldrá disparada hacia afuera', ok: false,
        exp: 'Las cargas positivas ATRAEN a la negativa (signos opuestos). No la empujan hacia afuera; eso pasaría si la carga del centro fuera también positiva.' },
      { label: 'Se queda quieta: ambas la atraen con igual fuerza', ok: true,
        exp: '¡Correcto! Al estar en el punto medio, las dos atracciones son iguales y opuestas y se cancelan. Queda en equilibrio (aunque es inestable: cualquier empujoncito la desbalancea).' },
    ]
  },
  {
    nivel: 3,
    titulo: 'Triángulo de cargas',
    desc: 'Tres cargas crean un campo más complejo. El resultado neto define el movimiento.',
    cargas: [
      { x: 0.5,  y: 0.25, q: +1, fija: true },
      { x: 0.25, y: 0.75, q: +1, fija: true },
      { x: 0.75, y: 0.75, q: -1, fija: true },
    ],
    nuevaCarga:    { q: -1 },
    nuevaCargaPos: { x: 0.5, y: 0.58 },  /* centroide del triángulo */
    pregunta: 'Dos cargas + (arriba e izquierda-abajo) y una − (derecha-abajo) rodean el centro. Colocamos ahí una carga negativa (−). ¿Hacia dónde se moverá?',
    respuestas: [
      { label: 'Hacia la carga negativa (que la repele)', ok: false,
        exp: 'No. Las dos cargas negativas (la fija y la nueva) se repelen, así que la nueva se aleja de la − fija, no se acerca a ella.' },
      { label: 'No se mueve: el sistema está en equilibrio', ok: false,
        exp: 'No queda en equilibrio: hay dos cargas + atrayéndola y solo una − repeliéndola, así que la fuerza neta no se cancela.' },
      { label: 'Hacia la zona de las dos cargas positivas', ok: true,
        exp: '¡Correcto! Las dos cargas + atraen a la carga negativa, y la − fija la repele. Como son dos atracciones contra una repulsión, el resultado neto la lleva hacia las positivas.' },
    ]
  },
  {
    nivel: 4,
    titulo: 'Conservación de carga',
    desc: 'La carga total de un sistema aislado no cambia. Si aparece una carga +, debe aparecer una − en algún lugar.',
    cargas: [
      { x: 0.5, y: 0.4, q: 0, fija: true }, /* átomo neutro */
    ],
    nuevaCarga:    null,
    nuevaCargaPos: null,
    pregunta: 'Un átomo neutro (igual número de protones + y electrones −) pierde UN electrón. ¿Con qué carga total queda el átomo?',
    respuestas: [
      { label: 'Se queda neutro: no cambia su carga', ok: false,
        exp: 'No. Al irse un electrón, se pierde una carga negativa y las positivas del núcleo ya no están compensadas, así que el átomo deja de ser neutro.' },
      { label: 'Queda con carga negativa (un ion −)', ok: false,
        exp: 'Al revés: perdió una carga negativa, así que le "sobra" positivo. Quedaría negativo solo si GANARA un electrón.' },
      { label: 'Queda con carga positiva (un ion +)', ok: true,
        exp: '¡Correcto! Al perder un electrón (−), queda un protón (+) sin pareja, así que el átomo se vuelve un ion positivo. La carga no desaparece: el electrón simplemente se fue a otro lado.' },
    ]
  },
  {
    nivel: 5,
    titulo: 'El átomo neutro',
    desc: 'La materia ordinaria es neutra: los protones (+) del núcleo igualan a los electrones (−) de la corteza.',
    cargas: [
      { x: 0.5,  y: 0.5,  q: +3, fija: true, label: 'núcleo\n+3' },
      { x: 0.25, y: 0.3,  q: -1, fija: true, label: 'e⁻' },
      { x: 0.55, y: 0.2,  q: -1, fija: true, label: 'e⁻' },
      { x: 0.75, y: 0.4,  q: -1, fija: true, label: 'e⁻' },
    ],
    nuevaCarga:    null,
    nuevaCargaPos: null,
    pregunta: 'Este átomo tiene un núcleo con 3 protones (+3) y 3 electrones (−1 cada uno) alrededor. Sumando todas las cargas, ¿cuál es la carga total?',
    respuestas: [
      { label: 'Carga total = +3 (ganan los protones)', ok: false,
        exp: 'No. Los 3 electrones aportan −3 que cancelan los +3 del núcleo. Solo quedaría +3 si no hubiera electrones.' },
      { label: 'Carga total = 0 (átomo neutro)', ok: true,
        exp: '¡Correcto! (+3) + (−3) = 0. Como hay el mismo número de protones y electrones, las cargas se compensan exactamente. Por eso la materia ordinaria es neutra.' },
      { label: 'Carga total = −3 (ganan los electrones)', ok: false,
        exp: 'No. Hay 3 cargas + y 3 cargas −: se cancelan y dan 0. Quedaría −3 solo si no hubiera protones.' },
    ]
  },
];

/* ─── Estado del módulo ─── */
let ceFuerzas = {
  cargas:        [],
  dragging:      null,
  nivelIdx:      0,
  modoLibre:     true,
  respondido:    false,
  puntaje:       0,
  errores:       0,
  canvas:        null,
  ctx:           null,
  rafId:         null,
};

function ceModuloFuerzas(body) {
  document.getElementById('ce-instruccion').textContent =
    'Etapa 1 · Módulo A — Fuerzas: Arrastra las cargas y observa cómo se atraen y repelen. Luego responde los desafíos.';

  const nv = CE_NIVELES_FUERZAS[ceFuerzas.nivelIdx];

  body.innerHTML = `
    <div class="ce-fuerzas-wrap">

      <!-- Panel izquierdo: instrucciones + desafío -->
      <div class="ce-fuerzas-panel">

        <div class="ce-panel-card">
          <div class="ce-panel-title">Instrucciones</div>
          <ol class="ce-inst-lista">
            <li>Arrastra las esferas para ver las fuerzas en acción.</li>
            <li>🔵 Carga <strong>positiva (+)</strong> — 🔴 Carga <strong>negativa (−)</strong></li>
            <li>Igual signo → <strong style="color:#ff5252">se repelen</strong></li>
            <li>Signo opuesto → <strong style="color:#00e676">se atraen</strong></li>
            <li>Lee la pregunta y elige la respuesta correcta.</li>
          </ol>
          <div class="ce-formula-box">
            F = k · |q₁·q₂| / r²<br>
            <small>Ley de Coulomb: la fuerza crece con las cargas<br>y decrece con el cuadrado de la distancia.</small>
          </div>
        </div>

        <div class="ce-panel-card ce-desafio-card" id="ce-desafio-card">
          <div class="ce-panel-title">Desafío ${nv.nivel}/5 — ${nv.titulo}</div>
          <p class="ce-desafio-desc">${nv.desc}</p>
          <p class="ce-desafio-pregunta" id="ce-pregunta">${nv.pregunta}</p>
          <div class="ce-respuestas" id="ce-respuestas"></div>
          <div class="ce-exp hidden" id="ce-exp"></div>
          <div class="ce-fuerzas-prog">
            ${CE_NIVELES_FUERZAS.map((_,i) => `
              <button class="ms-e1-dot ${i < ceFuerzas.nivelIdx ? 'done' : i === ceFuerzas.nivelIdx ? 'current' : ''}"
                   title="Desafío ${i+1}"
                   ${i < ceFuerzas.nivelIdx ? `onclick="ceFuerzasIrNivel(${i})"` : 'disabled'}
              ></button>
            `).join('')}
            <span class="ms-e1-niveles-label">${nv.nivel}/5</span>
          </div>
        </div>

        <div class="ms-btn-row" style="margin-top:8px">
          <button class="calc-toggle-btn" onclick="Calculadora.toggle()">🧮 Calc</button>
        </div>
      </div>

      <!-- Canvas de simulación -->
      <div class="ce-canvas-wrap">
        <canvas id="ce-canvas" class="ce-canvas"></canvas>
        <div class="ce-canvas-legend">
          <span class="ce-leg-pos">● Positiva (+)</span>
          <span class="ce-leg-neg">● Negativa (−)</span>
          <span class="ce-leg-neu">● Neutra (0)</span>
        </div>
      </div>

    </div>
  `;

  /* Renderizar opciones del desafío */
  ceFuerzasRenderRespuestas();

  /* Inicializar canvas */
  const canvas = document.getElementById('ce-canvas');
  ceFuerzas.canvas = canvas;
  ceFuerzas.ctx    = canvas.getContext('2d');
  ceFuerzasAjustarCanvas();
  window.addEventListener('resize', ceFuerzasAjustarCanvas);

  canvas.addEventListener('mousedown',  ceFuerzasMD);
  canvas.addEventListener('mousemove',  ceFuerzasMM);
  canvas.addEventListener('mouseup',    ceFuerzasMU);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); ceFuerzasMD(e.touches[0]); }, { passive: false });
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); ceFuerzasMM(e.touches[0]); }, { passive: false });
  canvas.addEventListener('touchend',   ceFuerzasMU);

  /* Cargar configuración del nivel */
  ceFuerzasCargarNivel(nv);
}

function ceFuerzasRenderRespuestas() {
  const nv   = CE_NIVELES_FUERZAS[ceFuerzas.nivelIdx];
  const cont = document.getElementById('ce-respuestas');
  if (!cont) return;
  cont.innerHTML = '';
  nv.respuestas.forEach((r, i) => {
    const btn = document.createElement('button');
    btn.className = 'ce-resp-btn';
    btn.textContent = r.label;
    btn.addEventListener('click', () => ceFuerzasResponder(i));
    cont.appendChild(btn);
  });
}

function ceFuerzasCargarNivel(nv) {
  const W = ceFuerzas.canvas.width;
  const H = ceFuerzas.canvas.height;
  ceFuerzas.cargas = nv.cargas.map(c => ({
    x:    c.x * W,
    y:    c.y * H,
    q:    c.q,
    label: c.label || (c.q > 0 ? '+' : c.q < 0 ? '−' : '0'),
    vx: 0, vy: 0,
    r:  c.q !== 0 ? 22 : 28,
    fija: !!c.fija,  /* cargas de escena no se mueven */
    alpha: 1,        /* opacidad (para la animación de aparición) */
  }));
  ceFuerzas.respondido = false;
  ceFuerzas.activo = false;   /* la escena arranca quieta y legible */
  if (ceFuerzas.rafId) cancelAnimationFrame(ceFuerzas.rafId);
  ceFuerzasLoop();
}

function ceFuerzasAjustarCanvas() {
  const canvas = ceFuerzas.canvas;
  if (!canvas) return;
  canvas.width  = canvas.offsetWidth  || 500;
  canvas.height = canvas.offsetHeight || 380;
  const nv = CE_NIVELES_FUERZAS[ceFuerzas.nivelIdx];
  if (nv) ceFuerzasCargarNivel(nv);
}

/* ── Física simplificada: fuerzas de Coulomb entre cargas ── */
function ceFuerzasActualizar() {
  const cargas = ceFuerzas.cargas;
  const W = ceFuerzas.canvas.width, H = ceFuerzas.canvas.height;
  const K = 9000;  /* constante de Coulomb escalada — más alta = más rápida */

  /* La escena permanece quieta y legible hasta que el usuario interactúa.
     Mientras se ARRASTRA una carga, todo el sistema cobra vida (las demás se
     atraen/repelen). Si no se está arrastrando, solo se mueven las cargas no
     fijas (p. ej. la carga de prueba que aparece al responder). */
  if (!ceFuerzas.activo) return;
  const arrastrando = !!ceFuerzas.dragging;

  cargas.forEach((a, i) => {
    if (a.drag || a.q === 0) return;      /* la que se arrastra o una neutra */
    if (a.fija && !arrastrando) return;   /* fija solo se libera durante el arrastre */
    let fx = 0, fy = 0;
    cargas.forEach((b, j) => {
      if (i === j || b.q === 0) return;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      let d2 = dx*dx + dy*dy;
      const d  = Math.sqrt(d2) || 1;
      /* Suelo de distancia: evita fuerzas infinitas y que se solapen */
      const dMin = a.r + b.r;
      if (d2 < dMin*dMin) d2 = dMin*dMin;
      const F = K * a.q * b.q / d2;
      fx += F * dx / d;
      fy += F * dy / d;
    });
    /* dt más grande + menos amortiguamiento = movimiento más vivo */
    a.vx = (a.vx + fx * 0.025) * 0.88;
    a.vy = (a.vy + fy * 0.025) * 0.88;
    a.x += a.vx;
    a.y += a.vy;
    /* Rebote en bordes */
    if (a.x - a.r < 0)  { a.x = a.r;   a.vx = Math.abs(a.vx) * 0.6; }
    if (a.x + a.r > W)  { a.x = W-a.r; a.vx = -Math.abs(a.vx) * 0.6; }
    if (a.y - a.r < 0)  { a.y = a.r;   a.vy = Math.abs(a.vy) * 0.6; }
    if (a.y + a.r > H)  { a.y = H-a.r; a.vy = -Math.abs(a.vy) * 0.6; }
  });
}

/* ── Dibujo ── */
function ceFuerzasDibujar() {
  const ctx = ceFuerzas.ctx;
  const W = ceFuerzas.canvas.width, H = ceFuerzas.canvas.height;
  ctx.clearRect(0, 0, W, H);

  /* Fondo */
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a0520'); bg.addColorStop(1, '#04020f');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  /* Grid sutil */
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  /* Líneas de fuerza entre pares */
  const cargas = ceFuerzas.cargas;
  for (let i = 0; i < cargas.length; i++) {
    for (let j = i+1; j < cargas.length; j++) {
      const a = cargas[i], b = cargas[j];
      const atrae = a.q * b.q < 0;
      const grd = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      const colA = a.q > 0 ? '#4fc3f7' : a.q < 0 ? '#ff5252' : '#888';
      const colB = b.q > 0 ? '#4fc3f7' : b.q < 0 ? '#ff5252' : '#888';
      grd.addColorStop(0, colA + '55');
      grd.addColorStop(1, colB + '55');
      ctx.beginPath();
      ctx.setLineDash(atrae ? [] : [6,5]);
      ctx.strokeStyle = grd;
      ctx.lineWidth   = atrae ? 1.5 : 1;
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  /* Esferas */
  cargas.forEach(c => {
    const col  = c.q > 0 ? '#4fc3f7' : c.q < 0 ? '#ef5350' : '#78909c';
    const glow = c.q > 0 ? '#00b0ff' : c.q < 0 ? '#ff1744' : '#546e7a';
    const alpha = c.alpha !== undefined ? c.alpha : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = glow; ctx.shadowBlur = c.drag ? 28 : (c.esNueva ? 22 : 16);
    /* Anillo pulsante para la nueva carga */
    if (c.esNueva) {
      const pulso = 0.5 + 0.5 * Math.sin(Date.now() * 0.006);
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 8 + pulso * 5, 0, Math.PI*2);
      ctx.strokeStyle = col + '66'; ctx.lineWidth = 2; ctx.stroke();
    }
    const g = ctx.createRadialGradient(c.x - c.r*.3, c.y - c.r*.3, 0, c.x, c.y, c.r);
    g.addColorStop(0, col + 'ee'); g.addColorStop(1, col + '66');
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();

    /* Etiqueta */
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff'; ctx.font = `bold ${c.r * 0.9}px Orbitron,monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = c.label.split('\n');
    if (lines.length === 1) {
      ctx.fillText(c.label, c.x, c.y);
    } else {
      lines.forEach((ln, li) => {
        ctx.fillText(ln, c.x, c.y + (li - (lines.length-1)/2) * c.r * 0.75);
      });
    }
    ctx.restore();
  });
}

function ceFuerzasLoop() {
  ceFuerzasActualizar();
  ceFuerzasDibujar();
  ceFuerzas.rafId = requestAnimationFrame(ceFuerzasLoop);
}

/* ── Drag ── */
function ceFuerzasMD(e) {
  const { x, y } = cePosCanvas(e, ceFuerzas.canvas);
  const hit = ceFuerzas.cargas.find(c => {
    const d = Math.hypot(c.x - x, c.y - y);
    return d < c.r + 6;
  });
  if (hit) { hit.drag = true; hit.vx = 0; hit.vy = 0; ceFuerzas.dragging = hit; ceFuerzas.activo = true; }
}

function ceFuerzasMM(e) {
  if (!ceFuerzas.dragging) return;
  const { x, y } = cePosCanvas(e, ceFuerzas.canvas);
  ceFuerzas.dragging.x = x;
  ceFuerzas.dragging.y = y;
}

function ceFuerzasMU() {
  if (ceFuerzas.dragging) { ceFuerzas.dragging.drag = false; ceFuerzas.dragging = null; }
}

/* ── Respuesta ── */
function ceFuerzasResponder(idx) {
  if (ceFuerzas.respondido) return;
  ceFuerzas.respondido = true;
  const nv   = CE_NIVELES_FUERZAS[ceFuerzas.nivelIdx];
  const resp = nv.respuestas[idx];
  const ok   = resp.ok;

  if (!ok) ceFuerzas.errores++;
  else      ceFuerzas.puntaje += 100;

  /* ── Insertar la nueva carga en el canvas con animación de aparición ── */
  if (nv.nuevaCarga && nv.nuevaCargaPos) {
    const W = ceFuerzas.canvas.width;
    const H = ceFuerzas.canvas.height;
    const nc = {
      x:      nv.nuevaCargaPos.x * W,
      y:      nv.nuevaCargaPos.y * H,
      q:      nv.nuevaCarga.q,
      label:  nv.nuevaCarga.q > 0 ? '+' : nv.nuevaCarga.q < 0 ? '−' : '0',
      vx: 0,  vy: 0,
      r:  22,
      fija:   false,   /* sí se mueve */
      esNueva: true,   /* anillo pulsante */
      alpha:   0,      /* empieza transparente → fade-in */
    };
    ceFuerzas.cargas.push(nc);
    ceFuerzas.activo = true;   /* al aparecer la carga de prueba, el campo cobra vida */

    /* Fade-in durante 600 ms */
    const startTime = performance.now();
    const fadeIn = (now) => {
      const t = Math.min((now - startTime) / 600, 1);
      nc.alpha = t;
      if (t < 1) requestAnimationFrame(fadeIn);
    };
    requestAnimationFrame(fadeIn);
  }

  /* Colorear botones */
  const btns = document.querySelectorAll('.ce-resp-btn');
  btns.forEach((b, i) => {
    b.classList.add(nv.respuestas[i].ok ? 'correcto' : 'incorrecto');
    b.disabled = true;
  });

  /* Mostrar explicación */
  const expEl = document.getElementById('ce-exp');
  if (expEl) {
    expEl.textContent = resp.exp;
    expEl.className = `ce-exp ${ok ? 'ok' : 'err'}`;
  }

  /* Botón siguiente */
  const esUltimo = ceFuerzas.nivelIdx >= CE_NIVELES_FUERZAS.length - 1;
  const btnSig = document.createElement('button');
  btnSig.className = 'ce-btn ce-btn-next';
  btnSig.textContent = esUltimo ? 'Siguiente módulo →' : `Desafío ${nv.nivel + 1} →`;
  btnSig.addEventListener('click', () => {
    if (esUltimo) {
      ceIniciarEtapa(1);
    } else {
      ceFuerzas.nivelIdx++;
      ceFuerzas.respondido = false;
      ceModuloFuerzas(document.getElementById('ce-body'));
    }
  });
  expEl && expEl.classList.remove('hidden');
  const card = document.getElementById('ce-desafio-card');
  if (card) card.appendChild(btnSig);
}

/* ════════════════════════════════════════════════════════
   MÓDULO B — EL CABLE MÁGICO
   4 desafíos sobre corriente → campo magnético
   ════════════════════════════════════════════════════════ */
const CE_NIVELES_CABLE = [
  {
    nivel: 1,
    titulo: 'Corriente y campo magnético',
    instruccion: 'Mueve el slider hasta que la corriente salga del plano (⊙) y observa el campo.',
    pregunta: 'Con el slider la corriente sale del plano hacia ti (símbolo ⊙). Mira cómo giran las flechas azules alrededor del cable. ¿En qué sentido giran?',
    iInicial: 70,   /* posición inicial del slider para esta pregunta */
    respuestas: [
      { label: 'En sentido horario (↻, como las manecillas del reloj)', ok: false,
        exp: 'No. El sentido horario corresponde a cuando la corriente ENTRA al plano (⊗). Al salir hacia ti (⊙), el campo gira al contrario.' },
      { label: 'No se forma ningún campo magnético', ok: false,
        exp: 'Sí hay campo: Ørsted descubrió en 1820 que toda corriente crea un campo magnético a su alrededor. Lo ves girando en la animación.' },
      { label: 'En sentido antihorario (↺, al revés del reloj)', ok: true,
        exp: '¡Correcto! Regla de la mano derecha: si el pulgar apunta hacia ti (corriente ⊙), los dedos se enrollan en sentido antihorario, igual que las flechas del campo.' },
    ]
  },
  {
    nivel: 2,
    titulo: 'Invertir la corriente',
    instruccion: 'Ahora mueve el slider a la izquierda para que la corriente entre al plano (⊗).',
    pregunta: 'Ahora la corriente entra al plano (⊗), al revés que antes. Comparado con el caso anterior, ¿qué le pasó al giro del campo magnético?',
    iInicial: -70,
    respuestas: [
      { label: 'El campo sigue girando igual que antes', ok: false,
        exp: 'No. El sentido del campo depende del sentido de la corriente. Si inviertes la corriente, el campo también invierte su giro.' },
      { label: 'Se invirtió: ahora gira en sentido horario (↻)', ok: true,
        exp: '¡Correcto! El campo magnético siempre "sigue" a la corriente. Al invertir la corriente, el giro del campo también se invierte.' },
      { label: 'El campo desaparece mientras cambia de sentido', ok: false,
        exp: 'No hay pausa: el campo cambia de dirección al mismo tiempo que la corriente, sin desaparecer en el camino.' },
    ]
  },
  {
    nivel: 3,
    titulo: 'Intensidad de la corriente',
    instruccion: 'Sube la corriente al máximo y luego bájala a cero. Observa cómo cambian los anillos.',
    pregunta: 'La Ley de Ampère dice B = μ₀·I / (2πr): el campo B es proporcional a la corriente I. Si DUPLICAS la corriente, ¿qué le pasa a la intensidad del campo?',
    iInicial: 100,
    respuestas: [
      { label: 'No cambia: solo se mueven más rápido los electrones', ok: false,
        exp: 'La corriente I ya mide cuánta carga pasa por segundo. Más corriente significa directamente más campo, no solo electrones más rápidos.' },
      { label: 'Se hace 4 veces más intenso (el doble al cuadrado)', ok: false,
        exp: 'Esa relación al cuadrado es de la Ley de Coulomb (cargas estáticas). Aquí la relación es lineal: B ∝ I, no I².' },
      { label: 'Se hace exactamente el doble de intenso', ok: true,
        exp: '¡Correcto! En B = μ₀·I/(2πr), B es directamente proporcional a I. Doble corriente → doble campo. Es una relación lineal.' },
    ]
  },
  {
    nivel: 4,
    titulo: 'Corriente en movimiento = magnetismo',
    instruccion: 'Pon la corriente en cero. Observa que el campo desaparece.',
    pregunta: 'Una carga quieta (en reposo) solo crea un campo eléctrico. ¿Qué campos crea esa misma carga cuando se mueve a velocidad constante?',
    iInicial: 0,
    respuestas: [
      { label: 'Solo campo eléctrico, igual que cuando está quieta', ok: false,
        exp: 'No. Si fuera así, la brújula de Ørsted nunca se habría movido. Una carga en movimiento añade un campo magnético.' },
      { label: 'Campo eléctrico Y campo magnético, a la vez', ok: true,
        exp: '¡Correcto! Una carga quieta solo tiene campo eléctrico. Al moverse, mantiene el eléctrico (por su carga) y suma uno magnético (por su movimiento). ¡El movimiento es la clave!' },
      { label: 'Solo campo magnético (pierde el eléctrico)', ok: false,
        exp: 'No pierde el eléctrico. Sigue teniendo carga, así que conserva su campo eléctrico y, además, gana el magnético.' },
    ]
  },
];

let ceCable = {
  corriente:   0.5,
  canvas:      null,
  ctx:         null,
  rafId:       null,
  t:           0,
  nivelIdx:    0,
  respondido:  false,
  puntaje:     0,
  errores:     0,
};

function ceModuloCable(body) {
  const nv = CE_NIVELES_CABLE[ceCable.nivelIdx];

  document.getElementById('ce-instruccion').textContent =
    `Etapa 1 · Módulo B — Cable Mágico: ${nv.instruccion}`;

  body.innerHTML = `
    <div class="ce-cable-wrap">

      <!-- Panel izquierdo: desafío -->
      <div class="ce-fuerzas-panel">

        <div class="ce-panel-card ce-desafio-card" id="ce-cable-desafio">
          <div class="ce-panel-title">Desafío ${nv.nivel}/4 — ${nv.titulo}</div>
          <p class="ce-desafio-desc" style="font-size:10px;color:var(--text2);line-height:1.5;margin:4px 0 8px">
            ${nv.instruccion}
          </p>
          <p class="ce-desafio-pregunta">${nv.pregunta}</p>
          <div class="ce-respuestas" id="ce-cable-respuestas"></div>
          <div class="ce-exp hidden" id="ce-cable-exp"></div>
          <div class="ce-fuerzas-prog" style="margin-top:8px">
            ${CE_NIVELES_CABLE.map((_,i) => `
              <button class="ms-e1-dot ${i < ceCable.nivelIdx ? 'done' : i === ceCable.nivelIdx ? 'current' : ''}"
                   title="Desafío ${i+1}"
                   ${i < ceCable.nivelIdx ? `onclick="ceCableIrNivel(${i})"` : 'disabled'}
              ></button>
            `).join('')}
            <span class="ms-e1-niveles-label">${nv.nivel}/4</span>
          </div>
        </div>

        <div class="ce-panel-card" style="margin-top:8px">
          <div class="ce-panel-title">Ley de Ampère</div>
          <div class="ce-formula-box" style="margin-top:4px">
            B = μ₀I / (2πr)<br>
            <small>B proporcional a I,<br>inversamente proporcional a r</small>
          </div>
          <p style="font-size:9px;color:var(--text2);margin-top:6px;line-height:1.5">
            <strong>Ørsted (1820):</strong> corriente → campo B.<br>
            <strong>Regla de la mano derecha:</strong><br>
            pulgar → I, dedos → sentido de B.
          </p>
        </div>

        <div class="ms-btn-row" style="margin-top:8px">
          <button class="calc-toggle-btn" onclick="Calculadora.toggle()">🧮 Calc</button>
        </div>
      </div>

      <!-- Canvas + slider -->
      <div class="ce-canvas-wrap">
        <canvas id="ce-cable-canvas" class="ce-canvas"></canvas>
        <div class="ce-cable-controles">
          <label class="ce-ctrl-label">
            Corriente: <strong id="ce-I-val">${nv.iInicial > 0 ? '+' : ''}${nv.iInicial}%</strong>
          </label>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;color:var(--text2)">⊗ −</span>
            <input type="range" id="ce-I-slider" class="ms-slider"
                   min="-100" max="100" value="${nv.iInicial}"
                   oninput="ceCableSetI(this.value)">
            <span style="font-size:11px;color:var(--text2)">+ ⊙</span>
          </div>
          <div class="ce-cable-status" id="ce-cable-status"></div>
        </div>
      </div>

    </div>
  `;

  /* Renderizar opciones */
  ceCableRenderRespuestas();

  /* Inicializar canvas */
  const canvas = document.getElementById('ce-cable-canvas');
  ceCable.canvas    = canvas;
  ceCable.ctx       = canvas.getContext('2d');
  ceCable.corriente = nv.iInicial / 100;
  ceCable.respondido = false;

  function ajustar() {
    canvas.width  = canvas.offsetWidth  || 500;
    canvas.height = canvas.offsetHeight || 340;
  }
  ajustar();
  window.addEventListener('resize', ajustar);

  /* Actualizar el status inicial */
  ceCableSetI(nv.iInicial);

  if (ceCable.rafId) cancelAnimationFrame(ceCable.rafId);
  function loop() {
    ceCable.t += 0.02;
    ceCableRender();
    ceCable.rafId = requestAnimationFrame(loop);
  }
  loop();
}

function ceCableRenderRespuestas() {
  const nv   = CE_NIVELES_CABLE[ceCable.nivelIdx];
  const cont = document.getElementById('ce-cable-respuestas');
  if (!cont) return;
  cont.innerHTML = '';
  nv.respuestas.forEach((r, i) => {
    const btn = document.createElement('button');
    btn.className   = 'ce-resp-btn';
    btn.textContent = r.label;
    btn.addEventListener('click', () => ceCableResponder(i));
    cont.appendChild(btn);
  });
}

function ceCableResponder(idx) {
  if (ceCable.respondido) return;
  ceCable.respondido = true;
  const nv   = CE_NIVELES_CABLE[ceCable.nivelIdx];
  const resp = nv.respuestas[idx];
  const ok   = resp.ok;

  if (!ok) ceCable.errores++;
  else      ceCable.puntaje += 100;

  /* Colorear botones */
  document.querySelectorAll('#ce-cable-respuestas .ce-resp-btn').forEach((b, i) => {
    b.classList.add(nv.respuestas[i].ok ? 'correcto' : 'incorrecto');
    b.disabled = true;
  });

  /* Explicación */
  const expEl = document.getElementById('ce-cable-exp');
  if (expEl) {
    expEl.textContent = resp.exp;
    expEl.className   = `ce-exp ${ok ? 'ok' : 'err'}`;
  }

  /* Botón siguiente */
  const esUltimo = ceCable.nivelIdx >= CE_NIVELES_CABLE.length - 1;
  const btnSig   = document.createElement('button');
  btnSig.className   = 'ce-btn ce-btn-next';
  btnSig.textContent = esUltimo ? 'Siguiente módulo →' : `Desafío ${nv.nivel + 1} →`;
  btnSig.style.marginTop = '8px';
  btnSig.addEventListener('click', () => {
    if (esUltimo) {
      ceCable.nivelIdx = 0;   /* reset para si el usuario vuelve */
      ceIniciarEtapa(2);
    } else {
      ceCable.nivelIdx++;
      ceCable.respondido = false;
      ceModuloCable(document.getElementById('ce-body'));
    }
  });
  expEl && expEl.classList.remove('hidden');
  const card = document.getElementById('ce-cable-desafio');
  if (card) card.appendChild(btnSig);
}

function ceCableSetI(val) {
  ceCable.corriente = parseFloat(val) / 100;
  const pct  = Math.round(Math.abs(parseFloat(val)));
  const sign = parseFloat(val) >= 0 ? '+' : '−';
  const valEl = document.getElementById('ce-I-val');
  if (valEl) valEl.textContent = `${sign}${pct}%`;
  const status = document.getElementById('ce-cable-status');
  if (!status) return;
  const I = ceCable.corriente;
  if (Math.abs(I) < 0.05) {
    status.textContent = 'Sin corriente — sin campo magnético.';
    status.style.color = 'var(--text2)';
  } else if (I > 0) {
    status.textContent = 'Corriente ⊙ saliendo — campo B: sentido antihorario ↺';
    status.style.color = '#4fc3f7';
  } else {
    status.textContent = 'Corriente ⊗ entrando — campo B: sentido horario ↻';
    status.style.color = '#ce93d8';
  }
}

function ceCableRender() {
  const canvas = ceCable.canvas;
  if (!canvas) return;
  const ctx = ceCable.ctx;
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const I  = ceCable.corriente;
  const t  = ceCable.t;

  ctx.clearRect(0, 0, W, H);

  /* Fondo */
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#0a0520'); bg.addColorStop(1,'#04020f');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  const maxR   = Math.min(W, H) * 0.44;
  const nAnillos = 5;
  const dir    = I >= 0 ? 1 : -1;    /* 1 = antihorario, −1 = horario */
  const alpha  = Math.abs(I);

  /* Anillos de campo magnético */
  for (let ri = 1; ri <= nAnillos; ri++) {
    const r    = (maxR / nAnillos) * ri;
    const fade = (1 - ri / (nAnillos + 1)) * alpha;
    if (fade < 0.02) continue;

    ctx.save();
    ctx.strokeStyle = `rgba(100,200,255,${fade * 0.7})`;
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* Flechas animadas sobre el anillo */
    const nArrows = 6;
    for (let ai = 0; ai < nArrows; ai++) {
      const ang = (ai / nArrows) * Math.PI * 2 + dir * t * (1.2 / ri);
      const ax  = cx + Math.cos(ang) * r;
      const ay  = cy + Math.sin(ang) * r;
      /* Tangente al anillo */
      const tx  = -Math.sin(ang) * dir;
      const ty  =  Math.cos(ang) * dir;
      const len = 9;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.strokeStyle = '#4fc3f7'; ctx.fillStyle = '#4fc3f7'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ax - tx*len*0.5, ay - ty*len*0.5);
      ctx.lineTo(ax + tx*len*0.5, ay + ty*len*0.5);
      ctx.stroke();
      /* Punta de flecha */
      const hx = ax + tx*len*0.5, hy = ay + ty*len*0.5;
      const nx = -ty, ny = tx;  /* normal */
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx - tx*5 + nx*3, hy - ty*5 + ny*3);
      ctx.lineTo(hx - tx*5 - nx*3, hy - ty*5 - ny*3);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  /* Cable central */
  ctx.save();
  ctx.shadowColor = alpha > 0.05 ? '#ffd740' : '#555';
  ctx.shadowBlur  = 20 * alpha;
  ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  const cg = ctx.createRadialGradient(cx-6, cy-6, 0, cx, cy, 18);
  cg.addColorStop(0, alpha > 0.05 ? '#ffd740' : '#555');
  cg.addColorStop(1, alpha > 0.05 ? '#ff6d00' : '#333');
  ctx.fillStyle = cg; ctx.fill();
  ctx.restore();

  /* Símbolo de dirección de corriente */
  ctx.save();
  ctx.fillStyle = '#000'; ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (Math.abs(I) < 0.05) {
    ctx.fillStyle = '#888';
    ctx.font = '11px Orbitron';
    ctx.fillText('I=0', cx, cy);
  } else {
    ctx.fillText(dir > 0 ? '⊙' : '⊗', cx, cy);
  }
  ctx.restore();

  /* Label B */
  if (alpha > 0.05) {
    ctx.save();
    ctx.fillStyle = `rgba(79,195,247,${alpha * 0.8})`;
    ctx.font = '11px Orbitron,monospace';
    ctx.textAlign = 'left';
    ctx.fillText('B', cx + maxR * 0.3 + 6, cy - maxR * 0.3);
    ctx.restore();
  }
}

/* ════════════════════════════════════════════════════════
   MÓDULO C — GENERADOR DE ONDAS
   4 desafíos sobre el espectro EM y la relación c = λ·f
   ════════════════════════════════════════════════════════ */
const CE_ESPECTRO = [
  { nombre: 'Radio',        fMin: 0,   fMax: 5,   color: '#ff3300' },
  { nombre: 'Microondas',   fMin: 5,   fMax: 20,  color: '#ff8800' },
  { nombre: 'Infrarrojo',   fMin: 20,  fMax: 40,  color: '#ffcc00' },
  { nombre: 'Luz visible',  fMin: 40,  fMax: 65,  color: '#66ff66' },
  { nombre: 'Ultravioleta', fMin: 65,  fMax: 80,  color: '#8833ff' },
  { nombre: 'Rayos X',      fMin: 80,  fMax: 95,  color: '#aaddff' },
  { nombre: 'Rayos Gamma',  fMin: 95,  fMax: 100, color: '#ffffff' },
];

const CE_NIVELES_ONDAS = [
  {
    nivel: 1,
    titulo: 'La carga que oscila emite una onda',
    instruccion: 'Mueve el slider a una frecuencia baja (~15%). Observa la carga roja oscilando y la onda que genera.',
    freqInicial: 15,
    pregunta: 'Observa la carga roja: al oscilar (subir y bajar) se está acelerando constantemente. ¿Qué produce esa carga acelerada?',
    respuestas: [
      { label: 'Solo una vibración local que se queda en su sitio', ok: false,
        exp: 'No. La perturbación no se queda quieta: viaja hacia afuera a la velocidad de la luz. Lo ves en la onda que avanza por el canvas.' },
      { label: 'Solo calor, por rozar con el "éter" del espacio', ok: false,
        exp: 'El éter fue una idea que se descartó: no existe. Las ondas electromagnéticas no necesitan ningún medio, viajan por el vacío.' },
      { label: 'Una onda electromagnética que se propaga por el espacio', ok: true,
        exp: '¡Correcto! Una carga acelerada emite radiación electromagnética: campos E y B que se propagan por el vacío. Fue la gran predicción de Maxwell (1865).' },
    ]
  },
  {
    nivel: 2,
    titulo: 'Frecuencia y longitud de onda',
    instruccion: 'Sube el slider al máximo (~100%) y luego bájalo a ~10%. Observa cómo cambia λ.',
    freqInicial: 80,
    pregunta: 'La longitud de onda λ es la distancia entre dos crestas. Según c = λ·f (con c fija), si subes la frecuencia f, ¿qué pasa con λ? (compruébalo moviendo el slider)',
    respuestas: [
      { label: 'λ aumenta: las crestas se separan más', ok: false,
        exp: 'Al contrario. En c = λ·f, con c constante, si f sube λ tiene que bajar. Más frecuencia = ondas más apretadas.' },
      { label: 'λ disminuye: las crestas se juntan más', ok: true,
        exp: '¡Correcto! c = λ·f y c es constante, así que si f sube, λ baja. Lo ves en el canvas: a más frecuencia, las ondas se aprietan.' },
      { label: 'λ no cambia, solo cambia la altura de la onda', ok: false,
        exp: 'La altura (amplitud) y la longitud de onda son cosas distintas. La frecuencia afecta directamente a λ, no a la amplitud.' },
    ]
  },
  {
    nivel: 3,
    titulo: 'El espectro electromagnético',
    instruccion: 'Recorre el slider de izquierda a derecha y observa cómo cambia el tramo del espectro resaltado.',
    freqInicial: 50,
    pregunta: 'Las ondas de radio, la luz visible y los rayos X son todas radiación electromagnética. ¿Qué es lo único que realmente las distingue entre sí?',
    respuestas: [
      { label: 'Su frecuencia (y con ella, su longitud de onda y energía)', ok: true,
        exp: '¡Correcto! Todas son ondas EM que viajan a la misma velocidad c. Lo que cambia es la frecuencia: radio (f baja, poca energía) → visible → rayos X (f alta, mucha energía).' },
      { label: 'La velocidad a la que viajan por el vacío', ok: false,
        exp: 'No: todas viajan exactamente a c = 3×10⁸ m/s en el vacío. La velocidad es idéntica; lo que cambia es la frecuencia.' },
      { label: 'El tipo de partícula o aparato que las produce', ok: false,
        exp: 'Todas nacen de cargas aceleradas. La misma carga puede emitir radio (si oscila lento) o rayos X (si oscila muy rápido). La diferencia está en la frecuencia.' },
    ]
  },
  {
    nivel: 4,
    titulo: 'La síntesis de Maxwell',
    instruccion: 'Ajusta el slider a la zona de luz visible (~50–65%). Observa los campos E (color) y B (azul punteado) perpendiculares.',
    freqInicial: 55,
    pregunta: 'Maxwell calculó a qué velocidad viajaba su onda electromagnética y le dio ~300.000 km/s. ¿Por qué ese número fue tan revelador?',
    respuestas: [
      { label: 'Porque era un error imposible de alcanzar', ok: false,
        exp: 'No era error. Ese valor (la constante c) ya se había medido antes con la luz. Que coincidiera fue justo lo revelador.' },
      { label: 'Porque coincidía exactamente con la velocidad de la luz', ok: true,
        exp: '¡Correcto! Coincidía con la velocidad medida de la luz. Maxwell concluyó: "esto debe ser luz", unificando óptica y electromagnetismo. Hertz lo confirmó en 1887.' },
      { label: 'Porque era la velocidad del sonido en el aire', ok: false,
        exp: 'El sonido viaja a ~340 m/s, casi un millón de veces más lento. El número de Maxwell correspondía a la luz, no al sonido.' },
    ]
  },
];

let ceOndas = {
  freq:      30,
  canvas:    null,
  ctx:       null,
  rafId:     null,
  t:         0,
  nivelIdx:  0,
  respondido: false,
  puntaje:   0,
  errores:   0,
};

function ceModuloOndas(body) {
  const nv = CE_NIVELES_ONDAS[ceOndas.nivelIdx];

  document.getElementById('ce-instruccion').textContent =
    `Etapa 1 · Módulo C — Generador de Ondas: ${nv.instruccion}`;

  body.innerHTML = `
    <div class="ce-ondas-wrap">

      <!-- Panel izquierdo: desafío -->
      <div class="ce-fuerzas-panel">

        <div class="ce-panel-card ce-desafio-card" id="ce-ondas-desafio">
          <div class="ce-panel-title">Desafío ${nv.nivel}/4 — ${nv.titulo}</div>
          <p class="ce-desafio-desc" style="font-size:10px;color:var(--text2);line-height:1.5;margin:4px 0 8px">
            ${nv.instruccion}
          </p>
          <p class="ce-desafio-pregunta">${nv.pregunta}</p>
          <div class="ce-respuestas" id="ce-ondas-respuestas"></div>
          <div class="ce-exp hidden" id="ce-ondas-exp"></div>
          <div class="ce-fuerzas-prog" style="margin-top:8px">
            ${CE_NIVELES_ONDAS.map((_,i) => `
              <button class="ms-e1-dot ${i < ceOndas.nivelIdx ? 'done' : i === ceOndas.nivelIdx ? 'current' : ''}"
                   title="Desafío ${i+1}"
                   ${i < ceOndas.nivelIdx ? `onclick="ceOndasIrNivel(${i})"` : 'disabled'}
              ></button>
            `).join('')}
            <span class="ms-e1-niveles-label">${nv.nivel}/4</span>
          </div>
        </div>

        <div class="ce-panel-card" style="margin-top:8px">
          <div class="ce-panel-title">Fórmulas clave</div>
          <div class="ce-formula-box" style="margin-top:4px">
            c = λ · f<br>
            <small>c = 3×10⁸ m/s (constante)</small>
          </div>
          <p style="font-size:9px;color:var(--text2);margin-top:6px;line-height:1.5">
            〰 <strong>E</strong> — campo eléctrico (color del tramo)<br>
            🔵 <strong style="color:#26c6da">B</strong> — campo magnético (cian)<br>
            E ⊥ B ⊥ dirección de propagación
          </p>
        </div>

        <div class="ms-btn-row" style="margin-top:8px">
          <button class="calc-toggle-btn" onclick="Calculadora.toggle()">🧮 Calc</button>
        </div>
      </div>

      <!-- Canvas + controles -->
      <div class="ce-canvas-wrap">
        <canvas id="ce-ondas-canvas" class="ce-canvas"></canvas>
        <div class="ce-ondas-controles">
          <label class="ce-ctrl-label">
            Frecuencia: <strong id="ce-freq-val">${nv.freqInicial}%</strong>
            — <span id="ce-espectro-label" class="ce-espectro-badge">—</span>
          </label>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:10px;color:var(--text2)">Baja f</span>
            <input type="range" id="ce-freq-slider" class="ms-slider"
                   min="0" max="100" value="${nv.freqInicial}"
                   oninput="ceOndasSetFreq(this.value)">
            <span style="font-size:10px;color:var(--text2)">Alta f</span>
          </div>
          <div class="ce-espectro-bar">
            ${CE_ESPECTRO.map(e => `
              <div class="ce-esp-seg" style="background:${e.color}55;border-color:${e.color}66"
                   id="esp-${e.nombre.replace(/ /g,'-')}">${e.nombre}</div>
            `).join('')}
          </div>
        </div>
      </div>

    </div>
  `;

  /* Renderizar opciones */
  ceOndasRenderRespuestas();

  /* Inicializar canvas */
  const canvas = document.getElementById('ce-ondas-canvas');
  ceOndas.canvas     = canvas;
  ceOndas.ctx        = canvas.getContext('2d');
  ceOndas.respondido = false;

  function ajustar() {
    canvas.width  = canvas.offsetWidth  || 500;
    canvas.height = canvas.offsetHeight || 300;
  }
  ajustar();
  window.addEventListener('resize', ajustar);

  /* Frecuencia inicial del nivel */
  ceOndasSetFreq(nv.freqInicial);

  if (ceOndas.rafId) cancelAnimationFrame(ceOndas.rafId);
  function loop() {
    ceOndas.t += 0.020;   /* velocidad media (era 0.012) */
    ceOndasRender();
    ceOndas.rafId = requestAnimationFrame(loop);
  }
  loop();
}

function ceOndasRenderRespuestas() {
  const nv   = CE_NIVELES_ONDAS[ceOndas.nivelIdx];
  const cont = document.getElementById('ce-ondas-respuestas');
  if (!cont) return;
  cont.innerHTML = '';
  nv.respuestas.forEach((r, i) => {
    const btn = document.createElement('button');
    btn.className   = 'ce-resp-btn';
    btn.textContent = r.label;
    btn.addEventListener('click', () => ceOndasResponder(i));
    cont.appendChild(btn);
  });
}

function ceOndasResponder(idx) {
  if (ceOndas.respondido) return;
  ceOndas.respondido = true;
  const nv   = CE_NIVELES_ONDAS[ceOndas.nivelIdx];
  const resp = nv.respuestas[idx];
  const ok   = resp.ok;

  if (!ok) ceOndas.errores++;
  else      ceOndas.puntaje += 100;

  /* Colorear botones */
  document.querySelectorAll('#ce-ondas-respuestas .ce-resp-btn').forEach((b, i) => {
    b.classList.add(nv.respuestas[i].ok ? 'correcto' : 'incorrecto');
    b.disabled = true;
  });

  /* Explicación */
  const expEl = document.getElementById('ce-ondas-exp');
  if (expEl) {
    expEl.textContent = resp.exp;
    expEl.className   = `ce-exp ${ok ? 'ok' : 'err'}`;
  }

  /* Botón siguiente */
  const esUltimo = ceOndas.nivelIdx >= CE_NIVELES_ONDAS.length - 1;
  const btnSig   = document.createElement('button');
  btnSig.className   = 'ce-btn ce-btn-next';
  btnSig.textContent = esUltimo ? 'Ver conclusión →' : `Desafío ${nv.nivel + 1} →`;
  btnSig.style.marginTop = '8px';
  btnSig.addEventListener('click', () => {
    if (esUltimo) {
      ceOndas.nivelIdx = 0;
      ceModuloFinal();
    } else {
      ceOndas.nivelIdx++;
      ceOndas.respondido = false;
      ceModuloOndas(document.getElementById('ce-body'));
    }
  });
  expEl && expEl.classList.remove('hidden');
  const card = document.getElementById('ce-ondas-desafio');
  if (card) card.appendChild(btnSig);
}

function ceOndasSetFreq(val) {
  ceOndas.freq = parseFloat(val);
  document.getElementById('ce-freq-val').textContent = Math.round(val) + '%';
  /* Determinar tramo del espectro */
  const seg = CE_ESPECTRO.find(e => val >= e.fMin && val <= e.fMax) || CE_ESPECTRO[0];
  const lbl = document.getElementById('ce-espectro-label');
  if (lbl) {
    lbl.textContent = seg.nombre;
    lbl.style.background = seg.color + '25';
    lbl.style.color      = seg.color;
    lbl.style.borderColor = seg.color + '60';
  }
  /* Resaltar segmento activo */
  CE_ESPECTRO.forEach(e => {
    const el = document.getElementById('esp-' + e.nombre.replace(/ /g, '-'));
    if (el) el.style.opacity = e === seg ? '1' : '0.3';
  });
}

function ceOndasRender() {
  const canvas = ceOndas.canvas;
  if (!canvas) return;
  const ctx = ceOndas.ctx;
  const W = canvas.width, H = canvas.height;
  const cx = 60, cy = H / 2;
  const t  = ceOndas.t;
  const f  = ceOndas.freq;
  const lambda = Math.max(20, W * 0.7 / (1 + f * 0.05));
  const amp    = Math.min(H * 0.35, 50 + (100 - f) * 0.4);
  const speed  = 1 + f * 0.015;   /* velocidad reducida (era 3 + f*0.04) */
  const seg    = CE_ESPECTRO.find(e => f >= e.fMin && f <= e.fMax) || CE_ESPECTRO[0];

  /* Colores: E usa el color del tramo activo del espectro, B siempre cian */
  const colorE = seg.color;   /* cambia según la frecuencia */
  const colorB = '#26c6da';   /* cian fijo — campo magnético */

  ctx.clearRect(0, 0, W, H);

  /* Fondo */
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#0a0520'); bg.addColorStop(1,'#04020f');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  /* Línea central */
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(W, cy); ctx.stroke();

  /* Eje horizontal label */
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '10px Orbitron';
  ctx.textAlign = 'left';
  ctx.fillText('→ propagación (x)', cx + 8, cy - 6);

  /* Onda E (campo eléctrico) — rosa/magenta */
  ctx.beginPath();
  ctx.strokeStyle = colorE; ctx.lineWidth = 2.5;
  for (let px = cx; px < W; px++) {
    const phase = (px - cx) / lambda * Math.PI * 2 - t * speed;
    const ey = cy + Math.sin(phase) * amp * Math.min(1, (px - cx) / 80);
    if (px === cx) ctx.moveTo(px, ey);
    else            ctx.lineTo(px, ey);
  }
  ctx.stroke();

  /* Onda B (campo magnético) — cian punteado */
  ctx.beginPath();
  ctx.strokeStyle = colorB; ctx.lineWidth = 1.5;
  ctx.setLineDash([4,3]);
  for (let px = cx; px < W; px++) {
    const phase = (px - cx) / lambda * Math.PI * 2 - t * speed;
    const by = cy + Math.cos(phase) * amp * 0.55 * Math.min(1, (px - cx) / 80);
    if (px === cx) ctx.moveTo(px, by);
    else            ctx.lineTo(px, by);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  /* Carga oscilante */
  const oscAmp = Math.min(amp * 0.9, 40);
  const oscY   = cy + Math.sin(t * speed % (Math.PI * 2)) * oscAmp;
  ctx.save();
  ctx.shadowColor = '#ff5252'; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.arc(cx, oscY, 10, 0, Math.PI * 2);
  const cg = ctx.createRadialGradient(cx-3, oscY-3, 0, cx, oscY, 10);
  cg.addColorStop(0, '#ef5350'); cg.addColorStop(1, '#b71c1c');
  ctx.fillStyle = cg; ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('−', cx, oscY);

  /* Leyenda */
  ctx.font = '10px Exo 2,sans-serif'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = colorE; ctx.textAlign = 'right';
  ctx.fillText('E (campo eléctrico)', W - 10, cy - amp - 6);
  ctx.fillStyle = colorB;
  ctx.fillText('B (campo magnético)', W - 10, cy + amp * 0.55 + 16);

  /* Indicador λ con el color del tramo activo del espectro */
  const lx1 = cx + 20, lx2 = lx1 + lambda;
  if (lx2 < W - 20) {
    ctx.strokeStyle = seg.color + '55'; ctx.lineWidth = 1;
    ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(lx1, cy + amp + 18); ctx.lineTo(lx2, cy + amp + 18); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = seg.color + 'bb'; ctx.textAlign = 'center';
    ctx.fillText('λ', (lx1 + lx2)/2, cy + amp + 32);
  }
}

/* ════════════════════════════════════════════
   PANTALLA FINAL DEL MÓDULO C
   ════════════════════════════════════════════ */
function ceModuloFinal() {
  if (ceOndas.rafId)  { cancelAnimationFrame(ceOndas.rafId);  ceOndas.rafId  = null; }
  if (ceCable.rafId)  { cancelAnimationFrame(ceCable.rafId);  ceCable.rafId  = null; }

  const body = document.getElementById('ce-body');
  body.innerHTML = `
    <div class="ce-final-wrap">
      <div class="ce-final-title retro-text">🏆 ETAPA 1 COMPLETADA</div>

      <div class="ce-final-bloques">

        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">🔵</div>
          <div class="ce-bloque-titulo">Fuerzas</div>
          <div class="ce-bloque-texto">
            La carga eléctrica es una propiedad dual (+/−). Cargas iguales
            se repelen, opuestas se atraen. La <strong>Ley de Coulomb</strong>
            cuantifica esta fuerza: crece con las cargas y cae con la distancia al cuadrado.
          </div>
        </div>

        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">⚡</div>
          <div class="ce-bloque-titulo">Cable Mágico</div>
          <div class="ce-bloque-texto">
            <strong>Ørsted (1820)</strong> descubrió que una corriente (cargas en movimiento)
            genera un campo magnético. Una carga estática solo tiene campo eléctrico;
            una carga en movimiento tiene además campo magnético.
          </div>
        </div>

        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">🌊</div>
          <div class="ce-bloque-titulo">Generador de Ondas</div>
          <div class="ce-bloque-texto">
            Acelerar una carga produce una <strong>onda electromagnética</strong>: campos E y B
            perpendiculares que se propagan a <em>c = 3×10⁸ m/s</em>. Radio, luz visible,
            rayos X: ¡todo es lo mismo, solo cambia la frecuencia!
          </div>
        </div>

      </div>

      <div class="ce-final-mensaje">
        "La carga eléctrica es el <em>imán social</em> de las partículas.
        Define quién se junta con quién, quién huye de quién,
        y al moverse, ¡llena el universo de luz!"
      </div>

      <div class="ms-btn-row" style="justify-content:center;gap:14px">
        <button class="ce-btn" onclick="ceIniciarEtapa(0)">↺ Repetir desde Fuerzas</button>
        <button class="ce-btn ce-btn-next" onclick="cerrarCE()">← Volver al ME</button>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════
   UTILIDADES
   ════════════════════════════════════════════ */
function cePosCanvas(e, canvas) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width  / r.width),
    y: (e.clientY - r.top)  * (canvas.height / r.height),
  };
}

/* ════════════════════════════════════════════════════════
   ETAPA 2 · MÓDULO A — EL FOTÓN VIRTUAL (QED)
   Simulación interactiva de los 3 procesos fundamentales:
   emisión, absorción e intercambio, mostrados con la
   analogía de los patinadores que se lanzan una pelota.
   ════════════════════════════════════════════════════════ */
const CE_NIVELES_QED = [
  {
    nivel: 1,
    titulo: 'Emisión: lanzar el fotón',
    proceso: 'emision',
    instruccion: 'Pulsa LANZAR. Una partícula cargada emite un fotón virtual y retrocede por el impulso.',
    pregunta: 'Al EMITIR un fotón, ¿qué le pasa a la partícula que lo lanza?',
    respuestas: [
      { label: 'Acelera hacia adelante, en el sentido del fotón', ok: false,
        exp: 'No. Por conservación del momento, al lanzar algo hacia un lado tú retrocedes hacia el otro, igual que al disparar un rifle.' },
      { label: 'Retrocede en sentido contrario al fotón', ok: true,
        exp: '¡Correcto! Igual que un patinador que lanza una pelota: al emitir el fotón, la partícula sale impulsada en sentido opuesto. Es la conservación del momento.' },
      { label: 'No se mueve: el fotón no tiene masa', ok: false,
        exp: 'Aunque el fotón no tiene masa, sí transporta momento. Al emitirlo, la partícula recibe un empuje en sentido contrario.' },
    ]
  },
  {
    nivel: 2,
    titulo: 'Absorción: atrapar el fotón',
    proceso: 'absorcion',
    instruccion: 'Pulsa LANZAR. Un fotón virtual llega a la partícula y es absorbido: la partícula se acelera.',
    pregunta: 'Cuando una partícula ABSORBE un fotón que viene hacia ella, ¿qué ocurre?',
    respuestas: [
      { label: 'Recibe el momento del fotón y se acelera', ok: true,
        exp: '¡Correcto! El fotón transporta momento. Al ser absorbido, se lo entrega a la partícula, que sale impulsada en la dirección en que viajaba el fotón.' },
      { label: 'Se detiene en seco al chocar', ok: false,
        exp: 'No se detiene: absorbe el momento del fotón y se mueve en la dirección que éste traía. La energía y el momento se conservan.' },
      { label: 'Rebota el fotón sin cambiar su movimiento', ok: false,
        exp: 'En la absorción el fotón NO rebota: desaparece y entrega todo su momento a la partícula, que cambia su movimiento.' },
    ]
  },
  {
    nivel: 3,
    titulo: 'Intercambio: la repulsión',
    proceso: 'intercambio_repulsion',
    instruccion: 'Dos electrones (−, −) se intercambian un fotón virtual. Pulsa LANZAR y observa cómo se separan.',
    pregunta: 'Dos electrones se intercambian un fotón virtual. ¿Por qué se SEPARAN (repulsión)?',
    respuestas: [
      { label: 'Porque el fotón los calienta y los expande', ok: false,
        exp: 'No hay calor involucrado. La separación viene del momento: uno retrocede al emitir, el otro al absorber.' },
      { label: 'Porque tienen masa y chocan entre sí', ok: false,
        exp: 'No chocan entre ellos; nunca se tocan. Lo que los separa es el intercambio del fotón virtual que transfiere momento.' },
      { label: 'El que emite retrocede y el que absorbe es empujado: ambos se alejan', ok: true,
        exp: '¡Correcto! Como dos patinadores que se lanzan una pelota: el que la lanza retrocede y el que la atrapa es empujado. El resultado neto es que se separan. ¡Así funciona la repulsión eléctrica!' },
    ]
  },
  {
    nivel: 4,
    titulo: 'Intercambio: la atracción',
    proceso: 'intercambio_atraccion',
    instruccion: 'Un electrón (−) y un positrón (+) se intercambian un fotón virtual. Pulsa LANZAR: se acercan.',
    pregunta: 'Un electrón y un positrón también intercambian un fotón, pero se ATRAEN. ¿Cómo es posible?',
    respuestas: [
      { label: 'El signo opuesto de las cargas invierte el efecto del intercambio', ok: true,
        exp: '¡Correcto! La naturaleza cuántica del proceso hace que, con cargas de signo opuesto, el intercambio del fotón virtual produzca atracción en lugar de repulsión. El mismo mecanismo, resultado contrario.' },
      { label: 'El positrón absorbe dos fotones en vez de uno', ok: false,
        exp: 'No es cuestión de cantidad de fotones. Es el signo opuesto de las cargas lo que invierte el sentido del efecto.' },
      { label: 'El fotón empuja al electrón pero jala al positrón', ok: false,
        exp: 'El fotón no "elige" a quién jalar. Es la combinación de cargas opuestas en el proceso cuántico lo que da como resultado la atracción.' },
    ]
  },
  {
    nivel: 5,
    titulo: 'El fotón virtual y Heisenberg',
    proceso: 'intercambio_repulsion',
    instruccion: 'Observa de nuevo el intercambio. Ese fotón "prestado" existe solo un instante.',
    pregunta: '¿Por qué el fotón mediador se llama "virtual" y no se puede detectar?',
    respuestas: [
      { label: 'Porque es demasiado pequeño para los detectores actuales', ok: false,
        exp: 'No es cuestión de tamaño ni de tecnología. Es imposible detectarlo por principio: existe solo durante la interacción.' },
      { label: 'Porque viaja más rápido que la luz', ok: false,
        exp: 'Nada viaja más rápido que la luz. El fotón virtual precisamente resuelve ese problema: transmite la fuerza respetando la relatividad.' },
      { label: 'Existe solo un instante, "prestando" energía según Heisenberg (ΔE·Δt ≥ ħ/2)', ok: true,
        exp: '¡Correcto! El principio de incertidumbre de Heisenberg permite que el fotón "tome prestada" energía durante un tiempo brevísimo. Como solo existe durante la interacción y luego desaparece, nunca se puede observar directamente.' },
    ]
  },
];

let ceQED = {
  canvas:     null,
  ctx:        null,
  rafId:      null,
  nivelIdx:   0,
  respondido: false,
  puntaje:    0,
  errores:    0,
  anim:       null,   /* estado de la animación en curso */
};

function ceModuloIntercambio(body) {
  const nv = CE_NIVELES_QED[ceQED.nivelIdx];

  document.getElementById('ce-instruccion').textContent =
    `Etapa 2 · QED — Fotón virtual: ${nv.instruccion}`;

  body.innerHTML = `
    <div class="ce-cable-wrap">

      <!-- Panel izquierdo: desafío -->
      <div class="ce-fuerzas-panel">

        <div class="ce-panel-card ce-desafio-card" id="ce-qed-desafio">
          <div class="ce-panel-title">Desafío ${nv.nivel}/5 — ${nv.titulo}</div>
          <p class="ce-desafio-desc" style="font-size:10px;color:var(--text2);line-height:1.5;margin:4px 0 8px">
            ${nv.instruccion}
          </p>
          <p class="ce-desafio-pregunta">${nv.pregunta}</p>
          <div class="ce-respuestas" id="ce-qed-respuestas"></div>
          <div class="ce-exp hidden" id="ce-qed-exp"></div>
          <div class="ce-fuerzas-prog" style="margin-top:8px">
            ${CE_NIVELES_QED.map((_,i) => `
              <button class="ms-e1-dot ${i < ceQED.nivelIdx ? 'done' : i === ceQED.nivelIdx ? 'current' : ''}"
                   title="Desafío ${i+1}"
                   ${i < ceQED.nivelIdx ? `onclick="ceQEDIrNivel(${i})"` : 'disabled'}
              ></button>
            `).join('')}
            <span class="ms-e1-niveles-label">${nv.nivel}/5</span>
          </div>
        </div>

        <div class="ce-panel-card" style="margin-top:8px">
          <div class="ce-panel-title">La analogía del hielo</div>
          <p style="font-size:9px;color:var(--text2);margin-top:4px;line-height:1.55">
            Dos patinadores que se lanzan una pelota retroceden al lanzarla
            y al atraparla. En QED, la "pelota" es el <strong style="color:#ffd740">fotón virtual</strong>:
            transmite la fuerza sin que las partículas se toquen.
          </p>
          <div class="ce-formula-box" style="margin-top:6px">
            ΔE · Δt ≥ ħ/2<br>
            <small>El fotón "presta" energía<br>por un instante (Heisenberg)</small>
          </div>
        </div>

        <div class="ms-btn-row" style="margin-top:8px">
          <button class="calc-toggle-btn" onclick="Calculadora.toggle()">🧮 Calc</button>
        </div>
      </div>

      <!-- Canvas de simulación con controles de reproducción encima -->
      <div class="ce-canvas-wrap">
        <div class="ce-qed-canvas-holder">
          <canvas id="ce-qed-canvas" class="ce-canvas"></canvas>
          <div class="ce-qed-controles">
            <button class="ce-qed-ctrl-btn ce-qed-play" id="ce-qed-lanzar" onclick="ceQEDLanzar()">▶ Lanzar</button>
          </div>
        </div>
        <div class="ce-canvas-legend" id="ce-qed-legend"></div>
      </div>

    </div>
  `;

  ceQEDRenderRespuestas();

  const canvas = document.getElementById('ce-qed-canvas');
  ceQED.canvas = canvas;
  ceQED.ctx    = canvas.getContext('2d');
  ceQED.respondido = false;

  function ajustar() {
    canvas.width  = canvas.offsetWidth  || 500;
    canvas.height = canvas.offsetHeight || 340;
    ceQEDInit();
  }
  ajustar();
  window.addEventListener('resize', ajustar);

  if (ceQED.rafId) cancelAnimationFrame(ceQED.rafId);
  function loop() { ceQEDRender(); ceQED.rafId = requestAnimationFrame(loop); }
  loop();
}

/* Configura las partículas según el proceso del nivel */
function ceQEDInit() {
  const nv = CE_NIVELES_QED[ceQED.nivelIdx];
  const W  = ceQED.canvas.width, H = ceQED.canvas.height;
  const cy = H / 2;
  const proc = nv.proceso;

  const legend = document.getElementById('ce-qed-legend');

  if (proc === 'emision') {
    /* Una sola partícula a la izquierda que emitirá un fotón hacia la derecha */
    ceQED.p1 = { x0: W*0.4, x: W*0.4, y: cy, q: -1, label: 'e⁻' };
    ceQED.p2 = null;
    if (legend) legend.innerHTML = '<span class="ce-leg-neg">● e⁻ (electrón)</span> <span style="color:#ffd740">〜 fotón virtual</span>';
  } else if (proc === 'absorcion') {
    /* Partícula a la derecha; el fotón llega desde la izquierda */
    ceQED.p1 = { x0: W*0.6, x: W*0.6, y: cy, q: -1, label: 'e⁻' };
    ceQED.p2 = null;
    if (legend) legend.innerHTML = '<span class="ce-leg-neg">● e⁻ (electrón)</span> <span style="color:#ffd740">〜 fotón virtual</span>';
  } else if (proc === 'intercambio_repulsion') {
    ceQED.p1 = { x0: W*0.38, x: W*0.38, y: cy, q: -1, label: 'e⁻' };
    ceQED.p2 = { x0: W*0.62, x: W*0.62, y: cy, q: -1, label: 'e⁻' };
    if (legend) legend.innerHTML = '<span class="ce-leg-neg">● e⁻ · e⁻ (se repelen)</span> <span style="color:#ffd740">〜 fotón virtual</span>';
  } else if (proc === 'intercambio_atraccion') {
    ceQED.p1 = { x0: W*0.38, x: W*0.38, y: cy, q: -1, label: 'e⁻' };
    ceQED.p2 = { x0: W*0.62, x: W*0.62, y: cy, q: +1, label: 'e⁺' };
    if (legend) legend.innerHTML = '<span class="ce-leg-neg">● e⁻</span> <span class="ce-leg-pos">● e⁺ (se atraen)</span> <span style="color:#ffd740">〜 fotón virtual</span>';
  }
  ceQED.anim = null;
}

/* Dispara la animación del proceso */
function ceQEDLanzar() {
  const nv = CE_NIVELES_QED[ceQED.nivelIdx];
  ceQEDInit();  /* reiniciar posiciones */
  ceQED.anim = { t: 0, proceso: nv.proceso, fase: 'viaje' };
}


function ceQEDRender() {
  const canvas = ceQED.canvas;
  if (!canvas || !ceQED.p1) return;
  const ctx = ceQED.ctx;
  const W = canvas.width, H = canvas.height;
  const cy = H / 2;

  ctx.clearRect(0, 0, W, H);

  /* Fondo + "hielo" */
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#0a0520'); bg.addColorStop(1,'#04020f');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();

  const nv   = CE_NIVELES_QED[ceQED.nivelIdx];
  const proc = nv.proceso;
  const anim = ceQED.anim;

  /* ── Actualizar animación ── */
  let fotonPos = null;    /* {x, y} si el fotón está visible */
  if (anim) {
    anim.t += 0.012;
    const t = anim.t;

    if (proc === 'emision') {
      /* La partícula retrocede a la izquierda, el fotón sale a la derecha */
      const prog = Math.min(t, 1);
      ceQED.p1.x = ceQED.p1.x0 - prog * W * 0.18;
      if (t < 1.2) fotonPos = { x: ceQED.p1.x0 + prog * W * 0.5, y: cy };
    } else if (proc === 'absorcion') {
      /* El fotón llega desde la izquierda; al llegar, la partícula se acelera a la derecha */
      const llegada = 1.0;
      if (t < llegada) {
        fotonPos = { x: W*0.1 + (t/llegada) * (ceQED.p1.x0 - W*0.1), y: cy };
      } else {
        const prog = Math.min(t - llegada, 1);
        ceQED.p1.x = ceQED.p1.x0 + prog * W * 0.22;
      }
    } else if (proc === 'intercambio_repulsion' || proc === 'intercambio_atraccion') {
      const atrae = proc === 'intercambio_atraccion';
      const mid   = (ceQED.p1.x0 + ceQED.p2.x0) / 2;
      /* Fase 1: el fotón viaja de p1 a p2 */
      if (t < 1) {
        fotonPos = { x: ceQED.p1.x0 + t * (ceQED.p2.x0 - ceQED.p1.x0), y: cy };
      } else {
        /* Fase 2: ambas partículas se mueven */
        const prog = Math.min(t - 1, 1);
        const d = prog * W * 0.14;
        if (atrae) {
          ceQED.p1.x = ceQED.p1.x0 + d;   /* se acercan */
          ceQED.p2.x = ceQED.p2.x0 - d;
        } else {
          ceQED.p1.x = ceQED.p1.x0 - d;   /* se separan */
          ceQED.p2.x = ceQED.p2.x0 + d;
        }
      }
    }
  }

  /* ── Dibujar fotón virtual (línea ondulada + bolita dorada) ── */
  if (fotonPos) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,215,64,0.5)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = fotonPos.x - 24; x <= fotonPos.x + 24; x += 2) {
      const yy = fotonPos.y + Math.sin((x - fotonPos.x) * 0.5) * 5;
      if (x === fotonPos.x - 24) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
    ctx.shadowColor = '#ffd740'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(fotonPos.x, fotonPos.y, 8, 0, Math.PI*2);
    ctx.fillStyle = '#ffd740'; ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#000'; ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('γ', fotonPos.x, fotonPos.y);
  }

  /* ── Dibujar partículas ── */
  ceQEDDibujarParticula(ceQED.p1);
  if (ceQED.p2) ceQEDDibujarParticula(ceQED.p2);

  /* Mensaje de proceso si no hay animación */
  if (!anim) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '12px Orbitron,monospace'; ctx.textAlign = 'center';
    ctx.fillText('Pulsa ▶ LANZAR para ver el proceso', W/2, H*0.85);
  }
}

function ceQEDDibujarParticula(p) {
  const ctx = ceQED.ctx;
  const col  = p.q > 0 ? '#4fc3f7' : '#ef5350';
  const glow = p.q > 0 ? '#00b0ff' : '#ff1744';
  const r = 22;
  ctx.save();
  ctx.shadowColor = glow; ctx.shadowBlur = 16;
  const g = ctx.createRadialGradient(p.x - r*.3, p.y - r*.3, 0, p.x, p.y, r);
  g.addColorStop(0, col + 'ee'); g.addColorStop(1, col + '66');
  ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI*2);
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Orbitron,monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(p.label, p.x, p.y);
}

function ceQEDRenderRespuestas() {
  const nv   = CE_NIVELES_QED[ceQED.nivelIdx];
  const cont = document.getElementById('ce-qed-respuestas');
  if (!cont) return;
  cont.innerHTML = '';
  nv.respuestas.forEach((r, i) => {
    const btn = document.createElement('button');
    btn.className   = 'ce-resp-btn';
    btn.textContent = r.label;
    btn.addEventListener('click', () => ceQEDResponder(i));
    cont.appendChild(btn);
  });
}

function ceQEDResponder(idx) {
  if (ceQED.respondido) return;
  ceQED.respondido = true;
  const nv   = CE_NIVELES_QED[ceQED.nivelIdx];
  const resp = nv.respuestas[idx];
  const ok   = resp.ok;

  if (!ok) ceQED.errores++;
  else      ceQED.puntaje += 100;

  document.querySelectorAll('#ce-qed-respuestas .ce-resp-btn').forEach((b, i) => {
    b.classList.add(nv.respuestas[i].ok ? 'correcto' : 'incorrecto');
    b.disabled = true;
  });

  const expEl = document.getElementById('ce-qed-exp');
  if (expEl) {
    expEl.textContent = resp.exp;
    expEl.className   = `ce-exp ${ok ? 'ok' : 'err'}`;
  }

  const esUltimo = ceQED.nivelIdx >= CE_NIVELES_QED.length - 1;
  const btnSig   = document.createElement('button');
  btnSig.className   = 'ce-btn ce-btn-next';
  btnSig.textContent = esUltimo ? 'Ver conclusión →' : `Desafío ${nv.nivel + 1} →`;
  btnSig.style.marginTop = '8px';
  btnSig.addEventListener('click', () => {
    if (esUltimo) {
      ceQED.nivelIdx = 0;
      ceQEDFinal();
    } else {
      ceQED.nivelIdx++;
      ceQED.respondido = false;
      ceModuloIntercambio(document.getElementById('ce-body'));
    }
  });
  expEl && expEl.classList.remove('hidden');
  const card = document.getElementById('ce-qed-desafio');
  if (card) card.appendChild(btnSig);
}

function ceQEDIrNivel(idx) {
  if (idx >= ceQED.nivelIdx) return;
  ceQED.nivelIdx   = idx;
  ceQED.respondido = false;
  if (ceQED.rafId) { cancelAnimationFrame(ceQED.rafId); ceQED.rafId = null; }
  ceModuloIntercambio(document.getElementById('ce-body'));
}

function ceQEDFinal() {
  if (ceQED.rafId) { cancelAnimationFrame(ceQED.rafId); ceQED.rafId = null; }
  const body = document.getElementById('ce-body');
  body.innerHTML = `
    <div class="ce-final-wrap">
      <div class="ce-final-title retro-text">🏐 MÓDULO A COMPLETADO</div>
      <div class="ce-final-bloques">
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">📤</div>
          <div class="ce-bloque-titulo">Emisión</div>
          <div class="ce-bloque-texto">
            Una partícula cargada emite un fotón virtual y <strong>retrocede</strong>
            por conservación del momento, como un patinador que lanza una pelota.
          </div>
        </div>
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">📥</div>
          <div class="ce-bloque-titulo">Absorción</div>
          <div class="ce-bloque-texto">
            Otra partícula absorbe ese fotón y <strong>recibe su momento</strong>,
            acelerándose en la dirección en que viajaba el fotón.
          </div>
        </div>
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">🔄</div>
          <div class="ce-bloque-titulo">Intercambio</div>
          <div class="ce-bloque-texto">
            El intercambio de fotones virtuales <strong>es la fuerza eléctrica</strong>:
            cargas iguales se repelen, opuestas se atraen. ¡La fuerza es el intercambio!
          </div>
        </div>
      </div>
      <div class="ce-final-mensaje">
        "La fuerza eléctrica no es acción a distancia: es un <em>juego de pelota cuántico</em>.
        Las partículas se lanzan fotones virtuales que, respetando a Heisenberg y a Einstein,
        transmiten la fuerza sin violar la velocidad de la luz."
      </div>
      <div class="ms-btn-row" style="justify-content:center;gap:14px">
        <button class="ce-btn" onclick="ceQED.nivelIdx=0;ceModuloIntercambio(document.getElementById('ce-body'))">↺ Repetir módulo</button>
        <button class="ce-btn ce-btn-next" onclick="ceIniciarEtapa(1)">Siguiente módulo →</button>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════════════
   ETAPA 2 · MÓDULO B — DE LA ONDA AL FOTÓN
   Vista dual (clásica/cuántica con zoom) + tareas que
   distinguen intensidad (nº de fotones) y frecuencia
   (energía por fotón).  E = h·f
   ════════════════════════════════════════════════════════ */
const CE_NIVELES_FOTONES = [
  {
    nivel: 1,
    titulo: 'La onda es un chorro de fotones',
    instruccion: 'Usa el botón de ZOOM para alternar entre la onda clásica y los fotones. Mueve los sliders y observa.',
    pregunta: 'Al hacer zoom en una onda electromagnética, ¿qué descubrimos que es en realidad?',
    respuestas: [
      { label: 'Un flujo continuo de energía sin partes', ok: false,
        exp: 'Esa es la visión clásica. La física cuántica mostró que la energía NO es continua: viene en paquetes.' },
      { label: 'Un chorro de fotones individuales (paquetes de energía)', ok: true,
        exp: '¡Correcto! La onda continua es, de cerca, un chorro de fotones. La energía electromagnética viene en "gotitas" discretas llamadas fotones.' },
      { label: 'Pequeñas olas de agua microscópicas', ok: false,
        exp: 'La analogía del oleaje es solo visual. Las ondas EM no son agua: son fotones, paquetes de energía del campo electromagnético.' },
    ]
  },
  {
    nivel: 2,
    titulo: 'Qué controla la frecuencia',
    instruccion: 'Mueve SOLO el slider de frecuencia (deja la intensidad fija) y observa el tamaño/color de los fotones.',
    pregunta: 'Según E = h·f, si subes la FRECUENCIA (sin tocar la intensidad), ¿qué cambia?',
    respuestas: [
      { label: 'Aumenta la energía de CADA fotón', ok: true,
        exp: '¡Correcto! E = h·f: la energía de cada fotón es proporcional a su frecuencia. Más frecuencia = cada fotón más energético (y por eso más peligroso).' },
      { label: 'Aumenta el NÚMERO de fotones emitidos', ok: false,
        exp: 'No. El número de fotones lo controla la intensidad, no la frecuencia. La frecuencia cambia la energía de cada fotón individual.' },
      { label: 'No cambia nada: todos los fotones son iguales', ok: false,
        exp: 'Sí cambia: a mayor frecuencia, cada fotón lleva más energía (E = hf). Los de rayos X son mucho más energéticos que los de radio.' },
    ]
  },
  {
    nivel: 3,
    titulo: 'Qué controla la intensidad',
    instruccion: 'Ahora mueve SOLO el slider de intensidad (deja la frecuencia fija) y cuenta cuántos fotones salen.',
    pregunta: 'Si subes la INTENSIDAD (sin cambiar la frecuencia), ¿qué ocurre?',
    respuestas: [
      { label: 'Cada fotón se vuelve más energético', ok: false,
        exp: 'No. La energía de cada fotón depende solo de la frecuencia (E = hf). La intensidad no cambia esa energía individual.' },
      { label: 'Los fotones viajan más rápido que la luz', ok: false,
        exp: 'Imposible: todos los fotones viajan a c, sin importar la intensidad. Lo que cambia con la intensidad es cuántos hay.' },
      { label: 'Se emiten MÁS fotones (pero cada uno igual de energético)', ok: true,
        exp: '¡Correcto! La intensidad controla el número de fotones por segundo. Más intensidad = más fotones, pero cada uno mantiene su energía (fijada por la frecuencia).' },
    ]
  },
  {
    nivel: 4,
    titulo: 'Intensidad vs frecuencia',
    instruccion: 'Una lámpara de luz roja muy brillante frente a una luz azul muy tenue. Explóralo con los sliders.',
    pregunta: 'Luz ROJA muy brillante vs luz AZUL muy tenue. ¿Cuál tiene los fotones MÁS energéticos?',
    respuestas: [
      { label: 'La roja brillante: es más intensa, luego más energética', ok: false,
        exp: 'Cuidado: "brillante" significa MUCHOS fotones (intensidad), no fotones más energéticos. El rojo tiene menor frecuencia que el azul.' },
      { label: 'La azul tenue: el azul tiene mayor frecuencia que el rojo', ok: true,
        exp: '¡Correcto! El azul tiene MÁS frecuencia que el rojo, así que cada fotón azul es más energético (E = hf), aunque haya pocos. El brillo del rojo solo dice que hay muchos fotones, no que sean energéticos.' },
      { label: 'Las dos igual: el color no afecta la energía', ok: false,
        exp: 'El color SÍ importa: indica la frecuencia. Azul = alta frecuencia = fotones energéticos; rojo = baja frecuencia = fotones débiles.' },
    ]
  },
  {
    nivel: 5,
    titulo: 'La radiación peligrosa',
    instruccion: 'Pon frecuencia e intensidad al máximo y observa el chorro de fotones energéticos.',
    pregunta: '¿Por qué un haz intenso de rayos X es peligroso, pero una radio igual de potente no lo es?',
    respuestas: [
      { label: 'Porque los rayos X viajan más rápido', ok: false,
        exp: 'No: ambos son luz y viajan a c. La diferencia está en la energía de cada fotón, que depende de la frecuencia.' },
      { label: 'Porque la radio emite menos fotones', ok: false,
        exp: 'No es cuestión de cantidad: una radio potente emite MUCHÍSIMOS fotones. Pero cada uno es de baja energía (baja frecuencia) e inofensivo.' },
      { label: 'Cada fotón de rayos X tiene altísima energía (alta frecuencia) y puede romper moléculas', ok: true,
        exp: '¡Correcto! Los rayos X tienen frecuencia enorme, así que cada fotón (E = hf) lleva energía suficiente para romper enlaces moleculares y dañar células. Los de radio, aunque sean muchos, no tienen energía para eso.' },
    ]
  },
];

let ceFot = {
  canvas:     null,
  ctx:        null,
  rafId:      null,
  t:          0,
  frecuencia: 40,    /* 0–100 */
  intensidad: 40,    /* 0–100 */
  zoom:       false, /* false = vista clásica (onda), true = vista cuántica (fotones) */
  fotones:    [],    /* partículas de fotón en la vista cuántica */
  spawnAcc:   0,     /* acumulador para emisión de fotones */
  nivelIdx:   0,
  respondido: false,
  puntaje:    0,
  errores:    0,
};

function ceModuloFotones(body) {
  const nv = CE_NIVELES_FOTONES[ceFot.nivelIdx];

  document.getElementById('ce-instruccion').textContent =
    `Etapa 2 · QED — De la onda al fotón: ${nv.instruccion}`;

  body.innerHTML = `
    <div class="ce-cable-wrap">

      <!-- Panel izquierdo -->
      <div class="ce-fuerzas-panel">

        <div class="ce-panel-card ce-desafio-card" id="ce-fot-desafio">
          <div class="ce-panel-title">Desafío ${nv.nivel}/5 — ${nv.titulo}</div>
          <p class="ce-desafio-desc" style="font-size:10px;color:var(--text2);line-height:1.5;margin:4px 0 8px">
            ${nv.instruccion}
          </p>
          <p class="ce-desafio-pregunta">${nv.pregunta}</p>
          <div class="ce-respuestas" id="ce-fot-respuestas"></div>
          <div class="ce-exp hidden" id="ce-fot-exp"></div>
          <div class="ce-fuerzas-prog" style="margin-top:8px">
            ${CE_NIVELES_FOTONES.map((_,i) => `
              <button class="ms-e1-dot ${i < ceFot.nivelIdx ? 'done' : i === ceFot.nivelIdx ? 'current' : ''}"
                   title="Desafío ${i+1}"
                   ${i < ceFot.nivelIdx ? `onclick="ceFotIrNivel(${i})"` : 'disabled'}
              ></button>
            `).join('')}
            <span class="ms-e1-niveles-label">${nv.nivel}/5</span>
          </div>
        </div>

        <div class="ce-panel-card" style="margin-top:8px">
          <div class="ce-panel-title">La onda ES fotones</div>
          <div class="ce-formula-box" style="margin-top:4px">
            E = h · f<br>
            <small>Energía de cada fotón = Planck × frecuencia</small>
          </div>
          <button class="ce-btn" style="margin-top:8px;width:100%"
                  id="ce-fot-zoom-btn" onclick="ceFotToggleZoom()">
            🔍 Ver vista cuántica (zoom)
          </button>
        </div>

        <div class="ms-btn-row" style="margin-top:8px">
          <button class="calc-toggle-btn" onclick="Calculadora.toggle()">🧮 Calc</button>
        </div>
      </div>

      <!-- Canvas + controles -->
      <div class="ce-canvas-wrap">
        <canvas id="ce-fot-canvas" class="ce-canvas"></canvas>
        <div class="ce-ondas-controles">
          <label class="ce-ctrl-label">
            Frecuencia (energía por fotón): <strong id="ce-fot-frec-val">40%</strong>
            — <span id="ce-fot-espectro" class="ce-espectro-badge">—</span>
          </label>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:10px;color:var(--text2)">Baja f</span>
            <input type="range" id="ce-fot-frec-slider" class="ms-slider"
                   min="0" max="100" value="40" oninput="ceFotSetFrec(this.value)">
            <span style="font-size:10px;color:var(--text2)">Alta f</span>
          </div>
          <label class="ce-ctrl-label" style="margin-top:6px">
            Intensidad (nº de fotones): <strong id="ce-fot-int-val">40%</strong>
          </label>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:10px;color:var(--text2)">Pocos</span>
            <input type="range" id="ce-fot-int-slider" class="ms-slider"
                   min="0" max="100" value="40" oninput="ceFotSetInt(this.value)">
            <span style="font-size:10px;color:var(--text2)">Muchos</span>
          </div>
        </div>
      </div>

    </div>
  `;

  ceFotRenderRespuestas();

  const canvas = document.getElementById('ce-fot-canvas');
  ceFot.canvas  = canvas;
  ceFot.ctx     = canvas.getContext('2d');
  ceFot.respondido = false;
  ceFot.fotones  = [];
  ceFot.spawnAcc = 0;

  function ajustar() {
    canvas.width  = canvas.offsetWidth  || 500;
    canvas.height = canvas.offsetHeight || 340;
  }
  ajustar();
  window.addEventListener('resize', ajustar);

  ceFotSetFrec(ceFot.frecuencia);
  ceFotSetInt(ceFot.intensidad);
  ceFotActualizarZoomBtn();

  if (ceFot.rafId) cancelAnimationFrame(ceFot.rafId);
  function loop() {
    ceFot.t += 0.03;
    ceFotRender();
    ceFot.rafId = requestAnimationFrame(loop);
  }
  loop();
}

function ceFotRenderRespuestas() {
  const nv   = CE_NIVELES_FOTONES[ceFot.nivelIdx];
  const cont = document.getElementById('ce-fot-respuestas');
  if (!cont) return;
  cont.innerHTML = '';
  nv.respuestas.forEach((r, i) => {
    const btn = document.createElement('button');
    btn.className   = 'ce-resp-btn';
    btn.textContent = r.label;
    btn.addEventListener('click', () => ceFotResponder(i));
    cont.appendChild(btn);
  });
}

function ceFotResponder(idx) {
  if (ceFot.respondido) return;
  ceFot.respondido = true;
  const nv   = CE_NIVELES_FOTONES[ceFot.nivelIdx];
  const resp = nv.respuestas[idx];
  const ok   = resp.ok;

  if (!ok) ceFot.errores++;
  else      ceFot.puntaje += 100;

  document.querySelectorAll('#ce-fot-respuestas .ce-resp-btn').forEach((b, i) => {
    b.classList.add(nv.respuestas[i].ok ? 'correcto' : 'incorrecto');
    b.disabled = true;
  });

  const expEl = document.getElementById('ce-fot-exp');
  if (expEl) {
    expEl.textContent = resp.exp;
    expEl.className   = `ce-exp ${ok ? 'ok' : 'err'}`;
    expEl.classList.remove('hidden');
  }

  const esUltimo = ceFot.nivelIdx >= CE_NIVELES_FOTONES.length - 1;
  const btnSig   = document.createElement('button');
  btnSig.className   = 'ce-btn ce-btn-next';
  btnSig.style.marginTop = '8px';
  btnSig.textContent = esUltimo ? 'Ver conclusión →' : `Desafío ${nv.nivel + 1} →`;
  btnSig.addEventListener('click', () => {
    if (esUltimo) {
      ceFot.nivelIdx = 0;
      ceFotFinal();
    } else {
      ceFot.nivelIdx++;
      ceFot.respondido = false;
      ceModuloFotones(document.getElementById('ce-body'));
    }
  });
  const card = document.getElementById('ce-fot-desafio');
  if (card) card.appendChild(btnSig);
}

function ceFotIrNivel(idx) {
  if (idx >= ceFot.nivelIdx) return;
  ceFot.nivelIdx   = idx;
  ceFot.respondido = false;
  if (ceFot.rafId) { cancelAnimationFrame(ceFot.rafId); ceFot.rafId = null; }
  ceModuloFotones(document.getElementById('ce-body'));
}

function ceFotSetFrec(val) {
  ceFot.frecuencia = parseFloat(val);
  document.getElementById('ce-fot-frec-val').textContent = Math.round(val) + '%';
  /* Badge del espectro (reutiliza CE_ESPECTRO) */
  const seg = CE_ESPECTRO.find(e => val >= e.fMin && val <= e.fMax) || CE_ESPECTRO[0];
  const badge = document.getElementById('ce-fot-espectro');
  if (badge) {
    badge.textContent = seg.nombre;
    badge.style.background  = seg.color + '25';
    badge.style.color       = seg.color;
    badge.style.borderColor = seg.color + '60';
  }
}

function ceFotSetInt(val) {
  ceFot.intensidad = parseFloat(val);
  document.getElementById('ce-fot-int-val').textContent = Math.round(val) + '%';
}

function ceFotActualizarZoomBtn() {
  const btn = document.getElementById('ce-fot-zoom-btn');
  if (btn) btn.textContent = ceFot.zoom
    ? '🌊 Ver vista clásica (onda)'
    : '🔍 Ver vista cuántica (zoom)';
}

function ceFotToggleZoom() {
  ceFot.zoom = !ceFot.zoom;
  ceFot.fotones = [];
  ceFotActualizarZoomBtn();
}

/* ── Render: vista clásica (onda) o cuántica (fotones) ── */
function ceFotRender() {
  const canvas = ceFot.canvas;
  if (!canvas) return;
  const ctx = ceFot.ctx;
  const W = canvas.width, H = canvas.height;
  const t = ceFot.t;
  const f = ceFot.frecuencia;
  const I = ceFot.intensidad;
  const seg = CE_ESPECTRO.find(e => f >= e.fMin && f <= e.fMax) || CE_ESPECTRO[0];

  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#0a0520'); bg.addColorStop(1,'#04020f');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  if (!ceFot.zoom) {
    ceFotRenderOnda(ctx, W, H, t, f, I, seg);
  } else {
    ceFotRenderFotones(ctx, W, H, t, f, I, seg);
  }

  /* Etiqueta de vista */
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '10px Orbitron,monospace'; ctx.textAlign = 'left';
  ctx.fillText(ceFot.zoom ? '🔍 VISTA CUÁNTICA — fotones individuales'
                          : '🌊 VISTA CLÁSICA — onda continua', 12, 18);
}

/* Vista clásica: onda cuya amplitud = intensidad, color/λ = frecuencia */
function ceFotRenderOnda(ctx, W, H, t, f, I, seg) {
  const cx = 50, cy = H / 2;
  const lambda = Math.max(24, W * 0.6 / (1 + f * 0.05));
  const amp    = (H * 0.10) + (I / 100) * (H * 0.28);   /* intensidad → amplitud */
  const speed  = 1 + f * 0.02;

  /* Electrón oscilante (fuente) */
  const oscY = cy + Math.sin(t * speed) * Math.min(amp, 40);
  ctx.save();
  ctx.shadowColor = '#ff5252'; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.arc(cx, oscY, 10, 0, Math.PI*2);
  ctx.fillStyle = '#ef5350'; ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('−', cx, oscY);

  /* Onda */
  ctx.beginPath();
  ctx.strokeStyle = seg.color; ctx.lineWidth = 2.5;
  for (let px = cx; px < W; px++) {
    const phase = (px - cx) / lambda * Math.PI * 2 - t * speed;
    const y = cy + Math.sin(phase) * amp * Math.min(1, (px - cx) / 70);
    if (px === cx) ctx.moveTo(px, y); else ctx.lineTo(px, y);
  }
  ctx.stroke();

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = seg.color; ctx.textAlign = 'right';
  ctx.font = '10px Exo 2,sans-serif';
  ctx.fillText(`amplitud ∝ intensidad (${Math.round(I)}%)`, W - 10, cy - amp - 8);
}

/* Vista cuántica: fotones individuales que RECORREN la forma de onda.
   Cada fotón avanza en x a velocidad constante y su altura (y) sigue
   la misma sinusoide de la onda clásica: así "la onda se pixela". */
function ceFotRenderFotones(ctx, W, H, t, f, I, seg) {
  const cx = 50, cy = H / 2;
  const lambda = Math.max(60, W * 0.55 / (1 + f * 0.04));  /* longitud de onda en px */
  const amp    = (H * 0.12) + (I / 100) * (H * 0.26);       /* intensidad → amplitud */
  const vx     = 2.4;                                       /* velocidad horizontal fija */
  const k      = (Math.PI * 2) / lambda;                    /* número de onda */

  /* ── Dibujar la onda guía tenue, para que se vea la forma que siguen ── */
  ctx.save();
  ctx.strokeStyle = seg.color + '33'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]);
  ctx.beginPath();
  for (let px = cx; px < W; px++) {
    const env = Math.min(1, (px - cx) / 60);   /* envolvente de arranque suave */
    const y = cy + Math.sin(k * (px - cx) - t * 2.2) * amp * env;
    if (px === cx) ctx.moveTo(px, y); else ctx.lineTo(px, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  /* ── Fuente oscilante ── */
  const srcY = cy + Math.sin(-t * 2.2) * amp * 0.4;
  ctx.save();
  ctx.shadowColor = '#ff5252'; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(cx, srcY, 10, 0, Math.PI*2);
  ctx.fillStyle = '#ef5350'; ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('−', cx, srcY);

  /* ── Emitir fotones según la intensidad ── */
  const tasa = 0.02 + (I / 100) * 0.35;   /* fotones por frame */
  ceFot.spawnAcc += tasa;
  while (ceFot.spawnAcc >= 1 && ceFot.fotones.length < 160) {
    ceFot.spawnAcc -= 1;
    /* fase0: cada fotón "nace" con la fase actual de la fuente para que
       todos juntos tracen la onda al avanzar */
    ceFot.fotones.push({ x: cx + 10, fase0: t * 2.2 });
  }

  /* Energía por fotón → radio visual */
  const r = 2.5 + (f / 100) * 7;

  /* ── Actualizar y dibujar: y se recalcula sobre la onda ── */
  ceFot.fotones = ceFot.fotones.filter(p => p.x < W + 20);
  ceFot.fotones.forEach(p => {
    p.x += vx;
    const env = Math.min(1, (p.x - cx) / 60);
    const y = cy + Math.sin(k * (p.x - cx) - t * 2.2) * amp * env;
    ctx.save();
    ctx.shadowColor = seg.color; ctx.shadowBlur = 8 + (f/100)*10;
    ctx.beginPath(); ctx.arc(p.x, y, r, 0, Math.PI*2);
    ctx.fillStyle = seg.color; ctx.fill();
    ctx.restore();
  });

  /* Info */
  ctx.fillStyle = seg.color; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
  ctx.font = '10px Exo 2,sans-serif';
  ctx.fillText(`E = hf  →  cada fotón: ${f < 38 ? 'poca' : f > 62 ? 'mucha' : 'media'} energía`, W - 10, 22);
  ctx.fillText(`nº de fotones ∝ intensidad (${Math.round(I)}%)`, W - 10, 38);
}

function ceFotFinal() {
  if (ceFot.rafId) { cancelAnimationFrame(ceFot.rafId); ceFot.rafId = null; }
  const body = document.getElementById('ce-body');
  body.innerHTML = `
    <div class="ce-final-wrap">
      <div class="ce-final-title retro-text">💡 MÓDULO B COMPLETADO</div>
      <div class="ce-final-bloques">
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">🌊</div>
          <div class="ce-bloque-titulo">La onda es fotones</div>
          <div class="ce-bloque-texto">
            Lo que la física clásica ve como una onda continua es, de cerca,
            un chorro de <strong>fotones individuales</strong>. La energía viene en
            paquetes discretos, no de forma continua.
          </div>
        </div>
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">⚡</div>
          <div class="ce-bloque-titulo">Frecuencia = energía</div>
          <div class="ce-bloque-texto">
            Según <strong>E = h·f</strong>, la frecuencia determina la energía de
            CADA fotón. Más frecuencia → fotones más energéticos (y peligrosos).
          </div>
        </div>
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">🔢</div>
          <div class="ce-bloque-titulo">Intensidad = cantidad</div>
          <div class="ce-bloque-texto">
            La intensidad NO cambia la energía de cada fotón: cambia
            <strong>cuántos fotones</strong> hay. Mucha luz tenue = muchos fotones débiles.
          </div>
        </div>
      </div>
      <div class="ce-final-mensaje">
        "Intensidad y frecuencia son cosas distintas: una cuenta <em>cuántos</em> fotones,
        la otra mide <em>cuánta energía</em> lleva cada uno. Entender esto es la clave del
        efecto fotoeléctrico que le dio el Nobel a Einstein."
      </div>
      <div class="ms-btn-row" style="justify-content:center;gap:14px">
        <button class="ce-btn" onclick="ceFot.nivelIdx=0;ceModuloFotones(document.getElementById('ce-body'))">↺ Repetir módulo</button>
        <button class="ce-btn ce-btn-next" onclick="ceIniciarEtapa(2)">Siguiente módulo →</button>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════════════
   ETAPA 2 · MÓDULO C — DIFERENCIA ENTRE FAMILIAS
   Misma carga, distinta masa → distinta respuesta.
   Dos vistas interactivas:
     🧲 Brújula cuántica: el momento magnético μ = g(q/2m)S
        hace que el electrón se alinee fuerte y rápido, el
        muón débil y lento, el tau casi nada.
     🛡 Túnel de partículas: a más masa, más penetración y
        menos radiación emitida al frenarse.
   Desafíos de opción múltiple como los demás módulos.
   ════════════════════════════════════════════════════════ */
const CE_FAMILIAS = {
  'e-':  { label: 'Electrón', sym: 'e⁻', masa: 1,    momento: 1,       color: '#4fc3f7' },
  'mu-': { label: 'Muón',     sym: 'μ⁻', masa: 207,  momento: 1/207,   color: '#b39ddb' },
  'tau': { label: 'Tau',      sym: 'τ⁻', masa: 3477, momento: 1/3477,  color: '#e040fb' },
};

const CE_NIVELES_FAMILIAS = [
  {
    nivel: 1,
    titulo: 'La brújula cuántica',
    vista: 'brujula',
    instruccion: 'Selecciona cada partícula y pulsa el campo magnético. Observa qué tan rápido y fuerte se alinea cada una.',
    pregunta: 'Electrón, muón y tau tienen la MISMA carga. ¿Por qué el electrón se alinea con el campo magnético mucho más fuerte que el tau?',
    respuestas: [
      { label: 'Porque el electrón tiene más carga que el tau', ok: false,
        exp: 'No. Los tres tienen exactamente la misma carga (−1). La diferencia no está en la carga.' },
      { label: 'Porque el momento magnético es inversamente proporcional a la masa (μ ∝ q/m)', ok: true,
        exp: '¡Correcto! μ = g(q/2m)S: a igual carga, el momento magnético depende de 1/masa. El electrón es ligero → imán potente. El tau es 3477 veces más pesado → imán muchísimo más débil.' },
      { label: 'Porque el tau no es magnético en absoluto', ok: false,
        exp: 'El tau sí tiene momento magnético, pero es ínfimo por su enorme masa. No es cero, solo muy débil.' },
    ]
  },
  {
    nivel: 2,
    titulo: 'El muón, un imán débil',
    vista: 'brujula',
    instruccion: 'Compara la alineación del electrón con la del muón (207 veces más pesado).',
    pregunta: 'El muón pesa unas 207 veces más que el electrón. ¿Cómo es su "fuerza magnética" (momento) comparada con la del electrón?',
    respuestas: [
      { label: 'Unas 207 veces MÁS débil', ok: true,
        exp: '¡Correcto! Como μ ∝ 1/masa, si el muón pesa 207 veces más, su momento magnético es unas 207 veces menor. Es un imán mucho más débil pese a tener la misma carga.' },
      { label: 'Unas 207 veces MÁS fuerte', ok: false,
        exp: 'Al revés: más masa significa momento magnético MENOR, no mayor. μ es inversamente proporcional a la masa.' },
      { label: 'Exactamente igual: la masa no afecta el magnetismo', ok: false,
        exp: 'La masa sí importa. A igual carga y espín, μ = g(q/2m)S depende de 1/m. Más masa → imán más débil.' },
    ]
  },
  {
    nivel: 3,
    titulo: 'El túnel de partículas',
    vista: 'tunel',
    instruccion: 'Cambia a la vista TÚNEL. Lanza cada partícula contra el material denso y observa su rastro.',
    pregunta: 'Lanzas un electrón contra un bloque de material denso. ¿Qué observas?',
    respuestas: [
      { label: 'Atraviesa limpiamente sin interactuar', ok: false,
        exp: 'Eso le pasa al muón, no al electrón. El electrón, por ser ligero, se frena bruscamente y radia mucho.' },
      { label: 'Una gran lluvia de fotones y pares e⁺e⁻ (cascada electromagnética)', ok: true,
        exp: '¡Correcto! El electrón es ligero, así que se frena de golpe en el material y emite una cascada de radiación: fotones que crean pares e⁺e⁻, que a su vez radian más. Es la "lluvia electromagnética".' },
      { label: 'Se desintegra en quarks inmediatamente', ok: false,
        exp: 'El electrón no se desintegra: es estable. Lo que hace es frenarse y radiar una cascada electromagnética.' },
    ]
  },
  {
    nivel: 4,
    titulo: 'El muón fantasma',
    vista: 'tunel',
    instruccion: 'Lanza un muón contra el mismo material. Compara su rastro con el del electrón.',
    pregunta: '¿Por qué los muones atraviesan la materia "como fantasmas", dejando una traza limpia y penetrante?',
    respuestas: [
      { label: 'Porque no tienen carga eléctrica', ok: false,
        exp: 'El muón sí tiene carga (−1), igual que el electrón. Su penetración no se debe a falta de carga.' },
      { label: 'Porque viajan más rápido que la luz', ok: false,
        exp: 'Nada supera a la luz. Los muones penetran por su masa, no por una velocidad imposible.' },
      { label: 'Por su gran masa: es difícil frenarlos y radian poco al hacerlo', ok: true,
        exp: '¡Correcto! Al ser ~207 veces más pesado que el electrón, al muón le cuesta mucho frenarse y emite poca radiación. Por eso atraviesa metros de roca casi sin inmutarse, como un fantasma.' },
    ]
  },
  {
    nivel: 5,
    titulo: 'Masa, radiación y familias',
    vista: 'tunel',
    instruccion: 'Lanza el tau: se desintegra casi al instante. Reflexiona sobre las tres familias.',
    pregunta: 'En general, ¿cómo se relacionan la masa de un leptón y la radiación que emite al frenarse?',
    respuestas: [
      { label: 'A mayor masa, MÁS radiación emite', ok: false,
        exp: 'Es al revés. Las partículas ligeras (electrón) radian mucho al frenarse; las pesadas (muón) radian poco.' },
      { label: 'La masa no influye: todas radian igual', ok: false,
        exp: 'La masa influye mucho. La radiación de frenado es mucho mayor para partículas ligeras que para pesadas.' },
      { label: 'A mayor masa, MENOS radiación y más penetración', ok: true,
        exp: '¡Correcto! A más masa, más cuesta frenar la partícula y menos radiación emite. La electrodinámica trata igual a las tres familias (misma carga), pero el universo las distingue por su inercia (masa).' },
    ]
  },
];

let ceFam = {
  canvas:    null,
  ctx:       null,
  rafId:     null,
  t:         0,
  sel:       'e-',    /* partícula seleccionada */
  campoOn:   false,   /* brújula: campo magnético activado */
  campoT0:   undefined,/* instante en que se activó el campo */
  disparo:   null,    /* túnel: {t, particula} animación en curso */
  nivelIdx:  0,
  respondido:false,
  puntaje:   0,
  errores:   0,
  angulos:   {},      /* brújula: ángulo actual de cada partícula */
};

function ceModuloFamilias(body) {
  const nv = CE_NIVELES_FAMILIAS[ceFam.nivelIdx];
  ceFam.vista = nv.vista;

  document.getElementById('ce-instruccion').textContent =
    `Etapa 2 · QED — Familias: ${nv.instruccion}`;

  const esBrujula = nv.vista === 'brujula';

  body.innerHTML = `
    <div class="ce-cable-wrap">

      <!-- Panel izquierdo -->
      <div class="ce-fuerzas-panel">

        <div class="ce-panel-card ce-desafio-card" id="ce-fam-desafio">
          <div class="ce-panel-title">Desafío ${nv.nivel}/5 — ${nv.titulo}</div>
          <p class="ce-desafio-desc" style="font-size:10px;color:var(--text2);line-height:1.5;margin:4px 0 8px">
            ${nv.instruccion}
          </p>
          <p class="ce-desafio-pregunta">${nv.pregunta}</p>
          <div class="ce-respuestas" id="ce-fam-respuestas"></div>
          <div class="ce-exp hidden" id="ce-fam-exp"></div>
          <div class="ce-fuerzas-prog" style="margin-top:8px">
            ${CE_NIVELES_FAMILIAS.map((_,i) => `
              <button class="ms-e1-dot ${i < ceFam.nivelIdx ? 'done' : i === ceFam.nivelIdx ? 'current' : ''}"
                   title="Desafío ${i+1}"
                   ${i < ceFam.nivelIdx ? `onclick="ceFamIrNivel(${i})"` : 'disabled'}
              ></button>
            `).join('')}
            <span class="ms-e1-niveles-label">${nv.nivel}/5</span>
          </div>
        </div>

        <div class="ce-panel-card" style="margin-top:8px">
          <div class="ce-panel-title">Momento magnético</div>
          <div class="ce-formula-box" style="margin-top:4px">
            μ = g · (q / 2m) · S<br>
            <small>μ ∝ 1/masa — más masa, imán más débil</small>
          </div>
          <p style="font-size:9px;color:var(--text2);margin-top:6px;line-height:1.5">
            Misma carga en las 3 familias, pero el muón pesa ×207 y el tau ×3477.
            Su inercia los hace responder muy distinto.
          </p>
        </div>

        <div class="ms-btn-row" style="margin-top:8px">
          <button class="calc-toggle-btn" onclick="Calculadora.toggle()">🧮 Calc</button>
        </div>
      </div>

      <!-- Canvas + controles -->
      <div class="ce-canvas-wrap">
        <canvas id="ce-fam-canvas" class="ce-canvas"></canvas>
        <div class="ce-ondas-controles">
          <label class="ce-ctrl-label">Partícula:</label>
          <div class="ce-fam-selector" id="ce-fam-selector"></div>
          <div class="ms-btn-row" style="margin-top:8px;justify-content:center">
            ${esBrujula
              ? `<button class="ce-qed-ctrl-btn ce-qed-play" id="ce-fam-accion" onclick="ceFamToggleCampo()">🧲 Activar campo</button>`
              : `<button class="ce-qed-ctrl-btn ce-qed-play" id="ce-fam-accion" onclick="ceFamDisparar()">▶ Lanzar al material</button>`
            }
          </div>
        </div>
      </div>

    </div>
  `;

  ceFamRenderRespuestas();
  ceFamRenderSelector();

  const canvas = document.getElementById('ce-fam-canvas');
  ceFam.canvas = canvas;
  ceFam.ctx    = canvas.getContext('2d');
  ceFam.respondido = false;
  ceFam.campoOn = false;
  ceFam.campoT0 = undefined;
  ceFam.disparo = null;
  ceFam.angulos = { 'e-': Math.PI/2, 'mu-': Math.PI/2, 'tau': Math.PI/2 };

  function ajustar() {
    canvas.width  = canvas.offsetWidth  || 500;
    canvas.height = canvas.offsetHeight || 340;
  }
  ajustar();
  window.addEventListener('resize', ajustar);

  if (ceFam.rafId) cancelAnimationFrame(ceFam.rafId);
  function loop() {
    ceFam.t += 0.03;
    ceFamRender();
    ceFam.rafId = requestAnimationFrame(loop);
  }
  loop();
}

function ceFamRenderSelector() {
  const cont = document.getElementById('ce-fam-selector');
  if (!cont) return;
  cont.innerHTML = Object.keys(CE_FAMILIAS).map(key => {
    const p = CE_FAMILIAS[key];
    const sel = ceFam.sel === key ? 'selected' : '';
    const masaTxt = p.masa === 1 ? '×1' : '×' + p.masa;
    return `<button class="ce-fam-btn ${sel}" style="--pc:${p.color}" onclick="ceFamSel('${key}')">
      <span class="ce-fam-sym" style="color:${p.color}">${p.sym}</span>
      <span class="ce-fam-nom">${p.label}</span>
      <span class="ce-fam-masa">masa ${masaTxt}</span>
    </button>`;
  }).join('');
}

function ceFamSel(key) {
  ceFam.sel = key;
  ceFam.campoOn = false;
  ceFam.campoT0 = undefined;
  ceFam.disparo = null;
  ceFam.angulos[key] = Math.PI/2;   /* arranca apuntando hacia abajo */
  ceFamRenderSelector();
  const btn = document.getElementById('ce-fam-accion');
  if (btn && ceFam.vista === 'brujula') btn.textContent = '🧲 Activar campo';
}

function ceFamToggleCampo() {
  ceFam.campoOn = !ceFam.campoOn;
  ceFam.campoT0 = undefined;   /* reinicia la oscilación */
  if (ceFam.campoOn) {
    /* La aguja arranca "caída" para que la oscilación hacia arriba sea visible */
    ceFam.angulos[ceFam.sel] = Math.PI/2;
  }
  const btn = document.getElementById('ce-fam-accion');
  if (btn) btn.textContent = ceFam.campoOn ? '⊗ Apagar campo' : '🧲 Activar campo';
}

function ceFamDisparar() {
  ceFam.disparo = { t: 0, particula: ceFam.sel };
}

function ceFamRenderRespuestas() {
  const nv   = CE_NIVELES_FAMILIAS[ceFam.nivelIdx];
  const cont = document.getElementById('ce-fam-respuestas');
  if (!cont) return;
  cont.innerHTML = '';
  nv.respuestas.forEach((r, i) => {
    const btn = document.createElement('button');
    btn.className   = 'ce-resp-btn';
    btn.textContent = r.label;
    btn.addEventListener('click', () => ceFamResponder(i));
    cont.appendChild(btn);
  });
}

function ceFamResponder(idx) {
  if (ceFam.respondido) return;
  ceFam.respondido = true;
  const nv   = CE_NIVELES_FAMILIAS[ceFam.nivelIdx];
  const resp = nv.respuestas[idx];
  const ok   = resp.ok;

  if (!ok) ceFam.errores++;
  else      ceFam.puntaje += 100;

  document.querySelectorAll('#ce-fam-respuestas .ce-resp-btn').forEach((b, i) => {
    b.classList.add(nv.respuestas[i].ok ? 'correcto' : 'incorrecto');
    b.disabled = true;
  });

  const expEl = document.getElementById('ce-fam-exp');
  if (expEl) {
    expEl.textContent = resp.exp;
    expEl.className   = `ce-exp ${ok ? 'ok' : 'err'}`;
    expEl.classList.remove('hidden');
  }

  const esUltimo = ceFam.nivelIdx >= CE_NIVELES_FAMILIAS.length - 1;
  const btnSig   = document.createElement('button');
  btnSig.className   = 'ce-btn ce-btn-next';
  btnSig.style.marginTop = '8px';
  btnSig.textContent = esUltimo ? 'Ver conclusión →' : `Desafío ${nv.nivel + 1} →`;
  btnSig.addEventListener('click', () => {
    if (esUltimo) {
      ceFam.nivelIdx = 0;
      ceFamFinal();
    } else {
      ceFam.nivelIdx++;
      ceFam.respondido = false;
      ceModuloFamilias(document.getElementById('ce-body'));
    }
  });
  const card = document.getElementById('ce-fam-desafio');
  if (card) card.appendChild(btnSig);
}

function ceFamIrNivel(idx) {
  if (idx >= ceFam.nivelIdx) return;
  ceFam.nivelIdx   = idx;
  ceFam.respondido = false;
  if (ceFam.rafId) { cancelAnimationFrame(ceFam.rafId); ceFam.rafId = null; }
  ceModuloFamilias(document.getElementById('ce-body'));
}

/* ── Render según la vista ── */
function ceFamRender() {
  const canvas = ceFam.canvas;
  if (!canvas) return;
  const ctx = ceFam.ctx;
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#0a0520'); bg.addColorStop(1,'#04020f');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  if (ceFam.vista === 'brujula') ceFamRenderBrujula(ctx, W, H);
  else                            ceFamRenderTunel(ctx, W, H);
}

/* Vista brújula: la aguja oscila al alinearse con el campo.
   Modelo de oscilador amortiguado: ángulo(t) = objetivo + A·e^(−λt)·cos(ωt)
   donde la amplitud inicial A, la frecuencia ω y el amortiguamiento λ
   dependen del momento magnético (μ ∝ 1/masa). Partículas ligeras
   (electrón) oscilan amplio y rápido; pesadas (tau) casi no se mueven. */
function ceFamRenderBrujula(ctx, W, H) {
  const cx = W / 2, cy = H / 2;
  const p  = CE_FAMILIAS[ceFam.sel];

  /* Campo magnético externo (flechas verticales hacia arriba) si está activo */
  if (ceFam.campoOn) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,230,118,0.3)'; ctx.lineWidth = 1.5;
    for (let x = 40; x < W; x += 55) {
      ctx.beginPath(); ctx.moveTo(x, H*0.85); ctx.lineTo(x, H*0.15); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, H*0.15); ctx.lineTo(x-4, H*0.15+8); ctx.lineTo(x+4, H*0.15+8);
      ctx.closePath(); ctx.fillStyle = 'rgba(0,230,118,0.3)'; ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(0,230,118,0.6)'; ctx.font = '11px Orbitron,monospace';
    ctx.textAlign = 'left'; ctx.fillText('Campo B ↑', 12, 24);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px Orbitron,monospace';
    ctx.textAlign = 'left'; ctx.fillText('Campo B apagado — pulsa Activar campo', 12, 24);
  }

  const objetivo = -Math.PI / 2;   /* alineado con el campo (hacia arriba) */
  let ang;

  if (ceFam.campoOn) {
    /* Tiempo desde que se activó el campo */
    if (ceFam.campoT0 === undefined) ceFam.campoT0 = ceFam.t;
    const dt = ceFam.t - ceFam.campoT0;

    /* Parámetros del oscilador según el momento magnético.
       Exagerados a propósito para que la diferencia sea muy visible. */
    const fuerza = p.momento;                       /* e-:1, mu-:~0.0048, tau:~0.00029 */
    /* Escala logarítmica para que las 3 sean perceptibles pero bien distintas */
    const vigor  = 0.33 + 0.67 * (Math.log10(fuerza * 3477) / Math.log10(3477));
    /* vigor: electrón ≈ 1.0, muón ≈ 0.69, tau ≈ 0.33 */

    const omega  = 3.5 * vigor + 0.6;               /* frecuencia de oscilación */
    const lambda = 0.4 * vigor + 0.15;              /* amortiguamiento */
    const ampIni = (Math.PI * 0.9) * vigor;         /* amplitud inicial de la vibración */

    /* Partícula arranca "caída" hacia abajo y oscila hacia el objetivo */
    const envol = Math.exp(-lambda * dt);
    ang = objetivo + ampIni * envol * Math.cos(omega * dt);
    ceFam.angulos[ceFam.sel] = ang;
  } else {
    /* Sin campo: cae lentamente hacia abajo (reposo) con leve bamboleo */
    ceFam.campoT0 = undefined;
    const reposo = Math.PI / 2;   /* apuntando hacia abajo */
    let a = ceFam.angulos[ceFam.sel];
    a += (reposo - a) * 0.06;
    ceFam.angulos[ceFam.sel] = a;
    ang = a + Math.sin(ceFam.t * 1.5) * 0.03;
  }

  /* Círculo de la brújula */
  const R = Math.min(W, H) * 0.3;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.stroke();
  /* Marca del eje del campo (arriba) */
  ctx.strokeStyle = 'rgba(0,230,118,0.25)'; ctx.setLineDash([3,4]);
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - R); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  /* Aguja (imán de la partícula) */
  const ax = cx + Math.cos(ang) * R * 0.85;
  const ay = cy + Math.sin(ang) * R * 0.85;
  ctx.save();
  ctx.shadowColor = p.color; ctx.shadowBlur = 16;
  ctx.strokeStyle = p.color; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx*2 - ax, cy*2 - ay); ctx.lineTo(ax, ay); ctx.stroke();
  ctx.restore();
  /* Partícula en la punta */
  ctx.save();
  ctx.shadowColor = p.color; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.arc(ax, ay, 16, 0, Math.PI*2);
  ctx.fillStyle = p.color; ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Orbitron,monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(p.sym, ax, ay);

  /* Indicador de fuerza de alineación */
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'right';
  ctx.fillStyle = p.color; ctx.font = '11px Exo 2,sans-serif';
  const desc = p.masa === 1 ? 'imán potente: oscila amplio y rápido'
             : p.masa < 500 ? 'imán débil: oscila poco y lento'
             : 'imán muy débil: apenas se inmuta';
  ctx.fillText(`${p.label} — ${desc} (μ ∝ 1/${p.masa})`, W-10, H-14);
}

/* Vista túnel: la partícula entra a un bloque denso y deja rastro según su masa */
function ceFamRenderTunel(ctx, W, H) {
  const cy = H / 2;
  const p  = CE_FAMILIAS[ceFam.sel];
  const bloqueX = W * 0.42;

  /* Bloque de material denso */
  ctx.save();
  ctx.fillStyle = 'rgba(120,130,160,0.12)';
  ctx.fillRect(bloqueX, 0, W - bloqueX, H);
  ctx.strokeStyle = 'rgba(160,170,200,0.3)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bloqueX, 0); ctx.lineTo(bloqueX, H); ctx.stroke();
  /* Átomos del material */
  for (let gx = bloqueX + 25; gx < W; gx += 42) {
    for (let gy = 25; gy < H; gy += 42) {
      ctx.beginPath(); ctx.arc(gx, gy, 3, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(160,170,200,0.25)'; ctx.fill();
    }
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(200,210,240,0.5)'; ctx.font = '10px Orbitron,monospace';
  ctx.textAlign = 'center'; ctx.fillText('MATERIAL DENSO', (bloqueX + W)/2, 18);

  const d = ceFam.disparo;
  if (!d) {
    /* Partícula esperando a la izquierda */
    ceFamDibujarParticula(ctx, W*0.12, cy, p);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px Orbitron,monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Pulsa ▶ Lanzar al material', W*0.3, H*0.85);
    return;
  }

  d.t += 0.012;
  const pd = CE_FAMILIAS[d.particula];

  if (d.particula === 'e-') {
    /* Electrón: avanza hasta el borde del bloque y explota en cascada EM */
    const entra = Math.min(d.t / 0.6, 1);
    const x = W*0.12 + entra * (bloqueX - W*0.12 + 20);
    if (entra < 1) {
      ceFamDibujarParticula(ctx, x, cy, pd);
    } else {
      /* Cascada: fotones y pares saliendo del punto de impacto */
      const impX = bloqueX + 15;
      ceFamCascada(ctx, impX, cy, d.t - 0.6, pd);
      ctx.fillStyle = pd.color; ctx.font = '10px Exo 2,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('💥 Lluvia electromagnética: fotones + pares e⁺e⁻', (bloqueX+W)/2, H-14);
    }
  } else if (d.particula === 'mu-') {
    /* Muón: traza limpia que atraviesa todo el bloque */
    const prog = Math.min(d.t / 1.4, 1);
    const x = W*0.12 + prog * (W*0.9 - W*0.12);
    /* Rastro */
    ctx.save();
    ctx.strokeStyle = pd.color + '66'; ctx.lineWidth = 2; ctx.setLineDash([2,4]);
    ctx.beginPath(); ctx.moveTo(W*0.12, cy); ctx.lineTo(x, cy); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
    ceFamDibujarParticula(ctx, x, cy, pd);
    ctx.fillStyle = pd.color; ctx.font = '10px Exo 2,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('👻 Traza limpia y penetrante — casi sin radiación', (bloqueX+W)/2, H-14);
  } else {
    /* Tau: entra un poco y se desintegra */
    const entra = Math.min(d.t / 0.5, 1);
    const x = W*0.12 + entra * (bloqueX - W*0.12 + 40);
    if (entra < 1) {
      ceFamDibujarParticula(ctx, x, cy, pd);
    } else {
      /* Desintegración: pequeña estrella de productos */
      const impX = bloqueX + 35;
      const n = 5;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const r = (d.t - 0.5) * 120;
        ctx.beginPath();
        ctx.arc(impX + Math.cos(a)*r, cy + Math.sin(a)*r, 4, 0, Math.PI*2);
        ctx.fillStyle = ['#ff8a65','#4fc3f7','#b39ddb'][i%3]; ctx.fill();
      }
      ctx.fillStyle = pd.color; ctx.font = '10px Exo 2,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('⚡ Se desintegra por fuerza débil — apenas radia antes', (bloqueX+W)/2, H-14);
    }
  }
}

function ceFamDibujarParticula(ctx, x, y, p) {
  ctx.save();
  ctx.shadowColor = p.color; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI*2);
  ctx.fillStyle = p.color; ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Orbitron,monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(p.sym, x, y);
  ctx.textBaseline = 'alphabetic';
}

/* Cascada electromagnética para el electrón */
function ceFamCascada(ctx, x, y, dt, p) {
  const n = 24;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + i;
    const r = dt * (80 + (i % 5) * 40);
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r * 0.7;
    const esFoton = i % 2 === 0;
    ctx.save();
    ctx.shadowColor = esFoton ? '#ffd740' : p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(px, py, esFoton ? 3 : 4, 0, Math.PI*2);
    ctx.fillStyle = esFoton ? '#ffd740' : p.color; ctx.fill();
    ctx.restore();
  }
}

function ceFamFinal() {
  if (ceFam.rafId) { cancelAnimationFrame(ceFam.rafId); ceFam.rafId = null; }
  const body = document.getElementById('ce-body');
  body.innerHTML = `
    <div class="ce-final-wrap">
      <div class="ce-final-title retro-text">🧲 MÓDULO C COMPLETADO</div>
      <div class="ce-final-bloques">
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">🧲</div>
          <div class="ce-bloque-titulo">La brújula cuántica</div>
          <div class="ce-bloque-texto">
            Toda carga con espín es un pequeño imán: <strong>μ = g(q/2m)S</strong>.
            Como μ ∝ 1/masa, el electrón es un imán potente y el tau, 3477 veces
            más pesado, es un imán casi imperceptible.
          </div>
        </div>
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">👻</div>
          <div class="ce-bloque-titulo">El túnel de partículas</div>
          <div class="ce-bloque-texto">
            El electrón ligero se frena de golpe y radia una cascada. El muón pesado
            atraviesa la materia <strong>como un fantasma</strong>, casi sin radiar.
            A más masa, más penetración.
          </div>
        </div>
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">👨‍👩‍👧</div>
          <div class="ce-bloque-titulo">Tres familias</div>
          <div class="ce-bloque-texto">
            Electrón, muón y tau tienen la MISMA carga. La electrodinámica los trata
            igual, pero su <strong>masa (inercia)</strong> los hace comportarse de
            forma radicalmente distinta.
          </div>
        </div>
      </div>
      <div class="ce-final-mensaje">
        "La misma carga, pero distinta masa → distinta respuesta.
        La electrodinámica no distingue las familias; es la <em>inercia</em>
        la que marca la diferencia entre un electrón, un muón y un tau."
      </div>
      <div class="ms-btn-row" style="justify-content:center;gap:14px">
        <button class="ce-btn" onclick="ceFam.nivelIdx=0;ceModuloFamilias(document.getElementById('ce-body'))">↺ Repetir módulo</button>
        <button class="ce-btn ce-btn-next" onclick="ceIrEtapa(2)">Ir a Etapa 3 →</button>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════════════
   ETAPA 3 · MÓDULO A — EL ACOPLAMIENTO
   La carga eléctrica es la "fuerza del gancho" que conecta
   una partícula al campo EM. El usuario coloca partículas de
   distintas cargas en un campo externo y ve cómo la fuerza
   (y la probabilidad de emitir/absorber fotones) es
   proporcional a la carga.
   ════════════════════════════════════════════════════════ */
const CE_ACOPLES = [
  { key:'e-',  label:'Electrón',    sym:'e⁻',  carga:-1,    cargaTxt:'−1 e',   color:'#4fc3f7' },
  { key:'u',   label:'Quark up',    sym:'u',   carga: 2/3,  cargaTxt:'+2/3 e', color:'#ff6d00' },
  { key:'d',   label:'Quark down',  sym:'d',   carga:-1/3,  cargaTxt:'−1/3 e', color:'#ff8f00' },
  { key:'p',   label:'Protón',      sym:'p',   carga: 1,    cargaTxt:'+1 e',   color:'#ef5350' },
  { key:'nu',  label:'Neutrino',    sym:'νₑ',  carga: 0,    cargaTxt:'0',      color:'#78909c' },
];

const CE_NIVELES_ACOPLE = [
  {
    nivel: 1,
    titulo: 'El gancho al campo',
    sugerida: 'e-',
    instruccion: 'Selecciona el electrón (−1e) y activa el campo. Observa la fuerza máxima que siente.',
    pregunta: '¿Qué representa la carga eléctrica de una partícula en el campo electromagnético?',
    respuestas: [
      { label: 'La velocidad a la que viaja la partícula', ok: false,
        exp: 'No. La carga no es velocidad: es la intensidad con la que la partícula se "engancha" al campo EM.' },
      { label: 'La "fuerza del gancho" que la acopla al campo (constante de interacción)', ok: true,
        exp: '¡Correcto! La carga es la constante de acoplamiento: mide con qué fuerza la partícula se conecta al campo electromagnético. A más carga, más fuerte el gancho.' },
      { label: 'La masa de la partícula', ok: false,
        exp: 'La masa es otra propiedad distinta. La carga es específicamente el acoplamiento al campo EM, no cuánto pesa la partícula.' },
    ]
  },
  {
    nivel: 2,
    titulo: 'Carga fraccionaria',
    sugerida: 'd',
    instruccion: 'Ahora coloca un quark down (−1/3 e). Compara la fuerza con la del electrón.',
    pregunta: 'Un quark down tiene carga −1/3 e, un tercio de la del electrón. ¿Qué fuerza siente en el mismo campo?',
    respuestas: [
      { label: 'Una fuerza 3 veces MENOR que la del electrón', ok: true,
        exp: '¡Correcto! La fuerza es proporcional a la carga. Con 1/3 de la carga, el quark down siente 1/3 de la fuerza. Menos carga = acoplamiento más débil.' },
      { label: 'La misma fuerza que el electrón', ok: false,
        exp: 'No. La fuerza depende de la carga, y el quark down tiene solo 1/3 de la del electrón, así que siente 1/3 de la fuerza.' },
      { label: 'Una fuerza 3 veces MAYOR', ok: false,
        exp: 'Al revés: menos carga significa menos fuerza. Con 1/3 de carga siente 1/3 de la fuerza, no el triple.' },
    ]
  },
  {
    nivel: 3,
    titulo: 'El neutrino invisible',
    sugerida: 'nu',
    instruccion: 'Coloca un neutrino (carga 0) en el campo. Activa el campo y observa.',
    pregunta: 'El neutrino tiene carga 0. ¿Qué le ocurre en el campo electromagnético?',
    respuestas: [
      { label: 'Siente una fuerza pequeña pero existente', ok: false,
        exp: 'No. Con carga exactamente cero, el acoplamiento al campo EM es nulo: no siente NINGUNA fuerza.' },
      { label: 'Es repelido con fuerza máxima', ok: false,
        exp: 'No puede ser repelido ni atraído: sin carga, no hay gancho que lo conecte al campo. Lo ignora por completo.' },
      { label: 'No siente ninguna fuerza: no está acoplado al campo', ok: true,
        exp: '¡Correcto! Carga 0 = acoplamiento 0. El neutrino es "invisible" para el campo EM: lo atraviesa sin inmutarse. Por eso billones de neutrinos cruzan tu cuerpo cada segundo sin interactuar.' },
    ]
  },
  {
    nivel: 4,
    titulo: 'El signo importa',
    sugerida: 'u',
    instruccion: 'Coloca un quark up (+2/3 e). Observa la dirección de la fuerza comparada con el electrón.',
    pregunta: 'El quark up tiene carga +2/3 e (positiva). ¿En qué se diferencia su fuerza de la del electrón (−1e)?',
    respuestas: [
      { label: 'Apunta en dirección OPUESTA y es algo menor (2/3 vs 1)', ok: true,
        exp: '¡Correcto! El signo de la carga define la DIRECCIÓN de la fuerza: el up positivo va al revés que el electrón negativo. Y como su carga es 2/3, la fuerza es algo menor que la del electrón.' },
      { label: 'Apunta en la MISMA dirección que el electrón', ok: false,
        exp: 'No. El up es positivo y el electrón negativo: sus fuerzas en el campo apuntan en sentidos opuestos.' },
      { label: 'No hay diferencia: solo importa la magnitud', ok: false,
        exp: 'El signo sí importa: determina si la partícula es empujada en un sentido o en el contrario. La magnitud (2/3) define cuánta fuerza.' },
    ]
  },
  {
    nivel: 5,
    titulo: 'Acoplamiento y fotones',
    sugerida: 'p',
    instruccion: 'Prueba todas las partículas. Fíjate en el medidor de "intensidad del acoplamiento".',
    pregunta: '¿Qué significa que una partícula tenga mayor carga (mayor acoplamiento)?',
    respuestas: [
      { label: 'Que es más pesada', ok: false,
        exp: 'La carga y la masa son independientes. Más carga no significa más masa, sino más acoplamiento al campo EM.' },
      { label: 'Que siente más fuerza y emite/absorbe fotones con más probabilidad', ok: true,
        exp: '¡Correcto! A mayor carga, mayor acoplamiento: la partícula siente más fuerza en el campo Y tiene más probabilidad de emitir o absorber fotones. La carga gobierna toda la interacción electromagnética.' },
      { label: 'Que viaja más despacio', ok: false,
        exp: 'La carga no determina la velocidad. Determina la intensidad del acoplamiento: cuánta fuerza siente y con qué facilidad intercambia fotones.' },
    ]
  },
];

let ceAco = {
  canvas:    null,
  ctx:       null,
  rafId:     null,
  t:         0,
  sel:       'e-',
  campoOn:   false,
  nivelIdx:  0,
  respondido:false,
  puntaje:   0,
  errores:   0,
  px:        0,     /* posición x de la partícula (desplazamiento por la fuerza) */
  vx:        0,
};

function ceModuloAcoplamiento(body) {
  const nv = CE_NIVELES_ACOPLE[ceAco.nivelIdx];
  if (nv.sugerida) ceAco.sel = nv.sugerida;

  document.getElementById('ce-instruccion').textContent =
    `Etapa 3 · El Enjambre — Acoplamiento: ${nv.instruccion}`;

  body.innerHTML = `
    <div class="ce-cable-wrap">

      <!-- Panel izquierdo -->
      <div class="ce-fuerzas-panel">

        <div class="ce-panel-card ce-desafio-card" id="ce-aco-desafio">
          <div class="ce-panel-title">Desafío ${nv.nivel}/5 — ${nv.titulo}</div>
          <p class="ce-desafio-desc" style="font-size:10px;color:var(--text2);line-height:1.5;margin:4px 0 8px">
            ${nv.instruccion}
          </p>
          <p class="ce-desafio-pregunta">${nv.pregunta}</p>
          <div class="ce-respuestas" id="ce-aco-respuestas"></div>
          <div class="ce-exp hidden" id="ce-aco-exp"></div>
          <div class="ce-fuerzas-prog" style="margin-top:8px">
            ${CE_NIVELES_ACOPLE.map((_,i) => `
              <button class="ms-e1-dot ${i < ceAco.nivelIdx ? 'done' : i === ceAco.nivelIdx ? 'current' : ''}"
                   title="Desafío ${i+1}"
                   ${i < ceAco.nivelIdx ? `onclick="ceAcoIrNivel(${i})"` : 'disabled'}
              ></button>
            `).join('')}
            <span class="ms-e1-niveles-label">${nv.nivel}/5</span>
          </div>
        </div>

        <div class="ce-panel-card" style="margin-top:8px">
          <div class="ce-panel-title">La carga = acoplamiento</div>
          <div class="ce-formula-box" style="margin-top:4px">
            F ∝ q · E<br>
            <small>La fuerza es proporcional a la carga</small>
          </div>
          <p style="font-size:9px;color:var(--text2);margin-top:6px;line-height:1.5">
            La carga es la "fuerza del gancho" que conecta la partícula al campo EM.
            A mayor carga → mayor fuerza → más probabilidad de emitir/absorber fotones.
          </p>
        </div>

        <div class="ms-btn-row" style="margin-top:8px">
          <button class="calc-toggle-btn" onclick="Calculadora.toggle()">🧮 Calc</button>
        </div>
      </div>

      <!-- Canvas + controles -->
      <div class="ce-canvas-wrap">
        <canvas id="ce-aco-canvas" class="ce-canvas"></canvas>
        <div class="ce-ondas-controles">
          <label class="ce-ctrl-label">Partícula (elige su carga):</label>
          <div class="ce-fam-selector" id="ce-aco-selector"></div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;gap:10px">
            <div class="ce-aco-medidor-wrap">
              <span class="ce-ctrl-label" style="font-size:10px">Acoplamiento:</span>
              <div class="ce-aco-barra-bg"><div class="ce-aco-barra" id="ce-aco-barra"></div></div>
              <span id="ce-aco-pct" style="font-size:10px;font-family:'Orbitron';color:var(--gold)">—</span>
            </div>
            <button class="ce-qed-ctrl-btn ce-qed-play" id="ce-aco-accion" onclick="ceAcoToggleCampo()">🧲 Activar campo</button>
          </div>
        </div>
      </div>

    </div>
  `;

  ceAcoRenderRespuestas();
  ceAcoRenderSelector();

  const canvas = document.getElementById('ce-aco-canvas');
  ceAco.canvas = canvas;
  ceAco.ctx    = canvas.getContext('2d');
  ceAco.respondido = false;
  ceAco.campoOn = false;
  ceAco.px = 0; ceAco.vx = 0;

  function ajustar() {
    canvas.width  = canvas.offsetWidth  || 500;
    canvas.height = canvas.offsetHeight || 340;
  }
  ajustar();
  window.addEventListener('resize', ajustar);
  ceAcoActualizarMedidor();

  if (ceAco.rafId) cancelAnimationFrame(ceAco.rafId);
  function loop() {
    ceAco.t += 0.03;
    ceAcoRender();
    ceAco.rafId = requestAnimationFrame(loop);
  }
  loop();
}

function ceAcoRenderSelector() {
  const cont = document.getElementById('ce-aco-selector');
  if (!cont) return;
  cont.innerHTML = CE_ACOPLES.map(p => {
    const sel = ceAco.sel === p.key ? 'selected' : '';
    return `<button class="ce-fam-btn ${sel}" style="--pc:${p.color}" onclick="ceAcoSel('${p.key}')">
      <span class="ce-fam-sym" style="color:${p.color}">${p.sym}</span>
      <span class="ce-fam-nom">${p.label}</span>
      <span class="ce-fam-masa">${p.cargaTxt}</span>
    </button>`;
  }).join('');
}

function ceAcoSel(key) {
  ceAco.sel = key;
  ceAco.px = 0; ceAco.vx = 0;
  ceAco.campoOn = false;
  ceAcoRenderSelector();
  ceAcoActualizarMedidor();
  const btn = document.getElementById('ce-aco-accion');
  if (btn) btn.textContent = '🧲 Activar campo';
}

function ceAcoToggleCampo() {
  ceAco.campoOn = !ceAco.campoOn;
  ceAco.px = 0; ceAco.vx = 0;
  const btn = document.getElementById('ce-aco-accion');
  if (btn) btn.textContent = ceAco.campoOn ? '⊗ Apagar campo' : '🧲 Activar campo';
}

function ceAcoActualizarMedidor() {
  const p = CE_ACOPLES.find(a => a.key === ceAco.sel);
  const pct = Math.round(Math.abs(p.carga) * 100);
  const barra = document.getElementById('ce-aco-barra');
  const txt   = document.getElementById('ce-aco-pct');
  if (barra) {
    barra.style.width = pct + '%';
    barra.style.background = p.carga === 0 ? '#555' : p.color;
  }
  if (txt) txt.textContent = pct + '%';
}

function ceAcoRenderRespuestas() {
  const nv   = CE_NIVELES_ACOPLE[ceAco.nivelIdx];
  const cont = document.getElementById('ce-aco-respuestas');
  if (!cont) return;
  cont.innerHTML = '';
  nv.respuestas.forEach((r, i) => {
    const btn = document.createElement('button');
    btn.className   = 'ce-resp-btn';
    btn.textContent = r.label;
    btn.addEventListener('click', () => ceAcoResponder(i));
    cont.appendChild(btn);
  });
}

function ceAcoResponder(idx) {
  if (ceAco.respondido) return;
  ceAco.respondido = true;
  const nv   = CE_NIVELES_ACOPLE[ceAco.nivelIdx];
  const resp = nv.respuestas[idx];
  const ok   = resp.ok;

  if (!ok) ceAco.errores++;
  else      ceAco.puntaje += 100;

  document.querySelectorAll('#ce-aco-respuestas .ce-resp-btn').forEach((b, i) => {
    b.classList.add(nv.respuestas[i].ok ? 'correcto' : 'incorrecto');
    b.disabled = true;
  });

  const expEl = document.getElementById('ce-aco-exp');
  if (expEl) {
    expEl.textContent = resp.exp;
    expEl.className   = `ce-exp ${ok ? 'ok' : 'err'}`;
    expEl.classList.remove('hidden');
  }

  const esUltimo = ceAco.nivelIdx >= CE_NIVELES_ACOPLE.length - 1;
  const btnSig   = document.createElement('button');
  btnSig.className   = 'ce-btn ce-btn-next';
  btnSig.style.marginTop = '8px';
  btnSig.textContent = esUltimo ? 'Ver conclusión →' : `Desafío ${nv.nivel + 1} →`;
  btnSig.addEventListener('click', () => {
    if (esUltimo) {
      ceAco.nivelIdx = 0;
      ceAcoFinal();
    } else {
      ceAco.nivelIdx++;
      ceAco.respondido = false;
      ceModuloAcoplamiento(document.getElementById('ce-body'));
    }
  });
  const card = document.getElementById('ce-aco-desafio');
  if (card) card.appendChild(btnSig);
}

function ceAcoIrNivel(idx) {
  if (idx >= ceAco.nivelIdx) return;
  ceAco.nivelIdx   = idx;
  ceAco.respondido = false;
  if (ceAco.rafId) { cancelAnimationFrame(ceAco.rafId); ceAco.rafId = null; }
  ceModuloAcoplamiento(document.getElementById('ce-body'));
}

/* ── Render: partícula en el campo EM, fuerza ∝ carga ── */
function ceAcoRender() {
  const canvas = ceAco.canvas;
  if (!canvas) return;
  const ctx = ceAco.ctx;
  const W = canvas.width, H = canvas.height;
  const cy = H / 2;
  const p  = CE_ACOPLES.find(a => a.key === ceAco.sel);

  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#0a0520'); bg.addColorStop(1,'#04020f');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  /* Campo EM externo: flechas horizontales (apuntan a la derecha = sentido del campo E) */
  if (ceAco.campoOn) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,230,118,0.25)'; ctx.lineWidth = 1.5;
    for (let y = 30; y < H; y += 46) {
      ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(W - 20, y); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W-20, y); ctx.lineTo(W-28, y-4); ctx.lineTo(W-28, y+4);
      ctx.closePath(); ctx.fillStyle = 'rgba(0,230,118,0.25)'; ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(0,230,118,0.6)'; ctx.font = '11px Orbitron,monospace';
    ctx.textAlign = 'left'; ctx.fillText('Campo E →', 12, 20);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px Orbitron,monospace';
    ctx.textAlign = 'left'; ctx.fillText('Campo apagado — pulsa Activar campo', 12, 20);
  }

  /* Física: la fuerza es proporcional a la carga (con signo).
     F = q·E.  Positivo → derecha; negativo → izquierda. */
  const cxBase = W / 2;
  if (ceAco.campoOn) {
    const fuerza = p.carga * 0.9;          /* aceleración ∝ carga */
    ceAco.vx += fuerza;
    ceAco.vx *= 0.90;                       /* amortiguamiento */
    ceAco.px += ceAco.vx;
    /* Limitar el desplazamiento al ancho útil */
    const lim = W * 0.33;
    if (ceAco.px >  lim) { ceAco.px =  lim; ceAco.vx *= -0.3; }
    if (ceAco.px < -lim) { ceAco.px = -lim; ceAco.vx *= -0.3; }
  } else {
    /* vuelve al centro */
    ceAco.px *= 0.9; ceAco.vx = 0;
  }

  const x = cxBase + ceAco.px;

  /* Flecha de fuerza sobre la partícula */
  if (ceAco.campoOn && p.carga !== 0) {
    const dir = p.carga > 0 ? 1 : -1;
    const len = 20 + Math.abs(p.carga) * 55;
    ctx.save();
    ctx.strokeStyle = '#ffd740'; ctx.fillStyle = '#ffd740'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, cy - 34); ctx.lineTo(x + dir*len, cy - 34); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + dir*len, cy - 34);
    ctx.lineTo(x + dir*len - dir*9, cy - 39);
    ctx.lineTo(x + dir*len - dir*9, cy - 29);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffd740'; ctx.font = '10px Orbitron,monospace'; ctx.textAlign = 'center';
    ctx.fillText('F', x + dir*len/2, cy - 42);
  }

  /* Partícula */
  const r = 22;
  ctx.save();
  ctx.shadowColor = p.color; ctx.shadowBlur = 16;
  const g = ctx.createRadialGradient(x - r*.3, cy - r*.3, 0, x, cy, r);
  g.addColorStop(0, p.color + 'ee'); g.addColorStop(1, p.color + '66');
  ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI*2); ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Orbitron,monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(p.sym, x, cy);
  ctx.textBaseline = 'alphabetic';

  /* Si carga 0, mostrar que no se acopla */
  if (p.carga === 0 && ceAco.campoOn) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '12px Exo 2,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sin carga → sin acoplamiento → el campo lo ignora', W/2, H - 16);
  } else {
    ctx.fillStyle = p.color; ctx.font = '11px Exo 2,sans-serif'; ctx.textAlign = 'right';
    const nivel = Math.abs(p.carga) === 1 ? 'máxima' :
                  Math.abs(p.carga) > 0.5 ? 'intermedia' :
                  Math.abs(p.carga) > 0 ? 'baja' : 'nula';
    ctx.fillText(`${p.label} (${p.cargaTxt}): fuerza ${nivel}`, W - 10, H - 16);
  }
}

function ceAcoFinal() {
  if (ceAco.rafId) { cancelAnimationFrame(ceAco.rafId); ceAco.rafId = null; }
  const body = document.getElementById('ce-body');
  body.innerHTML = `
    <div class="ce-final-wrap">
      <div class="ce-final-title retro-text">🪝 MÓDULO A COMPLETADO</div>
      <div class="ce-final-bloques">
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">🪝</div>
          <div class="ce-bloque-titulo">La carga es el gancho</div>
          <div class="ce-bloque-texto">
            La carga eléctrica es la <strong>constante de acoplamiento</strong> al campo EM:
            mide con qué fuerza una partícula se conecta al campo. F ∝ q·E.
          </div>
        </div>
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">⚖</div>
          <div class="ce-bloque-titulo">Magnitud y signo</div>
          <div class="ce-bloque-texto">
            La <strong>magnitud</strong> de la carga fija cuánta fuerza (el electrón siente 3×
            la del quark down), y el <strong>signo</strong> fija la dirección. Carga 0 = sin fuerza.
          </div>
        </div>
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">📸</div>
          <div class="ce-bloque-titulo">Carga y fotones</div>
          <div class="ce-bloque-texto">
            A mayor carga, mayor acoplamiento: más fuerza Y mayor probabilidad de
            <strong>emitir o absorber fotones</strong>. La carga gobierna toda la interacción EM.
          </div>
        </div>
      </div>
      <div class="ce-final-mensaje">
        "La carga eléctrica es la <em>fuerza del gancho</em> que conecta cada partícula
        con el campo electromagnético. Sin carga, no hay gancho: el neutrino cruza el
        universo como si el campo no existiera."
      </div>
      <div class="ms-btn-row" style="justify-content:center;gap:14px">
        <button class="ce-btn" onclick="ceAco.nivelIdx=0;ceModuloAcoplamiento(document.getElementById('ce-body'))">↺ Repetir módulo</button>
        <button class="ce-btn ce-btn-next" onclick="ceIniciarEtapa(1)">Siguiente módulo →</button>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════════════
   ETAPA 3 · MÓDULO B — LA NUBE CUÁNTICA
   La carga "desnuda" está rodeada de una nube de pares
   virtuales e⁺e⁻ que la apantallan. La carga efectiva
   medida depende de la distancia: lejos se ve apantallada
   (−1e), muy cerca la nube se "abre" y aparece más carga.
   ════════════════════════════════════════════════════════ */
const CE_NIVELES_NUBE = [
  {
    nivel: 1,
    titulo: 'El vacío no está vacío',
    distInicial: 85,
    instruccion: 'Observa la nube de pares virtuales e⁺e⁻ y fotones que rodean al electrón. Mueve el slider de distancia.',
    pregunta: '¿Qué rodea realmente a una carga eléctrica según la QED?',
    respuestas: [
      { label: 'Espacio totalmente vacío', ok: false,
        exp: 'No. El vacío cuántico no está vacío: hierve con fluctuaciones. Alrededor de la carga aparecen y desaparecen pares virtuales constantemente.' },
      { label: 'Una nube de pares virtuales e⁺e⁻ que surgen y desaparecen', ok: true,
        exp: '¡Correcto! El vacío cuántico está lleno de fluctuaciones: pares virtuales electrón-positrón y fotones que aparecen y se aniquilan sin cesar alrededor de cualquier carga.' },
      { label: 'Un escudo metálico sólido', ok: false,
        exp: 'No es materia sólida. Es una nube dinámica de partículas virtuales del vacío cuántico, que aparecen y desaparecen continuamente.' },
    ]
  },
  {
    nivel: 2,
    titulo: 'La nube se polariza',
    distInicial: 85,
    instruccion: 'Fíjate cómo los positrones virtuales (+) se acercan al electrón y los electrones virtuales (−) se alejan.',
    pregunta: 'Alrededor del electrón (−), ¿cómo se ordenan las partículas virtuales de la nube?',
    respuestas: [
      { label: 'Al azar, sin ningún orden', ok: false,
        exp: 'No es al azar. La carga central ordena la nube: atrae lo opuesto y repele lo igual. La nube se polariza.' },
      { label: 'Los positrones (+) se acercan y los electrones (−) se alejan', ok: true,
        exp: '¡Correcto! El electrón central atrae a los positrones virtuales (+) y repele a los electrones virtuales (−). La nube se polariza, igual que un dieléctrico alrededor de una carga.' },
      { label: 'Todas las partículas huyen de la carga', ok: false,
        exp: 'Solo las del mismo signo huyen. Las de signo opuesto son atraídas y se acumulan cerca. Por eso la nube se polariza.' },
    ]
  },
  {
    nivel: 3,
    titulo: 'Carga apantallada a distancia',
    distInicial: 95,
    instruccion: 'Aleja el medidor al máximo. Lee la carga efectiva que mides desde lejos.',
    pregunta: 'Si mides la carga del electrón desde LEJOS (a través de toda la nube), ¿qué valor obtienes?',
    respuestas: [
      { label: 'La carga estándar −1e (apantallada por la nube)', ok: true,
        exp: '¡Correcto! Desde lejos, la capa de positrones virtuales apantalla parcialmente la carga desnuda. El valor que mides es el −1e "de libro". La nube esconde parte de la carga real.' },
      { label: 'Una carga enorme, mucho mayor que −1e', ok: false,
        exp: 'Al revés: desde lejos la nube apantalla la carga, así que mides MENOS que la desnuda. El −1e es el valor ya apantallado.' },
      { label: 'Carga cero: la nube la cancela del todo', ok: false,
        exp: 'La nube no cancela toda la carga, solo apantalla una parte. Desde lejos sigues midiendo −1e.' },
    ]
  },
  {
    nivel: 4,
    titulo: 'Acercarse atraviesa la nube',
    distInicial: 15,
    instruccion: 'Acerca el medidor lo máximo posible a la carga. Observa cómo la nube se vuelve transparente y la carga efectiva crece.',
    pregunta: 'Si te ACERCAS mucho a la carga (atravesando la nube), ¿qué le pasa a la carga efectiva que mides?',
    respuestas: [
      { label: 'Disminuye hasta cero', ok: false,
        exp: 'No. Al acercarte dejas atrás la capa apantalladora de positrones, así que ves MÁS carga, no menos.' },
      { label: 'No cambia: la carga es siempre −1e', ok: false,
        exp: 'La carga NO es constante: depende de la distancia. Al acercarte atraviesas el apantallamiento y mides más carga que el −1e de lejos.' },
      { label: 'Aumenta: ves más de la carga "desnuda"', ok: true,
        exp: '¡Correcto! Al acercarte penetras la nube de positrones que apantallaba, así que te expones a más de la carga desnuda. La carga efectiva crece a distancias cortas.' },
    ]
  },
  {
    nivel: 5,
    titulo: 'Carga que depende de la energía',
    distInicial: 10,
    instruccion: 'A distancias muy cortas = energías muy altas. Observa el valor máximo de la carga efectiva.',
    pregunta: '¿Qué nos enseña la QED sobre el valor de la carga eléctrica?',
    respuestas: [
      { label: 'Es una constante absoluta e inmutable', ok: false,
        exp: 'No. Una de las grandes lecciones de la QED es que la carga efectiva NO es constante: cambia con la escala de energía (la distancia).' },
      { label: 'No es constante: depende de la escala de energía / distancia', ok: true,
        exp: '¡Correcto! La carga efectiva "corre" con la energía: a mayor energía (menor distancia) atraviesas más la nube y mides más carga. La QED predice este efecto con precisión extraordinaria, confirmada en los aceleradores.' },
      { label: 'Solo cambia si la partícula se mueve rápido', ok: false,
        exp: 'No es cuestión de velocidad, sino de la distancia/energía a la que mides. El apantallamiento de la nube virtual es lo que hace variar la carga efectiva.' },
    ]
  },
];

let ceNube = {
  canvas:    null,
  ctx:       null,
  rafId:     null,
  t:         0,
  dist:      85,      /* 0 (muy cerca) – 100 (muy lejos) */
  pares:     [],      /* pares virtuales e+e- de la nube */
  nivelIdx:  0,
  respondido:false,
  puntaje:   0,
  errores:   0,
};

function ceModuloNube(body) {
  const nv = CE_NIVELES_NUBE[ceNube.nivelIdx];
  if (nv.distInicial !== undefined) ceNube.dist = nv.distInicial;

  document.getElementById('ce-instruccion').textContent =
    `Etapa 3 · El Enjambre — Nube cuántica: ${nv.instruccion}`;

  body.innerHTML = `
    <div class="ce-cable-wrap">

      <!-- Panel izquierdo -->
      <div class="ce-fuerzas-panel">

        <div class="ce-panel-card ce-desafio-card" id="ce-nube-desafio">
          <div class="ce-panel-title">Desafío ${nv.nivel}/5 — ${nv.titulo}</div>
          <p class="ce-desafio-desc" style="font-size:10px;color:var(--text2);line-height:1.5;margin:4px 0 8px">
            ${nv.instruccion}
          </p>
          <p class="ce-desafio-pregunta">${nv.pregunta}</p>
          <div class="ce-respuestas" id="ce-nube-respuestas"></div>
          <div class="ce-exp hidden" id="ce-nube-exp"></div>
          <div class="ce-fuerzas-prog" style="margin-top:8px">
            ${CE_NIVELES_NUBE.map((_,i) => `
              <button class="ms-e1-dot ${i < ceNube.nivelIdx ? 'done' : i === ceNube.nivelIdx ? 'current' : ''}"
                   title="Desafío ${i+1}"
                   ${i < ceNube.nivelIdx ? `onclick="ceNubeIrNivel(${i})"` : 'disabled'}
              ></button>
            `).join('')}
            <span class="ms-e1-niveles-label">${nv.nivel}/5</span>
          </div>
        </div>

        <div class="ce-panel-card" style="margin-top:8px">
          <div class="ce-panel-title">El vacío cuántico</div>
          <p style="font-size:9px;color:var(--text2);margin-top:4px;line-height:1.55">
            El vacío no está vacío: hierve con pares virtuales <strong style="color:#4fc3f7">e⁻</strong> y
            <strong style="color:#ef5350">e⁺</strong> que apantallan la carga.
            La <strong style="color:#ffd740">carga efectiva depende de la distancia</strong>:
            lejos la ves apantallada, cerca ves la carga desnuda.
          </p>
        </div>

        <div class="ms-btn-row" style="margin-top:8px">
          <button class="calc-toggle-btn" onclick="Calculadora.toggle()">🧮 Calc</button>
        </div>
      </div>

      <!-- Canvas + controles -->
      <div class="ce-canvas-wrap">
        <canvas id="ce-nube-canvas" class="ce-canvas"></canvas>
        <div class="ce-ondas-controles">
          <label class="ce-ctrl-label">
            Distancia de medición: <strong id="ce-nube-dist-txt">—</strong>
            — carga efectiva medida: <strong id="ce-nube-carga" style="color:#ffd740">—</strong>
          </label>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:10px;color:var(--text2)">🔬 Muy cerca</span>
            <input type="range" id="ce-nube-slider" class="ms-slider"
                   min="2" max="100" value="85" oninput="ceNubeSetDist(this.value)">
            <span style="font-size:10px;color:var(--text2)">Lejos 📡</span>
          </div>
        </div>
      </div>

    </div>
  `;

  ceNubeRenderRespuestas();

  const canvas = document.getElementById('ce-nube-canvas');
  ceNube.canvas = canvas;
  ceNube.ctx    = canvas.getContext('2d');
  ceNube.respondido = false;

  function ajustar() {
    canvas.width  = canvas.offsetWidth  || 500;
    canvas.height = canvas.offsetHeight || 340;
    ceNubeGenerarPares();
  }
  ajustar();
  window.addEventListener('resize', ajustar);

  const slider = document.getElementById('ce-nube-slider');
  if (slider) slider.value = ceNube.dist;
  ceNubeSetDist(ceNube.dist);

  if (ceNube.rafId) cancelAnimationFrame(ceNube.rafId);
  function loop() {
    ceNube.t += 0.02;
    ceNubeRender();
    ceNube.rafId = requestAnimationFrame(loop);
  }
  loop();
}

/* Genera los pares virtuales de la nube con ángulo y radio base.
   El radio base se reparte en varias "órbitas" para que la capa interior
   de positrones (+) y la exterior de electrones (−) queden bien separadas
   y la polarización sea claramente visible. */
function ceNubeGenerarPares() {
  const canvas = ceNube.canvas;
  if (!canvas) return;
  const R = Math.min(canvas.width, canvas.height) * 0.34;
  ceNube.pares = [];
  const N = 12;
  for (let i = 0; i < N; i++) {
    /* Distribuir ángulos de forma más uniforme (evita amontonamiento) */
    const ang  = (i / N) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const rad  = R * (0.55 + Math.random() * 0.4);
    ceNube.pares.push({
      ang,
      rad,
      fase: Math.random() * Math.PI * 2,   /* para el parpadeo (virtuales) */
      vel:  0.5 + Math.random() * 0.8,
    });
  }
}

function ceNubeSetDist(val) {
  ceNube.dist = parseFloat(val);
  const distTxt = document.getElementById('ce-nube-dist-txt');
  const cargaTxt = document.getElementById('ce-nube-carga');
  /* Carga efectiva: lejos = 1.00e (apantallada), cerca ↑ hasta ~1.35e */
  const frac = ceNube.dist / 100;             /* 0 cerca … 1 lejos */
  const carga = 1.0 + (1 - frac) * 0.35;      /* 1.00 lejos → 1.35 muy cerca */
  if (distTxt)  distTxt.textContent  = ceNube.dist > 70 ? 'lejana' : ceNube.dist > 35 ? 'media' : 'muy corta';
  if (cargaTxt) cargaTxt.textContent = '−' + carga.toFixed(2) + ' e';
}

function ceNubeRenderRespuestas() {
  const nv   = CE_NIVELES_NUBE[ceNube.nivelIdx];
  const cont = document.getElementById('ce-nube-respuestas');
  if (!cont) return;
  cont.innerHTML = '';
  nv.respuestas.forEach((r, i) => {
    const btn = document.createElement('button');
    btn.className   = 'ce-resp-btn';
    btn.textContent = r.label;
    btn.addEventListener('click', () => ceNubeResponder(i));
    cont.appendChild(btn);
  });
}

function ceNubeResponder(idx) {
  if (ceNube.respondido) return;
  ceNube.respondido = true;
  const nv   = CE_NIVELES_NUBE[ceNube.nivelIdx];
  const resp = nv.respuestas[idx];
  const ok   = resp.ok;

  if (!ok) ceNube.errores++;
  else      ceNube.puntaje += 100;

  document.querySelectorAll('#ce-nube-respuestas .ce-resp-btn').forEach((b, i) => {
    b.classList.add(nv.respuestas[i].ok ? 'correcto' : 'incorrecto');
    b.disabled = true;
  });

  const expEl = document.getElementById('ce-nube-exp');
  if (expEl) {
    expEl.textContent = resp.exp;
    expEl.className   = `ce-exp ${ok ? 'ok' : 'err'}`;
    expEl.classList.remove('hidden');
  }

  const esUltimo = ceNube.nivelIdx >= CE_NIVELES_NUBE.length - 1;
  const btnSig   = document.createElement('button');
  btnSig.className   = 'ce-btn ce-btn-next';
  btnSig.style.marginTop = '8px';
  btnSig.textContent = esUltimo ? 'Ver conclusión →' : `Desafío ${nv.nivel + 1} →`;
  btnSig.addEventListener('click', () => {
    if (esUltimo) {
      ceNube.nivelIdx = 0;
      ceNubeFinal();
    } else {
      ceNube.nivelIdx++;
      ceNube.respondido = false;
      ceModuloNube(document.getElementById('ce-body'));
    }
  });
  const card = document.getElementById('ce-nube-desafio');
  if (card) card.appendChild(btnSig);
}

function ceNubeIrNivel(idx) {
  if (idx >= ceNube.nivelIdx) return;
  ceNube.nivelIdx   = idx;
  ceNube.respondido = false;
  if (ceNube.rafId) { cancelAnimationFrame(ceNube.rafId); ceNube.rafId = null; }
  ceModuloNube(document.getElementById('ce-body'));
}

/* ── Render: carga central + nube polarizada de pares virtuales ── */
function ceNubeRender() {
  const canvas = ceNube.canvas;
  if (!canvas) return;
  const ctx = ceNube.ctx;
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const t  = ceNube.t;

  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W,H)*0.6);
  bg.addColorStop(0,'#0d0828'); bg.addColorStop(1,'#04020f');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  /* frac: 0 = muy cerca (nube transparente), 1 = lejos (nube opaca) */
  const frac = ceNube.dist / 100;
  const nubeAlpha = 0.25 + frac * 0.75;   /* más lejos, nube más visible/densa */

  /* Círculo del "radio de medición" */
  const Rmed = (Math.min(W,H)*0.12) + frac * (Math.min(W,H)*0.34);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,215,64,0.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([5,5]);
  ctx.beginPath(); ctx.arc(cx, cy, Rmed, 0, Math.PI*2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,215,64,0.6)'; ctx.font = '10px Orbitron,monospace';
  ctx.textAlign = 'center';
  ctx.fillText('medición', cx, cy - Rmed - 6);

  /* Pares virtuales: positrones (+) cerca de la carga, electrones (−) lejos */
  ceNube.pares.forEach(par => {
    /* parpadeo: aparecen y desaparecen (son virtuales) */
    const vida = 0.5 + 0.5 * Math.sin(t * par.vel + par.fase);
    if (vida < 0.15) return;

    const base = par.rad;
    /* Polarización MARCADA: el positrón (+, atraído) forma una capa INTERIOR
       pegada a la carga; el electrón (−, repelido) una capa EXTERIOR lejana.
       Se dibuja una línea tenue uniendo el par para que se vea que es un dipolo. */
    const rIn  = base * 0.45;   /* positrón: muy cerca del centro */
    const rOut = base * 1.25;   /* electrón: mucho más lejos */
    const px = cx + Math.cos(par.ang) * rIn;
    const py = cy + Math.sin(par.ang) * rIn;
    const ex = cx + Math.cos(par.ang) * rOut;
    const ey = cy + Math.sin(par.ang) * rOut;

    /* Línea del dipolo (une + y − del mismo par) */
    const atenLinea = Math.hypot((px+ex)/2 - cx, (py+ey)/2 - cy) > Rmed ? 0.1 : 1;
    ctx.save();
    ctx.globalAlpha = vida * nubeAlpha * atenLinea * 0.4;
    ctx.strokeStyle = 'rgba(200,200,255,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.restore();

    /* Factor de transparencia: FUERA del círculo de medición se desvanecen,
       dentro se ven bien definidas (son las que estamos "midiendo") */
    const atenP = Math.hypot(px - cx, py - cy) > Rmed ? 0.1 : 1;
    const atenE = Math.hypot(ex - cx, ey - cy) > Rmed ? 0.1 : 1;

    ctx.save();
    /* positrón virtual (+) — rojo */
    ctx.globalAlpha = vida * nubeAlpha * atenP;
    ctx.shadowColor = '#ef5350'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI*2);
    ctx.fillStyle = '#ef5350'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '8px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('+', px, py);
    /* electrón virtual (−) — azul */
    ctx.globalAlpha = vida * nubeAlpha * atenE;
    ctx.shadowColor = '#4fc3f7'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI*2);
    ctx.fillStyle = '#4fc3f7'; ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('−', ex, ey);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  });

  /* Carga central (electrón desnudo) — brilla más cuanto más cerca estamos */
  const brillo = 14 + (1 - frac) * 20;
  ctx.save();
  ctx.shadowColor = '#4fc3f7'; ctx.shadowBlur = brillo;
  const g = ctx.createRadialGradient(cx-6, cy-6, 0, cx, cy, 20);
  g.addColorStop(0, '#9fe6ff'); g.addColorStop(1, '#1565c0');
  ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI*2); ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Orbitron,monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('e⁻', cx, cy);
  ctx.textBaseline = 'alphabetic';

  /* Etiqueta de estado */
  const carga = 1.0 + (1 - frac) * 0.35;
  ctx.fillStyle = frac > 0.7 ? '#9fdcff' : '#ffd740';
  ctx.font = '11px Exo 2,sans-serif'; ctx.textAlign = 'center';
  const msg = frac > 0.7
    ? 'Lejos: la nube apantalla → mides −1.00e'
    : frac > 0.35
      ? 'Media distancia: empiezas a atravesar la nube'
      : 'Muy cerca: nube transparente → ves la carga desnuda (−' + carga.toFixed(2) + 'e)';
  ctx.fillText(msg, cx, H - 14);
}

function ceNubeFinal() {
  if (ceNube.rafId) { cancelAnimationFrame(ceNube.rafId); ceNube.rafId = null; }
  const body = document.getElementById('ce-body');
  body.innerHTML = `
    <div class="ce-final-wrap">
      <div class="ce-final-title retro-text">☁️ MÓDULO B COMPLETADO</div>
      <div class="ce-final-bloques">
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">🌫️</div>
          <div class="ce-bloque-titulo">El vacío hierve</div>
          <div class="ce-bloque-texto">
            El vacío cuántico no está vacío: está lleno de <strong>pares virtuales
            e⁺e⁻</strong> y fotones que aparecen y desaparecen sin cesar alrededor
            de cualquier carga.
          </div>
        </div>
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">🧲</div>
          <div class="ce-bloque-titulo">La nube apantalla</div>
          <div class="ce-bloque-texto">
            La nube se <strong>polariza</strong>: los positrones virtuales rodean al
            electrón y esconden parte de su carga. Desde lejos mides una carga
            apantallada (−1e).
          </div>
        </div>
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">📏</div>
          <div class="ce-bloque-titulo">Carga que "corre"</div>
          <div class="ce-bloque-texto">
            Al acercarte atraviesas la nube y ves <strong>más carga desnuda</strong>.
            La carga efectiva depende de la distancia/energía: no es una constante absoluta.
          </div>
        </div>
      </div>
      <div class="ce-final-mensaje">
        "La carga que medimos no es fija: es lo que queda tras el <em>apantallamiento</em>
        de una nube de partículas virtuales. La QED predice cómo cambia con la energía,
        y los aceleradores lo confirman con una precisión asombrosa."
      </div>
      <div class="ms-btn-row" style="justify-content:center;gap:14px">
        <button class="ce-btn" onclick="ceNube.nivelIdx=0;ceModuloNube(document.getElementById('ce-body'))">↺ Repetir módulo</button>
        <button class="ce-btn ce-btn-next" onclick="ceIniciarEtapa(2)">Siguiente módulo →</button>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════════════
   ETAPA 3 · MÓDULO C — EL ENJAMBRE COLECTIVO
   El usuario coloca hasta 5 cargas; las líneas de campo de
   cada una se superponen y las fuerzas se suman vectorialmente.
   Desafíos: dipolo, cuadrupolo, configuración neutra, etc.
   ════════════════════════════════════════════════════════ */
const CE_MAX_CARGAS = 5;

const CE_NIVELES_COLECTIVO = [
  {
    nivel: 1,
    titulo: 'El dipolo',
    instruccion: 'Haz clic en el canvas para colocar cargas. Usa el selector de signo. Coloca una carga + y una −.',
    objetivo: { tipo: 'dipolo' },
    pista: 'Coloca exactamente 2 cargas de signo opuesto.',
    pregunta: 'Al colocar una carga + y una − cercanas, las líneas de campo van de una a otra. ¿Cómo se llama esta configuración?',
    respuestas: [
      { label: 'Un monopolo', ok: false, exp: 'Un monopolo es una sola carga. Aquí tienes dos de signo opuesto: eso es un dipolo.' },
      { label: 'Un dipolo', ok: true, exp: '¡Correcto! Dos cargas iguales y opuestas forman un dipolo. Las líneas de campo salen de la + y entran en la −. Es la configuración básica de muchas moléculas (como el agua).' },
      { label: 'Un cuadrupolo', ok: false, exp: 'Un cuadrupolo necesita cuatro cargas. Con dos cargas opuestas tienes un dipolo.' },
    ]
  },
  {
    nivel: 2,
    titulo: 'Superposición de fuerzas',
    instruccion: 'Coloca varias cargas y observa cómo el campo total es la suma de los campos individuales.',
    objetivo: null,
    pregunta: 'Cuando hay varias cargas, ¿cómo se calcula la fuerza o el campo total en un punto?',
    respuestas: [
      { label: 'Se queda solo con la carga más grande', ok: false, exp: 'No. Todas las cargas contribuyen, no solo la mayor. El campo total es la suma de todas.' },
      { label: 'Se promedian todas las cargas', ok: false, exp: 'No es un promedio: es una SUMA vectorial. Cada campo se suma como vector (con dirección), no se promedia.' },
      { label: 'Se suman vectorialmente los campos de cada carga (principio de superposición)', ok: true, exp: '¡Correcto! El principio de superposición: el campo total en un punto es la suma vectorial de los campos que crea cada carga por separado. Simple pero poderoso.' },
    ]
  },
  {
    nivel: 3,
    titulo: 'Configuración neutra',
    instruccion: 'DESAFÍO: coloca cargas de modo que la carga TOTAL sea cero (ej. una + y una −).',
    objetivo: { tipo: 'neutro' },
    pista: 'La suma de todas las cargas debe dar 0. Lo más simple: una +1 y una −1.',
    pregunta: 'Lograste carga total cero. Desde MUY lejos, ¿qué campo produce un conjunto de cargas cuya suma es cero?',
    respuestas: [
      { label: 'Un campo enorme, mayor que el de una sola carga', ok: false, exp: 'Al revés: si la carga neta es cero, el campo lejano casi se cancela, no se amplifica.' },
      { label: 'Un campo que se cancela casi del todo a gran distancia (blindaje)', ok: true, exp: '¡Correcto! Si la carga total es cero, desde lejos los campos se cancelan y apenas se nota nada. Es por eso que la materia neutra (átomos) no te empuja eléctricamente aunque esté llena de cargas.' },
      { label: 'Exactamente el mismo campo que una carga aislada', ok: false, exp: 'No. Una carga aislada tiene campo neto; un conjunto neutro cancela su campo a distancia.' },
    ]
  },
  {
    nivel: 4,
    titulo: 'El cuadrupolo',
    instruccion: 'DESAFÍO: coloca 4 cargas alternando signos (+ − + −) para formar un cuadrupolo.',
    objetivo: { tipo: 'cuadrupolo' },
    pista: 'Necesitas 4 cargas: dos positivas y dos negativas.',
    pregunta: 'Un cuadrupolo (4 cargas alternadas) tiene carga neta cero, igual que el dipolo. ¿Por qué su campo es aún más débil a distancia?',
    respuestas: [
      { label: 'Porque las cargas son más pequeñas', ok: false, exp: 'No cambian las cargas individuales. Lo que cambia es cómo se cancelan a distancia.' },
      { label: 'Porque incluso los "dipolos" que lo forman se cancelan entre sí', ok: true, exp: '¡Correcto! Un cuadrupolo es como dos dipolos opuestos. No solo se cancela la carga neta, también se cancelan los momentos dipolares, así que el campo decae aún más rápido con la distancia.' },
      { label: 'Porque las cargas se mueven más rápido', ok: false, exp: 'La velocidad no influye aquí. Es la simetría de la configuración lo que hace que el campo se cancele más.' },
    ]
  },
  {
    nivel: 5,
    titulo: 'El enjambre es la suma',
    instruccion: 'Experimenta libremente: coloca hasta 5 cargas y observa el campo colectivo.',
    objetivo: null,
    pregunta: '¿Cuál es la idea central del "enjambre colectivo" de cargas?',
    respuestas: [
      { label: 'El conjunto crea un campo nuevo e impredecible', ok: false, exp: 'No es impredecible: por complejo que parezca, siempre es la suma de los campos individuales.' },
      { label: 'Por complejo que parezca, el campo total siempre es la SUMA de los campos individuales', ok: true, exp: '¡Correcto! El enjambre colectivo puede verse muy complejo (dipolos, cuadrupolos, líneas de carga), pero siempre es exactamente la superposición de los enjambres individuales. Esa es la elegancia del principio de superposición.' },
      { label: 'Solo la carga del centro importa', ok: false, exp: 'Todas las cargas contribuyen al campo total, sin importar su posición. Todas cuentan en la suma.' },
    ]
  },
];

let ceCol = {
  canvas:    null,
  ctx:       null,
  rafId:     null,
  t:         0,
  cargas:    [],       /* {x, y, q} */
  signo:     +1,       /* signo a colocar */
  nivelIdx:  0,
  respondido:false,
  puntaje:   0,
  errores:   0,
};

function ceModuloColectivo(body) {
  const nv = CE_NIVELES_COLECTIVO[ceCol.nivelIdx];

  document.getElementById('ce-instruccion').textContent =
    `Etapa 3 · El Enjambre — Colectivo: ${nv.instruccion}`;

  body.innerHTML = `
    <div class="ce-cable-wrap">

      <!-- Panel izquierdo -->
      <div class="ce-fuerzas-panel">

        <div class="ce-panel-card ce-desafio-card" id="ce-col-desafio">
          <div class="ce-panel-title">Desafío ${nv.nivel}/5 — ${nv.titulo}</div>
          <p class="ce-desafio-desc" style="font-size:10px;color:var(--text2);line-height:1.5;margin:4px 0 8px">
            ${nv.instruccion}
          </p>
          ${nv.objetivo ? `<div class="ce-col-estado" id="ce-col-estado">⚙ Objetivo pendiente</div>` : ''}
          <p class="ce-desafio-pregunta">${nv.pregunta}</p>
          <div class="ce-respuestas" id="ce-col-respuestas"></div>
          <div class="ce-exp hidden" id="ce-col-exp"></div>
          <div class="ce-fuerzas-prog" style="margin-top:8px">
            ${CE_NIVELES_COLECTIVO.map((_,i) => `
              <button class="ms-e1-dot ${i < ceCol.nivelIdx ? 'done' : i === ceCol.nivelIdx ? 'current' : ''}"
                   title="Desafío ${i+1}"
                   ${i < ceCol.nivelIdx ? `onclick="ceColIrNivel(${i})"` : 'disabled'}
              ></button>
            `).join('')}
            <span class="ms-e1-niveles-label">${nv.nivel}/5</span>
          </div>
        </div>

        <div class="ce-panel-card" style="margin-top:8px">
          <div class="ce-panel-title">Superposición</div>
          <div class="ce-formula-box" style="margin-top:4px">
            E_total = Σ Eᵢ<br>
            <small>El campo total = suma vectorial de cada carga</small>
          </div>
          ${nv.pista ? `<p style="font-size:9px;color:var(--text2);margin-top:6px;line-height:1.5">💡 ${nv.pista}</p>` : ''}
        </div>

        <div class="ms-btn-row" style="margin-top:8px">
          <button class="calc-toggle-btn" onclick="Calculadora.toggle()">🧮 Calc</button>
        </div>
      </div>

      <!-- Canvas + controles -->
      <div class="ce-canvas-wrap">
        <canvas id="ce-col-canvas" class="ce-canvas" style="cursor:crosshair"></canvas>
        <div class="ce-ondas-controles">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:6px">
              <span class="ce-ctrl-label" style="font-size:10px">Colocar:</span>
              <button class="ce-col-signo ce-col-pos selected" id="ce-col-btn-pos" onclick="ceColSetSigno(1)">+</button>
              <button class="ce-col-signo ce-col-neg" id="ce-col-btn-neg" onclick="ceColSetSigno(-1)">−</button>
            </div>
            <div class="ce-ctrl-label" style="font-size:10px">
              Cargas: <strong id="ce-col-count">0</strong>/${CE_MAX_CARGAS}
              · Neta: <strong id="ce-col-neta" style="color:#ffd740">0</strong>
            </div>
            <button class="ce-qed-ctrl-btn ce-qed-rewind2" onclick="ceColLimpiar()">↺ Limpiar</button>
          </div>
          <p style="font-size:9px;color:var(--text2);margin-top:4px;text-align:center">
            Clic en vacío = colocar carga (máx. ${CE_MAX_CARGAS}) · Arrastra una carga para moverla.
          </p>
        </div>
      </div>

    </div>
  `;

  ceColRenderRespuestas();

  const canvas = document.getElementById('ce-col-canvas');
  ceCol.canvas = canvas;
  ceCol.ctx    = canvas.getContext('2d');
  ceCol.respondido = false;
  ceCol.cargas = [];
  ceCol.flujo  = null;   /* se regenera en el primer render */

  function ajustar() {
    canvas.width  = canvas.offsetWidth  || 500;
    canvas.height = canvas.offsetHeight || 340;
    ceCol.flujo = null;   /* regenerar con el nuevo tamaño */
  }
  ajustar();
  window.addEventListener('resize', ajustar);

  canvas.addEventListener('mousedown',  ceColMD);
  canvas.addEventListener('mousemove',  ceColMM);
  canvas.addEventListener('mouseup',    ceColMU);
  canvas.addEventListener('mouseleave', ceColMU);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); ceColMD(e.touches[0]); }, { passive:false });
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); ceColMM(e.touches[0]); }, { passive:false });
  canvas.addEventListener('touchend',   ceColMU);

  ceCol.dragIdx      = null;
  ceCol.dragMoved    = false;
  ceCol.pendientePos = null;
  ceColActualizarHUD();

  if (ceCol.rafId) cancelAnimationFrame(ceCol.rafId);
  function loop() {
    ceCol.t += 0.02;
    ceColRender();
    ceCol.rafId = requestAnimationFrame(loop);
  }
  loop();
}

function ceColSetSigno(s) {
  ceCol.signo = s;
  document.getElementById('ce-col-btn-pos')?.classList.toggle('selected', s > 0);
  document.getElementById('ce-col-btn-neg')?.classList.toggle('selected', s < 0);
}

function ceColMD(e) {
  const { x, y } = cePosCanvas(e, ceCol.canvas);
  /* ¿Pulsó sobre una carga existente? → iniciar arrastre */
  const idx = ceCol.cargas.findIndex(c => Math.hypot(c.x - x, c.y - y) < 20);
  if (idx !== -1) {
    ceCol.dragIdx   = idx;
    ceCol.dragMoved = false;
    ceCol.pendientePos = null;
  } else {
    ceCol.dragIdx   = null;
    /* Gesto que puede terminar en "colocar carga" si se suelta en vacío */
    ceCol.pendientePos = { x, y };
  }
}

function ceColMM(e) {
  const { x, y } = cePosCanvas(e, ceCol.canvas);
  /* Arrastrando una carga */
  if (ceCol.dragIdx !== null) {
    const c = ceCol.cargas[ceCol.dragIdx];
    if (c) {
      c.x = Math.max(16, Math.min(ceCol.canvas.width  - 16, x));
      c.y = Math.max(16, Math.min(ceCol.canvas.height - 16, y));
      ceCol.dragMoved = true;
    }
    ceCol.canvas.style.cursor = 'grabbing';
    return;
  }
  /* Si el ratón se mueve mucho desde el mousedown en vacío, cancelar la colocación
     (fue un arrastre en vacío, no un clic) */
  if (ceCol.pendientePos) {
    const d = Math.hypot(x - ceCol.pendientePos.x, y - ceCol.pendientePos.y);
    if (d > 10) ceCol.pendientePos = null;
  }
  /* Hover: cursor de "agarre" sobre una carga, cruz en vacío */
  const sobre = ceCol.cargas.some(c => Math.hypot(c.x - x, c.y - y) < 20);
  ceCol.canvas.style.cursor = sobre ? 'grab' : 'crosshair';
}

function ceColMU(e) {
  /* Si estábamos arrastrando una carga, soltar sin más */
  if (ceCol.dragIdx !== null) {
    if (ceCol.dragMoved) ceColVerificarObjetivo();
    ceCol.dragIdx = null;
    ceCol.pendientePos = null;
    return;
  }
  /* Solo colocar en un clic genuino en vacío (mousedown+mouseup sin arrastre).
     Un mouseleave NO coloca carga porque invalidamos pendientePos aquí abajo. */
  const colocar = ceCol.pendientePos;
  ceCol.pendientePos = null;
  if (!colocar) return;
  /* mouseleave: ignorar (no es un clic real sobre el canvas) */
  if (e && e.type === 'mouseleave') return;
  if (ceCol.cargas.length >= CE_MAX_CARGAS) return;
  const { x, y } = colocar;
  if (ceCol.cargas.some(c => Math.hypot(c.x - x, c.y - y) < 20)) return;
  ceCol.cargas.push({ x, y, q: ceCol.signo });
  ceColActualizarHUD();
  ceColVerificarObjetivo();
}

function ceColLimpiar() {
  ceCol.cargas = [];
  ceColActualizarHUD();
  ceColVerificarObjetivo();
}

function ceColActualizarHUD() {
  const cnt  = document.getElementById('ce-col-count');
  const neta = document.getElementById('ce-col-neta');
  if (cnt)  cnt.textContent = ceCol.cargas.length;
  if (neta) {
    const suma = ceCol.cargas.reduce((s, c) => s + c.q, 0);
    neta.textContent = (suma > 0 ? '+' : '') + suma;
    neta.style.color = suma === 0 ? '#00e676' : '#ffd740';
  }
}

/* Comprueba si la configuración cumple el objetivo del desafío */
function ceColVerificarObjetivo() {
  const nv = CE_NIVELES_COLECTIVO[ceCol.nivelIdx];
  const estadoEl = document.getElementById('ce-col-estado');
  if (!nv.objetivo || !estadoEl) return;

  const cargas = ceCol.cargas;
  const nPos = cargas.filter(c => c.q > 0).length;
  const nNeg = cargas.filter(c => c.q < 0).length;
  const suma = cargas.reduce((s, c) => s + c.q, 0);
  let cumplido = false;

  if (nv.objetivo.tipo === 'dipolo') {
    cumplido = cargas.length === 2 && nPos === 1 && nNeg === 1;
  } else if (nv.objetivo.tipo === 'neutro') {
    cumplido = cargas.length >= 2 && Math.abs(suma) < 0.0001;
  } else if (nv.objetivo.tipo === 'cuadrupolo') {
    cumplido = cargas.length === 4 && nPos === 2 && nNeg === 2;
  }

  if (cumplido) {
    estadoEl.textContent = '✓ ¡Objetivo logrado!';
    estadoEl.className = 'ce-col-estado ok';
  } else {
    estadoEl.textContent = '⚙ Objetivo pendiente';
    estadoEl.className = 'ce-col-estado';
  }
}

function ceColRenderRespuestas() {
  const nv   = CE_NIVELES_COLECTIVO[ceCol.nivelIdx];
  const cont = document.getElementById('ce-col-respuestas');
  if (!cont) return;
  cont.innerHTML = '';
  nv.respuestas.forEach((r, i) => {
    const btn = document.createElement('button');
    btn.className   = 'ce-resp-btn';
    btn.textContent = r.label;
    btn.addEventListener('click', () => ceColResponder(i));
    cont.appendChild(btn);
  });
}

function ceColResponder(idx) {
  if (ceCol.respondido) return;
  const nv = CE_NIVELES_COLECTIVO[ceCol.nivelIdx];

  /* Si el desafío tiene objetivo de construcción, exigir cumplirlo antes */
  if (nv.objetivo) {
    const cargas = ceCol.cargas;
    const nPos = cargas.filter(c => c.q > 0).length;
    const nNeg = cargas.filter(c => c.q < 0).length;
    const suma = cargas.reduce((s, c) => s + c.q, 0);
    let cumplido = false;
    if (nv.objetivo.tipo === 'dipolo')      cumplido = cargas.length === 2 && nPos === 1 && nNeg === 1;
    else if (nv.objetivo.tipo === 'neutro') cumplido = cargas.length >= 2 && Math.abs(suma) < 0.0001;
    else if (nv.objetivo.tipo === 'cuadrupolo') cumplido = cargas.length === 4 && nPos === 2 && nNeg === 2;
    if (!cumplido) {
      const expEl = document.getElementById('ce-col-exp');
      if (expEl) {
        expEl.className = 'ce-exp err';
        expEl.innerHTML = `Primero construye la configuración pedida en el canvas. 💡 ${nv.pista}`;
        expEl.classList.remove('hidden');
      }
      return;
    }
  }

  ceCol.respondido = true;
  const resp = nv.respuestas[idx];
  const ok   = resp.ok;
  if (!ok) ceCol.errores++;
  else      ceCol.puntaje += 100;

  document.querySelectorAll('#ce-col-respuestas .ce-resp-btn').forEach((b, i) => {
    b.classList.add(nv.respuestas[i].ok ? 'correcto' : 'incorrecto');
    b.disabled = true;
  });

  const expEl = document.getElementById('ce-col-exp');
  if (expEl) {
    expEl.textContent = resp.exp;
    expEl.className   = `ce-exp ${ok ? 'ok' : 'err'}`;
    expEl.classList.remove('hidden');
  }

  const esUltimo = ceCol.nivelIdx >= CE_NIVELES_COLECTIVO.length - 1;
  const btnSig   = document.createElement('button');
  btnSig.className   = 'ce-btn ce-btn-next';
  btnSig.style.marginTop = '8px';
  btnSig.textContent = esUltimo ? 'Ver conclusión →' : `Desafío ${nv.nivel + 1} →`;
  btnSig.addEventListener('click', () => {
    if (esUltimo) {
      ceCol.nivelIdx = 0;
      ceColFinal();
    } else {
      ceCol.nivelIdx++;
      ceCol.respondido = false;
      ceModuloColectivo(document.getElementById('ce-body'));
    }
  });
  const card = document.getElementById('ce-col-desafio');
  if (card) card.appendChild(btnSig);
}

function ceColIrNivel(idx) {
  if (idx >= ceCol.nivelIdx) return;
  ceCol.nivelIdx   = idx;
  ceCol.respondido = false;
  if (ceCol.rafId) { cancelAnimationFrame(ceCol.rafId); ceCol.rafId = null; }
  ceModuloColectivo(document.getElementById('ce-body'));
}

/* Calcula el campo E en un punto (suma vectorial de todas las cargas) */
function ceColCampo(x, y) {
  let ex = 0, ey = 0;
  ceCol.cargas.forEach(c => {
    const dx = x - c.x, dy = y - c.y;
    const d2 = dx*dx + dy*dy;
    const d  = Math.sqrt(d2);
    if (d < 10) return;
    const e = c.q / d2 * 1400;
    ex += e * dx / d;
    ey += e * dy / d;
  });
  return { ex, ey, mag: Math.hypot(ex, ey) };
}

/* Partículas de prueba que fluyen por el campo (como limaduras animadas) */
function ceColInitFlujo() {
  const W = ceCol.canvas.width, H = ceCol.canvas.height;
  ceCol.flujo = [];
  for (let i = 0; i < 90; i++) {
    ceCol.flujo.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vida: Math.random(),
    });
  }
}

/* Dibuja una flecha de dirección sobre una línea de campo */
function ceColFlechaCampo(ctx, x, y, ang) {
  const L = 7;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = 'rgba(255,190,140,0.85)';
  ctx.beginPath();
  ctx.moveTo(L, 0);
  ctx.lineTo(-L*0.6, L*0.55);
  ctx.lineTo(-L*0.6, -L*0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* ── Render: cargas + flujo animado del campo por superposición ── */
function ceColRender() {
  const canvas = ceCol.canvas;
  if (!canvas) return;
  const ctx = ceCol.ctx;
  const W = canvas.width, H = canvas.height;

  /* Estela: en vez de limpiar del todo, pintamos un velo semitransparente
     para que las partículas de prueba dejen un rastro fluido */
  ctx.fillStyle = 'rgba(4,2,15,0.28)';
  ctx.fillRect(0, 0, W, H);

  const cargas = ceCol.cargas;

  if (cargas.length === 0) {
    ctx.fillStyle = 'rgba(4,2,15,0.6)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '13px Orbitron,monospace'; ctx.textAlign = 'center';
    ctx.fillText('Haz clic para colocar cargas', W/2, H/2 - 10);
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '10px Exo 2,sans-serif';
    ctx.fillText('las líneas de campo cobrarán vida', W/2, H/2 + 12);
    return;
  }

  /* Inicializar flujo si hace falta */
  if (!ceCol.flujo) ceColInitFlujo();

  /* Mover y dibujar partículas de prueba a lo largo del campo */
  ceCol.flujo.forEach(p => {
    const f = ceColCampo(p.x, p.y);
    p.vida -= 0.012;
    if (f.mag > 0.001) {
      const paso = Math.min(f.mag, 3.2);
      p.x += (f.ex / f.mag) * (1 + paso);
      p.y += (f.ey / f.mag) * (1 + paso);
    } else {
      p.x += (Math.random() - 0.5);
      p.y += (Math.random() - 0.5);
    }
    /* Reaparecer si muere, sale del canvas o cae en una carga */
    let reinit = p.vida <= 0 || p.x < 0 || p.x > W || p.y < 0 || p.y > H;
    cargas.forEach(c => { if (Math.hypot(p.x-c.x, p.y-c.y) < 16) reinit = true; });
    if (reinit) {
      p.x = Math.random() * W; p.y = Math.random() * H; p.vida = 0.6 + Math.random()*0.6;
      return;
    }
    const intensidad = Math.min(f.mag, 1);
    /* Color: cercano a + rojizo, cercano a − azulado — mezcla según campo */
    const alpha = (0.15 + intensidad * 0.7) * Math.min(1, p.vida * 2);
    const r = 1.3 + intensidad * 1.8;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = '#7fd4ff'; ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI*2);
    ctx.fillStyle = '#9fe6ff'; ctx.fill();
    ctx.restore();
  });

  /* Líneas de campo que nacen de cada carga positiva, con flechas de dirección.
     Si no hay cargas positivas, se trazan hacia atrás desde las negativas. */
  const diag = Math.hypot(W, H);
  const PASO = 6;                 /* longitud de cada paso de integración */
  const MAX_PASOS = Math.ceil(diag / PASO) + 40;  /* alcanzan a cruzar todo el canvas */
  const fuentes = cargas.filter(c => c.q > 0);
  const origenes = fuentes.length ? fuentes : cargas.filter(c => c.q < 0);

  origenes.forEach(c => {
    const sentido = c.q > 0 ? 1 : -1;   /* + → salen; − → se trazan al revés */
    const nLineas = 18;                 /* más líneas = campo más "lleno" */
    for (let i = 0; i < nLineas; i++) {
      const a0 = (i / nLineas) * Math.PI * 2;
      let x = c.x + Math.cos(a0) * 17;
      let y = c.y + Math.sin(a0) * 17;
      let distAcum = 0;

      /* 1ª pasada: recolectar los puntos de la línea y las flechas */
      const pts     = [{ x, y }];
      const flechas = [];
      for (let s = 0; s < MAX_PASOS; s++) {
        const f = ceColCampo(x, y);
        if (f.mag < 0.00005) break;
        const dx = sentido * (f.ex / f.mag) * PASO;
        const dy = sentido * (f.ey / f.mag) * PASO;
        x += dx; y += dy;
        pts.push({ x, y });
        if (x < -20 || x > W + 20 || y < -20 || y > H + 20) break;

        distAcum += PASO;
        if (distAcum >= 50) {
          distAcum = 0;
          flechas.push({ x, y, ang: Math.atan2(dy, dx) });
        }
        /* ¿llegó a una carga de signo opuesto? */
        let fin = false;
        cargas.forEach(cc => {
          if (cc !== c && Math.hypot(x-cc.x, y-cc.y) < 16) fin = true;
        });
        if (fin) break;
      }

      /* 2ª pasada: trazar la línea COMPLETA de un solo path */
      ctx.save();
      ctx.strokeStyle = 'rgba(255,175,125,0.5)'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
      ctx.stroke();
      ctx.restore();

      /* 3ª pasada: las flechas, cada una con su propio transform */
      flechas.forEach(fl => ceColFlechaCampo(ctx, fl.x, fl.y, fl.ang));
    }
  });

  /* Cargas con pulso suave */
  cargas.forEach(c => {
    const col  = c.q > 0 ? '#ef5350' : '#4fc3f7';
    const glow = c.q > 0 ? '#ff1744' : '#00b0ff';
    const pulso = 1 + Math.sin(ceCol.t * 3 + c.x) * 0.08;
    const R = 16 * pulso;
    /* halo pulsante */
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.15 * Math.sin(ceCol.t * 3 + c.x);
    ctx.beginPath(); ctx.arc(c.x, c.y, R + 10, 0, Math.PI*2);
    ctx.fillStyle = glow; ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = glow; ctx.shadowBlur = 18;
    const g = ctx.createRadialGradient(c.x-5, c.y-5, 0, c.x, c.y, R);
    g.addColorStop(0, col + 'ff'); g.addColorStop(1, col + '66');
    ctx.beginPath(); ctx.arc(c.x, c.y, R, 0, Math.PI*2); ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Orbitron,monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(c.q > 0 ? '+' : '−', c.x, c.y);
    ctx.textBaseline = 'alphabetic';
  });
}

function ceColFinal() {
  if (ceCol.rafId) { cancelAnimationFrame(ceCol.rafId); ceCol.rafId = null; }
  const body = document.getElementById('ce-body');
  body.innerHTML = `
    <div class="ce-final-wrap">
      <div class="ce-final-title retro-text">🐝 ETAPA 3 COMPLETADA</div>
      <div class="ce-final-bloques">
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">➕</div>
          <div class="ce-bloque-titulo">Superposición</div>
          <div class="ce-bloque-texto">
            El campo de muchas cargas es la <strong>suma vectorial</strong> de los campos
            individuales. Por complejo que parezca el enjambre, siempre es la suma de sus partes.
          </div>
        </div>
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">🧊</div>
          <div class="ce-bloque-titulo">Dipolos y cuadrupolos</div>
          <div class="ce-bloque-texto">
            Combinando cargas opuestas surgen <strong>dipolos y cuadrupolos</strong>:
            configuraciones de carga neta cero cuyo campo se cancela cada vez más rápido a distancia.
          </div>
        </div>
        <div class="ce-final-bloque">
          <div class="ce-bloque-icon">🛡</div>
          <div class="ce-bloque-titulo">Blindaje</div>
          <div class="ce-bloque-texto">
            Una configuración neutra <strong>apenas produce campo externo</strong>. Por eso la
            materia ordinaria, aunque está hecha de cargas, no te empuja eléctricamente.
          </div>
        </div>
      </div>
      <div class="ce-final-mensaje">
        "El enjambre colectivo puede ser complejo, pero nunca es misterioso:
        siempre es la <em>superposición</em> de los enjambres individuales.
        Esa simplicidad es la gran elegancia del electromagnetismo."
      </div>
      <div class="ms-btn-row" style="justify-content:center;gap:14px">
        <button class="ce-btn" onclick="ceCol.nivelIdx=0;ceModuloColectivo(document.getElementById('ce-body'))">↺ Repetir módulo</button>
        <button class="ce-btn ce-btn-next" onclick="cerrarCE()">← Volver al ME</button>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════
   NAVEGACIÓN HACIA ATRÁS (dots clickeables)
   ════════════════════════════════════════════ */
function ceFuerzasIrNivel(idx) {
  if (idx >= ceFuerzas.nivelIdx) return;
  ceFuerzas.nivelIdx  = idx;
  ceFuerzas.respondido = false;
  if (ceFuerzas.rafId) { cancelAnimationFrame(ceFuerzas.rafId); ceFuerzas.rafId = null; }
  ceModuloFuerzas(document.getElementById('ce-body'));
}

function ceCableIrNivel(idx) {
  if (idx >= ceCable.nivelIdx) return;
  ceCable.nivelIdx   = idx;
  ceCable.respondido = false;
  if (ceCable.rafId) { cancelAnimationFrame(ceCable.rafId); ceCable.rafId = null; }
  ceModuloCable(document.getElementById('ce-body'));
}

function ceOndasIrNivel(idx) {
  if (idx >= ceOndas.nivelIdx) return;
  ceOndas.nivelIdx   = idx;
  ceOndas.respondido = false;
  if (ceOndas.rafId) { cancelAnimationFrame(ceOndas.rafId); ceOndas.rafId = null; }
  ceModuloOndas(document.getElementById('ce-body'));
}

/* ════════════════════════════════════════════
   CIERRE
   ════════════════════════════════════════════ */
function cerrarCE() {
  ceCancelarRAFs();
  if (ceScreen) { ceScreen.remove(); ceScreen = null; }
  showScreen('me');
}
