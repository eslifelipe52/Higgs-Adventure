/* ══════════════════════════════════════════
   minijuegos/js/minijuego-masa.js
   Minijuego: La Masa

   Etapa 1 — "Calcula la Fuerza"
     3 niveles: el usuario calcula la fuerza
     necesaria para mover cada objeto una
     distancia d en un tiempo t (F = m·2d/t²).

   Etapa 2 — "Acelerador de Partículas"
     Inyecta energía a partículas y observa
     cómo la ecuación E²=(mc²)²+(pc)² evoluciona.

   Etapa 3 — "Puzle de Decaimiento Energético"
     Elige las partículas hijas correctas para
     un decaimiento válido (masa hijas < masa madre).
   ══════════════════════════════════════════ */

/* ════════════════════════════════════════════
   DATOS
   ════════════════════════════════════════════ */
const MASA_PARTICULAS = {
  'e-':  { label:'Electrón (e⁻)',    sym:'e⁻',  symSize:'1.4rem', masa:0.511,    color:'#00bcd4', tipo:'lepton', desc:'Ligero y estable. Su poca masa lo hace ágil.' },
  'nu':  { label:'Neutrino (νₑ)',    sym:'νₑ',  symSize:'1.3rem', masa:0.000002, color:'#4dd0e1', tipo:'lepton', desc:'Casi sin masa. Atraviesa la materia sin sentirla.' },
  'u':   { label:'Quark up (u)',     sym:'u',   symSize:'1.6rem', masa:2.2,      color:'#ff6d00', tipo:'quark',  desc:'Ligero como una pluma dentro del protón.' },
  'd':   { label:'Quark down (d)',   sym:'d',   symSize:'1.6rem', masa:4.7,      color:'#ff6d00', tipo:'quark',  desc:'Ligeramente más pesado que el up. Completa el neutrón.' },
  'mu-': { label:'Muón (μ⁻)',        sym:'μ⁻',  symSize:'1.4rem', masa:105.7,    color:'#00bcd4', tipo:'lepton', desc:'Una versión pesada e inestable del electrón.' },
  's':   { label:'Quark strange (s)',sym:'s',   symSize:'1.6rem', masa:96,       color:'#ff6d00', tipo:'quark',  desc:'Extraño y masivo. Aparece en rayos cósmicos.' },
  'c':   { label:'Quark charm (c)',  sym:'c',   symSize:'1.6rem', masa:1280,     color:'#ff6d00', tipo:'quark',  desc:'El quark encantador. 1ª generación de las pesadas.' },
  'tau': { label:'Tau (τ⁻)',         sym:'τ⁻',  symSize:'1.3rem', masa:1777,     color:'#00bcd4', tipo:'lepton', desc:'El leptón más masivo. Vida brevísima.' },
  'b':   { label:'Quark bottom (b)', sym:'b',   symSize:'1.6rem', masa:4180,     color:'#ff6d00', tipo:'quark',  desc:'El quark fondo. Base de los mesones B.' },
  'W':   { label:'Bosón W±',         sym:'W±',  symSize:'1.2rem', masa:80400,    color:'#7c4dff', tipo:'boson',  desc:'Mediador de la fuerza débil. Muy masivo.' },
  'Z':   { label:'Bosón Z⁰',         sym:'Z⁰',  symSize:'1.2rem', masa:91200,    color:'#7c4dff', tipo:'boson',  desc:'Corriente neutral débil. Casi igual al W.' },
  't':   { label:'Quark top (t)',    sym:'t',   symSize:'1.6rem', masa:173000,   color:'#ff6d00', tipo:'quark',  desc:'El titán. Tan masivo que su vida es un suspiro.' },
  'H':   { label:'Bosón de Higgs',   sym:'H⁰',  symSize:'1.2rem', masa:125100,   color:'#ffd740', tipo:'higgs',  desc:'El responsable de que todo tenga masa.' },
  'y':   { label:'Fotón (γ)',         sym:'γ',   symSize:'1.6rem', masa:0,        color:'#7c4dff', tipo:'boson',  desc:'Energía pura. Sin masa, viaja siempre a c.' },
  'pi':  { label:'Pión (π⁻)',         sym:'π⁻',  symSize:'1.4rem', masa:139.6,    color:'#26a69a', tipo:'hadron', desc:'Hadrón ligero (ū + d). Carga −1. En lo que se materializan los quarks del tau.' },
};

/* Objetos cotidianos para la Etapa 1 */
const MASA_OBJETOS = [
  { label:'Pluma',    masa:0.005,  color:'#ce93d8', img:'minijuegos/assets/pluma.png',    desc:'Casi sin inercia. ¡Facilísimo de empujar!' },
  { label:'Manzana',  masa:0.2,    color:'#ef9a9a', img:'assets/manzana.png',             desc:'Ligera. Poca resistencia al movimiento.' },
  { label:'Libro',    masa:0.5,    color:'#80deea', img:'minijuegos/assets/libro.png',    desc:'Masa moderada. Necesitas más fuerza.' },
  { label:'Gallina',  masa:2,      color:'#fff176', img:'minijuegos/assets/gallina.png',  desc:'Bastante masa para su tamaño.' },
  { label:'Bicicleta',masa:10,     color:'#80cbc4', img:'minijuegos/assets/bicicleta.png',desc:'Masa considerable. ¡Se nota el esfuerzo!' },
  { label:'Jirafa',   masa:1000,   color:'#ffcc80', img:'minijuegos/assets/jirafa.png',   desc:'¡Enorme inercia! Prácticamente imposible.' },
];

/* Caché de imágenes de objetos — se precarga al crear la pantalla */
const MS_OBJ_IMGS = {};

/* ════════════════════════════════════════════
   NIVELES DE LA ETAPA 1 — Calcula la Fuerza
   Física: d = ½·a·t²  →  a = 2d/t²  →  F = m·a
   Tolerancia de aceptación: ±10%
   3 niveles (son 6 objetos por nivel, muchos cálculos).
   ════════════════════════════════════════════ */
const MS_NIVELES_E1 = [
  {
    nivel: 1,
    distancia: 10,   /* metros */
    tiempo: 2,       /* segundos */
    tolerancia: 0.10,
    pista: 'Recuerda: d = ½·a·t², despeja a y luego F = m·a'
  },
  {
    nivel: 2,
    distancia: 20,
    tiempo: 4,
    tolerancia: 0.08,
    pista: 'Más distancia y menos margen. Sé más preciso con cada objeto.'
  },
  {
    nivel: 3,
    distancia: 50,
    tiempo: 5,
    tolerancia: 0.05,
    pista: 'Nivel experto: solo ±5% de margen. Usa la fórmula con cuidado.'
  },
];

/* ════════════════════════════════════════════
   NIVELES DE LA ETAPA 2 — Relatividad y Energía
   Física:
     E_total = mc² / √(1 - β²)        (energía relativista)
     E_total² = (mc²)² + (pc)²
     Para la meta de velocidad β = v/c:
       E_meta = mc² / √(1 - β²)
     Para la meta de energía → β = √(1 - (mc²/E)²)

   Tipos de nivel:
     'velocidad' → el usuario ingresa la Energía (MeV) para alcanzar X% de c
     'porcentaje' → el usuario ingresa el % de c que se alcanza con energía Y dada

   Tolerancia: margen de error aceptado (fracción, ej. 0.05 = ±5%)
   ════════════════════════════════════════════ */
const MS_NIVELES_E2 = [
  {
    nivel: 1,
    tipo: 'velocidad',          /* ¿qué energía necesitas para alcanzar X% de c? */
    metaBeta: 0.80,             /* 80% de c */
    tolerancia: 0.10,
    partes: ['e-', 'u', 'd', 'mu-', 's', 'tau'],
    desc: 'Calcula la energía necesaria para que cada partícula alcance el 80% de la velocidad de la luz.'
  },
  {
    nivel: 2,
    tipo: 'velocidad',
    metaBeta: 0.95,
    tolerancia: 0.07,
    partes: ['e-', 'u', 'd', 'mu-', 's', 'c'],
    desc: 'Ahora alcanza el 95% de c. A velocidades relativistas, necesitas mucha más energía de lo que intuyes.'
  },
  {
    nivel: 3,
    tipo: 'porcentaje',         /* dada una energía E, ¿qué % de c alcanza la partícula? */
    energiaDada: null,          /* se calcula dinámicamente al metaBeta de la partícula más ligera (partes[0]) */
    metaBeta: 0.90,
    tolerancia: 0.07,
    partes: ['e-', 'u', 'd', 'mu-', 's', 'tau'],
    desc: 'Se te da una energía fija. Calcula qué porcentaje de c alcanza cada partícula con esa energía.'
  },
];

/* ════════════════════════════════════════════
   DECAIMIENTOS — ETAPA 3
   El usuario CONSTRUYE el decaimiento eligiendo partículas
   hijas de una paleta. Regla de la etapa (conservación de
   energía): la suma de masas de las hijas debe ser MENOR
   que la masa de la madre. El sobrante se vuelve energía
   cinética (las hijas salen disparadas).
   Cada nivel ofrece una paleta y una combinación objetivo.
   ════════════════════════════════════════════ */
/* Carga eléctrica de cada partícula (en unidades de e) para validar conservación */
const MS_CARGAS = {
  'e-': -1, 'nu': 0, 'u': 2/3, 'd': -1/3, 'mu-': -1,
  's': -1/3, 'c': 2/3, 'tau': -1, 'b': -1/3, 't': 2/3,
  'W': 1,   /* W⁺ en el canal t → W⁺ + b */
  'pi': -1, /* pión π⁻ (hadrón, carga −1) */
};

/* Un decaimiento válido se identifica por su "firma": las claves de las
   hijas ordenadas alfabéticamente y unidas con "+". Así da igual el orden
   en que el usuario añada las partículas. Cada nivel exige encontrar TODAS
   las combinaciones válidas (validas[]) para avanzar. */
