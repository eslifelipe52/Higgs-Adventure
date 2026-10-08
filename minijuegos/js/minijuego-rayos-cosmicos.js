/* ══════════════════════════════════════════
   minijuegos/js/minijuego-rayos-cosmicos.js
   Minijuego: Rayos Cósmicos (Etapa 2)

   Un protón cósmico choca con la atmósfera y
   desata una cascada de partículas secundarias.

   Niveles (módulos A–D):
     A  El Primer Impacto        → cascada hadrónica (π, K, n, p)
     B  La Cascada EM            → γ → e⁺e⁻ → γ … (multiplicativa)
     C  La Componente Muónica    → dilatación temporal, penetración
     D  Los Neutrinos Cósmicos   → escapan y son mensajeros

   Estética coherente con los demás minijuegos:
   shell header + body + nav-bar + dots, fondo oscuro
   cuadriculado (mjGridBackground) y paleta azul/cian.
   ══════════════════════════════════════════ */

let rcScreen = null;
let rcState  = {};
let rcRAF    = null;

/* Imagen de fondo (cielo/atmósfera). Se carga una sola vez y se reutiliza
   en todos los niveles. Si aún no existe el archivo, se usa un degradado. */
let rcFondoImg = null;
let rcFondoOK  = false;
(function rcCargarFondo() {
  rcFondoImg = new Image();
  rcFondoImg.onload  = () => { rcFondoOK = true; };
  rcFondoImg.onerror = () => { rcFondoOK = false; };
  /* el sufijo ?v= evita que el navegador use una respuesta 404 cacheada */
  rcFondoImg.src = 'minijuegos/assets/atmosfera.png?v=' + Date.now();
})();

/* Pinta el fondo del canvas: imagen de atmósfera (cubriendo el lienzo) con un
   velo oscuro para que las partículas resalten; si la imagen no cargó, cae a
   un degradado azul oscuro. */
