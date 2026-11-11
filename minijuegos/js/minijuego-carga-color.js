/* ══════════════════════════════════════════
   minijuegos/js/minijuego-carga-color.js
   Minijuego: Carga de Color (QCD)
   Niveles:
   1 — Bariones: tríos RGB (solo colores)
   2 — Protones: uud
   3 — Neutrones: udd
   4 — Protones y neutrones combinados
   5 — Mesones: pares color+anticolor (sin sabor)
   6 — Piones: u+d̄ o d+ū
   7 — Mesones gen2: c+c̄, s+s̄
   8 — Mesones mixtos: kaones (u+s̄), D-mesones (u+c̄)
   9 — Modo libre: cualquier hadrón válido (desafío extra)

   Etapas (navegación):
     Etapa 1 → niveles de arrastre básicos
     Etapa 2 → mesones y bariones pesados
     Etapa 3 → "El Tejido de Gluones" (módulo g3*): intercambio de
               gluones para transformar colores (mecánica propia).
   ══════════════════════════════════════════ */

let ccScreen  = null;
let ccCanvas  = null;
let ccCtx     = null;
let ccRAF     = null;
let ccState   = {};
const CC_ASSETS = {};

/* ── Precargar assets de feedback ── */
function precargarAssets(cb) {
  const lista = {
    bien:        'minijuegos/assets/bien.png',
    advertencia: 'minijuegos/assets/advertencia.png'
  };
  let pending = Object.keys(lista).length;
  for (const [k, src] of Object.entries(lista)) {
    const img = new Image();
    img.onload  = () => { CC_ASSETS[k] = img; if (!--pending) cb(); };
    img.onerror = () => { CC_ASSETS[k] = null; if (!--pending) cb(); };
    img.src = src;
  }
}

/* ════════════════════════════════════════════
   COLORES
   ════════════════════════════════════════════ */
const QCOLOR = {
  R:  { fill:'#e53935', label:'R',  anti:false },
  G:  { fill:'#43a047', label:'G',  anti:false },
  B:  { fill:'#1e88e5', label:'B',  anti:false },
  aR: { fill:'#00bcd4', label:'R̄', anti:true  },
  aG: { fill:'#e91e63', label:'Ḡ', anti:true  },
  aB: { fill:'#fdd835', label:'B̄', anti:true  }
};

const QRADIUS     = 30;
const ZONA_R      = 88;
const MAX_PART    = 14;

/* ════════════════════════════════════════════
   DEFINICIÓN DE NIVELES
   ════════════════════════════════════════════ */
const CC_NIVELES = [
  {
    id:1, speedBase:0.5,
    titulo:'Nivel 1: Junta cinco núcleos',
    intro:'Los quarks llevan "carga de color": rojo, verde o azul. Para formar un barión estable debes juntar tres quarks con los TRES colores distintos. ¡Arrastra las bolas a la zona central!',
    objetivo:5, descripcionObj:'bariones RGB',
    tipo:'baryons', doble:false,
    spawner:()=>spawnCC(['R','G','B'], null),
    validator: esBaryonRGB
  },
  {
    id:2, speedBase:0.6,
    titulo:'Nivel 2: Junta cinco protones',
    intro:'Dos quarks up (u) y un quark down (d) forman un protón (carga total = +1). Los colores siguen siendo R, G y B. ¡Forma cinco protones!',
    objetivo:5, descripcionObj:'protones (uud)',
    tipo:'protons', doble:false,
    spawner:()=>spawnCC(['R','G','B'], ['u','d']),
    validator: esProton
  },
  {
    id:3, speedBase:0.65,
    titulo:'Nivel 3: Junta cinco neutrones',
    intro:'Un quark up (u) y dos quarks down (d) forman un neutrón (carga total = 0). ¡Forma cinco neutrones!',
    objetivo:5, descripcionObj:'neutrones (udd)',
    tipo:'neutrons', doble:false,
    spawner:()=>spawnCC(['R','G','B'], ['u','d']),
    validator: esNeutron
  },
  {
    id:4, speedBase:0.7,
    titulo:'Nivel 4: Cinco protones Y cinco neutrones',
    intro:'¡Ahora debes formar ambos! Recuerda: protón = uud, neutrón = udd. Cada uno cuenta por separado.',
    objetivo:5, descripcionObj:'protones y neutrones',
    tipo:'both', doble:true,
    spawner:()=>spawnCC(['R','G','B'], ['u','d']),
    validator: (g)=>esProton(g).ok||esNeutron(g).ok ? esProton(g).ok ? esProton(g) : esNeutron(g) : {ok:false,msg:'Combina uud (protón) o udd (neutrón) con colores R, G, B.'}
  },
  {
    id:5, speedBase:0.75,
    titulo:'Nivel 5: Junta cinco pares (mesones)',
    intro:'¡Los mesones son pares quark-antiquark! El anticolor de ROJO es CIAN, el de VERDE es MAGENTA y el de AZUL es AMARILLO. Junta un color con su anticolor complementario.',
    objetivo:5, descripcionObj:'pares color-anticolor',
    tipo:'mesons_plain', doble:false,
    spawner:()=>spawnMeson(['R','G','B'], null),
    validator: esMesonSimple
  },
  {
    id:6, speedBase:0.85,
    titulo:'Nivel 6: Junta cinco piones',
    intro:'Los piones (π) son los mesones más ligeros: u+d̄ o d+ū. Ahora las partículas tienen su sabor (u o d). ¡Combina un quark con su antiquark de sabor correcto!',
    objetivo:5, descripcionObj:'piones (u+d̄ o d+ū)',
    tipo:'pions', doble:false,
    spawner:()=>spawnMeson(['R','G','B'], ['u','d']),
    validator: esPion
  },
  {
    id:7, speedBase:0.95,
    titulo:'Nivel 7: Mesones de 2ª generación',
    intro:'Los quarks charm (c) y strange (s) también forman mesones. El mesón J/ψ es c+c̄, el φ es s+s̄. ¡Encuentra los pares correctos!',
    objetivo:5, descripcionObj:'mesones s, c',
    tipo:'mesons_gen2', doble:false,
    spawner:()=>spawnMeson(['R','G','B'], ['s','c']),
    validator: esMesonGen2
  },
  {
    id:8, speedBase:1.05,
    titulo:'Nivel 8: Kaones y D-mesones',
    intro:'Los kaones mezclan generaciones: u+s̄ o d+s̄. Los D-mesones usan charm: u+c̄ o d+c̄. ¡Más combinaciones, más dificultad!',
    objetivo:6, descripcionObj:'kaones y D-mesones',
    tipo:'mesons_mixed', doble:false,
    spawner:()=>spawnMeson(['R','G','B'], ['u','d','s','c']),
    validator: esMesonMixto
  },
  {
    id:9, speedBase:0.9,
    titulo:'Nivel 9: Hiperones',
    intro:'Los hiperones son bariones con quark strange: Λ (uds), Σ (uus/dds), Ξ (uss/dss), Ω (sss). Junta 3 quarks con colores R, G, B y al menos un strange.',
    objetivo:5, descripcionObj:'hiperones (con s)',
    tipo:'hyperons', doble:false,
    spawner:()=>spawnBaryonForzado(['R','G','B'], 's', ['u','d']),
    validator: esHiperon
  },
  {
    id:10, speedBase:1.0,
    titulo:'Nivel 10: Bariones encantados',
    intro:'Los bariones charmed llevan un quark charm: Λc⁺ (udc), Σc (uuc/ddc), Ξcc (ucc). Forma 3 quarks RGB con al menos un charm.',
    objetivo:5, descripcionObj:'bariones con charm',
    tipo:'charm_baryons', doble:false,
    spawner:()=>spawnBaryonForzado(['R','G','B'], 'c', ['u','d']),
    validator: esBaryonCharm
  },
  {
    id:11, speedBase:1.1,
    titulo:'Nivel 11: Mesones B',
    intro:'Los mesones B contienen un quark bottom (b): B⁰ (d+b̄), B⁺ (u+b̄), Bs (s+b̄), Bc (c+b̄). Junta un color con su anticolor, usando un quark bottom.',
    objetivo:6, descripcionObj:'mesones B (con b)',
    tipo:'mesons_b', doble:false,
    spawner:()=>spawnMesonForzado(['R','G','B'], 'b', ['u','d','s','c']),
    validator: esMesonB
  },
  {
    id:12, speedBase:1.2,
    titulo:'Nivel 12: Modo libre',
    intro:'¡Todo lo aprendido! Aparecen quarks de varias generaciones. Forma CUALQUIER hadrón válido: protón, neutrón, pión, kaón o mesón D. El juego los reconoce todos.',
    objetivo:10, descripcionObj:'combinaciones (puntuado)',
    tipo:'free', doble:false, puntuado:true,
    spawner:()=>spawnFree(),
    validator: esHadronValido
  }
];

/* ════════════════════════════════════════════
   ETAPAS — agrupan los niveles de CC_NIVELES
   Etapa 1: niveles 1-6 (bariones, protones, neutrones, mesones, piones)
   Etapa 2: niveles 7-11 (mesones gen2, kaones/D, hiperones, bariones charm, mesones B)
   El nivel 12 (modo libre puntuado, índice 11) NO pertenece a ninguna
   etapa: se juega aparte desde la sección "Desafíos extras" del hub.
   indices = posiciones (0-based) en CC_NIVELES
   ════════════════════════════════════════════ */
const CC_ETAPAS = [
  { label: 'Etapa 1', nombre: 'Hadrones básicos',          indices: [0,1,2,3,4,5] },
  { label: 'Etapa 2', nombre: 'Mesones y bariones pesados', indices: [6,7,8,9,10] },
  { label: 'Etapa 3', nombre: 'El Tejido de Gluones',       gluones: true },
];

/* Índice del nivel "modo libre" (desafío extra), fuera de las etapas */
const CC_NIVEL_LIBRE = 11;

/* Devuelve el índice de etapa al que pertenece un nivel (0-based) */
function ccEtapaDeNivel(idx) {
  for (let e = 0; e < CC_ETAPAS.length; e++) {
    if (CC_ETAPAS[e].indices && CC_ETAPAS[e].indices.includes(idx)) return e;
  }
  return 0;
}

/* Número del nivel RELATIVO a su etapa (cada etapa empieza en 1) */
function ccNivelRelativo(idx) {
  const e = ccEtapaDeNivel(idx);
  return CC_ETAPAS[e].indices.indexOf(idx) + 1;
}

/* Reescribe el título para que use la numeración por etapa.
   Convierte "Nivel 9: Hiperones" → "Nivel 3: Hiperones" (si es el 3º de su etapa) */
function ccTituloRelativo(idx, nv) {
  const num = ccNivelRelativo(idx);
  return nv.titulo.replace(/^Nivel\s+\d+/i, `Nivel ${num}`);
}

/* ════════════════════════════════════════════
   ENTRADA AL JUEGO
   ════════════════════════════════════════════ */
function iniciar_carga_color() {
  precargarAssets(() => {
    crearPantalla();
    iniciarNivel(0);
  });
}

/* Entrada directa al MODO LIBRE (desafío extra del hub).
   Se expone como iniciar_carga_color_libre para que el hub la invoque. */
function iniciar_carga_color_libre() {
  precargarAssets(() => {
    crearPantalla();
    iniciarNivel(CC_NIVEL_LIBRE);
  });
}

/* ════════════════════════════════════════════
   CREAR PANTALLA
   ════════════════════════════════════════════ */
function crearPantalla() {
  if (ccScreen) { ccScreen.remove(); }

  ccScreen = document.createElement('div');
  ccScreen.id = 'cc-screen';
  ccScreen.className = 'cc-screen';
  ccScreen.innerHTML = `
    <div class="cc-header">
      <div class="cc-instruccion-wrap">
        <div class="cc-instruccion-label">CARGA DE COLOR</div>
        <div class="cc-instruccion-icon">⚛</div>
        <p class="cc-instruccion" id="cc-instruccion"></p>
      </div>
    </div>

    <div class="cc-body">
      <!-- Panel de instrucciones + progreso (izquierda) -->
      <div class="cc-panel">
        <div class="cc-panel-card">
          <div class="cc-panel-titulo" id="cc-nivel-titulo">—</div>
          <div class="cc-panel-desc"  id="cc-nivel-desc">—</div>
        </div>
        <div class="cc-panel-card">
          <div class="cc-panel-label">Progreso</div>
          <div class="cc-prog-val"  id="cc-prog-val">0 / 5</div>
          <div class="cc-prog-wrap"><div class="cc-prog-bar" id="cc-prog-bar"></div></div>
          <div id="cc-prog-extra" style="display:none;margin-top:8px">
            <div class="cc-panel-label" style="font-size:9px">Neutrones</div>
            <div class="cc-prog-val" id="cc-prog-val2">0 / 5</div>
            <div class="cc-prog-wrap"><div class="cc-prog-bar cc-prog-bar2" id="cc-prog-bar2"></div></div>
          </div>
        </div>

        <!-- Niveles de la etapa actual (dots clicables) -->
        <div class="cc-panel-card" id="cc-niveles-card">
          <div class="cc-panel-label" id="cc-etapa-label">Niveles de la etapa</div>
          <div class="cc-niveles-dots" id="cc-niveles-dots"></div>
        </div>

        <!-- Avance al siguiente nivel (aparece al completar) -->
        <button class="cc-btn cc-btn-next hidden" id="cc-btn-sig" onclick="ccSiguienteNivel()">Siguiente nivel →</button>
      </div>

      <canvas id="cc-canvas" class="cc-canvas"></canvas>
    </div>

    <!-- Barra de navegación inferior con etapas -->
    <div class="cc-nav-bar">
      <button class="cc-btn cc-btn-volver" onclick="cerrarCC()">← Volver al ME</button>
      <div class="cc-etapa-dots" id="cc-etapa-dots"></div>
      <div class="cc-progreso-label" id="cc-progreso-label"></div>
    </div>

    <!-- Feedback overlay -->
    <div class="cc-fb hidden" id="cc-fb">
      <canvas id="cc-fb-canvas" width="100" height="100"></canvas>
      <div class="cc-fb-msg" id="cc-fb-msg"></div>
    </div>
  `;

  document.getElementById('app').appendChild(ccScreen);
  ccCanvas = document.getElementById('cc-canvas');
  ccCtx    = ccCanvas.getContext('2d');

  ajustarCanvas();
  window.addEventListener('resize', ajustarCanvas);

  ccCanvas.addEventListener('mousedown',  ccDragStart);
  ccCanvas.addEventListener('mousemove',  ccDragMove);
  ccCanvas.addEventListener('mouseup',    ccDragEnd);
  ccCanvas.addEventListener('touchstart', e=>{e.preventDefault();ccDragStart(e);},{passive:false});
  ccCanvas.addEventListener('touchmove',  e=>{e.preventDefault();ccDragMove(e);}, {passive:false});
  ccCanvas.addEventListener('touchend',   ccDragEnd);
}

