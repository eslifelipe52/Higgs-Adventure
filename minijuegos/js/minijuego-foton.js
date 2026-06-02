/* ══════════════════════════════════════════
   minijuegos/js/minijuego-foton.js
   Minijuego: Diagramas de Feynman (QED)

   Mecánica real de diagramas:
   - Segmentos de línea con flecha (fermiones)
   - Líneas onduladas (fotones)
   - Vértices como puntos de conexión
   - Arrastrar extremos para rotar/mover
   ══════════════════════════════════════════ */

/* ════════════════════════════════════════════
   PALETA Y DEFINICIÓN DE BLOQUES
   ════════════════════════════════════════════ */
const FY = {
  COLOR: {
    electron:  '#4fc3f7',
    positron:  '#ff6d00',
    muon:      '#b39ddb',
    antimuon:  '#e040fb',
    quark_pos: '#ffd740',
    quark_neg: '#ff5252',
    neutrino:  '#546e7a',
    photon:    '#ffd740',
    photon_v:  '#ffab40',
    vertex:    '#ce93d8',
    nucleus:   '#90a4ae',
  },

  BLOQUES: {
    'e-':  { label:'e⁻', tipo:'fermion',  carga:-1,   colorKey:'electron',  desc:'Electrón',      esCargado:true  },
    'e+':  { label:'e⁺', tipo:'antiferm', carga:+1,   colorKey:'positron',  desc:'Positrón',      esCargado:true  },
    'mu-': { label:'μ⁻', tipo:'fermion',  carga:-1,   colorKey:'muon',      desc:'Muón',          esCargado:true  },
    'mu+': { label:'μ⁺', tipo:'antiferm', carga:+1,   colorKey:'antimuon',  desc:'Antimuón',      esCargado:true  },
    'u':   { label:'u',  tipo:'quark',    carga:+2/3, colorKey:'quark_pos', desc:'Quark up',      esCargado:true  },
    'd':   { label:'d',  tipo:'quark',    carga:-1/3, colorKey:'quark_neg', desc:'Quark down',    esCargado:true  },
    's':   { label:'s',  tipo:'quark',    carga:-1/3, colorKey:'quark_neg', desc:'Quark strange', esCargado:true  },
    'c':   { label:'c',  tipo:'quark',    carga:+2/3, colorKey:'quark_pos', desc:'Quark charm',   esCargado:true  },
    'nu':  { label:'νₑ', tipo:'fermion',  carga:0,    colorKey:'neutrino',  desc:'Neutrino',      esCargado:false },
    'y':   { label:'γ',  tipo:'photon',   carga:0,    colorKey:'photon',    desc:'Fotón',         esCargado:false },
    'yv':  { label:'γᵥ', tipo:'photon_v', carga:0,    colorKey:'photon_v',  desc:'Fotón virtual', esCargado:false },
    'vtx': { label:'⚫', tipo:'vertex',   carga:0,    colorKey:'vertex',    desc:'Vértice EM',    esCargado:false },
    'N':   { label:'N',  tipo:'nucleus',  carga:+1,   colorKey:'nucleus',   desc:'Núcleo',        esCargado:true  },
  }
};

/* ════════════════════════════════════════════
   ESTRUCTURA INTERNA DEL DIAGRAMA
   Cada elemento es un SEGMENTO con:
     x1,y1  → extremo de origen (en px)
     x2,y2  → extremo de destino
     tipo   → clave en FY.BLOQUES
   Los vértices son puntos que "snappean"
   cuando dos extremos se acercan.
   ════════════════════════════════════════════ */

const SNAP_DIST   = 22;   /* px para auto-conectar extremos */
const SEG_LEN     = 110;  /* longitud inicial de cada segmento */
const HANDLE_R    = 9;    /* radio del handle arrastrable */
const VERTEX_R    = 10;   /* radio visual del vértice */
const WAVE_AMP    = 7;    /* amplitud onda fotón */
const WAVE_FREQ   = 0.22; /* frecuencia onda fotón */

/* ════════════════════════════════════════════
   NIVELES Y EJERCICIOS
   ════════════════════════════════════════════ */
