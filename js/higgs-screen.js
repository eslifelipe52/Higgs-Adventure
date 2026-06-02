/* ══════════════════════════════════════════
   js/higgs-screen.js
   Pantalla especial del Bosón de Higgs.
   Tres apartados:
   1. Historia y Descubrimiento (ATLAS/LHC)
   2. Propiedades
   3. Minijuegos (Campo de Higgs + Diagramas)
   ══════════════════════════════════════════ */

/* ── Construye la pantalla del Higgs (se llama cada vez que se navega a ella) ── */
function initHiggsScreen() {
  const screen = document.getElementById('screen-higgs');
  if (screen.querySelector('.higgs-top-header')) return; /* ya construida */
  screen.innerHTML = `
    <!-- Partículas flotantes de fondo (canvas) -->
    <canvas id="higgs-bg-canvas" class="higgs-bg-canvas"></canvas>

    <!-- Header con título especial -->
    <div class="higgs-top-header">
      <div class="higgs-top-symbol">H⁰</div>
      <div class="higgs-top-info">
        <div class="higgs-top-name retro-text">BOSÓN DE HIGGS</div>
        <div class="higgs-top-sub">La partícula que otorga masa al universo</div>
      </div>
      <button class="higgs-back-btn" onclick="showScreen('me')">← Modelo Estándar</button>
    </div>

    <!-- Tabs de navegación -->
    <div class="higgs-tabs">
      <button class="higgs-tab active" id="htab-historia"    onclick="switchHiggsTab('historia')">
        <span class="htab-icon">🔭</span> Historia y Descubrimiento
      </button>
      <button class="higgs-tab" id="htab-propiedades" onclick="switchHiggsTab('propiedades')">
        <span class="htab-icon">⚛</span> Propiedades
      </button>
      <button class="higgs-tab" id="htab-minijuegos"  onclick="switchHiggsTab('minijuegos')">
        <span class="htab-icon">🎮</span> Minijuegos
      </button>
    </div>

    <!-- Contenido de los tabs -->
    <div class="higgs-content" id="higgs-content">
      ${buildTabHistoria()}
      ${buildTabPropiedades()}
      ${buildTabMinijuegos()}
    </div>
  `;

  /* Forzar layout de columna en el screen */
  screen.style.flexDirection = 'column';
  screen.style.alignItems    = 'stretch';
  screen.style.overflow      = 'hidden';

  /* Iniciar canvas de fondo */
  initHiggsBgCanvas();
}

/* ════════════════════════════════════════════
   TAB 1: HISTORIA Y DESCUBRIMIENTO
   ════════════════════════════════════════════ */