function ajustarCanvas() {
  if (!ccCanvas) return;
  ccCanvas.width  = ccCanvas.offsetWidth;
  ccCanvas.height = ccCanvas.offsetHeight;
  if (ccState.zona) {
    ccState.zona.x = ccCanvas.width  / 2;
    ccState.zona.y = ccCanvas.height / 2;
  }
}

/* ════════════════════════════════════════════
   INICIAR NIVEL
   ════════════════════════════════════════════ */
function iniciarNivel(idx) {
  if (ccRAF) { cancelAnimationFrame(ccRAF); ccRAF = null; }

  const nv = CC_NIVELES[idx];
  ccState = {
    idx, nv,
    particulas: [],
    dragging: null,
    zona: { x: ccCanvas.width/2, y: ccCanvas.height/2, r: ZONA_R },
    prog: 0, prog2: 0,
    fbTimer: 0,
    terminado: false,
    spawnTick: 0,
    spawnInterval: Math.max(55, 115 - idx*8)
  };

  const esLibre = idx === CC_NIVEL_LIBRE;
  document.getElementById('cc-instruccion').textContent = nv.intro;
  document.getElementById('cc-nivel-titulo').textContent = esLibre ? 'Desafío extra: Modo libre' : ccTituloRelativo(idx, nv);
  document.getElementById('cc-nivel-desc').textContent   = `Meta: ${nv.objetivo} ${nv.descripcionObj}`;
  document.getElementById('cc-prog-extra').style.display = nv.doble ? 'block' : 'none';
  const btnSig = document.getElementById('cc-btn-sig');
  if (btnSig) btnSig.classList.add('hidden');

  /* En el modo libre (desafío extra) no hay etapas ni dots de nivel:
     se oculta toda la navegación por etapas. */
  const navDots   = document.getElementById('cc-niveles-card');
  const etapaDots = document.getElementById('cc-etapa-dots');
  if (navDots)   navDots.style.display   = esLibre ? 'none' : '';
  if (etapaDots) etapaDots.style.display = esLibre ? 'none' : '';

  actualizarUI();
  if (!esLibre) {
    ccRenderEtapaDots();
    ccRenderNivelesDots();
  } else {
    const lbl = document.getElementById('cc-progreso-label');
    if (lbl) lbl.textContent = 'Desafío extra · Modo libre puntuado';
  }

  for (let i = 0; i < 10; i++) nv.spawner();
  ccLoop();
}

/* ── Dots de etapa en la barra inferior ── */
function ccRenderEtapaDots() {
  const cont = document.getElementById('cc-etapa-dots');
  if (!cont) return;
  const etapaActual = ccEtapaDeNivel(ccState.idx);
  cont.innerHTML = CC_ETAPAS.map((e, i) => `
    <button class="cc-etapa-dot ${i === etapaActual ? 'active' : ''}"
            onclick="ccIrEtapa(${i})" title="${e.nombre}">
      ${e.label}
    </button>
  `).join('');
  const lbl = document.getElementById('cc-progreso-label');
  if (lbl) lbl.textContent = `${CC_ETAPAS[etapaActual].label} · ${CC_ETAPAS[etapaActual].nombre}`;
}

/* ── Dots de nivel dentro de la etapa actual (panel izquierdo) ── */
function ccRenderNivelesDots() {
  const cont = document.getElementById('cc-niveles-dots');
  if (!cont) return;
  const etapaActual = ccEtapaDeNivel(ccState.idx);
  const etapa = CC_ETAPAS[etapaActual];
  const lbl = document.getElementById('cc-etapa-label');
  if (lbl) lbl.textContent = `Niveles de la ${etapa.label}`;
  cont.innerHTML = etapa.indices.map((ni, pos) => {
    const n = CC_NIVELES[ni];
    const activo = ni === ccState.idx;
    /* Numeración relativa a la etapa: cada etapa empieza en 1 */
    const numEtapa = pos + 1;
    return `<button class="cc-nivel-dot ${activo ? 'active' : ''}"
                    title="${n.titulo}" onclick="iniciarNivel(${ni})">
      ${numEtapa}
    </button>`;
  }).join('');
}

/* Ir al primer nivel de una etapa.
   La Etapa 3 (El Tejido de Gluones) usa un módulo propio. */
function ccIrEtapa(e) {
  const etapa = CC_ETAPAS[e];
  if (etapa.gluones) { iniciar_carga_color_gluones(); return; }
  iniciarNivel(etapa.indices[0]);
}

/* Avanzar al siguiente nivel (botón) */
function ccSiguienteNivel() {
  const sig = ccState.idx + 1;
  /* El nivel libre (índice CC_NIVEL_LIBRE) está fuera del flujo secuencial */
  if (sig < CC_NIVEL_LIBRE) iniciarNivel(sig);
}

/* ════════════════════════════════════════════
   SPAWNERS
   ════════════════════════════════════════════ */
function nuevaParticula(colorKey, sabor) {
  const W = ccCanvas.width, H = ccCanvas.height;
  const sp = ccState.nv.speedBase * (0.5 + Math.random()*0.5);
  const side = Math.floor(Math.random()*4);
  let x, y, vx, vy;
  if      (side===0){x=Math.random()*W; y=-QRADIUS;  vx=(Math.random()-.5)*sp*1.2; vy=sp;}
  else if (side===1){x=W+QRADIUS;       y=Math.random()*H; vx=-sp; vy=(Math.random()-.5)*sp*1.2;}
  else if (side===2){x=Math.random()*W; y=H+QRADIUS; vx=(Math.random()-.5)*sp*1.2; vy=-sp;}
  else              {x=-QRADIUS;        y=Math.random()*H; vx=sp;  vy=(Math.random()-.5)*sp*1.2;}
  return { x, y, vx, vy, colorKey, sabor, anti: QCOLOR[colorKey].anti, r: QRADIUS, drag:false, enZona:false, id:Math.random() };
}

/* Devuelve el color que MENOS aparece entre las partículas libres */
function colorMenosRepresentado(colores) {
  const libres = ccState.particulas.filter(p => !p.enZona);
  const conteo = {};
  colores.forEach(c => { conteo[c] = 0; });
  libres.forEach(p => { if (conteo[p.colorKey] !== undefined) conteo[p.colorKey]++; });
  /* Si algún color tiene 0 instancias → prioridad máxima */
  const ausentes = colores.filter(c => conteo[c] === 0);
  if (ausentes.length > 0) return ausentes[Math.floor(Math.random()*ausentes.length)];
  /* Si no, elegir el de menor conteo */
  return colores.reduce((a,b) => conteo[a] <= conteo[b] ? a : b);
}

function spawnCC(colores, sabores) {
  if (ccState.particulas.length >= MAX_PART) return;
  /* Spawn balanceado: prioriza el color que falta */
  const c = colorMenosRepresentado(colores);
  const s = sabores ? sabores[Math.floor(Math.random()*sabores.length)] : null;
  ccState.particulas.push(nuevaParticula(c, s));
}

function spawnMeson(coloresBase, sabores) {
  if (ccState.particulas.length >= MAX_PART) return;
  /* Balancear entre quarks y antiquarks */
  const libres   = ccState.particulas.filter(p => !p.enZona);
  const nQuarks  = libres.filter(p => !p.anti).length;
  const nAntis   = libres.filter(p =>  p.anti).length;
  /* Si hay muchos más quarks que antiquarks, forzar anticolor */
  const esAnti = nQuarks > nAntis + 2 ? true
               : nAntis  > nQuarks + 2 ? false
               : Math.random() < 0.5;
  const base = coloresBase[Math.floor(Math.random()*coloresBase.length)];
  const cKey = esAnti ? 'a'+base : base;
  const s = sabores ? sabores[Math.floor(Math.random()*sabores.length)] : null;
  ccState.particulas.push(nuevaParticula(cKey, s));
}

function spawnFree() {
  if (ccState.particulas.length >= MAX_PART) return;
  const allC = ['R','G','B','aR','aG','aB'];
  const allS = ['u','d','s','c'];
  const c = colorMenosRepresentado(allC);
  const s = allS[Math.floor(Math.random()*allS.length)];
  ccState.particulas.push(nuevaParticula(c, s));
}

/* Spawner que garantiza presencia de un sabor clave (ej. 'b', 's' o 'c')
   para que los niveles de bariones/mesones pesados sean jugables.
   Alterna entre el sabor clave y sabores de relleno, equilibrando quark/antiquark. */
function spawnMesonForzado(coloresBase, saborClave, relleno) {
  if (ccState.particulas.length >= MAX_PART) return;
  const libres  = ccState.particulas.filter(p => !p.enZona);
  const nQuarks = libres.filter(p => !p.anti).length;
  const nAntis  = libres.filter(p =>  p.anti).length;
  const esAnti = nQuarks > nAntis + 1 ? true
               : nAntis  > nQuarks + 1 ? false
               : Math.random() < 0.5;
  /* ~45% de las veces usa el sabor clave; el resto, relleno */
  const sabor = Math.random() < 0.45 ? saborClave
              : relleno[Math.floor(Math.random()*relleno.length)];
  const base = coloresBase[Math.floor(Math.random()*coloresBase.length)];
  const cKey = esAnti ? 'a'+base : base;
  ccState.particulas.push(nuevaParticula(cKey, sabor));
}

/* Spawner de bariones que garantiza presencia de un sabor clave (s o c) */
function spawnBaryonForzado(colores, saborClave, relleno) {
  if (ccState.particulas.length >= MAX_PART) return;
  const c = colorMenosRepresentado(colores);
  const sabor = Math.random() < 0.4 ? saborClave
              : relleno[Math.floor(Math.random()*relleno.length)];
  ccState.particulas.push(nuevaParticula(c, sabor));
}

/* ════════════════════════════════════════════
   LIMPIEZA DE BLOQUEO
   Si hay demasiadas partículas del mismo color
   y no es posible ninguna combinación, elimina
   las sobrantes (las que más se repiten) para
   que entren nuevas partículas útiles.
   ════════════════════════════════════════════ */
function limpiarParticulasExceso() {
  const st  = ccState;
  const nv  = st.nv;
  const libres = st.particulas.filter(p => !p.enZona && !p.drag);
  if (libres.length < 4) return;   /* no hacer nada si hay pocas */

  /* Contar colores entre las partículas libres */
  const conteo = {};
  libres.forEach(p => { conteo[p.colorKey] = (conteo[p.colorKey]||0)+1; });

  /* Ordenar por abundancia descendente */
  const porAbundancia = libres.slice().sort((a,b) =>
    (conteo[b.colorKey]||0) - (conteo[a.colorKey]||0)
  );

  /* Eliminar las 2-3 más repetidas (no en zona, no arrastradas) */
  const aEliminar = porAbundancia.slice(0, Math.min(3, Math.floor(libres.length/3)));
  st.particulas = st.particulas.filter(p => !aEliminar.includes(p));

  /* Forzar spawn inmediato de colores que faltan */
  for (let i = 0; i < aEliminar.length; i++) nv.spawner();
}

/* ════════════════════════════════════════════
   VALIDADORES
   ════════════════════════════════════════════ */
function esBaryonRGB(g) {
  if (g.length!==3) return {ok:false, msg:'Un barión necesita exactamente 3 quarks.'};
  const cs = g.map(p=>p.colorKey).sort().join('');
  if (cs!=='BGR') return {ok:false, msg:'Necesitas uno ROJO, uno VERDE y uno AZUL.'};
  return {ok:true, msg:'¡Barión RGB formado! Los tres colores suman "blanco".'};
}

function esProton(g) {
  if (g.length!==3) return {ok:false, msg:'Un protón necesita exactamente 3 quarks.'};
  if (g.map(p=>p.colorKey).sort().join('')!=='BGR') return {ok:false, msg:'El protón necesita colores R, G y B.'};
  const s = g.map(p=>p.sabor).sort().join('');
  if (s!=='duu') return {ok:false, msg:'Un protón es uud: 2 quarks "up" y 1 "down".'};
  return {ok:true, msg:'¡Protón formado! (uud, carga +1)'};
}

function esNeutron(g) {
  if (g.length!==3) return {ok:false, msg:'Un neutrón necesita exactamente 3 quarks.'};
  if (g.map(p=>p.colorKey).sort().join('')!=='BGR') return {ok:false, msg:'El neutrón necesita colores R, G y B.'};
  const s = g.map(p=>p.sabor).sort().join('');
  if (s!=='ddu') return {ok:false, msg:'Un neutrón es udd: 1 quark "up" y 2 "down".'};
  return {ok:true, msg:'¡Neutrón formado! (udd, carga 0)'};
}

function esMesonSimple(g) {
  if (g.length!==2) return {ok:false, msg:'Un mesón necesita exactamente 2 partículas.'};
  const pares = {R:'aR',G:'aG',B:'aB',aR:'R',aG:'G',aB:'B'};
  const [a,b] = g;
  if (pares[a.colorKey]!==b.colorKey) return {ok:false, msg:'Junta un COLOR con su ANTICOLOR complementario (ej. Rojo↔Cian).'};
  return {ok:true, msg:'¡Mesón formado! Color + Anticolor = neutro.'};
}

function esPion(g) {
  if (g.length!==2) return {ok:false, msg:'Un pión necesita exactamente 2 partículas.'};
  const pares = {R:'aR',G:'aG',B:'aB',aR:'R',aG:'G',aB:'B'};
  const [a,b] = g;
  if (pares[a.colorKey]!==b.colorKey) return {ok:false, msg:'Necesitas color + su anticolor complementario.'};
  const q  = g.find(p=>!p.anti);
  const aq = g.find(p=>p.anti);
  if (!q||!aq) return {ok:false, msg:'Un pión necesita un quark y un antiquark.'};
  if (!['u','d'].includes(q.sabor)||!['u','d'].includes(aq.sabor))
    return {ok:false, msg:'Los piones solo usan quarks u y d.'};
  return {ok:true, msg:`¡Pión formado! (${q.sabor}+${aq.sabor}̄)`};
}