const FY_NIVELES = [
  {
    id:1, titulo:'La Emisión Básica',
    intro:'Construye un vértice electromagnético: una partícula cargada emite o absorbe un fotón. Arrastra los bloques al canvas y conecta sus extremos.',
    bloquesDisp:['e-','e+','y','vtx'],
    ejercicios:[
      { id:'1.1', consigna:'Un electrón en movimiento emite un fotón y continúa su camino.',
        pista:'Necesitas: 2 líneas e⁻ (entrante y saliente) + 1 fotón γ + 1 vértice ⚫. Conecta los tres al mismo vértice.',
        validacion: g=>fyVal_emision(g,'e-','y'),
        explicacion:'Vértice EM fundamental: una partícula cargada cambia de momento emitiendo un fotón, pero conserva su identidad.', dificultad:'facil' },
      { id:'1.2', consigna:'Un positrón emite un fotón.',
        pista:'Igual que antes, pero usa e⁺ en lugar de e⁻. La flecha del positrón apunta hacia atrás.',
        validacion: g=>fyVal_emision(g,'e+','y'),
        explicacion:'La antimateria también emite fotones. El positrón es el espejo del electrón: misma masa, carga opuesta.', dificultad:'facil' },
      { id:'1.3', consigna:'Un fotón es absorbido por un electrón.',
        pista:'Ahora el fotón γ apunta HACIA el vértice (es entrante).',
        validacion: g=>fyVal_emision(g,'e-','y'),
        explicacion:'Absorción = emisión al revés. La QED es simétrica en el tiempo.', dificultad:'facil' },
    ]
  },
  {
    id:2, titulo:'Intercambio de Fotón Virtual',
    intro:'Dos partículas cargadas se intercambian un fotón virtual que media la fuerza electromagnética entre ellas.',
    bloquesDisp:['e-','e+','yv','vtx','N'],
    ejercicios:[
      { id:'2.1', consigna:'Dos electrones se repelen mediante un fotón virtual.',
        pista:'Dos vértices ⚫, cada uno conectado a un e⁻ entrante y saliente. El fotón virtual γᵥ conecta ambos vértices.',
        validacion: g=>fyVal_dispersion(g,['e-','e-'],'yv'),
        explicacion:'La repulsión EM es un intercambio de fotón virtual. El fotón existe solo un instante y no puede detectarse.', dificultad:'intermedio' },
      { id:'2.2', consigna:'Un electrón y un positrón se atraen electromagnéticamente.',
        pista:'Igual que 2.1 pero una de las partículas es e⁺ (flecha invertida).',
        validacion: g=>fyVal_dispersion(g,['e-','e+'],'yv'),
        explicacion:'Atracción y repulsión son el mismo proceso cuántico. ¡La unificación más elegante de la física!', dificultad:'intermedio' },
      { id:'2.3', consigna:'Un electrón rebota en un núcleo atómico (Dispersión de Rutherford cuántica).',
        pista:'Usa el bloque N (núcleo) como segunda línea. Conecta ambos al fotón virtual central.',
        validacion: g=>fyVal_dispersion(g,['e-','N'],'yv'),
        explicacion:'Así "vieron" Geiger y Marsden el núcleo en 1911: electrones que rebotan en el campo del núcleo.', dificultad:'intermedio' },
    ]
  },
  {
    id:3, titulo:'Aniquilación y Creación de Pares',
    intro:'Materia y energía son intercambiables (E=mc²). Un par puede convertirse en fotones y fotones pueden crear materia.',
    bloquesDisp:['e-','e+','y','yv','vtx','N'],
    ejercicios:[
      { id:'3.1', consigna:'¡TRAMPA! e⁻ + e⁺ producen UN solo fotón. ¿Funciona?',
        pista:'Construye el diagrama y pulsa Verificar. La física tiene algo que decirte.',
        validacion: g=>({ok:false, msg:'¡Un solo fotón no puede conservar energía Y momento simultáneamente! La naturaleza exige al menos DOS fotones. Corrige el diagrama.'}),
        explicacion:'Las leyes de conservación son inflexibles: con un solo fotón es imposible satisfacer ambas a la vez.', dificultad:'intermedio', esTrampa:true },
      { id:'3.2', consigna:'Corrige: la aniquilación e⁻e⁺ produce DOS fotones.',
        pista:'Dos vértices, cada uno emite un fotón γ. El e⁻ y e⁺ se conectan a los vértices.',
        validacion: g=>fyVal_aniquilacion(g,['e-','e+'],['y','y']),
        explicacion:'Dos fotones en direcciones opuestas conservan energía y momento. Base del PET médico.', dificultad:'intermedio' },
      { id:'3.3', consigna:'Un rayo gamma crea un par e⁻e⁺ cerca de un núcleo.',
        pista:'El fotón γ entra, el núcleo N absorbe momento, y salen e⁻ y e⁺.',
        validacion: g=>fyVal_creacion(g),
        explicacion:'La creación de pares necesita un "testigo" (el núcleo) que absorba el momento extra.', dificultad:'avanzado' },
    ]
  },
  {
    id:4, titulo:'El Zoológico de Partículas',
    intro:'El fotón se acopla igual a cualquier partícula cargada: electrones, muones, quarks. La QED es universal.',
    bloquesDisp:['e-','e+','mu-','mu+','u','d','s','c','y','yv','vtx'],
    ejercicios:[
      { id:'4.1', consigna:'Un muón emite un fotón.',
        pista:'Igual que 1.1 pero con μ⁻.',
        validacion: g=>fyVal_emision(g,'mu-','y'),
        explicacion:'El fotón se acopla igual a electrones y muones. Universalidad de la QED.', dificultad:'facil' },
      { id:'4.2', consigna:'Un quark up y un quark down intercambian un fotón virtual.',
        pista:'Dos vértices, uno con u y otro con d, conectados por γᵥ.',
        validacion: g=>fyVal_dispersion(g,['u','d'],'yv'),
        explicacion:'Los quarks tienen carga fraccionaria pero sienten el electromagnetismo.', dificultad:'intermedio' },
      { id:'4.3', consigna:'Dispersión electrón-quark up: así se sondea el interior del protón.',
        pista:'e⁻ y u intercambian un fotón virtual γᵥ.',
        validacion: g=>fyVal_dispersion(g,['e-','u'],'yv'),
        explicacion:'Así descubrieron los quarks en el SLAC (1968). Los electrones "rebotan" en los quarks.', dificultad:'intermedio' },
      { id:'4.4', consigna:'Aniquilación μ⁻μ⁺ → 2 fotones.',
        pista:'Igual que 3.2 pero con muones.',
        validacion: g=>fyVal_aniquilacion(g,['mu-','mu+'],['y','y']),
        explicacion:'Toda partícula cargada puede aniquilarse con su antipartícula.', dificultad:'intermedio' },
    ]
  },
  {
    id:5, titulo:'Detective de lo Imposible',
    intro:'Se muestran diagramas ya construidos. Tu trabajo: determinar si son físicamente válidos y señalar el error si lo hay.',
    bloquesDisp:[], esDetective:true,
    ejercicios:[
      { id:'5.1', consigna:'νₑ emite un fotón. ¿Válido?',
        diag:'νₑ ──── ⚫ ──── νₑ\n         │\n         γ',
        respCorr:'invalido', razonCorr:'El neutrino tiene carga 0. No puede acoplarse al fotón.',
        opciones:[
          {id:'A', texto:'El neutrino tiene carga 0. No puede acoplarse al fotón.', ok:true},
          {id:'B', texto:'Los neutrinos solo interactúan por gravedad.', ok:false},
          {id:'C', texto:'El fotón no puede emitirse sin masa.', ok:false}
        ]},
      { id:'5.2', consigna:'γ → γ directamente. ¿Válido?',
        diag:'γ (entrante) ──── γ (saliente)',
        respCorr:'invalido', razonCorr:'El fotón no tiene carga. No puede interactuar consigo mismo en QED.',
        opciones:[
          {id:'A', texto:'El fotón no tiene carga. No puede interactuar consigo mismo en QED.', ok:true},
          {id:'B', texto:'Los fotones siempre van en línea recta.', ok:false},
          {id:'C', texto:'La energía no se conservaría.', ok:false}
        ]},
      { id:'5.3', consigna:'e⁻ → μ⁻ + γ. ¿Válido?',
        diag:'e⁻ ──── ⚫ ──── μ⁻\n         │\n         γ',
        respCorr:'invalido', razonCorr:'En el vértice EM el sabor no cambia. Un electrón sigue siendo electrón.',
        opciones:[
          {id:'A', texto:'En el vértice EM el sabor no cambia. Un electrón sigue siendo electrón.', ok:true},
          {id:'B', texto:'El muón es demasiado pesado.', ok:false},
          {id:'C', texto:'Se viola la conservación de carga.', ok:false}
        ]},
      { id:'5.4', consigna:'γ + γ → e⁻ + e⁺. ¿Válido?',
        diag:'γ ──── ⚫ ──── e⁻\n        │  e⁻ virtual\n        ⚫ ──── e⁺\n        │\n        γ',
        respCorr:'valido', razonCorr:'Dispersión luz-luz mediada por electrón virtual. Proceso puramente cuántico.',
        opciones:[
          {id:'A', texto:'Dispersión luz-luz mediada por electrón virtual. Proceso puramente cuántico.', ok:true},
          {id:'B', texto:'Los fotones no interactúan al no tener carga.', ok:false},
          {id:'C', texto:'Solo si tienen la misma frecuencia.', ok:false}
        ]},
      { id:'5.5', consigna:'u → u + g (gluón). ¿Válido en QED?',
        diag:'u ──── ⚫ ──── u\n        │\n        g (gluón)',
        respCorr:'valido_pero', razonCorr:'Válido pero es QCD, no QED. El quark emite un gluón por su carga de color.',
        opciones:[
          {id:'A', texto:'Válido pero es QCD, no QED. El quark emite un gluón por su carga de color.', ok:true},
          {id:'B', texto:'El quark up no tiene carga eléctrica.', ok:false},
          {id:'C', texto:'Los quarks no pueden emitir partículas libres.', ok:false}
        ]},
      { id:'5.6', consigna:'e⁻e⁺ → 1 solo fotón. ¿Válido?',
        diag:'e⁻ ──── ⚫\n        │\n        γ (uno solo)\ne⁺ ──── ⚫',
        respCorr:'invalido', razonCorr:'Viola conservación de momento. Se necesitan al menos dos fotones.',
        opciones:[
          {id:'A', texto:'Viola conservación de momento. Se necesitan al menos dos fotones.', ok:true},
          {id:'B', texto:'e⁻ y e⁺ no pueden aniquilarse.', ok:false},
          {id:'C', texto:'El fotón tendría demasiada energía.', ok:false}
        ]},
    ]
  },
  {
    id:6, titulo:'Modo Desafío',
    intro:'10 consignas aleatorias. Todos los bloques disponibles. Demuestra tu maestría en QED.',
    bloquesDisp:['e-','e+','mu-','mu+','u','d','s','c','y','yv','vtx','N'],
    esDesafio:true, puntuado:true, ejercicios:[]
  }
];

