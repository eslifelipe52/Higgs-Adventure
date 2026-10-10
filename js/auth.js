/* ══════════════════════════════════════════
   js/auth.js
   Autenticación con Firebase para Higgs Adventure.

   Se carga como módulo (`<script type="module">`) porque el SDK
   moderno de Firebase se distribuye así. El resto del sitio sigue
   siendo JavaScript clásico: este archivo se comunica con él a
   través del objeto global `window.HiggsAuth` y de la API de
   `Progreso`.

   ── FILOSOFÍA ──────────────────────────────
   El sitio NUNCA debe romperse por culpa de Firebase. Si no está
   configurado, si no hay internet o si el CDN falla, todo sigue
   funcionando con el progreso local de siempre y se avisa al
   usuario en el panel de perfil.

   ── API PÚBLICA (window.HiggsAuth) ─────────
     disponible            → bool, ¿hay Firebase operativo?
     modo                  → 'sin-configurar' | 'archivo-local'
                             | 'cargando' | 'listo' | 'error'
     estado()              → { modo, usuario, mensaje, sincronizando }
     alCambiar(fn)         → suscribirse a cambios de estado
     abrir(modo)           → abre la pantalla ('entrar' | 'crear')
     cerrar()
     registrar(correo, contrasena, nombre)
     entrar(correo, contrasena)
     invitado()            → sesión anónima
     vincular(correo, contrasena)
     recuperar(correo)
     reenviarVerificacion()
     salir()
   ══════════════════════════════════════════ */

/* ── Estado interno ── */
const _estado = {
  modo: 'cargando',      /* sin-configurar | archivo-local | cargando | listo | error */
  usuario: null,         /* { uid, correo, anonimo, verificado, nombre } */
  mensaje: '',           /* explicación del modo actual, para el perfil */
  sincronizando: false
};

let _fb        = null;   /* referencias del SDK */
let _auth      = null;
let _db        = null;
let _suscriptores = [];
let _ui        = null;

/* ── Utilidades ── */
function _avisar() {
  const copia = {
    modo: _estado.modo,
    usuario: _estado.usuario ? Object.assign({}, _estado.usuario) : null,
    mensaje: _estado.mensaje,
    sincronizando: _estado.sincronizando
  };
  _suscriptores.forEach(fn => { try { fn(copia); } catch (e) { console.warn(e); } });
}

function _ponerModo(modo, mensaje) {
  _estado.modo = modo;
  _estado.mensaje = mensaje || '';
  _avisar();
}

/* Traduce los errores de Firebase a algo que un alumno entienda */
function _mensajeError(e) {
  const c = (e && e.code) || '';
  const mapa = {
    'auth/email-already-in-use':   'Ese correo ya tiene una cuenta. Prueba a entrar en lugar de crearla.',
    'auth/invalid-email':          'El correo no tiene un formato válido.',
    'auth/weak-password':          'La contraseña es demasiado corta: usa al menos 6 caracteres.',
    'auth/missing-password':       'Escribe una contraseña.',
    'auth/user-not-found':         'No existe ninguna cuenta con ese correo.',
    'auth/wrong-password':         'La contraseña no es correcta.',
    'auth/invalid-credential':     'Correo o contraseña incorrectos.',
    'auth/too-many-requests':      'Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.',
    'auth/network-request-failed': 'No hay conexión con el servidor. Revisa tu internet.',
    'auth/credential-already-in-use': 'Ese correo ya está vinculado a otra cuenta.',
    'auth/provider-already-linked':   'Esta cuenta ya tiene un correo vinculado.',
    'auth/operation-not-allowed':  'El proveedor no está habilitado. Activa «Correo electrónico/contraseña» '
                                 + 'y «Anónimo» en Firebase Console → Authentication → Sign-in method.',
    'auth/requires-recent-login':  'Por seguridad, vuelve a entrar antes de hacer este cambio.',
    'auth/unauthorized-domain':    'Este dominio no está autorizado en Firebase Console → Authentication → Settings → '
                                 + 'Dominios autorizados.'
  };
  return mapa[c] || ('No se pudo completar la operación' + (c ? ' (' + c + ')' : '.'));
}

/* ══════════════════════════════════════════
   1. CARGA DEL SDK
   ══════════════════════════════════════════ */