function esMesonGen2(g) {
  if (g.length!==2) return {ok:false, msg:'Un mesón necesita exactamente 2 partículas.'};
  const pares = {R:'aR',G:'aG',B:'aB',aR:'R',aG:'G',aB:'B'};
  const [a,b] = g;
  if (pares[a.colorKey]!==b.colorKey) return {ok:false, msg:'Necesitas color + su anticolor complementario.'};
  const q  = g.find(p=>!p.anti);
  const aq = g.find(p=>p.anti);
  if (!q||!aq) return {ok:false, msg:'Necesitas un quark y un antiquark.'};
  if (!['s','c'].includes(q.sabor)&&!['s','c'].includes(aq.sabor))
    return {ok:false, msg:'En este nivel usa quarks s (strange) o c (charm).'};
  const nombres = {cc:'J/ψ (c+c̄)',ss:'φ (s+s̄)',cs:'Ds (c+s̄)',sc:'Ds (s+c̄)'};
  const key = q.sabor+aq.sabor;
  return {ok:true, msg:`¡Mesón ${nombres[key]||'de 2ª gen'} formado!`};
}

function esMesonMixto(g) {
  if (g.length!==2) return {ok:false, msg:'Un mesón necesita exactamente 2 partículas.'};
  const pares = {R:'aR',G:'aG',B:'aB',aR:'R',aG:'G',aB:'B'};
  const [a,b] = g;
  if (pares[a.colorKey]!==b.colorKey) return {ok:false, msg:'Necesitas color + su anticolor complementario.'};
  const q  = g.find(p=>!p.anti);
  const aq = g.find(p=>p.anti);
  if (!q||!aq) return {ok:false, msg:'Necesitas un quark y un antiquark.'};
  const validos = {us:'Kaón K⁺',ds:'Kaón K⁰',uc:'D-mesón D⁺',dc:'D-mesón D⁰'};
  const key = q.sabor+aq.sabor;
  if (!validos[key]) return {ok:false, msg:`Combinación no válida. Prueba u+s̄ (K⁺), d+s̄ (K⁰), u+c̄ (D⁺) o d+c̄ (D⁰).`};
  return {ok:true, msg:`¡${validos[key]} formado!`};
}

/* ── Hiperón: barión RGB (3 quarks de colores distintos) con al menos un s ── */
function esHiperon(g) {
  if (g.length!==3) return {ok:false, msg:'Un hiperón necesita exactamente 3 quarks.'};
  if (g.map(p=>p.colorKey).sort().join('')!=='BGR') return {ok:false, msg:'Necesitas colores R, G y B.'};
  if (g.some(p=>p.anti)) return {ok:false, msg:'Un barión usa quarks (sin anticolores).'};
  if (!g.some(p=>p.sabor==='s')) return {ok:false, msg:'Un hiperón necesita al menos un quark strange (s).'};
  const s = g.map(p=>p.sabor).sort().join('');
  const nombres = {
    dss:'Ξ⁻ (dss)', sss:'Ω⁻ (sss)', dds:'Σ⁻ (dds)', dsu:'Λ/Σ⁰ (uds)',
    ssu:'Ξ⁰ (uss)', suu:'Σ⁺ (uus)'
  };
  return {ok:true, msg:`¡Hiperón ${nombres[s]||'(con strange)'} formado!`};
}

/* ── Barión charmed: barión RGB con al menos un quark c ── */
function esBaryonCharm(g) {
  if (g.length!==3) return {ok:false, msg:'Un barión necesita exactamente 3 quarks.'};
  if (g.map(p=>p.colorKey).sort().join('')!=='BGR') return {ok:false, msg:'Necesitas colores R, G y B.'};
  if (g.some(p=>p.anti)) return {ok:false, msg:'Un barión usa quarks (sin anticolores).'};
  if (!g.some(p=>p.sabor==='c')) return {ok:false, msg:'Un barión charmed necesita al menos un quark charm (c).'};
  const s = g.map(p=>p.sabor).sort().join('');
  const nombres = {
    cdu:'Λc⁺ (udc)', cuu:'Σc⁺⁺ (uuc)', cdd:'Σc⁰ (ddc)',
    ccu:'Ξcc (ucc)', cds:'Ξc (dsc)', csu:'Ξc⁺ (usc)'
  };
  return {ok:true, msg:`¡Barión encantado ${nombres[s]||'(con charm)'} formado!`};
}

/* ── Mesón B: par color-anticolor con un quark bottom (b) ── */
function esMesonB(g) {
  if (g.length!==2) return {ok:false, msg:'Un mesón necesita exactamente 2 partículas.'};
  const pares = {R:'aR',G:'aG',B:'aB',aR:'R',aG:'G',aB:'B'};
  const [a,b] = g;
  if (pares[a.colorKey]!==b.colorKey) return {ok:false, msg:'Necesitas color + su anticolor complementario.'};
  const q  = g.find(p=>!p.anti);
  const aq = g.find(p=>p.anti);
  if (!q||!aq) return {ok:false, msg:'Necesitas un quark y un antiquark.'};
  if (q.sabor!=='b' && aq.sabor!=='b') return {ok:false, msg:'Un mesón B necesita un quark bottom (b).'};
  const otro = q.sabor==='b' ? aq.sabor : q.sabor;
  const nombres = {u:'B⁺/B⁻ (u+b̄)', d:'B⁰ (d+b̄)', s:'Bs⁰ (s+b̄)', c:'Bc (c+b̄)', b:'ϒ (b+b̄)'};
  return {ok:true, msg:`¡Mesón ${nombres[otro]||'B'} formado!`};
}

function esHadronValido(g) {
  const tieneAnti = g.some(p => p.anti);

  /* Si hay anticolores o solo 2 partículas → intentar mesones primero */
  if (tieneAnti || g.length === 2) {
    for (const fn of [esMesonMixto, esMesonGen2, esPion, esMesonSimple]) {
      const r = fn(g); if (r.ok) return r;
    }
    /* Si falló como mesón con 2 partículas, dar error específico */
    if (g.length === 2)
      return {ok:false, msg:'Par inválido. Para un mesón necesitas color + su anticolor complementario (ej. Rojo + Cian).'};
  }

  /* Si son 3 partículas → intentar bariones */
  if (g.length === 3) {
    for (const fn of [esProton, esNeutron, esBaryonRGB]) {
      const r = fn(g); if (r.ok) return r;
    }
  }

  /* Intento general */
  for (const fn of [esProton, esNeutron, esPion, esMesonGen2, esMesonMixto, esBaryonRGB, esMesonSimple]) {
    const r = fn(g); if (r.ok) return r;
  }
  return {ok:false, msg:'Combinación no válida. Intenta: protón (uud), neutrón (udd), pión, kaón o mesón D.'};
}

/* ════════════════════════════════════════════
   LOOP
   ════════════════════════════════════════════ */
function ccLoop() {
  ccActualizar();
  ccDibujar();
  ccRAF = requestAnimationFrame(ccLoop);
}

function ccActualizar() {
  const st = ccState;
  if (!st.nv || st.terminado) return;
  const W = ccCanvas.width, H = ccCanvas.height;

  /* Spawn */
  st.spawnTick++;
  if (st.spawnTick >= st.spawnInterval && st.particulas.length < MAX_PART) {
    st.nv.spawner();
    st.spawnTick = 0;
  }

  /* Detección de bloqueo: si está lleno y lleva mucho tiempo sin combinar → limpiar exceso */
  st.bloqueadoTick = (st.bloqueadoTick || 0) + 1;
  if (st.bloqueadoTick > 300) {   /* ~5 segundos sin cambio */
    st.bloqueadoTick = 0;
    limpiarParticulasExceso();
  }

  /* Mover */
  st.particulas.forEach(p => {
    if (p.drag || p.enZona) return;   /* ← fijas si están en zona */
    p.x += p.vx; p.y += p.vy;
    if (p.x-p.r<0)    {p.x=p.r;     p.vx=Math.abs(p.vx);}
    if (p.x+p.r>W)    {p.x=W-p.r;   p.vx=-Math.abs(p.vx);}
    if (p.y-p.r<0)    {p.y=p.r;     p.vy=Math.abs(p.vy);}
    if (p.y+p.r>H)    {p.y=H-p.r;   p.vy=-Math.abs(p.vy);}

    /* Repulsión entre partículas */
    st.particulas.forEach(q => {
      if (q===p||q.drag||q.enZona) return;
      const dx=p.x-q.x, dy=p.y-q.y, d=Math.sqrt(dx*dx+dy*dy);
      if (d<p.r+q.r+6&&d>0) {
        const ov=(p.r+q.r+6-d)*0.28;
        p.x+=dx/d*ov; p.y+=dy/d*ov;
        q.x-=dx/d*ov; q.y-=dy/d*ov;
      }
    });
  });

  /* Limpiar timeout de feedback al cerrar nivel */
}

/* ════════════════════════════════════════════
   DIBUJO
   ════════════════════════════════════════════ */
function ccDibujar() {
  const ctx=ccCtx, W=ccCanvas.width, H=ccCanvas.height, st=ccState;

  /* Fondo oscuro cuadriculado (estética común a todos los minijuegos) */
  mjGridBackground(ctx, W, H);

  dibujarZona(st.zona);
  st.particulas.forEach(dibujarParticula);
}

function dibujarZona(z) {
  const ctx=ccCtx, st=ccState;
  const cerca = st.particulas.filter(p=>{
    const dx=p.x-z.x, dy=p.y-z.y;
    return Math.sqrt(dx*dx+dy*dy)<z.r+p.r+8;
  });
  const activa = cerca.length>0;
  const pulso  = 0.5+0.5*Math.sin(Date.now()*0.004);

  /* Halo exterior pulsante */
  ctx.save();
  ctx.beginPath();
  ctx.arc(z.x,z.y,z.r+16+pulso*6,0,Math.PI*2);
  ctx.fillStyle=activa?`rgba(0,229,255,${0.07+pulso*0.06})`:`rgba(100,60,220,${0.06+pulso*0.04})`;
  ctx.fill();

  /* Círculo principal */
  ctx.beginPath();
  ctx.arc(z.x,z.y,z.r,0,Math.PI*2);
  ctx.fillStyle=activa?'rgba(0,229,255,0.1)':'rgba(80,40,160,0.12)';
  ctx.fill();
  ctx.strokeStyle=activa?`rgba(0,229,255,${0.6+pulso*0.3})`:`rgba(140,80,255,${0.3+pulso*0.15})`;
  ctx.lineWidth=activa?2.5:1.5;
  ctx.setLineDash([8,5]);
  ctx.stroke();
  ctx.setLineDash([]);

  /* Cruz central */
  ctx.strokeStyle='rgba(255,255,255,0.1)';
  ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(z.x-20,z.y); ctx.lineTo(z.x+20,z.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(z.x,z.y-20); ctx.lineTo(z.x,z.y+20); ctx.stroke();

  /* Etiqueta */
  ctx.fillStyle=activa?'rgba(0,229,255,0.85)':'rgba(180,130,255,0.4)';
  ctx.font='12px "Exo 2",sans-serif';
  ctx.textAlign='center';
  ctx.fillText('zona de combinación',z.x,z.y+z.r+18);
  ctx.restore();
}

function dibujarParticula(p) {
  const ctx = ccCtx, cfg = QCOLOR[p.colorKey];

  /* ── 1. Círculo con glow (save/restore propio) ── */
  ctx.save();
  ctx.shadowColor = cfg.fill;
  ctx.shadowBlur  = p.drag ? 20 : 10;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r*(p.drag?1.1:1), 0, Math.PI*2);
  const g = ctx.createRadialGradient(p.x-p.r*.28, p.y-p.r*.28, 0, p.x, p.y, p.r);
  g.addColorStop(0,   lightenHex(cfg.fill, 30));
  g.addColorStop(0.6, cfg.fill);
  g.addColorStop(1,   darkenHex(cfg.fill, 40));
  ctx.fillStyle   = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth   = 1.8;
  ctx.stroke();
  ctx.restore();   /* ← glow queda aquí, NO contamina el texto */

  /* ── 2. Texto: save/restore limpio sin ningún shadow del círculo ── */
  ctx.save();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;

  /* Texto blanco con outline negro (strokeText + fillText) */
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  if (p.sabor) {
    const lbl = p.anti ? p.sabor + '\u0304' : p.sabor;

    /* Sombra/outline del texto */
    ctx.font      = 'bold 14px "Orbitron",monospace';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(lbl, p.x, p.y - 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(lbl, p.x, p.y - 4);

    ctx.font        = 'bold 10px "Exo 2",sans-serif';
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(cfg.label, p.x, p.y + 9);
    ctx.fillStyle   = '#ffffff';
    ctx.fillText(cfg.label, p.x, p.y + 9);
  } else {
    ctx.font        = 'bold 14px "Orbitron",monospace';
    ctx.lineWidth   = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(cfg.label, p.x, p.y);
    ctx.fillStyle   = '#ffffff';
    ctx.fillText(cfg.label, p.x, p.y);
  }
  ctx.restore();
}

function lightenHex(hex, a) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgb(${Math.min(255,r+a)},${Math.min(255,g+a)},${Math.min(255,b+a)})`;
}

function darkenHex(hex, a) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgb(${Math.max(0,r-a)},${Math.max(0,g-a)},${Math.max(0,b-a)})`;
}

/* ════════════════════════════════════════════
   DRAG & DROP
   ════════════════════════════════════════════ */
function posCanvas(e) {
  const rect = ccCanvas.getBoundingClientRect();
  /* ratio entre píxeles internos y tamaño CSS visual */
  const scaleX = ccCanvas.width  / rect.width;
  const scaleY = ccCanvas.height / rect.height;
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (cx - rect.left) * scaleX,
    y: (cy - rect.top)  * scaleY
  };
}
function ccDragStart(e) {
  const {x,y} = posCanvas(e);
  /* Buscar la partícula más cercana al punto de clic */
  let best = null, bestDist = Infinity;
  ccState.particulas.forEach(p => {
    const dx=p.x-x, dy=p.y-y, d=Math.sqrt(dx*dx+dy*dy);
    if (d < p.r + 10 && d < bestDist) { best=p; bestDist=d; }
  });
  if (!best) return;
  best.drag = true;
  best.enZona = false;   /* al agarrarla sale de zona */
  ccState.dragging = best;
  ccState.offX = best.x - x;
  ccState.offY = best.y - y;
}
function ccDragMove(e) {
  if (!ccState.dragging) return;
  const {x,y} = posCanvas(e);
  ccState.dragging.x = x + ccState.offX;
  ccState.dragging.y = y + ccState.offY;
}
function ccDragEnd() {
  if (!ccState.dragging) return;
  const p = ccState.dragging;
  p.drag = false;
  ccState.dragging = null;

  const z = ccState.zona;
  const dx = p.x - z.x, dy = p.y - z.y;
  const dentroZona = Math.sqrt(dx*dx+dy*dy) < z.r - p.r * 0.3;

  if (dentroZona) {
    /* Fijar partícula en zona — parar su movimiento */
    p.enZona = true;
    p.vx = 0; p.vy = 0;

    /* Acomodar suavemente dentro del círculo */
    const angulo = Math.atan2(dy, dx);
    const enZona = ccState.particulas.filter(q => q.enZona);
    const i = enZona.indexOf(p);
    if (enZona.length > 1) {
      /* Distribuir en arco dentro de la zona */
      const spread = Math.min(p.r * 2.2, (z.r - p.r) * 0.9);
      const offset = (i - (enZona.length - 1) / 2) * spread;
      p.x = z.x + Math.cos(angulo + Math.PI/2) * offset;
      p.y = z.y + Math.sin(angulo + Math.PI/2) * offset;
    } else {
      p.x = z.x; p.y = z.y;
    }

    /* Intentar combinar cuando hay suficientes */
    const grupo = ccState.particulas.filter(q => q.enZona);
    /* Para mesones y modo libre: si hay anticolores en el grupo, intentar con 2 */
    const hayAnticolor = grupo.some(q => q.anti);
    const minReq = (ccState.nv.tipo.startsWith('meson') || ccState.nv.tipo==='pions' || ccState.nv.tipo==='free')
      ? (hayAnticolor ? 2 : 3)
      : 3;
    if (grupo.length >= minReq) intentarCombinar(grupo);

  } else {
    /* Soltar fuera de zona: velocidad reducida */
    p.enZona = false;
    const sp = ccState.nv.speedBase;
    p.vx = (Math.random() - 0.5) * sp * 1.2;
    p.vy = (Math.random() - 0.5) * sp * 1.2;
  }
}