const FY_POOL = [
  {consigna:'Un electrón emite un fotón.',            dif:'facil',      val:g=>fyVal_emision(g,'e-','y')},
  {consigna:'Un positrón absorbe un fotón.',          dif:'facil',      val:g=>fyVal_emision(g,'e+','y')},
  {consigna:'Dos electrones se repelen.',             dif:'intermedio', val:g=>fyVal_dispersion(g,['e-','e-'],'yv')},
  {consigna:'e⁻ y e⁺ se atraen.',                    dif:'intermedio', val:g=>fyVal_dispersion(g,['e-','e+'],'yv')},
  {consigna:'Dispersión e⁻ - μ⁻.',                   dif:'intermedio', val:g=>fyVal_dispersion(g,['e-','mu-'],'yv')},
  {consigna:'Aniquilación e⁻e⁺ → 2 fotones.',        dif:'intermedio', val:g=>fyVal_aniquilacion(g,['e-','e+'],['y','y'])},
  {consigna:'Dispersión quark up – electrón.',        dif:'avanzado',   val:g=>fyVal_dispersion(g,['e-','u'],'yv')},
  {consigna:'Dispersión quark down – positrón.',      dif:'avanzado',   val:g=>fyVal_dispersion(g,['e+','d'],'yv')},
  {consigna:'Aniquilación μ⁻μ⁺ → 2 fotones.',        dif:'avanzado',   val:g=>fyVal_aniquilacion(g,['mu-','mu+'],['y','y'])},
  {consigna:'e⁻ rebota en un núcleo.',                dif:'intermedio', val:g=>fyVal_dispersion(g,['e-','N'],'yv')},
];

const FY_LOGROS = [
  {nombre:'Diamante',min:800,emoji:'💎',color:'#b9f2ff'},
  {nombre:'Oro',     min:500,emoji:'🥇',color:'#ffd740'},
  {nombre:'Plata',   min:250,emoji:'🥈',color:'#c0c0c0'},
  {nombre:'Bronce',  min:0,  emoji:'🥉',color:'#cd7f32'}
];

/* ════════════════════════════════════════════
   VALIDADORES
   ════════════════════════════════════════════ */
function fyContarTipo(segs, tipo) {
  return segs.filter(s => s.tipo === tipo).length;
}
function fyTieneConexion(segs, tipo) {
  return segs.some(s => s.tipo === tipo);
}
function fyContarVertices(segs) {
  return segs.filter(s => s.tipo === 'vtx').length;
}

function fyVal_emision(g, particula, boson) {
  if (!g || !g.segs) return {ok:false, msg:'Diagrama vacío. Añade bloques.'};
  const segs = g.segs;
  if (fyContarVertices(segs) < 1)
    return {ok:false, msg:'Falta el vértice EM ⚫. Es el punto central del diagrama.'};
  if (fyContarTipo(segs, particula) < 2)
    return {ok:false, msg:`Necesitas DOS líneas de ${FY.BLOQUES[particula]?.label}: una entrante y una saliente.`};
  if (!fyTieneConexion(segs, boson) && !fyTieneConexion(segs, 'yv'))
    return {ok:false, msg:'Falta el fotón γ conectado al vértice.'};
  if (!fyVerificarConexionVertice(segs))
    return {ok:false, msg:'Los extremos no están conectados al vértice. Acerca los extremos hasta que se unan (círculo gris).'};
  return {ok:true, msg:`¡Correcto! Vértice EM construido.`};
}

