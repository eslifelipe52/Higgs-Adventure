/* ══════════════════════════════════════════
   minijuegos/js/minijuego-spin.js
   Minijuego: Espín (ETAPA 1 — El espín de los
   fermiones de primera generación)

   Niveles:
     1.1 La Brújula Cuántica   → el espín es binario (↑/↓)
     1.2 Stern-Gerlach          → cómo se mide el espín
     1.3 Principio de Exclusión → Pauli + estructura atómica
     1.4 Momento Magnético      → el espín genera magnetismo

   Estética y arquitectura coherentes con el minijuego de
   Carga Eléctrica: shell header + body + nav-bar + dots,
   fondo oscuro cuadriculado (mjGridBackground) y paleta
   azul/cian.
   ══════════════════════════════════════════ */

/* ════════════════════════════════════════════
   ESTADO GLOBAL
   ════════════════════════════════════════════ */
let spScreen = null;
let spState  = {};     /* { nivelIdx } */
let spRAF    = null;   /* loop de animación del nivel activo */

/* Etapas, cada una con 4 módulos (A-D). Cada módulo se renderiza con fn(body). */
const SP_ETAPAS = [
  {
    label: 'Etapa 1', nombre: 'El espín de los fermiones',
    modulos: [
      { id: 'brujula',   label: 'Brújula',       icon: '🧭', fn: 'spNivelBrujula',   titulo: 'La Brújula Cuántica' },
      { id: 'stern',     label: 'Stern-Gerlach', icon: '🧲', fn: 'spNivelStern',     titulo: 'El Experimento de Stern-Gerlach' },
      { id: 'pauli',     label: 'Exclusión',     icon: '🧱', fn: 'spNivelPauli',     titulo: 'El Principio de Exclusión' },
      { id: 'magnetico', label: 'Momento μ',     icon: '🔩', fn: 'spNivelMagnetico', titulo: 'El Momento Magnético' },
    ]
  },
  {
    label: 'Etapa 2', nombre: 'Todos los fermiones y decaimientos',
    modulos: [
      { id: 'familia',   label: 'Familia 1/2',  icon: '👪', fn: 'spModFamilia',   titulo: 'La Familia del Espín 1/2' },
      { id: 'decaim',    label: 'Decaimientos', icon: '🧩', fn: 'spModDecaim',    titulo: 'Conservación del Espín' },
      { id: 'helicidad', label: 'Helicidad',    icon: '🧭', fn: 'spModHelicidad', titulo: 'Helicidad: Espín y Movimiento' },
    ]
  },
  {
    label: 'Etapa 3', nombre: 'El espín de los bosones gauge',
    modulos: [
      { id: 'triestado', label: 'El Triestado', icon: '🔺', fn: 'spModTriestado', titulo: 'El Triestado (Espín 1)' },
      { id: 'estadis',   label: 'Espín-Estad.', icon: '💃', fn: 'spModEstadistica', titulo: 'El Teorema Espín-Estadística' },
      { id: 'gluon',     label: 'Gluones',      icon: '🔗', fn: 'spModGluon',      titulo: 'El Espín de los Gluones' },
    ]
  },
];

/* Acceso cómodo a los módulos de la etapa actual */
function spModulos() { return SP_ETAPAS[spState.etapa].modulos; }

/* ════════════════════════════════════════════
   ENTRADA
   ════════════════════════════════════════════ */
function iniciar_spin() {
  spState = { etapa: 0, nivelIdx: 0 };
  spCrearPantalla();
  spLanzarNivel();
}

/* ════════════════════════════════════════════
   CREAR PANTALLA (shell común)
   ════════════════════════════════════════════ */
function spCrearPantalla() {
  if (spScreen) spScreen.remove();
  spScreen = document.createElement('div');
  spScreen.id        = 'sp-screen';
  spScreen.className = 'sp-screen';
  spScreen.innerHTML = `
    <div class="sp-header">
      <div class="sp-instruccion-wrap">
        <div class="sp-instruccion-label">ESPÍN</div>
        <div class="sp-instruccion-icon">🌀</div>
        <p class="sp-instruccion" id="sp-instruccion"></p>
      </div>
      <div class="sp-etapa-tabs" id="sp-etapa-tabs"></div>
    </div>

    <div class="sp-body" id="sp-body"></div>

    <div class="sp-nav-bar">
      <button class="sp-btn sp-btn-volver" onclick="cerrarSpin()">← Volver al ME</button>
      <div class="sp-nivel-dots" id="sp-nivel-dots"></div>
      <div class="sp-progreso-label" id="sp-progreso-label"></div>
    </div>
  `;
  document.getElementById('app').appendChild(spScreen);
  spRenderTabs();
  spRenderDots();
}

/* ════════════════════════════════════════════
   NAVEGACIÓN POR ETAPAS Y MÓDULOS
   ════════════════════════════════════════════ */
function spRenderTabs() {
  const cont = document.getElementById('sp-etapa-tabs');
  if (!cont) return;
  cont.innerHTML = SP_ETAPAS.map((e, i) => `
    <button class="sp-etapa-tab ${spState.etapa === i ? 'active' : ''}"
            onclick="spIrEtapa(${i})" title="${e.nombre}">${e.label}</button>
  `).join('');
}

function spIrEtapa(e) {
  if (e === spState.etapa) return;
  spCancelarRAF();
  spState.etapa = e;
  spState.nivelIdx = 0;
  spRenderTabs();
  spRenderDots();
  spLanzarNivel();
}

function spRenderDots() {
  const dots = document.getElementById('sp-nivel-dots');
  if (!dots) return;
  dots.innerHTML = spModulos().map((n, i) => `
    <button class="sp-nivel-dot ${spState.nivelIdx === i ? 'active' : ''}"
            onclick="spIrNivel(${i})" title="${n.titulo}">
      ${n.label}
    </button>
  `).join('');
  const lbl = document.getElementById('sp-progreso-label');
  const n = spModulos()[spState.nivelIdx];
  if (lbl && n) lbl.textContent = `Módulo ${'ABCD'[spState.nivelIdx]} · ${n.titulo}`;
}

function spIrNivel(idx) {
  spCancelarRAF();
  spState.nivelIdx = idx;
  spRenderDots();
  spLanzarNivel();
}

function spSiguienteNivel() {
  if (spState.nivelIdx < spModulos().length - 1) {
    spIrNivel(spState.nivelIdx + 1);
  } else if (spState.etapa < SP_ETAPAS.length - 1) {
    spIrEtapa(spState.etapa + 1);
  } else {
    cerrarSpin();
  }
}

function spLanzarNivel() {
  const n    = spModulos()[spState.nivelIdx];
  const body = document.getElementById('sp-body');
  const fn   = window[n.fn];
  if (typeof fn === 'function') fn(body);
}

function spCancelarRAF() {
  if (spRAF) { cancelAnimationFrame(spRAF); spRAF = null; }
}

/* ════════════════════════════════════════════
   CIERRE
   ════════════════════════════════════════════ */
function cerrarSpin() {
  spCancelarRAF();
  window.removeEventListener('resize', spAjustarCanvasActivo);
  if (spScreen) { spScreen.remove(); spScreen = null; }
  showScreen('me');
}

/* Reajusta el canvas del nivel activo (si lo hay) en resize */
function spAjustarCanvasActivo() {
  const cv = document.getElementById('sp-canvas');
  if (cv) {
    cv.width  = cv.offsetWidth  || 500;
    cv.height = cv.offsetHeight || 360;
  }
}

/* ════════════════════════════════════════════
   HELPERS COMPARTIDOS DE NIVEL (sistema de RETOS)
   En vez de una lista de pasos, cada nivel plantea un
   objetivo medible con una barra de progreso en vivo.
   ════════════════════════════════════════════ */

/* Fija el texto del reto actual */
function spSetReto(texto) {
  const el = document.getElementById('sp-reto-txt');
  if (el) el.innerHTML = texto;
}

/* Actualiza la barra de progreso (0..1) y su etiqueta */
function spProgreso(frac, etiqueta) {
  frac = Math.max(0, Math.min(1, frac));
  const barra = document.getElementById('sp-prog-barra');
  const lbl   = document.getElementById('sp-prog-lbl');
  if (barra) barra.style.width = (frac * 100) + '%';
  if (lbl && etiqueta !== undefined) lbl.textContent = etiqueta;
}

/* Marca el reto del nivel como superado: muestra el botón de avance.
   Sin logros (se añadirán después). */
function spRetoCumplido(mensaje) {
  if (spState.completado) return;
  spState.completado = true;
  spProgreso(1, mensaje || '¡Completado!');
  const cont = document.getElementById('sp-logro-cont');
  if (cont) {
    const esUltimo = spState.nivelIdx >= spModulos().length - 1
                   && spState.etapa >= SP_ETAPAS.length - 1;
    cont.innerHTML = `
      <div class="sp-exito">
        <span class="sp-exito-icon">✓</span>
        <span>${mensaje || 'Reto superado'}</span>
      </div>
      <button class="sp-btn sp-btn-next" onclick="spSiguienteNivel()">
        ${esUltimo ? 'Terminar ✓'
          : (spState.nivelIdx >= spModulos().length - 1 ? 'Siguiente etapa →' : 'Siguiente módulo →')}
      </button>`;
    cont.classList.remove('hidden');
    /* Asegurar que el botón de avance quede visible (el panel puede tener scroll) */
    try { cont.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
  }
}


/* ════════════════════════════════════════════════════════
   NIVEL 1.1 — LA BRÚJULA CUÁNTICA
   El espín es una propiedad binaria: solo ↑ (+1/2) o ↓ (−1/2).
   Interacción: clic en el electrón alterna el espín; botón de
   campo externo; intento de "estado intermedio" (rechazado).
   ════════════════════════════════════════════════════════ */
function spNivelBrujula(body) {
  document.getElementById('sp-instruccion').textContent =
    'Módulo A · La Brújula Cuántica — El espín es un imán diminuto: tiene MENOS energía cuando apunta en el sentido del campo. ¡Alinéalo para llevarlo a su estado estable!';

  spState.completado = false;
  spState.spin = +1;            /* +1 = ↑ (m_s=+1/2), −1 = ↓ (m_s=−1/2) */
  spState.campoDir = -1;        /* dirección del campo: -1 arriba, +1 abajo */
  spState.aciertos = 0;
  spState.meta = 5;             /* alinear 5 veces para superar el reto */
  spState.tiempo = 0;           /* cuenta atrás por ronda */
  spState.maxTiempo = 420;      /* frames (~7 s) por ronda: tiempo de sobra */
  spState.precesion = 0;        /* fase de precesión del espín */
  spState.alineadoDesde = null; /* frame en que empezó a estar alineado */
  spState.puntuadoRonda = false;/* ¿ya se anotó el punto de esta ronda? */
  spState.transicion = 0;       /* pausa (frames) entre rondas */

  body.innerHTML = `
    <div class="sp-wrap">
      <div class="sp-panel">
        <div class="sp-panel-card">
          <div class="sp-panel-title">Reto</div>
          <div class="sp-reto" id="sp-reto-txt">Alinea el espín con el campo <b style="color:#4fc3f7">↑</b></div>
          <div class="sp-prog-wrap"><div class="sp-prog-barra" id="sp-prog-barra"></div></div>
          <div class="sp-prog-lbl" id="sp-prog-lbl">0 / ${spState.meta} alineaciones</div>
        </div>

        <div class="sp-panel-card">
          <div class="sp-panel-title">Estado del espín</div>
          <div class="sp-ms-medidor" id="sp-ms-medidor">m_s = +1/2 (↑)</div>
          <div class="sp-energia" id="sp-energia-estado">—</div>
          <div class="sp-hint">El espín está <strong>cuantizado</strong>: solo ↑ (+1/2) o ↓ (−1/2). Observa cómo <strong>precesa</strong> (gira) alrededor del campo, como un trompo.</div>
        </div>

        <div class="sp-panel-card">
          <div class="sp-panel-title">¿Por qué alinearse?</div>
          <div class="sp-hint">
            El espín es un <strong>imán diminuto</strong>: igual que una brújula, tiene
            <b style="color:#69ffa6">menos energía (E=−μB)</b> apuntando CON el campo
            (estable) y <b style="color:#ff8a80">más (E=+μB)</b> en contra. Por eso tiende
            a alinearse.
          </div>
        </div>

        <div class="sp-panel-card">
          <div class="sp-panel-title">Control</div>
          <button class="sp-btn sp-btn-accion" onclick="spBrujulaToggle()">🔁 Invertir espín (o toca el electrón)</button>
          <button class="sp-btn sp-btn-accion" onclick="spBrujulaIntermedio()">↗ ¿Un ángulo intermedio?</button>
        </div>

        <div class="sp-logro-cont hidden" id="sp-logro-cont"></div>
      </div>

      <div class="sp-canvas-wrap">
        <canvas id="sp-canvas" class="sp-canvas"></canvas>
        <div class="sp-canvas-legend">
          <span style="color:#4fc3f7">↑ espín +1/2</span>
          <span style="color:#ff8a80">↓ espín −1/2</span>
          <span style="color:#80d8ff">campo B</span>
        </div>
      </div>
    </div>
  `;

  const cv = document.getElementById('sp-canvas');
  spState.canvas = cv; spState.ctx = cv.getContext('2d');
  spAjustarCanvasActivo();
  window.addEventListener('resize', spAjustarCanvasActivo);

  cv.addEventListener('click', spBrujulaToggle);
  cv.addEventListener('touchstart', e => { e.preventDefault(); spBrujulaToggle(); }, { passive:false });

  spBrujulaNuevaRonda();
  spBrujulaLoop();
}

/* Nueva ronda: el campo apunta en una dirección aleatoria y el espín
   arranca DESALINEADO (apuntando al revés que el campo) para que el
   jugador tenga que invertirlo. Convención unificada: +1 = ↑, −1 = ↓,
   tanto para el espín como para el campo. */
function spBrujulaNuevaRonda() {
  const st = spState;
  st.campoDir = Math.random() < 0.5 ? +1 : -1;
  st.spin = -st.campoDir;        /* arranca justo al revés del campo */
  spActualizarMs();
  st.tiempo = st.maxTiempo;
  st.alineadoDesde = null;
  st.puntuadoRonda = false;      /* nueva ronda: se puede volver a puntuar */
  const flecha = st.campoDir > 0 ? '<b style="color:#4fc3f7">↑</b>' : '<b style="color:#ff8a80">↓</b>';
  spSetReto('El campo apunta ' + flecha + '. Invierte el espín para alinearlo y <b style="color:#69ffa6">bajar su energía</b>.');
}

function spBrujulaToggle() {
  if (spState.completado) return;
  spState.spin *= -1;
  spActualizarMs();
}

function spBrujulaIntermedio() {
  spState.sacudida = 1;
  spFlashSp('✗ Imposible: el espín de un fermión solo apunta ↑ o ↓, nunca en medio. Está cuantizado.');
}

function spActualizarMs() {
  const el = document.getElementById('sp-ms-medidor');
  if (el) {
    if (spState.spin > 0) { el.textContent = 'm_s = +1/2 (↑)'; el.style.color = '#4fc3f7'; }
    else                  { el.textContent = 'm_s = −1/2 (↓)'; el.style.color = '#ff8a80'; }
  }
  /* Indicador de energía: ¿el espín apunta con el campo (estable) o en contra? */
  const en = document.getElementById('sp-energia-estado');
  if (en && spState.campoDir !== undefined) {
    if (spState.spin === spState.campoDir) {
      en.textContent = '⤓ Energía mínima (E = −μB): estado estable';
      en.style.color = '#69ffa6';
      en.style.borderColor = 'rgba(0,230,118,0.4)';
      en.style.background = 'rgba(0,230,118,0.08)';
    } else {
      en.textContent = '⤒ Mayor energía (E = +μB): estado excitado';
      en.style.color = '#ff8a80';
      en.style.borderColor = 'rgba(255,82,82,0.4)';
      en.style.background = 'rgba(255,82,82,0.08)';
    }
  }
}

/* Mensaje flash efímero sobre el canvas (reutilizado por varios niveles) */
function spFlashSp(txt) { spState.msg = txt; spState.msgT = 1; }

function spBrujulaLoop() {
  spRAF = requestAnimationFrame(spBrujulaLoop);
  const st = spState, ctx = st.ctx, cv = st.canvas;
  if (!ctx || !cv) return;
  const W = cv.width, H = cv.height;
  mjGridBackground(ctx, W, H);

  const cx = W/2, cy = H/2;
  st.precesion += 0.09;

  const campoArriba = st.campoDir > 0;   /* +1 = ↑ */
  const campoCol = campoArriba ? '#4fc3f7' : '#ff8a80';

  /* ── Campo magnético externo: flechas en la dirección actual ── */
  ctx.save();
  ctx.strokeStyle = campoCol + '44'; ctx.fillStyle = campoCol + '44'; ctx.lineWidth = 2;
  for (let x = 44; x < W; x += 62) {
    const y0 = campoArriba ? H-28 : 28, y1 = campoArriba ? 28 : H-28;
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x-5, y1 + (campoArriba? 12 : -12));
    ctx.lineTo(x+5, y1 + (campoArriba? 12 : -12));
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  /* ── Lógica del reto ──
     El acierto se cuenta UNA sola vez por ronda, cuando el espín pasa a
     estar alineado tras mantenerse un instante. Luego hay una breve pausa
     (transición) antes de lanzar la siguiente ronda, para que no se encadenen
     varios aciertos con un solo clic. */
  const alineado = (st.spin === st.campoDir);
  if (!st.completado) {
    if (st.transicion > 0) {
      /* Pausa entre rondas: no se puntúa ni se evalúa alineación */
      st.transicion--;
      if (st.transicion === 0) spBrujulaNuevaRonda();
    } else if (st.puntuadoRonda) {
      /* Ya se puntuó esta ronda: esperando que arranque la transición (ya hecho) */
    } else if (alineado) {
      if (st.alineadoDesde === null) st.alineadoDesde = 0;
      st.alineadoDesde++;
      /* Mantener alineado ~0.6 s cuenta como acierto */
      if (st.alineadoDesde > 36) {
        st.puntuadoRonda = true;
        st.aciertos++;
        spProgreso(st.aciertos / st.meta, st.aciertos + ' / ' + st.meta + ' alineaciones');
        if (st.aciertos >= st.meta) {
          spRetoCumplido('¡Dominas la brújula cuántica! El espín solo tiene dos estados: ↑ y ↓.');
        } else {
          spFlashSp('✔ ¡Alineado! (' + st.aciertos + '/' + st.meta + ') Preparando el siguiente campo…');
          st.transicion = 48;   /* ~0.8 s de pausa antes de la nueva ronda */
        }
      }
    } else {
      st.alineadoDesde = null;
      st.tiempo--;
      if (st.tiempo <= 0) {
        spFlashSp('Se acabó el tiempo. El campo cambia de dirección.');
        spBrujulaNuevaRonda();
      }
    }
  }

  /* Barra de tiempo de la ronda (sobre el canvas) */
  if (!st.completado) {
    const frac = Math.max(0, st.tiempo / st.maxTiempo);
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(cx-80, 30, 160, 6);
    ctx.fillStyle = alineado ? '#00e676' : '#ffb300';
    ctx.fillRect(cx-80, 30, 160*frac, 6);
    ctx.restore();

    /* Etiqueta de energía: explica POR QUÉ conviene alinear */
    ctx.save();
    ctx.font = '600 13px "Exo 2",sans-serif'; ctx.textAlign = 'center';
    if (alineado) {
      ctx.fillStyle = '#69ffa6';
      ctx.fillText('✓ Alineado con el campo → ENERGÍA MÍNIMA (estable)', cx, 18);
    } else {
      ctx.fillStyle = '#ffb74d';
      ctx.fillText('✗ En contra del campo → más energía: inviértelo para estabilizarlo', cx, 18);
    }
    ctx.restore();
  }

  /* Sacudida al intentar un estado intermedio */
  let wobble = 0;
  if (st.sacudida > 0) { wobble = Math.sin(Date.now()*0.05) * st.sacudida * 14; st.sacudida = Math.max(0, st.sacudida - 0.03); }

  const arriba = st.spin > 0;
  const col  = arriba ? '#4fc3f7' : '#ff8a80';
  const glow = arriba ? '#00b0ff' : '#ff5252';

  /* Anillo "brújula" + resalte verde si está alineado */
  ctx.save();
  ctx.strokeStyle = alineado ? 'rgba(0,230,118,0.5)' : 'rgba(255,255,255,0.15)';
  ctx.lineWidth = alineado ? 2.5 : 1.5; ctx.setLineDash([4,4]);
  ctx.beginPath(); ctx.arc(cx, cy, 92, 0, Math.PI*2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(79,195,247,0.5)'; ctx.font = 'bold 18px "Orbitron",monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('↑', cx, cy - 112);
  ctx.fillStyle = 'rgba(255,138,128,0.5)';
  ctx.fillText('↓', cx, cy + 112);
  ctx.restore();

  /* Electrón */
  ctx.save();
  ctx.shadowColor = glow; ctx.shadowBlur = 24;
  const g = ctx.createRadialGradient(cx-10, cy-10, 0, cx, cy, 34);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, col); g.addColorStop(1, col);
  ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI*2); ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = '#06121f'; ctx.font = 'bold 16px "Orbitron",monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('e⁻', cx, cy);
  ctx.restore();

  /* Flecha de espín con PRECESIÓN (gira como un trompo alrededor del eje).
     La precesión da una ligera inclinación lateral animada. */
  const dir = arriba ? -1 : 1;
  const largo = 72;
  const inclina = Math.sin(st.precesion) * (alineado ? 4 : 14);  /* más calmada al alinear */
  const ax = cx + inclina + wobble, ay = cy + dir*largo;
  ctx.save();
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.shadowColor = glow; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ax, ay); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - 9, ay - dir*16);
  ctx.lineTo(ax + 9, ay - dir*16);
  ctx.closePath(); ctx.fill();
  /* Elipse de precesión en la punta */
  ctx.globalAlpha = 0.3;
  ctx.beginPath(); ctx.ellipse(cx, ay, 14, 5, 0, 0, Math.PI*2); ctx.stroke();
  ctx.restore();

  spDibujarFlash(ctx, W, H);
}

