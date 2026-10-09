/* ══════════════════════════════════════════
   minijuegos/js/minijuegos.js
   Lógica del hub de minijuegos:
   - Botón arcade flotante en pantalla ME
   - Pantalla hub: secciones + grid de juegos
   - Preview de juego: descripción + JUGAR
   - Enlace desde panel de detalle de partícula
   ══════════════════════════════════════════ */

/* ── Estado ── */
let seccionActiva  = 'propiedades';
let juegoActivo    = null;

/* ════════════════════════════════════════════
   INICIALIZACIÓN
   Se llama desde index.html después de cargar
   todos los scripts.
   ════════════════════════════════════════════ */
function initMinijuegos() {
  crearArcadeBtn();
  crearHubScreen();
  crearPreviewScreen();
}

/* ════════════════════════════════════════════
   BOTÓN ARCADE FLOTANTE
   Aparece en la esquina inferior izquierda
   de la pantalla del Modelo Estándar.
   ════════════════════════════════════════════ */
function crearArcadeBtn() {
  const btn = document.createElement('div');
  btn.id        = 'arcade-btn';
  btn.className = 'arcade-btn';
  btn.innerHTML = `
    <canvas id="arcade-canvas" class="arcade-img" width="120" height="120"></canvas>
    <div class="arcade-label">MINIJUEGOS</div>
  `;
  btn.addEventListener('click', () => abrirHub());
  document.getElementById('screen-me').appendChild(btn);

  /* Cargar imagen del arcade eliminando fondo negro via Canvas */
  removeBgMJ('assets/arcade.png', 'arcade-canvas', 120);
}

/* ════════════════════════════════════════════
   PANTALLA HUB
   Overlay encima de todo con:
   - sidebar de secciones (izquierda)
   - grid de minijuegos (derecha)
   ════════════════════════════════════════════ */
function crearHubScreen() {
  const hub = document.createElement('div');
  hub.id        = 'minijuegos-hub';
  hub.className = 'mj-overlay hidden';

  hub.innerHTML = `
    <div class="mj-hub-wrap">

      <!-- Header -->
      <div class="mj-header">
        <div class="mj-title retro-text">MINIJUEGOS</div>
        <button class="mj-close-btn" onclick="cerrarHub()">✕</button>
      </div>

      <!-- Body -->
      <div class="mj-body">

        <!-- Sidebar secciones -->
        <div class="mj-sidebar" id="mj-sidebar"></div>

        <!-- Grid de juegos -->
        <div class="mj-grid-wrap">
          <div class="mj-grid" id="mj-grid"></div>
        </div>

      </div>
    </div>
  `;

  document.getElementById('app').appendChild(hub);
  renderSidebar();
  renderGrid(seccionActiva);
}

/* ── Sidebar: lista de secciones ── */
function renderSidebar() {
  const sb = document.getElementById('mj-sidebar');
  sb.innerHTML = '';

  MINIJUEGOS_DATA.forEach(seccion => {
    const abierta = Progreso.etapaDesbloqueada(seccion.fase);
    const btn = document.createElement('button');
    btn.className = `mj-sec-btn ${seccion.id === seccionActiva ? 'active' : ''} ${abierta ? '' : 'bloqueada'}`;
    btn.style.setProperty('--sec-color', seccion.color);
    btn.textContent = seccion.label;
    btn.title = abierta
      ? seccion.label
      : `🔒 Se desbloquea en la Etapa ${seccion.fase}: ${Progreso.ETAPAS[seccion.fase].nombre}`;
    btn.addEventListener('click', () => {
      seccionActiva = seccion.id;
      renderSidebar();
      renderGrid(seccion.id);
    });
    sb.appendChild(btn);
  });
}

/* Devuelve la sección abierta de fase más alta */
function _ultimaSeccionAbierta() {
  let elegida = MINIJUEGOS_DATA[0];
  MINIJUEGOS_DATA.forEach(s => { if (Progreso.etapaDesbloqueada(s.fase)) elegida = s; });
  return elegida.id;
}