function fyVal_dispersion(g, particulas, boson) {
  if (!g || !g.segs) return {ok:false, msg:'Diagrama vacío.'};
  const segs = g.segs;
  if (fyContarVertices(segs) < 2)
    return {ok:false, msg:'Necesitas DOS vértices ⚫, uno para cada partícula.'};
  if (!fyTieneConexion(segs, boson) && !fyTieneConexion(segs, 'yv') && !fyTieneConexion(segs, 'y'))
    return {ok:false, msg:'Falta el fotón virtual γᵥ que conecta los dos vértices.'};
  for (const p of particulas) {
    const info = FY.BLOQUES[p];
    if (info && !info.esCargado)
      return {ok:false, msg:`${info.desc} tiene carga 0. No puede acoplarse al fotón.`};
    if (fyContarTipo(segs, p) < 1)
      return {ok:false, msg:`Falta la partícula ${info?.label || p} en el diagrama.`};
  }
  return {ok:true, msg:'¡Correcto! Dispersión electromagnética construida.'};
}

function fyVal_aniquilacion(g, entrada, salida) {
  if (!g || !g.segs) return {ok:false, msg:'Diagrama vacío.'};
  const segs = g.segs;
  if (fyContarVertices(segs) < 2)
    return {ok:false, msg:'La aniquilación requiere al menos dos vértices.'};
  const nFot = fyContarTipo(segs,'y') + fyContarTipo(segs,'yv');
  if (nFot < 2)
    return {ok:false, msg:'¡Se necesitan DOS fotones para conservar energía y momento!'};
  return {ok:true, msg:`¡Correcto! Aniquilación con ${nFot} fotones — leyes de conservación satisfechas.`};
}

function fyVal_creacion(g) {
  if (!g || !g.segs) return {ok:false, msg:'Diagrama vacío.'};
  const segs = g.segs;
  if (!fyTieneConexion(segs,'N'))
    return {ok:false, msg:'La creación de pares necesita un núcleo N como "testigo" para conservar el momento.'};
  if (fyContarTipo(segs,'e-') < 1 || fyContarTipo(segs,'e+') < 1)
    return {ok:false, msg:'Necesitas un e⁻ y un e⁺ salientes.'};
  return {ok:true, msg:'¡Correcto! La luz se convierte en materia — con la ayuda del núcleo.'};
}

function fyVerificarConexionVertice(segs) {
  /* Verificación simple: hay al menos un vértice con
     algún otro segmento cercano a él */
  const vtxs = segs.filter(s => s.tipo === 'vtx');
  if (!vtxs.length) return false;
  /* Al menos 2 segmentos no-vértice cerca de algún vértice */
  return segs.filter(s => s.tipo !== 'vtx').length >= 2;
}

/* ════════════════════════════════════════════
   ESTADO DEL JUEGO
   ════════════════════════════════════════════ */
let fyScreen = null;
let fyState  = { segs:[], dragging:null, nv:null, idx:0, ejIdx:0 };
let fyRAF    = null;
let fyCanvas = null;
let fyCtx    = null;

/* ════════════════════════════════════════════
   ENTRADA
   ════════════════════════════════════════════ */
function iniciar_foton() {
  crearPantallaFoton();
  fyIniciarNivel(0);
  fyLoop();
}

/* ════════════════════════════════════════════
   CREAR PANTALLA
   ════════════════════════════════════════════ */
function crearPantallaFoton() {
  if (fyScreen) fyScreen.remove();
  fyScreen = document.createElement('div');
  fyScreen.id = 'fy-screen';
  fyScreen.className = 'fy-screen';
  fyScreen.innerHTML = `
    <div class="fy-header">
      <div class="fy-header-title retro-text">DIAGRAMAS DE FEYNMAN</div>
      <div class="fy-header-sub" id="fy-nivel-label">Nivel 1</div>
      <button class="fy-close-btn" onclick="cerrarFoton()">← Volver al ME</button>
    </div>
    <div class="fy-intro-bar" id="fy-intro-bar"></div>
    <div class="fy-body">
      <div class="fy-panel">
        <div class="fy-panel-card" id="fy-consigna-card">
          <div class="fy-panel-label">Ejercicio</div>
          <div class="fy-consigna" id="fy-consigna"></div>
          <button class="fy-pista-btn" onclick="fyTogglePista()">💡 Pista</button>
          <div class="fy-pista hidden" id="fy-pista"></div>
        </div>
        <div class="fy-panel-card">
          <div class="fy-panel-label">Bloques disponibles — clic para añadir</div>
          <div class="fy-bloques-grid" id="fy-bloques-grid"></div>
        </div>
        <div class="fy-panel-card">
          <div class="fy-panel-label">Progreso</div>
          <div class="fy-prog-val" id="fy-prog-val">0 / 3</div>
          <div class="fy-prog-wrap"><div class="fy-prog-bar" id="fy-prog-bar"></div></div>
        </div>
        <div class="fy-panel-card fy-leyenda-card">
          <div class="fy-panel-label">Instrucciones</div>
          <div class="fy-leyenda-item">🖱 <b>Clic</b> en bloque → añade al canvas</div>
          <div class="fy-leyenda-item">🔵 Arrastra el <b>extremo</b> de una línea para rotar</div>
          <div class="fy-leyenda-item">⚫ Arrastra el <b>centro</b> para mover</div>
          <div class="fy-leyenda-item">🔗 Acerca extremos para <b>conectar</b></div>
          <div class="fy-leyenda-item">❌ <b>Doble clic</b> sobre segmento para borrar</div>
        </div>
        <div class="fy-nav-btns">
          <button class="fy-btn" onclick="fyMostrarNiveles()">Niveles</button>
          <button class="fy-btn fy-btn-validar" onclick="fyValidarActual()">✓ Verificar</button>
          <button class="fy-btn fy-btn-reset" onclick="fyReset()">↺ Limpiar</button>
        </div>
      </div>
      <div class="fy-area-wrap">
        <canvas id="fy-canvas" class="fy-canvas"></canvas>
        <div class="fy-connect-hint">Alt+clic = conectar directamente dos nodos</div>
      </div>
    </div>
    <!-- Panel detective -->
    <div class="fy-detective-panel hidden" id="fy-detective-panel"></div>
    <!-- Feedback -->
    <div class="fy-feedback hidden" id="fy-feedback">
      <div class="fy-fb-icon" id="fy-fb-icon"></div>
      <div>
        <div class="fy-fb-msg" id="fy-fb-msg"></div>
        <div class="fy-fb-exp" id="fy-fb-exp"></div>
        <button class="fy-btn" style="margin-top:10px" onclick="fyOcultarFb()">Continuar →</button>
      </div>
    </div>
    <!-- Selector niveles -->
    <div class="fy-niveles-overlay hidden" id="fy-niveles-overlay">
      <div class="fy-niveles-wrap">
        <div class="fy-niveles-title retro-text">SELECCIONA NIVEL</div>
        <div class="fy-niveles-grid" id="fy-niveles-grid"></div>
        <button class="fy-btn" onclick="fyOcultarNiveles()">Cerrar</button>
      </div>
    </div>
  `;
  document.getElementById('app').appendChild(fyScreen);

  fyCanvas = document.getElementById('fy-canvas');
  fyCtx    = fyCanvas.getContext('2d');
  fyAjustarCanvas();
  window.addEventListener('resize', fyAjustarCanvas);

  fyCanvas.addEventListener('mousedown',  fyMD);
  fyCanvas.addEventListener('mousemove',  fyMM);
  fyCanvas.addEventListener('mouseup',    fyMU);
  fyCanvas.addEventListener('dblclick',   fyDblClick);
}

