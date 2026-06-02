/* ══════════════════════════════════════════
   js/home-sphere.js
   Átomo animado en la pantalla de inicio.
   - Núcleo con protones/neutrones
   - 3 órbitas elípticas inclinadas
   - Electrones que orbitan
   - Reacciona al cursor: acelera y brilla
   ══════════════════════════════════════════ */

(function initAtom() {
  const canvas = document.getElementById('sphere-canvas');
  const ctx    = canvas.getContext('2d');
  const W = 300, H = 300, CX = 150, CY = 150;

  let t     = 0;
  let hover = false;
  let mouseX = CX, mouseY = CY;

  /* ── Partículas del núcleo ── */
  const NUCLEONS = [];
  const N_COUNT  = 18;
  for (let i = 0; i < N_COUNT; i++) {
    const angle = (i / N_COUNT) * Math.PI * 2;
    const r     = (i % 3 === 0) ? 0 : (i < 9 ? 7 : 14);
    NUCLEONS.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      radius: 4 + Math.random() * 3,
      isProton: i % 2 === 0,
      phase: Math.random() * Math.PI * 2
    });
  }

  /* ── Órbitas y electrones ── */
  const ORBITS = [
    { a: 90, b: 28, angle: 0,           speed: 0.012, eColor: '#00e5ff', trailColor: 'rgba(0,229,255,' },
    { a: 80, b: 30, angle: Math.PI / 3, speed: 0.009, eColor: '#b47fff', trailColor: 'rgba(180,127,255,' },
    { a: 85, b: 25, angle: -Math.PI / 4,speed: 0.015, eColor: '#4fc3f7', trailColor: 'rgba(79,195,247,' },
  ];

  /* Posición angular de cada electrón */
  const eAngles = ORBITS.map((_, i) => (i / ORBITS.length) * Math.PI * 2);

  /* Trail de cada electrón */
  const TRAIL_LEN = 28;
  const trails = ORBITS.map(() => []);

  /* ── Helpers ── */
  function orbitPoint(orbit, theta) {
    /* Elipse rotada */
    const ex = orbit.a * Math.cos(theta);
    const ey = orbit.b * Math.sin(theta);
    const cosA = Math.cos(orbit.angle);
    const sinA = Math.sin(orbit.angle);
    return {
      x: CX + ex * cosA - ey * sinA,
      y: CY + ex * sinA + ey * cosA
    };
  }

  /* ── Dibujar órbita ── */
  function drawOrbit(orbit) {
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      const p = orbitPoint(orbit, theta);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = hover
      ? 'rgba(100,180,255,0.25)'
      : 'rgba(60,120,200,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /* ── Dibujar trail ── */
  function drawTrail(trail, trailColor) {
    for (let i = 1; i < trail.length; i++) {
      const alpha = (i / trail.length) * 0.55;
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.strokeStyle = trailColor + alpha + ')';
      ctx.lineWidth   = 1.5 * (i / trail.length);
      ctx.stroke();
    }
  }

  /* ── Dibujar electrón ── */
  function drawElectron(p, color, bright) {
    /* Halo exterior */
    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10);
    grd.addColorStop(0,   color.replace(')', ', 0.5)').replace('rgb', 'rgba'));
    grd.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    /* Núcleo del electrón */
    ctx.beginPath();
    ctx.arc(p.x, p.y, hover ? 4.5 : 3.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur  = hover ? 18 : 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  /* ── Dibujar núcleo ── */
  function drawNucleus() {
    /* Resplandor exterior */
    const aura = ctx.createRadialGradient(CX, CY, 0, CX, CY, 30);
    aura.addColorStop(0,   `rgba(255,180,80,${hover ? 0.5 : 0.32})`);
    aura.addColorStop(0.5, `rgba(180,80,255,${hover ? 0.22 : 0.12})`);
    aura.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(CX, CY, 30, 0, Math.PI * 2);
    ctx.fillStyle = aura;
    ctx.fill();

    /* Nucleones (protones = naranja, neutrones = azul) */
    NUCLEONS.forEach(n => {
      const wobble = Math.sin(t * 2 + n.phase) * 0.8;
      const nx = CX + n.x + wobble;
      const ny = CY + n.y + wobble;

      const color1 = n.isProton ? '#ff8c42' : '#4fc3f7';
      const color2 = n.isProton ? '#ff5500' : '#0090cc';

      const g = ctx.createRadialGradient(nx - n.radius * 0.3, ny - n.radius * 0.3, 0, nx, ny, n.radius);
      g.addColorStop(0, color1);
      g.addColorStop(1, color2);

      ctx.beginPath();
      ctx.arc(nx, ny, n.radius, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.shadowColor = n.isProton ? '#ff6600' : '#00aaff';
      ctx.shadowBlur  = hover ? 12 : 7;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  /* ── Loop ── */
  function frame() {
    const speed = hover ? 1.8 : 1.0;
    t += 0.016 * speed;

    ctx.clearRect(0, 0, W, H);

    /* Dibujar primero órbitas que están "detrás" */
    ORBITS.forEach(o => drawOrbit(o));

    /* Actualizar ángulos y trails */
    ORBITS.forEach((orbit, i) => {
      eAngles[i] += orbit.speed * speed;
      const p = orbitPoint(orbit, eAngles[i]);
      trails[i].push({ x: p.x, y: p.y });
      if (trails[i].length > TRAIL_LEN) trails[i].shift();
    });

    /* Trails */
    ORBITS.forEach((orbit, i) => drawTrail(trails[i], orbit.trailColor));

    /* Núcleo encima de trails */
    drawNucleus();

    /* Electrones encima de todo */
    ORBITS.forEach((orbit, i) => {
      const p = orbitPoint(orbit, eAngles[i]);
      drawElectron(p, orbit.eColor, hover);
    });

    requestAnimationFrame(frame);
  }

  /* ── Eventos ── */
  canvas.addEventListener('mousemove', e => {
    hover = true;
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
  });
  canvas.addEventListener('mouseleave', () => { hover = false; });

  /* Click: ráfaga — los electrones saltan de velocidad brevemente */
  canvas.addEventListener('click', () => {
    eAngles.forEach((_, i) => { eAngles[i] += Math.PI * 0.4; });
  });

  frame();
})();
