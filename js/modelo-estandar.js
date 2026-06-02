/* ══════════════════════════════════════════
   js/modelo-estandar.js
   Tres grupos: Quarks | Leptones | Bosones+Higgs
   Celdas cuadradas fijas de 100×100px.
   ══════════════════════════════════════════ */

function renderME() {
  if (meRendered) return;
  meRendered = true;

  const wrap = document.getElementById('me-grid');
  const { quarks, leptons, bosons, higgs } = PARTICLES;

  /* ── Celda de partícula ── */
  function makeCell(p, type) {
    const locked = p.locked;
    const div = document.createElement('div');
    div.className = `particle-cell ${locked ? 'locked' : type}`;
    if (!locked) {
      if (type === 'higgs-cell') {
        div.addEventListener('click', () => showScreen('higgs'));
      } else {
        div.addEventListener('click', () => showDetail(p, type));
      }
    }
    div.innerHTML = locked
      ? `<div class="p-symbol">🔒</div>
         <div class="p-name" style="font-size:8px;opacity:0.35">${p.sym}</div>`
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
     Layout 2×3:
     col0 row0: γ (fotón)       col1 row0: H (higgs)
     col0 row1: g (gluón)       col1 row1: [vacío]
     col0 row2: Z               col1 row2: [vacío]
     col0 row3: W  → pero son solo 3 filas, entonces:
     Reordenamos: 4 bosones ocupan col0 filas 0-3 (4 filas)
     Necesitamos 4 filas, así que usamos grid-template-rows: repeat(4,100px)
     y Higgs va en col1 row0.
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
    /* grid 2 cols × 3 filas = 6 slots
       Slot 0(col0,r0): fotón   Slot 1(col1,r0): higgs
       Slot 2(col0,r1): gluón   Slot 3(col1,r1): vacío
       Slot 4(col0,r2): Z       Slot 5(col1,r2): vacío
       Slot 6... W no cabe → hacemos 4 filas via inline style */
    subgrid.style.gridTemplateRows = 'repeat(4, 100px)';

    /* Col 0: 4 bosones */
    /* Col 1: Higgs en r0, vacíos en r1-r3 */
    /* CSS grid llenará col por col si usamos grid-auto-flow: column */
    subgrid.style.gridAutoFlow = 'column';
    /* Con flow=column, orden: slot(col0,r0),(col0,r1),(col0,r2),(col0,r3),(col1,r0)... */
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
}
