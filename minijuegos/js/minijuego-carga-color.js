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
   9 — Modo libre: cualquier hadrón válido
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
    id:9, speedBase:1.15,
    titulo:'Nivel 9: Modo libre',
    intro:'¡Todo lo aprendido! Aparecen quarks de varias generaciones. Forma CUALQUIER hadrón válido: protón, neutrón, pión, kaón o mesón D. El juego los reconoce todos.',
    objetivo:10, descripcionObj:'combinaciones (puntuado)',
    tipo:'free', doble:false, puntuado:true,
    spawner:()=>spawnFree(),
    validator: esHadronValido
  }
];

/* ════════════════════════════════════════════
   ENTRADA AL JUEGO
   ════════════════════════════════════════════ */
function iniciar_carga_color() {
  precargarAssets(() => {
    crearPantalla();
    iniciarNivel(0);
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
      <p class="cc-instruccion" id="cc-instruccion"></p>
    </div>
    <div class="cc-body">
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
        <button class="cc-btn" onclick="mostrarNiveles()">Niveles</button>
        <button class="cc-btn cc-btn-close" onclick="cerrarCC()">← Volver al ME</button>
      </div>
      <canvas id="cc-canvas" class="cc-canvas"></canvas>
    </div>

    <!-- Feedback overlay -->
    <div class="cc-fb hidden" id="cc-fb">
      <canvas id="cc-fb-canvas" width="100" height="100"></canvas>
      <div class="cc-fb-msg" id="cc-fb-msg"></div>
    </div>

    <!-- Selector de niveles -->
    <div class="cc-nv-overlay hidden" id="cc-nv-overlay">
      <div class="cc-nv-wrap">
        <div class="cc-nv-titulo retro-text">NIVELES</div>
        <div class="cc-nv-grid" id="cc-nv-grid"></div>
        <button class="cc-btn" onclick="ocultarNiveles()">Cerrar</button>
      </div>
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

  document.getElementById('cc-instruccion').textContent = nv.intro;
  document.getElementById('cc-nivel-titulo').textContent = nv.titulo;
  document.getElementById('cc-nivel-desc').textContent   = `Meta: ${nv.objetivo} ${nv.descripcionObj}`;
  document.getElementById('cc-prog-extra').style.display = nv.doble ? 'block' : 'none';
  actualizarUI();

  for (let i = 0; i < 10; i++) nv.spawner();
  renderNivelesGrid();
  ccLoop();
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

function esHadronValido(g) {
  for (const fn of [esProton,esNeutron,esPion,esMesonGen2,esMesonMixto,esBaryonRGB,esMesonSimple]) {
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
  ctx.clearRect(0,0,W,H);

  /* Fondo degradado */
  const bg=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.75);
  bg.addColorStop(0,'rgba(22,8,55,1)');
  bg.addColorStop(1,'rgba(4,2,16,1)');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

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
    const minReq = ccState.nv.tipo.startsWith('meson') || ccState.nv.tipo==='pions' ? 2 : 3;
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
    const minReq = nv.tipo.startsWith('meson')||nv.tipo==='pions' ? 2 : 3;
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

  if (nv.puntuado) {
    setTimeout(() => mostrarResultadosFree(), 500);
  } else {
    setTimeout(()=>{
      const sig=st.idx+1;
      if (sig<CC_NIVELES.length) {
        if (confirm(`¡Nivel ${nv.id} completado! ¿Pasar al nivel ${sig+1}?`)) iniciarNivel(sig);
      } else {
        if (confirm('¡Has completado TODOS los niveles! ¿Jugar Modo Libre?'))
          iniciarNivel(CC_NIVELES.length-1);
      }
    },500);
  }
}

/* ── Pantalla de resultados del Modo Libre ── */
function mostrarResultadosFree() {
  const st  = ccState;
  const pts = st.puntaje || 0;
  const logro = getLogro(pts);

  /* Guardar en localStorage hasta tener BD */
  const hist = JSON.parse(localStorage.getItem('cc_historial') || '[]');
  const entrada = {
    fecha: new Date().toLocaleDateString('es-MX'),
    puntaje: pts, combos: st.combos||0, errores: st.errores||0,
    logro: logro.nombre
  };
  hist.unshift(entrada);
  if (hist.length > 10) hist.pop();
  localStorage.setItem('cc_historial', JSON.stringify(hist));

  /* Actualizar perfil global */
  actualizarPerfil();

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
  /* Quitar overlay y reiniciar nivel 9 */
  const ov = ccScreen.querySelector('.cc-results-overlay');
  if (ov) ov.remove();
  iniciarNivel(CC_NIVELES.length - 1);
}

/* ════════════════════════════════════════════
   SELECTOR DE NIVELES
   ════════════════════════════════════════════ */
function renderNivelesGrid() {
  const g=document.getElementById('cc-nv-grid');
  if (!g) return;
  g.innerHTML='';
  CC_NIVELES.forEach((n,i)=>{
    const b=document.createElement('button');
    b.className=`cc-btn cc-nv-item${i===ccState.idx?' cc-nv-activo':''}`;
    b.textContent=`Nivel ${n.id}`;
    b.title=n.titulo;
    b.onclick=()=>{iniciarNivel(i);ocultarNiveles();};
    g.appendChild(b);
  });
}
function mostrarNiveles() { renderNivelesGrid(); document.getElementById('cc-nv-overlay').classList.remove('hidden'); }
function ocultarNiveles() { document.getElementById('cc-nv-overlay').classList.add('hidden'); }

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