/* ════════════════════════════════════════════
   COMBINAR
   ════════════════════════════════════════════ */
function intentarCombinar(grupo) {
  const st=ccState, nv=st.nv;
  const r=nv.validator(grupo);

  if (r.ok) {
    const pts = nv.puntuado ? getPuntajeCombo(grupo) : 0;
    const msg = nv.puntuado ? `${r.msg}  +${pts} pts` : r.msg;
    mostrarFeedback(true, msg);
    st.particulas = st.particulas.filter(p => !grupo.includes(p));
    st.bloqueadoTick = 0;
    if (nv.puntuado) {
      st.puntaje = (st.puntaje || 0) + pts;
      st.combos  = (st.combos  || 0) + 1;
    }
    if (nv.doble) {
      if (esProton(grupo).ok)  st.prog++;
      if (esNeutron(grupo).ok) st.prog2++;
    } else {
      st.prog++;
    }
    actualizarUI();
    checkNivelCompleto();
  } else {
    const hayAnti = grupo.some(p => p.anti);
    const minReq = (nv.tipo.startsWith('meson') || nv.tipo==='pions' || nv.tipo==='free')
      ? (hayAnti ? 2 : 3)
      : 3;
    if (grupo.length>=minReq) {
      if (nv.puntuado) {
        st.puntaje = Math.max(0, (st.puntaje||0) + PUNTAJES.error);
        st.errores = (st.errores||0) + 1;
        mostrarFeedback(false, r.msg + `  ${PUNTAJES.error} pts`);
      } else {
        mostrarFeedback(false, r.msg);
      }
      grupo.forEach(p=>{
        p.enZona = false;
        p.vx=(Math.random()-.5)*nv.speedBase*1.8;
        p.vy=(Math.random()-.5)*nv.speedBase*1.8;
      });
      actualizarUI();
    }
  }
}

/* ════════════════════════════════════════════
   FEEDBACK
   ════════════════════════════════════════════ */
function mostrarFeedback(ok, msg) {
  const el = document.getElementById('cc-fb');
  const cv = document.getElementById('cc-fb-canvas');
  document.getElementById('cc-fb-msg').textContent = msg;
  el.className = `cc-fb ${ok ? 'cc-fb-ok' : 'cc-fb-err'}`;

  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, 100, 100);
  const img = CC_ASSETS[ok ? 'bien' : 'advertencia'];
  if (img) {
    ctx.drawImage(img, 0, 0, 100, 100);
    const id = ctx.getImageData(0, 0, 100, 100); const d = id.data;
    for (let i = 0; i < d.length; i += 4) if ((d[i]+d[i+1]+d[i+2])/3 < 40) d[i+3] = 0;
    ctx.putImageData(id, 0, 0);
  }

  /* Cancelar timer anterior si había uno activo */
  if (ccState.fbTimeout) clearTimeout(ccState.fbTimeout);
  ccState.fbTimer = 1; /* marcar como activo para el loop */

  ccState.fbTimeout = setTimeout(() => {
    el.classList.add('hidden');
    ccState.fbTimer   = 0;
    ccState.fbTimeout = null;
  }, 2500);  /* 2.5 segundos — tiempo suficiente para leer */
}

/* ════════════════════════════════════════════
   UI
   ════════════════════════════════════════════ */
function actualizarUI() {
  const st=ccState, nv=st.nv;
  const pct=Math.min(100,(st.prog/nv.objetivo)*100);
  document.getElementById('cc-prog-val').textContent=`${st.prog} / ${nv.objetivo}`;
  document.getElementById('cc-prog-bar').style.width=pct+'%';
  if (nv.doble) {
    const pct2=Math.min(100,(st.prog2/nv.objetivo)*100);
    document.getElementById('cc-prog-val2').textContent=`${st.prog2} / ${nv.objetivo}`;
    document.getElementById('cc-prog-bar2').style.width=pct2+'%';
  }
  /* Puntaje en tiempo real para nivel libre */
  if (nv.puntuado) {
    let scoreEl = document.getElementById('cc-score-live');
    if (!scoreEl) {
      const card = document.createElement('div');
      card.className = 'cc-panel-card cc-score-card';
      card.innerHTML = `
        <div class="cc-panel-label">Puntaje</div>
        <div class="cc-prog-val" id="cc-score-live" style="color:var(--gold)">0</div>
        <div class="cc-score-detail" id="cc-score-detail"></div>
      `;
      /* Insertar después del card de progreso */
      const progCard = document.getElementById('cc-progreso-card') ||
                       document.querySelector('.cc-panel-card:nth-child(2)');
      if (progCard && progCard.parentNode) {
        progCard.parentNode.insertBefore(card, progCard.nextSibling);
      }
      scoreEl = document.getElementById('cc-score-live');
    }
    if (scoreEl) {
      scoreEl.textContent = st.puntaje || 0;
      const det = document.getElementById('cc-score-detail');
      if (det) det.textContent =
        `Combos: ${st.combos||0}  Errores: ${st.errores||0}`;
    }
  }
}

function checkNivelCompleto() {
  const st=ccState, nv=st.nv;
  const done = nv.doble
    ? st.prog>=nv.objetivo && st.prog2>=nv.objetivo
    : st.prog>=nv.objetivo;
  if (!done) return;
  st.terminado=true;

  /* Registro de progreso para el desbloqueo por etapas (js/progreso.js).
     Se usa el índice del nivel porque es único dentro del minijuego. */
  if (typeof Progreso !== 'undefined') Progreso.moduloCompletado('carga-color', 'nivel' + st.idx);

  if (nv.puntuado) {
    /* Modo libre: pantalla de resultados */
    setTimeout(() => mostrarResultadosFree(), 500);
    return;
  }

  /* Nivel normal completado: mostrar botón para avanzar (sin confirm) */
  mostrarFeedback(true, `¡Nivel ${ccNivelRelativo(st.idx)} completado! 🎉`);
  const sig = st.idx + 1;
  const btn = document.getElementById('cc-btn-sig');
  /* El nivel libre está fuera del flujo: no se enlaza desde el botón */
  if (btn && sig < CC_NIVEL_LIBRE) {
    const mismaEtapa = ccEtapaDeNivel(sig) === ccEtapaDeNivel(st.idx);
    btn.textContent = mismaEtapa ? 'Siguiente nivel →' : 'Siguiente etapa →';
    btn.classList.remove('hidden');
  }
}

/* ── Pantalla de resultados del Modo Libre ── */
function mostrarResultadosFree() {
  const st  = ccState;
  const pts = st.puntaje || 0;
  const logro = getLogro(pts);

  /* Guardar en el historial unificado (js/progreso.js) */
  if (typeof Progreso !== 'undefined') {
    Progreso.registrarPartida('carga-color', {
      puntaje: pts,
      combos:  st.combos  || 0,
      errores: st.errores || 0
    });
  }

  /* Overlay de resultados */
  const overlay = document.createElement('div');
  overlay.className = 'cc-results-overlay';
  overlay.innerHTML = `
    <div class="cc-results-wrap">
      <div class="cc-results-title retro-text">RESULTADO FINAL</div>

      <div class="cc-results-logro" style="color:${logro.color}">
        <span class="cc-logro-emoji">${logro.emoji}</span>
        <span class="cc-logro-nombre">${logro.nombre.toUpperCase()}</span>
      </div>

      <div class="cc-results-puntaje" style="color:${logro.color}">${pts}</div>
      <div class="cc-results-pts-label">puntos</div>

      <div class="cc-results-stats">
        <div class="cc-stat">
          <div class="cc-stat-val">${st.combos||0}</div>
          <div class="cc-stat-label">Combinaciones</div>
        </div>
        <div class="cc-stat">
          <div class="cc-stat-val" style="color:#ff5252">${st.errores||0}</div>
          <div class="cc-stat-label">Errores</div>
        </div>
        <div class="cc-stat">
          <div class="cc-stat-val" style="color:#ff5252">-${(st.errores||0)*50}</div>
          <div class="cc-stat-label">Penalización</div>
        </div>
      </div>

      <!-- Escala de logros -->
      <div class="cc-logros-escala">
        ${LOGROS_CC.slice().reverse().map(l => `
          <div class="cc-logro-item ${pts>=l.min?'alcanzado':''}">
            <span>${l.emoji}</span>
            <span style="color:${l.color}">${l.nombre}</span>
            <span class="cc-logro-min">${l.min}+ pts</span>
          </div>
        `).join('')}
      </div>

      <div class="cc-results-btns">
        <button class="cc-btn" onclick="reiniciarFree()">🔄 Reintentar</button>
        <button class="cc-btn cc-btn-close" onclick="cerrarCC()">← Volver al ME</button>
      </div>
    </div>
  `;
  ccScreen.appendChild(overlay);
}

function reiniciarFree() {
  /* Quitar overlay y reiniciar el desafío extra (modo libre) */
  const ov = ccScreen.querySelector('.cc-results-overlay');
  if (ov) ov.remove();
  iniciarNivel(CC_NIVEL_LIBRE);
}

/* ════════════════════════════════════════════
   CERRAR
   ════════════════════════════════════════════ */
function cerrarCC() {
  if (ccRAF) { cancelAnimationFrame(ccRAF); ccRAF = null; }
  if (ccState.fbTimeout) { clearTimeout(ccState.fbTimeout); }
  window.removeEventListener('resize', ajustarCanvas);
  if (ccScreen) { ccScreen.remove(); ccScreen = null; ccCanvas = null; ccCtx = null; }
  showScreen('me');
}

/* ════════════════════════════════════════════
   SISTEMA DE PUNTAJE (Nivel 9 - Modo Libre)
   ════════════════════════════════════════════ */
const PUNTAJES = {
  meson_mixto:   500,
  meson_gen2:    350,
  pion:          250,
  proton:        200,
  neutron:       200,
  meson_simple:  150,
  baryons_color: 100,
  error:         -50
};

const LOGROS_CC = [
  { nombre:'Diamante', min:3500, emoji:'💎', color:'#b9f2ff' },
  { nombre:'Oro',      min:2500, emoji:'🥇', color:'#ffd740' },
  { nombre:'Plata',    min:1500, emoji:'🥈', color:'#c0c0c0' },
  { nombre:'Bronce',   min:0,    emoji:'🥉', color:'#cd7f32' }
];

function getPuntajeCombo(grupo) {
  if (esMesonMixto(grupo).ok)  return PUNTAJES.meson_mixto;
  if (esMesonGen2(grupo).ok)   return PUNTAJES.meson_gen2;
  if (esPion(grupo).ok)        return PUNTAJES.pion;
  if (esProton(grupo).ok)      return PUNTAJES.proton;
  if (esNeutron(grupo).ok)     return PUNTAJES.neutron;
  if (esMesonSimple(grupo).ok) return PUNTAJES.meson_simple;
  if (esBaryonRGB(grupo).ok)   return PUNTAJES.baryons_color;
  return 0;
}

function getLogro(pts) {
  return LOGROS_CC.find(l => pts >= l.min) || LOGROS_CC[LOGROS_CC.length - 1];
}


/* ╔══════════════════════════════════════════════════════════════╗
   ║  ETAPA 3 — "EL TEJIDO DE GLUONES"                             ║
   ║                                                               ║
   ║  Mecánica distinta a las etapas 1 y 2: en vez de arrastrar    ║
   ║  quarks a una zona, el usuario INTERCAMBIA GLUONES entre      ║
   ║  quarks para cambiar sus colores y formar el hadrón objetivo. ║
   ║                                                               ║
   ║  Álgebra del color (gluón C1·anti-C2):                        ║
   ║    · EMISIÓN   : un quark de color C1 emite el gluón → C2     ║
   ║    · ABSORCIÓN : un quark de color C2 absorbe el gluón → C1   ║
   ║  La carga de color TOTAL se conserva en cada intercambio.     ║
   ╚══════════════════════════════════════════════════════════════╝ */

/* Estado propio del módulo de gluones (independiente de ccState) */
let g3Screen = null;
let g3Canvas = null;
let g3Ctx    = null;
let g3RAF    = null;
let g3State  = {};

/* Los 6 gluones "intuitivos" (color + anticolor distinto).
   Cada gluón tiene color c1 y anticolor c̄2. Etiqueta mostrada: "C1 C̄2".
   · Un quark de color c2 lo ABSORBE y se vuelve c1.
   · Un quark de color c1 lo EMITE  y se vuelve c2. */
const G3_GLUONES = [
  { id:'RaG', c1:'R', c2:'G', label:'R Ḡ' },
  { id:'RaB', c1:'R', c2:'B', label:'R B̄' },
  { id:'GaR', c1:'G', c2:'R', label:'G R̄' },
  { id:'GaB', c1:'G', c2:'B', label:'G B̄' },
  { id:'BaR', c1:'B', c2:'R', label:'B R̄' },
  { id:'BaG', c1:'B', c2:'G', label:'B Ḡ' },
];

/* Nombre legible de un color (incluye anticolores) */
function g3NombreColor(k) {
  return ({R:'rojo',G:'verde',B:'azul',aR:'anti-rojo',aG:'anti-verde',aB:'anti-azul'})[k] || k;
}