/* Aviso que sustituye al grid cuando la sección está bloqueada */
function _bloqueoSeccionEl(seccion) {
  const info = Progreso.requisitosEtapa(seccion.fase);
  const nombre = id => {
    const j = MINIJUEGOS_TODOS.find(x => x.id === id);
    return j ? j.nombre : id;
  };
  const chips = (info.juegos || []).map(j => `
    <span class="mj-bloqueo-chip ${j.superado ? 'hecho' : ''}">
      ${j.superado ? '✅' : '◻'} ${nombre(j.id)} (${Math.min(j.hechos, j.requeridos)}/${j.requeridos})
    </span>`).join('');

  const div = document.createElement('div');
  div.className = 'mj-bloqueo-aviso';
  div.innerHTML = `
    <div class="mj-bloqueo-titulo">🔒 ${seccion.label}</div>
    <div class="mj-bloqueo-txt">
      Esta sección se abre en la <strong>Etapa ${seccion.fase} · ${Progreso.ETAPAS[seccion.fase].nombre}</strong>.
      Para desbloquearla hay que superar los niveles básicos de los minijuegos de la
      Etapa ${info.etapa}:
    </div>
    <div class="mj-bloqueo-lista">${chips || '<span class="mj-bloqueo-chip">—</span>'}</div>
    <div class="mj-bloqueo-txt">Abre tu perfil (👤) para ver el detalle de tu avance.</div>
  `;
  return div;
}

/* ── Grid: minijuegos de la sección activa ── */
function renderGrid(seccionId) {
  const grid    = document.getElementById('mj-grid');
  const seccion = MINIJUEGOS_DATA.find(s => s.id === seccionId);
  grid.innerHTML = '';

  /* Sección todavía bloqueada: mostramos qué falta en vez de las tarjetas */
  if (!Progreso.etapaDesbloqueada(seccion.fase)) {
    grid.appendChild(_bloqueoSeccionEl(seccion));
    return;
  }

  seccion.juegos.forEach(juego => {
    const card = document.createElement('div');
    card.className = `mj-card ${juego.esPlaceholder ? 'placeholder' : ''}`;

    /* Canvas para remover fondo negro del asset */
    const canvasId = `mj-canvas-${juego.id}`;
    card.innerHTML = `
      <div class="mj-card-img-wrap">
        <canvas class="mj-card-img" id="${canvasId}"></canvas>
      </div>
      <div class="mj-card-nombre">${juego.nombre}</div>
    `;

    if (!juego.esPlaceholder) {
      card.addEventListener('click', () => abrirPreview(juego));
    }

    grid.appendChild(card);

    /* Cargar asset con remoción de fondo negro */
    removeBgMJ(juego.asset, canvasId, 110);
  });
}

/* ════════════════════════════════════════════
   PANTALLA PREVIEW DE JUEGO
   Descripción + botón JUGAR
   ════════════════════════════════════════════ */
