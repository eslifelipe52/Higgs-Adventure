/* ══════════════════════════════════════════
   js/modelo-estandar.js
   Tres grupos: Quarks | Leptones | Bosones+Higgs
   Celdas cuadradas fijas de 100×100px.

   Las partículas que pertenecen a una etapa
   todavía bloqueada se muestran con candado
   (ver js/progreso.js).
   ══════════════════════════════════════════ */

/* Construye (o reconstruye) el grid del Modelo Estándar.
   Se reconstruye cada vez que se entra a la pantalla para
   reflejar los desbloqueos conseguidos mientras tanto. */
function renderME() {
  const wrap = document.getElementById('me-grid');
  wrap.innerHTML = '';
  meRendered = true;

  const { quarks, leptons, bosons, higgs } = PARTICLES;

  /* ── Celda de partícula ── */
  function makeCell(p, type) {
    const bloqueada = Progreso.particulaBloqueada(p, type);
    const etapa     = Progreso.etapaDeParticula(p, type);

    const div = document.createElement('div');
    div.className = `particle-cell ${bloqueada ? 'locked locked-stage' : type}`;

    if (bloqueada) {
      div.title = `🔒 Bloqueada · se desbloquea en la Etapa ${etapa}: ${Progreso.ETAPAS[etapa].nombre}`;
    } else if (type === 'higgs-cell') {
      div.addEventListener('click', () => showScreen('higgs'));
    } else {
      div.addEventListener('click', () => showDetail(p, type));
    }

    div.innerHTML = bloqueada
      ? `<div class="p-symbol">🔒</div>
         <div class="p-name">${p.name}<strong>Etapa ${etapa}</strong></div>`
      : `<div class="p-symbol">${p.sym}</div>
         <div class="p-name">${p.name}</div>
         <div class="p-mass">${p.mass}</div>`;
    return div;
  }

  /* ── Celda vacía (spacer) ── */
  function makeEmpty() {
    const div = document.createElement('div');
    div.className = 'particle-cell empty';
    return div;
  }

  /* ── Grupo genérico: label + subgrid 2 cols ── */
  function makeGroup(label, labelClass, particles, type) {
    const group = document.createElement('div');
    group.className = 'me-group';

    const lbl = document.createElement('div');
    lbl.className = `me-group-label ${labelClass}`;
    lbl.textContent = label;
    group.appendChild(lbl);

    const subgrid = document.createElement('div');
    subgrid.className = 'me-subgrid cols-2';
    particles.forEach(p => subgrid.appendChild(makeCell(p, type)));
    group.appendChild(subgrid);

    return group;
  }

  /* ── Grupo especial: Bosones + Higgs ──
     Layout 2×4:
       col0: γ, g, Z, W  (4 bosones de gauge)
       col1: H⁰ y tres celdas vacías
  */
  function makeBosonsGroup() {
    const group = document.createElement('div');
    group.className = 'me-group';

    const lbl = document.createElement('div');
    lbl.className = 'me-group-label lbl-boson';
    lbl.textContent = 'Bosones';
    group.appendChild(lbl);

    const subgrid = document.createElement('div');
    subgrid.className = 'me-subgrid cols-1-higgs';
    subgrid.style.gridTemplateRows = 'repeat(4, 100px)';
    subgrid.style.gridAutoFlow = 'column';

    bosons.forEach(p => subgrid.appendChild(makeCell(p, 'boson'))); /* 4 celdas col0 */
    subgrid.appendChild(makeCell(higgs, 'higgs-cell'));              /* col1 r0 */
    subgrid.appendChild(makeEmpty());                                /* col1 r1 */
    subgrid.appendChild(makeEmpty());                                /* col1 r2 */
    subgrid.appendChild(makeEmpty());                                /* col1 r3 */

    group.appendChild(subgrid);
    return group;
  }

  wrap.appendChild(makeGroup('Quarks',   'lbl-quark',  quarks,  'quark'));
  wrap.appendChild(makeGroup('Leptones', 'lbl-lepton', leptons, 'lepton'));
  wrap.appendChild(makeBosonsGroup());

  renderBloqueoBanner();
}

/* ══════════════════════════════════════════
   Banner informativo: qué hace falta para
   desbloquear la siguiente etapa.
   ══════════════════════════════════════════ */
function renderBloqueoBanner() {
  const screen = document.getElementById('screen-me');
  if (!screen) return;

  let banner = document.getElementById('me-bloqueo-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'me-bloqueo-banner';
    banner.className = 'me-bloqueo-banner';
    screen.insertBefore(banner, screen.firstChild);
  }

  const etapaMax = Progreso.etapaMaxima();

  /* Si ya está todo abierto, no hay nada que anunciar */
  if (etapaMax >= 4) {
    banner.classList.add('hidden');
    return;
  }

  const sig     = etapaMax + 1;
  const info    = Progreso.requisitosEtapa(sig);
  const faltan  = info.faltan || [];

  banner.classList.remove('hidden');
  banner.innerHTML = `
    <span>
      <strong>Etapa ${sig} · ${Progreso.ETAPAS[sig].nombre}</strong> bloqueada —
      supera los minijuegos de la Etapa ${info.etapa}:
      ${faltan.length
        ? faltan.map(j => `${_nombreJuegoBanner(j.id)} (${j.hechos}/${j.requeridos})`).join(' · ')
        : 'todo listo'}
    </span>
    <button onclick="abrirHub(${info.etapa === 1 ? "'propiedades'" : info.etapa === 2 ? "'generaciones'" : info.etapa === 3 ? "'interacciones'" : "'higgs-juegos'"})">
      Ir a los minijuegos
    </button>
  `;
}

function _nombreJuegoBanner(id) {
  const j = (typeof MINIJUEGOS_TODOS !== 'undefined')
    ? MINIJUEGOS_TODOS.find(x => x.id === id) : null;
  return j ? j.nombre : id;
}