/* ── Aplicar un gluón a un quark ──────────────────────────────
   IMPORTANTE (física correcta): un quark NO cambia de color solo. El
   color se INTERCAMBIA entre dos partículas mediante un gluón:
     · El quark ORIGEN emite el gluón C1·C̄2 → pierde C1, gana C2.
     · El quark DESTINO lo absorbe             → gana C1, pierde C2.
   La carga de color TOTAL se conserva: lo que pierde uno lo gana el otro.

   Para dos quarks (origen de color C1, destino de color C2) el gluón C1·C̄2
   hace que INTERCAMBIEN sus colores: origen C1→C2 y destino C2→C1.
   ════════════════════════════════════════════ */

/* ¿Puede el gluón `g` emitirse desde `origen` y absorberse en `destino`?
   Devuelve los nuevos colorKeys de ambos, o null si no es un intercambio válido.
   Soporta quark-quark y quark-antiquark (mesones). */
function g3Intercambio(origen, destino, g) {
  const o = origen.colorKey, d = destino.colorKey;
  const oAnti = o.startsWith('a'), dAnti = d.startsWith('a');

  /* Caso 1: dos QUARKS. Origen debe ser C1, destino debe ser C2. */
  if (!oAnti && !dAnti) {
    if (o === g.c1 && d === g.c2) {
      return { nuevoOrigen: g.c2, nuevoDestino: g.c1 };  /* intercambian color */
    }
    return null;
  }

  /* Caso 2: dos ANTIQUARKS. Etiqueta invertida: origen aC2, destino aC1. */
  if (oAnti && dAnti) {
    if (o === 'a'+g.c2 && d === 'a'+g.c1) {
      return { nuevoOrigen: 'a'+g.c1, nuevoDestino: 'a'+g.c2 };
    }
    return null;
  }

  /* Caso 3: QUARK + ANTIQUARK (mesón). El gluón traslada color del quark
     al antiquark de forma consistente con la conservación:
       quark C1 → C2 ; antiquark aC1 → aC2 (ambos cambian "en paralelo"). */
  const quark = oAnti ? destino : origen;
  const anti  = oAnti ? origen  : destino;
  if (quark.colorKey === g.c1 && anti.colorKey === 'a'+g.c1) {
    const nq = g.c2, na = 'a'+g.c2;
    return oAnti
      ? { nuevoOrigen: na, nuevoDestino: nq }
      : { nuevoOrigen: nq, nuevoDestino: na };
  }
  return null;
}

/* Gluones que producen un intercambio válido entre origen y destino */
function g3GluonesIntercambio(origen, destino) {
  return G3_GLUONES.filter(g => g3Intercambio(origen, destino, g) !== null);
}

/* ── Validadores de objetivo por nivel ──────────────────────── */

/* ¿Las partículas vivas forman el conjunto de colores pedido?
   `objetivoColores` es un array ordenable de colorKeys. */
function g3ColoresCoinciden(particulas, objetivoColores) {
  const vivos = particulas.filter(p => p.vivo).map(p => p.colorKey).sort();
  const meta  = objetivoColores.slice().sort();
  return vivos.length === meta.length &&
         vivos.every((c, i) => c === meta[i]);
}

/* ¿Forman un barión blanco (R+G+B, sin anticolores)? */
function g3EsBlancoBaryon(particulas) {
  const vivos = particulas.filter(p => p.vivo);
  if (vivos.length !== 3) return false;
  if (vivos.some(p => p.colorKey.startsWith('a'))) return false;
  return vivos.map(p => p.colorKey).sort().join('') === 'BGR';
}

/* ¿Forman un mesón blanco (color + su anticolor)? */
function g3EsBlancoMeson(particulas) {
  const vivos = particulas.filter(p => p.vivo);
  if (vivos.length !== 2) return false;
  const pares = {R:'aR',G:'aG',B:'aB',aR:'R',aG:'G',aB:'B'};
  return pares[vivos[0].colorKey] === vivos[1].colorKey;
}

/* ¿Existe un quark vivo con exactamente este colorKey? (ayuda para objetivos de 1 quark) */
function g3HayColor(particulas, colorKey) {
  return particulas.some(p => p.vivo && p.colorKey === colorKey);
}

/* Colores de los quarks vivos ORDENADOS de izquierda a derecha (por posición x).
   Permite objetivos donde importa en qué "ranura" queda cada color — algo
   necesario porque el intercambio de gluón CONSERVA el conjunto de colores
   (solo los redistribuye), nunca los crea de la nada. */
function g3ColoresPorPosicion(particulas) {
  return particulas.filter(p => p.vivo)
    .slice()
    .sort((a, b) => a.px - b.px)
    .map(p => p.colorKey);
}

/* ¿Los quarks, de izquierda a derecha, coinciden con `secuencia`? */
function g3SecuenciaCoincide(particulas, secuencia) {
  const act = g3ColoresPorPosicion(particulas);
  return act.length === secuencia.length &&
         act.every((c, i) => c === secuencia[i]);
}

/* ¿Forman EXACTAMENTE un mesón de un color concreto (X + X̄)? */
function g3EsMesonColor(particulas, color) {
  const vivos = particulas.filter(p => p.vivo).map(p => p.colorKey).sort();
  const meta = [color, 'a'+color].sort();
  return vivos.length === 2 && vivos[0] === meta[0] && vivos[1] === meta[1];
}

/* ════════════════════════════════════════════
   DEFINICIÓN DE LOS 5 NIVELES DE LA ETAPA 3
   Cada nivel se divide en RONDAS (desafíos) para que el usuario
   practique con TODOS los gluones. Campos del nivel:
     titulo, intro        → textos del header/panel
     permitirCrear        → habilita el botón "Crear par q-q̄"
     permitirAniquilar    → habilita aniquilación de pares
     especial             → 'fuerza' (nivel demostrativo de la fuerza fuerte)
     tutorial             → pasos guiados (solo nivel 1)
     rondas[]             → lista de desafíos; cada uno:
        quarks       → colores iniciales de ese desafío
        objetivoTxt  → descripción corta de la meta
        check(st)    → {ok, msg} si se cumple
   ════════════════════════════════════════════ */
const G3_NIVELES = [
  /* ── Nivel 1: Tutorial — intercambio de color entre DOS quarks ──
     Importante: un quark NO cambia de color solo. Arrastra DESDE un quark
     HASTA otro para enviar un gluón; ambos intercambian su color. */
  {
    titulo:'Nivel 1: Intercambio de color',
    intro:'Un quark no cambia de color solo: lo INTERCAMBIA con otro quark enviándole un gluón. Arrastra desde un quark hasta el otro, elige el gluón y verás cómo ambos intercambian su color. El total de color se conserva.',
    permitirCrear:false, permitirAniquilar:false,
    tutorial:[
      'Los gluones son los mensajeros de la fuerza fuerte.',
      'Un quark emite un gluón y OTRO quark lo absorbe.',
      'Arrastra de un quark a otro para enviar el gluón.',
      'La carga de color total se conserva: solo se reparte.'
    ],
    rondas:[
      { quarks:['R','G'], objetivoTxt:'Haz que el IZQUIERDO sea verde y el DERECHO rojo',
        check:(st)=> g3SecuenciaCoincide(st.particulas, ['G','R'])
          ? {ok:true,  msg:'¡Intercambiaron color! El rojo y el verde se cambiaron vía el gluón.'}
          : {ok:false, msg:'Arrastra de un quark al otro y elige el gluón para que intercambien.'} },
      { quarks:['B','R'], objetivoTxt:'Haz que el IZQUIERDO sea rojo y el DERECHO azul',
        check:(st)=> g3SecuenciaCoincide(st.particulas, ['R','B'])
          ? {ok:true,  msg:'¡Otro intercambio logrado! El gluón trasladó el color de un quark al otro.'}
          : {ok:false, msg:'Envía un gluón de un quark al otro para intercambiar azul y rojo.'} },
      { quarks:['G','B'], objetivoTxt:'Haz que el IZQUIERDO sea azul y el DERECHO verde',
        check:(st)=> g3SecuenciaCoincide(st.particulas, ['B','G'])
          ? {ok:true,  msg:'¡Perfecto! Ya dominas el intercambio de color entre quarks.'}
          : {ok:false, msg:'Intercambia los colores verde y azul con un gluón.'} },
    ]
  },

  /* ── Nivel 2: Ordenar el barión — redistribuir color con gluones ──
     El conjunto de colores ya es {R,G,B} (barión blanco), pero están en
     el orden equivocado. El intercambio de gluones REDISTRIBUYE el color
     (lo conserva, no lo crea): ordénalos R-G-B de izquierda a derecha. */
  {
    titulo:'Nivel 2: Ordena el barión',
    intro:'Un barión blanco tiene los tres colores R, G y B. Aquí ya están los tres, pero desordenados. Como el gluón solo REPARTE el color entre quarks (no lo crea), usa intercambios para dejarlos en orden R · G · B de izquierda a derecha.',
    permitirCrear:false, permitirAniquilar:false,
    rondas:[
      { quarks:['G','R','B'], objetivoTxt:'Ordena los quarks: R · G · B',
        check:(st)=> g3SecuenciaCoincide(st.particulas, ['R','G','B'])
          ? {ok:true,  msg:'¡Barión ordenado R·G·B! Un solo intercambio bastó.'}
          : {ok:false, msg:'Intercambia colores entre quarks hasta dejar R · G · B.'} },
      { quarks:['B','G','R'], objetivoTxt:'Ordena los quarks: R · G · B',
        check:(st)=> g3SecuenciaCoincide(st.particulas, ['R','G','B'])
          ? {ok:true,  msg:'¡Ordenado! Intercambiaste los extremos.'}
          : {ok:false, msg:'El rojo y el azul están cambiados. Intercámbialos.'} },
      { quarks:['G','B','R'], objetivoTxt:'Ordena los quarks: R · G · B',
        check:(st)=> g3SecuenciaCoincide(st.particulas, ['R','G','B'])
          ? {ok:true,  msg:'¡Resuelto! Hicieron falta dos intercambios encadenados.'}
          : {ok:false, msg:'Necesitas dos intercambios para rotar los tres colores.'} },
      { quarks:['B','R','G'], objetivoTxt:'Ordena los quarks: R · G · B',
        check:(st)=> g3SecuenciaCoincide(st.particulas, ['R','G','B'])
          ? {ok:true,  msg:'¡Barión blanco ordenado! Dominas la redistribución de color.'}
          : {ok:false, msg:'Encadena intercambios para dejar R · G · B.'} },
    ]
  },

  /* ── Nivel 3: Creación de pares + intercambio → mesón ──
     La creación de un par q-q̄ sí "añade" color (energía → materia). Luego
     se usa el intercambio de gluón para ajustar los colores a un mesón. */
  {
    titulo:'Nivel 3: Creación de pares',
    intro:'Para formar un mesón necesitas un quark y un antiquark. Crea un par q-q̄ con energía del vacío (eso sí añade color nuevo) y, si hace falta, usa un gluón entre ellos para ajustar los colores a un mesón blanco (color + su anticolor).',
    permitirCrear:true, permitirAniquilar:true,
    rondas:[
      { quarks:[], objetivoTxt:'Crea un par y forma un mesón blanco',
        check:(st)=> g3EsBlancoMeson(st.particulas)
          ? {ok:true,  msg:'¡Mesón blanco! Un color y su anticolor se cancelan.'}
          : {ok:false, msg:'Pulsa "Crear par q-q̄": el par ya nace como color + anticolor.'} },
      { quarks:[], objetivoTxt:'Forma otro mesón y aníquílalo después',
        check:(st)=> st.huboAniquilacion
          ? {ok:true,  msg:'¡Materia → energía! Aniquilaste el par: el proceso inverso a crearlo.'}
          : {ok:false, msg:'Crea un par y luego usa "Aniquilar par" para que se cancelen.'} },
      { quarks:['B','R','G'], objetivoTxt:'Ordena el barión en R·G·B de izquierda a derecha',
        check:(st)=> {
          const base = st.particulas.filter(p=>p.vivo && !p.colorKey.startsWith('a'));
          const seq = base.slice().sort((a,b)=>a.px-b.px).map(p=>p.colorKey);
          return (base.length===3 && seq.join('')==='RGB')
            ? {ok:true,  msg:'¡Barión blanco ordenado R·G·B! Repartiste el color con gluones.'}
            : {ok:false, msg:'Ordena los tres quarks de color (R·G·B) con intercambios de gluón.'};
        } },
    ]
  },

  /* ── Nivel 4: La fuerza fuerte (FUSIÓN de tubo de flujo + libertad asintótica) ──
     Un solo nivel cuenta la historia completa: cerca la fuerza casi
     desaparece (libertad asintótica); lejos crece hasta romper el tubo
     creando un nuevo par (confinamiento). El quark liberado es atraído
     de vuelta por un "resorte" que lo hace sentir vivo. */
  {
    titulo:'Nivel 4: La fuerza fuerte',
    intro:'Arrastra un quark para acercarlo o alejarlo de su pareja y observa el medidor de fuerza. ¡Cuidado! El tubo de gluones tira de vuelta como un resorte: cuanto más lejos, más fuerte.',
    permitirCrear:false, permitirAniquilar:false,
    especial:'fuerza',
    rondas:[
      { quarks:['R','aR'],
        objetivoTxt:'Acerca los quarks: siente la libertad asintótica (fuerza casi nula)',
        check:(st)=> st.fuerzaMin !== undefined && st.fuerzaMin < 0.08
          ? {ok:true,  msg:'¡A corta distancia la fuerza casi desaparece: libertad asintótica!'}
          : {ok:false, msg:'Junta los quarks hasta que el medidor baje casi a cero.'} },
      { quarks:['G','aG'],
        objetivoTxt:'Ahora sepáralos con fuerza hasta que el tubo se rompa (confinamiento)',
        check:(st)=> st.tuboRoto
          ? {ok:true,  msg:'¡El tubo se rompió creando un nuevo par! Aislar un quark es imposible.'}
          : {ok:false, msg:'Vence el resorte: aleja un quark hasta llenar la barra de energía.'} },
      { quarks:['B','aB'],
        objetivoTxt:'Repite: acerca (fuerza≈0) y luego aleja hasta romper el tubo',
        check:(st)=> (st.fuerzaMin !== undefined && st.fuerzaMin < 0.08 && st.tuboRoto)
          ? {ok:true,  msg:'¡Dominas la fuerza fuerte! Débil de cerca, invencible de lejos.'}
          : {ok:false, msg:'Primero júntalos (fuerza≈0) y después sepáralos hasta romper el tubo.'} },
    ]
  },
];


/* ════════════════════════════════════════════
   MÓDULO GLUONES — ENTRADA Y PANTALLA
   ════════════════════════════════════════════ */
const G3_QR = 34;   /* radio de los quarks */

function iniciar_carga_color_gluones() {
  /* Cerrar la pantalla de arrastre si estaba abierta */
  if (ccRAF) { cancelAnimationFrame(ccRAF); ccRAF = null; }
  if (ccScreen) { ccScreen.remove(); ccScreen = null; ccCanvas = null; ccCtx = null; }
  precargarAssets(() => {
    g3CrearPantalla();
    g3IniciarNivel(0);
  });
}

