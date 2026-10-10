/* ══════════════════════════════════════════
   js/perfil.js
   Panel de perfil global (esquina sup. izq.):
     · Progreso de desbloqueos por etapa
     · Logros y mejores puntajes por minijuego
     · Historial de partidas
   Todos los datos salen de js/progreso.js,
   que es la fuente única de verdad.
   ══════════════════════════════════════════ */

/* Vista activa del panel */
let _perfilVista = 'progreso';

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

  /* Botón de cuenta, al final de la navegación */
  const btnCuenta = document.createElement('button');
  btnCuenta.id          = 'btn-cuenta';
  btnCuenta.textContent = 'Entrar';
  btnCuenta.title       = 'Tu cuenta';
  btnCuenta.addEventListener('click', () => {
    const A = (typeof HiggsAuth !== 'undefined') ? HiggsAuth : null;
    if (!A) { togglePerfil(); return; }
    const u = A.estado().usuario;
    /* Con una cuenta de correo, el botón lleva al perfil;
       como invitado o sin sesión, abre la pantalla de acceso. */
    if (u && !u.anonimo) togglePerfil();
    else A.abrir('entrar');
  });
  nav.querySelector('.nav-btns').appendChild(btnCuenta);

  /* Panel de perfil */
  const panel = document.createElement('div');
  panel.id        = 'perfil-panel';
  panel.className = 'perfil-panel hidden';
  document.getElementById('app').appendChild(panel);

  /* Reaccionar a los cambios de sesión y de sincronización */
  if (typeof HiggsAuth !== 'undefined') {
    HiggsAuth.alCambiar(() => {
      if (typeof HiggsAuth.pintar === 'function') HiggsAuth.pintar();
      const p = document.getElementById('perfil-panel');
      if (p && !p.classList.contains('hidden')) renderPerfil();
    });
  }

  renderPerfil();
  actualizarAvatarPerfil();
}

/* ══════════════════════════════════════════
   ACCIONES DE CUENTA
   ══════════════════════════════════════════ */
function abrirAuth(modo) {
  if (typeof HiggsAuth === 'undefined') return;
  cerrarPerfil();
  HiggsAuth.abrir(modo || 'entrar');
}

function cerrarSesion() {
  if (typeof HiggsAuth === 'undefined') return;
  if (!confirm('¿Cerrar sesión? Tu progreso queda guardado en tu cuenta y podrás recuperarlo al volver a entrar.')) return;
  cerrarPerfil();
  HiggsAuth.salir().catch(e => {
    if (typeof Progreso !== 'undefined') Progreso.avisar('No se pudo cerrar sesión: ' + (e.message || e));
  });
}

