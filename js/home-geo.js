/* ══════════════════════════════════════════
   js/home-geo.js
   Polígonos flotantes de fondo en la pantalla
   de inicio. Se repelen del cursor del usuario.
   ══════════════════════════════════════════ */

(function initGeo() {
  const canvas = document.getElementById('geo-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H;
  const mouse  = { x: -999, y: -999 };

  /* Paleta azul-morado coherente con el tema */
  const COLORS = [
    'rgba(79,195,247,',   /* sky blue */
    'rgba(124,77,255,',   /* purple */
    'rgba(100,120,255,',  /* indigo */
    'rgba(180,127,255,',  /* lavender */
    'rgba(56,182,255,'    /* cyan */
  ];

  const SHAPES = [];
  const NUM    = 32;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function randomPoly(cx, cy) {
    const sides      = Math.random() < 0.5 ? 3 : (Math.random() < 0.5 ? 4 : 6);
    const r          = 14 + Math.random() * 28;
    const color      = COLORS[Math.floor(Math.random() * COLORS.length)];
    const alpha      = 0.03 + Math.random() * 0.07;
    const strokeAlpha= 0.10 + Math.random() * 0.18;
    const speed      = { x: (Math.random() - 0.5) * 0.35, y: (Math.random() - 0.5) * 0.35 };
    const rotSpeed   = (Math.random() - 0.5) * 0.007;
    return {
      x: cx, y: cy, sides, r,
      color, alpha, strokeAlpha,
      rot: Math.random() * Math.PI * 2,
      speed, rotSpeed, baseR: r
    };
  }

  function init() {
    SHAPES.length = 0;
    for (let i = 0; i < NUM; i++) {
      SHAPES.push(randomPoly(Math.random() * W, Math.random() * H));
    }
  }

  function drawPoly(s, opacity) {
    ctx.beginPath();
    for (let i = 0; i < s.sides; i++) {
      const angle = s.rot + (i / s.sides) * Math.PI * 2;
      const x = s.x + s.r * Math.cos(angle);
      const y = s.y + s.r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle   = s.color + (s.alpha * opacity) + ')';
    ctx.fill();
    ctx.strokeStyle = s.color + (s.strokeAlpha * opacity) + ')';
    ctx.lineWidth   = 0.7;
    ctx.stroke();
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    const INF = 160;

    SHAPES.forEach(s => {
      /* Movimiento autónomo */
      s.x   += s.speed.x;
      s.y   += s.speed.y;
      s.rot += s.rotSpeed;
      if (s.x < -60)    s.x = W + 60;
      if (s.x > W + 60) s.x = -60;
      if (s.y < -60)    s.y = H + 60;
      if (s.y > H + 60) s.y = -60;

      /* Repulsión del cursor */
      const dx   = s.x - mouse.x;
      const dy   = s.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let opacity = 1;

      if (dist < INF) {
        const f = (INF - dist) / INF;
        s.x    += (dx / dist) * f * 1.2;
        s.y    += (dy / dist) * f * 1.2;
        s.r     = lerp(s.r, s.baseR * (1 + f * 0.5), 0.08);
        opacity = 0.5 + f * 0.5;
      } else {
        s.r = lerp(s.r, s.baseR, 0.04);
      }

      drawPoly(s, opacity);

      /* Línea de conexión con el cursor cuando está cerca */
      if (dist < INF * 1.4) {
        const la = (1 - dist / (INF * 1.4)) * 0.09;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = s.color + la + ')';
        ctx.lineWidth   = 0.4;
        ctx.stroke();
      }
    });

    requestAnimationFrame(animate);
  }

  /* ── Eventos ── */
  window.addEventListener('resize', () => { resize(); init(); });

  document.getElementById('screen-home').addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  document.getElementById('screen-home').addEventListener('mouseleave', () => {
    mouse.x = -999; mouse.y = -999;
  });

  resize();
  init();
  animate();
})();