function g3CrearPantalla() {
  if (g3Screen) { g3Screen.remove(); }

  g3Screen = document.createElement('div');
  g3Screen.id = 'g3-screen';
  g3Screen.className = 'cc-screen g3-screen';
  g3Screen.innerHTML = `
    <div class="cc-header">
      <div class="cc-instruccion-wrap">
        <div class="cc-instruccion-label">EL TEJIDO DE GLUONES</div>
        <div class="cc-instruccion-icon">🌀</div>
        <p class="cc-instruccion" id="g3-instruccion"></p>
      </div>
    </div>

    <div class="cc-body">
      <!-- Panel izquierdo -->
      <div class="cc-panel">
        <div class="cc-panel-card">
          <div class="cc-panel-titulo" id="g3-titulo">—</div>
          <div class="cc-panel-desc"  id="g3-desc">—</div>
        </div>

        <!-- Objetivo + estado -->
        <div class="cc-panel-card">
          <div class="cc-panel-label">Objetivo</div>
          <div class="g3-objetivo" id="g3-objetivo">—</div>
          <div class="g3-rondas-dots" id="g3-rondas-dots"></div>
          <div class="g3-estado" id="g3-estado"></div>
        </div>

        <!-- Acciones de pares (nivel 3) -->
        <div class="cc-panel-card" id="g3-acciones-card" style="display:none">
          <div class="cc-panel-label">Energía del vacío</div>
          <button class="cc-btn g3-btn-accion" id="g3-btn-crear"
                  onclick="g3CrearPar()">✦ Crear par q-q̄</button>
          <button class="cc-btn g3-btn-accion" id="g3-btn-aniquilar"
                  onclick="g3ToggleAniquilar()">✕ Aniquilar par</button>
        </div>

        <!-- Niveles de la etapa 3 -->
        <div class="cc-panel-card" id="g3-niveles-card">
          <div class="cc-panel-label">Niveles de la Etapa 3</div>
          <div class="cc-niveles-dots" id="g3-niveles-dots"></div>
        </div>

        <button class="cc-btn cc-btn-next hidden" id="g3-btn-sig"
                onclick="g3SiguienteDesafio()">Siguiente desafío →</button>
      </div>

      <canvas id="g3-canvas" class="cc-canvas"></canvas>
    </div>

    <!-- Barra de navegación inferior con etapas -->
    <div class="cc-nav-bar">
      <button class="cc-btn cc-btn-volver" onclick="g3Cerrar()">← Volver al ME</button>
      <div class="cc-etapa-dots" id="g3-etapa-dots"></div>
      <div class="cc-progreso-label" id="g3-progreso-label"></div>
    </div>

    <!-- Panel flotante de gluones aplicables -->
    <div class="g3-gluon-pop hidden" id="g3-gluon-pop">
      <div class="g3-pop-title">Aplica un gluón</div>
      <div class="g3-pop-list" id="g3-pop-list"></div>
      <button class="g3-pop-close" onclick="g3CerrarPop()">cancelar</button>
    </div>

    <!-- Feedback overlay (reutiliza estilo cc-fb) -->
    <div class="cc-fb hidden" id="g3-fb">
      <canvas id="g3-fb-canvas" width="100" height="100"></canvas>
      <div class="cc-fb-msg" id="g3-fb-msg"></div>
    </div>
  `;

  document.getElementById('app').appendChild(g3Screen);
  g3Canvas = document.getElementById('g3-canvas');
  g3Ctx    = g3Canvas.getContext('2d');

  g3AjustarCanvas();
  window.addEventListener('resize', g3AjustarCanvas);

  g3Canvas.addEventListener('mousedown',  g3PointerDown);
  g3Canvas.addEventListener('mousemove',  g3PointerMove);
  g3Canvas.addEventListener('mouseup',    g3PointerUp);
  g3Canvas.addEventListener('mouseleave', g3PointerUp);
  g3Canvas.addEventListener('touchstart', e=>{e.preventDefault();g3PointerDown(e);},{passive:false});
  g3Canvas.addEventListener('touchmove',  e=>{e.preventDefault();g3PointerMove(e);},{passive:false});
  g3Canvas.addEventListener('touchend',   g3PointerUp);

  g3RenderEtapaDots();
  g3RenderNivelesDots();
}

function g3AjustarCanvas() {
  if (!g3Canvas) return;
  g3Canvas.width  = g3Canvas.offsetWidth;
  g3Canvas.height = g3Canvas.offsetHeight;
  g3ReposicionarQuarks();
}

/* Coloca los quarks en una fila centrada (si no están siendo arrastrados) */
function g3ReposicionarQuarks() {
  const st = g3State;
  if (!st.particulas || !g3Canvas) return;
  if (st.especial === 'fuerza') {
    /* En el nivel de la fuerza, los dos quarks se colocan a los lados y el
       usuario los arrastra para acercarlos/alejarlos. */
    const vivos = st.particulas.filter(p=>p.vivo);
    vivos.forEach((p,i)=>{
      if (p.drag) return;
      if (p.px === undefined) {
        p.px = g3Canvas.width * (i===0 ? 0.35 : 0.65);
        p.py = g3Canvas.height * 0.5;
      }
    });
    return;
  }
  const vivos = st.particulas.filter(p=>p.vivo);
  const n = vivos.length;
  const gap = Math.min(150, g3Canvas.width / (n + 1));
  const startX = g3Canvas.width/2 - gap*(n-1)/2;
  vivos.forEach((p,i)=>{
    if (p.drag) return;
    p.tx = startX + gap*i;
    p.ty = g3Canvas.height/2;
    if (p.px === undefined) { p.px = p.tx; p.py = p.ty; }
  });
}


/* ════════════════════════════════════════════
   MÓDULO GLUONES — INICIAR NIVEL
   ════════════════════════════════════════════ */
function g3IniciarNivel(idx, ronda) {
  if (g3RAF) { cancelAnimationFrame(g3RAF); g3RAF = null; }

  const nv = G3_NIVELES[idx];
  const rondas = nv.rondas || [nv];        /* compat: si no hay rondas, usa el nivel */
  const ri = Math.max(0, Math.min(ronda || 0, rondas.length - 1));
  const rd = rondas[ri];

  g3State = {
    idx, nv,
    ronda: ri, totalRondas: rondas.length, rd,
    particulas: rd.quarks.map((c, i) => ({
      id: i, colorKey: c, vivo: true,
      px: undefined, py: undefined, tx: 0, ty: 0,
      drag: false, pulso: 0
    })),
    seleccion: null,       /* {origen, destino} del intercambio en curso */
    origen: null,          /* quark desde el que se tiende el haz */
    haz: null,             /* punta del haz que sigue al puntero */
    modoAniquilar: false,  /* clic para aniquilar pares */
    huboAniquilacion: false,
    gluonAnim: null,       /* animación de gluón viajando */
    completado: false,
    especial: nv.especial || null,
    /* estado del nivel de la fuerza fuerte */
    tuboRoto: false, tuboEnergia: 0,
    fuerzaMin: undefined, fuerzaActual: 0,
    flujo: null,
    msgFlash: 0, msgTxt: ''
  };

  /* Paquetes de energía que fluyen por el tubo (solo nivel de la fuerza) */
  if (nv.especial === 'fuerza') {
    g3State.flujo = Array.from({length: 5}, (_, i) => ({ s: i/5, v: 0.004 }));
  }

  /* IDs únicos crecientes para nuevas partículas */
  g3State.nextId = rd.quarks.length;

  document.getElementById('g3-instruccion').textContent = nv.intro;
  document.getElementById('g3-titulo').textContent = nv.titulo;
  document.getElementById('g3-desc').textContent =
    `Desafío ${ri + 1} de ${rondas.length}`;
  document.getElementById('g3-objetivo').textContent = rd.objetivoTxt;

  /* Mostrar/ocultar acciones de pares */
  const accCard = document.getElementById('g3-acciones-card');
  accCard.style.display = nv.permitirCrear ? 'block' : 'none';
  const btnAn = document.getElementById('g3-btn-aniquilar');
  if (btnAn) btnAn.style.display = nv.permitirAniquilar ? 'block' : 'none';

  const btnSig = document.getElementById('g3-btn-sig');
  if (btnSig) btnSig.classList.add('hidden');

  g3CerrarPop();
  g3ReposicionarQuarks();
  g3RenderEtapaDots();
  g3RenderNivelesDots();
  g3RenderRondas();
  g3ActualizarEstado();
  g3Loop();
}

/* ── Dots de etapa (comparten las 3 etapas) ── */
function g3RenderEtapaDots() {
  const cont = document.getElementById('g3-etapa-dots');
  if (!cont) return;
  cont.innerHTML = CC_ETAPAS.map((e, i) => `
    <button class="cc-etapa-dot ${e.gluones ? 'active' : ''}"
            onclick="g3IrEtapa(${i})" title="${e.nombre}">
      ${e.label}
    </button>
  `).join('');
  const lbl = document.getElementById('g3-progreso-label');
  if (lbl) lbl.textContent = 'Etapa 3 · El Tejido de Gluones';
}

/* Navegar a otra etapa desde el módulo de gluones */
function g3IrEtapa(e) {
  const etapa = CC_ETAPAS[e];
  if (etapa.gluones) return;             /* ya estamos aquí */
  /* Volver a la pantalla de arrastre en el primer nivel de esa etapa */
  if (g3RAF) { cancelAnimationFrame(g3RAF); g3RAF = null; }
  window.removeEventListener('resize', g3AjustarCanvas);
  if (g3Screen) { g3Screen.remove(); g3Screen = null; g3Canvas = null; g3Ctx = null; }
  precargarAssets(() => {
    crearPantalla();
    iniciarNivel(etapa.indices[0]);
  });
}

/* ── Dots de nivel dentro de la Etapa 3 ── */
function g3RenderNivelesDots() {
  const cont = document.getElementById('g3-niveles-dots');
  if (!cont) return;
  cont.innerHTML = G3_NIVELES.map((n, i) => `
    <button class="cc-nivel-dot ${i === g3State.idx ? 'active' : ''}"
            title="${n.titulo}" onclick="g3IniciarNivel(${i})">
      ${i + 1}
    </button>
  `).join('');
}

function g3SiguienteNivel() {
  const sig = g3State.idx + 1;
  if (sig < G3_NIVELES.length) g3IniciarNivel(sig);
  else g3Cerrar();
}

function g3Cerrar() {
  if (g3RAF) { cancelAnimationFrame(g3RAF); g3RAF = null; }
  window.removeEventListener('resize', g3AjustarCanvas);
  if (g3Screen) { g3Screen.remove(); g3Screen = null; g3Canvas = null; g3Ctx = null; }
  showScreen('me');
}


/* ════════════════════════════════════════════
   MÓDULO GLUONES — INTERACCIÓN
   ════════════════════════════════════════════ */
function g3PosCanvas(e) {
  const r = g3Canvas.getBoundingClientRect();
  const t = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : e);
  return { x: (t.clientX - r.left), y: (t.clientY - r.top) };
}

function g3QuarkEn(x, y) {
  const vivos = g3State.particulas.filter(p=>p.vivo);
  for (let i = vivos.length - 1; i >= 0; i--) {
    const p = vivos[i];
    if (Math.hypot(x - p.px, y - p.py) <= G3_QR + 4) return p;
  }
  return null;
}

function g3PointerDown(e) {
  if (g3State.completado) return;
  const { x, y } = g3PosCanvas(e);
  const q = g3QuarkEn(x, y);
  if (!q) { g3CerrarPop(); return; }

  /* Nivel de la fuerza: arrastrar quarks libremente para acercar/alejar */
  if (g3State.especial === 'fuerza') {
    q.drag = true;
    g3State.arrastrado = q;
    return;
  }

  /* Modo aniquilar: clic marca el quark para aniquilar con su par */
  if (g3State.modoAniquilar) {
    g3IntentarAniquilar(q);
    return;
  }

  /* Normal: empezar a "tender" un haz de gluón DESDE este quark (origen).
     El intercambio se concreta al soltar sobre otro quark (destino).
     Cerramos primero cualquier panel abierto y LUEGO fijamos el origen. */
  g3CerrarPop();
  g3State.origen = q;
  g3State.haz = { x, y };     /* punta del haz que sigue al puntero */
}

function g3PointerMove(e) {
  const { x, y } = g3PosCanvas(e);

  /* Arrastre libre en niveles demostrativos */
  if (g3State.arrastrado) {
    const q = g3State.arrastrado;
    q.px = Math.max(G3_QR, Math.min(g3Canvas.width  - G3_QR, x));
    q.py = Math.max(G3_QR, Math.min(g3Canvas.height - G3_QR, y));
    return;
  }

  /* Tender el haz de gluón desde el quark origen hacia el puntero */
  if (g3State.origen) {
    g3State.haz = { x, y };
  }
}

function g3PointerUp(e) {
  /* Terminar arrastre libre (niveles demostrativos) */
  if (g3State.arrastrado) {
    g3State.arrastrado.drag = false;
    g3State.arrastrado = null;
    return;
  }

  /* Terminar el tendido del haz: ¿soltó sobre otro quark? */
  if (g3State.origen) {
    const { x, y } = g3PosCanvas(e);
    const destino = g3QuarkEn(x, y);
    const origen  = g3State.origen;
    g3State.haz = null;

    if (destino && destino !== origen) {
      /* Abrir panel de intercambio origen → destino */
      g3State.seleccion = { origen, destino };
      g3AbrirPopIntercambio(origen, destino);
    } else {
      /* Soltó en el vacío o sobre el mismo quark: cancelar */
      g3State.origen = null;
    }
  }
}

/* ── Panel flotante del INTERCAMBIO origen → destino ──
   Se muestran los 6 gluones y TODOS son seleccionables. Si el gluón no
   produce un intercambio válido entre este par, al tocarlo aparece una
   advertencia explicando POR QUÉ no aplica (en vez de bloquearlo). */
function g3AbrirPopIntercambio(origen, destino) {
  const pop  = document.getElementById('g3-gluon-pop');
  const list = document.getElementById('g3-pop-list');
  const titulo = pop.querySelector('.g3-pop-title');
  if (titulo) {
    const co = QCOLOR[origen.colorKey], cd = QCOLOR[destino.colorKey];
    titulo.innerHTML = `Intercambio
      <b style="color:${co.fill}">${co.label}</b> ↔
      <b style="color:${cd.fill}">${cd.label}</b>`;
  }

  /* TODOS los gluones se muestran IGUAL (sin pistas de cuál es el correcto):
     solo su etiqueta. El usuario elige el que crea correcto; verá la
     animación y, si estaba mal, aparecerá el error explicando por qué. */
  list.innerHTML = G3_GLUONES.map(g => `
    <button class="g3-gluon-chip" onclick="g3IntentarIntercambio('${g.id}')">
      <span class="g3-chip-label">${g.label}</span>
    </button>`).join('');

  pop.classList.remove('hidden');
}