async function _cargarSDK() {
  const base = (typeof FIREBASE_CDN !== 'undefined')
    ? FIREBASE_CDN
    : 'https://www.gstatic.com/firebasejs/13.0.0/';

  const [appMod, authMod, fsMod] = await Promise.all([
    import(base + 'firebase-app.js'),
    import(base + 'firebase-auth.js'),
    import(base + 'firebase-firestore.js')
  ]);
  return { appMod, authMod, fsMod };
}

/* ══════════════════════════════════════════
   2. INICIALIZACIÓN
   ══════════════════════════════════════════ */
async function iniciar() {
  /* ¿Está configurado? */
  const configurado = (typeof firebaseEstaConfigurado === 'function')
    ? firebaseEstaConfigurado() : false;

  if (!configurado) {
    _ponerModo('sin-configurar',
      'Firebase todavía no está configurado. Tu progreso se guarda solo en este navegador. ' +
      'Sigue los pasos de docs/FIREBASE.md para activar las cuentas.');
    _crearUI();
    return;
  }

  /* Firebase Auth necesita http(s); con file:// no funciona */
  if (typeof estaEnArchivoLocal === 'function' && estaEnArchivoLocal()) {
    _ponerModo('archivo-local',
      'Estás abriendo el sitio con doble clic (file://). Las cuentas necesitan un servidor local: ' +
      'usa «Live Server» en VS Code o ejecuta «python -m http.server» y entra por http://localhost.');
    _crearUI();
    return;
  }

  _ponerModo('cargando', 'Conectando con el servidor…');
  _crearUI();

  let mods;
  try {
    mods = await _cargarSDK();
  } catch (e) {
    _ponerModo('error',
      'No se pudo descargar el SDK de Firebase. Revisa tu conexión a internet. ' +
      '(El progreso local sigue funcionando.)');
    return;
  }

  try {
    const { appMod, authMod, fsMod } = mods;
    const app = appMod.initializeApp(FIREBASE_CONFIG);
    _auth = authMod.getAuth(app);
    _db   = fsMod.getFirestore(app);
    _fb   = { app, auth: authMod, fs: fsMod };

    /* Avisar al usuario de que el asistente de correo funciona sin
       necesidad de salir del sitio */
    authMod.onAuthStateChanged(_auth, _alCambiarUsuario);
    _ponerModo('listo', '');
  } catch (e) {
    _ponerModo('error',
      'Firebase está configurado pero no se pudo iniciar: ' + (e.message || e) +
      ' (El progreso local sigue funcionando.)');
  }
}

/* ══════════════════════════════════════════
   3. SESIÓN
   ══════════════════════════════════════════ */
async function _alCambiarUsuario(user) {
  if (user) {
    _estado.usuario = {
      uid:        user.uid,
      correo:     user.email || '',
      anonimo:    !!user.isAnonymous,
      verificado: !!user.emailVerified,
      nombre:     (user.displayName || '').trim()
    };

    /* Conectar el progreso con la nube de este usuario */
    if (typeof Progreso !== 'undefined' && Progreso.conectarNube) {
      Progreso.conectarNube(_crearAdaptadorNube(user.uid));
      _estado.sincronizando = true;
      _avisar();
      try {
        await Progreso.bajarDeNube();
      } catch (e) {
        console.warn('No se pudo leer el progreso remoto:', e);
      }
      _estado.sincronizando = false;
    }
  } else {
    /* Sin sesión */
    _estado.usuario = null;
    if (typeof Progreso !== 'undefined' && Progreso.desconectarNube) {
      Progreso.desconectarNube();
    }
    _estado.sincronizando = false;
  }

  _pintarUsuario();
  _avisar();

  /* Refrescar la interfaz que depende del progreso */
  if (typeof actualizarPerfil === 'function')     actualizarPerfil();
  if (typeof refrescarUIProgreso === 'function')  refrescarUIProgreso();
}

/* Adaptador que Progreso usa para leer y escribir el progreso */
function _crearAdaptadorNube(uid) {
  return {
    cargar: async () => {
      const ref = _fb.fs.doc(_db, 'progreso', uid);
      const snap = await _fb.fs.getDoc(ref);
      return snap.exists() ? snap.data() : null;
    },
    guardar: async (estado) => {
      const ref = _fb.fs.doc(_db, 'progreso', uid);
      await _fb.fs.setDoc(ref, {
        modulos:         estado.modulos         || {},
        superados:       estado.superados       || {},
        historial:       (estado.historial || []).slice(0, 60),
        etapaNotificada: estado.etapaNotificada || 1,
        actualizado:     _fb.fs.serverTimestamp()
      });
    }
  };
}