function fyAjustarCanvas() {
  if (!fyCanvas) return;
  fyCanvas.width  = fyCanvas.offsetWidth  || 800;
  fyCanvas.height = fyCanvas.offsetHeight || 520;
}

/* ════════════════════════════════════════════
   INICIAR NIVEL
   ════════════════════════════════════════════ */
function fyIniciarNivel(idx) {
  const nv = FY_NIVELES[idx];
  fyState = { segs:[], dragging:null, nv, idx, ejIdx:0,
              puntaje:0, errores:0, combos:0, intentos:0 };
  document.getElementById('fy-nivel-label').textContent = `Nivel ${nv.id}: ${nv.titulo}`;
  document.getElementById('fy-intro-bar').textContent   = nv.intro;
  fyCargarEjercicio(0);
  fyRenderBloques();
  fyRenderNivelesGrid();
}

function fyCargarEjercicio(ejIdx) {
  fyState.ejIdx    = ejIdx;
  fyState.segs     = [];
  fyState.intentos = 0;
  const nv = fyState.nv;

  /* Modo desafío: generar ejercicio aleatorio */
  if (nv.esDesafio) {
    const pool = [...FY_POOL].sort(()=>Math.random()-0.5).slice(0,10);
    nv.ejercicios = pool.map((p,i)=>({id:`6.${i+1}`, consigna:p.consigna, validacion:p.val, dificultad:p.dif, pista:'Usa los bloques disponibles para construir el diagrama.'}));
    fyRenderBloques();
  }

  const ej = nv.ejercicios[ejIdx];
  if (!ej) { fyNivelCompleto(); return; }

  document.getElementById('fy-consigna').textContent = `${ej.id} — ${ej.consigna}`;
  document.getElementById('fy-pista').textContent    = ej.pista || '';
  document.getElementById('fy-pista').classList.add('hidden');

  /* Modo detective */
  const detEl = document.getElementById('fy-detective-panel');
  if (nv.esDetective) {
    detEl.classList.remove('hidden');
    fyRenderDetective(ej);
  } else {
    detEl.classList.add('hidden');
  }

  fyActualizarUI();
}

/* ════════════════════════════════════════════
   RENDER BLOQUES
   ════════════════════════════════════════════ */
function fyRenderBloques() {
  const grid = document.getElementById('fy-bloques-grid');
  const nv   = fyState.nv;
  if (!grid || !nv) return;
  grid.innerHTML = '';
  nv.bloquesDisp.forEach(key => {
    const b   = FY.BLOQUES[key];
    const col = FY.COLOR[b.colorKey];
    const div = document.createElement('div');
    div.className = 'fy-bloque';
    div.title     = b.desc;
    div.style.cssText = `border-color:${col}55;background:${col}18;color:${col};`;
    div.innerHTML = `<span class="fy-bloque-sym">${b.label}</span><span class="fy-bloque-desc">${b.desc}</span>`;
    div.addEventListener('click', () => fyAgregarSeg(key));
    grid.appendChild(div);
  });
}

/* ════════════════════════════════════════════
   AÑADIR SEGMENTO AL CANVAS
   ════════════════════════════════════════════ */
function fyAgregarSeg(tipo) {
  const W = fyCanvas.width, H = fyCanvas.height;
  /* Posición aleatoria en área central */
  const cx = W * (0.3 + Math.random() * 0.4);
  const cy = H * (0.2 + Math.random() * 0.6);
  const ang = tipo === 'vtx' ? 0 : (Math.random() * Math.PI * 2);
  const len = tipo === 'vtx' ? 0 : SEG_LEN;

  fyState.segs.push({
    id:   `s${Date.now()}`,
    tipo,
    /* Extremo 1 = origen, extremo 2 = destino */
    x1: tipo === 'vtx' ? cx : cx - Math.cos(ang) * len/2,
    y1: tipo === 'vtx' ? cy : cy - Math.sin(ang) * len/2,
    x2: tipo === 'vtx' ? cx : cx + Math.cos(ang) * len/2,
    y2: tipo === 'vtx' ? cy : cy + Math.sin(ang) * len/2,
    /* Conexiones snapped */
    snap1: null, snap2: null
  });
}

/* ════════════════════════════════════════════
   LOOP DE ANIMACIÓN
   ════════════════════════════════════════════ */
function fyLoop() {
  fyDibujar();
  fyRAF = requestAnimationFrame(fyLoop);
}

/* ════════════════════════════════════════════
   DIBUJO
   ════════════════════════════════════════════ */
function fyDibujar() {
  if (!fyCtx || !fyCanvas) return;
  const ctx = fyCtx, W = fyCanvas.width, H = fyCanvas.height;
  ctx.clearRect(0, 0, W, H);

  /* Fondo */
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#0d0820'); bg.addColorStop(1,'#04020f');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  /* Grid */
  ctx.strokeStyle='rgba(255,255,255,0.03)'; ctx.lineWidth=1;
  for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  /* Snap guides */
  fyDibujarSnaps(ctx);

  /* Segmentos */
  fyState.segs.forEach(s => fyDibujarSeg(ctx, s));
  fyState.segs.forEach(s => fyDibujarHandles(ctx, s));
}