/* Explica por qué el gluón elegido NO sirve para el par origen→destino.
   Un gluón C1·C̄2 solo deja que un quark de color C1 (origen) envíe color
   a un quark de color C2 (destino). */
function g3MotivoInvalido(origen, destino, g) {
  const o = origen.colorKey, d = destino.colorKey;
  const nombreO = g3NombreColor(o), nombreD = g3NombreColor(d);
  const necesitaO = g3NombreColor(g.c1), necesitaD = g3NombreColor(g.c2);
  if (o === d) {
    return `Ambos quarks son del mismo color (${nombreO}). Un gluón intercambia colores DISTINTOS entre dos quarks.`;
  }
  return `El gluón ${g.label} solo transfiere color de un quark ${necesitaO} a uno ${necesitaD}. ` +
         `Aquí el origen es ${nombreO} y el destino ${nombreD}: las etiquetas no coinciden, por eso no hay intercambio.`;
}

function g3CerrarPop() {
  const pop = document.getElementById('g3-gluon-pop');
  if (pop) pop.classList.add('hidden');
  g3State.seleccion = null;
  g3State.origen = null;
  g3State.haz = null;
}

/* ── Intentar el intercambio con el gluón elegido ──
   El usuario puede elegir CUALQUIER gluón. En todos los casos se cierra el
   panel y la onda viaja del origen al destino. En el IMPACTO:
     · Si el gluón es válido → ambos quarks intercambian su color.
     · Si no lo es → nada cambia y aparece la advertencia explicando por qué.
   Así el usuario experimenta la animación aunque se equivoque. */
function g3IntentarIntercambio(gluonId) {
  const sel = g3State.seleccion;
  if (!sel || !sel.origen || !sel.destino) return;
  const g = G3_GLUONES.find(gg => gg.id === gluonId);
  if (!g) return;

  const { origen, destino } = sel;
  const x = g3Intercambio(origen, destino, g);   /* null si no es válido */

  /* La ONDA-gluón viaja del origen al destino en ambos casos. El resultado
     (válido o no) se resuelve al impactar, dentro de g3Actualizar. */
  /* La onda lleva DOS colores bien distintos: el color (c1) y el otro color
     base del gluón (c2). Usamos los colores base R/G/B (no los anticolores,
     que son tonos cercanos y se verían casi iguales) para que el carácter
     bicolor del gluón se aprecie con claridad. */
  g3State.gluonAnim = {
    origenP: origen, destinoP: destino,
    label: g.label, t: 0,
    colorA: QCOLOR[g.c1].fill,
    colorB: QCOLOR[g.c2].fill,
    impacto: 0,
    valido: !!x,
    resultado: x,                                   /* colores nuevos si válido */
    motivo: x ? null : g3MotivoInvalido(origen, destino, g)
  };

  /* Cerramos el panel pero conservamos el resaltado del par durante la onda */
  const pop = document.getElementById('g3-gluon-pop');
  if (pop) pop.classList.add('hidden');
  g3State.seleccion = { origen, destino };   /* mantener para el highlight */
  g3State.haz = null;
}

/* ── Crear par quark-antiquark (nivel 3) ── */
function g3CrearPar() {
  if (g3State.completado) return;
  if (g3State.particulas.filter(p=>p.vivo).length >= 6) {
    g3Flash('Demasiadas partículas. Aniquila algún par primero.');
    return;
  }
  /* Crear un par de color aleatorio complementario (quark X + antiquark X̄) */
  const base = ['R','G','B'][Math.floor(Math.random()*3)];
  const cx = g3Canvas.width/2, cy = g3Canvas.height/2;
  g3State.particulas.push({
    id: g3State.nextId++, colorKey: base, vivo: true,
    px: cx - 50, py: cy + 70, tx: 0, ty: 0, drag:false, pulso:1
  });
  g3State.particulas.push({
    id: g3State.nextId++, colorKey: 'a'+base, vivo: true,
    px: cx + 50, py: cy + 70, tx: 0, ty: 0, drag:false, pulso:1
  });
  g3ReposicionarQuarks();
  g3Flash(`Par creado: ${g3NombreColor(base)} + ${g3NombreColor('a'+base)}. ¡Energía → materia!`);
  g3ActualizarEstado();
}

/* ── Alternar modo aniquilar ── */
function g3ToggleAniquilar() {
  g3State.modoAniquilar = !g3State.modoAniquilar;
  const btn = document.getElementById('g3-btn-aniquilar');
  if (btn) btn.classList.toggle('activo', g3State.modoAniquilar);
  g3Flash(g3State.modoAniquilar
    ? 'Modo aniquilar: toca un quark para cancelarlo con su antipartícula.'
    : 'Modo aniquilar desactivado.');
}

/* Aniquilar el quark elegido con un antiquark de color complementario */
function g3IntentarAniquilar(q) {
  const pares = {R:'aR',G:'aG',B:'aB',aR:'R',aG:'G',aB:'B'};
  const comp = pares[q.colorKey];
  const otro = g3State.particulas.find(p => p.vivo && p !== q && p.colorKey === comp);
  if (!otro) {
    g3Flash('No hay una antipartícula complementaria para aniquilar este quark.');
    return;
  }
  q.vivo = false; otro.vivo = false;
  g3State.modoAniquilar = false;
  g3State.huboAniquilacion = true;   /* para objetivos que piden aniquilar */
  const btn = document.getElementById('g3-btn-aniquilar');
  if (btn) btn.classList.remove('activo');
  g3Flash('Par aniquilado: materia → energía.');
  g3ReposicionarQuarks();
  g3ActualizarEstado();
}

/* ── Comprobar el objetivo del nivel ── */
function g3ActualizarEstado() {
  const st = g3State;
  const r = st.rd.check(st);
  const estadoEl = document.getElementById('g3-estado');
  if (estadoEl) {
    estadoEl.textContent = r.msg;
    estadoEl.className = 'g3-estado ' + (r.ok ? 'ok' : 'pend');
  }
  if (r.ok && !st.completado) {
    st.completado = true;
    g3Mostrar(true, r.msg);
    g3RenderRondas();
    const btn = document.getElementById('g3-btn-sig');
    if (btn) {
      const hayMasRondas = st.ronda < st.totalRondas - 1;
      const hayMasNiveles = st.idx < G3_NIVELES.length - 1;
      btn.textContent = hayMasRondas ? 'Siguiente desafío →'
                       : hayMasNiveles ? 'Siguiente nivel →'
                       : 'Terminar Etapa 3 ✓';
      btn.classList.remove('hidden');
    }
  }
}

/* Avanzar: siguiente ronda si quedan, si no, siguiente nivel */
function g3SiguienteDesafio() {
  const st = g3State;
  if (st.ronda < st.totalRondas - 1) {
    g3IniciarNivel(st.idx, st.ronda + 1);
  } else if (st.idx < G3_NIVELES.length - 1) {
    g3IniciarNivel(st.idx + 1, 0);
  } else {
    g3Cerrar();
  }
}

/* Puntos de progreso de los desafíos del nivel actual */
function g3RenderRondas() {
  const cont = document.getElementById('g3-rondas-dots');
  if (!cont) return;
  const st = g3State;
  cont.innerHTML = Array.from({length: st.totalRondas}, (_, i) => {
    let cls = 'g3-ronda-dot';
    if (i < st.ronda) cls += ' hecho';
    else if (i === st.ronda) cls += (st.completado ? ' hecho' : ' actual');
    return `<span class="${cls}"></span>`;
  }).join('');
}

/* Mensaje flash efímero sobre el canvas */
function g3Flash(txt) {
  g3State.msgTxt = txt;
  g3State.msgFlash = 1;
}


/* ════════════════════════════════════════════
   MÓDULO GLUONES — LOOP, FÍSICA Y RENDER
   ════════════════════════════════════════════ */
function g3Loop() {
  g3RAF = requestAnimationFrame(g3Loop);
  g3Actualizar();
  g3Dibujar();
}

function g3Actualizar() {
  const st = g3State;

  /* Suavizar posiciones hacia su objetivo (en niveles de intercambio).
     En el nivel de la fuerza las posiciones las gobierna g3FisicaFuerza. */
  if (st.especial !== 'fuerza') {
    st.particulas.forEach(p => {
      if (!p.vivo || p.drag) return;
      p.px += (p.tx - p.px) * 0.18;
      p.py += (p.ty - p.py) * 0.18;
    });
  }

  /* Pulso de transformación */
  st.particulas.forEach(p => { if (p.pulso > 0) p.pulso = Math.max(0, p.pulso - 0.04); });

  /* Animación de la ONDA-gluón viajando del quark ORIGEN al DESTINO */
  if (st.gluonAnim) {
    const a = st.gluonAnim;
    a.t += 0.011;
    /* Fase de llegada (t≈0.78): la onda impacta el destino. Aquí se resuelve
       el resultado: intercambio (válido) o advertencia (no válido). */
    if (a.t >= 0.78 && !a.impacto) {
      a.impacto = 1;
      if (a.valido && a.resultado) {
        /* Intercambio válido: ambos quarks cambian su color ahora */
        if (a.origenP)  a.origenP.colorKey  = a.resultado.nuevoOrigen;
        if (a.destinoP) a.destinoP.colorKey = a.resultado.nuevoDestino;
        [a.origenP, a.destinoP].forEach(q => {
          if (!q) return;
          q.pulso  = 1;    /* pulso/brillo del cambio */
          q.ripple = 1;    /* onda de impacto */
        });
        g3Flash(`Gluón ${a.label}: los dos quarks intercambian su color.`);
        /* Fin del intercambio: limpiar selección y validar objetivo */
        st.seleccion = null;
        st.origen = null;
        g3ActualizarEstado();
      } else {
        /* Gluón incorrecto: no cambia nada; rebote + advertencia */
        if (a.destinoP) a.destinoP.ripple = 1;
        g3Flash('⚠ ' + a.motivo);
        g3Mostrar(false, a.motivo);
        st.seleccion = null;
        st.origen = null;
      }
    }
    if (a.t >= 1.1) st.gluonAnim = null;
  }

  /* Onda de impacto (ripple) en los quarks que acaban de cambiar */
  st.particulas.forEach(p => {
    if (p.ripple > 0) p.ripple = Math.max(0, p.ripple - 0.02);
  });

  /* Flash de mensaje */
  if (st.msgFlash > 0) st.msgFlash = Math.max(0, st.msgFlash - 0.008);

  /* Física del nivel unificado de la fuerza fuerte */
  if (st.especial === 'fuerza') g3FisicaFuerza();

  /* Partículas de energía que fluyen por el tubo (más rápido con tensión) */
  if (st.flujo && !st.tuboRoto) {
    const vel = 0.004 + (st.fuerzaActual || 0) * 0.02;
    st.flujo.forEach(fp => { fp.s += vel; if (fp.s > 1) fp.s -= 1; });
  }
}

/* ── Nivel 4 unificado: la FUERZA FUERTE ──
   Un modelo cualitativo que combina:
     · Libertad asintótica: cerca, la fuerza (y la tensión) ≈ 0.
     · Confinamiento: lejos, la fuerza crece; al estirar demasiado el tubo
       acumula energía hasta romperse creando un par q-q̄.
   Además, un "resorte" tira del quark soltado de vuelta hacia su pareja,
   con intensidad proporcional a la distancia (dinamismo). */
function g3FisicaFuerza() {
  const st = g3State;
  const vivos = st.particulas.filter(p=>p.vivo);
  if (vivos.length < 2) return;
  const [a, b] = vivos;
  const d  = Math.hypot(a.px - b.px, a.py - b.py);
  const dmin = G3_QR*2.2, dmax = g3Canvas.width * 0.58;

  /* Fuerza/tensión normalizada 0..1 que CRECE con la distancia */
  const f = Math.min(1, Math.max(0, (d - dmin) / (dmax - dmin)));
  st.fuerzaActual = f;
  st.fuerzaMin = st.fuerzaMin === undefined ? f : Math.min(st.fuerzaMin, f);
  st.tuboEnergia = f;   /* la barra de energía refleja la tensión */

  /* Resorte con LONGITUD DE REPOSO: el tubo tiende a una separación de
     equilibrio (reposo). Si los quarks están MÁS lejos que el reposo, los
     atrae; si están MÁS cerca, los separa un poco (para que no colapsen ni
     se queden pegados en fuerza 0 sin que el usuario haga nada).
     El tirón es SUAVE: el usuario debe arrastrar para acercarlos o alejarlos. */
  if (!st.tuboRoto) {
    const reposo = dmin + (dmax - dmin) * 0.32;   /* separación de equilibrio */
    const dir = d - reposo;                        /* >0: muy lejos; <0: muy cerca */
    /* rigidez suave; crece un poco con la distancia pero mucho menos que antes */
    const k = 0.012 + f * 0.012;
    const dxN = (b.px - a.px) / (d || 1), dyN = (b.py - a.py) / (d || 1);
    const paso = dir * k;                          /* desplazamiento hacia el reposo */
    [[a, 1], [b, -1]].forEach(([p, signo]) => {
      if (p.drag) return;                          /* el que arrastra no se mueve solo */
      p.px += dxN * paso * signo;
      p.py += dyN * paso * signo;
    });
  }

  /* Confinamiento: si la tensión llega al máximo, el tubo se rompe */
  if (f >= 1 && !st.tuboRoto) {
    st.tuboRoto = true;
    const mx = (a.px + b.px)/2, my = (a.py + b.py)/2;
    /* El nuevo par nace del mismo "sabor" de color que la pareja original */
    const base = a.colorKey.startsWith('a') ? b.colorKey : a.colorKey;
    const anti = 'a'+base;
    st.particulas.push({ id: st.nextId++, colorKey:anti, vivo:true, px:mx-30, py:my, drag:false, pulso:1, ripple:1 });
    st.particulas.push({ id: st.nextId++, colorKey:base, vivo:true, px:mx+30, py:my, drag:false, pulso:1, ripple:1 });
    g3Flash('¡La energía del tubo creó un nuevo par q-q̄! Los quarks jamás quedan solos.');
    g3ActualizarEstado();
  }

  if (!st.completado && f < 0.08) g3ActualizarEstado();
}