function buildTabHistoria() {
  return `
  <div class="htab-panel active" id="hpanel-historia">

    <!-- Timeline -->
    <div class="higgs-timeline">

      <div class="htl-item">
        <div class="htl-year">1964</div>
        <div class="htl-dot"></div>
        <div class="htl-card">
          <div class="htl-title">La predicción teórica</div>
          <p>Peter Higgs, François Englert y Robert Brout proponen de forma independiente un mecanismo para explicar cómo las partículas adquieren masa. La idea: un campo escalar que permea todo el espacio interactúa con las partículas y les "frena", otorgándoles masa. La partícula asociada a ese campo sería el bosón de Higgs.</p>
        </div>
      </div>

      <div class="htl-item">
        <div class="htl-year">1983</div>
        <div class="htl-dot"></div>
        <div class="htl-card">
          <div class="htl-title">Confirmación de los bosones W y Z</div>
          <p>El descubrimiento de los bosones W± y Z⁰ en el CERN validó la teoría electrodébil unificada, en la que el mecanismo de Higgs es esencial. El último eslabón faltante del Modelo Estándar era el propio bosón de Higgs.</p>
        </div>
      </div>

      <div class="htl-item">
        <div class="htl-year">2008</div>
        <div class="htl-dot"></div>
        <div class="htl-card">
          <div class="htl-title">El LHC arranca en el CERN</div>
          <p>El Gran Colisionador de Hadrones (LHC) es el acelerador de partículas más grande del mundo, con un anillo de 27 km de circunferencia bajo la frontera franco-suiza. Dos experimentos principales buscaron el Higgs: <strong>ATLAS</strong> y <strong>CMS</strong>, con más de 3000 y 4000 científicos respectivamente.</p>
        </div>
      </div>

      <div class="htl-item htl-item-highlight">
        <div class="htl-year gold">4 JUL 2012</div>
        <div class="htl-dot htl-dot-gold"></div>
        <div class="htl-card htl-card-gold">
          <div class="htl-title">¡Descubrimiento!</div>
          <p>El CERN anunció el descubrimiento de una nueva partícula consistente con el bosón de Higgs. Tanto ATLAS como CMS reportaron una señal con significancia estadística mayor a 5σ (cinco sigmas), el umbral estándar para una "observación" en física de partículas. Peter Higgs y François Englert recibieron el Premio Nobel de Física en 2013.</p>
        </div>
      </div>

      <div class="htl-item">
        <div class="htl-year">2014</div>
        <div class="htl-dot"></div>
        <div class="htl-card">
          <div class="htl-title">Medición precisa de la masa — Experimento ATLAS</div>
          <p>La colaboración ATLAS analizó los datos completos del Run 1 (colisiones a 7 y 8 TeV) para medir con precisión la masa del bosón de Higgs. El bosón aparece como un pico estrecho en los espectros de masa cuando decae en <strong>dos fotones (H→γγ)</strong> o en <strong>cuatro leptones cargados (H→ZZ*→4ℓ)</strong>.</p>
          <p>La posición del pico sobre el fondo continuo permite medir la masa con gran precisión. El resultado: <strong class="higgs-highlight">125.36 ± 0.41 GeV/c²</strong>, equivalente a unas 130 veces la masa del protón, con una precisión de ~3 partes por mil.</p>
        </div>
      </div>

    </div>

    <!-- Gráfica ATLAS -->
    <div class="higgs-atlas-section">
      <div class="higgs-atlas-title">La señal del Higgs — Datos del detector ATLAS</div>
      <div class="higgs-atlas-body">
        <div class="higgs-atlas-img-wrap">
          <img src="assets/atlas-higgs-graph.png" alt="Gráfica ATLAS del bosón de Higgs" class="higgs-atlas-img" />
          <div class="higgs-atlas-caption">
            Espectro de masa del canal H→γγ medido por ATLAS. El pico alrededor de 125 GeV sobre el fondo continuo es la señal del bosón de Higgs. La curva roja es la suma señal+fondo; la azul punteada es solo el fondo.
          </div>
        </div>
        <div class="higgs-atlas-explain">
          <div class="higgs-atlas-card">
            <div class="higgs-ac-title">¿Cómo se detectó?</div>
            <p>El bosón de Higgs existe solo por un instante (~10⁻²² s) antes de desintegrarse. El detector ATLAS mide los productos de esa desintegración. En el canal H→γγ, dos fotones de alta energía cuya masa invariante reconstruida coincide con ~125 GeV revelan el Higgs.</p>
          </div>
          <div class="higgs-atlas-card">
            <div class="higgs-ac-title">¿Qué es la significancia 5σ?</div>
            <p>En estadística, 5 sigmas significa que la probabilidad de que la señal sea una fluctuación aleatoria del fondo es de apenas 1 en 3.5 millones. Es el criterio que la física de partículas requiere para declarar un descubrimiento.</p>
          </div>
          <div class="higgs-atlas-card">
            <div class="higgs-ac-title">Run 2 y más allá</div>
            <p>Con datos del Run 2 (13 TeV) y el futuro HL-LHC, la medición de la masa podrá mejorarse hasta 10 veces. El Higgs sigue siendo clave para entender la estabilidad del universo ante fluctuaciones cuánticas del vacío.</p>
          </div>
        </div>
      </div>
    </div>

  </div>`;
}

/* ════════════════════════════════════════════
   TAB 2: PROPIEDADES
   ════════════════════════════════════════════ */