function fyDibujarSnaps(ctx) {
  /* Mostrar puntos de conexión cuando dos extremos están cerca */
  const segs = fyState.segs;
  for (let i = 0; i < segs.length; i++) {
    for (let j = i+1; j < segs.length; j++) {
      const s1 = segs[i], s2 = segs[j];
      const puntos = [[s1.x1,s1.y1,'1'],[s1.x2,s1.y2,'2']];
      const puntos2= [[s2.x1,s2.y1,'1'],[s2.x2,s2.y2,'2']];
      puntos.forEach(([px,py]) => {
        puntos2.forEach(([qx,qy]) => {
          const d = Math.hypot(px-qx, py-qy);
          if (d < SNAP_DIST * 1.5 && d > 2) {
            ctx.save();
            ctx.beginPath(); ctx.arc((px+qx)/2,(py+qy)/2, SNAP_DIST*0.6, 0, Math.PI*2);
            ctx.strokeStyle='rgba(255,255,255,0.2)'; ctx.lineWidth=1;
            ctx.setLineDash([3,3]); ctx.stroke(); ctx.restore();
          }
        });
      });
    }
  }
}

function fyDibujarSeg(ctx, s) {
  const b   = FY.BLOQUES[s.tipo];
  if (!b) return;
  const col = FY.COLOR[b.colorKey];

  /* ── Vértice ── */
  if (b.tipo === 'vertex') {
    ctx.save();
    ctx.shadowColor = col; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(s.x1, s.y1, VERTEX_R, 0, Math.PI*2);
    ctx.fillStyle = '#1a0a2e'; ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke();
    /* Anillo dorado */
    ctx.beginPath(); ctx.arc(s.x1, s.y1, VERTEX_R+5, 0, Math.PI*2);
    ctx.strokeStyle = FY.COLOR.photon+'80'; ctx.lineWidth=1; ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.shadowColor = col; ctx.shadowBlur = 10;
  ctx.strokeStyle = col; ctx.lineWidth = 2.5;

  const dx = s.x2-s.x1, dy = s.y2-s.y1;
  const len = Math.hypot(dx,dy);
  if (len < 2) { ctx.restore(); return; }

  /* ── Fotón: línea ondulada ── */
  if (b.tipo === 'photon' || b.tipo === 'photon_v') {
    if (b.tipo === 'photon_v') ctx.setLineDash([10,5]);
    fyDibujarOnda(ctx, s.x1, s.y1, s.x2, s.y2, col);
    ctx.setLineDash([]);
    ctx.restore(); return;
  }

  /* ── Fermión / quark / núcleo: línea con flecha ── */
  const isAnti = b.tipo === 'antiferm';

  /* Línea principal */
  ctx.beginPath(); ctx.moveTo(s.x1,s.y1); ctx.lineTo(s.x2,s.y2); ctx.stroke();

  /* Flecha en el centro */
  const mx = (s.x1+s.x2)/2, my = (s.y1+s.y2)/2;
  const ang = isAnti ? Math.atan2(s.y1-s.y2, s.x1-s.x2)
                     : Math.atan2(dy,dx);
  fyDibujarFlecha(ctx, mx, my, ang, col, 10);

  /* Etiqueta a la mitad */
  ctx.shadowBlur=0;
  ctx.font = 'bold 13px "Orbitron",monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center'; ctx.textBaseline='middle';
  /* Perpendicular a la línea, offset de 16px */
  const nx = -dy/len*16, ny = dx/len*16;
  ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,0.8)';
  ctx.strokeText(b.label, mx+nx, my+ny);
  ctx.fillText(b.label, mx+nx, my+ny);

  ctx.restore();
}

function fyDibujarFlecha(ctx, x, y, ang, col, size) {
  ctx.save();
  ctx.fillStyle = col;
  ctx.shadowColor = col; ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(ang)*size,     y + Math.sin(ang)*size);
  ctx.lineTo(x + Math.cos(ang+2.5)*size*0.7, y + Math.sin(ang+2.5)*size*0.7);
  ctx.lineTo(x + Math.cos(ang-2.5)*size*0.7, y + Math.sin(ang-2.5)*size*0.7);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function fyDibujarOnda(ctx, x1, y1, x2, y2, col) {
  const dx=x2-x1, dy=y2-y1, len=Math.hypot(dx,dy);
  if (len<2) return;
  const ux=dx/len, uy=dy/len, nx=-uy, ny=ux;
  const waves = Math.max(3, Math.round(len/18));
  ctx.save();
  ctx.strokeStyle=col; ctx.lineWidth=2.5;
  ctx.shadowColor=col; ctx.shadowBlur=12;
  ctx.beginPath(); ctx.moveTo(x1,y1);
  for(let i=1;i<=waves*2;i++){
    const t=i/(waves*2);
    const amp=WAVE_AMP*Math.sin(i*Math.PI);
    ctx.lineTo(x1+dx*t+nx*amp, y1+dy*t+ny*amp);
  }
  ctx.stroke(); ctx.restore();

  /* Etiqueta */
  const b = Object.values(FY.BLOQUES).find(b=>FY.COLOR[b.colorKey]===col);
  const label = col===FY.COLOR.photon_v ? 'γᵥ' : 'γ';
  const mx=(x1+x2)/2, my=(y1+y2)/2;
  const offx=-uy*18, offy=ux*18;
  ctx.save();
  ctx.font='bold 13px "Orbitron",monospace';
  ctx.fillStyle='#ffffff'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,0.8)';
  ctx.strokeText(label,mx+offx,my+offy);
  ctx.fillText(label,mx+offx,my+offy);
  ctx.restore();
}

function fyDibujarHandles(ctx, s) {
  const b = FY.BLOQUES[s.tipo];
  if (!b || b.tipo==='vertex') return;
  const col = FY.COLOR[b.colorKey];

  [['x1','y1'],['x2','y2']].forEach(([xk,yk])=>{
    const hov = fyState.hoverHandle === `${s.id}_${xk}`;
    ctx.save();
    ctx.beginPath(); ctx.arc(s[xk], s[yk], HANDLE_R+(hov?3:0), 0, Math.PI*2);
    ctx.fillStyle   = hov ? col : 'rgba(20,10,50,0.9)';
    ctx.strokeStyle = col;
    ctx.lineWidth   = 2; ctx.fill(); ctx.stroke();
    ctx.restore();
  });
}