function crearPreviewScreen() {
  const prev = document.createElement('div');
  prev.id        = 'minijuegos-preview';
  prev.className = 'mj-overlay hidden';

  prev.innerHTML = `
    <div class="mj-preview-wrap">
      <button class="mj-close-btn" onclick="cerrarPreview()">✕</button>
      <button class="mj-back-btn" onclick="cerrarPreview()">← Volver</button>

      <div class="mj-preview-body">
        <div class="mj-preview-img-col">
          <canvas id="preview-canvas" class="mj-preview-canvas"></canvas>
        </div>
        <div class="mj-preview-info-col">
          <div class="mj-preview-title retro-text" id="preview-title"></div>
          <p class="mj-preview-desc" id="preview-desc"></p>
          <div class="mj-preview-estado" id="preview-estado"></div>
          <button class="mj-jugar-btn retro-text" id="preview-jugar-btn">
            ▶ JUGAR
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('app').appendChild(prev);
}

function abrirPreview(juego) {
  juegoActivo = juego;
  const prev = document.getElementById('minijuegos-preview');

  document.getElementById('preview-title').textContent = juego.nombre;
  document.getElementById('preview-desc').textContent  = juego.desc;

  const estadoEl = document.getElementById('preview-estado');
  if (juego.disponible) {
    estadoEl.innerHTML = '<span class="estado-ready">✔ Listo para jugar</span>';
  } else {
    estadoEl.innerHTML = '<span class="estado-soon">🔒 Próximamente</span>';
  }

  const jugarBtn = document.getElementById('preview-jugar-btn');
  jugarBtn.disabled = !juego.disponible;
  jugarBtn.onclick = juego.disponible
    ? () => iniciarJuego(juego.id)
    : null;

  removeBgMJ(juego.asset, 'preview-canvas', 180);

  prev.classList.remove('hidden');
  /* Mantener hub detrás */
}

function cerrarPreview() {
  document.getElementById('minijuegos-preview').classList.add('hidden');
  juegoActivo = null;
}

/* ════════════════════════════════════════════
   ABRIR / CERRAR HUB
   ════════════════════════════════════════════ */
function abrirHub(seccionOpcional) {
  if (seccionOpcional) {
    /* Sección pedida explícitamente: se muestra, aunque esté
       bloqueada, para que el jugador vea qué le falta. */
    seccionActiva = seccionOpcional;
  } else {
    /* Apertura normal: si la sección recordada ya no está
       disponible, saltamos a la abierta de fase más alta. */
    const sec = MINIJUEGOS_DATA.find(s => s.id === seccionActiva);
    if (!sec || !Progreso.etapaDesbloqueada(sec.fase)) {
      seccionActiva = _ultimaSeccionAbierta();
    }
  }
  renderSidebar();
  renderGrid(seccionActiva);
  document.getElementById('minijuegos-hub').classList.remove('hidden');
}

function cerrarHub() {
  document.getElementById('minijuegos-hub').classList.add('hidden');
  cerrarPreview();
}

/* ════════════════════════════════════════════
   ACCESO DESDE PANEL DE PARTÍCULA
   Se llama desde detail.js cuando el usuario
   hace clic en una propiedad que tiene juego.
   ════════════════════════════════════════════ */
function abrirJuegoDesdeProp(propKey) {
  /* Buscar el juego por propKey en todas las secciones */
  for (const seccion of MINIJUEGOS_DATA) {
    const juego = seccion.juegos.find(j => j.propKey === propKey);
    if (!juego) continue;

    /* La sección puede estar todavía bloqueada por etapa */
    if (!Progreso.etapaDesbloqueada(seccion.fase)) {
      Progreso.avisar(
        `🔒 "${juego.nombre}" se abre en la Etapa ${seccion.fase} · ` +
        `${Progreso.ETAPAS[seccion.fase].nombre}.`
      );
      return;
    }
    abrirPreview(juego);
    return;
  }
}

/* ════════════════════════════════════════════
   INICIAR JUEGO
   Cada minijuego tiene su propio .js que
   expone una función global iniciar_GAMEID().
   ════════════════════════════════════════════ */
function iniciarJuego(id) {
  const fnName = `iniciar_${id.replace(/-/g, '_')}`;
  if (typeof window[fnName] === 'function') {
    cerrarHub();
    cerrarPreview();
    window[fnName]();
  } else {
    console.warn(`Minijuego "${id}" aún no implementado (función ${fnName} no encontrada).`);
  }
}

/* ════════════════════════════════════════════
   HELPER: Remoción de fondo negro via Canvas
   Reutiliza la misma lógica de intro.js
   ════════════════════════════════════════════ */
function removeBgMJ(src, canvasId, size) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.onload = function() {
    const ratio = Math.min(size / img.width, size / img.height);
    const w = img.width  * ratio;
    const h = img.height * ratio;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

    const iData = ctx.getImageData(0, 0, size, size);
    const d = iData.data;
    const THRESH = 40, TOL = 65;
    for (let i = 0; i < d.length; i += 4) {
      const bright = (d[i] + d[i+1] + d[i+2]) / 3;
      if      (bright < THRESH) d[i+3] = 0;
      else if (bright < TOL)    d[i+3] = Math.round(((bright - THRESH) / (TOL - THRESH)) * 255);
    }
    ctx.putImageData(iData, 0, 0);
  };
  img.onerror = () => console.warn('Asset no encontrado:', src);
  img.src = src;
}

/* ════════════════════════════════════════════
   HELPER: Fondo oscuro cuadriculado
   Estética común a todos los minijuegos.
   Lo llaman spin, masa y decaimiento al inicio
   de cada fotograma de sus canvas, así que debe
   ser autónomo y no dejar estado sucio en el ctx.
   ════════════════════════════════════════════ */
function mjGridBackground(ctx, W, H) {
  if (!ctx) return;

  ctx.save();
  ctx.clearRect(0, 0, W, H);

  /* Degradado base: el mismo que usa el resto de minijuegos */
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0a0520');
  bg.addColorStop(1, '#04020f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  /* Rejilla sutil cada 40 px (trazada en un solo path: es mucho más
     económico que un stroke por línea, y esto corre en cada fotograma) */
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < W; x += 40) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
  for (let y = 0; y < H; y += 40) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
  ctx.stroke();

  ctx.restore();
}