/* ── Llama animada (fuego parpadeante en 3 capas) ──
   Dibuja una llama con forma real (no un bloque): base ancha que sube a una
   punta, con tres capas de color (naranja → amarillo → blanco) y glow, más un
   parpadeo suave para que se vea viva. (cx,cy) = base de la llama. */
function spDibujarLlama(ctx, cx, cy, t) {
  const flick = Math.sin(t * 1.7) * 0.12 + Math.sin(t * 2.9) * 0.06;  /* parpadeo */
  const capa = (altura, ancho, color, alpha) => {
    const h = altura * (1 + flick);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.shadowColor = color; ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 8);                                   /* base derecha */
    ctx.quadraticCurveTo(cx + ancho, cy - h*0.4, cx, cy - h); /* sube a la punta */
    ctx.quadraticCurveTo(cx - ancho, cy - h*0.4, cx, cy + 8); /* baja a la base */
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  /* De fuera (grande, naranja) a dentro (pequeña, blanca) */
  capa(46, 16, '#ff5722', 0.9);   /* exterior naranja-rojo */
  capa(34, 11, '#ff9800', 0.95);  /* medio naranja */
  capa(22,  7, '#ffd740', 1);     /* interior amarillo */
  capa(11,  4, '#fff8e1', 1);     /* núcleo casi blanco */
}

/* Mensaje flash común (barra inferior sobre el canvas) */
function spDibujarFlash(ctx, W, H) {
  const st = spState;
  if (st.msgT > 0 && st.msg) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, st.msgT * 1.5);
    ctx.font = '600 13px "Exo 2",sans-serif'; ctx.textAlign = 'center';
    const tw = ctx.measureText(st.msg).width;
    const bw = Math.min(W - 20, tw + 28);
    ctx.fillStyle = 'rgba(5,15,40,0.9)';
    ctx.fillRect(W/2 - bw/2, H - 44, bw, 30);
    ctx.strokeStyle = 'rgba(0,180,255,0.6)';
    ctx.strokeRect(W/2 - bw/2, H - 44, bw, 30);
    ctx.fillStyle = '#d0eeff'; ctx.textBaseline = 'middle';
    ctx.fillText(st.msg, W/2, H - 29);
    ctx.restore();
    st.msgT = Math.max(0, st.msgT - 0.006);
  }
}


/* ════════════════════════════════════════════════════════
   NIVEL 1.2 — EL EXPERIMENTO DE STERN-GERLACH
   Un horno emite átomos; un imán con campo NO uniforme los
   desvía según su espín; en la pantalla aparecen DOS manchas.
   Rotar el imán cambia el eje medido pero siempre da 2 manchas.
   ════════════════════════════════════════════════════════ */
function spNivelStern(body) {
  document.getElementById('sp-instruccion').textContent =
    'Módulo B · Stern-Gerlach — Mide el espín con un imán y descubre, paso a paso, por qué aparecen DOS manchas y qué significa.';

  spState.completado = false;
  spState.hornoOn = false;
  spState.anguloIman = 0;
  spState.ejeMedida = 'Z';       /* eje que mide el imán actual (texto) */
  spState.atomos = [];
  spState.manchas = [];
  spState.impactosUp = 0; spState.impactosDown = 0;
  spState.prediccion = null;
  spState.fase = 0;              /* 0 predicción · 1 observar · 2 rotar · 3 filtro */
  spState.meta = 30;             /* impactos para completar la fase de observación */

  body.innerHTML = `
    <div class="sp-wrap">
      <div class="sp-panel">
        <div class="sp-panel-card">
          <div class="sp-panel-title">Reto <span id="sp-stern-fase" style="color:#80d8ff">1/3</span></div>
          <div class="sp-reto" id="sp-reto-txt">Si el espín fuera una brújula clásica, los átomos se desviarían un poco al azar y formarían una franja continua. ¿Qué crees que pasará en realidad?</div>
          <div class="sp-pred" id="sp-pred">
            <button class="sp-btn sp-btn-accion" onclick="spSternPredecir(1)">Una franja continua (clásico)</button>
            <button class="sp-btn sp-btn-accion" onclick="spSternPredecir(2)">Dos manchas separadas (cuántico)</button>
          </div>
        </div>

        <div class="sp-panel-card" id="sp-stern-exp" style="display:none">
          <div class="sp-panel-title">Experimento</div>
          <button class="sp-btn sp-btn-accion" id="sp-btn-horno" onclick="spSternHorno()">🔥 Encender / apagar horno</button>
          <button class="sp-btn sp-btn-accion" id="sp-btn-girar" onclick="spSternGirar()" style="display:none">🔄 Girar imán 90° (eje: <span id="sp-eje">Z</span>)</button>
          <div class="sp-tally">
            <div class="sp-tally-row"><span style="color:#4fc3f7">↑</span> <div class="sp-tally-bar"><div id="sp-tally-up" class="sp-tally-fill up"></div></div> <b id="sp-tally-up-n">0</b></div>
            <div class="sp-tally-row"><span style="color:#ff8a80">↓</span> <div class="sp-tally-bar"><div id="sp-tally-down" class="sp-tally-fill down"></div></div> <b id="sp-tally-down-n">0</b></div>
          </div>
          <div class="sp-prog-wrap"><div class="sp-prog-barra" id="sp-prog-barra"></div></div>
          <div class="sp-prog-lbl" id="sp-prog-lbl">0 / ${spState.meta}</div>
        </div>

        <div class="sp-panel-card" id="sp-stern-porque">
          <div class="sp-panel-title">¿Por qué ocurre?</div>
          <div class="sp-hint" id="sp-stern-porque-txt">
            El imán crea un campo <strong>no uniforme</strong>: empuja a cada átomo según
            su espín. Como el espín solo puede valer ↑ o ↓ (está <strong>cuantizado</strong>),
            los átomos se separan en <strong>exactamente dos</strong> grupos. Una brújula
            clásica podría apuntar en cualquier ángulo y daría una franja continua.
          </div>
        </div>

        <div class="sp-logro-cont hidden" id="sp-logro-cont"></div>
      </div>

      <div class="sp-canvas-wrap">
        <canvas id="sp-canvas" class="sp-canvas"></canvas>
        <div class="sp-canvas-legend">
          <span style="color:#ffb74d">🔥 horno</span>
          <span style="color:#4fc3f7">N/S imán</span>
          <span style="color:#80d8ff">● impactos</span>
        </div>
      </div>
    </div>
  `;

  const cv = document.getElementById('sp-canvas');
  spState.canvas = cv; spState.ctx = cv.getContext('2d');
  spAjustarCanvasActivo();
  window.addEventListener('resize', spAjustarCanvasActivo);

  spSternLoop();
}

function spSternPredecir(n) {
  spState.prediccion = n;
  spState.fase = 1;
  const pred = document.getElementById('sp-pred');
  const exp  = document.getElementById('sp-stern-exp');
  if (pred) pred.style.display = 'none';
  if (exp)  exp.style.display = 'block';
  spSetReto('<b>Fase 1 — Observa:</b> enciende el horno y recolecta impactos. ¿Una franja o dos manchas?');
  /* Encender el horno automáticamente para arrancar la acción */
  spState.hornoOn = true;
  const btn = document.getElementById('sp-btn-horno');
  if (btn) btn.classList.add('activo');
}

function spSternHorno() {
  spState.hornoOn = !spState.hornoOn;
  const btn = document.getElementById('sp-btn-horno');
  if (btn) btn.classList.toggle('activo', spState.hornoOn);
}

/* Girar el imán 90°: cambia el EJE de medida (Z ↔ X). Clave de la fase 2. */
function spSternGirar() {
  spState.anguloIman = (spState.anguloIman + 90) % 180;   /* 0 ↔ 90 */
  spState.ejeMedida  = spState.anguloIman === 0 ? 'Z' : 'X';
  const el = document.getElementById('sp-eje');
  if (el) el.textContent = spState.ejeMedida;
  /* Reiniciar el patrón y el conteo al cambiar de eje */
  spState.manchas = [];
  spState.impactosUp = 0; spState.impactosDown = 0;
  spState.giros = (spState.giros || 0) + 1;
  spFlashSp('Imán girado: ahora mide el eje ' + spState.ejeMedida + '. Observa el patrón…');
}

/* Avanza de fase y actualiza explicación + reto */
function spSternFase(n) {
  spState.fase = n;
  spState.manchas = [];
  spState.atomos = [];
  spState.impactosUp = 0; spState.impactosDown = 0;

  /* Al cambiar de fase se APAGA el horno: el jugador vuelve a encenderlo
     para arrancar la nueva fase (así hay un corte claro entre fases). */
  spState.hornoOn = false;
  const btnHorno = document.getElementById('sp-btn-horno');
  if (btnHorno) btnHorno.classList.remove('activo');

  const faseLbl = document.getElementById('sp-stern-fase');
  const porque  = document.getElementById('sp-stern-porque-txt');

  if (n === 2) {
    if (faseLbl) faseLbl.textContent = '2/3';
    document.getElementById('sp-btn-girar').style.display = 'block';
    spSetReto('<b>Fase 2 — Otro eje:</b> enciende de nuevo el horno, gira el imán 90° y mide el espín en OTRA dirección. ¿Seguirán siendo dos manchas?');
    if (porque) porque.innerHTML =
      'No importa en qué dirección orientes el imán: siempre obtienes <strong>dos</strong> ' +
      'manchas. El espín está cuantizado en <strong>cualquier eje</strong> que midas, no solo en el vertical.';
  } else if (n === 3) {
    if (faseLbl) faseLbl.textContent = '3/3';
    spSetReto('<b>Fase 3 — La medida cambia el estado:</b> enciende el horno; estos átomos ya salieron "↑" de un primer imán. Al medirlos en otro eje, observa qué pasa.');
    if (porque) porque.innerHTML =
      'Aunque ya sabías que eran "↑" en el eje Z, al medir en OTRO eje <strong>vuelven a dividirse</strong> ' +
      'en dos. Medir una dirección <strong>borra</strong> la información de la otra: la medición no solo observa, ' +
      '¡también <strong>cambia</strong> el estado cuántico!';
    /* En fase 3 los átomos ya vienen "filtrados" como ↑ pero se re-dividen */
    spState.filtrado = true;
  }
}