function rcFondo(ctx, W, H) {
  ctx.clearRect(0, 0, W, H);
  if (rcFondoOK && rcFondoImg && rcFondoImg.width) {
    /* La imagen se dibuja COMPLETA llenando todo el canvas (se estira para
       ocupar el ancho y el alto; así se ve entera, sin recortes). */
    ctx.drawImage(rcFondoImg, 0, 0, W, H);
    /* velo para contraste con las partículas */
    ctx.save();
    ctx.fillStyle = 'rgba(4,2,15,0.42)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  } else {
    /* Respaldo: cielo nocturno degradado + campo de estrellas, por si aún no
       se ha añadido minijuegos/assets/atmosfera.png */
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b1636');
    g.addColorStop(0.55, '#1a1140');
    g.addColorStop(1, '#2a1636');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    /* estrellas estáticas (sembradas con un PRNG determinista por tamaño) */
    ctx.save();
    let seed = 1337;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < 90; i++) {
      const x = rnd() * W, y = rnd() * H * 0.9, r = rnd() * 1.3 + 0.3;
      ctx.globalAlpha = 0.3 + rnd() * 0.6;
      ctx.fillStyle = '#dfe9ff';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

/* Módulos del minijuego */
const RC_NIVELES = [
  { id: 'impacto',  label: 'Primer impacto', fn: 'rcNivelImpacto',  titulo: 'El Primer Impacto' },
  { id: 'em',       label: 'Cascada EM',     fn: 'rcNivelEM',       titulo: 'La Cascada Electromagnética' },
  { id: 'muones',   label: 'Muones',         fn: 'rcNivelMuones',   titulo: 'La Componente Muónica' },
  { id: 'neutrinos',label: 'Neutrinos',      fn: 'rcNivelNeutrinos',titulo: 'Los Neutrinos Cósmicos' },
  { id: 'detector', label: 'Detector',       fn: 'rcNivelDetector', titulo: 'El Detector de Rayos Cósmicos' },
];

/* ════════════════════════════════════════════
   ENTRADA
   ════════════════════════════════════════════ */
function iniciar_rayos_cosmicos() {
  rcState = { nivelIdx: 0 };
  rcCrearPantalla();
  rcLanzarNivel();
}

function rcCrearPantalla() {
  if (rcScreen) rcScreen.remove();
  rcScreen = document.createElement('div');
  rcScreen.id        = 'rc-screen';
  rcScreen.className = 'rc-screen';
  rcScreen.innerHTML = `
    <div class="rc-header">
      <div class="rc-instruccion-wrap">
        <div class="rc-instruccion-label">RAYOS CÓSMICOS</div>
        <div class="rc-instruccion-icon">☄️</div>
        <p class="rc-instruccion" id="rc-instruccion"></p>
      </div>
    </div>

    <div class="rc-body" id="rc-body"></div>

    <div class="rc-nav-bar">
      <button class="rc-btn rc-btn-volver" onclick="cerrarRayosCosmicos()">← Volver al ME</button>
      <div class="rc-nivel-dots" id="rc-nivel-dots"></div>
      <div class="rc-progreso-label" id="rc-progreso-label"></div>
    </div>
  `;
  document.getElementById('app').appendChild(rcScreen);
  rcRenderDots();
}

function rcRenderDots() {
  const dots = document.getElementById('rc-nivel-dots');
  if (!dots) return;
  dots.innerHTML = RC_NIVELES.map((n, i) => `
    <button class="rc-nivel-dot ${rcState.nivelIdx === i ? 'active' : ''}"
            onclick="rcIrNivel(${i})" title="${n.titulo}">
      ${n.label}
    </button>
  `).join('');
  const lbl = document.getElementById('rc-progreso-label');
  const n = RC_NIVELES[rcState.nivelIdx];
  if (lbl && n) lbl.textContent = `Nivel ${rcState.nivelIdx + 1} · ${n.titulo}`;
}

function rcIrNivel(idx) {
  rcCancelarRAF();
  rcState.nivelIdx = idx;
  rcRenderDots();
  rcLanzarNivel();
}

function rcSiguienteNivel() {
  if (rcState.nivelIdx < RC_NIVELES.length - 1) rcIrNivel(rcState.nivelIdx + 1);
  else cerrarRayosCosmicos();
}

function rcLanzarNivel() {
  const n    = RC_NIVELES[rcState.nivelIdx];
  const body = document.getElementById('rc-body');
  const fn   = window[n.fn];
  if (typeof fn === 'function') fn(body);
}

function rcCancelarRAF() {
  if (rcRAF) { cancelAnimationFrame(rcRAF); rcRAF = null; }
}

function cerrarRayosCosmicos() {
  rcCancelarRAF();
  window.removeEventListener('resize', rcAjustarCanvasActivo);
  if (rcScreen) { rcScreen.remove(); rcScreen = null; }
  showScreen('me');
}

function rcAjustarCanvasActivo() {
  const cv = document.getElementById('rc-canvas');
  if (cv) {
    cv.width  = cv.offsetWidth  || 500;
    cv.height = cv.offsetHeight || 360;
  }
}

/* ════════════════════════════════════════════
   HELPERS DE RETO (barra de progreso + éxito)
   ════════════════════════════════════════════ */
function rcSetReto(txt) {
  const el = document.getElementById('rc-reto-txt');
  if (el) el.innerHTML = txt;
}

function rcProgreso(frac, etiqueta) {
  frac = Math.max(0, Math.min(1, frac));
  const barra = document.getElementById('rc-prog-barra');
  const lbl   = document.getElementById('rc-prog-lbl');
  if (barra) barra.style.width = (frac * 100) + '%';
  if (lbl && etiqueta !== undefined) lbl.textContent = etiqueta;
}

function rcRetoCumplido(mensaje) {
  if (rcState.completado) return;
  rcState.completado = true;
  rcProgreso(1, mensaje || '¡Completado!');
  const cont = document.getElementById('rc-logro-cont');
  if (cont) {
    const esUltimo = rcState.nivelIdx >= RC_NIVELES.length - 1;
    cont.innerHTML = `
      <div class="rc-exito">
        <span class="rc-exito-icon">✓</span>
        <span>${mensaje || 'Reto superado'}</span>
      </div>
      <button class="rc-btn rc-btn-next" onclick="rcSiguienteNivel()">
        ${esUltimo ? 'Terminar ✓' : 'Siguiente nivel →'}
      </button>`;
    cont.classList.remove('hidden');
    try { cont.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
  }
}

function rcEstado(txt, ok) {
  const el = document.getElementById('rc-estado');
  if (!el) return;
  el.textContent = txt;
  el.className = 'rc-estado ' + (ok === true ? 'ok' : ok === false ? 'err' : '');
}

/* Dibuja la franja de atmósfera (cielo arriba → suelo abajo) común a los niveles */
function rcDibujarAtmosfera(ctx, W, H, etiquetas) {
  /* El fondo ya lo pinta rcFondo (imagen de atmósfera). Aquí solo marcamos
     el suelo y las etiquetas de altura, sin tapar la imagen. */
  ctx.save();
  /* suelo semitransparente para que se funda con la base de la foto */
  ctx.fillStyle = 'rgba(10,20,40,0.45)';
  ctx.fillRect(0, H - 22, W, 22);
  ctx.strokeStyle = 'rgba(79,195,247,0.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, H - 22); ctx.lineTo(W, H - 22); ctx.stroke();
  ctx.fillStyle = 'rgba(205,238,255,0.75)'; ctx.font = '10px "Exo 2",sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('SUELO (nivel del mar)', 10, H - 8);
  if (etiquetas) {
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(205,238,255,0.6)';
    ctx.fillText('↑ ~15 km de altura', W - 10, 16);
  }
  ctx.restore();
}

/* Nube de nitrógeno/oxígeno donde el protón choca. Es un cúmulo de
   "burbujas" con etiquetas N₂ y O₂; destella al producirse el impacto. */
function rcDibujarNube(ctx, cy, W, t, fase) {
  const cx = W * 0.5;
  const impactando = (fase === 'cascada');
  /* burbujas de la nube (posición relativa fija + leve respiración) */
  const burbujas = [
    { dx:-46, dy:-6, r:20, g:'N₂', c:'#8ea9c8' },
    { dx:-20, dy: 8, r:26, g:'O₂', c:'#9ec9d6' },
    { dx:  8, dy:-10,r:24, g:'N₂', c:'#8ea9c8' },
    { dx: 34, dy: 6, r:22, g:'O₂', c:'#9ec9d6' },
    { dx: 10, dy: 14,r:18, g:'N₂', c:'#8ea9c8' },
    { dx:-30, dy:-18,r:16, g:'O₂', c:'#9ec9d6' },
  ];
  ctx.save();
  burbujas.forEach((b, i) => {
    const resp = 1 + Math.sin(t*1.6 + i) * 0.05;
    const r = b.r * resp;
    const x = cx + b.dx, y = cy + b.dy;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const extra = impactando ? 0.25 : 0;
    grad.addColorStop(0, 'rgba(220,235,255,' + (0.28 + extra) + ')');
    grad.addColorStop(0.6, 'rgba(150,180,210,' + (0.14 + extra*0.5) + ')');
    grad.addColorStop(1, 'rgba(120,150,190,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
  });
  /* destello del choque */
  if (impactando) {
    const fl = (Math.sin(t*8) * 0.5 + 0.5) * 0.5 + 0.3;
    ctx.globalAlpha = fl;
    const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50);
    fg.addColorStop(0, 'rgba(255,255,255,0.6)');
    fg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(cx, cy, 50, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  /* etiquetas de los gases */
  ctx.fillStyle = 'rgba(205,238,255,0.9)'; ctx.font = 'bold 11px "Orbitron",monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('N₂', cx - 26, cy - 2);
  ctx.fillText('O₂', cx + 20, cy + 4);
  ctx.font = '9px "Exo 2",sans-serif'; ctx.fillStyle = 'rgba(205,238,255,0.65)';
  ctx.fillText('nube de aire (N₂ / O₂)', cx, cy - 36);
  ctx.restore();
}

/* Dibuja una partícula tipo "bola con glow" + símbolo */
function rcDibujarPart(ctx, x, y, r, col, sym, textCol) {
  ctx.save();
  ctx.shadowColor = col; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
  const g = ctx.createRadialGradient(x-r*0.33, y-r*0.33, 0, x, y, r);
  g.addColorStop(0, '#fff'); g.addColorStop(0.4, col); g.addColorStop(1, col);
  ctx.fillStyle = g; ctx.fill();
  if (sym) {
    ctx.fillStyle = textCol || '#06121f';
    ctx.font = 'bold ' + Math.max(8, Math.round(r*0.9)) + 'px "Orbitron",monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(sym, x, y);
  }
  ctx.restore();
}


/* ╔══════════════════════════════════════════════════════════╗
   ║  NIVEL A — EL PRIMER IMPACTO (cascada hadrónica)           ║
   ╚══════════════════════════════════════════════════════════╝
   Lanza un protón de 1 GeV; choca con un núcleo (N/O) y produce
   piones (π⁺,π⁻,π⁰), kaones (K±), nucleones (n,p). Luego los
   secundarios decaen: π± → μ + ν ; π⁰ → γγ.
   Reto: (1) lanzar y provocar el impacto, (2) decaer los piones,
   (3) ver qué llega al suelo. */
function rcNivelImpacto(body) {
  document.getElementById('rc-instruccion').textContent =
    'Nivel 1 · El Primer Impacto — Un protón cósmico de 1 GeV choca con un núcleo del aire y produce una cascada: piones, kaones y nucleones.';

  rcState.completado = false;
  rcState.metas = { impacto:false, decaim:false, kaon:false, suelo:false };
  rcState.fase = 'listo';     /* listo → cae → cascada → decaido */
  rcState.proton = null;
  rcState.frags = [];         /* secundarios de la colisión */
  rcState.suelo = [];         /* lo que aterriza */
  rcState.t = 0;

  body.innerHTML = `
    <div class="rc-wrap">
      <div class="rc-panel">
        <div class="rc-panel-card">
          <div class="rc-panel-title">Reto</div>
          <div class="rc-reto" id="rc-reto-txt">Lanza el protón cósmico y observa la cascada que produce al chocar.</div>
          <div class="rc-prog-wrap"><div class="rc-prog-barra" id="rc-prog-barra"></div></div>
          <div class="rc-prog-lbl" id="rc-prog-lbl">0 / 4 metas</div>
          <ul class="rc-metas" id="rc-metas">
            <li id="rc-meta-impacto">◻ Lanza el protón y provoca el impacto</li>
            <li id="rc-meta-decaim">◻ Haz decaer los piones (π±→μν, π⁰→γγ)</li>
            <li id="rc-meta-kaon">◻ Haz decaer los kaones (K±→μν)</li>
            <li id="rc-meta-suelo">◻ Observa qué llega al suelo</li>
          </ul>
          <div class="rc-estado" id="rc-estado"></div>
        </div>
        <div class="rc-panel-card">
          <div class="rc-panel-title">Controles</div>
          <button class="rc-btn rc-btn-accion" id="rc-btn-lanzar" onclick="rcImpLanzar()">☄️ Lanzar protón (1 GeV)</button>
          <button class="rc-btn rc-btn-accion" id="rc-btn-decaer" onclick="rcImpDecaer()" disabled>⚡ Decaer piones (π→μν, γγ)</button>
          <button class="rc-btn rc-btn-accion" id="rc-btn-kaon" onclick="rcImpDecaerKaones()" disabled>⚡ Decaer kaones (K→μν)</button>
          <button class="rc-btn rc-btn-sutil" onclick="rcImpReset()">↺ Reiniciar</button>
        </div>
        <div class="rc-panel-card">
          <div class="rc-panel-title">¿Por qué ocurre?</div>
          <div class="rc-hint">
            El protón choca con un núcleo de <strong>nitrógeno u oxígeno</strong> y crea
            muchos <strong>piones</strong> (lo más abundante), más kaones y nucleones. Los piones
            cargados <strong>π±</strong> decaen en <strong>muón + neutrino</strong>; los neutros
            <strong>π⁰</strong> en <strong>dos fotones</strong>. Los <strong>kaones K±</strong>
            también decaen principalmente en <strong>muón + neutrino</strong>.<br><br>
            El <strong>protón es estable</strong> (no decae) y el <strong>neutrón</strong>, aunque
            libre decaería (n→p+e⁻+ν̄), en la cascada <strong>llega antes de hacerlo</strong>:
            por eso ambos bajan directos al suelo.
          </div>
        </div>
        <div class="rc-logro-cont hidden" id="rc-logro-cont"></div>
      </div>
      <div class="rc-canvas-wrap">
        <canvas id="rc-canvas" class="rc-canvas"></canvas>
        <div class="rc-canvas-legend">
          <span style="color:#ff8a80">π piones</span>
          <span style="color:#ffd740">K kaones</span>
          <span style="color:#80d8ff">p·n nucleones (al suelo)</span>
          <span style="color:#69ffa6">μ·γ</span>
          <span style="color:#b388ff">ν neutrinos</span>
        </div>
      </div>
    </div>
  `;

  const cv = document.getElementById('rc-canvas');
  rcState.canvas = cv; rcState.ctx = cv.getContext('2d');
  rcAjustarCanvasActivo();
  window.addEventListener('resize', rcAjustarCanvasActivo);
  rcProgreso(0, '0 / 4 metas');
  rcImpLoop();
}

function rcImpLanzar() {
  if (rcState.fase !== 'listo') return;
  const cv = rcState.canvas; if (!cv) return;
  rcState.fase = 'cae';
  rcState.proton = { x: cv.width*0.5, y: 10, oy: 10, vy: 3.2 };
  const btn = document.getElementById('rc-btn-lanzar');
  if (btn) btn.disabled = true;
}

/* Genera la cascada hadrónica en el punto de impacto */
function rcImpImpacto(ix, iy) {
  rcState.fase = 'cascada';
  rcState.impactoXY = { x: ix, y: iy };
  const defs = [
    { sym:'π⁺', col:'#ff8a80', tipo:'pion' },
    { sym:'π⁻', col:'#ff8a80', tipo:'pion' },
    { sym:'π⁰', col:'#ffab91', tipo:'pion0' },
    { sym:'π⁺', col:'#ff8a80', tipo:'pion' },
    { sym:'K⁺', col:'#ffd740', tipo:'kaon' },
    { sym:'K⁻', col:'#ffd740', tipo:'kaon' },
    { sym:'n',  col:'#80d8ff', tipo:'nucleon' },
    { sym:'p',  col:'#80d8ff', tipo:'nucleon' },
  ];
  /* Barajar el orden para que la cascada NO se vea alineada ni simétrica */
  for (let i = defs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [defs[i], defs[j]] = [defs[j], defs[i]];
  }
  /* Cada partícula sale con un ángulo y velocidad propios (dispersión real):
     ángulos repartidos en un cono amplio con jitter, velocidad vertical
     variable y una altura de parada ligeramente distinta por partícula. */
  const n = defs.length;
  rcState.frags = defs.map((d, i) => {
    /* ángulo base en abanico + ruido aleatorio para romper la simetría */
    const base = (i / (n - 1) - 0.5) * 1.7;         /* -0.85..0.85 rad aprox */
    const ang  = base + (Math.random() - 0.5) * 0.6;
    const sp   = 2.3 + Math.random() * 1.4;         /* rapidez total variable */
    return {
      ...d, x: ix, y: iy,
      ox: ix, oy: iy,                 /* origen de la traza (punto de impacto) */
      vx: Math.sin(ang) * sp,
      vy: Math.cos(ang) * sp * 0.9 + 0.6,           /* siempre hacia abajo */
      r: 11 + Math.random() * 3,
      paradaFrac: 0.46 + Math.random() * 0.14,      /* banda de parada propia (0.46..0.60) */
      aterrizado: false
    };
  });
  if (!rcState.metas.impacto) rcImpMeta('impacto', 'rc-meta-impacto',
    '✓ Impacto: el protón partió un núcleo del aire en una lluvia de piones, kaones y nucleones.');
  const bD = document.getElementById('rc-btn-decaer');
  const bK = document.getElementById('rc-btn-kaon');
  if (bD) bD.disabled = false;
  if (bK) bK.disabled = false;
  rcEstado('Se produjeron piones (π), kaones (K) y nucleones (n, p). El protón y el neutrón bajan al suelo; decae los piones y los kaones.', true);
}

/* Decaimiento de los piones: π± → μ + ν ; π⁰ → γ γ.
   Solo decae lo que ya está detenido (aterrizado) a media atmósfera. */
function rcImpDecaer() {
  if (rcState.fase === 'listo' || rcState.fase === 'cae') return;
  const nuevos = [];
  let huboPion = false;
  rcState.frags.forEach(f => {
    if (f.tipo === 'pion') {
      huboPion = true;
      const j = () => (Math.random() - 0.5) * 1.2;   /* dispersión aleatoria */
      nuevos.push({ sym:'μ', col:'#69ffa6', tipo:'muon',    x:f.x, y:f.y, ox:f.x, oy:f.y, vx:f.vx*0.4-0.3+j(), vy:2.2+Math.random()*0.8, r:11, aterrizado:false });
      nuevos.push({ sym:'ν', col:'#b388ff', tipo:'neutrino',x:f.x, y:f.y, ox:f.x, oy:f.y, vx:f.vx*0.4+0.5+j(), vy:2.8+Math.random()*0.8, r:9,  aterrizado:false });
    } else if (f.tipo === 'pion0') {
      huboPion = true;
      const j = () => (Math.random() - 0.5) * 1.2;
      nuevos.push({ sym:'γ', col:'#fff59d', tipo:'foton', x:f.x, y:f.y, ox:f.x, oy:f.y, vx:f.vx-0.6+j(), vy:2.0+Math.random()*0.8, r:9, aterrizado:false });
      nuevos.push({ sym:'γ', col:'#fff59d', tipo:'foton', x:f.x, y:f.y, ox:f.x, oy:f.y, vx:f.vx+0.6+j(), vy:2.0+Math.random()*0.8, r:9, aterrizado:false });
    } else {
      nuevos.push(f);  /* kaones y nucleones siguen su camino */
    }
  });
  if (!huboPion) return;
  rcState.frags = nuevos;
  const btn = document.getElementById('rc-btn-decaer');
  if (btn) btn.disabled = true;
  if (!rcState.metas.decaim) rcImpMeta('decaim', 'rc-meta-decaim',
    '✓ Decaimientos del pión: π± → μ + ν (muón y neutrino) y π⁰ → γ + γ (dos fotones).');
  rcEstado('Los piones decayeron en muones, neutrinos y fotones, que bajan al suelo.', true);
}

/* Decaimiento de los kaones: K⁺ → μ⁺ + ν_μ ; K⁻ → μ⁻ + ν̄_μ
   (modo muónico, el dominante). */
function rcImpDecaerKaones() {
  if (rcState.fase === 'listo' || rcState.fase === 'cae') return;
  const nuevos = [];
  let huboKaon = false;
  rcState.frags.forEach(f => {
    if (f.tipo === 'kaon') {
      huboKaon = true;
      const j = () => (Math.random() - 0.5) * 1.3;
      nuevos.push({ sym:'μ', col:'#69ffa6', tipo:'muon',    x:f.x, y:f.y, ox:f.x, oy:f.y, vx:f.vx*0.4-0.4+j(), vy:2.4+Math.random()*0.9, r:11, aterrizado:false });
      nuevos.push({ sym:'ν', col:'#b388ff', tipo:'neutrino',x:f.x, y:f.y, ox:f.x, oy:f.y, vx:f.vx*0.4+0.6+j(), vy:2.9+Math.random()*0.9, r:9,  aterrizado:false });
    } else {
      nuevos.push(f);
    }
  });
  if (!huboKaon) return;
  rcState.frags = nuevos;
  const btn = document.getElementById('rc-btn-kaon');
  if (btn) btn.disabled = true;
  if (!rcState.metas.kaon) rcImpMeta('kaon', 'rc-meta-kaon',
    '✓ Decaimiento del kaón: K± → μ + ν (su modo más frecuente). También dan muones y neutrinos.');
  rcEstado('Los kaones decayeron en muones y neutrinos, que bajan al suelo.', true);
}

function rcImpReset() {
  rcState.fase = 'listo';
  rcState.proton = null;
  rcState.frags = [];
  rcState.suelo = [];
  const b1 = document.getElementById('rc-btn-lanzar');
  const b2 = document.getElementById('rc-btn-decaer');
  const b3 = document.getElementById('rc-btn-kaon');
  if (b1) b1.disabled = false;
  if (b2) b2.disabled = true;
  if (b3) b3.disabled = true;
  rcEstado('', null);
}

function rcImpMeta(clave, liId, msg) {
  if (rcState.metas[clave]) return;
  rcState.metas[clave] = true;
  const li = document.getElementById(liId);
  if (li) { li.classList.add('ok'); li.textContent = '✓' + li.textContent.slice(1); }
  rcEstado(msg, true);
  const hechas = Object.values(rcState.metas).filter(Boolean).length;
  rcProgreso(hechas / 4, hechas + ' / 4 metas');
  if (hechas >= 4) {
    rcRetoCumplido('¡Primera cascada! Una sola partícula primaria produjo decenas de secundarias. Al suelo llegan muones, neutrinos, fotones y los nucleones estables.');
  }
}

function rcImpLoop() {
  rcRAF = requestAnimationFrame(rcImpLoop);
  const st = rcState, ctx = st.ctx, cv = st.canvas;
  if (!ctx || !cv) return;
  const W = cv.width, H = cv.height;
  rcFondo(ctx, W, H);
  rcDibujarAtmosfera(ctx, W, H, true);
  st.t += 0.05;
  const suelo = H - 22;
  const impactoY = H * 0.26;   /* el choque ocurre más arriba (alta atmósfera) */

  /* protón cayendo */
  if (st.fase === 'cae' && st.proton) {
    st.proton.y += st.proton.vy;
    /* traza recta del primario (línea continua desde la entrada) */
    ctx.save();
    ctx.strokeStyle = '#4fc3f7'; ctx.shadowColor = '#4fc3f7'; ctx.shadowBlur = 6;
    ctx.lineWidth = 2.5; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.moveTo(st.proton.x, st.proton.oy); ctx.lineTo(st.proton.x, st.proton.y); ctx.stroke();
    ctx.restore();
    rcDibujarPart(ctx, st.proton.x, st.proton.y, 13, '#4fc3f7', 'p', '#06121f');
    ctx.save();
    ctx.fillStyle = 'rgba(205,238,255,0.85)'; ctx.font = '10px "Exo 2",sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('protón 1 GeV', st.proton.x, st.proton.y - 20);
    ctx.restore();
    if (st.proton.y >= impactoY) rcImpImpacto(st.proton.x, impactoY);
  }

  /* nube de nitrógeno/oxígeno en el punto de impacto (es ahí donde el protón
     choca y nace la cascada). Visible antes y durante el choque. */
  if (st.fase !== 'listo') {
    rcDibujarNube(ctx, impactoY, W, st.t, st.fase);
  }

  /* Primero las TRAZAS (líneas rectas desde el punto de impacto / de decaimiento
     hasta la posición actual), como en un diagrama de cascada atmosférica. */
  st.frags.forEach(f => {
    rcDibujarTraza(ctx, f);
  });

  /* Luego mover y dibujar las partículas por encima de las trazas */
  st.frags.forEach(f => {
    /* altura de parada:
       - piones y kaones: se detienen a una altura intermedia PROPIA de cada
         uno (paradaFrac) → la fila ya no queda alineada
       - nucleones (p, n): estables → bajan directos al suelo
       - productos del decaimiento (μ, ν, γ): bajan al suelo */
    const vaAlSuelo = (f.tipo === 'muon' || f.tipo === 'neutrino' ||
                       f.tipo === 'foton' || f.tipo === 'nucleon');
    const bandaDecaim = H * (f.paradaFrac || 0.52);
    const parada = (vaAlSuelo ? suelo : bandaDecaim) - f.r;
    if (!f.aterrizado) {
      f.x += f.vx; f.y += f.vy;
      if (f.x < 12) { f.x = 12; f.vx = Math.abs(f.vx); }
      if (f.x > W-12) { f.x = W-12; f.vx = -Math.abs(f.vx); }
      if (f.y >= parada) {
        f.y = parada; f.aterrizado = true;
        /* registrar lo que llega al suelo (muones, fotones, neutrinos y
           los nucleones estables p, n que bajan directos) */
        if (!st.metas.suelo) {
          const llegaSuelo = st.frags.filter(x => x.aterrizado &&
            (x.tipo === 'muon' || x.tipo === 'neutrino' || x.tipo === 'foton' || x.tipo === 'nucleon')).length;
          if (llegaSuelo >= 4) rcImpMeta('suelo', 'rc-meta-suelo',
            '✓ Al suelo llegan muones (μ), fotones (γ), neutrinos (ν) y los nucleones estables (p, n): la parte penetrante de la cascada.');
        }
      }
    }
    rcDibujarPart(ctx, f.x, f.y, f.r, f.col, f.sym, '#06121f');
  });
}

/* Traza recta desde el origen (impacto/decaimiento) hasta la posición actual.
   Los fotones y neutrinos se dibujan punteados (como en los diagramas). */
function rcDibujarTraza(ctx, f) {
  if (f.ox === undefined) return;
  const punteado = (f.tipo === 'neutrino' || f.tipo === 'foton');
  ctx.save();
  ctx.strokeStyle = f.col;
  ctx.shadowColor = f.col; ctx.shadowBlur = 6;
  ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.globalAlpha = 0.75;
  if (punteado) ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(f.ox, f.oy);
  ctx.lineTo(f.x, f.y);
  ctx.stroke();
  ctx.restore();
}


/* ╔══════════════════════════════════════════════════════════╗
   ║  NIVEL B — LA CASCADA ELECTROMAGNÉTICA                     ║
   ╚══════════════════════════════════════════════════════════╝
   γ → e⁺e⁻ → γ → e⁺e⁻ … El nº de partículas se duplica en cada
   capa y la energía por partícula se reparte a la mitad, hasta
   caer bajo el umbral (~1 MeV): entonces la cascada se extingue.
   Interacción: avanza capa a capa (o reproduce) y observa el
   perfil crecer hasta X_max y decaer. */
function rcNivelEM(body) {
  document.getElementById('rc-instruccion').textContent =
    'Nivel 2 · La Cascada Electromagnética — Con 1 TeV, los fotones crean pares e⁺e⁻ y los electrones emiten fotones: el número de partículas se duplica capa a capa.';

  rcState.completado = false;
  rcState.emEnergia = 1e6;      /* MeV por la partícula inicial (1 TeV = 1e6 MeV) */
  rcState.emUmbral = 1.0;       /* MeV, umbral de producción de pares en aire (~) */
  rcState.emCapa = 0;
  rcState.emMaxCapa = 0;        /* capa de X_max (se calcula) */
  rcState.emAuto = false;
  rcState.emTick = 0;
  rcState.emVistoMax = false;
  /* capa de X_max: cuando E/2^n ~ umbral  →  n = log2(E/umbral) */
  rcState.emNmax = Math.round(Math.log2(rcState.emEnergia / rcState.emUmbral));
  rcState.emCapas = Math.min(10, rcState.emNmax); /* mostramos hasta 10 capas */

  body.innerHTML = `
    <div class="rc-wrap">
      <div class="rc-panel">
        <div class="rc-panel-card">
          <div class="rc-panel-title">Reto</div>
          <div class="rc-reto" id="rc-reto-txt">Haz crecer la cascada capa a capa hasta su máximo (X_max) y mira cómo luego se extingue.</div>
          <div class="rc-prog-wrap"><div class="rc-prog-barra" id="rc-prog-barra"></div></div>
          <div class="rc-prog-lbl" id="rc-prog-lbl">Capa 0</div>
          <div class="rc-estado" id="rc-estado"></div>
        </div>
        <div class="rc-panel-card">
          <div class="rc-panel-title">Controles</div>
          <button class="rc-btn rc-btn-accion" onclick="rcEMAvanzar()">▶ Avanzar una capa</button>
          <button class="rc-btn rc-btn-accion" onclick="rcEMAuto()">⏩ Reproducir cascada</button>
          <button class="rc-btn rc-btn-sutil" onclick="rcEMReset()">↺ Reiniciar</button>
          <div class="rc-datos" id="rc-em-datos">—</div>
        </div>
        <div class="rc-panel-card">
          <div class="rc-panel-title">¿Por qué ocurre?</div>
          <div class="rc-hint">
            Es un proceso <strong>multiplicativo</strong>: cada fotón crea un par
            <strong>e⁺e⁻</strong> y cada electrón emite un fotón (<em>bremsstrahlung</em>).
            El nº de partículas se <strong>duplica</strong> y la energía por partícula se
            <strong>reparte</strong>. Cuando esa energía cae bajo el umbral (~1 MeV) ya no
            se crean pares: la cascada alcanza su máximo <strong>X_max</strong> y se apaga.
            Es E=mc² y la QED en acción.
          </div>
        </div>
        <div class="rc-logro-cont hidden" id="rc-logro-cont"></div>
      </div>
      <div class="rc-canvas-wrap">
        <canvas id="rc-canvas" class="rc-canvas"></canvas>
        <div class="rc-canvas-legend">
          <span style="color:#fff59d">γ fotón</span>
          <span style="color:#4fc3f7">e⁻ electrón</span>
          <span style="color:#ff8a80">e⁺ positrón</span>
        </div>
      </div>
    </div>
  `;

  const cv = document.getElementById('rc-canvas');
  rcState.canvas = cv; rcState.ctx = cv.getContext('2d');
  rcAjustarCanvasActivo();
  window.addEventListener('resize', rcAjustarCanvasActivo);
  rcEMActualizarDatos();
  rcProgreso(0, 'Capa 0');
  rcEMLoop();
}

function rcEMAvanzar() {
  if (rcState.emCapa < rcState.emCapas) {
    rcState.emCapa++;
    rcEMActualizarDatos();
    rcEMCheck();
  } else {
    rcEstado('Energía por partícula bajo el umbral: la cascada ya no puede crecer más. Se extingue.', true);
  }
}

function rcEMAuto() {
  rcState.emAuto = !rcState.emAuto;
}

function rcEMReset() {
  rcState.emCapa = 0; rcState.emAuto = false; rcState.emVistoMax = false;
  rcEMActualizarDatos();
  rcProgreso(0, 'Capa 0');
  rcEstado('', null);
}

function rcEMActualizarDatos() {
  const n = rcState.emCapa;
  const part = Math.pow(2, n);
  const ePart = rcState.emEnergia / part;
  const d = document.getElementById('rc-em-datos');
  if (d) {
    d.innerHTML =
      'Capa <b>' + n + '</b> / ' + rcState.emCapas + '<br>' +
      'Partículas: <b>' + part.toLocaleString() + '</b><br>' +
      'Energía/partícula: <b>' + rcFmtE(ePart) + '</b><br>' +
      'Umbral de pares: ~1 MeV';
  }
  rcProgreso(n / rcState.emCapas, 'Capa ' + n + ' · ' + part.toLocaleString() + ' partículas');
}

function rcFmtE(mev) {
  if (mev >= 1e6) return (mev/1e6).toFixed(2) + ' TeV';
  if (mev >= 1e3) return (mev/1e3).toFixed(2) + ' GeV';
  if (mev >= 1)   return mev.toFixed(1) + ' MeV';
  return (mev*1e3).toFixed(0) + ' keV';
}

function rcEMCheck() {
  if (rcState.completado) return;
  if (rcState.emCapa >= rcState.emCapas) {
    rcState.emVistoMax = true;
    rcState.emAuto = false;
    rcRetoCumplido('¡Cascada completa! Se duplicó capa a capa hasta X_max; al bajar del umbral de ~1 MeV se extinguió. Multiplicación pura: γ↔e⁺e⁻.');
  }
}

function rcEMLoop() {
  rcRAF = requestAnimationFrame(rcEMLoop);
  const st = rcState, ctx = st.ctx, cv = st.canvas;
  if (!ctx || !cv) return;
  const W = cv.width, H = cv.height;
  rcFondo(ctx, W, H);
  st.emTick++;

  /* avance automático */
  if (st.emAuto && st.emTick % 40 === 0) rcEMAvanzar();

  const topY = 24, botY = H - 48;
  const capas = st.emCapas;
  const dy = (botY - topY) / capas;

  /* árbol binario de la cascada: cada nodo se divide en dos en la capa siguiente */
  const dibujarNivel = (n) => {
    const num = Math.pow(2, n);
    const y = topY + dy * n;
    const paso = W / (num + 1);
    for (let k = 0; k < num; k++) {
      const x = paso * (k + 1);
      /* conexión al "padre" */
      if (n > 0) {
        const pPaso = W / (Math.pow(2, n-1) + 1);
        const px = pPaso * (Math.floor(k/2) + 1);
        const py = topY + dy * (n-1);
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
        ctx.restore();
      }
      /* alterna fotón / e± por capa (γ en pares, e en impares) */
      let col, sym;
      if (n % 2 === 0) { col = '#fff59d'; sym = 'γ'; }
      else { col = (k % 2 === 0) ? '#4fc3f7' : '#ff8a80'; sym = (k % 2 === 0) ? 'e⁻' : 'e⁺'; }
      const r = Math.max(4, 11 - n*0.7);
      rcDibujarPart(ctx, x, y, r, col, (num <= 16 ? sym : ''), '#06121f');
    }
  };

  for (let n = 0; n <= st.emCapa; n++) dibujarNivel(n);

  /* marca de X_max */
  if (st.emCapa >= st.emCapas) {
    const y = topY + dy * st.emCapas;
    ctx.save();
    ctx.strokeStyle = 'rgba(105,255,166,0.6)'; ctx.setLineDash([5,4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(105,255,166,0.9)'; ctx.font = 'bold 11px "Exo 2",sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('X_max — máximo de la cascada', 10, y - 6);
    ctx.restore();
  }

  /* mini perfil lateral: barras proporcionales al nº de partículas por capa */
  ctx.save();
  ctx.fillStyle = 'rgba(128,216,255,0.3)';
  for (let n = 0; n <= st.emCapa; n++) {
    const barH = Math.min(44, (n + 1) * 4);
    const yy = topY + dy*n;
    ctx.fillRect(W - 52, yy - 2, barH, 3);
  }
  ctx.restore();
}


/* ╔══════════════════════════════════════════════════════════╗
   ║  NIVEL C — LA COMPONENTE MUÓNICA (dilatación temporal)     ║
   ╚══════════════════════════════════════════════════════════╝
   Los muones se crean a ~15 km. Sin dilatación temporal apenas
   recorrerían ~600 m y casi ninguno llegaría; con la dilatación
   de la relatividad especial, su reloj va lento y SÍ llegan.
   Interacción: slider de velocidad (β) → factor γ → fracción que
   llega al suelo. Desafío: μ sin masa (decaería al instante). */
function rcNivelMuones(body) {
  document.getElementById('rc-instruccion').textContent =
    'Nivel 3 · La Componente Muónica — Los muones nacen a ~15 km y son tan penetrantes que llegan al suelo. ¿El secreto? La dilatación temporal de la relatividad.';

  rcState.completado = false;
  rcState.muBeta = 0.9;        /* fracción de c */
  rcState.muSinMasa = false;
  rcState.muMetas = { dilatar:false, comparar:false, desafio:false };
  rcState.muParts = [];
  rcState.t = 0;
  rcState.muSpawn = 0;

  body.innerHTML = `
    <div class="rc-wrap">
      <div class="rc-panel">
        <div class="rc-panel-card">
          <div class="rc-panel-title">Reto</div>
          <div class="rc-reto" id="rc-reto-txt">Ajusta la velocidad del muón y descubre por qué llega al suelo.</div>
          <div class="rc-prog-wrap"><div class="rc-prog-barra" id="rc-prog-barra"></div></div>
          <div class="rc-prog-lbl" id="rc-prog-lbl">0 / 3 metas</div>
          <ul class="rc-metas" id="rc-metas">
            <li id="rc-meta-dilatar">◻ Sube la velocidad por encima de 0.99 c</li>
            <li id="rc-meta-comparar">◻ Compara: con y sin dilatación temporal</li>
            <li id="rc-meta-desafio">◻ Prueba el desafío: muón SIN masa</li>
          </ul>
          <div class="rc-estado" id="rc-estado"></div>
        </div>
        <div class="rc-panel-card">
          <div class="rc-panel-title">Velocidad del muón</div>
          <div class="rc-slider-val" id="rc-mu-beta">β = 0.900 c · γ = 2.3</div>
          <input type="range" min="500" max="99990" value="9000" step="10" class="rc-slider" id="rc-mu-slider" oninput="rcMuSlider(this.value)">
          <div class="rc-datos" id="rc-mu-datos">—</div>
          <button class="rc-btn rc-btn-sutil" id="rc-mu-desafio" onclick="rcMuDesafio()">🧪 Desafío: muón sin masa</button>
        </div>
        <div class="rc-panel-card">
          <div class="rc-panel-title">¿Por qué ocurre?</div>
          <div class="rc-hint">
            Un muón vive de media <strong>2.2 μs</strong>. A la velocidad de la luz solo
            recorrería <strong>~660 m</strong>: nunca cruzaría los 15 km. Pero viaja tan rápido
            que su <strong>reloj va lento</strong> (dilatación temporal, factor <strong>γ</strong>):
            para nosotros vive mucho más y <strong>sí llega al suelo</strong> (~1 muón por cm²
            por minuto). Su gran masa (207 × el electrón) hace que casi no emita radiación: por
            eso es tan <strong>penetrante</strong>.
          </div>
        </div>
        <div class="rc-logro-cont hidden" id="rc-logro-cont"></div>
      </div>
      <div class="rc-canvas-wrap">
        <canvas id="rc-canvas" class="rc-canvas"></canvas>
        <div class="rc-canvas-legend">
          <span style="color:#69ffa6">μ llega al suelo</span>
          <span style="color:#ff8a80">μ decae antes</span>
        </div>
      </div>
    </div>
  `;

  const cv = document.getElementById('rc-canvas');
  rcState.canvas = cv; rcState.ctx = cv.getContext('2d');
  rcAjustarCanvasActivo();
  window.addEventListener('resize', rcAjustarCanvasActivo);
  rcMuActualizar();
  rcProgreso(0, '0 / 3 metas');
  rcMuLoop();
}

function rcMuGamma(beta) {
  return 1 / Math.sqrt(1 - beta*beta);
}

/* Fracción de muones que sobreviven hasta el suelo (modelo simplificado).
   Distancia 15 km; en reposo recorrería c·τ·β ≈ 660 m·β; con dilatación ×γ. */
function rcMuFraccionLlega(beta, conDilatacion) {
  const d = 15000;              /* m */
  const base = 660 * beta;      /* alcance sin dilatación (orden de magnitud) */
  const alcance = conDilatacion ? base * rcMuGamma(beta) : base;
  return Math.exp(-d / Math.max(1, alcance));
}

function rcMuSlider(v) {
  rcState.muBeta = Math.min(0.9999, v / 100000);
  rcState.muSinMasa = false;
  const btn = document.getElementById('rc-mu-desafio');
  if (btn) { btn.classList.remove('on'); btn.textContent = '🧪 Desafío: muón sin masa'; }
  rcMuActualizar();
  if (rcState.muBeta >= 0.99 && !rcState.muMetas.dilatar) {
    rcMuMeta('dilatar', 'rc-meta-dilatar', '✓ A más de 0.99 c el factor γ se dispara: el muón "vive" mucho más para nosotros.');
  }
}

function rcMuDesafio() {
  rcState.muSinMasa = !rcState.muSinMasa;
  const btn = document.getElementById('rc-mu-desafio');
  if (btn) {
    btn.classList.toggle('on', rcState.muSinMasa);
    btn.textContent = rcState.muSinMasa ? '🧪 Muón sin masa (activo)' : '🧪 Desafío: muón sin masa';
  }
  rcMuActualizar();
  if (rcState.muSinMasa && !rcState.muMetas.desafio) {
    rcMuMeta('desafio', 'rc-meta-desafio', '✓ Sin masa el muón iría a c y, sin un reloj propio con vida finita útil, decaería al instante: no habría muones al suelo. La masa es crucial.');
  }
}

function rcMuActualizar() {
  const beta = rcState.muBeta;
  const g = rcMuGamma(beta);
  const vlbl = document.getElementById('rc-mu-beta');
  if (vlbl) vlbl.innerHTML = 'β = ' + beta.toFixed(4) + ' c · γ = ' + g.toFixed(1);

  const conDil = rcMuFraccionLlega(beta, true);
  const sinDil = rcMuFraccionLlega(beta, false);
  const d = document.getElementById('rc-mu-datos');
  if (d) {
    if (rcState.muSinMasa) {
      d.innerHTML = '<b style="color:#ff8a80">Muón sin masa:</b><br>viajaría a c pero sin vida propia útil → decae de inmediato. Llegan al suelo: <b>~0%</b>.';
    } else {
      d.innerHTML =
        'Llegan al suelo:<br>' +
        '· con dilatación: <b style="color:#69ffa6">' + (conDil*100).toFixed(1) + '%</b><br>' +
        '· sin dilatación: <b style="color:#ff8a80">' + (sinDil*100).toFixed(4) + '%</b>';
    }
  }
  /* meta comparar: cuando la diferencia es notable */
  if (!rcState.muMetas.comparar && conDil > 0.2 && sinDil < 0.01) {
    rcMuMeta('comparar', 'rc-meta-comparar', '✓ La diferencia es enorme: sin dilatación casi ninguno llega; con dilatación, muchos. Esa es la prueba de la relatividad.');
  }
}

function rcMuMeta(clave, liId, msg) {
  if (rcState.muMetas[clave]) return;
  rcState.muMetas[clave] = true;
  const li = document.getElementById(liId);
  if (li) { li.classList.add('ok'); li.textContent = '✓' + li.textContent.slice(1); }
  rcEstado(msg, true);
  const hechas = Object.values(rcState.muMetas).filter(Boolean).length;
  rcProgreso(hechas / 3, hechas + ' / 3 metas');
  if (hechas >= 3) {
    rcRetoCumplido('¡Componente muónica dominada! Los muones son las partículas más penetrantes y llegan al suelo gracias a la dilatación temporal. Son la prueba viva de la relatividad.');
  }
}

function rcMuLoop() {
  rcRAF = requestAnimationFrame(rcMuLoop);
  const st = rcState, ctx = st.ctx, cv = st.canvas;
  if (!ctx || !cv) return;
  const W = cv.width, H = cv.height;
  rcFondo(ctx, W, H);
  rcDibujarAtmosfera(ctx, W, H, true);
  st.t += 0.05;
  const suelo = H - 22;
  const origenY = 30;

  /* genera muones periódicamente desde lo alto */
  st.muSpawn++;
  if (st.muSpawn % 26 === 0) {
    const conDil = rcMuFraccionLlega(st.muBeta, true);
    const llega = !st.muSinMasa && Math.random() < conDil;
    st.muParts.push({
      x: 40 + Math.random()*(W-80), y: origenY,
      vy: 1.6 + st.muBeta*2.4,
      llega, muerto: false,
      /* si no llega, muere a una altura aleatoria */
      muerteY: origenY + (suelo-origenY) * (0.3 + Math.random()*0.5)
    });
  }

  /* etiqueta de origen */
  ctx.save();
  ctx.fillStyle = 'rgba(128,216,255,0.5)'; ctx.font = '10px "Exo 2",sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('μ nacen aquí (~15 km, de π± → μν)', 10, origenY - 8);
  ctx.restore();

  st.muParts.forEach(p => {
    if (!p.muerto) {
      p.y += p.vy;
      if (!p.llega && p.y >= p.muerteY) { p.muerto = true; p.muerteT = 1; }
      if (p.llega && p.y >= suelo - 10) { p.y = suelo - 10; p.enSuelo = true; }
    }
    if (p.muerto) {
      p.muerteT = (p.muerteT || 1) - 0.05;
      if (p.muerteT > 0) {
        ctx.save(); ctx.globalAlpha = p.muerteT;
        ctx.strokeStyle = '#ff8a80'; ctx.lineWidth = 2;
        for (let k=0;k<6;k++){ const a=k/6*Math.PI*2; ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x+Math.cos(a)*12,p.y+Math.sin(a)*12); ctx.stroke(); }
        ctx.restore();
      }
    } else {
      const col = p.llega ? '#69ffa6' : '#ff8a80';
      ctx.save();
      ctx.strokeStyle = col; ctx.globalAlpha = 0.3; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y - 16); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.restore();
      rcDibujarPart(ctx, p.x, p.y, 9, col, 'μ', '#06121f');
    }
  });
  /* limpiar */
  st.muParts = st.muParts.filter(p => (p.muerteT === undefined || p.muerteT > 0) && p.y < H + 20);

  /* Franja de alcance CLÁSICO (sin dilatación): zona por encima de yRef.
     Los muones verdes la cruzan GRACIAS a la dilatación temporal; por eso la
     etiqueta aclara que ese es el límite del caso sin relatividad. */
  const base = 660 * st.muBeta;
  const yRef = origenY + (suelo - origenY) * Math.min(1, base / 15000);
  ctx.save();
  /* sombra tenue de la zona que alcanzarían sin dilatación */
  ctx.fillStyle = 'rgba(255,138,128,0.06)';
  ctx.fillRect(0, origenY, W, Math.max(0, yRef - origenY));
  ctx.strokeStyle = 'rgba(255,138,128,0.55)'; ctx.setLineDash([5,4]); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, yRef); ctx.lineTo(W, yRef); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,138,128,0.85)'; ctx.font = '10px "Exo 2",sans-serif'; ctx.textAlign = 'right';
  ctx.fillText('límite SIN dilatación — con ella los μ lo cruzan y llegan', W - 10, yRef - 5);
  ctx.restore();
}


/* ╔══════════════════════════════════════════════════════════╗
   ║  NIVEL D — LOS NEUTRINOS CÓSMICOS                          ║
   ╚══════════════════════════════════════════════════════════╝
   Los neutrinos nacen en los decaimientos (π→μν, μ→eνν) y casi
   no interactúan: atraviesan la atmósfera, la Tierra entera, y
   se detectan en experimentos gigantes (IceCube, Super-K).
   Interacción: lanza neutrinos a través de la Tierra y responde
   preguntas que fijan por qué son mensajeros astrofísicos. */
const RC_NU_PREG = [
  { q:'¿Interactúan los neutrinos con la atmósfera?', ops:['Sí, se frenan','Casi nunca: la atraviesan'], ok:1,
    exp:'Casi no interactúan: escapan de la cascada sin desviarse.' },
  { q:'¿Qué hacen al llegar al suelo?', ops:['Se detienen en la superficie','Lo cruzan y siguen bajo tierra'], ok:1,
    exp:'Lo cruzan sin frenarse: atraviesan el suelo y la Tierra entera.' },
  { q:'En la animación, ¿la trayectoria del neutrino se curva o se desvía?', ops:['Sí, zigzaguea','No: cae recto'], ok:1,
    exp:'Cae en línea recta, sin desviarse: nada en su camino lo afecta.' },
];

function rcNivelNeutrinos(body) {
  document.getElementById('rc-instruccion').textContent =
    'Nivel 4 · Los Neutrinos Cósmicos — Nacen en los decaimientos de la cascada y casi no interactúan: escapan y cruzan la Tierra. Son mensajeros del universo violento.';

  rcState.completado = false;
  rcState.nuLanzados = 0;
  rcState.nuPregIdx = 0;
  rcState.nuAciertos = 0;
  rcState.nuMetas = { lanzar:false, preguntas:false };
  rcState.nuParts = [];
  rcState.nuDetectado = 0;
  rcState.nuAuto = false;     /* lluvia continua tras lanzar los 8 primeros */
  rcState.nuSpawn = 0;
  rcState.t = 0;

  body.innerHTML = `
    <div class="rc-wrap">
      <div class="rc-panel">
        <div class="rc-panel-card">
          <div class="rc-panel-title">Reto</div>
          <div class="rc-reto" id="rc-reto-txt">Lanza neutrinos a través de la Tierra y responde las preguntas.</div>
          <div class="rc-prog-wrap"><div class="rc-prog-barra" id="rc-prog-barra"></div></div>
          <div class="rc-prog-lbl" id="rc-prog-lbl">0 / 2 metas</div>
          <ul class="rc-metas" id="rc-metas">
            <li id="rc-meta-lanzar">◻ Lanza al menos 8 neutrinos</li>
            <li id="rc-meta-preguntas">◻ Acierta las ${RC_NU_PREG.length} preguntas</li>
          </ul>
          <div class="rc-estado" id="rc-estado"></div>
        </div>
        <div class="rc-panel-card">
          <div class="rc-panel-title">Controles</div>
          <button class="rc-btn rc-btn-accion" onclick="rcNuLanzar()">💨 Lanzar neutrino</button>
          <div class="rc-datos" id="rc-nu-datos">Lanzados: 0</div>
          <div class="rc-hint" style="margin-top:6px">
            💡 <strong>Nota:</strong> los neutrinos atraviesan la atmósfera, el suelo y la Tierra
            entera sin frenarse. Experimentos gigantes bajo tierra o hielo como
            <strong>IceCube</strong> (Antártida) y <strong>Super-Kamiokande</strong> captan los
            rarísimos que sí chocan.
          </div>
        </div>
        <div class="rc-panel-card">
          <div class="rc-panel-title">Pregunta <span id="rc-nu-pn" style="color:#80d8ff"></span></div>
          <div class="rc-reto" id="rc-nu-preg">—</div>
          <div class="rc-nu-ops" id="rc-nu-ops"></div>
        </div>
        <div class="rc-panel-card">
          <div class="rc-panel-title">¿Por qué ocurre?</div>
          <div class="rc-hint">
            El neutrino casi no siente la materia: puede cruzar <strong>años luz de plomo</strong>
            sin chocar. Por eso <strong>escapa</strong> de la cascada y de la Tierra sin desviarse,
            trayendo información intacta de donde nació. Detectarlos (IceCube, Super-K) abre una
            <strong>ventana directa</strong> a supernovas, agujeros negros y galaxias activas.
          </div>
        </div>
        <div class="rc-logro-cont hidden" id="rc-logro-cont"></div>
      </div>
      <div class="rc-canvas-wrap">
        <canvas id="rc-canvas" class="rc-canvas"></canvas>
        <div class="rc-canvas-legend">
          <span style="color:#b388ff">ν neutrino</span>
          <span style="color:rgba(205,238,255,0.7)">atraviesan todo sin interactuar</span>
        </div>
      </div>
    </div>
  `;

  const cv = document.getElementById('rc-canvas');
  rcState.canvas = cv; rcState.ctx = cv.getContext('2d');
  rcAjustarCanvasActivo();
  window.addEventListener('resize', rcAjustarCanvasActivo);
  rcNuCargarPreg();
  rcProgreso(0, '0 / 2 metas');
  rcNuLoop();
}

/* Crea un neutrino que nace arriba y CAE recto cruzando toda la pantalla */
function rcNuSpawn() {
  const cv = rcState.canvas; if (!cv) return;
  rcState.nuParts.push({
    x: 50 + Math.random() * (cv.width - 100),
    y: -16,
    vy: 3.2 + Math.random() * 1.6,
    vx: (Math.random() - 0.5) * 0.3   /* casi recto: no se desvía */
  });
}

function rcNuLanzar() {
  if (!rcState.canvas) return;
  rcState.nuLanzados++;
  rcNuSpawn();
  const d = document.getElementById('rc-nu-datos');
  if (d) d.textContent = 'Lanzados: ' + rcState.nuLanzados;
  if (rcState.nuLanzados >= 8 && !rcState.nuMetas.lanzar) {
    /* a partir de aquí caen neutrinos libremente, sin pulsar el botón */
    rcState.nuAuto = true;
    rcNuMeta('lanzar', 'rc-meta-lanzar', '✓ Todos atravesaron la atmósfera y el suelo sin desviarse ni frenarse. Ahora caen más neutrinos por su cuenta, como la lluvia constante que atraviesa la Tierra.');
  }
}

function rcNuCargarPreg() {
  const p = RC_NU_PREG[rcState.nuPregIdx];
  const pn = document.getElementById('rc-nu-pn');
  const pq = document.getElementById('rc-nu-preg');
  const ops = document.getElementById('rc-nu-ops');
  if (!p) {
    if (pn) pn.textContent = '✓';
    if (pq) pq.textContent = '¡Preguntas resueltas!';
    if (ops) ops.innerHTML = '';
    return;
  }
  if (pn) pn.textContent = (rcState.nuPregIdx + 1) + '/' + RC_NU_PREG.length;
  if (pq) pq.textContent = p.q;
  if (ops) ops.innerHTML = p.ops.map((o, i) =>
    `<button class="rc-btn rc-nu-op" onclick="rcNuResponder(${i})">${o}</button>`).join('');
}

function rcNuResponder(i) {
  const p = RC_NU_PREG[rcState.nuPregIdx];
  if (!p) return;
  if (i === p.ok) {
    rcState.nuAciertos++;
    rcEstado('✔ ' + p.exp, true);
    rcState.nuPregIdx++;
    if (rcState.nuAciertos >= RC_NU_PREG.length) {
      rcNuMeta('preguntas', 'rc-meta-preguntas', '✓ Neutrinos entendidos: mensajeros que viajan sin desviarse desde los confines del universo.');
    } else {
      setTimeout(rcNuCargarPreg, 650);
    }
  } else {
    rcEstado('✗ No es correcto. Pista: ' + p.exp, false);
  }
}

function rcNuMeta(clave, liId, msg) {
  if (rcState.nuMetas[clave]) return;
  rcState.nuMetas[clave] = true;
  const li = document.getElementById(liId);
  if (li) { li.classList.add('ok'); li.textContent = '✓' + li.textContent.slice(1); }
  rcEstado(msg, true);
  const hechas = Object.values(rcState.nuMetas).filter(Boolean).length;
  rcProgreso(hechas / 2, hechas + ' / 2 metas');
  if (hechas >= 2) {
    rcRetoCumplido('¡Neutrinos cósmicos! Atraviesan la atmósfera, el suelo y la Tierra entera sin interactuar. Solo detectores gigantes bajo tierra (IceCube, Super-K) captan los rarísimos que chocan: son la ventana más directa al universo violento.');
  }
}

function rcNuLoop() {
  rcRAF = requestAnimationFrame(rcNuLoop);
  const st = rcState, ctx = st.ctx, cv = st.canvas;
  if (!ctx || !cv) return;
  const W = cv.width, H = cv.height;
  rcFondo(ctx, W, H);
  st.t += 0.05;
  const suelo = H - 22;

  /* lluvia automática de neutrinos tras lanzar los 8 primeros */
  if (st.nuAuto) {
    st.nuSpawn++;
    if (st.nuSpawn % 22 === 0) rcNuSpawn();
  }

  /* nube de aire arriba (donde nacen, de la cascada) */
  rcDibujarNube(ctx, H * 0.14, W, st.t, 'quieto');

  /* suelo: los neutrinos lo CRUZAN sin detenerse (zona bajo tierra tenue) */
  ctx.save();
  ctx.fillStyle = 'rgba(10,20,40,0.55)';
  ctx.fillRect(0, suelo, W, H - suelo);
  ctx.strokeStyle = 'rgba(79,195,247,0.45)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, suelo); ctx.lineTo(W, suelo); ctx.stroke();
  ctx.fillStyle = 'rgba(205,238,255,0.6)'; ctx.font = '10px "Exo 2",sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('SUELO — los ν siguen bajo tierra (ahí los capta IceCube/Super-K)', 10, suelo + 15);
  ctx.restore();

  /* etiqueta de origen */
  ctx.save();
  ctx.fillStyle = 'rgba(179,136,255,0.7)'; ctx.font = '10px "Exo 2",sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('ν nacen en la cascada ↓ y no interactúan con nada', 10, 16);
  ctx.restore();

  /* neutrinos cayendo verticalmente, cruzando TODA la pantalla */
  st.nuParts.forEach(p => {
    p.y += p.vy; p.x += p.vx;
    /* trazo (estela vertical, línea punteada típica del neutrino) */
    ctx.save();
    ctx.strokeStyle = 'rgba(179,136,255,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([5,5]);
    ctx.beginPath(); ctx.moveTo(p.x, p.y - 28); ctx.lineTo(p.x, p.y); ctx.stroke();
    ctx.restore();
    rcDibujarPart(ctx, p.x, p.y, 8, '#b388ff', 'ν', '#1a0b33');
  });
  /* se eliminan cuando ya salieron por abajo (bajo el suelo, fuera del lienzo) */
  st.nuParts = st.nuParts.filter(p => p.y < H + 40);
}


/* ╔══════════════════════════════════════════════════════════╗
   ║  NIVEL E — EL DETECTOR DE RAYOS CÓSMICOS                   ║
   ╚══════════════════════════════════════════════════════════╝
   Observatorio tipo Pierre Auger: una red de TANQUES de agua en
   el suelo (detectan partículas cargadas) y un TELESCOPIO de
   fluorescencia (capta la luz UV que la cascada deja en el aire).
   El usuario completa 5 tareas: observar tanques, observar el
   telescopio, reconstruir la dirección (por los tiempos de
   llegada) y la energía (por el nº de partículas), y resolver el
   desafío de distinguir un rayo cósmico de un neutrino. */
function rcNivelDetector(body) {
  document.getElementById('rc-instruccion').textContent =
    'Nivel 5 · El Detector de Rayos Cósmicos — Un observatorio real (como Pierre Auger) combina tanques de agua y telescopios de fluorescencia para reconstruir de dónde vino el rayo cósmico y cuánta energía traía.';

  rcState.completado = false;
  rcState.detTareas = { tanques:false, telescopio:false, direccion:false, energia:false, desafio:false };
  rcState.detFase = 'listo';     /* listo → cae → cascada → impactos */
  rcState.detCascada = [];       /* partículas de la cascada que caen */
  rcState.detProton = null;      /* protón primario mientras cae */
  rcState.detNubeY = 0;          /* altura de la nube de aire */
  rcState.detImpactoX = 0;       /* x del punto de impacto (aleatorio) */
  rcState.detHits = {};          /* tanque -> nº de impactos */
  rcState.detTocoTanque = false; /* ¿llegó alguna partícula a un tanque? */
  rcState.detFlashTanque = -1;   /* tanque en destello de activación */
  rcState.detFlashT = 0;
  rcState.detReintentos = 0;
  rcState.detTanqueObjetivo = -1;
  rcState.detTeleOn = false;     /* telescopio capturando luz UV */
  rcState.detDir = false;        /* dirección reconstruida visible */
  rcState.detEnergia = 0;        /* nº de partículas detectadas (→ energía) */
  rcState.detEnergiaVal = 0;
  rcState.detDesafio = false;    /* muestra la pregunta del desafío */
  rcState.t = 0;
  rcState.detSpawn = 0;

  /* ángulo real del rayo primario (lo que hay que reconstruir) */
  rcState.detAngulo = -0.5 + Math.random();     /* leve inclinación */

  body.innerHTML = `
    <div class="rc-wrap">
      <div class="rc-panel">
        <div class="rc-panel-card">
          <div class="rc-panel-title">Reto</div>
          <div class="rc-reto" id="rc-reto-txt">Reconstruye el rayo cósmico con el observatorio. Completa las 5 tareas.</div>
          <div class="rc-prog-wrap"><div class="rc-prog-barra" id="rc-prog-barra"></div></div>
          <div class="rc-prog-lbl" id="rc-prog-lbl">0 / 5 tareas</div>
          <ul class="rc-metas" id="rc-metas">
            <li id="rc-det-t1">◻ Observa los tanques de agua</li>
            <li id="rc-det-t2">◻ Observa el telescopio de fluorescencia</li>
            <li id="rc-det-t3">◻ Reconstruye la dirección del rayo</li>
            <li id="rc-det-t4">◻ Reconstruye la energía</li>
            <li id="rc-det-t5">◻ Desafío: distinguir rayo cósmico de neutrino</li>
          </ul>
          <div class="rc-estado" id="rc-estado"></div>
        </div>
        <div class="rc-panel-card">
          <div class="rc-panel-title">Observatorio</div>
          <button class="rc-btn rc-btn-accion" id="rc-det-lanzar" onclick="rcDetLanzar()">☄️ Dejar caer la cascada</button>
          <button class="rc-btn rc-btn-accion" id="rc-det-tanques" onclick="rcDetTanques()" disabled>💧 Observar tanques de agua</button>
          <button class="rc-btn rc-btn-accion" id="rc-det-tele" onclick="rcDetTelescopio()" disabled>🔭 Observar telescopio UV</button>
          <button class="rc-btn rc-btn-accion" id="rc-det-dir" onclick="rcDetDireccion()" disabled>🧭 Reconstruir dirección</button>
          <button class="rc-btn rc-btn-accion" id="rc-det-energia" onclick="rcDetEnergiaBtn()" disabled>⚡ Reconstruir energía</button>
          <div class="rc-datos" id="rc-det-datos">—</div>
        </div>
        <div class="rc-panel-card hidden" id="rc-det-desafio-card">
          <div class="rc-panel-title">Desafío final</div>
          <div class="rc-reto">¿Cómo se distingue un rayo cósmico de un neutrino?</div>
          <div class="rc-nu-ops">
            <button class="rc-btn rc-nu-op" onclick="rcDetDesafio(0)">El neutrino no produce cascada: llega casi horizontal e interactúa en el hielo o el agua</button>
            <button class="rc-btn rc-nu-op" onclick="rcDetDesafio(1)">El neutrino produce una cascada más grande</button>
            <button class="rc-btn rc-nu-op" onclick="rcDetDesafio(2)">No se pueden distinguir</button>
          </div>
        </div>
        <div class="rc-panel-card">
          <div class="rc-panel-title">¿Por qué ocurre?</div>
          <div class="rc-hint">
            Un observatorio como <strong>Pierre Auger</strong> (Argentina) usa dos técnicas a la vez:
            cientos de <strong>tanques de agua</strong> que se encienden cuando los cruzan partículas
            cargadas, y <strong>telescopios</strong> que ven la débil luz <strong>UV</strong> que la
            cascada deja en el aire. Con los <strong>tiempos de llegada</strong> a cada tanque se
            reconstruye la <strong>dirección</strong>, y con el <strong>número total de partículas</strong>,
            la <strong>energía</strong> del rayo primario.
          </div>
        </div>
        <div class="rc-logro-cont hidden" id="rc-logro-cont"></div>
      </div>
      <div class="rc-canvas-wrap">
        <canvas id="rc-canvas" class="rc-canvas"></canvas>
        <div class="rc-canvas-legend">
          <span style="color:#4fc3f7">💧 tanques de agua</span>
          <span style="color:#b388ff">🔭 telescopio UV</span>
          <span style="color:#ffd740">cascada</span>
        </div>
      </div>
    </div>
  `;

  const cv = document.getElementById('rc-canvas');
  rcState.canvas = cv; rcState.ctx = cv.getContext('2d');
  rcAjustarCanvasActivo();
  window.addEventListener('resize', rcAjustarCanvasActivo);
  /* preparar la fila de tanques (se posicionan en el loop según el ancho) */
  rcState.detNTanques = 7;
  rcProgreso(0, '0 / 5 tareas');
  rcDetLoop();
}

/* Posiciones X de los tanques (misma fórmula en lanzar y en el loop) */
function rcDetTanquesX(W) {
  const n = rcState.detNTanques || 7;
  const margen = 70, ancho = W - margen * 2;
  const xs = [];
  for (let i = 0; i < n; i++) xs.push(margen + ancho * (i / (n - 1)));
  return xs;
}

/* Deja caer la cascada: genera partículas que bajan e impactan en los tanques */
function rcDetLanzar() {
  if (rcState.detFase !== 'listo') return;
  const cv = rcState.canvas; if (!cv) return;
  rcState.detFase = 'cae';          /* cae → cascada (decae en vuelo) → impactos */
  rcState.detCascada = [];
  rcState.detEnergia = 0;
  rcState.detHits = {};
  rcState.detTocoTanque = false;    /* ¿alguna partícula llegó a un tanque? */
  rcState.detReintentos = (rcState.detReintentos || 0);
  const W = cv.width, H = cv.height;
  /* el primario apunta justo a un TANQUE elegido al azar, para garantizar que
     la cascada reparta sobre tanques reales (no en un hueco) */
  const xs = rcDetTanquesX(W);
  rcState.detTanqueObjetivo = Math.floor(Math.random() * xs.length);
  rcState.detImpactoX = xs[rcState.detTanqueObjetivo];
  /* el protón entra arriba con una inclinación acorde al punto de impacto */
  const topY = 14;
  const nubeY = H * 0.30;           /* altura de la nube de aire donde choca */
  rcState.detNubeY = nubeY;
  rcState.detProton = {
    x: rcState.detImpactoX - rcState.detAngulo * 40,
    y: topY, ox: topY,
    tx: rcState.detImpactoX,        /* x objetivo al llegar a la nube */
    vy: 3.4
  };
  const b1 = document.getElementById('rc-det-lanzar');
  if (b1) b1.disabled = true;
  const bt = document.getElementById('rc-det-tanques');
  if (bt) bt.disabled = false;
  rcEstado('El protón choca con la nube: la cascada cae y los tanques se encienden solos al recibir partículas. Puedes relanzar las veces que quieras.', true);
}

/* Genera la cascada hadrónica cuando el protón choca con la nube (como Nivel 1) */
function rcDetImpacto(ix, iy) {
  rcState.detFase = 'cascada';
  rcState.detProton = null;
  const defs = [
    { sym:'π⁺', col:'#ff8a80', tipo:'pion' },
    { sym:'π⁻', col:'#ff8a80', tipo:'pion' },
    { sym:'π⁰', col:'#ffab91', tipo:'pion0' },
    { sym:'π⁺', col:'#ff8a80', tipo:'pion' },
    { sym:'K⁺', col:'#ffd740', tipo:'kaon' },
    { sym:'n',  col:'#80d8ff', tipo:'nucleon' },
    { sym:'p',  col:'#80d8ff', tipo:'nucleon' },
  ];
  for (let i = defs.length - 1; i > 0; i--) {   /* barajar */
    const j = Math.floor(Math.random() * (i + 1));
    [defs[i], defs[j]] = [defs[j], defs[i]];
  }
  const cNum = defs.length;
  rcState.detCascada = defs.map((d, i) => {
    /* abanico más estrecho: la lluvia cae CERCA del tanque objetivo */
    const base = (i / (cNum - 1) - 0.5) * 0.9;
    const ang  = base + (Math.random() - 0.5) * 0.3;
    const sp   = 1.6 + Math.random() * 1.0;
    return {
      ...d, x: ix, y: iy, ox: ix, oy: iy,
      vx: Math.sin(ang) * sp,
      vy: Math.cos(ang) * sp * 0.9 + 1.4,
      r: 10 + Math.random() * 3,
      decaeEn: 20 + Math.floor(Math.random() * 40),  /* frames hasta decaer */
      edad: 0, vivo: true
    };
  });
}

function rcDetTanques() {
  rcDetTarea('tanques', 'rc-det-t1',
    '✓ Tanques de agua: se encienden al paso de partículas CARGADAS (muones y electrones de la cascada).');
  const bt = document.getElementById('rc-det-tele');
  if (bt) bt.disabled = false;
}

function rcDetTelescopio() {
  rcState.detTeleOn = true;
  rcDetTarea('telescopio', 'rc-det-t2',
    '✓ Telescopio de fluorescencia: capta la débil luz UV que la cascada deja al excitar el nitrógeno del aire.');
  const bd = document.getElementById('rc-det-dir');
  if (bd) bd.disabled = false;
}

function rcDetDireccion() {
  rcState.detDir = true;
  rcDetTarea('direccion', 'rc-det-t3',
    '✓ Dirección reconstruida: los tanques se encienden en INSTANTES distintos; ese desfase marca por dónde entró el rayo.');
  const be = document.getElementById('rc-det-energia');
  if (be) be.disabled = false;
}

function rcDetEnergiaBtn() {
  /* la energía se estima a partir del nº de partículas detectadas */
  const nPart = rcState.detCascada.length;
  const eEV = Math.round(nPart * 2.5) / 10;   /* valor ilustrativo en ×10^18 eV */
  rcState.detEnergiaVal = eEV;
  rcDetTarea('energia', 'rc-det-t4',
    '✓ Energía reconstruida ≈ ' + eEV.toFixed(1) + ' ×10¹⁸ eV: a más partículas detectadas, más energía traía el primario.');
  /* desbloquea el desafío final */
  const card = document.getElementById('rc-det-desafio-card');
  if (card) card.classList.remove('hidden');
  rcEstado('¡Dirección y energía listas! Resuelve el Desafío final para terminar.', true);
}

function rcDetDesafio(i) {
  if (rcState.detTareas.desafio) return;
  if (i === 0) {
    rcDetTarea('desafio', 'rc-det-t5',
      '✓ ¡Exacto! El neutrino no genera una cascada de superficie: cruza la atmósfera y se detecta por su rara interacción en hielo o agua, a menudo llegando casi horizontal.');
  } else {
    rcEstado('✗ No. Un rayo cósmico sí genera cascada en el aire; el neutrino no, y por eso se detecta de otra forma.', false);
  }
}

/* Marca una tarea como hecha y actualiza progreso */
function rcDetTarea(clave, liId, msg) {
  if (rcState.detTareas[clave]) return;
  rcState.detTareas[clave] = true;
  const li = document.getElementById(liId);
  if (li) { li.classList.add('ok'); li.textContent = '✓' + li.textContent.slice(1); }
  rcEstado(msg, true);
  const hechas = Object.values(rcState.detTareas).filter(Boolean).length;
  rcProgreso(hechas / 5, hechas + ' / 5 tareas');
  if (hechas >= 5) {
    rcRetoCumplido('¡Observatorio dominado! Con tanques de agua y telescopios UV se reconstruye la dirección y la energía de cada rayo cósmico: así se buscan sus fuentes en el universo.');
  }
}

/* Productos del decaimiento de un secundario (π±→μν, π⁰→γγ, K±→μν).
   Nacen en la posición del padre; su traza arranca ahí (ramificación). */
function rcDetHijos(p) {
  const j = () => (Math.random() - 0.5) * 1.2;
  const base = { x:p.x, y:p.y, ox:p.x, oy:p.y, edad:0, decaeEn:9999, vivo:true };
  if (p.tipo === 'pion' || p.tipo === 'kaon') {
    return [
      { ...base, sym:'μ', col:'#69ffa6', tipo:'muon',     vx:p.vx*0.4-0.3+j(), vy:2.2+Math.random()*0.9, r:9 },
      { ...base, sym:'ν', col:'#b388ff', tipo:'neutrino', vx:p.vx*0.4+0.5+j(), vy:2.8+Math.random()*0.9, r:7 },
    ];
  }
  if (p.tipo === 'pion0') {
    return [
      { ...base, sym:'γ', col:'#fff59d', tipo:'foton', vx:p.vx-0.6+j(), vy:2.0+Math.random()*0.8, r:7 },
      { ...base, sym:'γ', col:'#fff59d', tipo:'foton', vx:p.vx+0.6+j(), vy:2.0+Math.random()*0.8, r:7 },
    ];
  }
  return [];
}

function rcDetLoop() {
  rcRAF = requestAnimationFrame(rcDetLoop);
  const st = rcState, ctx = st.ctx, cv = st.canvas;
  if (!ctx || !cv) return;
  const W = cv.width, H = cv.height;
  rcFondo(ctx, W, H);
  st.t += 0.05;
  const suelo = H - 30;
  const cx = W * 0.5, topY = 20;

  /* posiciones de los tanques (fila sobre el suelo) */
  const n = st.detNTanques;
  const margen = 70, ancho = W - margen * 2;
  const tanques = [];
  for (let i = 0; i < n; i++) {
    tanques.push({ x: margen + ancho * (i / (n - 1)), y: suelo });
  }

  /* suelo */
  ctx.save();
  ctx.fillStyle = 'rgba(10,20,40,0.5)'; ctx.fillRect(0, suelo, W, H - suelo);
  ctx.strokeStyle = 'rgba(79,195,247,0.4)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, suelo); ctx.lineTo(W, suelo); ctx.stroke();
  ctx.restore();

  /* traza de luz UV de la cascada (si el telescopio está encendido).
     Va desde la nube de aire hasta el punto de impacto en el suelo. */
  if (st.detTeleOn) {
    const bx = st.detImpactoX || cx;
    const nubeY = st.detNubeY || topY;
    ctx.save();
    const grad = ctx.createLinearGradient(bx, nubeY, bx, suelo);
    grad.addColorStop(0, 'rgba(179,136,255,0.0)');
    grad.addColorStop(0.5, 'rgba(179,136,255,0.35)');
    grad.addColorStop(1, 'rgba(179,136,255,0.08)');
    ctx.strokeStyle = grad; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, nubeY); ctx.lineTo(bx, suelo); ctx.stroke();
    ctx.fillStyle = 'rgba(179,136,255,0.7)'; ctx.font = '10px "Exo 2",sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('luz UV de fluorescencia', 12, 18);
    ctx.restore();
  }

  /* nube de aire donde choca el protón (visible desde que se lanza) */
  if (st.detFase !== 'listo' && st.detNubeY) {
    rcDibujarNube(ctx, st.detNubeY, W, st.t, st.detFase === 'cascada' ? 'cascada' : 'quieto');
  }

  /* protón primario cayendo hasta la nube */
  if (st.detFase === 'cae' && st.detProton) {
    const pr = st.detProton;
    pr.y += pr.vy;
    pr.x += (pr.tx - pr.x) * 0.04;
    ctx.save();
    ctx.strokeStyle = '#4fc3f7'; ctx.shadowColor = '#4fc3f7'; ctx.shadowBlur = 6;
    ctx.lineWidth = 2.5; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.moveTo(pr.x, pr.ox); ctx.lineTo(pr.x, pr.y); ctx.stroke();
    ctx.restore();
    rcDibujarPart(ctx, pr.x, pr.y, 11, '#4fc3f7', 'p', '#06121f');
    if (pr.y >= st.detNubeY) rcDetImpacto(pr.x, st.detNubeY);
  }

  /* mover la cascada: decae en vuelo (como Nivel 1) e impacta repartido */
  if (st.detFase === 'cascada') {
    const nuevos = [];
    st.detCascada.forEach(p => {
      if (!p.vivo) { nuevos.push(p); return; }
      p.edad++; p.x += p.vx; p.y += p.vy;
      if (p.x < 10) { p.x = 10; p.vx = Math.abs(p.vx); }
      if (p.x > W-10) { p.x = W-10; p.vx = -Math.abs(p.vx); }

      /* ¿toca decaer? (solo piones y kaones; nucleones y productos no) */
      const puedeDecaer = (p.tipo === 'pion' || p.tipo === 'pion0' || p.tipo === 'kaon');
      if (puedeDecaer && p.edad >= p.decaeEn && p.y < suelo - 30) {
        p.vivo = false;    /* el padre desaparece */
        const hijos = rcDetHijos(p);
        hijos.forEach(h => nuevos.push(h));
        return;
      }

      /* impacto en el suelo → enciende el tanque más cercano */
      if (p.y >= suelo) {
        p.y = suelo; p.vivo = false;
        let best = 0, bd = Infinity;
        tanques.forEach((t, i) => { const d = Math.abs(t.x - p.x); if (d < bd) { bd = d; best = i; } });
        if (bd < 55) {
          st.detHits[best] = (st.detHits[best] || 0) + 1;
          st.detEnergia++;
          st.detTocoTanque = true;
          st.detFlashTanque = best;   /* destello de activación */
          st.detFlashT = 1;
        }
      }
      nuevos.push(p);
    });
    st.detCascada = nuevos;

    /* ¿terminó la cascada? (ya no quedan partículas vivas) */
    const quedanVivas = st.detCascada.some(q => q.vivo);
    if (!quedanVivas) {
      if (st.detTocoTanque) {
        st.detFase = 'listo';
        const b1 = document.getElementById('rc-det-lanzar');
        if (b1) b1.disabled = false;
      } else {
        /* ninguna partícula tocó un tanque: REINTENTAR automáticamente */
        st.detReintentos = (st.detReintentos || 0) + 1;
        st.detFase = 'listo';
        rcEstado('Ningún tanque recibió partículas… reintentando la cascada (' + st.detReintentos + ').', null);
        setTimeout(() => { if (rcState.detFase === 'listo') rcDetLanzar(); }, 350);
      }
    }

    /* dibujar trazas + partículas vivas */
    st.detCascada.forEach(p => {
      if (p.ox !== undefined) {
        const punteado = (p.tipo === 'neutrino' || p.tipo === 'foton');
        ctx.save();
        ctx.strokeStyle = p.col; ctx.shadowColor = p.col; ctx.shadowBlur = 5;
        ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.globalAlpha = 0.7;
        if (punteado) ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(p.ox, p.oy); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.restore();
      }
      if (p.vivo) rcDibujarPart(ctx, p.x, p.y, p.r || 8, p.col, p.sym || '', '#06121f');
    });
  }

  /* destello de activación cuando un tanque recibe una partícula */
  if (st.detFlashT > 0) st.detFlashT = Math.max(0, st.detFlashT - 0.03);

  /* dibujar los tanques de agua (se activan SOLOS al recibir partículas) */
  tanques.forEach((t, i) => {
    const hits = (st.detHits && st.detHits[i]) || 0;
    const encendido = hits > 0;              /* ya no depende del botón */
    const flashing = (st.detFlashTanque === i && st.detFlashT > 0);
    ctx.save();
    if (encendido || flashing) {
      const pulso = 0.5 + 0.5 * Math.sin(st.t * 6 + i);
      ctx.shadowColor = '#4fc3f7'; ctx.shadowBlur = 10 + pulso * 10 + (flashing ? st.detFlashT * 25 : 0);
    }
    ctx.fillStyle = encendido ? 'rgba(79,195,247,0.9)' : 'rgba(79,195,247,0.22)';
    ctx.strokeStyle = flashing ? '#ffffff' : 'rgba(128,216,255,0.7)'; ctx.lineWidth = flashing ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(t.x - 13, t.y - 18, 26, 18, 4) : ctx.rect(t.x - 13, t.y - 18, 26, 18);
    ctx.fill(); ctx.stroke();
    ctx.restore();
    /* anillo de "activación" al recibir impacto */
    if (flashing) {
      ctx.save();
      ctx.globalAlpha = st.detFlashT;
      ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(t.x, t.y - 9, (1 - st.detFlashT) * 28 + 10, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    }
    /* instante de llegada escalonado (para la reconstrucción de dirección) */
    if (st.detDir && encendido) {
      ctx.save();
      ctx.fillStyle = 'rgba(205,238,255,0.8)'; ctx.font = '8px "Orbitron",monospace'; ctx.textAlign = 'center';
      const tLleg = Math.round((t.x - (st.detImpactoX || cx)) * 0.1);
      ctx.fillText('t' + (tLleg >= 0 ? '+' : '') + tLleg, t.x, t.y + 12);
      ctx.restore();
    }
  });

  /* telescopio de fluorescencia (a un lado del suelo) */
  const telX = margen - 34, telY = suelo;
  ctx.save();
  ctx.translate(telX, telY);
  ctx.fillStyle = st.detTeleOn ? 'rgba(179,136,255,0.85)' : 'rgba(179,136,255,0.35)';
  ctx.strokeStyle = 'rgba(179,136,255,0.8)'; ctx.lineWidth = 1.5;
  ctx.save();
  ctx.rotate(-0.5);
  ctx.beginPath();
  ctx.rect(-6, -30, 12, 30);
  ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = 'rgba(179,136,255,0.7)'; ctx.font = '9px "Exo 2",sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('🔭', 0, 12);
  ctx.restore();

  /* dirección reconstruida: flecha del rayo primario (entrada → impacto) */
  if (st.detDir) {
    const bx = st.detImpactoX || cx;
    const ax = bx - st.detAngulo * 40;   /* punto de entrada arriba */
    ctx.save();
    ctx.strokeStyle = '#ffd740'; ctx.fillStyle = '#ffd740'; ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ffd740'; ctx.shadowBlur = 8; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(ax, topY); ctx.lineTo(bx, suelo); ctx.stroke();
    ctx.setLineDash([]);
    /* punta */
    const ang = Math.atan2(suelo - topY, bx - ax);
    ctx.translate(bx, suelo); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-12, -6); ctx.lineTo(-12, 6); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = 'rgba(255,215,64,0.9)'; ctx.font = '10px "Exo 2",sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('dirección del rayo primario', cx, topY + 14);
    ctx.restore();
  }

  /* panel de datos en vivo */
  const d = document.getElementById('rc-det-datos');
  if (d) {
    const nHit = st.detHits ? Object.values(st.detHits).reduce((a,b)=>a+b,0) : 0;
    d.innerHTML =
      'Partículas detectadas: <b>' + st.detEnergia + '</b><br>' +
      'Tanques encendidos: <b>' + (st.detHits ? Object.keys(st.detHits).length : 0) + '/' + n + '</b>' +
      (st.detEnergiaVal ? '<br>Energía ≈ <b>' + st.detEnergiaVal.toFixed(1) + ' ×10¹⁸ eV</b>' : '');
  }
}
