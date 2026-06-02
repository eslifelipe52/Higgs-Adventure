/* ══════════════════════════════════════════
   js/intro.js
   Pantalla de introducción histórica.
   Usa INTRO_STEPS de data.js e introStep
   de navigation.js.

   Cambios vs v1:
   - Imágenes reales en vez de emojis
   - Animaciones CSS por tipo (float/pulse/spin-slow/glow-pulse)
   - Botón de RETROCEDER (← Anterior)
   - Soporte para campo `list` (lista con viñetas)
   ══════════════════════════════════════════ */

function renderIntroStep(step) {
  introStep = step;
  const data  = INTRO_STEPS[step];
  const stage = document.getElementById('intro-stage');
  const total = INTRO_STEPS.length;

  /* ── Dots de progreso ── */
  const dots = INTRO_STEPS.map((_, i) =>
    `<div class="dot ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}"></div>`
  ).join('');

  /* ── Resaltar <strong> ── */
  const descHTML = data.desc.replace(
    /<strong>/g,
    '<strong style="color:var(--accent);font-weight:600">'
  );

  /* ── Lista opcional ── */
  let listHTML = '';
  if (data.list && data.list.length) {
    const items = data.list.map(item => {
      const itemHTML = item.replace(/<strong>/g, '<strong style="color:var(--accent);font-weight:600">');
      return `<li>${itemHTML}</li>`;
    }).join('');
    listHTML = `<ul class="intro-list">${items}</ul>`;
  }

  /* ── Botones de navegación ── */
  const backBtn = step > 0
    ? `<button class="nav-step-btn back-btn" onclick="renderIntroStep(${step - 1})">← Anterior</button>`
    : `<button class="nav-step-btn back-btn" style="opacity:0;pointer-events:none">← Anterior</button>`;

  let forwardBtn = '';
  if (data.clickable) {
    forwardBtn = ''; // el clic en la imagen avanza
  } else if (data.last) {
    forwardBtn = `<button class="nav-step-btn next-step-btn" onclick="showScreen('me')">Explorar el ME →</button>`;
  } else {
    forwardBtn = `<button class="nav-step-btn next-step-btn" onclick="renderIntroStep(${step + 1})">Siguiente →</button>`;
  }

  /* ── Render ── */
  stage.innerHTML = `
    <div class="progress-dots">${dots}</div>

    <div class="intro-img-wrap ${data.anim} ${data.clickable ? 'clickable-img' : ''}" id="intro-obj">
      <canvas class="intro-img" id="intro-canvas"></canvas>
    </div>
    </div>

    <div class="intro-label">${data.level}</div>
    <div class="intro-title fade-in">${data.title}</div>
    <p class="intro-desc fade-in">${descHTML}</p>
    ${listHTML}

    ${data.clickable ? `<div class="intro-hint">${data.hint}</div>` : ''}

    <div class="intro-nav-row">
      ${backBtn}
      <span class="intro-counter">${step + 1} / ${total}</span>
      ${forwardBtn}
    </div>
  `;

  /* ── Click en imagen si es clickeable ── */
  if (data.clickable) {
    document.getElementById('intro-obj').addEventListener('click', () => {
      renderIntroStep(step + 1);
    });
  }

  /* ── Eliminar fondo negro de la imagen via Canvas ── */
  removeBlackBg(data.img, 'intro-canvas');
}

/* ════════════════════════════════════════════════════════
   removeBlackBg(src, canvasId)
   Carga la imagen, recorre sus píxeles y hace transparentes
   todos los que sean "casi negros" (R+G+B < umbral).
   Funciona tanto si el PNG ya tiene transparencia como si
   tiene fondo negro sólido.
   ════════════════════════════════════════════════════════ */
function removeBlackBg(src, canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.crossOrigin = 'anonymous';

  img.onload = function() {
    /* Tamaño del canvas = tamaño del wrapper (180px) */
    const SIZE = 180;
    canvas.width  = SIZE;
    canvas.height = SIZE;

    /* Escalar manteniendo proporción */
    const ratio = Math.min(SIZE / img.width, SIZE / img.height);
    const w = img.width  * ratio;
    const h = img.height * ratio;
    const x = (SIZE - w) / 2;
    const y = (SIZE - h) / 2;

    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, x, y, w, h);

    /* Recorrer píxeles y eliminar los oscuros */
    const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
    const data = imageData.data;
    const THRESHOLD = 40;   /* 0-255: píxeles con R,G,B < este valor → transparentes */
    const TOLERANCE = 60;   /* zona de borde: semitransparente para suavizar */

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;

      if (brightness < THRESHOLD) {
        /* Negro puro → completamente transparente */
        data[i + 3] = 0;
      } else if (brightness < TOLERANCE) {
        /* Zona de borde → semitransparente gradual */
        data[i + 3] = Math.round(((brightness - THRESHOLD) / (TOLERANCE - THRESHOLD)) * 255);
      }
      /* Píxeles brillantes → sin cambio */
    }

    ctx.putImageData(imageData, 0, 0);
  };

  img.onerror = function() {
    console.warn('No se pudo cargar la imagen:', src);
  };

  img.src = src;
}