function spSternLoop() {
  spRAF = requestAnimationFrame(spSternLoop);
  const st = spState, ctx = st.ctx, cv = st.canvas;
  if (!ctx || !cv) return;
  const W = cv.width, H = cv.height;
  mjGridBackground(ctx, W, H);

  const hornoX = 48, cy = H/2;
  const imanX = W*0.42, pantallaX = W - 46;

  /* ── Horno: caja metálica con una boquilla por donde salen los átomos ── */
  ctx.save();
  /* Cuerpo del horno */
  const hg = ctx.createLinearGradient(hornoX-22, 0, hornoX+14, 0);
  hg.addColorStop(0, '#3a3340'); hg.addColorStop(1, '#1b1726');
  ctx.fillStyle = hg;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(hornoX-22, cy-30, 34, 60, 5) : ctx.rect(hornoX-22, cy-30, 34, 60);
  ctx.fill(); ctx.stroke();
  /* Boquilla de salida (hacia el imán) */
  ctx.fillStyle = '#120d1c';
  ctx.fillRect(hornoX+10, cy-5, 8, 10);
  ctx.restore();

  /* ── Llama animada (solo cuando el horno está encendido) ── */
  if (st.hornoOn) {
    spDibujarLlama(ctx, hornoX - 5, cy, Date.now() / 120);
  }

  /* Imán (dos polos) — su orientación define el eje de medida */
  const ang = st.anguloIman;
  ctx.save();
  ctx.translate(imanX, cy);
  ctx.rotate(ang * Math.PI/180);
  ctx.fillStyle = 'rgba(79,195,247,0.85)';
  ctx.fillRect(-26, -58, 52, 26);
  ctx.fillStyle = 'rgba(239,83,80,0.85)';
  ctx.fillRect(-26, 32, 52, 26);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px "Orbitron",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('N', 0, -45);
  ctx.fillText('S', 0, 45);
  ctx.restore();

  /* Pantalla detectora */
  ctx.save();
  ctx.strokeStyle = 'rgba(128,216,255,0.5)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(pantallaX, 24); ctx.lineTo(pantallaX, H-24); ctx.stroke();
  ctx.restore();

  /* El imán gira 0 ↔ 90°. Para la vista 2D representamos ambos ejes como
     separación vertical, pero el átomo siempre se divide en dos. */

  /* Emisión de átomos (ritmo vivo). En fase 3 los átomos ya vienen "filtrados"
     como ↑ en el eje anterior, pero al medir el nuevo eje se re-dividen 50/50. */
  if (st.hornoOn && !st.completado) {
    if (!st._tick) st._tick = 0;
    st._tick++;
    if (st._tick % 7 === 0) {
      const spin = Math.random() < 0.5 ? +1 : -1;
      st.atomos.push({ x: hornoX, y: cy + (Math.random()-0.5)*8, spin, vy: 0, filtrado: st.filtrado });
    }
  }

  /* Mover átomos.
     Al cruzar el imán, cada átomo recibe UNA sola vez una velocidad vertical
     fija (según su espín). Así la desviación es suave y controlada: aterriza
     en una de dos bandas sin salirse del lienzo. */
  const vel = 3.0;
  const desvio = 0.9;   /* px por frame de desviación vertical (constante) */
  st.atomos.forEach(a => {
    a.x += vel;
    if (a.x > imanX && !a.desviado) {
      a.desviado = true;
      a.vy = a.spin * -desvio;   /* +1 (↑) → hacia arriba (−y) */
    }
    if (a.desviado) a.y += a.vy;
    if (a.x >= pantallaX && !a.impacto) {
      a.impacto = true;
      /* Mantener el impacto dentro de la pantalla detectora */
      a.y = Math.max(28, Math.min(H - 28, a.y));
      st.manchas.push({ y: a.y, spin: a.spin });
      if (a.spin > 0) st.impactosUp++; else st.impactosDown++;
      if (st.manchas.length > 240) st.manchas.shift();
    }
  });
  st.atomos = st.atomos.filter(a => a.x < pantallaX + 4);

  /* Átomos en vuelo */
  st.atomos.forEach(a => {
    ctx.save();
    ctx.shadowColor = '#80d8ff'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#cfe9ff';
    ctx.beginPath(); ctx.arc(a.x, a.y, 4, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });

  /* Impactos acumulados (dos manchas) */
  st.manchas.forEach(m => {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = m.spin > 0 ? '#4fc3f7' : '#ff8a80';
    ctx.beginPath(); ctx.arc(pantallaX, m.y, 5, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });

  /* Tally en vivo */
  const total = st.impactosUp + st.impactosDown;
  const up = document.getElementById('sp-tally-up'), down = document.getElementById('sp-tally-down');
  if (up)   up.style.width   = (total ? st.impactosUp/Math.max(total,1)*100 : 0) + '%';
  if (down) down.style.width = (total ? st.impactosDown/Math.max(total,1)*100 : 0) + '%';
  const upn = document.getElementById('sp-tally-up-n'), dwn = document.getElementById('sp-tally-down-n');
  if (upn) upn.textContent = st.impactosUp;
  if (dwn) dwn.textContent = st.impactosDown;
  spProgreso(total / st.meta, Math.min(total, st.meta) + ' / ' + st.meta);

  /* ── Avance por fases ──
     En la fase 2 el reto exige haber GIRADO el imán al menos una vez (medir
     otro eje); por eso solo cuenta la recolección hecha tras un giro. */
  const dosManchas = (total >= st.meta && st.impactosUp > 4 && st.impactosDown > 4);
  const faseListaOk = (st.fase !== 2) || (st.giros >= 1);
  if (!st.completado && dosManchas && faseListaOk && !st._avanzando) {
    st._avanzando = true;
    if (st.fase === 1) {
      const acerto = st.prediccion === 2;
      spFlashSp(acerto
        ? '✔ ¡Dos manchas! Tu predicción cuántica era correcta.'
        : 'Resultan DOS manchas: el espín es cuántico, no clásico.');
      setTimeout(() => { st._avanzando = false; spSternFase(2); }, 1400);
    } else if (st.fase === 2) {
      spFlashSp('✔ ¡Siguen siendo dos manchas en el eje ' + st.ejeMedida + '! El espín se cuantiza en cualquier dirección.');
      setTimeout(() => { st._avanzando = false; spSternFase(3); }, 1600);
    } else if (st.fase === 3) {
      spRetoCumplido('¡Lo esencial del espín! Medir un eje reinicia el otro: la medición cuántica cambia el estado. Dos manchas, siempre.');
    }
  }

  /* En la fase 2, si ya hay dos manchas pero aún no se ha girado, invitar a girar */
  if (!st.completado && st.fase === 2 && !st.giros && dosManchas) {
    spSetReto('<b>Fase 2:</b> ya ves dos manchas en el eje Z. Ahora pulsa «Girar imán 90°» para medir en el eje X.');
  }

  spDibujarFlash(ctx, W, H);
}


/* ════════════════════════════════════════════════════════
   NIVEL 1.3 — EL PRINCIPIO DE EXCLUSIÓN (Acomodo de electrones)
   Orbitales 1s, 2s, 2p. Máx 2 e⁻ por orbital con espines
   opuestos (Pauli). En 2p se aplica la regla de Hund.
   Es un nivel DOM (cajas clicables), no canvas.
   ════════════════════════════════════════════════════════ */
function spNivelPauli(body) {
  document.getElementById('sp-instruccion').textContent =
    'Módulo C · Principio de Exclusión — Construye 4 átomos (He, C, O, Ne) llenando sus orbitales. Respeta Pauli (espines opuestos) y la regla de Hund.';

  spState.completado = false;
  /* Secuencia de 4 átomos de dificultad creciente (todos caben en 1s/2s/2p) */
  spState.atomosSeq = [
    { sym:'He', nombre:'Helio',     e:2,  tip:'El 1s cabe DOS electrones, pero con espines OPUESTOS (Pauli). Coloca ↑ y luego ↓.' },
    { sym:'C',  nombre:'Carbono',   e:6,  tip:'Aquí entra la regla de Hund: los 2p se llenan de uno en uno.' },
    { sym:'O',  nombre:'Oxígeno',   e:8,  tip:'Ya hay que emparejar un 2p (dos electrones en una caja).' },
    { sym:'Ne', nombre:'Neón',      e:10, tip:'Gas noble: todos los orbitales de n=1 y n=2 llenos.' },
  ];
  spState.atomoIdx = 0;
  spState.spinSel = +1;
  spState.anims = [];           /* animaciones de electrones aterrizando */
  spState._atomoListo = false;  /* true cuando el átomo está completo y espera el botón */
  spPauliCargarAtomo();

  body.innerHTML = `
    <div class="sp-wrap">
      <div class="sp-panel">
        <div class="sp-panel-card">
          <div class="sp-panel-title">Reto <span id="sp-pauli-atomo-n" style="color:#80d8ff">1/4</span></div>
          <div class="sp-reto" id="sp-reto-txt">—</div>
          <div class="sp-prog-wrap"><div class="sp-prog-barra" id="sp-prog-barra"></div></div>
          <div class="sp-prog-lbl" id="sp-prog-lbl">0 / 1 electrones</div>
          <div class="sp-atomos-mini" id="sp-atomos-mini"></div>
        </div>

        <div class="sp-panel-card">
          <div class="sp-panel-title">Electrón a colocar</div>
          <div class="sp-spin-sel">
            <button class="sp-spin-btn selected" id="sp-sel-up"   onclick="spPauliSel(1)">↑ espín +1/2</button>
            <button class="sp-spin-btn"          id="sp-sel-down" onclick="spPauliSel(-1)">↓ espín −1/2</button>
          </div>
          <div class="sp-hint">Elige el espín y toca un orbital. Dos en el mismo orbital deben tener espines <strong>opuestos</strong> (Pauli). En 2p llena primero uno en cada caja (Hund).</div>
          <div class="sp-estado" id="sp-pauli-estado"></div>
        </div>

        <div class="sp-panel-card">
          <div class="sp-panel-title">¿Por qué ocurre?</div>
          <div class="sp-hint">
            Dos fermiones <strong>no pueden</strong> estar en el mismo estado cuántico. Como
            el espín solo tiene dos valores (↑ y ↓), en cada orbital caben <strong>máximo
            2</strong> electrones, y con espines opuestos. Esta regla es la que da forma a
            la <strong>tabla periódica</strong> y hace que la materia ocupe espacio en vez
            de colapsar.
          </div>
        </div>

        <div class="sp-logro-cont hidden" id="sp-logro-cont"></div>
      </div>

      <div class="sp-canvas-wrap sp-orbitales-wrap">
        <div class="sp-orbital-nivel">
          <div class="sp-orbital-grupo">
            <div class="sp-orbital-label">1s</div>
            <div class="sp-orbital-cajas" id="sp-orb-1s"></div>
          </div>
        </div>
        <div class="sp-orbital-nivel">
          <div class="sp-orbital-grupo">
            <div class="sp-orbital-label">2s</div>
            <div class="sp-orbital-cajas" id="sp-orb-2s"></div>
          </div>
          <div class="sp-orbital-grupo">
            <div class="sp-orbital-label">2p</div>
            <div class="sp-orbital-cajas" id="sp-orb-2p"></div>
          </div>
        </div>
        <div class="sp-atomo-grande" id="sp-atomo-grande">⚛</div>
        <div class="sp-orbital-conteo" id="sp-orbital-conteo">Electrones colocados: 0</div>
      </div>
    </div>
  `;

  spPauliRenderReto();
  spPauliRender();
}

/* Prepara los orbitales vacíos para el átomo actual de la secuencia */
function spPauliCargarAtomo() {
  spState.orbitales = { '1s': [ [] ], '2s': [ [] ], '2p': [ [], [], [] ] };
  const a = spState.atomosSeq[spState.atomoIdx];
  spState.objElectrones = a.e;
  spState.objNombre = a.nombre + ' (' + a.sym + ')';
}

/* Actualiza el texto del reto y los mini-indicadores de la secuencia */
function spPauliRenderReto() {
  const a = spState.atomosSeq[spState.atomoIdx];
  const n = document.getElementById('sp-pauli-atomo-n');
  if (n) n.textContent = (spState.atomoIdx + 1) + '/' + spState.atomosSeq.length;
  const reto = document.getElementById('sp-reto-txt');
  if (reto) reto.innerHTML = `Construye el <b>${a.nombre} (${a.sym})</b> — <b>${a.e}</b> electrones. ${a.tip}`;
  const grande = document.getElementById('sp-atomo-grande');
  if (grande) grande.textContent = a.sym;
  const mini = document.getElementById('sp-atomos-mini');
  if (mini) mini.innerHTML = spState.atomosSeq.map((at, i) => {
    const cls = i < spState.atomoIdx ? 'hecho' : i === spState.atomoIdx ? 'actual' : '';
    return `<span class="sp-atomo-chip ${cls}">${at.sym}</span>`;
  }).join('');
}

function spPauliSel(s) {
  spState.spinSel = s;
  document.getElementById('sp-sel-up').classList.toggle('selected', s > 0);
  document.getElementById('sp-sel-down').classList.toggle('selected', s < 0);
}

/* Intenta colocar un electrón del espín seleccionado en el orbital dado.
   Aplica Pauli (espines opuestos), orden de energía (Aufbau) y Hund (2p). */
function spPauliColocar(nombre, idx) {
  if (spState.completado || spState._atomoListo) return;
  const o = spState.orbitales;
  const orb = o[nombre][idx];
  const s = spState.spinSel;

  /* Orden de llenado por energía: 1s → 2s → 2p (Aufbau) */
  const lleno = arr => arr.every(x => x.length === 2);
  if (nombre === '2s' && o['1s'][0].length < 2) {
    spPauliMsg('✗ Aufbau: primero completa el 1s (menor energía) antes del 2s.', false); return;
  }
  if (nombre === '2p' && (o['1s'][0].length < 2 || o['2s'][0].length < 2)) {
    spPauliMsg('✗ Aufbau: completa 1s y 2s antes de empezar el 2p.', false); return;
  }

  if (orb.length >= 2) { spPauliMsg('✗ Ese orbital ya está lleno (2 electrones).', false); return; }
  if (orb.length === 1 && orb[0] === s) {
    spPauliMsg('✗ Pauli: dos electrones en el mismo orbital deben tener espines OPUESTOS. Usa ' + (s>0?'↓':'↑') + '.', false); return;
  }

  /* Regla de Hund en 2p: no apiles un segundo electrón hasta que las 3
     cajas tengan al menos uno. */
  if (nombre === '2p' && orb.length === 1) {
    const algunaVacia = o['2p'].some(c => c.length === 0);
    if (algunaVacia) {
      spPauliMsg('✗ Regla de Hund: primero coloca UN electrón en cada orbital 2p antes de emparejar.', false); return;
    }
  }

  orb.push(s);
  spPauliMsg('✔ Electrón colocado en ' + nombre + '.', true);
  spState.ultimaCaja = nombre + '-' + idx;   /* para animar la caja que recibió el e⁻ */
  spPauliRender();
  spPauliCheck();
}

function spPauliMsg(txt, ok) {
  const el = document.getElementById('sp-pauli-estado');
  if (!el) return;
  el.textContent = txt;
  el.className = 'sp-estado ' + (ok ? 'ok' : 'err');
}

/* Dibuja las cajas de orbitales con sus electrones */
function spPauliRender() {
  const dibujarGrupo = (nombre, contId) => {
    const cont = document.getElementById(contId);
    if (!cont) return;
    cont.innerHTML = spState.orbitales[nombre].map((orb, i) => {
      const flechas = orb.map(s => `<span class="sp-e ${s>0?'up':'down'}">${s>0?'↑':'↓'}</span>`).join('');
      /* Marca la caja recién llenada para animarla (clase "recibe") */
      const recibe = (spState.ultimaCaja === nombre + '-' + i) ? ' recibe' : '';
      return `<div class="sp-orbital-caja${recibe}" onclick="spPauliColocar('${nombre}',${i})">${flechas}</div>`;
    }).join('');
  };
  dibujarGrupo('1s', 'sp-orb-1s');
  dibujarGrupo('2s', 'sp-orb-2s');
  dibujarGrupo('2p', 'sp-orb-2p');
  /* La marca de animación se consume en este render; se limpia para que no
     se repita en el próximo redibujado. */
  spState.ultimaCaja = null;

  const total = spPauliTotal();
  const cont = document.getElementById('sp-orbital-conteo');
  if (cont) cont.textContent = `Electrones: ${total} / ${spState.objElectrones}  ·  n=2: ${spPauliN2()}/8`;
  spProgreso(total / spState.objElectrones, total + ' / ' + spState.objElectrones + ' electrones');
}

function spPauliTotal() {
  let t = 0;
  for (const k in spState.orbitales) spState.orbitales[k].forEach(o => t += o.length);
  return t;
}
function spPauliN2() {
  let t = 0;
  spState.orbitales['2s'].forEach(o => t += o.length);
  spState.orbitales['2p'].forEach(o => t += o.length);
  return t;
}

function spPauliCheck() {
  if (spState.completado || spState._atomoListo) return;
  /* Solo cuenta como completo cuando TODOS los electrones del átomo están
     colocados (no al llenar un único orbital/estado de energía). */
  if (spPauliTotal() < spState.objElectrones) return;

  const esUltimo = spState.atomoIdx >= spState.atomosSeq.length - 1;
  if (esUltimo) {
    spRetoCumplido('¡' + spState.objNombre + ' completo! Con solo dos espines por orbital se construye toda la tabla periódica.');
    return;
  }

  /* Átomo completo: NO se avanza solo. Se marca como listo y se ofrece un
     botón para que el usuario pase al siguiente átomo cuando quiera. */
  spState._atomoListo = true;
  spPauliMsg('✔ ¡' + spState.objNombre + ' construido! Pulsa «Siguiente átomo» para continuar.', true);
  const grande = document.getElementById('sp-atomo-grande');
  if (grande) grande.classList.add('celebra');
  const cont = document.getElementById('sp-logro-cont');
  if (cont) {
    cont.innerHTML = `
      <div class="sp-exito">
        <span class="sp-exito-icon">✓</span>
        <span>${spState.objNombre} construido correctamente.</span>
      </div>
      <button class="sp-btn sp-btn-next" onclick="spPauliSiguienteAtomo()">Siguiente átomo →</button>`;
    cont.classList.remove('hidden');
    try { cont.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
  }
}

/* Avance MANUAL al siguiente átomo (botón «Siguiente átomo →») */
function spPauliSiguienteAtomo() {
  if (!spState._atomoListo) return;
  spState.atomoIdx++;
  spPauliCargarAtomo();
  spState._atomoListo = false;
  spState.ultimaCaja = null;
  const grande = document.getElementById('sp-atomo-grande');
  if (grande) grande.classList.remove('celebra');
  const cont = document.getElementById('sp-logro-cont');
  if (cont) { cont.innerHTML = ''; cont.classList.add('hidden'); }
  spPauliRenderReto();
  spPauliRender();
  spPauliMsg('', true);
}


/* ════════════════════════════════════════════════════════
   NIVEL 1.4 — EL MOMENTO MAGNÉTICO (El imán electrónico)
   El espín genera un momento magnético: el electrón es un
   pequeño imán. Invertir el espín invierte el campo. Un campo
   externo B separa los dos estados en energía: ΔE = 2μB.
   ════════════════════════════════════════════════════════ */
function spNivelMagnetico(body) {
  document.getElementById('sp-instruccion').textContent =
    'Nivel 1.4 · Momento Magnético — El espín del electrón lo convierte en un imán diminuto. Explora su campo y cómo responde a un campo externo.';

  spState.completado = false;
  spState.spin = +1;
  spState.campoExt = 0;      /* 0..1 intensidad del campo externo */
  spState.campoOn = false;
  spState.precesion = 0;     /* fase de precesión de Larmor */
  /* Reto dinámico: acierta 3 "objetivos" de energía ΔE combinando campo + espín.
     Cada objetivo pide un ΔE concreto; hay que mantenerlo ~0.6 s para anotar. */
  spState.objetivos = [0.6, 1.2, 1.8];
  spState.objIdx = 0;
  spState.dentroDesde = 0;
  spState.aciertos = 0;

  body.innerHTML = `
    <div class="sp-wrap">
      <div class="sp-panel">
        <div class="sp-panel-card">
          <div class="sp-panel-title">Reto <span id="sp-mag-n" style="color:#80d8ff">1/3</span></div>
          <div class="sp-reto" id="sp-reto-txt">—</div>
          <div class="sp-prog-wrap"><div class="sp-prog-barra" id="sp-prog-barra"></div></div>
          <div class="sp-prog-lbl" id="sp-prog-lbl">0 / 3 sintonías</div>
        </div>

        <div class="sp-panel-card">
          <div class="sp-panel-title">Sintoniza el imán</div>
          <div class="sp-ms-medidor" id="sp-mu-medidor">μ ↓ (espín ↑): N arriba</div>
          <button class="sp-btn sp-btn-accion" onclick="spMagInvertir()">🔁 Invertir espín</button>
          <div class="sp-ctrl-row">
            <span>Campo B</span>
            <input type="range" id="sp-mag-slider" min="0" max="100" value="0" oninput="spMagSlider(this.value)">
          </div>
          <div class="sp-energia" id="sp-energia">ΔE = 0.00</div>
          <div class="sp-hint">Ajusta el campo (y el espín) para que el <b>ΔE</b> coincida con el objetivo. El electrón <b>precesa</b> más rápido cuanto mayor es el campo (precesión de Larmor).</div>
        </div>

        <div class="sp-panel-card">
          <div class="sp-panel-title">¿Por qué ocurre?</div>
          <div class="sp-hint">
            Una carga que "gira" (el espín) genera un <strong>momento magnético</strong>: el
            electrón se comporta como un imán. En un campo externo, los estados ↑ y ↓ dejan
            de tener la misma energía y se <strong>separan</strong> (ΔE = 2μB). Este
            desdoblamiento es el origen del <strong>magnetismo</strong> de los materiales y de
            técnicas como la resonancia magnética.
          </div>
        </div>

        <div class="sp-logro-cont hidden" id="sp-logro-cont"></div>
      </div>

      <div class="sp-canvas-wrap">
        <canvas id="sp-canvas" class="sp-canvas"></canvas>
        <div class="sp-canvas-legend">
          <span style="color:#4fc3f7">N polo norte</span>
          <span style="color:#ff8a80">S polo sur</span>
          <span style="color:#80d8ff">⬆ campo externo</span>
        </div>
      </div>
    </div>
  `;

  const cv = document.getElementById('sp-canvas');
  spState.canvas = cv; spState.ctx = cv.getContext('2d');
  spAjustarCanvasActivo();
  window.addEventListener('resize', spAjustarCanvasActivo);

  spMagNuevoObjetivo();
  spMagActualizarEnergia();
  spMagLoop();
}

function spMagInvertir() {
  spState.spin *= -1;
  spMagActualizarEnergia();
}

function spMagSlider(v) {
  spState.campoExt = v / 100;
  spState.campoOn = spState.campoExt > 0;
  spMagActualizarEnergia();
}

/* ΔE actual del sistema (energía de desdoblamiento Zeeman, 0..2) */
function spMagDE() {
  const B = spState.campoOn ? spState.campoExt : 0;
  return 2 * B;
}

function spMagNuevoObjetivo() {
  const t = spState.objetivos[spState.objIdx];
  spState.dentroDesde = 0;
  const n = document.getElementById('sp-mag-n');
  if (n) n.textContent = (spState.objIdx + 1) + '/' + spState.objetivos.length;
  spSetReto('Sintoniza <b>ΔE ≈ ' + t.toFixed(1) + '</b> ajustando el campo B. Mantenlo en el objetivo un instante.');
}

function spMagActualizarEnergia() {
  const dE = spMagDE();
  const el = document.getElementById('sp-energia');
  if (el) el.textContent = `ΔE = ${dE.toFixed(2)}  ·  objetivo ${spState.objetivos[spState.objIdx].toFixed(1)}`;
  const mu = document.getElementById('sp-mu-medidor');
  if (mu) mu.textContent = spState.spin > 0 ? 'μ ↓ (espín ↑): N arriba' : 'μ ↑ (espín ↓): N abajo';
}

function spMagLoop() {
  spRAF = requestAnimationFrame(spMagLoop);
  const st = spState, ctx = st.ctx, cv = st.canvas;
  if (!ctx || !cv) return;
  const W = cv.width, H = cv.height;
  mjGridBackground(ctx, W, H);

  const cx = W/2, cy = H/2;
  const arriba = st.spin > 0;

  /* Precesión de Larmor: gira más rápido con el campo (dinamismo) */
  const dE = spMagDE();
  st.precesion += 0.03 + dE * 0.14;

  /* ── Reto: mantener ΔE cerca del objetivo para "sintonizar" ── */
  if (!st.completado) {
    const obj = st.objetivos[st.objIdx];
    const cerca = Math.abs(dE - obj) < 0.12;
    if (cerca) {
      st.dentroDesde++;
      if (st.dentroDesde > 36 && !st._avanzando) {   /* ~0.6 s dentro */
        st._avanzando = true;
        st.aciertos++;
        spProgreso(st.aciertos / st.objetivos.length, st.aciertos + ' / ' + st.objetivos.length + ' sintonías');
        if (st.aciertos >= st.objetivos.length) {
          spRetoCumplido('¡Imán cuántico dominado! El espín es un dipolo magnético y el campo externo controla su energía (ΔE = 2μB).');
        } else {
          spFlashSp('✔ ¡Sintonizado en ΔE ≈ ' + obj.toFixed(1) + '!');
          setTimeout(() => { st.objIdx++; st.dentroDesde = 0; st._avanzando = false; spMagNuevoObjetivo(); spMagActualizarEnergia(); }, 900);
        }
      }
    } else {
      st.dentroDesde = 0;
    }

    /* Medidor de sintonía: barra con marca del objetivo */
    const bw = 220, bx = cx - bw/2, by = 20;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(bx, by, bw, 8);
    ctx.fillStyle = cerca ? '#00e676' : '#4fc3f7';
    ctx.fillRect(bx, by, bw * Math.min(dE/2, 1), 8);
    /* Marca del objetivo */
    const ox = bx + bw * (obj/2);
    ctx.strokeStyle = '#ffd740'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ox, by-4); ctx.lineTo(ox, by+12); ctx.stroke();
    ctx.fillStyle = cerca ? '#69ffa6' : '#cbb6ff'; ctx.font = '11px "Exo 2",sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(cerca ? '¡En el objetivo! mantenlo…' : 'ΔE objetivo ▲', cx, by - 6);
    ctx.restore();
  }

  /* Campo externo (flechas azules de fondo) */
  if (st.campoOn && st.campoExt > 0) {
    ctx.save();
    const a = 0.12 + st.campoExt * 0.3;
    ctx.strokeStyle = `rgba(79,195,247,${a})`; ctx.fillStyle = `rgba(79,195,247,${a})`; ctx.lineWidth = 2;
    for (let x = 40; x < W; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, H-26); ctx.lineTo(x, 26); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, 26); ctx.lineTo(x-5, 38); ctx.lineTo(x+5, 38); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  /* Líneas de campo del dipolo del electrón (polo N arriba si espín ↑) */
  const polaridad = arriba ? -1 : 1;   /* N hacia −y cuando spin ↑ */
  ctx.save();
  ctx.strokeStyle = 'rgba(128,216,255,0.5)'; ctx.lineWidth = 1.5;
  for (let k = 1; k <= 3; k++) {
    const r = 36 + k * 26;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r*0.62, r, 0, 0, Math.PI*2);
    ctx.stroke();
  }
  /* Flechas de sentido en las líneas (salen del N, entran al S) */
  ctx.fillStyle = 'rgba(128,216,255,0.8)';
  for (let k = 1; k <= 3; k++) {
    const r = 36 + k * 26;
    const yx = cx + r*0.62, yy = cy;
    ctx.save(); ctx.translate(yx, yy);
    ctx.beginPath();
    ctx.moveTo(0, polaridad*-6); ctx.lineTo(-5, polaridad*6); ctx.lineTo(5, polaridad*6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  /* Cuerpo del electrón como barra imán (N/S) */
  ctx.save();
  ctx.shadowColor = '#00b0ff'; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI*2);
  const g = ctx.createRadialGradient(cx-8, cy-8, 0, cx, cy, 30);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#29b6f6'); g.addColorStop(1, '#0277bd');
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();

  /* Etiquetas de polo según el espín */
  ctx.save();
  ctx.font = 'bold 13px "Orbitron",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const yN = arriba ? cy - 46 : cy + 46;
  const yS = arriba ? cy + 46 : cy - 46;
  ctx.fillStyle = '#4fc3f7'; ctx.fillText('N', cx, yN);
  ctx.fillStyle = '#ff8a80'; ctx.fillText('S', cx, yS);
  ctx.fillStyle = '#06121f'; ctx.fillText('e⁻', cx, cy);
  ctx.restore();

  /* Flecha de espín con PRECESIÓN de Larmor (oscila más rápido con el campo) */
  ctx.save();
  const col = arriba ? '#4fc3f7' : '#ff8a80';
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round';
  const dir = arriba ? -1 : 1;
  const sx = cx + 54 + Math.sin(st.precesion) * (4 + dE * 10);   /* vaivén lateral */
  ctx.beginPath(); ctx.moveTo(cx+54, cy); ctx.lineTo(sx, cy + dir*54); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx, cy + dir*54); ctx.lineTo(sx-7, cy + dir*40); ctx.lineTo(sx+7, cy + dir*40); ctx.closePath(); ctx.fill();
  /* Elipse de precesión en la punta */
  ctx.globalAlpha = 0.3;
  ctx.beginPath(); ctx.ellipse(cx+54, cy + dir*54, 10 + dE*8, 4, 0, 0, Math.PI*2); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = col; ctx.font = '11px "Exo 2",sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('espín', cx+54, cy + dir*72);
  ctx.restore();

  /* Diagrama de niveles de energía (desdoblamiento Zeeman) a la derecha */
  spMagNivelesEnergia(ctx, W, H);

  spDibujarFlash(ctx, W, H);
}

/* Pequeño diagrama de los dos niveles de energía separándose con B */
function spMagNivelesEnergia(ctx, W, H) {
  const st = spState;
  const bx = W - 92, by = H/2, sep = (st.campoOn ? st.campoExt : 0) * 46;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
  ctx.beginPath(); ctx.moveTo(bx-30, by); ctx.lineTo(bx+30, by); ctx.stroke();
  ctx.setLineDash([]);
  /* Nivel ↑ (más alto si se alinea en contra; cualitativo) */
  ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(bx-24, by - sep); ctx.lineTo(bx+24, by - sep); ctx.stroke();
  ctx.strokeStyle = '#ff8a80';
  ctx.beginPath(); ctx.moveTo(bx-24, by + sep); ctx.lineTo(bx+24, by + sep); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '10px "Exo 2",sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('energía', bx, by - 58);
  ctx.fillText('↑', bx + 40, by - sep);
  ctx.fillText('↓', bx + 40, by + sep);
  ctx.restore();
}


/* ╔══════════════════════════════════════════════════════════╗
   ║  ETAPA 2 — El espín de TODOS los fermiones y decaimientos  ║
   ╚══════════════════════════════════════════════════════════╝ */

/* Catálogo de fermiones del Modelo Estándar (todos espín 1/2) */
const SP_FERMIONES = [
  { sym:'e⁻',  nom:'electrón',    tipo:'leptón', col:'#4fc3f7' },
  { sym:'μ⁻',  nom:'muón',        tipo:'leptón', col:'#4fc3f7' },
  { sym:'τ⁻',  nom:'tau',         tipo:'leptón', col:'#4fc3f7' },
  { sym:'νₑ',  nom:'neutrino e',  tipo:'leptón', col:'#80d8ff' },
  { sym:'u',   nom:'quark up',    tipo:'quark',  col:'#ff8a80' },
  { sym:'d',   nom:'quark down',  tipo:'quark',  col:'#ff8a80' },
  { sym:'s',   nom:'quark strange',tipo:'quark', col:'#ffb74d' },
  { sym:'c',   nom:'quark charm', tipo:'quark',  col:'#ffb74d' },
  { sym:'b',   nom:'quark bottom',tipo:'quark',  col:'#ba68c8' },
  { sym:'t',   nom:'quark top',   tipo:'quark',  col:'#ba68c8' },
];

/* ── MÓDULO A — La Familia del Espín 1/2 (analizador de espín) ──
   Dinámico: elige un fermión y DISPÁRALO al analizador; vuela por el canvas
   y se DIVIDE en dos haces (↑/↓), demostrando que todos tienen espín 1/2.
   Reto: pasar los 10 fermiones por el analizador. */
function spModFamilia(body) {
  document.getElementById('sp-instruccion').textContent =
    'Módulo A · La Familia del Espín 1/2 — Dispara cada fermión al analizador y verás que SIEMPRE se divide en dos (↑/↓): todos son espín 1/2.';

  spState.completado = false;
  spState.medidos = new Set();
  spState.famSel = 0;          /* fermión seleccionado en la tira */
  spState.famVuelo = [];       /* partículas en vuelo por el analizador */
  spState.famTick = 0;

  body.innerHTML = `
    <div class="sp-wrap">
      <div class="sp-panel">
        <div class="sp-panel-card">
          <div class="sp-panel-title">Reto</div>
          <div class="sp-reto" id="sp-reto-txt">Pasa los <b>${SP_FERMIONES.length}</b> fermiones por el analizador de espín. Elige uno y dispáralo.</div>
          <div class="sp-prog-wrap"><div class="sp-prog-barra" id="sp-prog-barra"></div></div>
          <div class="sp-prog-lbl" id="sp-prog-lbl">0 / ${SP_FERMIONES.length} analizados</div>
          <div class="sp-estado" id="sp-fam-estado"></div>
        </div>
        <div class="sp-panel-card">
          <div class="sp-panel-title">Disparar</div>
          <button class="sp-btn sp-btn-accion" onclick="spFamDisparar()">▶ Disparar fermión seleccionado</button>
          <div class="sp-hint">Toca un fermión abajo para seleccionarlo (el seleccionado se resalta).</div>
        </div>
        <div class="sp-panel-card">
          <div class="sp-panel-title">¿Por qué ocurre?</div>
          <div class="sp-hint">
            <strong>Todos</strong> los fermiones del Modelo Estándar tienen espín <strong>1/2</strong>:
            por eso el haz siempre se parte en <strong>dos</strong> (↑ y ↓). Lo que distingue a un
            electrón de un quark top no es el espín, sino su <strong>masa</strong> y su
            <strong>sabor</strong>. Espín 1/2 es la definición de fermión.
          </div>
        </div>
        <div class="sp-logro-cont hidden" id="sp-logro-cont"></div>
      </div>

      <div class="sp-canvas-wrap">
        <canvas id="sp-canvas" class="sp-canvas"></canvas>
        <div class="sp-fam-tira" id="sp-fam-tira">
          ${SP_FERMIONES.map((f,i) => `
            <button class="sp-ferm-mini ${i===0?'sel':''}" style="--fc:${f.col}" onclick="spFamSel(${i})" id="sp-ferm-${i}" title="${f.nom}">
              ${f.sym}
            </button>`).join('')}
        </div>
      </div>
    </div>
  `;

  const cv = document.getElementById('sp-canvas');
  spState.canvas = cv; spState.ctx = cv.getContext('2d');
  spAjustarCanvasActivo();
  window.addEventListener('resize', spAjustarCanvasActivo);
  spProgreso(0, '0 / ' + SP_FERMIONES.length + ' analizados');
  spFamLoop();
}

function spFamSel(i) {
  spState.famSel = i;
  SP_FERMIONES.forEach((_, k) => {
    const b = document.getElementById('sp-ferm-' + k);
    if (b) b.classList.toggle('sel', k === i);
  });
}

function spFamDisparar() {
  if (spState.completado) return;
  const i = spState.famSel;
  const f = SP_FERMIONES[i];
  const H = spState.canvas ? spState.canvas.height : 360;
  /* Se emiten DOS copias (una con espín ↑, otra ↓) para visualizar la división */
  spState.famVuelo.push({ idx:i, x:40, y:H/2, spin:+1, dividido:false });
  spState.famVuelo.push({ idx:i, x:40, y:H/2, spin:-1, dividido:false });
  spState.famDisparado = i;
}

function spFamLoop() {
  spRAF = requestAnimationFrame(spFamLoop);
  const st = spState, ctx = st.ctx, cv = st.canvas;
  if (!ctx || !cv) return;
  const W = cv.width, H = cv.height;
  mjGridBackground(ctx, W, H);
  const cy = H/2, analX = W*0.42, pantX = W - 44;

  /* Cañón emisor */
  ctx.save();
  const hg = ctx.createLinearGradient(18, 0, 44, 0);
  hg.addColorStop(0, '#3a3340'); hg.addColorStop(1, '#1b1726');
  ctx.fillStyle = hg; ctx.fillRect(18, cy-20, 26, 40);
  ctx.fillStyle = '#120d1c'; ctx.fillRect(40, cy-4, 8, 8);
  ctx.restore();

  /* Analizador de espín (imán N/S) */
  ctx.save();
  ctx.fillStyle = 'rgba(79,195,247,0.85)'; ctx.fillRect(analX-24, cy-54, 48, 24);
  ctx.fillStyle = 'rgba(239,83,80,0.85)'; ctx.fillRect(analX-24, cy+30, 48, 24);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px "Orbitron",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('N', analX, cy-42); ctx.fillText('S', analX, cy+42);
  ctx.fillStyle = 'rgba(128,216,255,0.5)'; ctx.font = '10px "Exo 2",sans-serif';
  ctx.fillText('analizador', analX, cy+72);
  ctx.restore();

  /* Pantalla */
  ctx.save();
  ctx.strokeStyle = 'rgba(128,216,255,0.5)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(pantX, 26); ctx.lineTo(pantX, H-26); ctx.stroke();
  ctx.fillStyle = 'rgba(79,195,247,0.6)'; ctx.font = '11px "Orbitron",monospace'; ctx.textAlign='center';
  ctx.fillText('↑', pantX, cy-70); ctx.fillText('↓', pantX, cy+70);
  ctx.restore();

  /* Mover y dibujar fermiones en vuelo.
     La deflexión vertical se calcula para que ambas copias aterricen en
     dos bandas a cy ± banda, bien dentro del canvas (no en los bordes). */
  const banda = Math.min(90, H * 0.22);
  st.famVuelo.forEach(p => {
    p.x += 3.2;
    if (p.x > analX && !p.dividido) {
      p.dividido = true;
      /* vy tal que al llegar a la pantalla la copia esté a cy ± banda */
      const tramo = Math.max(1, pantX - analX);
      p.vy = (p.spin * -banda) / (tramo / 3.2);   /* 3.2 = velocidad horizontal */
    }
    if (p.dividido) p.y += p.vy;
    /* impacto */
    if (p.x >= pantX && !p.impacto) {
      p.impacto = true; p.y = Math.max(30, Math.min(H-30, p.y));
      if (!st.medidos.has(p.idx)) {
        st.medidos.add(p.idx);
        const f = SP_FERMIONES[p.idx];
        const btn = document.getElementById('sp-ferm-' + p.idx);
        if (btn) btn.classList.add('medido');
        const est = document.getElementById('sp-fam-estado');
        if (est) { est.textContent = f.nom + ' → se dividió en dos: espín 1/2.'; est.className = 'sp-estado ok'; }
        spProgreso(st.medidos.size / SP_FERMIONES.length, st.medidos.size + ' / ' + SP_FERMIONES.length + ' analizados');
        if (st.medidos.size >= SP_FERMIONES.length) {
          spRetoCumplido('Los 10 fermiones se dividieron en dos: TODOS tienen espín 1/2. Lo que cambia es masa y sabor.');
        }
      }
    }
    const f = SP_FERMIONES[p.idx];
    ctx.save();
    ctx.shadowColor = f.col; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(p.x, p.y, 13, 0, Math.PI*2);
    const g = ctx.createRadialGradient(p.x-4, p.y-4, 0, p.x, p.y, 13);
    g.addColorStop(0,'#fff'); g.addColorStop(0.4, f.col); g.addColorStop(1, f.col);
    ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = '#06121f'; ctx.font = 'bold 9px "Orbitron",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(f.sym, p.x, p.y);
    ctx.restore();
  });
  /* Limpiar los que ya impactaron hace rato */
  st.famVuelo = st.famVuelo.filter(p => p.x < pantX + 6);

  spDibujarFlash(ctx, W, H);
}

/* ── MÓDULO B — Conservación del Espín en Decaimientos ──
   Dinámico: elige un decaimiento, LÁNZALO (el muón explota y dispara sus
   productos con sus flechas de espín) y decide si está permitido.
   `prod` = lista de productos { sym, col, spin:1 bosón? }. */
const SP_DECAIM = [
  { txt:'μ⁻ → e⁻ + ν̄ₑ + ν_μ', ok:true,
    prod:[{sym:'e⁻',col:'#4fc3f7'},{sym:'ν̄ₑ',col:'#80d8ff'},{sym:'ν_μ',col:'#80d8ff'}],
    exp:'✔ Permitido: tres espines 1/2 pueden sumar 1/2, y se conservan carga y número leptónico (los dos neutrinos equilibran los sabores).' },
  { txt:'μ⁻ → e⁻ + γ', ok:false,
    prod:[{sym:'e⁻',col:'#4fc3f7'},{sym:'γ',col:'#ffd740',boson:true}],
    exp:'✗ Prohibido: el fotón tiene espín 1; 1/2 ≠ 1/2 ⊕ 1. Además viola la conservación del sabor leptónico.' },
  { txt:'μ⁻ → e⁻ + ν_μ', ok:false,
    prod:[{sym:'e⁻',col:'#4fc3f7'},{sym:'ν_μ',col:'#80d8ff'}],
    exp:'✗ Prohibido: faltaría un antineutrino. Hacen falta DOS neutrinos para conservar el número leptónico de cada familia.' },
  { txt:'μ⁻ → e⁻ + e⁺ + e⁻', ok:true,
    prod:[{sym:'e⁻',col:'#4fc3f7'},{sym:'e⁺',col:'#ff8a80'},{sym:'e⁻',col:'#4fc3f7'}],
    exp:'✔ Posible por espín/carga (muy raro en la práctica): tres fermiones 1/2 y carga −1 total. El espín sí cuadra.' },
];

function spModDecaim(body) {
  document.getElementById('sp-instruccion').textContent =
    'Módulo B · Conservación del Espín — Lanza cada decaimiento del muón, observa los productos y decide si está PERMITIDO.';

  spState.completado = false;
  spState.decResueltos = new Set();
  spState.decSel = 0;
  spState.decAnim = null;    /* animación de explosión en curso */
  spState.decFrag = [];      /* fragmentos (productos) volando */

  body.innerHTML = `
    <div class="sp-wrap">
      <div class="sp-panel">
        <div class="sp-panel-card">
          <div class="sp-panel-title">Reto</div>
          <div class="sp-reto" id="sp-reto-txt">Elige un decaimiento, lánzalo y decide si está <b>permitido</b>. El muón tiene espín 1/2.</div>
          <div class="sp-prog-wrap"><div class="sp-prog-barra" id="sp-prog-barra"></div></div>
          <div class="sp-prog-lbl" id="sp-prog-lbl">0 / ${SP_DECAIM.length}</div>
        </div>

        <div class="sp-panel-card">
          <div class="sp-panel-title">Decaimiento</div>
          <div class="sp-dec-selector" id="sp-dec-selector">
            ${SP_DECAIM.map((d,i) => `
              <button class="sp-dec-opt ${i===0?'sel':''}" id="sp-dec-opt-${i}" onclick="spDecSel(${i})">${d.txt}</button>
            `).join('')}
          </div>
          <button class="sp-btn sp-btn-accion" onclick="spDecLanzar()">💥 Lanzar decaimiento</button>
          <div class="sp-dec-decidir" id="sp-dec-decidir" style="display:none">
            <button class="sp-btn sp-dec-si" onclick="spDecResp(true)">Permitido</button>
            <button class="sp-btn sp-dec-no" onclick="spDecResp(false)">Prohibido</button>
          </div>
          <div class="sp-dec-exp" id="sp-dec-exp"></div>
        </div>

        <div class="sp-panel-card">
          <div class="sp-panel-title">¿Por qué ocurre?</div>
          <div class="sp-hint">
            Un decaimiento solo es posible si los espines <strong>pueden sumar</strong> el
            del muón (1/2). Reglas:<br>
            • Varios fermiones (cada uno espín 1/2) <strong>sí</strong> pueden combinarse para dar 1/2.<br>
            • Un fotón tiene espín <strong>1</strong>: no cuadra con el 1/2 del muón.<br>
            • Además, por cada electrón creado debe aparecer su <strong>neutrino</strong>
            (eso es "conservar el número leptónico"); por eso hacen falta dos neutrinos.
          </div>
        </div>
        <div class="sp-logro-cont hidden" id="sp-logro-cont"></div>
      </div>

      <div class="sp-canvas-wrap">
        <canvas id="sp-canvas" class="sp-canvas"></canvas>
        <div class="sp-canvas-legend">
          <span style="color:#ba68c8">μ⁻ (espín 1/2)</span>
          <span style="color:#4fc3f7">fermión (espín 1/2)</span>
          <span style="color:#ffd740">bosón γ (espín 1)</span>
        </div>
      </div>
    </div>
  `;

  const cv = document.getElementById('sp-canvas');
  spState.canvas = cv; spState.ctx = cv.getContext('2d');
  spAjustarCanvasActivo();
  window.addEventListener('resize', spAjustarCanvasActivo);
  spProgreso(0, '0 / ' + SP_DECAIM.length);
  spDecLoop();
}

function spDecSel(i) {
  if (spState.completado) return;
  spState.decSel = i;
  /* Al cambiar de decaimiento, se limpia la animación/productos anteriores */
  spState.decAnim = null;
  spState.decFrag = [];
  SP_DECAIM.forEach((_, k) => {
    const b = document.getElementById('sp-dec-opt-' + k);
    if (b) b.classList.toggle('sel', k === i);
  });
  const exp = document.getElementById('sp-dec-exp'); if (exp) { exp.textContent = ''; exp.className = 'sp-dec-exp'; }
  const dec = document.getElementById('sp-dec-decidir'); if (dec) dec.style.display = 'none';
}

function spDecLanzar() {
  if (spState.completado) return;
  const d = SP_DECAIM[spState.decSel];
  const cv = spState.canvas; if (!cv) return;
  const cx = cv.width/2, cy = cv.height/2;
  const n = d.prod.length;
  /* Crear fragmentos saliendo radialmente del muón */
  spState.decFrag = d.prod.map((p, k) => {
    const ang = (-Math.PI/2) + (k - (n-1)/2) * (Math.PI/2.4);  /* abanico */
    return {
      sym:p.sym, col:p.col, boson:!!p.boson,
      x:cx, y:cy, vx:Math.cos(ang)*2.6, vy:Math.sin(ang)*2.6,
      spin: p.boson ? 0 : (Math.random()<0.5?1:-1)
    };
  });
  spState.decAnim = { t:0, cx, cy };
  /* Mostrar botones de decisión tras un instante */
  setTimeout(() => { const dec = document.getElementById('sp-dec-decidir'); if (dec) dec.style.display = 'flex'; }, 600);
}

function spDecResp(resp) {
  if (spState.completado) return;
  const i = spState.decSel;
  if (spState.decResueltos.has(i)) return;
  const d = SP_DECAIM[i];
  const acerto = (resp === d.ok);
  const exp = document.getElementById('sp-dec-exp');
  if (exp) { exp.innerHTML = (acerto ? '' : '<b>No exactamente.</b> ') + d.exp; exp.className = 'sp-dec-exp ' + (acerto ? 'ok' : 'err'); }

  if (acerto) {
    spState.decResueltos.add(i);
    const opt = document.getElementById('sp-dec-opt-' + i);
    if (opt) opt.classList.add('resuelto');
    spProgreso(spState.decResueltos.size / SP_DECAIM.length, spState.decResueltos.size + ' / ' + SP_DECAIM.length);
    const dec = document.getElementById('sp-dec-decidir'); if (dec) dec.style.display = 'none';
    if (spState.decResueltos.size >= SP_DECAIM.length) {
      spRetoCumplido('¡Dominas la conservación del espín! Es la regla que decide qué decaimientos son posibles.');
    }
  }
  /* Si falla, puede volver a decidir (los botones siguen visibles) */
}

function spDecLoop() {
  spRAF = requestAnimationFrame(spDecLoop);
  const st = spState, ctx = st.ctx, cv = st.canvas;
  if (!ctx || !cv) return;
  const W = cv.width, H = cv.height;
  mjGridBackground(ctx, W, H);
  const cx = W/2, cy = H/2;

  const hayAnim = st.decAnim && st.decFrag.length;
  if (hayAnim) st.decAnim.t++;

  /* Muón central: late mientras no se ha lanzado; se "apaga" al explotar */
  if (!hayAnim || st.decAnim.t < 10) {
    const pulso = 1 + Math.sin(Date.now()*0.005) * 0.1;
    ctx.save();
    ctx.shadowColor = '#ba68c8'; ctx.shadowBlur = 22;
    ctx.beginPath(); ctx.arc(cx, cy, 26*pulso, 0, Math.PI*2);
    const g = ctx.createRadialGradient(cx-8, cy-8, 0, cx, cy, 26);
    g.addColorStop(0,'#fff'); g.addColorStop(0.4,'#ba68c8'); g.addColorStop(1,'#7b1fa2');
    ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle='#120d1c'; ctx.font='bold 14px "Orbitron",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('μ⁻', cx, cy);
    ctx.restore();
    /* flecha de espín del muón */
    ctx.save();
    ctx.strokeStyle='#ce93d8'; ctx.fillStyle='#ce93d8'; ctx.lineWidth=4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx+40, cy+22); ctx.lineTo(cx+40, cy-30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+40, cy-30); ctx.lineTo(cx+34, cy-18); ctx.lineTo(cx+46, cy-18); ctx.closePath(); ctx.fill();
    ctx.font='10px "Exo 2",sans-serif'; ctx.textAlign='center'; ctx.fillText('espín 1/2', cx+40, cy+34);
    ctx.restore();
  } else {
    /* Destello de explosión */
    if (st.decAnim.t < 26) {
      const f = 1 - (st.decAnim.t-10)/16;
      ctx.save(); ctx.globalAlpha = Math.max(0,f);
      ctx.beginPath(); ctx.arc(cx, cy, 24 + (1-f)*40, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(206,147,216,0.5)'; ctx.fill(); ctx.restore();
    }
  }

  /* Fragmentos (productos del decaimiento) */
  if (hayAnim) {
    st.decFrag.forEach(fr => {
      if (st.decAnim.t >= 10) { fr.x += fr.vx; fr.y += fr.vy; }
      /* rebote suave en bordes para que no salgan del lienzo */
      if (fr.x < 24 || fr.x > W-24) fr.vx *= -1;
      if (fr.y < 24 || fr.y > H-24) fr.vy *= -1;
      fr.x = Math.max(24, Math.min(W-24, fr.x));
      fr.y = Math.max(24, Math.min(H-24, fr.y));
      const r = fr.boson ? 15 : 13;
      ctx.save();
      ctx.shadowColor = fr.col; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(fr.x, fr.y, r, 0, Math.PI*2);
      const g = ctx.createRadialGradient(fr.x-4, fr.y-4, 0, fr.x, fr.y, r);
      g.addColorStop(0,'#fff'); g.addColorStop(0.4, fr.col); g.addColorStop(1, fr.col);
      ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle='#06121f'; ctx.font='bold 9px "Orbitron",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(fr.sym, fr.x, fr.y);
      ctx.restore();
      /* flecha de espín: 1/2 (fermión) o doble (bosón, espín 1) */
      ctx.save();
      ctx.strokeStyle = fr.col; ctx.fillStyle = fr.col; ctx.lineWidth = 2.5; ctx.lineCap='round';
      if (fr.boson) {
        /* bosón: flecha doble (espín 1) */
        ctx.beginPath(); ctx.moveTo(fr.x, fr.y - r - 4); ctx.lineTo(fr.x, fr.y - r - 22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(fr.x, fr.y - r - 22); ctx.lineTo(fr.x-4, fr.y - r - 14); ctx.lineTo(fr.x+4, fr.y - r - 14); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(fr.x+5, fr.y - r - 4); ctx.lineTo(fr.x+5, fr.y - r - 22); ctx.stroke();
      } else {
        const sdir = fr.spin > 0 ? -1 : 1;
        ctx.beginPath(); ctx.moveTo(fr.x, fr.y); ctx.lineTo(fr.x, fr.y + sdir*(r+16)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(fr.x, fr.y + sdir*(r+16)); ctx.lineTo(fr.x-4, fr.y + sdir*(r+6)); ctx.lineTo(fr.x+4, fr.y + sdir*(r+6)); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    });
  }

  spDibujarFlash(ctx, W, H);
}


/* ── MÓDULO C — Helicidad: espín y movimiento ──
   Partículas que viajan a la derecha; su espín proyectado sobre el movimiento
   da la helicidad. Reto: clasifica 4 casos según su helicidad. */
const SP_HELI = [
  { part:'e⁻ (masa)',   sinMasa:false, obj:'cualquiera',
    reto:'El electrón TIENE masa: su helicidad depende del observador. Puedes invertir el espín.',
    exp:'Con masa, siempre existe un sistema que viaja más rápido que la partícula y "ve" el espín al revés. La helicidad NO es absoluta.' },
  { part:'νₑ (sin masa*)', sinMasa:true, obj:'izquierda',
    reto:'El neutrino (sin masa en el ME) SIEMPRE tiene helicidad IZQUIERDA. Déjalo apuntando ← al movimiento.',
    exp:'Sin masa viaja a c: ningún observador lo adelanta, así que su helicidad es fija (izquierda). Es la clave de la violación de paridad en la fuerza débil.' },
  { part:'γ (fotón)',   sinMasa:true, obj:'derecha',
    reto:'El fotón no tiene masa: su helicidad es ±1, nunca 0. Alinéalo a la DERECHA del movimiento.',
    exp:'Al no tener masa, el fotón solo tiene helicidad +1 o −1 (sus dos polarizaciones). Nunca una proyección nula.' },
  { part:'μ⁻ (masa)',   sinMasa:false, obj:'cualquiera',
    reto:'El muón también tiene masa: su helicidad es relativa. Cámbiala libremente.',
    exp:'Igual que el electrón: con masa, la helicidad depende del sistema de referencia.' },
];

function spModHelicidad(body) {
  document.getElementById('sp-instruccion').textContent =
    'Módulo C · Helicidad — La helicidad es la proyección del espín sobre la dirección del movimiento. Depende de si la partícula tiene masa.';

  spState.completado = false;
  spState.heliIdx = 0;
  spState.heliSpin = +1;      /* +1 = espín en el sentido del movimiento (derecha) */
  spState.heliResueltos = 0;
  spState.vel = 2.2;
  spState.px = 0;

  body.innerHTML = `
    <div class="sp-wrap">
      <div class="sp-panel">
        <div class="sp-panel-card">
          <div class="sp-panel-title">Reto <span id="sp-heli-n" style="color:#80d8ff">1/${SP_HELI.length}</span></div>
          <div class="sp-reto" id="sp-reto-txt">—</div>
          <div class="sp-prog-wrap"><div class="sp-prog-barra" id="sp-prog-barra"></div></div>
          <div class="sp-prog-lbl" id="sp-prog-lbl">0 / ${SP_HELI.length}</div>
        </div>
        <div class="sp-panel-card">
          <div class="sp-panel-title">Control</div>
          <div class="sp-ms-medidor" id="sp-heli-med">helicidad: derecha (+)</div>
          <button class="sp-btn sp-btn-accion" onclick="spHeliInvertir()">🔁 Invertir espín</button>
          <button class="sp-btn sp-btn-accion" onclick="spHeliConfirmar()">✓ Confirmar helicidad</button>
          <div class="sp-estado" id="sp-heli-estado"></div>
        </div>
        <div class="sp-panel-card">
          <div class="sp-panel-title">¿Por qué ocurre?</div>
          <div class="sp-hint" id="sp-heli-porque">—</div>
        </div>
        <div class="sp-logro-cont hidden" id="sp-logro-cont"></div>
      </div>
      <div class="sp-canvas-wrap">
        <canvas id="sp-canvas" class="sp-canvas"></canvas>
        <div class="sp-canvas-legend">
          <span style="color:#80d8ff">→ movimiento</span>
          <span style="color:#4fc3f7">espín</span>
          <span style="color:#69ffa6">helicidad</span>
        </div>
      </div>
    </div>
  `;
  const cv = document.getElementById('sp-canvas');
  spState.canvas = cv; spState.ctx = cv.getContext('2d');
  spAjustarCanvasActivo();
  window.addEventListener('resize', spAjustarCanvasActivo);
  spHeliCargar();
  spHeliLoop();
}

function spHeliCargar() {
  const h = SP_HELI[spState.heliIdx];
  /* Las partículas SIN masa arrancan ya en su helicidad fija correcta
     (no se pueden invertir); las que tienen masa arrancan a la derecha
     y el usuario puede cambiarlas libremente (cualquiera vale). */
  if (h.sinMasa) spState.heliSpin = (h.obj === 'izquierda') ? -1 : +1;
  else           spState.heliSpin = +1;
  const n = document.getElementById('sp-heli-n');
  if (n) n.textContent = (spState.heliIdx + 1) + '/' + SP_HELI.length;
  spSetReto('<b>' + h.part + '</b> — ' + h.reto);
  const pq = document.getElementById('sp-heli-porque');
  if (pq) pq.innerHTML = h.exp;
  /* Limpiar el mensaje del caso anterior */
  const est = document.getElementById('sp-heli-estado');
  if (est) { est.textContent = ''; est.className = 'sp-estado'; }
  spHeliMed();
}

function spHeliInvertir() {
  const h = SP_HELI[spState.heliIdx];
  if (h.sinMasa) {
    spFlashSp('✗ Sin masa viaja a c: su helicidad es FIJA (ya está en la única posible). Pulsa «Confirmar».');
    return;
  }
  spState.heliSpin *= -1;
  spHeliMed();
}

function spHeliMed() {
  const el = document.getElementById('sp-heli-med');
  if (el) {
    const der = spState.heliSpin > 0;
    el.textContent = 'helicidad: ' + (der ? 'derecha (+)' : 'izquierda (−)');
    el.style.color = der ? '#4fc3f7' : '#ff8a80';
  }
}

function spHeliConfirmar() {
  if (spState.completado || spState.heliTransicion) return;
  const h = SP_HELI[spState.heliIdx];
  const der = spState.heliSpin > 0;
  let ok;
  if (h.obj === 'derecha')      ok = der;
  else if (h.obj === 'izquierda') ok = !der;
  else                            ok = true;   /* "cualquiera" (con masa) */

  const est = document.getElementById('sp-heli-estado');
  if (!ok) {
    if (est) { est.textContent = '✗ Esta partícula sin masa exige helicidad ' + h.obj + '. Ajústala.'; est.className = 'sp-estado err'; }
    return;
  }
  if (est) { est.textContent = '✔ Correcto.'; est.className = 'sp-estado ok'; }
  spState.heliResueltos++;
  spProgreso(spState.heliResueltos / SP_HELI.length, spState.heliResueltos + ' / ' + SP_HELI.length);
  if (spState.heliResueltos >= SP_HELI.length) {
    spRetoCumplido('¡Helicidad dominada! Sin masa → fija; con masa → relativa. Esto conecta con la violación de paridad.');
  } else {
    /* Mostrar "Correcto" un momento ANTES de cargar el siguiente caso
       (spHeliCargar limpia el mensaje). Bloquear confirmar durante la pausa. */
    spState.heliTransicion = true;
    spState.heliIdx++;
    setTimeout(() => { spState.heliTransicion = false; spHeliCargar(); }, 1100);
  }
}

function spHeliLoop() {
  spRAF = requestAnimationFrame(spHeliLoop);
  const st = spState, ctx = st.ctx, cv = st.canvas;
  if (!ctx || !cv) return;
  const W = cv.width, H = cv.height;
  mjGridBackground(ctx, W, H);
  const cy = H/2;
  const h = SP_HELI[st.heliIdx];

  /* La partícula avanza en bucle hacia la derecha */
  st.px += st.vel;
  if (st.px > W + 40) st.px = -40;
  const x = st.px;

  /* Flecha de movimiento (de fondo) */
  ctx.save();
  ctx.strokeStyle = 'rgba(128,216,255,0.25)'; ctx.fillStyle = 'rgba(128,216,255,0.25)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(30, cy+54); ctx.lineTo(W-30, cy+54); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W-30, cy+54); ctx.lineTo(W-42, cy+48); ctx.lineTo(W-42, cy+60); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(128,216,255,0.5)'; ctx.font = '11px "Exo 2",sans-serif'; ctx.textAlign='center';
  ctx.fillText('dirección del movimiento →', W/2, cy+72);
  ctx.restore();

  /* Partícula */
  const der = st.heliSpin > 0;
  const col = h.sinMasa ? '#80d8ff' : (der ? '#4fc3f7' : '#ff8a80');
  ctx.save();
  ctx.shadowColor = col; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.arc(x, cy, 26, 0, Math.PI*2);
  const g = ctx.createRadialGradient(x-8, cy-8, 0, x, cy, 26);
  g.addColorStop(0, '#fff'); g.addColorStop(0.4, col); g.addColorStop(1, col);
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = '#06121f'; ctx.font = 'bold 12px "Orbitron",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(h.part.split(' ')[0], x, cy);
  ctx.restore();

  /* Flecha de espín: apunta a la derecha (helicidad +) o izquierda (−) */
  ctx.save();
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 4; ctx.lineCap='round';
  ctx.shadowColor = col; ctx.shadowBlur = 10;
  const sdir = der ? 1 : -1;
  ctx.beginPath(); ctx.moveTo(x, cy-42); ctx.lineTo(x + sdir*34, cy-42); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + sdir*34, cy-42); ctx.lineTo(x + sdir*22, cy-49); ctx.lineTo(x + sdir*22, cy-35); ctx.closePath(); ctx.fill();
  ctx.font = '11px "Exo 2",sans-serif'; ctx.textAlign='center';
  ctx.fillText('espín', x, cy-58);
  ctx.restore();

  spDibujarFlash(ctx, W, H);
}


/* ╔══════════════════════════════════════════════════════════╗
   ║  ETAPA 3 — El espín de los BOSONES GAUGE (espín 1)         ║
   ╚══════════════════════════════════════════════════════════╝ */

/* Bosones gauge. `sinMasa` → solo helicidades ±1 (NO existe el estado 0).
   Los W/Z tienen masa → tres estados m_s = +1, 0, −1.
   Orden: primero los MASIVOS (W⁺ y luego Z, que SÍ tienen los tres estados)
   y después los SIN MASA (γ, g), para que el contraste "0 existe / 0 no
   existe" se descubra al final. */
const SP_BOSONES = [
  { sym:'W⁺', nom:'bosón W⁺', col:'#4fc3f7', sinMasa:false, masa:'80.4 GeV', info:'Tiene masa: aparecen los TRES estados +1, 0, −1 (incluida la polarización longitudinal).' },
  { sym:'Z',  nom:'bosón Z',  col:'#ba68c8', sinMasa:false, masa:'91.2 GeV', info:'Tiene masa: tres estados de espín +1, 0, −1.' },
  { sym:'γ',  nom:'fotón',  col:'#ffd740', sinMasa:true,  masa:'0',        info:'Sin masa viaja a c: solo helicidades +1 y −1. El estado 0 NO existe.' },
  { sym:'g',  nom:'gluón',  col:'#69ffa6', sinMasa:true,  masa:'0',        info:'Como el fotón: sin masa → solo +1 y −1. (Pero tiene carga de color.)' },
];

/* ── MÓDULO A — El Triestado (espín 1) ──
   Dinámico: cambia el espín del bosón entre ↑(+1) → •(0) → ↓(−1); intenta
   un estado intermedio (rechazado = cuantización); activa un campo magnético
   y mira cómo se alinea a UNO de los estados discretos. Para fotón/gluón el
   estado 0 está vedado. Reto: observar los 4 bosones y sus estados. */
function spModTriestado(body) {
  document.getElementById('sp-instruccion').textContent =
    'Módulo A · El Triestado — Los bosones gauge tienen espín 1: su brújula tiene TRES estados (↑ +1, • 0, ↓ −1), no dos. Pero el estado 0 solo existe si la partícula tiene masa.';

  spState.completado = false;
  spState.triIdx = 0;         /* bosón actual */
  spState.triMs  = +1;        /* +1, 0, -1 */
  spState.triVistos = new Set();        /* bosones cuyos estados válidos ya se recorrieron */
  spState.triEstadosDe = {};  /* idx -> Set de ms observados */
  spState.triCampo = false;
  spState.triAlin = null;     /* ms al que se alineó el campo */
  spState.triT = 0;
  spState.triWobble = 0;      /* oscilación al intentar estado intermedio */
  spState.triAngVis = -Math.PI/2;  /* ángulo mostrado (interpolado hacia el objetivo) */
  spState.triPrec = 0;        /* fase de precesión de Larmor cuando hay campo */
  spState.triEstela = [];     /* estela de la punta de la flecha */
  spState.triColapso = 0;     /* destello al medir con el campo */
  spState.triCampoFlujo = 0;  /* desplazamiento de las partículas de campo */

  body.innerHTML = `
    <div class="sp-wrap">
      <div class="sp-panel">
        <div class="sp-panel-card">
          <div class="sp-panel-title">Reto</div>
          <div class="sp-reto" id="sp-reto-txt">—</div>
          <div class="sp-prog-wrap"><div class="sp-prog-barra" id="sp-prog-barra"></div></div>
          <div class="sp-prog-lbl" id="sp-prog-lbl">0 estados observados</div>
          <div class="sp-estado" id="sp-tri-estado"></div>
        </div>
        <div class="sp-panel-card">
          <div class="sp-panel-title">Brújula del espín</div>
          <div class="sp-ms-medidor" id="sp-tri-med">m<sub>s</sub> = +1</div>
          <div class="sp-tri-btns">
            <button class="sp-btn sp-btn-accion" onclick="spTriSet(1)">↑ m<sub>s</sub> = +1</button>
            <button class="sp-btn sp-btn-accion" onclick="spTriSet(0)">• m<sub>s</sub> = 0</button>
            <button class="sp-btn sp-btn-accion" onclick="spTriSet(-1)">↓ m<sub>s</sub> = −1</button>
          </div>
          <button class="sp-btn sp-btn-sutil" onclick="spTriIntermedio()">↗ Intentar estado intermedio</button>
          <button class="sp-btn sp-btn-campo" id="sp-tri-campo" onclick="spTriCampo()">🧲 Activar campo magnético</button>
        </div>
        <div class="sp-panel-card">
          <div class="sp-panel-title">Bosón</div>
          <div class="sp-tri-tira" id="sp-tri-tira">
            ${SP_BOSONES.map((b,i) => `
              <button class="sp-tri-chip ${i===0?'sel':''}" style="--bc:${b.col}" id="sp-tri-chip-${i}" onclick="spTriBoson(${i})" title="${b.nom}">
                <b>${b.sym}</b><small>${b.masa}</small>
              </button>`).join('')}
          </div>
          <div class="sp-hint" id="sp-tri-info">—</div>
        </div>
        <div class="sp-panel-card">
          <div class="sp-panel-title">¿Por qué ocurre?</div>
          <div class="sp-hint">
            El espín está <strong>cuantizado</strong>: no hay direcciones intermedias, solo
            <strong>2S+1</strong> estados. Para espín 1 eso son <strong>tres</strong> (+1, 0, −1); para los
            fermiones de espín 1/2 solo <strong>dos</strong>. Las partículas <strong>sin masa</strong>
            (fotón, gluón) viajan a <em>c</em> y pierden el estado longitudinal 0: les quedan
            solo las dos helicidades ±1.
          </div>
        </div>
        <div class="sp-logro-cont hidden" id="sp-logro-cont"></div>
      </div>
      <div class="sp-canvas-wrap">
        <canvas id="sp-canvas" class="sp-canvas"></canvas>
        <div class="sp-canvas-legend">
          <span style="color:#4fc3f7">↑ +1</span>
          <span style="color:#80d8ff">• 0</span>
          <span style="color:#ff8a80">↓ −1</span>
        </div>
      </div>
    </div>
  `;

  const cv = document.getElementById('sp-canvas');
  spState.canvas = cv; spState.ctx = cv.getContext('2d');
  spAjustarCanvasActivo();
  window.addEventListener('resize', spAjustarCanvasActivo);
  spTriBoson(0);
  spTriLoop();
}

/* Nº total de estados válidos a observar en todo el reto (3+3 masivos, 2+2 sin masa) */
function spTriTotalEstados() {
  return SP_BOSONES.reduce((s,b) => s + (b.sinMasa ? 2 : 3), 0);
}
function spTriObservados() {
  let n = 0;
  for (const k in spState.triEstadosDe) n += spState.triEstadosDe[k].size;
  return n;
}

function spTriBoson(i) {
  spState.triIdx = i;
  spState.triCampo = false;
  spState.triAlin = null;
  const campoBtn = document.getElementById('sp-tri-campo');
  if (campoBtn) { campoBtn.classList.remove('on'); campoBtn.textContent = '🧲 Activar campo magnético'; }
  const b = SP_BOSONES[i];
  /* arranca en un estado permitido */
  spState.triMs = +1;
  spState.triAngVis = -Math.PI/2;   /* flecha apuntando a ↑ (+1) sin "viajar" */
  spState.triEstela = [];
  spState.triPrec = 0;
  spState.triColapso = 0;
  if (!spState.triEstadosDe[i]) spState.triEstadosDe[i] = new Set();
  SP_BOSONES.forEach((_, k) => {
    const c = document.getElementById('sp-tri-chip-' + k);
    if (c) c.classList.toggle('sel', k === i);
  });
  const info = document.getElementById('sp-tri-info');
  if (info) info.innerHTML = '<b>' + b.nom + '</b> — ' + b.info;
  /* habilitar/inhabilitar botón de estado 0 */
  spTriRegistrar();
  spTriMed();
  spSetReto('Explora los estados de espín de <b>' + b.nom + '</b>. Usa ↑, •, ↓ y activa el campo. ' +
            (b.sinMasa ? 'Ojo: sin masa, el estado • (0) <b>no existe</b>.' : 'Con masa, los tres estados son válidos.'));
}

function spTriSet(ms) {
  const b = SP_BOSONES[spState.triIdx];
  if (ms === 0 && b.sinMasa) {
    spState.triWobble = 1;
    spFlashSp('✗ ' + b.nom + ' no tiene masa: el estado 0 (longitudinal) NO existe. Solo ±1.');
    const est = document.getElementById('sp-tri-estado');
    if (est) { est.textContent = 'Sin masa → sin estado 0. Solo helicidades +1 y −1.'; est.className = 'sp-estado err'; }
    return;
  }
  spState.triMs = ms;
  spState.triAlin = null;      /* al cambiar manualmente, el campo deja de "fijar" */
  spTriMed();
  spTriRegistrar();
}

function spTriIntermedio() {
  spState.triWobble = 1;
  spFlashSp('✗ No hay direcciones intermedias: el espín está CUANTIZADO. Vuelve a un estado discreto.');
  const est = document.getElementById('sp-tri-estado');
  if (est) { est.textContent = 'El espín no admite valores intermedios: solo 2S+1 estados discretos.'; est.className = 'sp-estado err'; }
}

function spTriCampo() {
  spState.triCampo = !spState.triCampo;
  const btn = document.getElementById('sp-tri-campo');
  if (spState.triCampo) {
    /* el campo "mide": colapsa a un estado permitido al azar */
    const b = SP_BOSONES[spState.triIdx];
    const opciones = b.sinMasa ? [1, -1] : [1, 0, -1];
    spState.triAlin = opciones[Math.floor(Math.random() * opciones.length)];
    spState.triMs = spState.triAlin;
    spState.triColapso = 1;    /* destello de colapso al medir */
    if (btn) { btn.classList.add('on'); btn.textContent = '🧲 Campo activo (medido)'; }
    const est = document.getElementById('sp-tri-estado');
    if (est) {
      est.innerHTML = 'El campo midió el espín → colapsó a m<sub>s</sub> = ' + (spState.triMs>0?'+1':spState.triMs<0?'−1':'0') + '.';
      est.className = 'sp-estado ok';
    }
    spTriMed();
    spTriRegistrar();
  } else {
    spState.triAlin = null;
    if (btn) { btn.classList.remove('on'); btn.textContent = '🧲 Activar campo magnético'; }
  }
}

function spTriRegistrar() {
  const i = spState.triIdx;
  if (!spState.triEstadosDe[i]) spState.triEstadosDe[i] = new Set();
  spState.triEstadosDe[i].add(spState.triMs);
  const total = spTriTotalEstados();
  const obs = spTriObservados();
  spProgreso(obs / total, obs + ' / ' + total + ' estados observados');
  if (obs >= total && !spState.completado) {
    spRetoCumplido('¡Triestado dominado! Espín 1 → tres estados (+1, 0, −1); sin masa, el 0 desaparece y quedan solo ±1.');
  }
}

function spTriMed() {
  const el = document.getElementById('sp-tri-med');
  if (!el) return;
  const ms = spState.triMs;
  el.innerHTML = 'm<sub>s</sub> = ' + (ms>0?'+1':ms<0?'−1':'0');
  el.style.color = ms>0 ? '#4fc3f7' : ms<0 ? '#ff8a80' : '#80d8ff';
}

function spTriLoop() {
  spRAF = requestAnimationFrame(spTriLoop);
  const st = spState, ctx = st.ctx, cv = st.canvas;
  if (!ctx || !cv) return;
  const W = cv.width, H = cv.height;
  mjGridBackground(ctx, W, H);
  st.triT += 0.05;
  if (st.triWobble > 0)  st.triWobble  = Math.max(0, st.triWobble - 0.04);
  if (st.triColapso > 0) st.triColapso = Math.max(0, st.triColapso - 0.045);
  st.triCampoFlujo = (st.triCampoFlujo + (st.triCampo ? 1.6 : 0.4)) % 46;
  const cx = W/2, cy = H/2;
  const b = SP_BOSONES[st.triIdx];

  /* ── Campo magnético de fondo: flechas que SUBEN, pulsando ── */
  if (st.triCampo) {
    const pulso = 0.14 + Math.sin(st.triT*3)*0.05;
    ctx.save();
    ctx.strokeStyle = 'rgba(79,195,247,' + pulso + ')'; ctx.fillStyle = 'rgba(79,195,247,' + pulso + ')'; ctx.lineWidth = 2;
    for (let gx = 30; gx < W; gx += 46) {
      ctx.beginPath(); ctx.moveTo(gx, 20); ctx.lineTo(gx, H-20); ctx.stroke();
      /* punta de flecha que viaja hacia arriba */
      const ay = (H-20) - st.triCampoFlujo;
      ctx.beginPath(); ctx.moveTo(gx, ay); ctx.lineTo(gx-4, ay+9); ctx.lineTo(gx+4, ay+9); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = 'rgba(79,195,247,0.75)'; ctx.font = 'bold 11px "Exo 2",sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('B ↑ campo magnético', 16, 22);
    ctx.restore();
  }

  /* Las tres posiciones de la brújula (reloj): ↑ arriba, • centro-derecha, ↓ abajo */
  const R = Math.min(W, H) * 0.28;
  const estados = [
    { ms:+1, ang:-Math.PI/2, col:'#4fc3f7', lbl:'↑ +1' },
    { ms: 0, ang: 0,         col:'#80d8ff', lbl:'• 0' },
    { ms:-1, ang: Math.PI/2, col:'#ff8a80', lbl:'↓ −1' },
  ];

  /* ── Anillo de la brújula (gira muy lento, da vida al fondo) ── */
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.stroke();
  for (let k = 0; k < 24; k++) {
    const a = (k/24)*Math.PI*2 + st.triT*0.15;
    const r1 = R - 4, r2 = R + 4;
    ctx.globalAlpha = 0.12 + 0.1*Math.sin(a*3 + st.triT);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a)*r1, cy + Math.sin(a)*r1);
    ctx.lineTo(cx + Math.cos(a)*r2, cy + Math.sin(a)*r2);
    ctx.stroke();
  }
  ctx.restore();

  /* Marcas de los estados permitidos (laten suavemente); el actual resalta */
  estados.forEach(e => {
    const permitido = !(e.ms === 0 && b.sinMasa);
    const ex = cx + Math.cos(e.ang) * R, ey = cy + Math.sin(e.ang) * R;
    const activo = (e.ms === st.triMs);
    const late = activo ? 1 + Math.sin(st.triT*5)*0.12 : 1;
    ctx.save();
    ctx.globalAlpha = permitido ? (activo ? 0.95 : 0.5) : 0.15;
    ctx.strokeStyle = permitido ? e.col : '#888';
    ctx.setLineDash(permitido ? [] : [4,4]);
    ctx.lineWidth = activo ? 2.5 : 1.5;
    if (activo) { ctx.shadowColor = e.col; ctx.shadowBlur = 14; }
    ctx.beginPath(); ctx.arc(ex, ey, 15*late, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = permitido ? e.col : '#777';
    ctx.font = '12px "Exo 2",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(permitido ? e.lbl : '✕', ex, ey);
    ctx.restore();
  });

  /* ── Núcleo del bosón: halo pulsante + leve "respiración" ── */
  const resp = 30 + Math.sin(st.triT*2.2)*2;
  /* halo */
  ctx.save();
  const hg = ctx.createRadialGradient(cx, cy, 0, cx, cy, resp*2.2);
  hg.addColorStop(0, 'rgba(255,255,255,0.0)');
  hg.addColorStop(0.5, hexA(b.col, 0.22 + 0.08*Math.sin(st.triT*2.2)));
  hg.addColorStop(1, hexA(b.col, 0));
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(cx, cy, resp*2.2, 0, Math.PI*2); ctx.fill();
  ctx.restore();
  /* cuerpo */
  ctx.save();
  ctx.shadowColor = b.col; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.arc(cx, cy, resp, 0, Math.PI*2);
  const g = ctx.createRadialGradient(cx-10, cy-10, 0, cx, cy, resp);
  g.addColorStop(0, '#fff'); g.addColorStop(0.4, b.col); g.addColorStop(1, b.col);
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = '#06121f'; ctx.font = 'bold 15px "Orbitron",monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(b.sym, cx, cy);
  ctx.restore();

  /* ── Ángulo objetivo e interpolación suave (transición animada entre estados) ── */
  const act = estados.find(e => e.ms === st.triMs) || estados[0];
  let objetivo = act.ang;
  if (st.triWobble > 0) objetivo += Math.sin(st.triT * 20) * 0.5 * st.triWobble;  /* temblor al forzar intermedio */
  /* interpolar triAngVis hacia objetivo por el camino más corto */
  let d = objetivo - st.triAngVis;
  while (d >  Math.PI) d -= Math.PI*2;
  while (d < -Math.PI) d += Math.PI*2;
  st.triAngVis += d * 0.18;
  let ang = st.triAngVis;

  /* ── Precesión de Larmor: con campo, la flecha describe un cono alrededor del eje ── */
  let precX = 0;
  if (st.triCampo && st.triMs !== 0) {
    st.triPrec += 0.12;
    precX = Math.sin(st.triPrec) * 0.22;   /* abanico lateral que simula el cono */
  }
  const ux = Math.cos(ang + precX), uy = Math.sin(ang + precX);
  const col = act.col;
  const L = R - 14;

  /* estela de la punta durante la precesión */
  if (st.triCampo && st.triMs !== 0) {
    st.triEstela.push({ x: cx + ux*L, y: cy + uy*L, a: 1 });
    if (st.triEstela.length > 18) st.triEstela.shift();
  } else if (st.triEstela.length) {
    st.triEstela = [];
  }
  st.triEstela.forEach(p => {
    p.a -= 0.055;
    if (p.a <= 0) return;
    ctx.save();
    ctx.globalAlpha = p.a * 0.5;
    ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });

  /* ── Flecha de espín (DOBLE = espín 1) ── */
  ctx.save();
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.shadowColor = col; ctx.shadowBlur = 12;
  if (st.triMs === 0) {
    /* estado 0: flechas opuestas (proyección nula), eje horizontal doble */
    const u0x = Math.cos(ang), u0y = Math.sin(ang);
    for (const s of [-1, 1]) {
      const off = s * 5;
      ctx.beginPath();
      ctx.moveTo(cx - u0x*L + (-u0y*off), cy - u0y*L + (u0x*off));
      ctx.lineTo(cx + u0x*L + (-u0y*off), cy + u0y*L + (u0x*off));
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(128,216,255,0.9)'; ctx.font = '11px "Exo 2",sans-serif'; ctx.textAlign='center';
    ctx.fillText('proyección 0', cx, cy - 48);
  } else {
    /* flecha DOBLE para marcar espín 1 */
    for (const off of [-5, 5]) {
      const px = -uy, py = ux;  /* perpendicular */
      const bx0 = cx + px*off, by0 = cy + py*off;
      const txp = bx0 + ux*L,  typ = by0 + uy*L;
      ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.lineTo(txp, typ); ctx.stroke();
      /* punta */
      ctx.beginPath();
      ctx.moveTo(txp, typ);
      ctx.lineTo(txp - ux*14 - px*7, typ - uy*14 - py*7);
      ctx.lineTo(txp - ux*14 + px*7, typ - uy*14 + py*7);
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();

  /* ── Destello de colapso al medir con el campo ── */
  if (st.triColapso > 0) {
    const tx = cx + ux*L, ty = cy + uy*L;
    ctx.save();
    ctx.globalAlpha = st.triColapso;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    const rr = (1 - st.triColapso) * 46 + 6;
    ctx.beginPath(); ctx.arc(st.triMs===0?cx:tx, st.triMs===0?cy:ty, rr, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  /* Precesión: etiqueta cuando hay campo */
  if (st.triCampo && st.triMs !== 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(128,216,255,0.7)'; ctx.font = '10px "Exo 2",sans-serif'; ctx.textAlign='center';
    ctx.fillText('precesión de Larmor', cx, cy + R + 24);
    ctx.restore();
  }

  /* etiqueta espín 1 */
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '11px "Exo 2",sans-serif'; ctx.textAlign='center';
  ctx.fillText('espín 1 · ' + b.nom, cx, H - 16);
  ctx.restore();

  spDibujarFlash(ctx, W, H);
}

/* Convierte un color #rrggbb a rgba(r,g,b,alpha) */
function hexA(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0,2), 16);
  const g = parseInt(h.substring(2,4), 16);
  const b = parseInt(h.substring(4,6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}


/* ── MÓDULO B — El Teorema Espín-Estadística ──
   Dinámico: dos "salas de baile". En la de FERMIONES cada electrón ocupa un
   nivel único (Pauli); al forzar un nivel lleno, rebota (exclusión). En la de
   BOSONES todos los fotones caen al mismo estado fundamental y forman un
   condensado que brilla al unísono.
   Reto: (1) llenar varios niveles de fermiones, (2) provocar un rechazo de
   Pauli, (3) formar un condensado de ≥5 bosones. */
const SP_FERM_NIVELES = 10;   /* niveles disponibles en la sala de fermiones */

function spModEstadistica(body) {
  document.getElementById('sp-instruccion').textContent =
    'Módulo B · Espín-Estadística — El espín decide el carácter social de una partícula: los fermiones (espín 1/2) se excluyen; los bosones (espín entero) se amontonan.';

  spState.completado = false;
  spState.ferm = [];       /* electrones colocados: {nivel, y, vy, landed, ph} */
  spState.bos  = [];       /* fotones en el condensado: {y, vy, landed, ph} */
  spState.estMetas = { niveles:false, pauli:false, condensado:false };
  spState.estT = 0;
  spState.estPulse = 0;    /* destello del condensado */
  spState.estIntruso = null;   /* electrón que intenta violar Pauli y rebota */
  spState.estNivelFlash = {};  /* nivel -> intensidad de destello al recibir e⁻ */
  spState.estCondAnillo = 0;   /* fase del anillo de coherencia del condensado */

  body.innerHTML = `
    <div class="sp-wrap">
      <div class="sp-panel">
        <div class="sp-panel-card">
          <div class="sp-panel-title">Reto</div>
          <div class="sp-reto" id="sp-reto-txt">Explora ambas salas. Completa las tres metas de abajo.</div>
          <div class="sp-prog-wrap"><div class="sp-prog-barra" id="sp-prog-barra"></div></div>
          <div class="sp-prog-lbl" id="sp-prog-lbl">0 / 3 metas</div>
          <ul class="sp-metas" id="sp-est-metas">
            <li id="sp-meta-niveles">◻ Coloca electrones en 3 niveles distintos</li>
            <li id="sp-meta-pauli">◻ Intenta meter 2 electrones en el mismo nivel (Pauli)</li>
            <li id="sp-meta-cond">◻ Reúne 5 fotones en el mismo estado (condensado)</li>
          </ul>
          <div class="sp-estado" id="sp-est-estado"></div>
        </div>
        <div class="sp-panel-card">
          <div class="sp-panel-title">Salas</div>
          <button class="sp-btn sp-btn-accion" onclick="spEstAddFerm()">➕ Añadir electrón (fermión)</button>
          <button class="sp-btn sp-btn-sutil" onclick="spEstForzarPauli()">⚠ Forzar 2 e⁻ en el mismo nivel</button>
          <button class="sp-btn sp-btn-accion" onclick="spEstAddBos()">➕ Añadir fotón (bosón)</button>
          <button class="sp-btn sp-btn-sutil" onclick="spEstReset()">↺ Vaciar salas</button>
        </div>
        <div class="sp-panel-card">
          <div class="sp-panel-title">¿Por qué la diferencia?</div>
          <div class="sp-hint">
            El <strong>teorema espín-estadística</strong>: espín <strong>semientero</strong> → fermión
            (estadística de Fermi-Dirac, principio de exclusión), espín <strong>entero</strong> → bosón
            (estadística de Bose-Einstein, pueden compartir estado). Por eso la materia ocupa volumen
            (electrones apilados en niveles) y la luz se concentra (láser, condensado).
          </div>
        </div>
        <div class="sp-logro-cont hidden" id="sp-logro-cont"></div>
      </div>
      <div class="sp-canvas-wrap">
        <canvas id="sp-canvas" class="sp-canvas"></canvas>
        <div class="sp-canvas-legend">
          <span style="color:#4fc3f7">fermiones: 1 por estado</span>
          <span style="color:#ffd740">bosones: todos juntos</span>
        </div>
      </div>
    </div>
  `;

  const cv = document.getElementById('sp-canvas');
  spState.canvas = cv; spState.ctx = cv.getContext('2d');
  spAjustarCanvasActivo();
  window.addEventListener('resize', spAjustarCanvasActivo);
  spProgreso(0, '0 / 3 metas');
  spEstLoop();
}

/* Añade un electrón al nivel más bajo libre (sube de nivel: Pauli).
   Entra cayendo desde arriba (y animada); al chocar con un nivel ocupado
   subiría, pero aquí siempre busca el primero libre. */
function spEstAddFerm() {
  const ocupados = new Set(spState.ferm.map(f => f.nivel));
  let nivel = -1;
  for (let n = 0; n < SP_FERM_NIVELES; n++) { if (!ocupados.has(n)) { nivel = n; break; } }
  if (nivel === -1) {
    /* lleno: lanza un intruso que rebota (exclusión visual) */
    spEstForzarPauli();
    return;
  }
  spState.ferm.push({ nivel, y: -30, vy: 0, landed: false, ph: Math.random()*6 });
  /* meta niveles: 3 niveles distintos ocupados */
  const distintos = new Set(spState.ferm.map(f => f.nivel)).size;
  if (distintos >= 3) spEstMeta('niveles', '✓ Cada electrón ocupa un nivel propio: así se construye la tabla periódica.');
}

/* Intento explícito de violar Pauli: un electrón cae sobre un nivel ocupado,
   choca y REBOTA hacia arriba (lo expulsa el principio de exclusión). */
function spEstForzarPauli() {
  /* elige un nivel ya ocupado (el más bajo); si no hay ninguno, no hay choque */
  const ocupados = spState.ferm.map(f => f.nivel).sort((a,b)=>a-b);
  const nivel = ocupados.length ? ocupados[0] : 0;
  spState.estIntruso = { nivel, y: -30, vy: 0, fase: 'cae', ph: Math.random()*6 };
  spFlashSp('✗ Rechazado: ese nivel ya tiene un electrón. Pauli lo expulsa.');
  spEstMeta('pauli', '✓ Principio de exclusión: dos fermiones no comparten el mismo estado.');
}

function spEstAddBos() {
  spState.bos.push({ y: -30, vy: 0, landed: false, ph: Math.random()*6 });
  spState.estPulse = 1;
  if (spState.bos.length >= 5) {
    spEstMeta('condensado', '✓ Condensado de Bose-Einstein: todos los fotones en el MISMO estado, actuando como uno.');
  }
}

function spEstReset() {
  spState.ferm = [];
  spState.bos = [];
  spState.estIntruso = null;
  spState.estNivelFlash = {};
}

function spEstMeta(clave, msg) {
  if (spState.estMetas[clave]) return;
  spState.estMetas[clave] = true;
  const map = { niveles:'sp-meta-niveles', pauli:'sp-meta-pauli', cond:'sp-meta-cond', condensado:'sp-meta-cond' };
  const li = document.getElementById(map[clave]);
  if (li) { li.classList.add('ok'); li.textContent = '✓' + li.textContent.slice(1); }
  const est = document.getElementById('sp-est-estado');
  if (est) { est.textContent = msg; est.className = 'sp-estado ok'; }
  const hechas = Object.values(spState.estMetas).filter(Boolean).length;
  spProgreso(hechas / 3, hechas + ' / 3 metas');
  if (hechas >= 3) {
    spRetoCumplido('¡Espín-estadística! Espín 1/2 → exclusión (materia con volumen); espín entero → condensado (luz coherente).');
  }
}

function spEstLoop() {
  spRAF = requestAnimationFrame(spEstLoop);
  const st = spState, ctx = st.ctx, cv = st.canvas;
  if (!ctx || !cv) return;
  const W = cv.width, H = cv.height;
  mjGridBackground(ctx, W, H);
  st.estT += 0.05;
  if (st.estPulse > 0) st.estPulse = Math.max(0, st.estPulse - 0.03);
  st.estCondAnillo += 0.04;
  /* desvanecer los destellos de nivel */
  for (const k in st.estNivelFlash) {
    st.estNivelFlash[k] = Math.max(0, st.estNivelFlash[k] - 0.05);
    if (st.estNivelFlash[k] === 0) delete st.estNivelFlash[k];
  }

  const midX = W/2;
  const top = 50, botF = H - 40;
  const nivY = n => botF - (n / (SP_FERM_NIVELES-1)) * (botF - top);
  const fx = midX/2;
  const bx = midX + midX/2, by = botF;
  /* radio del electrón adaptado al espaciado entre niveles (no se solapan) */
  const sep = (botF - top) / Math.max(1, SP_FERM_NIVELES - 1);
  const eR = Math.max(6, Math.min(12, sep * 0.42));

  /* separador de salas */
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.setLineDash([6,6]);
  ctx.beginPath(); ctx.moveTo(midX, 16); ctx.lineTo(midX, H-16); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(79,195,247,0.85)'; ctx.font = 'bold 12px "Orbitron",monospace'; ctx.textAlign = 'center';
  ctx.fillText('SALA DE FERMIONES', midX/2, 26);
  ctx.fillStyle = 'rgba(255,215,64,0.9)';
  ctx.fillText('SALA DE BOSONES', midX + midX/2, 26);
  ctx.restore();

  /* ════════ Sala de fermiones ════════ */
  /* líneas de nivel; la ocupada late y destella al recibir un e⁻ */
  ctx.save();
  for (let n = 0; n < SP_FERM_NIVELES; n++) {
    const y = nivY(n);
    const ocupado = st.ferm.some(f => f.nivel === n && f.landed);
    const flash = st.estNivelFlash[n] || 0;
    const base = ocupado ? 0.6 : 0.18;
    ctx.strokeStyle = 'rgba(79,195,247,' + Math.min(1, base + flash*0.4) + ')';
    ctx.lineWidth = 2 + flash*2; ctx.setLineDash(ocupado ? [] : [4,5]);
    if (flash > 0) { ctx.shadowColor = '#4fc3f7'; ctx.shadowBlur = 16*flash; }
    ctx.beginPath(); ctx.moveTo(fx-70, y); ctx.lineTo(fx+70, y); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '9px "Exo 2",sans-serif'; ctx.textAlign = 'right';
  ctx.fillText('energía', fx+70, top-6);
  ctx.restore();

  /* electrones: caen hasta su nivel con rebote suave al aterrizar */
  st.ferm.forEach(f => {
    const tgt = nivY(f.nivel);
    if (!f.landed) {
      f.vy += 1.1;                 /* gravedad */
      f.y += f.vy;
      if (f.y >= tgt) {
        if (f.vy > 2.5) { f.y = tgt; f.vy = -f.vy * 0.32; }  /* rebote */
        else { f.y = tgt; f.vy = 0; f.landed = true; st.estNivelFlash[f.nivel] = 1; }
      }
    }
    spEstDibujarElectron(ctx, fx, f.y, f.landed, null, eR);
  });

  /* intruso de Pauli: cae, rebota contra el nivel ocupado y sube hasta salir */
  if (st.estIntruso) {
    const it = st.estIntruso;
    const tgt = nivY(it.nivel);
    if (it.fase === 'cae') {
      it.vy += 1.1; it.y += it.vy;
      if (it.y >= tgt - 24) {   /* choca justo encima del e⁻ residente */
        it.y = tgt - 24; it.vy = -14; it.fase = 'rebota'; it.chispa = 1;
        st.estNivelFlash[it.nivel] = 1;
      }
    } else {
      it.vy += 0.5; it.y += it.vy;    /* sube y se frena, saliendo por arriba */
      if (it.chispa > 0) it.chispa = Math.max(0, it.chispa - 0.08);
      if (it.y < -40) st.estIntruso = null;
    }
    if (it && it.chispa > 0) {
      ctx.save(); ctx.globalAlpha = it.chispa;
      spEstChispa(ctx, fx, tgt - 24);
      ctx.restore();
    }
    if (it) {
      spEstDibujarElectron(ctx, fx + 26, it.y, false, '#ff8a80', eR);
      ctx.save();
      ctx.fillStyle = 'rgba(255,138,128,0.9)'; ctx.font = '9px "Exo 2",sans-serif'; ctx.textAlign='center';
      if (it.fase === 'rebota') ctx.fillText('✗ expulsado', fx + 26, it.y - 18);
      ctx.restore();
    }
  }

  if (st.ferm.filter(f=>f.landed).length >= SP_FERM_NIVELES) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,138,128,0.8)'; ctx.font = '10px "Exo 2",sans-serif'; ctx.textAlign='center';
    ctx.fillText('niveles llenos — Pauli', fx, botF + 22);
    ctx.restore();
  }

  /* ════════ Sala de bosones ════════ */
  ctx.save();
  ctx.strokeStyle = 'rgba(255,215,64,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bx-80, by); ctx.lineTo(bx+80, by); ctx.stroke();
  ctx.fillStyle = 'rgba(255,215,64,0.6)'; ctx.font = '9px "Exo 2",sans-serif'; ctx.textAlign='center';
  ctx.fillText('estado fundamental', bx, by+18);
  ctx.restore();

  const nB = st.bos.length;
  const cyB = by - 22;
  const condensado = nB >= 5;

  /* resplandor del condensado proporcional al nº de fotones (late en fase) */
  if (nB > 0) {
    const latido = condensado ? (0.5 + 0.5*Math.sin(st.estCondAnillo*2)) : 0;
    const glow = 18 + nB*6 + st.estPulse*20 + latido*18;
    ctx.save();
    const rg = ctx.createRadialGradient(bx, cyB, 0, bx, cyB, glow);
    rg.addColorStop(0, 'rgba(255,215,64,' + Math.min(0.9, 0.25 + nB*0.08) + ')');
    rg.addColorStop(1, 'rgba(255,215,64,0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(bx, cyB, glow, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  /* anillo de coherencia + rayos "láser" cuando condensa */
  if (condensado) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,215,64,0.45)'; ctx.lineWidth = 1.5;
    const rr = 30 + Math.sin(st.estCondAnillo*2)*4;
    ctx.beginPath(); ctx.arc(bx, cyB, rr, 0, Math.PI*2); ctx.stroke();
    for (let k = 0; k < 8; k++) {
      const a = (k/8)*Math.PI*2 + st.estCondAnillo;
      ctx.globalAlpha = 0.25 + 0.2*Math.sin(st.estCondAnillo*3 + k);
      ctx.beginPath();
      ctx.moveTo(bx + Math.cos(a)*rr, cyB + Math.sin(a)*rr);
      ctx.lineTo(bx + Math.cos(a)*(rr+14), cyB + Math.sin(a)*(rr+14));
      ctx.stroke();
    }
    ctx.restore();
  }

  /* fotones: caen y luego vibran TODOS en fase (coherencia) en el mismo punto */
  st.bos.forEach((p, i) => {
    const tgt = cyB;
    if (!p.landed) {
      p.vy += 1.0; p.y += p.vy;
      if (p.y >= tgt) { p.y = tgt; p.vy = 0; p.landed = true; st.estPulse = 1; }
    }
    /* una vez posados, oscilan con la MISMA fase global (no la suya propia): coherencia */
    const fase = condensado ? st.estCondAnillo*3 : (st.estT*3 + p.ph);
    const jitter = Math.sin(fase) * (condensado ? 2.5 : 2);
    const px = bx + Math.cos(i*2.1)*1.5 + jitter;
    const py = (p.landed ? tgt : p.y) + Math.sin(i*2.1)*1.5 + jitter*0.5;
    ctx.save();
    ctx.shadowColor = '#ffd740'; ctx.shadowBlur = condensado ? 20 : 14;
    ctx.beginPath(); ctx.arc(px, py, 13, 0, Math.PI*2);
    const g = ctx.createRadialGradient(px-4, py-4, 0, px, py, 13);
    g.addColorStop(0,'#fff'); g.addColorStop(0.4,'#ffd740'); g.addColorStop(1,'#c79a00');
    ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = '#3a2c00'; ctx.font = 'bold 9px "Orbitron",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('γ', px, py);
    ctx.restore();
  });
  if (condensado) {
    ctx.save();
    const a = 0.8 + 0.2*Math.sin(st.estCondAnillo*2);
    ctx.fillStyle = 'rgba(255,215,64,' + a + ')'; ctx.font = 'bold 11px "Exo 2",sans-serif'; ctx.textAlign='center';
    ctx.fillText('¡CONDENSADO! actúan como uno', bx, cyB-40);
    ctx.restore();
  }

  spDibujarFlash(ctx, W, H);
}

/* Dibuja un electrón con su flecha de espín 1/2 (color y radio opcionales) */
function spEstDibujarElectron(ctx, x, y, landed, color, r) {
  const col = color || '#4fc3f7';
  r = r || 12;
  const fuente = Math.max(7, Math.round(r*0.75));
  const ax = x + r + 4;                 /* x de la flecha de espín, pegada al borde */
  ctx.save();
  ctx.shadowColor = col; ctx.shadowBlur = landed ? 12 : 16;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
  const g = ctx.createRadialGradient(x-r*0.33, y-r*0.33, 0, x, y, r);
  g.addColorStop(0,'#fff'); g.addColorStop(0.4, col); g.addColorStop(1, color ? '#8a1f1f' : '#1f6fb0');
  ctx.fillStyle = g; ctx.fill();
  ctx.fillStyle = '#06121f'; ctx.font = 'bold ' + fuente + 'px "Orbitron",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('e⁻', x, y);
  /* flecha de espín escalada al radio */
  ctx.strokeStyle = '#80d8ff'; ctx.fillStyle = '#80d8ff'; ctx.lineWidth = 2; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(ax, y+r*0.7); ctx.lineTo(ax, y-r*0.85); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ax, y-r*0.85); ctx.lineTo(ax-4, y-r*0.85+6); ctx.lineTo(ax+4, y-r*0.85+6); ctx.closePath(); ctx.fill();
  ctx.restore();
}

/* Chispa de choque (exclusión de Pauli) */
function spEstChispa(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,138,128,0.9)'; ctx.lineWidth = 2;
  for (let k = 0; k < 8; k++) {
    const a = (k/8)*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a)*6, y + Math.sin(a)*6);
    ctx.lineTo(x + Math.cos(a)*16, y + Math.sin(a)*16);
    ctx.stroke();
  }
  ctx.restore();
}


/* ── MÓDULO C — El Espín de los Gluones (el caso especial) ──
   Dinámico: a la izquierda un FOTÓN, a la derecha un GLUÓN. Pulsa «emitir»:
   el gluón, por tener carga de color, EMITE otro gluón (autointeracción) y se
   ramifica; el fotón NO puede (no tiene carga eléctrica). Al reunir varios
   gluones se LIGAN en una glueball. Además hay preguntas rápidas que fijan los
   conceptos (espín 1, sin masa, 2 helicidades).
   Reto: (1) emitir gluones hasta formar una glueball (≥4), (2) comprobar que el
   fotón no se autoemite, (3) acertar las 3 preguntas. */
const SP_GLUON_PREG = [
  { q:'¿Cuál es el espín del gluón?', ops:['1/2','1','0'], ok:1,
    exp:'El gluón es un bosón gauge de espín 1, igual que el fotón.' },
  { q:'¿Tiene masa el gluón?', ops:['Sí','No'], ok:1,
    exp:'No tiene masa (como el fotón) → por eso solo tiene helicidades ±1, nunca 0.' },
  { q:'¿Qué distingue al gluón del fotón?', ops:['Tiene carga de color','Tiene más masa','Tiene espín 2'], ok:0,
    exp:'El gluón lleva carga de color: por eso interactúa consigo mismo. El fotón, sin carga eléctrica, no.' },
];

function spModGluon(body) {
  document.getElementById('sp-instruccion').textContent =
    'Módulo C · El Gluón — Espín 1 y sin masa, como el fotón. Pero lleva carga de color: puede emitir OTROS gluones y auto-ligarse. Esa autointeracción hace única a la QCD.';

  spState.completado = false;
  spState.glGluones = [];     /* gluones emitidos: {x,y,vx,vy,ph} */
  spState.glMetas = { glueball:false, foton:false, preguntas:false };
  spState.glPregIdx = 0;
  spState.glAciertos = 0;
  spState.glT = 0;
  spState.glGlueball = false;

  body.innerHTML = `
    <div class="sp-wrap">
      <div class="sp-panel">
        <div class="sp-panel-card">
          <div class="sp-panel-title">Reto</div>
          <div class="sp-reto" id="sp-reto-txt">Haz que el gluón emita gluones hasta formar una glueball, comprueba que el fotón no puede, y responde las 3 preguntas.</div>
          <div class="sp-prog-wrap"><div class="sp-prog-barra" id="sp-prog-barra"></div></div>
          <div class="sp-prog-lbl" id="sp-prog-lbl">0 / 3 metas</div>
          <ul class="sp-metas" id="sp-gl-metas">
            <li id="sp-gl-meta-glueball">◻ Forma una glueball (emite 4 gluones)</li>
            <li id="sp-gl-meta-foton">◻ Intenta que el fotón se autoemita</li>
            <li id="sp-gl-meta-preg">◻ Acierta las 3 preguntas</li>
          </ul>
        </div>
        <div class="sp-panel-card">
          <div class="sp-panel-title">Interacción</div>
          <button class="sp-btn sp-btn-accion" onclick="spGlEmitirGluon()">🟢 Gluón: emitir otro gluón</button>
          <button class="sp-btn sp-btn-accion" onclick="spGlEmitirFoton()">🟡 Fotón: emitir otro fotón</button>
          <button class="sp-btn sp-btn-sutil" onclick="spGlReset()">↺ Reiniciar</button>
          <div class="sp-estado" id="sp-gl-estado"></div>
        </div>
        <div class="sp-panel-card">
          <div class="sp-panel-title">Pregunta <span id="sp-gl-pn" style="color:#80d8ff"></span></div>
          <div class="sp-reto" id="sp-gl-preg">—</div>
          <div class="sp-gl-ops" id="sp-gl-ops"></div>
        </div>
        <div class="sp-panel-card">
          <div class="sp-panel-title">¿Por qué ocurre?</div>
          <div class="sp-hint">
            El gluón tiene <strong>espín 1</strong> y <strong>no tiene masa</strong>: como el fotón, solo
            dos helicidades (±1). Pero lleva <strong>carga de color</strong>, así que puede acoplarse a
            otros gluones. Eso hace a la QCD una teoría <strong>no abeliana</strong> y permite estados
            ligados solo de gluones: las <strong>glueballs</strong>, predichas pero difíciles de observar.
          </div>
        </div>
        <div class="sp-logro-cont hidden" id="sp-logro-cont"></div>
      </div>
      <div class="sp-canvas-wrap">
        <canvas id="sp-canvas" class="sp-canvas"></canvas>
        <div class="sp-canvas-legend">
          <span style="color:#ffd740">γ fotón (sin carga)</span>
          <span style="color:#69ffa6">g gluón (carga de color)</span>
        </div>
      </div>
    </div>
  `;

  const cv = document.getElementById('sp-canvas');
  spState.canvas = cv; spState.ctx = cv.getContext('2d');
  spAjustarCanvasActivo();
  window.addEventListener('resize', spAjustarCanvasActivo);
  spProgreso(0, '0 / 3 metas');
  spGlCargarPreg();
  spGlLoop();
}

function spGlCargarPreg() {
  const p = SP_GLUON_PREG[spState.glPregIdx];
  const pn = document.getElementById('sp-gl-pn');
  const pq = document.getElementById('sp-gl-preg');
  const ops = document.getElementById('sp-gl-ops');
  if (!p) {
    if (pn) pn.textContent = '✓';
    if (pq) pq.textContent = '¡Las 3 preguntas resueltas!';
    if (ops) ops.innerHTML = '';
    return;
  }
  if (pn) pn.textContent = (spState.glPregIdx + 1) + '/' + SP_GLUON_PREG.length;
  if (pq) pq.textContent = p.q;
  if (ops) ops.innerHTML = p.ops.map((o, i) =>
    `<button class="sp-btn sp-gl-op" onclick="spGlResponder(${i})">${o}</button>`).join('');
}

function spGlResponder(i) {
  const p = SP_GLUON_PREG[spState.glPregIdx];
  if (!p) return;
  const est = document.getElementById('sp-gl-estado');
  if (i === p.ok) {
    spState.glAciertos++;
    if (est) { est.textContent = '✔ ' + p.exp; est.className = 'sp-estado ok'; }
    spState.glPregIdx++;
    if (spState.glAciertos >= SP_GLUON_PREG.length) {
      spGlMeta('preguntas', 'sp-gl-meta-preg', '✓ Conceptos del gluón fijados: espín 1, sin masa, carga de color.');
    }
    setTimeout(spGlCargarPreg, 650);
  } else {
    if (est) { est.textContent = '✗ No es correcto. Pista: ' + p.exp; est.className = 'sp-estado err'; }
  }
}

function spGlEmitirGluon() {
  const cv = spState.canvas; if (!cv) return;
  const H = cv.height;
  const gx = cv.width * 0.72;
  /* nuevo gluón sale del gluón madre con velocidad radial */
  const ang = Math.random() * Math.PI * 2;
  spState.glGluones.push({
    x: gx, y: H/2,
    vx: Math.cos(ang) * (0.8 + Math.random()*0.6),
    vy: Math.sin(ang) * (0.8 + Math.random()*0.6),
    ph: Math.random()*6
  });
  const est = document.getElementById('sp-gl-estado');
  if (est) { est.textContent = 'El gluón tiene carga de color → PUEDE emitir otro gluón (autointeracción).'; est.className = 'sp-estado ok'; }
  if (spState.glGluones.length >= 4 && !spState.glGlueball) {
    spState.glGlueball = true;
    spGlMeta('glueball', 'sp-gl-meta-glueball', '✓ ¡Glueball! Un estado ligado SOLO de gluones, sin quarks: predicción propia de la QCD.');
  }
}

function spGlEmitirFoton() {
  const est = document.getElementById('sp-gl-estado');
  if (est) { est.textContent = '✗ El fotón NO tiene carga eléctrica: no puede emitir otro fotón. La QED es abeliana.'; est.className = 'sp-estado err'; }
  spFlashSp('✗ El fotón no se acopla a sí mismo (sin carga). Solo el gluón, con carga de color, lo hace.');
  spGlMeta('foton', 'sp-gl-meta-foton', '✓ El fotón no se autoemite: sin carga eléctrica no hay autointeracción (QED abeliana).');
}

function spGlReset() {
  spState.glGluones = [];
  spState.glGlueball = false;
  const est = document.getElementById('sp-gl-estado');
  if (est) { est.textContent = ''; est.className = 'sp-estado'; }
}

function spGlMeta(clave, liId, msg) {
  if (spState.glMetas[clave]) return;
  spState.glMetas[clave] = true;
  const li = document.getElementById(liId);
  if (li) { li.classList.add('ok'); li.textContent = '✓' + li.textContent.slice(1); }
  const hechas = Object.values(spState.glMetas).filter(Boolean).length;
  spProgreso(hechas / 3, hechas + ' / 3 metas');
  if (hechas >= 3) {
    spRetoCumplido('¡Gluón dominado! Espín 1 y sin masa como el fotón, pero con carga de color: se auto-liga y hace a la QCD no abeliana.');
  }
}

function spGlLoop() {
  spRAF = requestAnimationFrame(spGlLoop);
  const st = spState, ctx = st.ctx, cv = st.canvas;
  if (!ctx || !cv) return;
  const W = cv.width, H = cv.height;
  mjGridBackground(ctx, W, H);
  st.glT += 0.05;
  const cy = H/2;
  const fx = W * 0.26;   /* fotón */
  const gx = W * 0.72;   /* gluón madre */

  /* ── FOTÓN (izquierda): bosón solitario, onda ── */
  ctx.save();
  ctx.strokeStyle = 'rgba(255,215,64,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const xx = fx - 60 + i*2;
    const yy = cy + 40 + Math.sin(i*0.4 + st.glT*3) * 7;
    i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
  }
  ctx.stroke();
  ctx.restore();
  spGlDibujarBoson(ctx, fx, cy, '#ffd740', 'γ', '#3a2c00');
  ctx.save();
  ctx.fillStyle = 'rgba(255,215,64,0.6)'; ctx.font = '11px "Exo 2",sans-serif'; ctx.textAlign='center';
  ctx.fillText('fotón · sin carga', fx, cy + 70);
  ctx.restore();

  /* ── GLUÓN (derecha) + gluones emitidos ── */
  /* líneas de "muelle" entre la madre y los gluones (tubo de color) */
  st.glGluones.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    /* los mantiene cerca de la madre: atracción suave (confinamiento) */
    const dx = gx - p.x, dy = cy - p.y, d = Math.hypot(dx, dy) || 1;
    if (d > 70) { p.vx += (dx/d)*0.06; p.vy += (dy/d)*0.06; }
    p.vx *= 0.985; p.vy *= 0.985;
    /* rebote dentro de la mitad derecha del canvas */
    if (p.x < W*0.5+20 || p.x > W-20) p.vx *= -1;
    if (p.y < 24 || p.y > H-24) p.vy *= -1;
    p.x = Math.max(W*0.5+20, Math.min(W-20, p.x));
    p.y = Math.max(24, Math.min(H-24, p.y));
  });

  /* resplandor de glueball si están ligados */
  if (st.glGlueball) {
    ctx.save();
    const rg = ctx.createRadialGradient(gx, cy, 0, gx, cy, 90);
    rg.addColorStop(0, 'rgba(105,255,166,0.28)');
    rg.addColorStop(1, 'rgba(105,255,166,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(gx, cy, 90, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  /* conexiones bicolor madre↔gluón */
  st.glGluones.forEach(p => {
    const grad = ctx.createLinearGradient(gx, cy, p.x, p.y);
    grad.addColorStop(0, '#69ffa6'); grad.addColorStop(1, '#ff8a80');
    ctx.save();
    ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.moveTo(gx, cy); ctx.lineTo(p.x, p.y); ctx.stroke();
    ctx.restore();
  });
  /* gluones emitidos */
  st.glGluones.forEach(p => spGlDibujarBoson(ctx, p.x, p.y, '#69ffa6', 'g', '#06321f', 11));
  /* gluón madre */
  spGlDibujarBoson(ctx, gx, cy, '#69ffa6', 'g', '#06321f');
  ctx.save();
  ctx.fillStyle = 'rgba(105,255,166,0.7)'; ctx.font = '11px "Exo 2",sans-serif'; ctx.textAlign='center';
  ctx.fillText(st.glGlueball ? 'glueball · gluones ligados' : 'gluón · carga de color', gx, cy + 70);
  ctx.restore();

  spDibujarFlash(ctx, W, H);
}

/* Dibuja un bosón gauge con flecha DOBLE (espín 1) */
function spGlDibujarBoson(ctx, x, y, col, sym, textCol, r) {
  r = r || 24;
  ctx.save();
  ctx.shadowColor = col; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
  const g = ctx.createRadialGradient(x-6, y-6, 0, x, y, r);
  g.addColorStop(0, '#fff'); g.addColorStop(0.4, col); g.addColorStop(1, col);
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = textCol; ctx.font = 'bold ' + Math.round(r*0.55) + 'px "Orbitron",monospace';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(sym, x, y);
  ctx.restore();
  /* flecha doble de espín 1 */
  ctx.save();
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5; ctx.lineCap='round';
  for (const off of [-4, 4]) {
    ctx.beginPath(); ctx.moveTo(x+off, y - r - 2); ctx.lineTo(x+off, y - r - 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+off, y - r - 18); ctx.lineTo(x+off-4, y - r - 10); ctx.lineTo(x+off+4, y - r - 10); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