function g3Dibujar() {
  const ctx = g3Ctx, st = g3State;
  const W = g3Canvas.width, H = g3Canvas.height;

  /* Fondo oscuro cuadriculado (estética común a todos los minijuegos) */
  mjGridBackground(ctx, W, H);

  const vivos = st.particulas.filter(p=>p.vivo);

  /* Tubo de flujo / enlace entre los dos quarks del nivel de la fuerza */
  if (st.especial === 'fuerza' && vivos.length >= 2 && !st.tuboRoto) {
    g3DibujarEnlace(vivos[0], vivos[1]);
  }

  /* Haz de gluón que el usuario está "tendiendo" desde el quark origen */
  if (st.origen && st.haz) {
    g3DibujarHaz(st.origen, st.haz);
  }

  /* Gluón viajando (animación del intercambio) */
  if (st.gluonAnim) {
    g3DibujarOndaGluon(st.gluonAnim);
  }

  /* Quarks */
  vivos.forEach(p => g3DibujarQuark(p));

  /* HUD del nivel de la fuerza fuerte (medidor combinado) */
  if (st.especial === 'fuerza') g3HUDFuerza();

  /* Mensaje flash */
  if (st.msgFlash > 0 && st.msgTxt) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, st.msgFlash * 2);
    ctx.font = '600 14px "Exo 2",sans-serif';
    ctx.textAlign = 'center';
    const tw = ctx.measureText(st.msgTxt).width;
    ctx.fillStyle = 'rgba(5,15,40,0.85)';
    ctx.fillRect(W/2 - tw/2 - 14, H - 46, tw + 28, 28);
    ctx.strokeStyle = 'rgba(0,180,255,0.6)';
    ctx.strokeRect(W/2 - tw/2 - 14, H - 46, tw + 28, 28);
    ctx.fillStyle = '#d0eeff';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.msgTxt, W/2, H - 32);
    ctx.restore();
  }
}

function g3DibujarQuark(p) {
  const ctx = g3Ctx;
  /* El color del quark cambia solo en el impacto de la onda (ver g3Actualizar),
     así que aquí basta con su colorKey actual. */
  const claveRender = p.colorKey;
  const cfg = QCOLOR[claveRender];
  /* Resaltar el quark origen mientras se tiende el haz, y el destino en el panel */
  const seleccionado = (g3State.origen === p) ||
                       (g3State.seleccion && (g3State.seleccion.origen === p || g3State.seleccion.destino === p));
  /* Radio base + crecimiento momentáneo al transformarse */
  const r = G3_QR + p.pulso * 6;

  /* ── 0. Onda de impacto del gluón (ripple expansivo) ── */
  if (p.ripple > 0) {
    ctx.save();
    const rr = r + (1 - p.ripple) * 46;
    ctx.beginPath();
    ctx.arc(p.px, p.py, rr, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(255,255,255,${p.ripple * 0.6})`;
    ctx.lineWidth = 3 * p.ripple + 1;
    ctx.stroke();
    ctx.restore();
  }

  /* ── 1. Círculo con glow (mismo estilo que Etapas 1 y 2) ── */
  ctx.save();
  ctx.shadowColor = cfg.fill;
  ctx.shadowBlur  = (p.drag || seleccionado || p.pulso > 0) ? 20 : 10;
  ctx.beginPath();
  ctx.arc(p.px, p.py, r, 0, Math.PI*2);
  const g = ctx.createRadialGradient(p.px - r*.28, p.py - r*.28, 0, p.px, p.py, r);
  g.addColorStop(0,   lightenHex(cfg.fill, 30));
  g.addColorStop(0.6, cfg.fill);
  g.addColorStop(1,   darkenHex(cfg.fill, 40));
  ctx.fillStyle   = g;
  ctx.fill();
  /* Borde: fino oscuro para quarks; punteado claro para antiquarks */
  if (cfg.anti) {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth   = 2;
    ctx.setLineDash([5, 4]);
  } else {
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth   = 1.8;
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  /* Anillo de selección (resalte al tocar) */
  if (seleccionado) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.px, p.py, r + 6, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /* ── 2. Etiqueta: blanca con outline negro (sin shadow) ── */
  ctx.save();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.font        = 'bold 20px "Orbitron",monospace';
  ctx.lineWidth   = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeText(cfg.label, p.px, p.py);
  ctx.fillStyle   = '#ffffff';
  ctx.fillText(cfg.label, p.px, p.py);

  /* Pista: arrastrar de un quark a otro (solo niveles de intercambio) */
  if (g3State.especial === null && !g3State.completado &&
      !g3State.origen && !g3State.gluonAnim) {
    ctx.font      = '10px "Exo 2",sans-serif';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeText('arrastra →', p.px, p.py + r + 14);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('arrastra →', p.px, p.py + r + 14);
  }
  ctx.restore();
}

/* ── Onda-gluón bicolor viajando de QUARK a QUARK ────────────
   Se dibuja como dos hebras sinusoidales entrelazadas (el color y el
   anticolor que transporta el gluón) que avanzan desde el quark ORIGEN
   hasta el quark DESTINO. Al impactar, un breve destello en el destino. */
function g3DibujarOndaGluon(a) {
  const ctx = g3Ctx;
  /* Posiciones vivas de origen y destino (pueden moverse levemente) */
  const sx = a.origenP ? a.origenP.px : 0;
  const sy = a.origenP ? a.origenP.py : 0;
  const tx = a.destinoP ? a.destinoP.px : sx;
  const ty = a.destinoP ? a.destinoP.py : sy;

  /* Progreso de avance de la "cabeza" de la onda (0→1 hasta el impacto en 0.78) */
  const avance = Math.min(1, a.t / 0.78);
  const hx = sx + (tx - sx) * avance;
  const hy = sy + (ty - sy) * avance;

  /* Vector dirección y perpendicular */
  const dx = tx - sx, dy = ty - sy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const nx = -uy, ny = ux;

  const fase = Date.now() / 90;
  const amp  = 11;
  const ciclos = Math.max(3, len / 42);
  const SEG = 60;
  const Ltrazo = len * avance;

  if (a.impacto) {
    /* Tras el impacto: destello breve que se desvanece en el destino */
    const f = Math.max(0, 1 - (a.t - 0.78) / 0.32);
    ctx.save();
    ctx.globalAlpha = f;
    ctx.beginPath();
    ctx.arc(tx, ty, G3_QR + 10 + (1 - f) * 20, 0, Math.PI*2);
    const gg = ctx.createRadialGradient(tx, ty, G3_QR, tx, ty, G3_QR + 30);
    gg.addColorStop(0, a.colorA);
    gg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gg;
    ctx.fill();
    ctx.restore();
    return;
  }

  /* Dibuja una hebra sinusoidal con un desfase dado */
  function hebra(desfase, color, grosor) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = grosor;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i <= SEG; i++) {
      const s = (i / SEG) * Ltrazo;
      const bx = sx + ux * s;
      const by = sy + uy * s;
      const ang = (s / len) * ciclos * Math.PI * 2 - fase + desfase;
      const off = Math.sin(ang) * amp;
      const x = bx + nx * off;
      const y = by + ny * off;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* Dos hebras entrelazadas con los DOS colores del gluón (bien distintos) */
  hebra(0,         a.colorA, 3.5);
  hebra(Math.PI,   a.colorB, 3.5);

  /* Cabeza luminosa de la onda */
  ctx.save();
  ctx.beginPath();
  ctx.arc(hx, hy, 6, 0, Math.PI*2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = a.colorA;
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.restore();

  /* Etiqueta del gluón, siguiendo la cabeza de la onda */
  ctx.save();
  ctx.font = 'bold 11px "Orbitron",monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.strokeText(a.label, hx, hy - 16);
  ctx.fillStyle = '#fff';
  ctx.fillText(a.label, hx, hy - 16);
  ctx.restore();
}

/* ── Haz de gluón que el usuario tiende desde el quark origen ──
   Línea ondulada desde el origen hasta el puntero. Si el puntero está
   sobre otro quark, se resalta como posible destino del intercambio. */
function g3DibujarHaz(origen, haz) {
  const ctx = g3Ctx;
  const sx = origen.px, sy = origen.py;
  const ex = haz.x, ey = haz.y;
  const dx = ex - sx, dy = ey - sy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx/len, uy = dy/len, nx = -uy, ny = ux;

  const fase = Date.now() / 110;
  const SEG = Math.max(10, Math.floor(len / 8));
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(180,140,255,0.9)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  for (let i = 0; i <= SEG; i++) {
    const s = (i/SEG) * len;
    const off = Math.sin((s/26) * Math.PI*2 - fase) * 7;
    const x = sx + ux*s + nx*off;
    const y = sy + uy*s + ny*off;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();

  /* Resaltar el quark bajo el puntero (destino candidato) */
  const cand = g3QuarkEn(ex, ey);
  if (cand && cand !== origen) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cand.px, cand.py, G3_QR + 8, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(0,229,255,0.9)';
    ctx.lineWidth = 3;
    ctx.setLineDash([4,4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

/* Tubo de flujo animado entre los dos quarks.
   El color va de VERDE (tensión baja = fuerza casi nula) a ROJO (a punto de
   romperse). Vibra y lleva "paquetes" de energía fluyendo que se intensifican
   con la tensión. */
function g3DibujarEnlace(a, b) {
  const ctx = g3Ctx, st = g3State;
  const tension = st.fuerzaActual || 0;

  const dx = b.px - a.px, dy = b.py - a.py;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx/len, uy = dy/len, nx = -uy, ny = ux;

  /* Color según tensión: verde → amarillo → rojo */
  const rC = Math.round(60 + tension*195);
  const gC = Math.round(230 - tension*210);
  const bC = Math.round(90 - tension*60);
  const col = `rgba(${rC},${gC},${Math.max(0,bC)},0.9)`;

  /* Vibración creciente con la tensión */
  const t = Date.now()/120;
  const vib = tension * 10;
  const SEG = 48;

  ctx.save();
  ctx.shadowColor = col;
  ctx.shadowBlur = 6 + tension*16;
  ctx.strokeStyle = col;
  ctx.lineWidth = 4 + tension * 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= SEG; i++) {
    const s = i/SEG;
    const bx = a.px + ux*len*s;
    const by = a.py + uy*len*s;
    /* curvatura base + vibración más intensa en el centro */
    const envol = Math.sin(s*Math.PI);                 /* 0 en extremos, 1 en medio */
    const off = Math.sin(s*Math.PI*3 - t) * vib * envol;
    const x = bx + nx*off, y = by + ny*off;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();

  /* Paquetes de energía fluyendo por el tubo (más y más rápidos con tensión) */
  if (st.flujo) {
    ctx.save();
    st.flujo.forEach(fp => {
      const s = fp.s;
      const envol = Math.sin(s*Math.PI);
      const off = Math.sin(s*Math.PI*3 - t) * vib * envol;
      const x = a.px + ux*len*s + nx*off;
      const y = a.py + uy*len*s + ny*off;
      ctx.beginPath();
      ctx.arc(x, y, 2 + tension*3, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${0.3 + tension*0.6})`;
      ctx.shadowColor = col; ctx.shadowBlur = 8;
      ctx.fill();
    });
    ctx.restore();
  }
}

/* HUD unificado: medidor de la fuerza fuerte.
   Barra con zonas etiquetadas: a la izquierda "libre" (fuerza≈0, cerca),
   a la derecha "¡se rompe!" (confinamiento, lejos). */
function g3HUDFuerza() {
  const ctx = g3Ctx, st = g3State;
  const W = g3Canvas.width;
  const bw = 260, bh = 16, bx = W/2 - bw/2, by = 26;
  const f = st.fuerzaActual || 0;

  ctx.save();
  ctx.font = '11px "Exo 2",sans-serif'; ctx.textAlign='center';
  ctx.fillStyle='#80d8ff';
  ctx.fillText(`Fuerza fuerte: ${(f*100).toFixed(0)}%`, W/2, by - 8);

  /* Fondo de la barra con degradado verde→amarillo→rojo */
  const g = ctx.createLinearGradient(bx, 0, bx+bw, 0);
  g.addColorStop(0,   'rgba(0,230,118,0.25)');
  g.addColorStop(0.5, 'rgba(255,200,0,0.25)');
  g.addColorStop(1,   'rgba(255,60,60,0.25)');
  ctx.fillStyle = g;
  ctx.fillRect(bx, by, bw, bh);

  /* Relleno según la fuerza actual (color según zona) */
  const rC = Math.round(60 + f*195), gC = Math.round(230 - f*210), bC = Math.round(90 - f*60);
  ctx.fillStyle = `rgb(${rC},${gC},${Math.max(0,bC)})`;
  ctx.fillRect(bx, by, bw * f, bh);
  ctx.strokeStyle = 'rgba(0,180,255,0.6)'; ctx.strokeRect(bx, by, bw, bh);

  /* Marca del umbral "casi libre" (8%) */
  const xUmbral = bx + bw * 0.08;
  ctx.strokeStyle = 'rgba(0,230,118,0.9)';
  ctx.setLineDash([3,3]);
  ctx.beginPath(); ctx.moveTo(xUmbral, by-3); ctx.lineTo(xUmbral, by+bh+3); ctx.stroke();
  ctx.setLineDash([]);

  /* Etiquetas de los extremos */
  ctx.font = '9px "Exo 2",sans-serif';
  ctx.fillStyle = '#69ffa6'; ctx.textAlign = 'left';
  ctx.fillText('casi libre (cerca)', bx, by + bh + 12);
  ctx.fillStyle = '#ff8a80'; ctx.textAlign = 'right';
  ctx.fillText('¡se rompe! (lejos)', bx + bw, by + bh + 12);
  ctx.restore();
}

/* ── Feedback (reutiliza el estilo cc-fb, con ids g3-) ── */
function g3Mostrar(ok, msg) {
  const el = document.getElementById('g3-fb');
  const cv = document.getElementById('g3-fb-canvas');
  const ms = document.getElementById('g3-fb-msg');
  if (!el) return;
  ms.textContent = msg;
  el.className = `cc-fb ${ok ? 'cc-fb-ok' : 'cc-fb-err'}`;

  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, 100, 100);
  const img = CC_ASSETS[ok ? 'bien' : 'advertencia'];
  if (img) {
    ctx.drawImage(img, 0, 0, 100, 100);
    /* Quitar el fondo negro del asset (igual que en mostrarFeedback) */
    const id = ctx.getImageData(0, 0, 100, 100); const d = id.data;
    for (let i = 0; i < d.length; i += 4) if ((d[i]+d[i+1]+d[i+2])/3 < 40) d[i+3] = 0;
    ctx.putImageData(id, 0, 0);
  } else {
    ctx.font = '48px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(ok ? '✅' : '⚠️', 50, 64);
  }

  clearTimeout(g3State.fbTimeout);
  g3State.fbTimeout = setTimeout(() => el.classList.add('hidden'), 2600);
}