const MS_DECAIMIENTOS = [
  {
    nivel: 1,
    madre: 'mu-',             /* carga −1 */
    desc: 'El muón (μ⁻) decae por la fuerza débil. Conserva la CARGA (−1) y masa hija menor a 105.7 MeV.',
    paleta: ['e-', 'nu', 'u', 'd', 'tau'],
    validas: [
      { hijas:['e-','nu','nu'], prob:'~100%',
        nota:'μ⁻ → e⁻ + ν̄ₑ + νμ. El canal casi exclusivo: prácticamente todos los muones decaen así.' },
    ]
  },
  {
    nivel: 2,
    madre: 'tau',             /* carga −1 */
    desc: 'El tau (τ⁻), el leptón más pesado, tiene VARIOS canales de decaimiento. Encuéntralos todos.',
    paleta: ['mu-', 'nu', 'e-', 'pi', 'u', 'd'],
    validas: [
      { hijas:['mu-','nu','nu'], prob:'~17%',
        nota:'τ⁻ → μ⁻ + ν̄μ + ντ. Canal leptónico con muón (~17% de las veces).' },
      { hijas:['e-','nu','nu'],  prob:'~18%',
        nota:'τ⁻ → e⁻ + ν̄ₑ + ντ. Canal leptónico con electrón (~18%).' },
      { hijas:['pi','nu'],       prob:'~65%',
        nota:'τ⁻ → π⁻ + ντ. Canal hadrónico: el W⁻ virtual se materializa en un par de quarks (d + ū) que se agrupan en un pión. En conjunto, los canales hadrónicos son los más probables (~65%).' },
    ]
  },
  {
    nivel: 3,
    madre: 'b',               /* carga −1/3 */
    desc: 'El quark bottom (b) es pesado e inestable. Conserva la carga (−1/3) con masa hija menor a 4180 MeV.',
    paleta: ['c', 'u', 'e-', 'mu-', 'nu', 'd'],
    validas: [
      { hijas:['c','e-','nu'],  prob:'~favorecido',
        nota:'b → c + e⁻ + ν̄ₑ. El canal dominante: el bottom casi siempre decae al charm (transición b→c).' },
      { hijas:['c','mu-','nu'], prob:'~favorecido',
        nota:'b → c + μ⁻ + ν̄μ. Igual que el anterior pero emitiendo un muón.' },
      { hijas:['u','e-','nu'],  prob:'~raro',
        nota:'b → u + e⁻ + ν̄ₑ. Transición b→u, mucho menos frecuente (suprimida por CKM).' },
    ]
  },
  {
    nivel: 4,
    madre: 't',               /* carga +2/3 */
    desc: 'El quark top (t), la partícula más masiva, decae casi instantáneamente. Conserva la carga (+2/3) con masa hija menor a 173 GeV.',
    paleta: ['W', 'b', 'd', 's', 'c', 'u'],
    validas: [
      { hijas:['W','b'], prob:'~100%',
        nota:'t → W⁺ + b. El top es tan pesado que decae casi exclusivamente a un bosón W y un quark bottom, antes incluso de formar hadrones.' },
    ]
  },
];

/* ════════════════════════════════════════════
   ESTADO
   ════════════════════════════════════════════ */
let msScreen  = null;
let msState   = {};
let msRAF     = null;

/* ════════════════════════════════════════════
   ENTRADA
   ════════════════════════════════════════════ */
function iniciar_masa() {
  crearPantallaMasa();
  msIniciarNivel(0);
}

/* ════════════════════════════════════════════
   CREAR PANTALLA
   ════════════════════════════════════════════ */
function crearPantallaMasa() {
  if (msScreen) msScreen.remove();
  msScreen = document.createElement('div');
  msScreen.id = 'ms-screen';
  msScreen.className = 'ms-screen';
  msScreen.innerHTML = `
    <div class="ms-header">
      <div class="ms-instruccion-wrap">
        <div class="ms-instruccion-label">MASA</div>
        <div class="ms-instruccion-icon">⚖</div>
        <p class="ms-instruccion" id="ms-instruccion"></p>
      </div>
    </div>
    <div class="ms-body" id="ms-body">
      <!-- Contenido dinámico por nivel -->
    </div>
    <!-- Feedback -->
    <div class="ms-feedback hidden" id="ms-feedback">
      <div class="ms-fb-icon" id="ms-fb-icon"></div>
      <div class="ms-fb-content">
        <div class="ms-fb-msg" id="ms-fb-msg"></div>
        <div class="ms-fb-exp" id="ms-fb-exp"></div>
        <button class="ms-btn" style="margin-top:10px" onclick="msOcultarFb()">Continuar →</button>
      </div>
    </div>
    <!-- Selector de niveles -->
    <div class="ms-nav-bar">
      <button class="ms-btn ms-btn-volver" onclick="cerrarMasa()">← Volver al ME</button>
      <div class="ms-nivel-dots" id="ms-nivel-dots"></div>
      <div class="ms-progreso-label" id="ms-progreso-label"></div>
    </div>
  `;
  document.getElementById('app').appendChild(msScreen);
  msRenderNivelDots();
}

/* ════════════════════════════════════════════
   INICIAR ETAPA
   ════════════════════════════════════════════ */
function msIniciarNivel(idx) {
  /* Cancelar loops de animación de la etapa anterior antes de reiniciar estado */
  if (msState && msState.e3 && msState.e3.rafId) cancelAnimationFrame(msState.e3.rafId);
  if (msState && msState.n0 && msState.n0.rafId) cancelAnimationFrame(msState.n0.rafId);

  msState = { idx, progreso:0, errores:0, puntaje:0 };
  msRenderNivelDots();
  const body = document.getElementById('ms-body');

  if      (idx === 0) msEtapa1(body);
  else if (idx === 1) msNivel1(body);
  else if (idx === 2) msNivel2(body);
}

/* ════════════════════════════════════════════
   PRECARGAR IMÁGENES DE OBJETOS
   Carga cada PNG en un canvas temporal, elimina
   el fondo negro/oscuro con el algoritmo de
   getImageData, y guarda el canvas limpio en
   MS_OBJ_IMGS para usarlo en drawImage después.
   ════════════════════════════════════════════ */
function msPrecargarObjImgs(cb) {
  let pendiente = MASA_OBJETOS.length;
  MASA_OBJETOS.forEach(obj => {
    if (MS_OBJ_IMGS[obj.img]) { if (!--pendiente) cb(); return; }
    const im = new Image();
    im.onload = () => {
      /* Crear canvas offscreen para limpiar el fondo */
      const SIZE = 256;
      const oc  = document.createElement('canvas');
      oc.width  = SIZE; oc.height = SIZE;
      const octx = oc.getContext('2d');

      /* Escalar imagen al canvas manteniendo relación de aspecto */
      const scale = Math.min(SIZE / im.width, SIZE / im.height);
      const dw = im.width * scale, dh = im.height * scale;
      octx.drawImage(im, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh);

      /* Eliminar píxeles oscuros (fondo negro) */
      const iData = octx.getImageData(0, 0, SIZE, SIZE);
      const d = iData.data;
      const THRESH = 40, TOL = 70;
      for (let i = 0; i < d.length; i += 4) {
        const bright = (d[i] + d[i+1] + d[i+2]) / 3;
        if      (bright < THRESH) d[i+3] = 0;
        else if (bright < TOL)    d[i+3] = Math.round(((bright - THRESH) / (TOL - THRESH)) * 255);
      }
      octx.putImageData(iData, 0, 0);

      /* Guardar el canvas limpio */
      MS_OBJ_IMGS[obj.img] = oc;
      if (!--pendiente) cb();
    };
    im.onerror = () => { MS_OBJ_IMGS[obj.img] = null; if (!--pendiente) cb(); };
    im.src = obj.img;
  });
}

/* ════════════════════════════════════════════
   ETAPA 1: CALCULA LA FUERZA
   3 niveles internos. En cada nivel el usuario
   debe calcular la fuerza F = m·(2d/t²) para
   mover cada objeto la distancia d en tiempo t.
   Se acepta un margen de ±tolerancia.
   ════════════════════════════════════════════ */
function msEtapa1(body) {
  /* Estado interno de la etapa */
  if (!msState.e1) {
    msState.e1 = {
      nivelIdx: 0,                         /* nivel actual (0-4) */
      completados: new Set(),              /* índices de objetos completados este nivel */
      objIdx: null,
      fuerza: 100,
      corriendo: false,
      rafId: null,
      historialNiveles: []                 /* niveles completados para el resumen */
    };
  }
  msRenderEtapa1(body);
}

function msRenderEtapa1(body) {
  const e1  = msState.e1;
  const nv  = MS_NIVELES_E1[e1.nivelIdx];
  /* Fuerza correcta de referencia — solo para calcular el rango inicial del slider */
  const sliderMax = Math.max(10,
    MASA_OBJETOS[MASA_OBJETOS.length-1].masa * (2*nv.distancia / (nv.tiempo**2)) * 5
  );

  document.getElementById('ms-instruccion').textContent =
    `Etapa 1 · Nivel ${nv.nivel}/${MS_NIVELES_E1.length} — Calcula la fuerza necesaria para mover cada objeto ${nv.distancia} m en ${nv.tiempo} s`;

  body.innerHTML = `
    <div class="ms-n0-wrap">

      <!-- Fila superior: instrucciones + tarjetas de objetos -->
      <div class="ms-e1-top-row">

        <!-- Panel de instrucciones fijo -->
        <div class="ms-e1-instrucciones">
          <div class="ms-e1-inst-title">CÓMO JUGAR</div>
          <ol class="ms-e1-inst-lista">
            <li>Selecciona un objeto de la lista.</li>
            <li>Calcula la fuerza necesaria usando:<br>
              <span class="ms-e1-formula">F = m · (2d / t²)</span>
            </li>
            <li>Escribe o ajusta la fuerza y pulsa <strong>LANZAR</strong>.</li>
            <li>Si el objeto llega en el tiempo correcto (±${(MS_NIVELES_E1[e1.nivelIdx].tolerancia*100).toFixed(0)}%), ¡consigues la ✓!</li>
            <li>Completa <strong>todos los objetos</strong> para pasar al siguiente nivel.</li>
          </ol>
          <div class="ms-e1-inst-meta">
            Meta actual: <strong>${MS_NIVELES_E1[e1.nivelIdx].distancia} m</strong> en <strong>${MS_NIVELES_E1[e1.nivelIdx].tiempo} s</strong>
          </div>
          <!-- Indicador de progreso de niveles internos -->
          <div class="ms-e1-niveles-bar">
            ${MS_NIVELES_E1.map((n,i) => `
              <button class="ms-e1-dot ${i < e1.nivelIdx ? 'done' : i === e1.nivelIdx ? 'current' : ''}"
                   title="Nivel ${n.nivel}: ${n.distancia}m en ${n.tiempo}s"
                   ${i < e1.nivelIdx ? `onclick="msE1IrNivel(${i})"` : 'disabled'}
              ></button>
            `).join('')}
            <span class="ms-e1-niveles-label">Nivel ${e1.nivelIdx+1} / ${MS_NIVELES_E1.length}</span>
          </div>
        </div>

        <!-- Tarjetas de objetos -->
        <div class="ms-n0-objetos" id="ms-n0-objetos"></div>

      </div>

      <!-- Arena de simulación -->
      <div class="ms-n0-arena">
        <canvas id="ms-n0-canvas" class="ms-n0-canvas"></canvas>
        <div class="ms-n0-info" id="ms-n0-info">
          <div class="ms-info-row"><span>Objeto:</span><span id="n0-obj-nombre">—</span></div>
          <div class="ms-info-row"><span>Masa:</span><span id="n0-obj-masa">—</span></div>
          <div class="ms-info-row"><span>Meta:</span>
            <span style="color:#ffd740">${nv.distancia} m en ${nv.tiempo} s</span></div>
          <div class="ms-info-row"><span>Tu fuerza:</span><span id="n0-fuerza">— N</span></div>
          <div class="ms-info-row"><span>Aceleración:</span><span id="n0-acel">—</span></div>
          <div class="ms-info-row"><span>Distancia:</span><span id="n0-dist">0 m</span></div>
          <div class="ms-info-row"><span>Tiempo:</span><span id="n0-tiempo">0.0 s</span></div>
        </div>
      </div>

      <!-- Controles -->
      <div class="ms-n0-controles">
        <div class="ms-fuerza-wrap">
          <label class="ms-label">Fuerza a aplicar:</label>
          <div class="ms-fuerza-row">
            <input type="range" id="n0-fuerza-slider" min="0.001" max="1000" step="0.001" value="${e1.fuerza}" class="ms-slider"
                   oninput="msN0SyncDesdeSlider(this.value)">
            <div class="ms-fuerza-input-group">
              <input type="text" id="n0-fuerza-input" class="ms-fuerza-input" value="${e1.fuerza}"
                     maxlength="10"
                     oninput="msN0SyncDesdeTexto(this.value)"
                     onblur="msN0ValidarTexto(this)">
              <span class="ms-fuerza-unidad">N</span>
            </div>
          </div>
          <div class="ms-fuerza-error hidden" id="n0-fuerza-error"></div>
        </div>

        <div class="ms-btn-row">
          <button class="ms-btn ms-btn-empujar" id="n0-btn-empujar" onclick="msE1Lanzar()" disabled>▶ LANZAR</button>
          <button class="ms-btn ms-btn-reset"   onclick="msE1Reset()">↺ Reiniciar</button>
          <button class="calc-toggle-btn"        onclick="Calculadora.toggle()" title="Mini calculadora">🧮 Calc</button>
        </div>

        <!-- Resultado del intento -->
        <div class="ms-e1-resultado hidden" id="ms-e1-resultado"></div>

        <!-- Avance de nivel -->
        <div class="ms-e1-avance hidden" id="ms-e1-avance">
          <div class="ms-conclusion-text" id="ms-e1-avance-texto"></div>
          <button class="ms-btn ms-btn-next" id="ms-e1-btn-sig"></button>
        </div>
      </div>
    </div>
  `;

  /* Render tarjetas de objetos con estado */
  msPrecargarObjImgs(() => {
    const grid = document.getElementById('ms-n0-objetos');
    if (!grid) return;
    MASA_OBJETOS.forEach((obj, i) => {
      const masaLabel = obj.masa < 1
        ? (obj.masa * 1000).toFixed(0) + ' g'
        : obj.masa >= 1000
          ? (obj.masa / 1000).toFixed(0) + ' t'
          : obj.masa + ' kg';
      const completado = e1.completados.has(i);
      const div = document.createElement('div');
      div.className = 'ms-obj-card' + (completado ? ' completado' : '');
      div.style.borderColor = obj.color + '60';
      div.id = `ms-obj-card-${i}`;
      div.innerHTML = `
        <div class="ms-obj-estado">${completado ? '✓' : '···'}</div>
        <div class="ms-obj-img-wrap">
          <canvas class="ms-obj-canvas" id="ms-obj-cvs-${i}" width="72" height="72"></canvas>
        </div>
        <div class="ms-obj-label">${obj.label}</div>
        <div class="ms-obj-masa">${masaLabel}</div>
      `;
      div.addEventListener('click', () => { if (!completado) msE1SeleccionarObj(i, div); });
      grid.appendChild(div);
      msN0DibujarTarjeta(i);
    });
  });

  msState.e1.objIdx = null;
  msE1InitCanvas();
}