function buildTabPropiedades() {
  return `
  <div class="htab-panel" id="hpanel-propiedades">
    <div class="higgs-props-grid">

      <div class="higgs-prop-card" onclick="toggleHiggsProp(this)">
        <div class="hpc-header">
          <div class="hpc-icon">⚖</div>
          <div class="hpc-label">Masa</div>
          <div class="hpc-value gold">125.20 ± 0.11 GeV/c²</div>
        </div>
        <div class="hpc-expand">
          La masa del bosón de Higgs no es predicha por el Modelo Estándar — es un parámetro libre que debe medirse experimentalmente. Vale ~125 GeV/c², aproximadamente 130 veces la masa del protón. Esta masa específica tiene implicaciones profundas: coloca al universo en el borde entre estabilidad e inestabilidad del vacío cuántico.
        </div>
      </div>

      <div class="higgs-prop-card" onclick="toggleHiggsProp(this)">
        <div class="hpc-header">
          <div class="hpc-icon">🔄</div>
          <div class="hpc-label">Espín</div>
          <div class="hpc-value">0 (escalar)</div>
        </div>
        <div class="hpc-expand">
          El Higgs tiene espín 0, lo que lo convierte en el único <strong>bosón escalar</strong> fundamental conocido. A diferencia de los bosones de gauge (espín 1), el campo de Higgs es isotrópico — apunta igual en todas las direcciones del espacio. Esto es lo que permite que rompa la simetría electrodébil de forma espontánea.
        </div>
      </div>

      <div class="higgs-prop-card" onclick="toggleHiggsProp(this)">
        <div class="hpc-header">
          <div class="hpc-icon">⚡</div>
          <div class="hpc-label">Carga eléctrica</div>
          <div class="hpc-value">0</div>
        </div>
        <div class="hpc-expand">
          El bosón de Higgs es eléctricamente neutro. Esto es necesario para que el campo de Higgs tenga un valor esperado en el vacío sin romper la simetría electromagnética — los fotones deben permanecer sin masa incluso después de la ruptura espontánea de simetría electrodébil.
        </div>
      </div>

      <div class="higgs-prop-card" onclick="toggleHiggsProp(this)">
        <div class="hpc-header">
          <div class="hpc-icon">🌐</div>
          <div class="hpc-label">Campo de Higgs</div>
          <div class="hpc-value">Permea todo el espacio</div>
        </div>
        <div class="hpc-expand">
          El bosón de Higgs es la excitación cuántica del campo de Higgs, que tiene un valor no nulo en el vacío (~246 GeV). Las partículas que interactúan con este campo adquieren masa proporcional a la intensidad de esa interacción (acoplamiento de Yukawa). Los fotones y gluones no interactúan con él y por eso tienen masa cero.
        </div>
      </div>

      <div class="higgs-prop-card" onclick="toggleHiggsProp(this)">
        <div class="hpc-header">
          <div class="hpc-icon">💥</div>
          <div class="hpc-label">Vida media</div>
          <div class="hpc-value">~1.6 × 10⁻²² s</div>
        </div>
        <div class="hpc-expand">
          El Higgs es extremadamente inestable. Se desintegra casi instantáneamente en partículas más ligeras. Los canales de desintegración más importantes son: H→bb̄ (58%), H→WW* (21%), H→gg (9%), H→τ⁺τ⁻ (6%) y H→ZZ* (3%). El canal H→γγ (~0.2%) es muy raro pero es el más limpio experimentalmente.
        </div>
      </div>

      <div class="higgs-prop-card" onclick="toggleHiggsProp(this)">
        <div class="hpc-header">
          <div class="hpc-icon">🔗</div>
          <div class="hpc-label">Acoplamiento</div>
          <div class="hpc-value">Proporcional a la masa</div>
        </div>
        <div class="hpc-expand">
          Una predicción clave del Modelo Estándar es que el Higgs se acopla a cada partícula con una intensidad proporcional a su masa. El quark top (173 GeV) interactúa mucho más fuertemente con el Higgs que el electrón (0.511 MeV). Las mediciones del LHC confirman esta relación con gran precisión, una de las comprobaciones más importantes del ME.
        </div>
      </div>

    </div>
  </div>`;
}

/* ════════════════════════════════════════════
   TAB 3: MINIJUEGOS
   ════════════════════════════════════════════ */