/* ════════════════════════════════════════════
   MOUSE EVENTS
   ════════════════════════════════════════════ */
function fyPos(e) {
  const rect=fyCanvas.getBoundingClientRect();
  const sx=fyCanvas.width/rect.width, sy=fyCanvas.height/rect.height;
  return {x:(e.clientX-rect.left)*sx, y:(e.clientY-rect.top)*sy};
}

function fyHandleEn(px,py) {
  for(const s of fyState.segs){
    const b=FY.BLOQUES[s.tipo];
    if(!b||b.tipo==='vertex') continue;
    if(Math.hypot(s.x1-px,s.y1-py)<HANDLE_R+8) return {seg:s,end:'1'};
    if(Math.hypot(s.x2-px,s.y2-py)<HANDLE_R+8) return {seg:s,end:'2'};
  }
  return null;
}

function fySegCentroEn(px,py) {
  for(const s of fyState.segs){
    const b=FY.BLOQUES[s.tipo];
    if(!b) continue;
    const cx = b.tipo==='vertex'?s.x1:(s.x1+s.x2)/2;
    const cy = b.tipo==='vertex'?s.y1:(s.y1+s.y2)/2;
    if(Math.hypot(cx-px,cy-py)<(b.tipo==='vertex'?VERTEX_R+6:20)) return s;
  }
  return null;
}

function fyMD(e) {
  const {x,y}=fyPos(e);
  const handle=fyHandleEn(x,y);
  if(handle){
    fyState.dragging={type:'handle',...handle,offX:0,offY:0};
    return;
  }
  const seg=fySegCentroEn(x,y);
  if(seg){
    const b=FY.BLOQUES[seg.tipo];
    const cx=b.tipo==='vertex'?seg.x1:(seg.x1+seg.x2)/2;
    const cy=b.tipo==='vertex'?seg.y1:(seg.y1+seg.y2)/2;
    fyState.dragging={type:'seg',seg,offX:cx-x,offY:cy-y};
  }
}

function fyMM(e) {
  const {x,y}=fyPos(e);
  const d=fyState.dragging;

  /* Hover handles */
  const h=fyHandleEn(x,y);
  fyState.hoverHandle = h ? `${h.seg.id}_x${h.end}` : null;

  if(!d) return;

  if(d.type==='handle'){
    const s=d.seg;
    if(d.end==='1'){s.x1=x;s.y1=y;}
    else            {s.x2=x;s.y2=y;}
    /* Auto-snap a vértice cercano */
    fyAutoSnap(s, d.end);
  } else if(d.type==='seg'){
    const s=d.seg, b=FY.BLOQUES[s.tipo];
    if(b.tipo==='vertex'){
      s.x1=x+d.offX; s.y1=y+d.offY;
    } else {
      const cx=x+d.offX, cy=y+d.offY;
      const dx=s.x2-s.x1, dy=s.y2-s.y1;
      const hl=Math.hypot(dx,dy)/2;
      const ang=Math.atan2(dy,dx);
      s.x1=cx-Math.cos(ang)*hl; s.y1=cy-Math.sin(ang)*hl;
      s.x2=cx+Math.cos(ang)*hl; s.y2=cy+Math.sin(ang)*hl;
    }
  }
}

function fyMU() { fyState.dragging=null; }

function fyAutoSnap(seg, end) {
  /* Si un extremo está cerca de un vértice, snappear a él */
  const ex = end==='1'?seg.x1:seg.x2;
  const ey = end==='1'?seg.y1:seg.y2;
  for(const s of fyState.segs){
    if(s===seg) continue;
    const b=FY.BLOQUES[s.tipo];
    if(b.tipo==='vertex'){
      if(Math.hypot(s.x1-ex,s.y1-ey)<SNAP_DIST){
        if(end==='1'){seg.x1=s.x1;seg.y1=s.y1;}
        else         {seg.x2=s.x1;seg.y2=s.y1;}
        return;
      }
    }
    /* También snap a extremos de otros segmentos */
    [[s.x1,s.y1],[s.x2,s.y2]].forEach(([sx,sy])=>{
      if(Math.hypot(sx-ex,sy-ey)<SNAP_DIST){
        if(end==='1'){seg.x1=sx;seg.y1=sy;}
        else         {seg.x2=sx;seg.y2=sy;}
      }
    });
  }
}

function fyDblClick(e) {
  const {x,y}=fyPos(e);
  /* Borrar segmento más cercano al doble clic */
  let best=null, bestD=30;
  fyState.segs.forEach(s=>{
    const b=FY.BLOQUES[s.tipo];
    const cx=b?.tipo==='vertex'?s.x1:(s.x1+s.x2)/2;
    const cy=b?.tipo==='vertex'?s.y1:(s.y1+s.y2)/2;
    const d=Math.hypot(cx-x,cy-y);
    if(d<bestD){best=s;bestD=d;}
  });
  if(best) fyState.segs=fyState.segs.filter(s=>s!==best);
}

/* ════════════════════════════════════════════
   VALIDAR
   ════════════════════════════════════════════ */
function fyValidarActual() {
  const nv=fyState.nv, ej=nv.ejercicios[fyState.ejIdx];
  if(!ej) return;
  fyState.intentos=(fyState.intentos||0)+1;
  const res=ej.validacion({segs:fyState.segs});

  if(res.ok){
    fyState.combos++;
    fyMostrarFb(true, res.msg, ej.explicacion);
    if(nv.puntuado){
      const pts={'facil':20,'intermedio':40,'avanzado':70}[ej.dificultad]||20;
      fyState.puntaje=(fyState.puntaje||0)+pts+(fyState.intentos===1?50:0);
    }
    fyState.segs=[];
    fyActualizarUI();
    setTimeout(()=>{
      fyOcultarFb();
      const sig=fyState.ejIdx+1;
      if(sig<nv.ejercicios.length) fyCargarEjercicio(sig);
      else fyNivelCompleto();
    },3000);
  } else {
    fyState.errores++;
    fyMostrarFb(false, res.msg, null);
  }
}

