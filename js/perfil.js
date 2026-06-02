/* ══════════════════════════════════════════
   js/perfil.js
   Panel de perfil global: logros, historial
   de puntajes y progreso (esquina sup. izq.)
   ══════════════════════════════════════════ */

/* ── Inicializar botón de perfil y panel ── */
function initPerfil() {
  /* Botón en la navbar */
  const nav = document.querySelector('.nav');
  const btn = document.createElement('button');
  btn.id        = 'perfil-btn';
  btn.className = 'perfil-nav-btn';
  btn.title     = 'Mi perfil';
  btn.innerHTML = `<span class="perfil-avatar">👤</span>`;
  btn.addEventListener('click', togglePerfil);
  nav.insertBefore(btn, nav.querySelector('.nav-btns'));

  /* Panel de perfil */
  const panel = document.createElement('div');
  panel.id        = 'perfil-panel';
  panel.className = 'perfil-panel hidden';
  document.getElementById('app').appendChild(panel);

  renderPerfil();
}

/* ── Toggle ── */
function togglePerfil() {
  const panel = document.getElementById('perfil-panel');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) renderPerfil();
}

function cerrarPerfil() {
  document.getElementById('perfil-panel').classList.add('hidden');
}

/* ── Datos del perfil (localStorage hasta BD) ── */
function getDatosCC() {
  return JSON.parse(localStorage.getItem('cc_historial') || '[]');
}

function getMejorPuntaje() {
  const hist = getDatosCC();
  if (!hist.length) return null;
  return hist.reduce((best, e) => e.puntaje > best.puntaje ? e : best, hist[0]);
}

function getLogroCC(pts) {
  const LOGROS = [
    { nombre:'Diamante', min:3500, emoji:'💎', color:'#b9f2ff' },
    { nombre:'Oro',      min:2500, emoji:'🥇', color:'#ffd740' },
    { nombre:'Plata',    min:1500, emoji:'🥈', color:'#c0c0c0' },
    { nombre:'Bronce',   min:0,    emoji:'🥉', color:'#cd7f32' }
  ];
  return LOGROS.find(l => pts >= l.min) || LOGROS[LOGROS.length-1];
}

/* ── Render del panel ── */
function renderPerfil() {
  const panel = document.getElementById('perfil-panel');
  const hist  = getDatosCC();
  const mejor = getMejorPuntaje();

  /* Logros obtenidos (únicos) */
  const logrosObtenidos = [...new Set(hist.map(e => e.logro))];
  const LOGROS_ORDER = ['Diamante','Oro','Plata','Bronce'];
  const logrosRender = LOGROS_ORDER.map(nombre => {
    const obtenido = logrosObtenidos.includes(nombre);
    const info = getLogroCC(
      nombre==='Diamante' ? 3500 :
      nombre==='Oro'      ? 2500 :
      nombre==='Plata'    ? 1500 : 0
    );
    return { nombre, obtenido, ...info };
  });

  panel.innerHTML = `
    <div class="perfil-header">
      <div class="perfil-avatar-big">👤</div>
      <div class="perfil-header-info">
        <div class="perfil-username retro-text">JUGADOR</div>
        <div class="perfil-sub">Explorador del Modelo Estándar</div>
      </div>
      <button class="perfil-close" onclick="cerrarPerfil()">✕</button>
    </div>

    <!-- Sección: Logros del minijuego Carga de Color -->
    <div class="perfil-section">
      <div class="perfil-section-title">⚛ Carga de Color — Modo Libre</div>

      ${mejor ? `
        <div class="perfil-mejor">
          <span class="perfil-mejor-label">Mejor puntaje</span>
          <span class="perfil-mejor-val" style="color:${getLogroCC(mejor.puntaje).color}">
            ${getLogroCC(mejor.puntaje).emoji} ${mejor.puntaje} pts
          </span>
        </div>
      ` : `<div class="perfil-empty">Aún no has jugado el Modo Libre</div>`}

      <!-- Logros -->
      <div class="perfil-logros-grid">
        ${logrosRender.map(l => `
          <div class="perfil-logro-item ${l.obtenido ? 'obtenido' : 'bloqueado'}"
               style="--lcolor:${l.color}">
            <div class="perfil-logro-emoji">${l.obtenido ? l.emoji : '🔒'}</div>
            <div class="perfil-logro-nombre">${l.nombre}</div>
            <div class="perfil-logro-req">${
              l.nombre==='Bronce'   ? '0+ pts'    :
              l.nombre==='Plata'    ? '1500+ pts'  :
              l.nombre==='Oro'      ? '2500+ pts'  : '3500+ pts'
            }</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Sección: Historial de partidas -->
    <div class="perfil-section">
      <div class="perfil-section-title">📋 Historial — Últimas partidas</div>
      ${hist.length ? `
        <div class="perfil-historial">
          <div class="perfil-hist-head">
            <span>Fecha</span><span>Puntaje</span><span>Combos</span><span>Errores</span><span>Logro</span>
          </div>
          ${hist.map(e => {
            const l = getLogroCC(e.puntaje);
            return `
              <div class="perfil-hist-row">
                <span>${e.fecha}</span>
                <span style="color:${l.color};font-weight:700">${e.puntaje}</span>
                <span>${e.combos}</span>
                <span style="color:#ff5252">${e.errores}</span>
                <span>${l.emoji} ${l.nombre}</span>
              </div>`;
          }).join('')}
        </div>
      ` : `<div class="perfil-empty">Sin partidas registradas aún.</div>`}
    </div>

    <!-- Sección: Progreso (placeholder para futuras fases) -->
    <div class="perfil-section perfil-section-locked">
      <div class="perfil-section-title">🔒 Progreso de desbloqueos</div>
      <div class="perfil-empty">Disponible cuando se implemente el sistema de desbloqueos.</div>
    </div>

    <div class="perfil-footer">
      Más funciones disponibles cuando se conecte la base de datos.
    </div>
  `;
}

/* ── Llamado desde minijuego al terminar partida ── */
function actualizarPerfil() {
  const panel = document.getElementById('perfil-panel');
  if (panel && !panel.classList.contains('hidden')) renderPerfil();
  /* Actualizar el avatar del botón con el mejor logro */
  const hist  = getDatosCC();
  const mejor = getMejorPuntaje();
  const btn   = document.getElementById('perfil-btn');
  if (!btn || !mejor) return;
  const logro = getLogroCC(mejor.puntaje);
  btn.innerHTML = `<span class="perfil-avatar" style="filter:drop-shadow(0 0 6px ${logro.color})">${logro.emoji}</span>`;
}
