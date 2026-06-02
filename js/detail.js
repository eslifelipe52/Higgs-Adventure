/* ══════════════════════════════════════════
   js/detail.js
   Panel de detalle de una partícula.
   Usa PARTICLES y PROP_INFO de data.js,
   expandedProp de navigation.js.
   ══════════════════════════════════════════ */

/* Muestra el panel de detalle de la partícula p */
function showDetail(p, type) {
  expandedProp = null;
  const main     = document.getElementById('detail-main');
  const propKeys = Object.keys(p.props);

  const typeLabelMap = {
    quark:       'Quark',
    lepton:      'Leptón',
    boson:       'Bosón de gauge',
    'higgs-cell':'Bosón escalar'
  };

  main.innerHTML = `
    <div class="detail-header fade-in">
      <div class="detail-symbol-big ${type}">${p.sym}</div>
      <div>
        <div class="detail-name">${p.name}</div>
        <span class="detail-type-badge badge-${type}">${typeLabelMap[type] || type}</span>
        <div style="margin-top:8px;font-size:13px;color:var(--text2)">
          Gen. ${p.gen || '—'} &nbsp;|&nbsp; Espín ${p.spin} &nbsp;|&nbsp; Carga ${p.charge}
        </div>
      </div>
    </div>

    <p class="detail-desc fade-in">${p.desc}</p>

    <div class="props-title">Propiedades fundamentales — haz clic para aprender más</div>
    <div class="props-grid fade-in">
      ${propKeys.map(k => `
        <div class="prop-card" id="prop-${k}" onclick="toggleProp('${k}','${type}')">
          <div class="prop-label">${propLabel(k)}</div>
          <div class="prop-value ${type}-c">${p.props[k]}</div>
          <div class="prop-click-hint">▸ haz clic para más información</div>
        </div>
      `).join('')}
    </div>

    <div id="prop-expand-area"></div>
  `;

  showScreen('detail');
}

/* Construye el botón de minijuego si existe uno para esta propiedad */
function buildJuegoBtn(propKey) {
  if (typeof MINIJUEGOS_DATA === 'undefined') return '';

  let juego = null;
  for (const seccion of MINIJUEGOS_DATA) {
    const found = seccion.juegos.find(j => j.propKey === propKey);
    if (found) { juego = found; break; }
  }
  if (!juego) return '';

  const canvasId = `detail-juego-canvas-${propKey}`;
  /* Renderizar con un pequeño delay para que el DOM exista */
  setTimeout(() => removeBgMJ(juego.asset, canvasId, 48), 50);

  return `
    <div class="prop-juego-btn" onclick="abrirJuegoDesdeProp('${propKey}')">
      <canvas id="${canvasId}" width="48" height="48" class="mj-card-img"></canvas>
      <div class="prop-juego-texto">
        <div class="prop-juego-label">HAZ CLIC PARA JUGAR</div>
        <div class="prop-juego-nombre">${juego.nombre}</div>
      </div>
    </div>
  `;
}
function propLabel(k) {
  const map = {
    charge: 'Carga eléctrica',
    spin:   'Espín',
    mass:   'Masa',
    color:  'Carga de color',
    fuerza: 'Fuerza mediada',
    tipo:   'Tipo de bosón'
  };
  return map[k] || k;
}

/* Despliega / colapsa la explicación de una propiedad */
function toggleProp(key, type) {
  const area = document.getElementById('prop-expand-area');
  document.querySelectorAll('.prop-card').forEach(c => c.classList.remove('highlighted'));

  /* Si el mismo ya estaba abierto, cerrarlo */
  if (expandedProp === key) {
    expandedProp   = null;
    area.innerHTML = '';
    return;
  }

  expandedProp = key;
  const card = document.getElementById('prop-' + key);
  if (card) card.classList.add('highlighted');

  const info = PROP_INFO[key];
  if (!info) return;

  const bodyHTML = info.text.replace(
    /<strong>/g,
    '<strong style="color:var(--accent);font-weight:500">'
  );

  area.innerHTML = `
    <div class="prop-expand">
      <div style="font-weight:600;color:var(--accent);margin-bottom:10px;
                  font-size:14px;font-family:'Orbitron',monospace;letter-spacing:1px">
        ${info.title}
      </div>
      ${bodyHTML}
    </div>
    ${buildJuegoBtn(key)}
  `;
}