function msE1SeleccionarObj(idx, el) {
  document.querySelectorAll('.ms-obj-card:not(.completado)').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  msState.e1.objIdx = idx;
  msE1Reset();
  const obj = MASA_OBJETOS[idx];
  document.getElementById('n0-obj-nombre').textContent = obj.label;
  document.getElementById('n0-obj-masa').textContent =
    obj.masa >= 1 ? obj.masa + ' kg' : (obj.masa*1000).toFixed(0) + ' g';
  document.getElementById('n0-btn-empujar').disabled = false;
  /* Ajustar rango del slider al objeto seleccionado */
  msE1AjustarSlider();
  msE1ActualizarInfo();
}

function msE1ActualizarInfo() {
  const e1  = msState.e1;
  if (e1.objIdx === null) return;
  const obj  = MASA_OBJETOS[e1.objIdx];
  const acel = e1.fuerza / obj.masa;
  document.getElementById('n0-acel').textContent  = acel.toFixed(4) + ' m/s²';
  document.getElementById('n0-fuerza').textContent = msE1FormatearF(e1.fuerza) + ' N';
}

function msE1Reset() {
  const e1 = msState.e1;
  if (e1.rafId) { cancelAnimationFrame(e1.rafId); e1.rafId = null; }
  e1.corriendo = false;
  e1.dist = 0; e1.tiempo_sim = 0;
  document.getElementById('n0-dist').textContent   = '0 m';
  document.getElementById('n0-tiempo').textContent  = '0.0 s';
  const res = document.getElementById('ms-e1-resultado');
  if (res) res.classList.add('hidden');
  msE1Dibujar(0);
}

function msE1InitCanvas() {
  const canvas = document.getElementById('ms-n0-canvas');
  if (!canvas) return;
  canvas.width  = canvas.offsetWidth  || 600;
  canvas.height = canvas.offsetHeight || 200;
  msE1Dibujar(0);
}

/* Lanza la animación con la fuerza ingresada */
function msE1Lanzar() {
  const e1 = msState.e1;
  if (e1.objIdx === null || e1.corriendo) return;

  const nv   = MS_NIVELES_E1[e1.nivelIdx];
  const obj  = MASA_OBJETOS[e1.objIdx];
  const acel = e1.fuerza / obj.masa;   /* a = F/m */

  e1.corriendo = true;
  e1.dist = 0; e1.tiempo_sim = 0;
  let last = performance.now();

  /* Duración máxima de la animación: tiempo teórico × 2 para no esperar forever */
  const tTeorico = nv.tiempo;
  const tMax     = tTeorico * 2.5;

  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    e1.tiempo_sim += dt;
    e1.dist = 0.5 * acel * e1.tiempo_sim ** 2;  /* d = ½at² */

    const progr = Math.min(e1.dist / nv.distancia, 1);
    document.getElementById('n0-dist').textContent   = e1.dist.toFixed(2) + ' m';
    document.getElementById('n0-tiempo').textContent  = e1.tiempo_sim.toFixed(2) + ' s';
    msE1Dibujar(progr);

    /* ¿Llegó a la meta? */
    if (e1.dist >= nv.distancia) {
      e1.corriendo = false;
      msE1Dibujar(1);
      msE1EvaluarResultado(e1.tiempo_sim, nv);
      return;
    }
    /* ¿Superó el tiempo máximo sin llegar? */
    if (e1.tiempo_sim >= tMax) {
      e1.corriendo = false;
      msE1Dibujar(progr);
      msE1EvaluarResultado(e1.tiempo_sim, nv);
      return;
    }
    e1.rafId = requestAnimationFrame(tick);
  }
  e1.rafId = requestAnimationFrame(tick);
}

/* Evalúa si el tiempo alcanzado está dentro del margen */
function msE1EvaluarResultado(tiempoReal, nv) {
  const e1        = msState.e1;
  const obj       = MASA_OBJETOS[e1.objIdx];
  const tObj      = nv.tiempo;
  const fCorrecta = obj.masa * (2 * nv.distancia / (tObj ** 2));
  const margen    = nv.tolerancia;

  /* El tiempo real que tardó con la fuerza del usuario comparado con el objetivo */
  /* Con a=F/m, t = sqrt(2d/a). Si F es correcta t ≈ tObj */
  const acelReal  = e1.fuerza / obj.masa;
  const tReal     = Math.sqrt(2 * nv.distancia / acelReal);  /* tiempo teórico con esa fuerza */

  const diff      = Math.abs(tReal - tObj) / tObj;   /* error relativo en tiempo */
  const ok        = diff <= margen;

  const resEl = document.getElementById('ms-e1-resultado');
  if (!resEl) return;

  if (ok) {
    /* Marcar objeto como completado */
    e1.completados.add(e1.objIdx);
    const card = document.getElementById(`ms-obj-card-${e1.objIdx}`);
    if (card) {
      card.classList.add('completado');
      card.querySelector('.ms-obj-estado').textContent = '✓';
    }
    resEl.className = 'ms-e1-resultado ok';
    resEl.innerHTML = `
      ✓ <strong>¡Correcto!</strong>
      Tu fuerza fue <strong>${e1.fuerza} N</strong>.
      La fuerza exacta es <strong>${fCorrecta.toFixed(2)} N</strong>.
      Error: ${(diff*100).toFixed(1)}% (margen ±${(margen*100).toFixed(0)}%)
    `;
    resEl.classList.remove('hidden');

    /* ¿Se completaron todos los objetos? */
    if (e1.completados.size === MASA_OBJETOS.length) {
      msE1NivelCompletado();
    }
  } else {
    resEl.className = 'ms-e1-resultado err';
    const llegó = e1.dist >= nv.distancia;
    const hint  = tReal < tObj
      ? `Llegaste <strong>demasiado rápido</strong> (${tReal.toFixed(2)} s). Reduce la fuerza.`
      : `Llegaste <strong>demasiado lento</strong> (${tReal.toFixed(2)} s). Aumenta la fuerza.`;
    resEl.innerHTML = `
      ✗ <strong>Intenta de nuevo.</strong>
      ${hint}<br>
      La fuerza exacta para ${obj.label}: <strong>${fCorrecta.toFixed(2)} N</strong>
      (tiempo objetivo: ${tObj} s)
    `;
    resEl.classList.remove('hidden');
  }
}

function msE1NivelCompletado() {
  const e1  = msState.e1;
  const nv  = MS_NIVELES_E1[e1.nivelIdx];
  const avEl = document.getElementById('ms-e1-avance');
  const txtEl = document.getElementById('ms-e1-avance-texto');
  const btnEl = document.getElementById('ms-e1-btn-sig');
  if (!avEl) return;

  const esUltimo = e1.nivelIdx >= MS_NIVELES_E1.length - 1;

  txtEl.innerHTML = esUltimo
    ? `🏆 <strong>¡Completaste la Etapa 1!</strong><br>
       Dominaste F = ma para distancias y tiempos variables.<br>
       ¡Ahora explora cómo la masa se relaciona con la energía en la Etapa 2!`
    : `✓ <strong>¡Nivel ${nv.nivel} completado!</strong>
       Todos los objetos superados.<br>
       Siguiente: ${nv.distancia} m → ${MS_NIVELES_E1[e1.nivelIdx+1].distancia} m en
       ${MS_NIVELES_E1[e1.nivelIdx+1].tiempo} s (margen ±${(MS_NIVELES_E1[e1.nivelIdx+1].tolerancia*100).toFixed(0)}%).`;

  btnEl.textContent = esUltimo ? 'Ir a Etapa 2 →' : `Nivel ${nv.nivel + 1} →`;
  btnEl.onclick = () => {
    if (esUltimo) {
      msIniciarNivel(1);
    } else {
      e1.nivelIdx++;
      e1.completados = new Set();
      e1.objIdx = null;
      msRenderEtapa1(document.getElementById('ms-body'));
    }
  };

  avEl.classList.remove('hidden');
}

/* Navegar a un nivel anterior de la Etapa 1 (desde los dots) */
function msE1IrNivel(idx) {
  const e1 = msState.e1;
  if (idx >= e1.nivelIdx) return;   /* solo niveles ya completados */
  e1.nivelIdx    = idx;
  e1.completados = new Set();       /* reinicia completados para ese nivel */
  e1.objIdx      = null;
  msRenderEtapa1(document.getElementById('ms-body'));
}