/* Si el modo invitado está activo y no hay nadie conectado, entra solo */
async function _entrarComoInvitadoSiProcede() {
  const modoInvitado = (typeof HIGGS_AUTH === 'undefined' || HIGGS_AUTH.modoInvitado !== false);
  if (!modoInvitado) { _abrirObligatorio(); return; }
  try {
    await _fb.auth.signInAnonymously(_auth);
  } catch (e) {
    _ponerModo('error',
      'No se pudo iniciar el modo invitado: ' + _mensajeError(e) +
      ' Puedes seguir jugando; el progreso se guardará solo en este navegador.');
  }
}

/* ══════════════════════════════════════════
   4. OPERACIONES
   ══════════════════════════════════════════ */
async function registrar(correo, contrasena, nombre) {
  const u = _estado.usuario;
  /* Si ya hay una sesión anónima, la «vinculamos»: así el progreso
     conseguido como invitado pasa a la cuenta nueva sin perderse. */
  if (u && u.anonimo) {
    const cred = _fb.auth.EmailAuthProvider.credential(correo, contrasena);
    const res  = await _fb.auth.linkWithCredential(_auth.currentUser, cred);
    if (nombre) { try { await _fb.auth.updateProfile(res.user, { displayName: nombre }); } catch (e) {} }
    return res.user;
  }
  const res = await _fb.auth.createUserWithEmailAndPassword(_auth, correo, contrasena);
  if (nombre) { try { await _fb.auth.updateProfile(res.user, { displayName: nombre }); } catch (e) {} }
  return res.user;
}

async function entrar(correo, contrasena) {
  const res = await _fb.auth.signInWithEmailAndPassword(_auth, correo, contrasena);
  return res.user;
}

async function invitado() {
  const res = await _fb.auth.signInAnonymously(_auth);
  return res.user;
}

async function vincular(correo, contrasena) {
  const cred = _fb.auth.EmailAuthProvider.credential(correo, contrasena);
  const res  = await _fb.auth.linkWithCredential(_auth.currentUser, cred);
  return res.user;
}

async function recuperar(correo) {
  await _fb.auth.sendPasswordResetEmail(_auth, correo);
}

async function reenviarVerificacion() {
  if (_auth.currentUser) await _fb.auth.sendEmailVerification(_auth.currentUser);
}

async function salir() {
  /* Antes de salir, subimos lo que quede pendiente */
  if (typeof Progreso !== 'undefined' && Progreso.subirAhora) {
    try { await Progreso.subirAhora(); } catch (e) {}
  }
  await _fb.auth.signOut(_auth);
  /* Limpiamos el progreso local: es una computadora compartida y el
     progreso ya vive en la cuenta del alumno. */
  if (typeof Progreso !== 'undefined' && Progreso.reiniciarLocal) {
    Progreso.reiniciarLocal();
  }
  _cerrarUI();
}

/* ══════════════════════════════════════════
   5. INTERFAZ
   ══════════════════════════════════════════ */