function buildTabMinijuegos() {
  return `
  <div class="htab-panel" id="hpanel-minijuegos">
    <div class="higgs-mj-intro">
      Pon a prueba lo que aprendiste sobre el bosón de Higgs con estos dos minijuegos interactivos.
    </div>
    <div class="higgs-mj-grid">

      <div class="higgs-mj-card" onclick="abrirJuegoHiggs('campo-higgs')">
        <div class="higgs-mj-img-wrap">
          <canvas id="hmj-canvas-campo" width="150" height="150" class="mj-card-img"></canvas>
        </div>
        <div class="higgs-mj-info">
          <div class="higgs-mj-nombre">Campo de Higgs</div>
          <p class="higgs-mj-desc">El campo de Higgs permea todo el espacio. Las partículas que más interactúan con él adquieren más masa. Arrastra partículas a través del campo y observa cómo se "frenan" según su masa.</p>
          <div class="higgs-mj-estado proximamente">🔒 Próximamente</div>
        </div>
      </div>

      <div class="higgs-mj-card" onclick="abrirJuegoHiggs('diagramas-higgs')">
        <div class="higgs-mj-img-wrap">
          <canvas id="hmj-canvas-diagramas" width="150" height="150" class="mj-card-img"></canvas>
        </div>
        <div class="higgs-mj-info">
          <div class="higgs-mj-nombre">Diagramas de Feynman</div>
          <p class="higgs-mj-desc">Construye los diagramas de Feynman de producción del bosón de Higgs en el LHC: fusión de gluones (ggF), fusión de bosones vectoriales (VBF) y producción asociada (VH).</p>
          <div class="higgs-mj-estado proximamente">🔒 Próximamente</div>
        </div>
      </div>

    </div>
  </div>`;
}

/* ════════════════════════════════════════════
   TABS — NAVEGACIÓN
   ════════════════════════════════════════════ */
function switchHiggsTab(tab) {
  /* Tabs */
  document.querySelectorAll('.higgs-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('htab-' + tab).classList.add('active');
  /* Paneles */
  document.querySelectorAll('.htab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('hpanel-' + tab).classList.add('active');

  /* Cargar assets de minijuegos al entrar al tab */
  if (tab === 'minijuegos') {
    setTimeout(() => {
      removeBgMJ('minijuegos/assets/higgsfield.png', 'hmj-canvas-campo',    150);
      removeBgMJ('minijuegos/assets/higgs.png',      'hmj-canvas-diagramas', 150);
    }, 50);
  }
}

/* ════════════════════════════════════════════
   PROPIEDADES — TOGGLE EXPAND
   ════════════════════════════════════════════ */
function toggleHiggsProp(card) {
  const wasOpen = card.classList.contains('open');
  document.querySelectorAll('.higgs-prop-card').forEach(c => c.classList.remove('open'));
  if (!wasOpen) card.classList.add('open');
}

/* ════════════════════════════════════════════
   ABRIR MINIJUEGO DESDE HIGGS
   ════════════════════════════════════════════ */
function abrirJuegoHiggs(id) {
  const fnName = `iniciar_${id.replace(/-/g,'_')}`;
  if (typeof window[fnName] === 'function') {
    window[fnName]();
  }
  /* Si no está implementado, no hace nada (el botón muestra "Próximamente") */
}

/* ════════════════════════════════════════════
   CANVAS DE FONDO — PARTÍCULAS FLOTANTES
   ════════════════════════════════════════════ */
function initHiggsBgCanvas() {
  const canvas = document.getElementById('higgs-bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const particles = [];

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  for (let i = 0; i < 35; i++) {
    particles.push({
      x: Math.random(), y: Math.random(),
      r: 1 + Math.random() * 2.5,
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      alpha: 0.2 + Math.random() * 0.5,
      hue: 40 + Math.random() * 40   /* dorado */
    });
  }

  function frame() {
    if (!canvas.isConnected) return;
    resize();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, p.r, 0, Math.PI*2);
      ctx.fillStyle = `hsla(${p.hue},90%,65%,${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', resize);
  resize();
  frame();
}
