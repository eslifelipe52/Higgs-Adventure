/* ══════════════════════════════════════════
   js/navigation.js
   Control de pantallas y estrellas de fondo.
   ══════════════════════════════════════════ */

/* ── Estado global compartido ── */
let introStep    = 0;
let expandedProp = null;
let meRendered   = false;

/* ── Estrellas de fondo ── */
(function initStars() {
  const cont = document.getElementById('stars');
  for (let i = 0; i < 80; i++) {
    const s  = document.createElement('div');
    s.className = 'star';
    const sz = Math.random() * 2.2 + 0.8;
    s.style.cssText = `
      width:${sz}px; height:${sz}px;
      top:${Math.random() * 100}%;
      left:${Math.random() * 100}%;
      animation-duration:${2 + Math.random() * 5}s;
      animation-delay:${Math.random() * 5}s
    `;
    cont.appendChild(s);
  }
})();

/* ══════════════════════════════════════════
   RUTAS CON HASH
   Cada pantalla tiene su propia dirección (#inicio, #introduccion,
   #modelo-estandar, #higgs) y cada minijuego la suya
   (#minijuego/carga-electrica). Así, al recargar la página o al abrir
   un enlace compartido, se vuelve a donde estabas en vez de al inicio.
   ══════════════════════════════════════════ */

const RUTAS = {
  home:  'inicio',
  intro: 'introduccion',
  me:    'modelo-estandar',
  higgs: 'higgs'
};

/* Dirección → nombre de pantalla */
const RUTA_A_PANTALLA = {};
Object.keys(RUTAS).forEach(k => { RUTA_A_PANTALLA[RUTAS[k]] = k; });

/* Evita que un cambio de hash provocado por nosotros se reaplique */
let _hashSilencioso = false;

function rutaActual() {
  return decodeURIComponent(location.hash.replace(/^#/, '')).replace(/\/+$/, '');
}

function ponerHash(ruta) {
  if (rutaActual() === ruta) return;
  _hashSilencioso = true;
  location.hash = ruta;
  /* El evento hashchange se atiende antes que este temporizador, así que
     la marca sigue puesta cuando llega y no se aplica dos veces. */
  setTimeout(() => { _hashSilencioso = false; }, 0);
}

/* Marca la dirección de un minijuego recién abierto */
function marcarMinijuego(id) {
  ponerHash('minijuego/' + id);
}

/* Abre el minijuego cuyo id aparece en la dirección */
function abrirMinijuego(id) {
  const fn = window['iniciar_' + String(id).replace(/-/g, '_')];
  if (typeof fn !== 'function') return false;
  fn();
  return true;
}

/* Aplica la dirección actual. No escribe el hash: de eso se encargan
   showScreen() y marcarMinijuego(), para no entrar en un bucle. */
function aplicarRuta() {
  const ruta = rutaActual();

  /* #minijuego/<id> → Modelo Estándar de fondo + el juego abierto */
  const mj = ruta.match(/^minijuego\/([a-z0-9-]+)$/);
  if (mj) {
    pintarPantalla('me');
    if (!abrirMinijuego(mj[1])) {
      /* Enlace viejo o minijuego que ya no existe */
      pintarPantalla('home');
      ponerHash(RUTAS.home);
    }
    return;
  }

  const nombre = RUTA_A_PANTALLA[ruta];
  if (!nombre) {
    /* Sin dirección, o con una desconocida: al inicio */
    pintarPantalla('home');
    ponerHash(RUTAS.home);
    return;
  }
  if (!pintarPantalla(nombre)) {
    /* Pantalla bloqueada (el Higgs antes de la Etapa 4) */
    pintarPantalla('home');
    ponerHash(RUTAS.home);
  }
}

/* ── pintarPantalla(name) ──
   Cambia la pantalla visible y actualiza el botón activo.
   Llama a los renderers de intro y ME cuando corresponde.
   Respeta el desbloqueo progresivo (ver js/progreso.js).
   Devuelve false si la pantalla está bloqueada.
   Para agregar una nueva pantalla en el futuro:
   1. Añade su <div class="screen" id="screen-NOMBRE"> en index.html
   2. Añade 'NOMBRE':'btn-NOMBRE' en navMap si tiene botón de nav
   3. Añade 'NOMBRE':'direccion' en RUTAS
   4. Añade su lógica de init en el bloque if(name === ...) abajo
*/
function pintarPantalla(name) {
  /* ── Puerta de desbloqueo: el módulo de Higgs es la Etapa 4 ── */
  if (name === 'higgs' && !Progreso.etapaDesbloqueada(4)) {
    const info   = Progreso.requisitosEtapa(4);
    const faltan = (info.faltan || []).length;
    Progreso.avisar(
      '🔒 El módulo del Bosón de Higgs se abre en la Etapa 4. ' +
      (faltan ? `Te falta superar ${faltan} minijuego(s) de la Etapa 3.`
              : 'Sigue avanzando con los minijuegos.')
    );
    return false;
  }

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const screenEl = document.getElementById('screen-' + name);
  if (screenEl) screenEl.classList.add('active');

  const navMap = {
    home:   'btn-home',
    intro:  'btn-intro',
    me:     'btn-me',
    higgs:  'btn-higgs',
    detail: null
  };
  if (navMap[name]) {
    const btn = document.getElementById(navMap[name]);
    if (btn) btn.classList.add('active');
  }

  /* Inicializar pantallas que lo requieren */
  if (name === 'intro')  renderIntroStep(introStep === 0 ? 0 : introStep);
  if (name === 'me')     renderME();
  if (name === 'higgs')  { initHiggsScreen(); }

  expandedProp = null;
  refrescarUIProgreso();
  return true;
}

/* ── showScreen(name) ──
   Igual que pintarPantalla(), pero además deja la dirección de la URL
   apuntando a esa pantalla. Es la que usa el resto del proyecto. */
function showScreen(name) {
  if (!pintarPantalla(name)) return;
  if (RUTAS[name]) ponerHash(RUTAS[name]);
}

/* ── refrescarUIProgreso() ──
   Marca visualmente lo que todavía está bloqueado.
   Se llama al cambiar de pantalla y cada vez que el
   jugador supera un módulo (ver js/progreso.js). */
function refrescarUIProgreso() {
  const higgsAbierto = Progreso.etapaDesbloqueada(4);

  const btnHiggs = document.getElementById('btn-higgs');
  if (btnHiggs) {
    btnHiggs.classList.toggle('locked-btn', !higgsAbierto);
    btnHiggs.title = higgsAbierto
      ? 'Bosón de Higgs'
      : '🔒 Se desbloquea en la Etapa 4 · Bosón de Higgs';
  }

  /* El banner solo se refresca si el grid del ME ya existe */
  const grid = document.getElementById('me-grid');
  if (grid && grid.children.length && typeof renderBloqueoBanner === 'function') {
    renderBloqueoBanner();
  }
}

/* ── Arranque y navegación con el historial ──
   Se espera a `load` porque los minijuegos (sus funciones iniciar_*)
   todavía no existen cuando se evalúa este archivo: está antes que ellos
   en index.html. Así una dirección #minijuego/… puede abrirlos. */
window.addEventListener('load', () => {
  if (rutaActual()) aplicarRuta();
  else showScreen('home');
});

/* Botones atrás/adelante del navegador y direcciones escritas a mano */
window.addEventListener('hashchange', () => {
  if (_hashSilencioso) return;
  aplicarRuta();
});
