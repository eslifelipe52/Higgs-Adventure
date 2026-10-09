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

/* ── showScreen(name) ──
   Cambia la pantalla visible y actualiza el botón activo.
   Llama a los renderers de intro y ME cuando corresponde.
   Respeta el desbloqueo progresivo (ver js/progreso.js).
   Para agregar una nueva pantalla en el futuro:
   1. Añade su <div class="screen" id="screen-NOMBRE"> en index.html
   2. Añade 'NOMBRE':'btn-NOMBRE' en navMap si tiene botón de nav
   3. Añade su lógica de init en el bloque if(name === ...) abajo
*/
function showScreen(name) {
  /* ── Puerta de desbloqueo: el módulo de Higgs es la Etapa 4 ── */
  if (name === 'higgs' && !Progreso.etapaDesbloqueada(4)) {
    const info   = Progreso.requisitosEtapa(4);
    const faltan = (info.faltan || []).length;
    Progreso.avisar(
      '🔒 El módulo del Bosón de Higgs se abre en la Etapa 4. ' +
      (faltan ? `Te falta superar ${faltan} minijuego(s) de la Etapa 3.`
              : 'Sigue avanzando con los minijuegos.')
    );
    return;
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

/* Arrancar en la pantalla de inicio */
showScreen('home');