function _crearUI() {
  if (_ui) return;

  const ov = document.createElement('div');
  ov.id = 'auth-overlay';
  ov.className = 'auth-overlay hidden';
  ov.innerHTML = `
    <div class="auth-card">
      <button class="auth-cerrar" id="auth-cerrar" title="Cerrar">✕</button>
      <div class="auth-logo">HIGGS ADVENTURE</div>
      <div class="auth-sub" id="auth-sub">Tu progreso, en cualquier computadora</div>

      <div class="auth-tabs">
        <button class="auth-tab active" id="auth-tab-entrar">Entrar</button>
        <button class="auth-tab"        id="auth-tab-crear">Crear cuenta</button>
      </div>

      <div class="auth-campo" id="auth-campo-nombre" style="display:none">
        <label for="auth-nombre">Nombre (opcional)</label>
        <input type="text" id="auth-nombre" autocomplete="name" placeholder="Cómo quieres aparecer">
      </div>

      <div class="auth-campo">
        <label for="auth-correo">Correo electrónico</label>
        <input type="email" id="auth-correo" autocomplete="email" placeholder="tucorreo@ejemplo.com">
      </div>

      <div class="auth-campo">
        <label for="auth-contra">Contraseña</label>
        <input type="password" id="auth-contra" autocomplete="current-password" placeholder="Al menos 6 caracteres">
      </div>

      <button class="auth-btn" id="auth-accion">Entrar</button>

      <div class="auth-enlaces">
        <button class="auth-enlace" id="auth-olvide">¿Olvidaste tu contraseña?</button>
        <button class="auth-enlace" id="auth-invitado">Jugar como invitado</button>
      </div>

      <div class="auth-msg" id="auth-msg"></div>

      <div class="auth-nota" id="auth-nota"></div>
    </div>
  `;
  document.body.appendChild(ov);
  _ui = ov;

  let modo = 'entrar';

  const elCorreo  = ov.querySelector('#auth-correo');
  const elContra  = ov.querySelector('#auth-contra');
  const elNombre  = ov.querySelector('#auth-nombre');
  const elMsg     = ov.querySelector('#auth-msg');
  const elAccion  = ov.querySelector('#auth-accion');
  const elNota    = ov.querySelector('#auth-nota');

  function mostrarMsg(texto, tipo) {
    elMsg.textContent = texto || '';
    elMsg.className = 'auth-msg' + (texto ? ' visible ' + (tipo || 'error') : '');
  }

  function ponerModo(nuevo) {
    modo = nuevo;
    ov.querySelector('#auth-tab-entrar').classList.toggle('active', nuevo === 'entrar');
    ov.querySelector('#auth-tab-crear').classList.toggle('active', nuevo === 'crear');
    ov.querySelector('#auth-campo-nombre').style.display = (nuevo === 'crear') ? '' : 'none';
    elAccion.textContent = (nuevo === 'crear') ? 'Crear mi cuenta' : 'Entrar';
    elContra.setAttribute('autocomplete', (nuevo === 'crear') ? 'new-password' : 'current-password');
    ov.querySelector('#auth-sub').textContent = (nuevo === 'crear')
      ? 'Crea una cuenta para llevar tu progreso a cualquier equipo'
      : 'Tu progreso, en cualquier computadora';
    mostrarMsg('');
  }

  async function ejecutar(fn) {
    mostrarMsg('');
    elAccion.disabled = true;
    const textoOriginal = elAccion.textContent;
    elAccion.textContent = 'Un momento…';
    try {
      await fn();
    } catch (e) {
      mostrarMsg(_mensajeError(e), 'error');
    } finally {
      elAccion.disabled = false;
      elAccion.textContent = textoOriginal;
    }
  }

  ov.querySelector('#auth-tab-entrar').addEventListener('click', () => ponerModo('entrar'));
  ov.querySelector('#auth-tab-crear').addEventListener('click', () => ponerModo('crear'));
  ov.querySelector('#auth-cerrar').addEventListener('click', _cerrarUI);

  elAccion.addEventListener('click', () => {
    const correo = elCorreo.value.trim();
    const contra = elContra.value;
    if (!correo || !contra) { mostrarMsg('Escribe tu correo y tu contraseña.', 'error'); return; }

    ejecutar(async () => {
      if (modo === 'crear') {
        await registrar(correo, contra, elNombre.value.trim());
        await _trasEntrar('¡Cuenta creada! Tu progreso ya está guardado en la nube.');
      } else {
        await entrar(correo, contra);
        await _trasEntrar('¡Bienvenido de nuevo! Hemos recuperado tu progreso.');
      }
    });
  });

  ov.querySelector('#auth-olvide').addEventListener('click', () => {
    const correo = elCorreo.value.trim();
    if (!correo) { mostrarMsg('Escribe tu correo arriba y vuelve a pulsar aquí.', 'info'); return; }
    ejecutar(async () => {
      await recuperar(correo);
      mostrarMsg('Te enviamos un correo para restablecer tu contraseña. Revisa también la carpeta de spam.', 'ok');
    });
  });

  ov.querySelector('#auth-invitado').addEventListener('click', () => {
    ejecutar(async () => {
      if (_auth.currentUser && _auth.currentUser.isAnonymous) { _cerrarUI(); return; }
      if (_auth.currentUser) await _fb.auth.signOut(_auth);
      await invitado();
      _cerrarUI();
    });
  });

  /* Enter para enviar */
  [elCorreo, elContra, elNombre].forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') elAccion.click(); });
  });

  _ui._ponerModo = ponerModo;
  _ui._mostrarMsg = mostrarMsg;
  _ui._elNota = elNota;
}