function fyMostrarFb(ok, msg, exp) {
  const fb=document.getElementById('fy-feedback');
  document.getElementById('fy-fb-icon').textContent=ok?'✓':'!';
  document.getElementById('fy-fb-msg').textContent=msg;
  document.getElementById('fy-fb-exp').textContent=exp||'';
  fb.className=`fy-feedback ${ok?'fy-fb-ok':'fy-fb-err'}`;
}
function fyOcultarFb(){ document.getElementById('fy-feedback').className='fy-feedback hidden'; }

/* ════════════════════════════════════════════
   DETECTIVE
   ════════════════════════════════════════════ */
function fyRenderDetective(ej) {
  const el=document.getElementById('fy-detective-panel');
  el.innerHTML=`
    <div class="fy-det-diagrama">
      <div class="fy-det-label">Diagrama a evaluar:</div>
      <pre class="fy-det-pre">${ej.diag}</pre>
    </div>
    <div class="fy-det-veredicto">
      <div class="fy-det-label">¿Es físicamente válido?</div>
      <div class="fy-det-btns">
        <button class="fy-btn fy-btn-valido"   onclick="fyDetV('valido','${ej.id}')">✓ VÁLIDO</button>
        <button class="fy-btn fy-btn-invalido" onclick="fyDetV('invalido','${ej.id}')">✗ INVÁLIDO</button>
        <button class="fy-btn fy-btn-noseguro" onclick="fyDetV('noseguro','${ej.id}')">? NO SÉ</button>
      </div>
    </div>
    <div class="fy-det-razones hidden" id="fy-det-raz-${ej.id}">
      <div class="fy-det-label">Elige la razón correcta:</div>
      ${ej.opciones.map(o=>`
        <button class="fy-btn fy-det-razon-btn"
                onclick="fyDetR('${o.id}','${ej.id}',${o.ok})">
          ${o.id}. ${o.texto}
        </button>`).join('')}
    </div>
  `;
}

function fyDetV(resp, ejId) {
  const ej=fyState.nv.ejercicios.find(e=>e.id===ejId);
  if(!ej) return;
  if(resp==='noseguro'){fyMostrarFb(false,'Intenta decidirte. Repasa las reglas.',null);return;}
  const ok=resp===ej.respCorr||(resp==='valido'&&ej.respCorr==='valido_pero');
  if(ok){
    document.getElementById(`fy-det-raz-${ejId}`)?.classList.remove('hidden');
  } else {
    fyMostrarFb(false,`Veredicto incorrecto. Era: ${ej.respCorr}`,ej.razonCorr);
  }
}

function fyDetR(opId, ejId, correcto) {
  const ej=fyState.nv.ejercicios.find(e=>e.id===ejId);
  if(!ej) return;
  if(correcto){
    fyState.combos++;
    fyMostrarFb(true,'¡Correcto! Veredicto y razón acertados.',ej.razonCorr);
    setTimeout(()=>{
      fyOcultarFb();
      const sig=fyState.ejIdx+1;
      if(sig<fyState.nv.ejercicios.length) fyCargarEjercicio(sig);
      else fyNivelCompleto();
    },3000);
  } else {
    fyMostrarFb(false,'Razón incorrecta.',`Pista: ${ej.razonCorr}`);
  }
}

/* ════════════════════════════════════════════
   NIVEL COMPLETO / RESULTADOS
   ════════════════════════════════════════════ */
function fyNivelCompleto() {
  if(fyState.nv.puntuado){ fyMostrarResultados(); return; }
  const sig=fyState.idx+1;
  fyMostrarFb(true,
    `¡Nivel ${fyState.nv.id} completado!${sig<FY_NIVELES.length?' Avanzando al nivel '+(sig+1)+'...':''}`,
    '');
  setTimeout(()=>{fyOcultarFb();if(sig<FY_NIVELES.length)fyIniciarNivel(sig);},2500);
}

function fyMostrarResultados() {
  const pts=fyState.puntaje||0;
  const logro=FY_LOGROS.find(l=>pts>=l.min)||FY_LOGROS[FY_LOGROS.length-1];
  const hist=JSON.parse(localStorage.getItem('fy_historial')||'[]');
  hist.unshift({fecha:new Date().toLocaleDateString('es-MX'),puntaje:pts,logro:logro.nombre});
  if(hist.length>10)hist.pop();
  localStorage.setItem('fy_historial',JSON.stringify(hist));
  fyMostrarFb(true,`${logro.emoji} ¡${logro.nombre}! ${pts} pts — ${fyState.combos} correctos, ${fyState.errores} errores.`,
    'Revisa tu perfil para ver el historial de logros.');
}

/* ════════════════════════════════════════════
   UTILIDADES
   ════════════════════════════════════════════ */
function fyActualizarUI(){
  const tot=fyState.nv.ejercicios.length||1, cur=fyState.ejIdx;
  document.getElementById('fy-prog-val').textContent=`${cur} / ${tot}`;
  document.getElementById('fy-prog-bar').style.width=`${(cur/tot)*100}%`;
}
function fyTogglePista(){ document.getElementById('fy-pista').classList.toggle('hidden'); }
function fyReset(){ fyState.segs=[]; }
function fyRenderNivelesGrid(){
  const g=document.getElementById('fy-niveles-grid');if(!g)return;g.innerHTML='';
  FY_NIVELES.forEach((nv,i)=>{
    const b=document.createElement('button');
    b.className=`fy-btn fy-nv-item${i===fyState.idx?' fy-nv-activo':''}`;
    b.textContent=`Nv.${nv.id}`;b.title=nv.titulo;
    b.onclick=()=>{fyIniciarNivel(i);fyOcultarNiveles();};
    g.appendChild(b);
  });
}
function fyMostrarNiveles(){fyRenderNivelesGrid();document.getElementById('fy-niveles-overlay').classList.remove('hidden');}
function fyOcultarNiveles(){document.getElementById('fy-niveles-overlay').classList.add('hidden');}

function cerrarFoton(){
  if(fyRAF){cancelAnimationFrame(fyRAF);fyRAF=null;}
  window.removeEventListener('resize',fyAjustarCanvas);
  if(fyScreen){fyScreen.remove();fyScreen=null;fyCanvas=null;fyCtx=null;}
  showScreen('me');
}