function reenviarVerificacionAuth() {
  if (typeof HiggsAuth === 'undefined') return;
  HiggsAuth.reenviarVerificacion()
    .then(() => Progreso.avisar('📧 Te enviamos un correo para confirmar tu cuenta.'))
    .catch(e => Progreso.avisar('No se pudo enviar el correo: ' + (e.message || e)));
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

/* ── Cambio de pestaña ── */
function cambiarVistaPerfil(vista) {
  _perfilVista = vista;
  renderPerfil();
}

/* ══════════════════════════════════════════
   COMPATIBILIDAD
   Se mantienen estos ayudantes porque otros
   archivos (minijuego-carga-color.js) los usan.
   ══════════════════════════════════════════ */
function getDatosCC()            { return Progreso.historial('carga-color'); }
function getMejorPuntaje()       { return Progreso.mejorPuntaje('carga-color'); }
function getLogroCC(pts)         { return Progreso.logroDe('carga-color', pts); }

/* ══════════════════════════════════════════
   VISTA: PROGRESO
   ══════════════════════════════════════════ */
function _vistaProgreso() {
  const etapaMax = Progreso.etapaMaxima();

  /* ── Lista de etapas ── */
  const filasEtapas = [1, 2, 3, 4].map(n => {
    const abierta = Progreso.etapaDesbloqueada(n);
    const esActual = abierta && n === etapaMax;
    const e = Progreso.ETAPAS[n];
    const icono = abierta ? (esActual ? '🎯' : '✅') : '🔒';
    const estado = abierta ? (esActual ? 'EN CURSO' : 'ABIERTA') : 'BLOQUEADA';
    return `
      <div class="perfil-etapa ${abierta ? 'abierta' : ''} ${esActual ? 'actual' : ''}">
        <div class="perfil-etapa-icono">${icono}</div>
        <div class="perfil-etapa-info">
          <div class="perfil-etapa-nombre">Etapa ${n} · ${e.nombre}</div>
          <div class="perfil-etapa-detalle">${e.detalle}</div>
        </div>
        <div class="perfil-etapa-estado">${estado}</div>
      </div>`;
  }).join('');

  /* ── Progreso hacia la siguiente etapa ── */
  let bloqueSiguiente;
  if (etapaMax >= 4) {
    bloqueSiguiente = `
      <div class="perfil-prog-nota" style="color:var(--glow, #ffd740);text-align:center;padding:6px 0">
        🏆 ¡Has desbloqueado todo el Modelo Estándar!
      </div>`;
  } else {
    const sig  = etapaMax + 1;
    const info = Progreso.requisitosEtapa(sig);
    const pct  = info.total ? (info.hechos / info.total) * 100 : 0;
    bloqueSiguiente = `
      <div class="perfil-section-title" style="margin-top:14px">
        Progreso hacia la Etapa ${sig} · ${Progreso.ETAPAS[sig].nombre}
      </div>
      <div class="perfil-prog-barra-wrap">
        <div class="perfil-prog-barra" style="width:${pct}%"></div>
      </div>
      <div class="perfil-prog-nota">
        ${info.hechos} de ${info.total} minijuegos de la Etapa ${info.etapa} superados.
      </div>`;
  }

  /* ── Minijuegos de la etapa en curso ── */
  const juegosEtapa = Progreso.ETAPAS[etapaMax].minijuegos;
  const filasJuegos = juegosEtapa.map(id => {
    const hechos  = Progreso.modulosCompletados(id);
    const req     = Progreso.MODULOS_REQUERIDOS[id] || 1;
    const sup     = Progreso.superado(id);
    const nombre  = _perfilNombreJuego(id);
    return `
      <div class="perfil-juego-fila ${sup ? 'superado' : ''}">
        <span class="perfil-juego-nombre">${sup ? '✅' : '◻'} ${nombre}</span>
        <span class="perfil-juego-prog">${Math.min(hechos, req)} / ${req} módulos</span>
      </div>`;
  }).join('');

  return `
    <div class="perfil-section">
      <div class="perfil-section-title">🧭 Etapas del proyecto</div>
      ${filasEtapas}
      ${bloqueSiguiente}
    </div>

    <div class="perfil-section">
      <div class="perfil-section-title">
        🎮 Minijuegos de la Etapa ${etapaMax}
      </div>
      ${filasJuegos || '<div class="perfil-empty">Esta etapa no tiene minijuegos.</div>'}
    </div>

    <div class="perfil-section">
      <button class="perfil-reiniciar" onclick="reiniciarProgreso()">
        ↺ Reiniciar todo el progreso
      </button>
    </div>`;
}

function _perfilNombreJuego(id) {
  if (typeof MINIJUEGOS_TODOS !== 'undefined') {
    const j = MINIJUEGOS_TODOS.find(x => x.id === id);
    if (j) return j.nombre;
  }
  return id;
}

function reiniciarProgreso() {
  if (!confirm('¿Borrar todo tu progreso, logros e historial? Esta acción no se puede deshacer.')) return;
  Progreso.reiniciar();
  renderPerfil();
  refrescarUIProgreso();
}

/* ══════════════════════════════════════════
   VISTA: LOGROS
   ══════════════════════════════════════════ */
function _vistaLogros() {
  const hist    = Progreso.historial();
  const tocados = Progreso.juegosTocados();
  const ORDEN   = ['Diamante', 'Oro', 'Plata', 'Bronce'];

  /* Medallas conseguidas en cualquier minijuego */
  const obtenidas = [...new Set(hist.map(e => e.logro))];

  const grid = ORDEN.map(nombre => {
    const m = Progreso.MEDALLAS[nombre];
    const ok = obtenidas.includes(nombre);
    return `
      <div class="perfil-logro-item ${ok ? 'obtenido' : 'bloqueado'}"
           style="--lcolor:${m.color}">
        <div class="perfil-logro-emoji">${ok ? m.emoji : '🔒'}</div>
        <div class="perfil-logro-nombre">${nombre}</div>
        <div class="perfil-logro-req">${ok ? 'conseguido' : '—'}</div>
      </div>`;
  }).join('');

  /* Mejor puntaje por minijuego */
  const filas = tocados.length ? tocados.map(id => {
    const mejor = Progreso.mejorPuntaje(id);
    const l     = mejor ? Progreso.logroDe(id, mejor.puntaje) : null;
    return `
      <div class="perfil-juego-fila ${Progreso.superado(id) ? 'superado' : ''}">
        <span class="perfil-juego-nombre">${_perfilNombreJuego(id)}</span>
        <span class="perfil-juego-prog" style="${l ? 'color:' + l.color : ''}">
          ${mejor ? `${l.emoji} ${mejor.puntaje} pts` : 'sin partidas'}
        </span>
      </div>`;
  }).join('') : '<div class="perfil-empty">Aún no has jugado ningún minijuego puntuado.</div>';

  return `
    <div class="perfil-section">
      <div class="perfil-section-title">🏅 Medallas</div>
      <div class="perfil-logros-grid">${grid}</div>
      <div class="perfil-prog-nota" style="margin-top:10px;text-align:center">
        Cada minijuego tiene sus propios umbrales de puntaje.
      </div>
    </div>

    <div class="perfil-section">
      <div class="perfil-section-title">📊 Mejor puntaje por minijuego</div>
      ${filas}
    </div>`;
}

/* ══════════════════════════════════════════
   VISTA: HISTORIAL
   ══════════════════════════════════════════ */
function _vistaHistorial() {
  const hist = Progreso.historial().slice(0, 15);

  if (!hist.length) {
    return `
      <div class="perfil-section">
        <div class="perfil-section-title">📋 Historial — Últimas partidas</div>
        <div class="perfil-empty">Sin partidas registradas aún.</div>
      </div>`;
  }

  const filas = hist.map(e => {
    const l = Progreso.logroDe(e.juego, e.puntaje);
    return `
      <div class="perfil-hist-row">
        <span>${e.fecha}</span>
        <span>${_perfilNombreJuego(e.juego)}</span>
        <span style="color:${l.color};font-weight:700">${e.puntaje}</span>
        <span>${l.emoji} ${l.nombre}</span>
      </div>`;
  }).join('');

  return `
    <div class="perfil-section">
      <div class="perfil-section-title">📋 Historial — Últimas partidas</div>
      <div class="perfil-historial">
        <div class="perfil-hist-head">
          <span>Fecha</span><span>Minijuego</span><span>Puntaje</span><span>Logro</span>
        </div>
        ${filas}
      </div>
    </div>`;
}

/* ══════════════════════════════════════════
   SECCIÓN DE CUENTA
   ══════════════════════════════════════════ */
function _authEstado() {
  if (typeof HiggsAuth === 'undefined') {
    return { modo: 'sin-configurar', usuario: null, mensaje: '', sincronizando: false };
  }
  return HiggsAuth.estado();
}

function _nombreMostrado(est) {
  const u = est.usuario;
  if (!u) return 'JUGADOR';
  if (u.anonimo) return 'INVITADO';
  const base = u.nombre || (u.correo || '').split('@')[0] || 'JUGADOR';
  return base.toUpperCase();
}

/* Aviso cuando la nube rechaza guardar. Sin esto, un fallo de
   permisos o de conexión pasaría completamente desapercibido:
   el progreso se seguiría guardando en el navegador y nada más. */
function _avisoSincronizacion() {
  if (typeof Progreso === 'undefined' || typeof Progreso.estadoNube !== 'function') return '';
  const n = Progreso.estadoNube();
  if (!n.conectado || !n.ultimoError) return '';

  const dePermisos = /permission-denied|insufficient|unauthorized/i.test(n.ultimoError);
  const detalle = dePermisos
    ? 'Parece que las reglas de seguridad de Firestore todavía no están publicadas. ' +
      'Copia el contenido de <b>firestore.rules</b> en Firestore&nbsp;→&nbsp;Reglas y pulsa Publicar.'
    : 'Detalle técnico: ' + n.ultimoError;

  return `
    <div class="perfil-sync-error">
      ⚠️ <b>No se pudo guardar en la nube.</b><br>
      ${detalle}<br>
      <span class="perfil-sync-nota">Tu progreso no se ha perdido: sigue guardado en este navegador.</span>
    </div>`;
}

function _vistaCuenta() {
  const est = _authEstado();
  const u   = est.usuario;

  /* ── Firebase todavía no configurado, o abierto con file:// ── */
  if (est.modo === 'sin-configurar' || est.modo === 'archivo-local') {
    return `
      <div class="perfil-cuenta">
        <div class="perfil-cuenta-icono">💾</div>
        <div class="perfil-cuenta-info">
          <div class="perfil-cuenta-titulo">Progreso local</div>
          <div class="perfil-cuenta-detalle">Guardado solo en este navegador</div>
        </div>
      </div>
      <div class="perfil-cuenta-aviso">${est.mensaje || ''}</div>`;
  }

  if (est.modo === 'cargando') {
    return `
      <div class="perfil-cuenta">
        <div class="perfil-cuenta-icono">⏳</div>
        <div class="perfil-cuenta-info">
          <div class="perfil-cuenta-titulo">Conectando…</div>
          <div class="perfil-cuenta-detalle">Preparando las cuentas</div>
        </div>
      </div>`;
  }

  if (est.modo === 'error') {
    return `
      <div class="perfil-cuenta">
        <div class="perfil-cuenta-icono">⚠️</div>
        <div class="perfil-cuenta-info">
          <div class="perfil-cuenta-titulo">Sin conexión con la nube</div>
          <div class="perfil-cuenta-detalle">Sigues jugando con progreso local</div>
        </div>
      </div>
      <div class="perfil-cuenta-aviso">${est.mensaje || ''}</div>`;
  }

  /* ── Sin sesión ── */
  if (!u) {
    return `
      <div class="perfil-cuenta">
        <div class="perfil-cuenta-icono">👤</div>
        <div class="perfil-cuenta-info">
          <div class="perfil-cuenta-titulo">Sin sesión</div>
          <div class="perfil-cuenta-detalle">Entra para llevar tu progreso a cualquier equipo</div>
        </div>
      </div>
      <div class="perfil-cuenta-btns">
        <button class="perfil-cuenta-btn" onclick="abrirAuth('entrar')">Entrar</button>
        <button class="perfil-cuenta-btn" onclick="abrirAuth('crear')">Crear cuenta</button>
      </div>`;
  }

  /* ── Sesión anónima (invitado) ── */
  if (u.anonimo) {
    const detalle = est.sincronizando
      ? 'Sincronizando tu progreso…'
      : 'Tu progreso ya se guarda en la nube';
    return `
      <div class="perfil-cuenta invitado">
        <div class="perfil-cuenta-icono">🎒</div>
        <div class="perfil-cuenta-info">
          <div class="perfil-cuenta-titulo">Jugando como invitado</div>
          <div class="perfil-cuenta-detalle">${detalle}</div>
        </div>
      </div>
      <div class="perfil-cuenta-btns">
        <button class="perfil-cuenta-btn" onclick="abrirAuth('crear')">Crear cuenta y conservar mi progreso</button>
        <button class="perfil-cuenta-btn" onclick="abrirAuth('entrar')">Ya tengo una cuenta</button>
      </div>`;
  }

  /* ── Cuenta con correo ── */
  return `
    <div class="perfil-cuenta">
      <div class="perfil-cuenta-icono">${u.verificado ? '✅' : '📧'}</div>
      <div class="perfil-cuenta-info">
        <div class="perfil-cuenta-titulo">${_nombreMostrado(est)}</div>
        <div class="perfil-cuenta-detalle" title="${u.correo}">${u.correo}</div>
      </div>
    </div>
    <div class="perfil-cuenta-btns">
      ${u.verificado ? '' : '<button class="perfil-cuenta-btn" onclick="reenviarVerificacionAuth()">Confirmar mi correo</button>'}
      <button class="perfil-cuenta-btn peligro" onclick="cerrarSesion()">Cerrar sesión</button>
    </div>`;
}

/* ══════════════════════════════════════════
   RENDER DEL PANEL
   ══════════════════════════════════════════ */
function renderPerfil() {
  const panel = document.getElementById('perfil-panel');
  if (!panel) return;

  const etapaMax = Progreso.etapaMaxima();
  const est      = _authEstado();

  const cuerpo =
    _perfilVista === 'logros'    ? _vistaLogros()    :
    _perfilVista === 'historial' ? _vistaHistorial() :
                                   _vistaProgreso();

  const enNube = est.modo === 'listo' && est.usuario;

  panel.innerHTML = `
    <div class="perfil-header">
      <div class="perfil-avatar-big">👤</div>
      <div class="perfil-header-info">
        <div class="perfil-username retro-text">${_nombreMostrado(est)}</div>
        <div class="perfil-sub">Explorador del Modelo Estándar · Etapa ${etapaMax}</div>
      </div>
      <button class="perfil-close" onclick="cerrarPerfil()">✕</button>
    </div>

    <div class="perfil-section">${_vistaCuenta()}${_avisoSincronizacion()}</div>

    <div class="perfil-tabs">
      <button class="perfil-tab ${_perfilVista === 'progreso'  ? 'active' : ''}"
              onclick="cambiarVistaPerfil('progreso')">Progreso</button>
      <button class="perfil-tab ${_perfilVista === 'logros'    ? 'active' : ''}"
              onclick="cambiarVistaPerfil('logros')">Logros</button>
      <button class="perfil-tab ${_perfilVista === 'historial' ? 'active' : ''}"
              onclick="cambiarVistaPerfil('historial')">Historial</button>
    </div>

    <div class="perfil-vista">${cuerpo}</div>

    <div class="perfil-footer">
      ${enNube
        ? 'Progreso sincronizado con tu cuenta.'
        : 'Progreso guardado en este navegador (localStorage).'}
    </div>
  `;
}

/* ── Llamado desde minijuego al terminar partida o módulo ── */
function actualizarPerfil() {
  const panel = document.getElementById('perfil-panel');
  if (panel && !panel.classList.contains('hidden')) renderPerfil();
  actualizarAvatarPerfil();
}

/* El avatar muestra la mejor medalla conseguida */
function actualizarAvatarPerfil() {
  const btn = document.getElementById('perfil-btn');
  if (!btn) return;

  let mejor = null;
  Progreso.juegosTocados().forEach(id => {
    const m = Progreso.mejorPuntaje(id);
    if (m && (!mejor || m.puntaje > mejor.puntaje)) mejor = m;
  });

  if (!mejor) {
    btn.innerHTML = `<span class="perfil-avatar">👤</span>`;
    return;
  }
  const l = Progreso.logroDe(mejor.juego, mejor.puntaje);
  btn.innerHTML = `<span class="perfil-avatar" style="filter:drop-shadow(0 0 6px ${l.color})">${l.emoji}</span>`;
}