/* Después de entrar o registrarse */
async function _trasEntrar(mensajeOk) {
  const verificado = _auth.currentUser && _auth.currentUser.emailVerified;
  const exigir = (typeof HIGGS_AUTH !== 'undefined' && HIGGS_AUTH.exigirVerificacion === true);

  if (exigir && !verificado) {
    try { await reenviarVerificacion(); } catch (e) {}
    if (_ui && _ui._mostrarMsg) {
      _ui._mostrarMsg('Te enviamos un correo para confirmar tu cuenta. ' +
                      'Revisa tu bandeja (y la carpeta de spam).', 'info');
    }
    return;
  }
  if (_ui && _ui._mostrarMsg) _ui._mostrarMsg(mensajeOk, 'ok');
  setTimeout(_cerrarUI, 1400);
}

function _abrirUI(modo, obligatorio) {
  _crearUI();
  _ui._ponerModo(modo || 'entrar');
  _pintarNota();
  /* El botón de cerrar solo se oculta cuando el acceso es obligatorio */
  _ui.querySelector('#auth-cerrar').style.display = obligatorio ? 'none' : '';
  _ui.classList.remove('hidden');
  const campo = _ui.querySelector('#auth-correo');
  if (campo) setTimeout(() => campo.focus(), 60);
}

function _cerrarUI() {
  if (_ui) _ui.classList.add('hidden');
}

/* Si el modo invitado está desactivado, no se puede cerrar sin sesión */
function _abrirObligatorio() {
  _abrirUI('entrar', true);
}

function _pintarNota() {
  if (!_ui || !_ui._elNota) return;
  const u = _estado.usuario;
  if (u && u.anonimo) {
    _ui._elNota.innerHTML =
      'Estás jugando como <strong>invitado</strong>. Crea una cuenta y tu progreso ' +
      'se conservará tal como está ahora.';
  } else {
    _ui._elNota.textContent =
      'Al crear una cuenta solo guardamos tu correo y tu progreso de juego. Nada más.';
  }
}

/* Marca el estado de la sesión en el botón de la navegación */
function _pintarUsuario() {
  const btn = document.getElementById('btn-cuenta');
  const u = _estado.usuario;
  if (!btn) return;
  btn.classList.remove('conectado', 'invitado');
  if (!u) {
    btn.textContent = 'Entrar';
  } else if (u.anonimo) {
    btn.textContent = 'Invitado';
    btn.classList.add('invitado');
  } else {
    btn.textContent = u.correo;
    btn.classList.add('conectado');
    btn.title = u.correo + (u.verificado ? ' (verificado)' : ' (sin verificar)');
  }
}

/* ══════════════════════════════════════════
   6. API PÚBLICA
   ══════════════════════════════════════════ */
window.HiggsAuth = {
  get disponible() { return _estado.modo === 'listo'; },
  get modo()       { return _estado.modo; },
  estado: () => ({
    modo: _estado.modo,
    usuario: _estado.usuario ? Object.assign({}, _estado.usuario) : null,
    mensaje: _estado.mensaje,
    sincronizando: _estado.sincronizando
  }),
  alCambiar(fn) {
    if (typeof fn !== 'function') return function () {};
    _suscriptores.push(fn);
    fn({
      modo: _estado.modo,
      usuario: _estado.usuario ? Object.assign({}, _estado.usuario) : null,
      mensaje: _estado.mensaje,
      sincronizando: _estado.sincronizando
    });
    return function () { _suscriptores = _suscriptores.filter(f => f !== fn); };
  },
  abrir:   (modo) => _abrirUI(modo),
  cerrar:  _cerrarUI,
  /* Vuelve a pintar el botón de cuenta de la navegación */
  pintar:  _pintarUsuario,
  registrar, entrar, invitado, vincular, recuperar, reenviarVerificacion, salir
};

/* ── Arranque ── */
iniciar().then(() => {
  if (_estado.modo === 'listo') {
    return _entrarComoInvitadoSiProcede();
  }
});