function msE1Dibujar(progreso) {
  const canvas = document.getElementById('ms-n0-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const e1  = msState.e1;
  const nv  = MS_NIVELES_E1[e1.nivelIdx];

  /* Fondo oscuro cuadriculado (estética común a todos los minijuegos) */
  mjGridBackground(ctx, W, H);

  /* Pista */
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(0, H*0.65, W, H*0.35);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, H*0.65); ctx.lineTo(W, H*0.65); ctx.stroke();

  /* Línea de inicio */
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
  ctx.beginPath(); ctx.moveTo(W*0.05, 0); ctx.lineTo(W*0.05, H); ctx.stroke();
  ctx.setLineDash([]);

  /* Meta */
  ctx.strokeStyle = 'rgba(0,229,255,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([6,4]);
  ctx.beginPath(); ctx.moveTo(W*0.92, 0); ctx.lineTo(W*0.92, H); ctx.stroke();
  ctx.setLineDash([]);

  /* Etiqueta meta */
  ctx.fillStyle = 'rgba(0,229,255,0.8)'; ctx.font = '10px Orbitron,monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${nv.distancia} m / ${nv.tiempo} s`, W*0.92, H*0.15);
  ctx.fillText('META', W*0.92, H*0.28);

  /* Flecha de fuerza */
  if (e1.objIdx !== null && (e1.corriendo || progreso > 0)) {
    const fNorm    = Math.min(e1.fuerza / (MASA_OBJETOS[MASA_OBJETOS.length-1].masa * 10), 1);
    const arrowLen = 18 + fNorm * 55;
    const objX     = W*0.05 + progreso * (W*0.87);
    ctx.save();
    ctx.strokeStyle = '#ffd740'; ctx.fillStyle = '#ffd740'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(objX - arrowLen, H*0.52);
    ctx.lineTo(objX - 5, H*0.52);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(objX - 5, H*0.52);
    ctx.lineTo(objX - 14, H*0.46);
    ctx.lineTo(objX - 14, H*0.58);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* Objeto */
  if (e1.objIdx !== null) {
    const obj  = MASA_OBJETOS[e1.objIdx];
    const x    = W*0.05 + progreso * (W*0.87);
    const y    = H*0.52;
    const r    = Math.max(36, Math.min(72, 36 + Math.log10(obj.masa * 1000 + 1) * 10));
    const im   = MS_OBJ_IMGS[obj.img];
    if (im) {
      const size = r * 2;
      ctx.save();
      ctx.shadowColor = obj.color; ctx.shadowBlur = 18;
      ctx.drawImage(im, x - size/2, y - size/2, size, size);
      ctx.restore();
    } else {
      ctx.save();
      ctx.shadowColor = obj.color; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
      const g = ctx.createRadialGradient(x-r*.3, y-r*.3, 0, x, y, r);
      g.addColorStop(0, obj.color+'dd'); g.addColorStop(1, obj.color+'66');
      ctx.fillStyle = g; ctx.fill();
      ctx.restore();
    }

    /* Indicador de completado encima del objeto */
    if (e1.completados.has(e1.objIdx)) {
      ctx.save();
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#00e676';
      ctx.shadowColor = '#00e676'; ctx.shadowBlur = 10;
      ctx.fillText('✓', x, y - r - 4);
      ctx.restore();
    }
  }
}

/* ──────────────────────────────────────────
   Dibuja la imagen del objeto en el canvas
   de su tarjeta (usada en msRenderEtapa1)
   ────────────────────────────────────────── */
function msN0DibujarTarjeta(idx) {
  const obj = MASA_OBJETOS[idx];
  const cvs = document.getElementById(`ms-obj-cvs-${idx}`);
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  const W = cvs.width, H = cvs.height;
  ctx.clearRect(0, 0, W, H);
  const im = MS_OBJ_IMGS[obj.img];
  if (im) {
    const scale = Math.min(W / im.width, H / im.height) * 0.9;
    const dw = im.width * scale, dh = im.height * scale;
    ctx.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
  } else {
    ctx.beginPath();
    ctx.arc(W/2, H/2, W*0.38, 0, Math.PI*2);
    ctx.fillStyle = obj.color + '99';
    ctx.fill();
  }
}

/* ──────────────────────────────────────────
   Sincronización del control de fuerza
   Acepta decimales. El rango del slider se
   ajusta dinámicamente al objeto seleccionado.
   ────────────────────────────────────────── */

/* Recalcula el rango del slider según el objeto activo y el nivel actual */
function msE1AjustarSlider() {
  const e1  = msState.e1;
  const nv  = MS_NIVELES_E1[e1.nivelIdx];
  const slider = document.getElementById('n0-fuerza-slider');
  if (!slider || e1.objIdx === null) return;

  const obj       = MASA_OBJETOS[e1.objIdx];
  const fCorrecta = obj.masa * (2 * nv.distancia / (nv.tiempo ** 2));

  /* Rango: 0.001 N → 5× la fuerza correcta (mínimo 10 N de máximo) */
  const sMin = 0.001;
  const sMax = Math.max(10, fCorrecta * 5);

  slider.min  = sMin;
  slider.max  = sMax;
  slider.step = fCorrecta < 1 ? 0.001 : fCorrecta < 100 ? 0.01 : 1;

  /* Si la fuerza guardada está fuera del nuevo rango, la ajustamos */
  const fClamp = Math.max(sMin, Math.min(sMax, e1.fuerza));
  if (fClamp !== e1.fuerza) {
    e1.fuerza = fClamp;
    slider.value = fClamp;
    const inp = document.getElementById('n0-fuerza-input');
    if (inp) inp.value = fClamp;
    document.getElementById('n0-fuerza').textContent = fClamp + ' N';
  } else {
    slider.value = e1.fuerza;
  }
}

function msN0SyncDesdeSlider(val) {
  const v = parseFloat(val);
  if (isNaN(v)) return;
  msState.e1.fuerza = v;
  const inp = document.getElementById('n0-fuerza-input');
  /* Mostrar hasta 4 decimales significativos sin ceros innecesarios */
  if (inp) inp.value = msE1FormatearF(v);
  document.getElementById('n0-fuerza').textContent = msE1FormatearF(v) + ' N';
  msN0OcultarError();
  msE1ActualizarInfo();
}

function msN0SyncDesdeTexto(val) {
  const raw = val.trim().replace(',', '.');
  /* Permitir que el usuario esté escribiendo (termina en punto, o está vacío) */
  if (raw === '' || raw === '.' || raw.endsWith('.')) { msN0OcultarError(); return; }

  const v = parseFloat(raw);
  if (isNaN(v)) { msN0OcultarError(); return; }
  if (v < 0) {
    msN0MostrarError('⚠ La fuerza debe ser positiva');
    return;
  }
  msN0OcultarError();
  msState.e1.fuerza = v;
  const slider = document.getElementById('n0-fuerza-slider');
  if (slider) {
    /* Expandir el slider si el valor escrito supera el máximo actual */
    if (v > parseFloat(slider.max)) slider.max = v * 2;
    slider.value = v;
  }
  document.getElementById('n0-fuerza').textContent = msE1FormatearF(v) + ' N';
  msE1ActualizarInfo();
}

function msN0ValidarTexto(input) {
  const raw = input.value.trim().replace(',', '.');
  const v   = parseFloat(raw);
  if (isNaN(v) || raw === '') {
    /* Restaurar el último valor válido */
    input.value = msE1FormatearF(msState.e1.fuerza);
    msN0OcultarError();
    return;
  }
  if (v < 0) {
    input.value = msE1FormatearF(msState.e1.fuerza);
    msN0MostrarError('⚠ La fuerza debe ser un valor positivo');
    setTimeout(msN0OcultarError, 2500);
    return;
  }
  const vFmt = msE1FormatearF(v);
  input.value = vFmt;
  msState.e1.fuerza = v;
  const slider = document.getElementById('n0-fuerza-slider');
  if (slider) {
    if (v > parseFloat(slider.max)) slider.max = v * 2;
    slider.value = v;
  }
  document.getElementById('n0-fuerza').textContent = vFmt + ' N';
  msN0OcultarError();
  msE1ActualizarInfo();
}

/* Formatea un número de fuerza: hasta 4 cifras significativas sin ceros finales */
function msE1FormatearF(v) {
  if (v === 0) return '0';
  if (v >= 1000) return Math.round(v).toString();
  if (v >= 100)  return v.toFixed(1).replace(/\.0$/, '');
  if (v >= 10)   return v.toFixed(2).replace(/\.?0+$/, '');
  if (v >= 1)    return v.toFixed(3).replace(/\.?0+$/, '');
  return v.toFixed(4).replace(/\.?0+$/, '');
}

function msN0MostrarError(msg) {
  const el = document.getElementById('n0-fuerza-error');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function msN0OcultarError() {
  const el = document.getElementById('n0-fuerza-error');
  if (el) el.classList.add('hidden');
}

/* ════════════════════════════════════════════
   ETAPA 2: RELATIVIDAD Y ENERGÍA
   3 niveles internos. Alterna entre:
   - 'velocidad': ¿qué E necesitas para alcanzar β% de c?
   - 'porcentaje': dada E, ¿qué β% alcanza la partícula?
   Fórmula: E = mc² / √(1-β²)  →  β = √(1-(mc²/E)²)
   ════════════════════════════════════════════ */
function msNivel1(body) {
  if (!msState.e2) {
    msState.e2 = {
      nivelIdx:    0,
      completados: new Set(),
      partKey:     null,
      valor:       0,       /* energía (MeV) o porcentaje ingresado */
    };
  }
  msRenderEtapa2(body);
}

function msRenderEtapa2(body) {
  const e2 = msState.e2;
  const nv = MS_NIVELES_E2[e2.nivelIdx];

  /* Para niveles tipo 'porcentaje', calcular la energía dada como la necesaria
     para la partícula más LIGERA del set al metaBeta del nivel anterior */
  if (nv.tipo === 'porcentaje' && !nv.energiaDada) {
    const partRef = MASA_PARTICULAS[nv.partes[0]];
    const mc2     = partRef.masa;
    nv.energiaDada = parseFloat((mc2 / Math.sqrt(1 - nv.metaBeta ** 2)).toFixed(4));
  }

  const esVel    = nv.tipo === 'velocidad';
  const labelMeta = esVel
    ? `alcanzar el <strong>${(nv.metaBeta*100).toFixed(1)}%</strong> de c`
    : `con E = <strong>${nv.energiaDada} MeV</strong>, calcula el <strong>% de c</strong>`;

  document.getElementById('ms-instruccion').textContent =
    `Etapa 2 · Nivel ${nv.nivel}/${MS_NIVELES_E2.length} — ${nv.desc}`;

  body.innerHTML = `
    <div class="ms-e2-wrap">

      <!-- Fila superior: instrucciones + partículas -->
      <div class="ms-e1-top-row">

        <!-- Panel instrucciones -->
        <div class="ms-e1-instrucciones">
          <div class="ms-e1-inst-title">CÓMO JUGAR</div>
          <div class="ms-e2-beta-nota">
            <strong>β</strong> (beta) es la velocidad como fracción de c:<br>
            <span class="ms-e2-beta-eq">β = v / c</span><br>
            Ej: 80% de c  →  β = 0.80
          </div>
          <ol class="ms-e1-inst-lista">
            ${esVel ? `
            <li>Selecciona una partícula.</li>
            <li>Convierte la meta a β (ej. 80% → β = 0.80).</li>
            <li>Calcula la energía con:<br>
              <span class="ms-e1-formula">E = mc² / √(1−β²)</span>
            </li>
            <li>Ingresa la energía en MeV y pulsa <strong>VERIFICAR</strong>.</li>
            <li>Margen aceptado: ±${(nv.tolerancia*100).toFixed(0)}%</li>
            <li>Completa <strong>todas las partículas</strong> para avanzar.</li>
            ` : `
            <li>Se te da una energía fija (E).</li>
            <li>Calcula β despejando de la ecuación:<br>
              <span class="ms-e1-formula">β = √(1 − (mc²/E)²)</span>
            </li>
            <li>Convierte β a porcentaje: <strong>% de c = β × 100</strong>.</li>
            <li>Ingresa el porcentaje y pulsa <strong>VERIFICAR</strong>.</li>
            <li>Margen aceptado: ±${(nv.tolerancia*100).toFixed(0)}%</li>
            `}
          </ol>
          <div class="ms-e1-inst-meta">
            Meta: ${labelMeta}${esVel ? ` → <strong>β = ${nv.metaBeta.toFixed(2)}</strong>` : ''}
          </div>
          <div class="ms-e1-niveles-bar">
            ${MS_NIVELES_E2.map((n,i) => `
              <button class="ms-e1-dot ${i < e2.nivelIdx ? 'done' : i === e2.nivelIdx ? 'current' : ''}"
                   title="Nivel ${n.nivel}: ${n.tipo === 'velocidad' ? (n.metaBeta*100).toFixed(1)+'% de c' : 'Porcentaje'}"
                   ${i < e2.nivelIdx ? `onclick="msE2IrNivel(${i})"` : 'disabled'}
              ></button>
            `).join('')}
            <span class="ms-e1-niveles-label">Nivel ${e2.nivelIdx+1} / ${MS_NIVELES_E2.length}</span>
          </div>
          <button class="calc-toggle-btn" onclick="Calculadora.toggle()" style="margin-top:4px">🧮 Calculadora</button>
        </div>

        <!-- Tarjetas de partículas -->
        <div class="ms-e2-particulas" id="ms-e2-particulas"></div>
      </div>

      <!-- Panel ecuación + barras -->
      <div class="ms-e2-main">
        <div class="ms-n1-ecuacion" id="ms-e2-ecuacion">
          <div class="ms-ec-title">E² = (mc²)² + (pc)²</div>
          <div class="ms-ec-bars">
            <div class="ms-ec-row">
              <span class="ms-ec-label">Energía total (E)</span>
              <div class="ms-ec-bar-wrap"><div class="ms-ec-bar ms-ec-total"    id="e2-bar-E"></div></div>
              <span class="ms-ec-val" id="e2-val-E">—</span>
            </div>
            <div class="ms-ec-row">
              <span class="ms-ec-label">Masa en reposo (mc²)</span>
              <div class="ms-ec-bar-wrap"><div class="ms-ec-bar ms-ec-masa"     id="e2-bar-m"></div></div>
              <span class="ms-ec-val" id="e2-val-m">—</span>
            </div>
            <div class="ms-ec-row">
              <span class="ms-ec-label">Momento (pc)</span>
              <div class="ms-ec-bar-wrap"><div class="ms-ec-bar ms-ec-cinetica" id="e2-bar-p"></div></div>
              <span class="ms-ec-val" id="e2-val-p">—</span>
            </div>
          </div>
          <div class="ms-ec-vel" id="e2-vel-display">Selecciona una partícula y ajusta el valor</div>
        </div>

        <!-- Controles de entrada -->
        <div class="ms-e2-controles">
          <div class="ms-e2-entrada-wrap">
            <label class="ms-label" id="e2-entrada-label">
              ${esVel ? 'Energía a inyectar:' : `Con E = ${nv.energiaDada} MeV, ingresa el % de c:`}
            </label>
            <div class="ms-fuerza-row">
              <input type="range" id="e2-slider"
                     min="${esVel ? '0.001' : '0'}"
                     max="${esVel ? '10' : '100'}"
                     step="${esVel ? '0.001' : '0.001'}"
                     value="${esVel ? '1' : '50'}" class="ms-slider"
                     oninput="msE2SyncSlider(this.value)">
              <div class="ms-fuerza-input-group">
                <input type="text" id="e2-input" class="ms-fuerza-input"
                       value="${esVel ? '1' : '50'}" maxlength="12"
                       oninput="msE2SyncTexto(this.value)"
                       onblur="msE2ValidarInput(this)">
                <span class="ms-fuerza-unidad">${esVel ? 'MeV' : '%'}</span>
              </div>
            </div>
            <div class="ms-fuerza-error hidden" id="e2-error"></div>
          </div>

          <div class="ms-btn-row">
            <button class="ms-btn ms-btn-empujar" id="e2-btn-verificar"
                    onclick="msE2Verificar()" disabled>✓ VERIFICAR</button>
            <button class="ms-btn ms-btn-reset" onclick="msE2LimpiarResultado()">↺ Limpiar</button>
          </div>

          <div class="ms-e1-resultado hidden" id="e2-resultado"></div>

          <div class="ms-e1-avance hidden" id="e2-avance">
            <div class="ms-conclusion-text" id="e2-avance-texto"></div>
            <button class="ms-btn ms-btn-next" id="e2-btn-sig"></button>
          </div>
        </div>
      </div>
    </div>
  `;

  /* Ajustar rango del slider según partícula y tipo */
  msE2AjustarSlider();

  /* Renderizar tarjetas de partículas */
  const grid = document.getElementById('ms-e2-particulas');
  if (!grid) return;
  nv.partes.forEach(key => {
    const p = MASA_PARTICULAS[key];
    const completado = e2.completados.has(key);
    const div = document.createElement('div');
    div.id        = `e2-card-${key}`;
    div.className = `ms-e2-card${completado ? ' completado' : ''}`;
    div.style.cssText = `border-color:${p.color}55; --pcolor:${p.color}`;
    div.innerHTML = `
      <div class="ms-obj-estado">${completado ? '✓' : '···'}</div>
      <div class="ms-e2-sym" style="color:${p.color};font-size:${p.symSize}">${p.sym}</div>
      <div class="ms-e2-nombre">${p.label}</div>
      <div class="ms-e2-masa">${msE2FormatMasa(p.masa)} MeV/c²</div>
      <div class="ms-e2-tipo ms-e2-tipo-${p.tipo}">${p.tipo}</div>
    `;
    div.addEventListener('click', () => { if (!completado) msE2SeleccionarPart(key, div); });
    grid.appendChild(div);
  });

  /* Seleccionar automáticamente la primera no completada */
  const primera = nv.partes.find(k => !e2.completados.has(k));
  if (primera) {
    const divPrimera = document.getElementById(`e2-card-${primera}`);
    if (divPrimera) msE2SeleccionarPart(primera, divPrimera);
  }
}

function msE2FormatMasa(m) {
  if (m < 0.001)  return m.toExponential(2);
  if (m < 1)      return m.toFixed(3);
  if (m < 1000)   return m.toFixed(1);
  return (m/1000).toFixed(2) + ' GeV';
}

function msE2SeleccionarPart(key, el) {
  document.querySelectorAll('.ms-e2-card:not(.completado)').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  msState.e2.partKey = key;
  document.getElementById('e2-btn-verificar').disabled = false;
  msE2AjustarSlider();
  msE2ActualizarBarras();
}

/* Calcula la energía exacta para alcanzar metaBeta con la partícula seleccionada */
function msE2EnergiaExacta(key, beta) {
  const mc2 = MASA_PARTICULAS[key].masa;
  if (mc2 === 0) return 0;  /* fotón: masa 0, siempre a c */
  return mc2 / Math.sqrt(1 - beta * beta);
}

/* Calcula el beta exacto para una energía dada */
function msE2BetaDeEnergia(key, E) {
  const mc2 = MASA_PARTICULAS[key].masa;
  if (mc2 === 0) return 1;
  if (E <= mc2)  return 0;
  return Math.sqrt(1 - (mc2 / E) ** 2);
}

function msE2AjustarSlider() {
  const e2  = msState.e2;
  const nv  = MS_NIVELES_E2[e2.nivelIdx];
  const slider = document.getElementById('e2-slider');
  if (!slider) return;

  if (nv.tipo === 'velocidad' && e2.partKey) {
    const mc2      = MASA_PARTICULAS[e2.partKey].masa;
    const eExacta  = mc2 > 0 ? msE2EnergiaExacta(e2.partKey, nv.metaBeta) : mc2 + 1;
    slider.min   = 0.001;
    slider.max   = Math.max(eExacta * 4, mc2 * 2 + 1).toFixed(3);
    slider.step  = eExacta < 1 ? 0.0001 : eExacta < 100 ? 0.01 : 1;
    const valorActual = Math.min(parseFloat(slider.max), Math.max(parseFloat(slider.min), e2.valor || (eExacta * 0.5)));
    slider.value = valorActual;
    e2.valor = parseFloat(valorActual);
    const inp = document.getElementById('e2-input');
    if (inp) inp.value = msE1FormatearF(valorActual);
  } else if (nv.tipo === 'porcentaje') {
    slider.min  = 0;
    slider.max  = 99.9999;
    slider.step = 0.0001;
    const v = e2.valor || 80;
    slider.value = v;
    const inp = document.getElementById('e2-input');
    if (inp) inp.value = msE1FormatearF(v);
  }
}

function msE2SyncSlider(val) {
  const v = parseFloat(val);
  if (isNaN(v)) return;
  msState.e2.valor = v;
  const inp = document.getElementById('e2-input');
  if (inp) inp.value = msE1FormatearF(v);
  msE2ActualizarBarras();
}

function msE2SyncTexto(val) {
  const raw = val.trim().replace(',', '.');
  if (raw === '' || raw === '.' || raw.endsWith('.')) return;
  const v = parseFloat(raw);
  if (isNaN(v) || v < 0) return;
  msState.e2.valor = v;
  const slider = document.getElementById('e2-slider');
  if (slider) {
    if (v > parseFloat(slider.max)) slider.max = v * 2;
    slider.value = v;
  }
  msE2ActualizarBarras();
}

function msE2ValidarInput(input) {
  const v = parseFloat(input.value.replace(',', '.'));
  if (isNaN(v)) { input.value = msE1FormatearF(msState.e2.valor || 0); return; }
  input.value = msE1FormatearF(v);
  msState.e2.valor = v;
  msE2ActualizarBarras();
}

/* Actualiza las barras y la velocidad en tiempo real */
function msE2ActualizarBarras() {
  const e2  = msState.e2;
  const nv  = MS_NIVELES_E2[e2.nivelIdx];
  if (!e2.partKey) return;

  const p   = MASA_PARTICULAS[e2.partKey];
  const mc2 = p.masa;
  let E, beta;

  if (nv.tipo === 'velocidad') {
    E    = e2.valor;
    beta = p.masa === 0 ? 1 : (E <= mc2 ? 0 : Math.sqrt(1 - (mc2/E)**2));
  } else {
    E    = nv.energiaDada;
    beta = e2.valor / 100;
    beta = Math.max(0, Math.min(0.9999999, beta));
  }

  const pc2sq = Math.max(0, E*E - mc2*mc2);
  const pc    = Math.sqrt(pc2sq);
  const maxBar = Math.max(E*E, 1);

  const barE = document.getElementById('e2-bar-E');
  const barM = document.getElementById('e2-bar-m');
  const barP = document.getElementById('e2-bar-p');
  if (barE) barE.style.width = '100%';
  if (barM) barM.style.width = `${Math.min(mc2*mc2/maxBar*100,100)}%`;
  if (barP) barP.style.width = `${Math.min(pc2sq/maxBar*100,100)}%`;

  /* NOTA: no mostramos la velocidad (β) ni γ aquí a propósito, porque son
     justamente lo que el usuario debe calcular. Mostrarlos permitiría
     "atinar" la respuesta moviendo el slider sin hacer el cálculo. */
  const velEl = document.getElementById('e2-vel-display');
  if (velEl) {
    velEl.textContent = `Energía actual: ${msE1FormatearF(E)} MeV  ·  mc² = ${msE1FormatearF(mc2)} MeV`;
  }

  const valE = document.getElementById('e2-val-E');
  const valM = document.getElementById('e2-val-m');
  const valP = document.getElementById('e2-val-p');
  if (valE) valE.textContent = msE1FormatearF(E) + ' MeV';
  if (valM) valM.textContent = msE1FormatearF(mc2) + ' MeV (mc²)';
  if (valP) valP.textContent = msE1FormatearF(pc) + ' MeV/c';
}

function msE2Verificar() {
  const e2 = msState.e2;
  const nv = MS_NIVELES_E2[e2.nivelIdx];
  if (!e2.partKey) return;

  const p   = MASA_PARTICULAS[e2.partKey];
  const mc2 = p.masa;
  const tol = nv.tolerancia;
  let ok, resHtml, valorCorrecto;

  if (nv.tipo === 'velocidad') {
    const eExacta  = mc2 > 0 ? msE2EnergiaExacta(e2.partKey, nv.metaBeta) : 0;
    const userE    = e2.valor;

    if (mc2 === 0) {
      /* Fotón: masa 0 siempre viaja a c — cualquier E > 0 es "correcta" en física real */
      ok = userE > 0;
      valorCorrecto = 'El fotón siempre viaja a c (masa = 0)';
      resHtml = ok
        ? `✓ <strong>¡Correcto!</strong> El fotón (γ) tiene masa 0: no importa la energía, siempre viaja exactamente a c.`
        : `✗ Ingresa cualquier valor positivo de energía. El fotón siempre va a c.`;
    } else {
      const diff = Math.abs(userE - eExacta) / eExacta;
      ok = diff <= tol;
      valorCorrecto = `${msE1FormatearF(eExacta)} MeV`;
      const betaReal = msE2BetaDeEnergia(e2.partKey, userE);
      resHtml = ok
        ? `✓ <strong>¡Correcto!</strong> Tu energía fue <strong>${msE1FormatearF(userE)} MeV</strong>.
           La exacta es <strong>${valorCorrecto}</strong>.
           Velocidad lograda: ${(betaReal*100).toFixed(3)}% de c.`
        : `✗ <strong>Intenta de nuevo.</strong>
           Tu energía: ${msE1FormatearF(userE)} MeV → ${(betaReal*100).toFixed(3)}% de c.<br>
           ${betaReal < nv.metaBeta
             ? `Necesitas <strong>más energía</strong> para llegar al ${(nv.metaBeta*100).toFixed(1)}% de c.`
             : `Pusiste <strong>demasiada energía</strong>. La exacta es ${valorCorrecto}.`
           }<br><small>Error: ${(diff*100).toFixed(2)}% (margen ±${(tol*100).toFixed(0)}%)</small>`;
    }
  } else {
    /* tipo 'porcentaje' */
    const betaExacta = msE2BetaDeEnergia(e2.partKey, nv.energiaDada);
    const userBeta   = e2.valor / 100;
    const diff       = Math.abs(userBeta - betaExacta) / (betaExacta > 0 ? betaExacta : 1);
    ok = diff <= tol;
    valorCorrecto    = `${(betaExacta*100).toFixed(4)}%`;
    resHtml = ok
      ? `✓ <strong>¡Correcto!</strong> Con ${nv.energiaDada} MeV, ${p.label} alcanza
         <strong>${(betaExacta*100).toFixed(4)}%</strong> de c.
         Tu respuesta: ${msE1FormatearF(e2.valor)}%.`
      : `✗ <strong>Intenta de nuevo.</strong>
         Con ${nv.energiaDada} MeV, ${p.label} alcanza ${valorCorrecto} de c.<br>
         Tu respuesta: ${msE1FormatearF(e2.valor)}% — error ${(diff*100).toFixed(2)}% (margen ±${(tol*100).toFixed(0)}%)`;
  }

  const resEl = document.getElementById('e2-resultado');
  if (resEl) {
    resEl.className = `ms-e1-resultado ${ok ? 'ok' : 'err'}`;
    resEl.innerHTML = resHtml;
    resEl.classList.remove('hidden');
  }

  if (ok) {
    e2.completados.add(e2.partKey);
    const card = document.getElementById(`e2-card-${e2.partKey}`);
    if (card) {
      card.classList.add('completado');
      const estadoEl = card.querySelector('.ms-obj-estado');
      if (estadoEl) estadoEl.textContent = '✓';
    }

    if (e2.completados.size === nv.partes.length) {
      msE2NivelCompletado();
    } else {
      /* Seleccionar automáticamente la siguiente sin completar */
      const sig = nv.partes.find(k => !e2.completados.has(k));
      if (sig) {
        setTimeout(() => {
          const divSig = document.getElementById(`e2-card-${sig}`);
          if (divSig) msE2SeleccionarPart(sig, divSig);
        }, 800);
      }
    }
  }
}

function msE2LimpiarResultado() {
  const el = document.getElementById('e2-resultado');
  if (el) el.classList.add('hidden');
}

/* Navegar a un nivel anterior de la Etapa 2 */
function msE2IrNivel(idx) {
  const e2 = msState.e2;
  if (idx >= e2.nivelIdx) return;
  e2.nivelIdx    = idx;
  e2.completados = new Set();
  e2.partKey     = null;
  e2.valor       = 0;
  msRenderEtapa2(document.getElementById('ms-body'));
}

function msE2NivelCompletado() {
  const e2  = msState.e2;
  const nv  = MS_NIVELES_E2[e2.nivelIdx];
  const avEl  = document.getElementById('e2-avance');
  const txtEl = document.getElementById('e2-avance-texto');
  const btnEl = document.getElementById('e2-btn-sig');
  if (!avEl) return;

  const esUltimo = e2.nivelIdx >= MS_NIVELES_E2.length - 1;

  txtEl.innerHTML = esUltimo
    ? `🏆 <strong>¡Completaste la Etapa 2!</strong><br>
       Dominaste la energía relativista E = mc²/√(1−β²).<br>
       ¡Ahora descubre cómo las partículas se transforman unas en otras en la Etapa 3!`
    : `✓ <strong>¡Nivel ${nv.nivel} completado!</strong><br>
       Siguiente: ${MS_NIVELES_E2[e2.nivelIdx+1].tipo === 'velocidad'
         ? `alcanza el ${(MS_NIVELES_E2[e2.nivelIdx+1].metaBeta*100).toFixed(1)}% de c`
         : `calcula el % de c a partir de una energía dada`
       } (margen ±${(MS_NIVELES_E2[e2.nivelIdx+1].tolerancia*100).toFixed(0)}%).`;

  btnEl.textContent = esUltimo ? 'Ir a Etapa 3 →' : `Nivel ${nv.nivel + 1} →`;
  btnEl.onclick = () => {
    if (esUltimo) {
      msIniciarNivel(2);
    } else {
      e2.nivelIdx++;
      e2.completados = new Set();
      e2.partKey = null;
      e2.valor   = 0;
      msRenderEtapa2(document.getElementById('ms-body'));
    }
  };
  avEl.classList.remove('hidden');
}

/* ─── función msN1Update conservada como alias por si algo la referencia ─── */
function msN1Update(v) { msE2SyncSlider(v); }

/* ════════════════════════════════════════════
   ETAPA 3: PUZLE DE DECAIMIENTO (construcción + animación)
   ════════════════════════════════════════════ */
function msNivel2(body) {
  if (!msState.e3) {
    msState.e3 = { nivelIdx: 0, hijas: [], resuelto: false, rafId: null, encontradas: new Set() };
  }
  msRenderEtapa3(body);
}

/* Firma canónica de una lista de hijas (orden-independiente) */
function msE3Firma(hijas) {
  return hijas.slice().sort().join('+');
}

function msRenderEtapa3(body) {
  const e3  = msState.e3;
  const dec = MS_DECAIMIENTOS[e3.nivelIdx];
  const madre   = MASA_PARTICULAS[dec.madre];
  const masaMadre = madre.masa;

  document.getElementById('ms-instruccion').textContent =
    `Etapa 3 · Nivel ${dec.nivel}/${MS_DECAIMIENTOS.length} — ${madre.label} es inestable. Construye su decaimiento.`;

  body.innerHTML = `
    <div class="ms-e3-wrap">

      <!-- Fila superior: instrucciones + paleta -->
      <div class="ms-e1-top-row">

        <!-- Panel instrucciones -->
        <div class="ms-e1-instrucciones">
          <div class="ms-e1-inst-title">CÓMO JUGAR</div>
          <ol class="ms-e1-inst-lista">
            <li>Madre: <strong>${madre.label}</strong> (${madre.masa.toLocaleString()} MeV/c²).</li>
            <li>Haz clic en partículas hijas para añadirlas.</li>
            <li>Debe conservarse la <strong>masa</strong> (Σ hijas &lt; madre), la <strong>carga</strong> y el <strong>número leptónico</strong>.</li>
            <li>Pulsa <strong>DECAER</strong> para ver la animación.</li>
          </ol>
          <div class="ms-e1-inst-meta">
            Σ masas &lt; <strong>${madre.masa.toLocaleString()} MeV</strong> · carga = <strong>${msE3FmtCarga(MS_CARGAS[dec.madre])}</strong>
          </div>
          <div class="ms-e3-leptonico">
            <strong>🔎 Número leptónico:</strong> cada leptón (e⁻, μ⁻, τ⁻) necesita
            su propio neutrino que lo balancee. Un leptón no puede decaer en puros quarks.
          </div>
          <div class="ms-e1-niveles-bar">
            ${MS_DECAIMIENTOS.map((n,i) => `
              <button class="ms-e1-dot ${i < e3.nivelIdx ? 'done' : i === e3.nivelIdx ? 'current' : ''}"
                   title="Nivel ${n.nivel}"
                   ${i < e3.nivelIdx ? `onclick="msE3IrNivel(${i})"` : 'disabled'}
              ></button>
            `).join('')}
            <span class="ms-e1-niveles-label">Nivel ${e3.nivelIdx+1} / ${MS_DECAIMIENTOS.length}</span>
          </div>
          <button class="calc-toggle-btn" onclick="Calculadora.toggle()" style="margin-top:4px">🧮 Calculadora</button>
        </div>

        <!-- Paleta de partículas hijas -->
        <div class="ms-e3-paleta" id="ms-e3-paleta"></div>
      </div>

      <!-- Zona principal: animación (izq) + controles (der), sin scroll -->
      <div class="ms-e3-main">

        <!-- Animación del decaimiento -->
        <canvas id="ms-e3-canvas" class="ms-e3-canvas"></canvas>

        <!-- Controles a la derecha -->
        <div class="ms-e3-panel">
          <div class="ms-e3-balance">
            <div class="ms-e3-bal-row">
              <span>Σ masas hijas:</span>
              <strong id="ms-e3-suma">0 MeV</strong>
            </div>
            <div class="ms-e3-bal-row">
              <span>Energía cinética:</span>
              <strong id="ms-e3-cinetica" style="color:#00e676">—</strong>
            </div>
            <div class="ms-e3-bal-row">
              <span>Carga (meta ${msE3FmtCarga(MS_CARGAS[dec.madre])}):</span>
              <strong id="ms-e3-carga" style="color:var(--text2)">0</strong>
            </div>
          </div>

          <div class="ms-e3-hijas-sel" id="ms-e3-hijas-sel">
            <span class="ms-e3-hijas-vacio">Añade partículas hijas desde la paleta ↑</span>
          </div>

          <div class="ms-btn-row">
            <button class="ms-btn ms-btn-empujar" id="ms-e3-decaer" onclick="msE3Decaer()" disabled>⚛ DECAER</button>
            <button class="ms-btn ms-btn-reset" onclick="msE3Limpiar()">↺ Limpiar</button>
          </div>

          <!-- Resultado (justo bajo los botones, siempre visible) -->
          <div class="ms-e1-resultado hidden" id="ms-e3-resultado"></div>

          <div class="ms-e1-avance hidden" id="ms-e3-avance">
            <div class="ms-conclusion-text" id="ms-e3-avance-texto"></div>
            <button class="ms-btn ms-btn-next" id="ms-e3-btn-sig"></button>
          </div>

          <!-- Progreso de canales encontrados -->
          <div class="ms-e3-canales">
            <div class="ms-e3-canales-title">
              Canales encontrados: <strong id="ms-e3-canales-cont">0 / ${dec.validas.length}</strong>
            </div>
            <div class="ms-e3-canales-lista" id="ms-e3-canales-lista"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  e3.hijas       = [];
  e3.resuelto    = false;
  e3.encontradas = new Set();   /* canales hallados en este nivel */
  if (e3.rafId) { cancelAnimationFrame(e3.rafId); e3.rafId = null; }

  msE3RenderPaleta();
  msE3RenderHijas();
  msE3RenderCanales();

  const canvas = document.getElementById('ms-e3-canvas');
  e3.canvas = canvas;
  e3.ctx    = canvas.getContext('2d');
  function ajustar() {
    canvas.width  = canvas.offsetWidth  || 500;
    canvas.height = canvas.offsetHeight || 220;
  }
  ajustar();
  /* re-medir en el siguiente frame por si el grid aún no se había asentado */
  requestAnimationFrame(ajustar);
  window.addEventListener('resize', ajustar);
  e3.anim = null;
  msE3Loop();
}

function msE3RenderPaleta() {
  const e3  = msState.e3;
  const dec = MS_DECAIMIENTOS[e3.nivelIdx];
  const cont = document.getElementById('ms-e3-paleta');
  if (!cont) return;
  cont.innerHTML = dec.paleta.map(key => {
    const p = MASA_PARTICULAS[key];
    return `<button class="ms-e3-part" style="border-color:${p.color}55;--pc:${p.color}"
                    onclick="msE3Agregar('${key}')">
      <span class="ms-e3-sym" style="color:${p.color};font-size:${p.symSize}">${p.sym}</span>
      <span class="ms-e3-part-masa">${msE3FmtMasa(p.masa)}</span>
    </button>`;
  }).join('');
}

function msE3FmtMasa(m) {
  if (m < 0.001) return '~0';
  if (m < 1)     return m.toFixed(3) + ' MeV';
  if (m < 1000)  return m.toFixed(1) + ' MeV';
  return (m/1000).toFixed(2) + ' GeV';
}

/* Formatea una carga eléctrica como fracción legible (ej. +2/3, −1/3, −1, 0) */
function msE3FmtCarga(q) {
  if (Math.abs(q) < 1e-9) return '0';
  const signo = q < 0 ? '−' : '+';
  const a = Math.abs(q);
  if (Math.abs(a - 1) < 1e-9)   return signo + '1';
  if (Math.abs(a - 2/3) < 1e-9) return signo + '2/3';
  if (Math.abs(a - 1/3) < 1e-9) return signo + '1/3';
  /* suma de fracciones: redondear a 2 decimales */
  return signo + a.toFixed(2);
}

function msE3Agregar(key) {
  const e3 = msState.e3;
  if (e3.resuelto) return;
  if (e3.hijas.length >= 5) return;
  e3.hijas.push(key);
  msE3RenderHijas();
}

function msE3Limpiar() {
  const e3 = msState.e3;
  if (e3.resuelto) return;
  e3.hijas = [];
  e3.anim = null;
  msE3RenderHijas();
}

function msE3RenderHijas() {
  const e3  = msState.e3;
  const dec = MS_DECAIMIENTOS[e3.nivelIdx];
  const madre = MASA_PARTICULAS[dec.madre];
  const cont = document.getElementById('ms-e3-hijas-sel');
  const sumaEl = document.getElementById('ms-e3-suma');
  const cinEl  = document.getElementById('ms-e3-cinetica');
  const cargaEl = document.getElementById('ms-e3-carga');
  const btn    = document.getElementById('ms-e3-decaer');

  const suma = e3.hijas.reduce((s, k) => s + MASA_PARTICULAS[k].masa, 0);
  const cinetica = madre.masa - suma;
  const cargaHijas = e3.hijas.reduce((s, k) => s + (MS_CARGAS[k] || 0), 0);
  const cargaMadre = MS_CARGAS[dec.madre];
  const cargaOk = Math.abs(cargaHijas - cargaMadre) < 1e-9;

  if (sumaEl) sumaEl.textContent = msE3FmtMasa(suma);
  if (cinEl) {
    cinEl.textContent = cinetica >= 0 ? '+' + msE3FmtMasa(cinetica) : msE3FmtMasa(cinetica);
    cinEl.style.color = cinetica >= 0 ? '#00e676' : '#ff5252';
  }
  if (cargaEl) {
    cargaEl.textContent = msE3FmtCarga(cargaHijas);
    cargaEl.style.color = e3.hijas.length === 0 ? 'var(--text2)' : (cargaOk ? '#00e676' : '#ff5252');
  }
  if (btn) btn.disabled = e3.hijas.length === 0 || e3.resuelto;

  if (cont) {
    if (e3.hijas.length === 0) {
      cont.innerHTML = '<span class="ms-e3-hijas-vacio">Añade partículas hijas desde la paleta →</span>';
    } else {
      cont.innerHTML = e3.hijas.map((k, i) => {
        const p = MASA_PARTICULAS[k];
        return `<span class="ms-e3-hija-chip" style="--pc:${p.color}" onclick="msE3Quitar(${i})" title="Quitar">
          <span style="color:${p.color}">${p.sym}</span> ✕
        </span>`;
      }).join(' + ');
    }
  }
}

function msE3Quitar(i) {
  const e3 = msState.e3;
  if (e3.resuelto) return;
  e3.hijas.splice(i, 1);
  msE3RenderHijas();
}

function msE3Decaer() {
  const e3  = msState.e3;
  if (e3.hijas.length === 0) return;
  const dec = MS_DECAIMIENTOS[e3.nivelIdx];
  const madre = MASA_PARTICULAS[dec.madre];
  const suma  = e3.hijas.reduce((s, k) => s + MASA_PARTICULAS[k].masa, 0);
  const cinetica = madre.masa - suma;
  const cargaHijas = e3.hijas.reduce((s, k) => s + (MS_CARGAS[k] || 0), 0);
  const cargaMadre = MS_CARGAS[dec.madre];
  const cargaOk = Math.abs(cargaHijas - cargaMadre) < 1e-9;
  const resEl = document.getElementById('ms-e3-resultado');

  /* Validación 1: conservación de masa-energía */
  if (cinetica <= 0) {
    if (resEl) {
      resEl.className = 'ms-e1-resultado err';
      resEl.innerHTML = `✗ <strong>Imposible por energía.</strong> La masa de las hijas (${msE3FmtMasa(suma)})
        es mayor o igual que la de la madre (${msE3FmtMasa(madre.masa)}). ¡Elige hijas más ligeras!`;
      resEl.classList.remove('hidden');
    }
    return;
  }

  /* Validación 2: conservación de la carga eléctrica */
  if (!cargaOk) {
    if (resEl) {
      resEl.className = 'ms-e1-resultado err';
      resEl.innerHTML = `✗ <strong>No se conserva la carga.</strong>
        Las hijas suman <strong>${msE3FmtCarga(cargaHijas)}</strong>,
        pero la madre tiene <strong>${msE3FmtCarga(cargaMadre)}</strong>. La carga debe conservarse.`;
      resEl.classList.remove('hidden');
    }
    return;
  }

  /* Validación 3: ¿es uno de los canales reales de este nivel? */
  const firma = msE3Firma(e3.hijas);
  const canal = dec.validas.find(v => msE3Firma(v.hijas) === firma);

  if (!canal) {
    if (resEl) {
      resEl.className = 'ms-e1-resultado err';
      resEl.innerHTML = `⚠ <strong>Masa y carga OK, pero no es un canal real.</strong>
        Falta conservar el <strong>número leptónico</strong>: cada leptón que creas
        (e⁻, μ⁻...) exige su propio neutrino de la misma familia para balancear.
        Un leptón tampoco puede convertirse en puros quarks. Ajusta añadiendo
        los neutrinos que faltan.`;
      resEl.classList.remove('hidden');
    }
    return;
  }

  /* ¿Ya encontrado antes? */
  if (e3.encontradas.has(firma)) {
    if (resEl) {
      resEl.className = 'ms-e1-resultado ok';
      resEl.innerHTML = `✓ Ese canal ya lo tenías. Busca los que faltan.`;
      resEl.classList.remove('hidden');
    }
    return;
  }

  /* ¡Canal nuevo encontrado! → animar y registrar */
  e3.encontradas.add(firma);
  msE3IniciarAnim();

  const faltan = dec.validas.length - e3.encontradas.size;
  if (resEl) {
    resEl.className = 'ms-e1-resultado ok';
    resEl.innerHTML = `✓ <strong>¡Canal válido! (${canal.prob})</strong> ${canal.nota}` +
      (faltan > 0 ? `<br><small>Faltan ${faltan} canal(es) por descubrir.</small>` : '');
    resEl.classList.remove('hidden');
  }

  msE3RenderCanales();

  /* Limpiar la selección para construir el siguiente canal */
  e3.hijas = [];
  msE3RenderHijas();

  /* ¿Encontró TODOS los canales? → desbloquear avance */
  const avEl  = document.getElementById('ms-e3-avance');
  const btnEl = document.getElementById('ms-e3-btn-sig');
  if (e3.encontradas.size >= dec.validas.length) {
    e3.resuelto = true;
    const esUltimo = e3.nivelIdx >= MS_DECAIMIENTOS.length - 1;
    if (btnEl) {
      btnEl.textContent = esUltimo ? '🏆 Ver conclusión →' : 'Siguiente nivel →';
      btnEl.onclick = () => {
        if (esUltimo) { msE3Final(); }
        else { e3.nivelIdx++; msRenderEtapa3(document.getElementById('ms-body')); }
      };
    }
    if (avEl) avEl.classList.remove('hidden');
    document.getElementById('ms-e3-decaer').disabled = true;
  }
}

/* Renderiza la lista de canales (encontrados con su probabilidad, pendientes ocultos) */
function msE3RenderCanales() {
  const e3  = msState.e3;
  const dec = MS_DECAIMIENTOS[e3.nivelIdx];
  const cont = document.getElementById('ms-e3-canales-lista');
  const contEl = document.getElementById('ms-e3-canales-cont');
  if (contEl) contEl.textContent = `${e3.encontradas.size} / ${dec.validas.length}`;
  if (!cont) return;

  cont.innerHTML = dec.validas.map((v, i) => {
    const encontrado = e3.encontradas.has(msE3Firma(v.hijas));
    if (encontrado) {
      const simbolos = v.hijas.map(k => MASA_PARTICULAS[k].sym).join(' + ');
      return `<div class="ms-e3-canal hallado">
        <div class="ms-e3-canal-top">
          <span class="ms-e3-canal-eq">${MASA_PARTICULAS[dec.madre].sym} → ${simbolos}</span>
          <span class="ms-e3-canal-prob">${v.prob}</span>
        </div>
      </div>`;
    }
    return `<div class="ms-e3-canal oculto">
      <span class="ms-e3-canal-eq">Canal ${i+1}: ??? </span>
      <span class="ms-e3-canal-prob">?</span>
    </div>`;
  }).join('');
}

function msE3IrNivel(idx) {
  const e3 = msState.e3;
  if (idx >= e3.nivelIdx) return;
  e3.nivelIdx = idx;
  msRenderEtapa3(document.getElementById('ms-body'));
}

/* ── Animación del decaimiento ── */
function msE3IniciarAnim() {
  const e3 = msState.e3;
  const canvas = e3.canvas;
  if (!canvas) return;
  const W = canvas.width, H = canvas.height;
  const n = e3.hijas.length;
  /* Hijas: salen radialmente con velocidad vectorial, rotación y rebote */
  const particulas = e3.hijas.map((k, i) => {
    const ang = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const p   = MASA_PARTICULAS[k];
    /* Las más ligeras salen más rápido (se llevan más energía cinética) */
    const vel = 2.6 + 4.0 / Math.max(0.3, Math.log10(p.masa + 2));
    return {
      key: k,
      x: W/2, y: H/2,
      vx: Math.cos(ang) * vel,
      vy: Math.sin(ang) * vel,
      rot: Math.random() * Math.PI * 2,
      rotVel: (Math.random() - 0.5) * 0.3,
      estela: [],
    };
  });
  /* Chispas de energía (la energía cinética liberada) */
  const chispas = [];
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = 1 + Math.random() * 6;
    chispas.push({ x: W/2, y: H/2, vx: Math.cos(a)*v, vy: Math.sin(a)*v, vida: 1 });
  }
  e3.anim = { t: 0, particulas, chispas };
}

function msE3Loop() {
  const e3 = msState.e3;
  if (!e3 || !e3.canvas) return;   /* etapa cambiada: detener loop */
  msE3Dibujar();
  e3.rafId = requestAnimationFrame(msE3Loop);
}

function msE3Dibujar() {
  const e3  = msState.e3;
  const dec = MS_DECAIMIENTOS[e3.nivelIdx];
  const madre = MASA_PARTICULAS[dec.madre];
  const canvas = e3.canvas, ctx = e3.ctx;
  if (!canvas || !ctx) return;
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2;

  /* Fondo oscuro cuadriculado (estética común a todos los minijuegos) */
  mjGridBackground(ctx, W, H);

  const anim = e3.anim;

  if (!anim) {
    /* Mostrar la partícula madre en reposo, pulsando (inestable) */
    const pulso = 1 + Math.sin(Date.now() * 0.005) * 0.12;
    const r = 30 * pulso;
    ctx.save();
    ctx.shadowColor = madre.color; ctx.shadowBlur = 24;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
    const g = ctx.createRadialGradient(cx-8, cy-8, 0, cx, cy, r);
    g.addColorStop(0, madre.color + 'ff'); g.addColorStop(1, madre.color + '55');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Orbitron,monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(madre.sym, cx, cy);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '11px Exo 2,sans-serif';
    ctx.fillText(`${madre.label} — inestable`, cx, cy + r + 20);
    return;
  }

  /* Animación: la madre explota y las hijas salen disparadas */
  anim.t += 0.016;
  const t = anim.t;

  /* Onda de choque expansiva */
  if (t < 0.9) {
    const op = (0.9 - t) / 0.9;
    ctx.save();
    ctx.globalAlpha = op * 0.5;
    ctx.strokeStyle = madre.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, t * 320, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  /* Destello inicial brillante en el centro */
  if (t < 0.35) {
    const flash = (0.35 - t) / 0.35;
    ctx.save();
    ctx.globalAlpha = flash;
    ctx.shadowColor = '#fff'; ctx.shadowBlur = 50;
    ctx.beginPath(); ctx.arc(cx, cy, 16 + flash*40, 0, Math.PI*2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.restore();
  }

  /* Chispas de energía cinética */
  anim.chispas.forEach(ch => {
    if (ch.vida <= 0) return;
    ch.x += ch.vx; ch.y += ch.vy;
    ch.vx *= 0.97; ch.vy *= 0.97;
    ch.vida -= 0.02;
    ctx.save();
    ctx.globalAlpha = Math.max(0, ch.vida) * 0.8;
    ctx.fillStyle = '#ffd740';
    ctx.beginPath(); ctx.arc(ch.x, ch.y, 1.8, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });

  /* Hijas volando con estela, rotación y rebote en bordes */
  anim.particulas.forEach(pa => {
    const p = MASA_PARTICULAS[pa.key];
    if (t > 0.15) {
      pa.x += pa.vx; pa.y += pa.vy;
      pa.rot += pa.rotVel;
      /* rebote suave en los bordes */
      if (pa.x < 18)     { pa.x = 18;     pa.vx = Math.abs(pa.vx) * 0.8; }
      if (pa.x > W - 18) { pa.x = W - 18; pa.vx = -Math.abs(pa.vx) * 0.8; }
      if (pa.y < 18)     { pa.y = 18;     pa.vy = Math.abs(pa.vy) * 0.8; }
      if (pa.y > H - 18) { pa.y = H - 18; pa.vy = -Math.abs(pa.vy) * 0.8; }
      /* registrar estela */
      pa.estela.push({ x: pa.x, y: pa.y });
      if (pa.estela.length > 14) pa.estela.shift();
    }
    /* estela como puntos que se desvanecen */
    pa.estela.forEach((pt, idx) => {
      const a = (idx / pa.estela.length) * 0.5;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 4 * (idx / pa.estela.length), 0, Math.PI*2); ctx.fill();
      ctx.restore();
    });
    /* partícula con brillo pulsante */
    const pulso = 1 + Math.sin(t * 8 + pa.rot) * 0.1;
    const r = 15 * pulso;
    ctx.save();
    ctx.translate(pa.x, pa.y);
    ctx.shadowColor = p.color; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2);
    const g = ctx.createRadialGradient(-4, -4, 0, 0, 0, r);
    g.addColorStop(0, p.color + 'ff'); g.addColorStop(1, p.color + '66');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Orbitron,monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(p.sym, pa.x, pa.y);
    ctx.textBaseline = 'alphabetic';
  });
}

function msE3Final(body) {
  const e3 = msState.e3;
  if (e3 && e3.rafId) { cancelAnimationFrame(e3.rafId); e3.rafId = null; }
  const b = document.getElementById('ms-body');
  b.innerHTML = `
    <div class="ms-final-wrap">
      <div class="ms-final-title retro-text">¡ETAPA 3 COMPLETADA!</div>
      <div class="ms-final-stars">⭐⭐⭐</div>
      <div class="ms-final-conclusion">
        <strong>La masa es energía almacenada.</strong> Una partícula pesada es como una batería cargada:
        si puede, se descarga transformándose en partículas más ligeras.<br>
        La diferencia de masa aparece como energía cinética (velocidad) de las hijas.<br><br>
        <em>¿Por qué las partículas tienen esas masas específicas?<br>
        La respuesta es el <strong style="color:#ffd740">Campo de Higgs</strong>. ¡Explóralo en la sección Higgs!</em>
      </div>
      <div class="ms-final-btns">
        <button class="ms-btn" onclick="msState.e3.nivelIdx=0;msIniciarNivel(0)">↺ Reiniciar desde la Etapa 1</button>
        <button class="ms-btn ms-btn-next" onclick="cerrarMasa()">← Volver al ME</button>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════
   FEEDBACK
   ════════════════════════════════════════════ */
function msMostrarFb(ok, msg, exp) {
  const fb = document.getElementById('ms-feedback');
  document.getElementById('ms-fb-icon').textContent = ok ? '✓' : '!';
  document.getElementById('ms-fb-msg').textContent  = msg;
  document.getElementById('ms-fb-exp').textContent  = exp || '';
  fb.className = `ms-feedback ${ok ? 'ms-fb-ok' : 'ms-fb-err'}`;
}
function msOcultarFb() {
  document.getElementById('ms-feedback').className = 'ms-feedback hidden';
}

/* ════════════════════════════════════════════
   UI UTILLIDADES
   ════════════════════════════════════════════ */
function msRenderNivelDots() {
  const dots = document.getElementById('ms-nivel-dots');
  if (!dots) return;
  dots.innerHTML = [0,1,2].map(i => `
    <button class="ms-nivel-dot ${msState.idx===i?'active':''}"
            onclick="msIniciarNivel(${i})">
      ${i===0 ? 'Etapa 1' : i===1 ? 'Etapa 2' : 'Etapa 3'}
    </button>
  `).join('');
  const labels = ['Etapa 1: Calcula la Fuerza', 'Etapa 2: E = mc²', 'Etapa 3: Decaimiento'];
  const lbl = document.getElementById('ms-progreso-label');
  if (lbl) lbl.textContent = labels[msState.idx] || '';
}

function cerrarMasa() {
  if (msRAF) { cancelAnimationFrame(msRAF); msRAF=null; }
  if (msScreen) { msScreen.remove(); msScreen=null; }
  showScreen('me');
}
