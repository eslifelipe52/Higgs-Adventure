/* ══════════════════════════════════════════
   js/progreso.js
   FUENTE ÚNICA DE VERDAD para:
     · el progreso del jugador (módulos superados)
     · el desbloqueo progresivo de etapas (0–4)
     · los logros y el historial de partidas

   Debe cargarse ANTES que navigation.js,
   modelo-estandar.js, perfil.js y todos los
   minijuegos, porque ellos consultan este API.

   ── API pública ─────────────────────────────
     Progreso.moduloCompletado(id, clave)
         Un minijuego avisa que superó un módulo.
     Progreso.registrarPartida(id, datos)
         Guarda una partida puntuada en el historial.
     Progreso.superado(id)            → bool
     Progreso.modulosCompletados(id)  → nº de módulos
     Progreso.etapaDesbloqueada(n)    → bool
     Progreso.etapaMaxima()           → nº de etapa
     Progreso.particulaBloqueada(p, tipo)
     Progreso.etapaDeParticula(p, tipo)
     Progreso.historial(id?)          → array
     Progreso.mejorPuntaje(id)        → entrada | null
     Progreso.logroDe(id, pts)        → {nombre,emoji,color,min}
     Progreso.requisitosEtapa(n)      → {faltan:[...], total, hechos}
     Progreso.reiniciar()             → borra todo el progreso
     Progreso.avisar(msgTexto)        → banner no bloqueante
   ══════════════════════════════════════════ */

const Progreso = (function () {

  /* ════════════════════════════════════════
     1. CONFIGURACIÓN DE ETAPAS
     Refleja la estructura del proyecto:
       Etapa 0 · Introducción interactiva
       Etapa 1 · Generación 1 de quarks y leptones
       Etapa 2 · Generaciones 2 y 3
       Etapa 3 · Bosones gauge
       Etapa 4 · Bosón de Higgs

     Regla: para desbloquear la etapa N hay que
     superar TODOS los minijuegos de la etapa N-1
     que estén disponibles.
     ════════════════════════════════════════ */
  const ETAPAS = {
    0: { nombre: 'Introducción interactiva',
         detalle: 'Átomo, mecánica cuántica y historia',
         minijuegos: [] },
    1: { nombre: 'Generación 1',
         detalle: 'Quarks y leptones de primera generación',
         minijuegos: ['carga-color', 'carga-electrica', 'spin', 'masa'] },
    2: { nombre: 'Generaciones 2 y 3',
         detalle: 'Quarks y leptones pesados, decaimientos',
         minijuegos: ['decaimiento', 'rayos-cosmicos'] },
    3: { nombre: 'Bosones gauge',
         detalle: 'Interacciones y diagramas de Feynman',
         minijuegos: ['foton'] },
    4: { nombre: 'Bosón de Higgs',
         detalle: 'Historia, propiedades y mecanismo de Higgs',
         minijuegos: [] }
  };

  /* Nº de módulos que hay que superar en cada minijuego
     para considerarlo "niveles básicos completados".
     Ajusta estos números para cambiar la exigencia. */
  const MODULOS_REQUERIDOS = {
    'carga-color':     3,
    'carga-electrica': 3,   /* Etapa 1 · Electromagnetismo clásico */
    'spin':            4,   /* Etapa 1 · El espín de los fermiones   */
    'masa':            3,   /* Etapa 1 · Calcula la fuerza           */
    'decaimiento':     3,   /* Módulos A, B y C                      */
    'rayos-cosmicos':  4,   /* Primer impacto, EM, muones, neutrinos */
    'foton':           3,   /* Niveles 1–3 de QED                    */
    'gluon':           1,
    'boson-z':         1,
    'bosones-w':       1,
    'campo-higgs':     1,
    'diagramas-higgs': 1
  };

  /* ════════════════════════════════════════
     2. LOGROS (medallas)
     ════════════════════════════════════════ */
  const MEDALLAS = {
    Diamante: { emoji: '💎', color: '#b9f2ff' },
    Oro:      { emoji: '🥇', color: '#ffd740' },
    Plata:    { emoji: '🥈', color: '#c0c0c0' },
    Bronce:   { emoji: '🥉', color: '#cd7f32' }
  };

  /* Umbrales propios de cada minijuego (los que ya usaban
     internamente carga-color y fotón). El resto usa el genérico. */
  const UMBRALES = {
    'carga-color': { Diamante: 3500, Oro: 2500, Plata: 1500, Bronce: 0 },
    'foton':       { Diamante: 800,  Oro: 500,  Plata: 250,  Bronce: 0 },
    '_default':    { Diamante: 300,  Oro: 200,  Plata: 100,  Bronce: 0 }
  };

  const ORDEN_MEDALLAS = ['Diamante', 'Oro', 'Plata', 'Bronce'];

  /* ════════════════════════════════════════
     3. ESTADO PERSISTENTE
     ════════════════════════════════════════ */
  const CLAVE = 'higgs_progreso';

  function _estadoVacio() {
    return { version: 1, modulos: {}, superados: {}, historial: [], etapaNotificada: 1 };
  }

  let _e = _cargar();

  function _cargar() {
    try {
      const raw = localStorage.getItem(CLAVE);
      if (!raw) return _migrar();
      const obj = JSON.parse(raw);
      const base = _estadoVacio();
      /* saneado: nos quedamos solo con claves conocidas */
      return {
        version: 1,
        modulos:   obj.modulos   && typeof obj.modulos   === 'object' ? obj.modulos   : base.modulos,
        superados: obj.superados && typeof obj.superados === 'object' ? obj.superados : base.superados,
        historial: Array.isArray(obj.historial) ? obj.historial : base.historial,
        etapaNotificada: typeof obj.etapaNotificada === 'number' ? obj.etapaNotificada : 1
      };
    } catch (err) {
      return _estadoVacio();
    }
  }

  function _guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(_e)); } catch (err) { /* modo privado */ }
  }

  /* Avisa a la interfaz (perfil, nav, banner del ME) de que
     el progreso cambió. Se usan guardas porque este archivo
     se carga antes que navigation.js y perfil.js. */
  function _refrescarUI() {
    if (typeof actualizarPerfil     === 'function') actualizarPerfil();
    if (typeof refrescarUIProgreso  === 'function') refrescarUIProgreso();
  }

  /* Migración desde las claves antiguas por minijuego
     (cc_historial de carga-color, fy_historial de fotón). */
  function _migrar() {
    const e = _estadoVacio();
    const viejas = [
      { clave: 'cc_historial', juego: 'carga-color' },
      { clave: 'fy_historial', juego: 'foton' }
    ];
    viejas.forEach(v => {
      let arr = null;
      try { arr = JSON.parse(localStorage.getItem(v.clave) || 'null'); } catch (err) { arr = null; }
      if (!Array.isArray(arr) || !arr.length) return;
      arr.forEach(x => e.historial.push({ juego: v.juego, fecha: x.fecha, puntaje: x.puntaje, combos: x.combos, errores: x.errores, logro: x.logro }));
      /* quien ya jugó tiene por lo menos un módulo hecho */
      e.modulos[v.juego] = { 'migrado': true };
    });
    /* superados derivados de la migración */
    Object.keys(e.modulos).forEach(id => { if (_cuentaModulos(e, id) >= _requeridos(id)) e.superados[id] = true; });
    try { localStorage.setItem(CLAVE, JSON.stringify(e)); } catch (err) {}
    return e;
  }

  /* ════════════════════════════════════════
     4. CONSULTAS DE PROGRESO
     ════════════════════════════════════════ */
  function _requeridos(id) {
    return MODULOS_REQUERIDOS[id] || 1;
  }

  function _cuentaModulos(estado, id) {
    const m = estado.modulos[id];
    return m ? Object.keys(m).length : 0;
  }

  function modulosCompletados(id) { return _cuentaModulos(_e, id); }

  function superado(id) {
    if (_e.superados[id]) return true;
    return _cuentaModulos(_e, id) >= _requeridos(id);
  }

  /* ¿Está desbloqueada la etapa n? La 0 y la 1 siempre lo están. */
  function etapaDesbloqueada(n) {
    if (n <= 1) return true;
    const prev = ETAPAS[n - 1];
    if (!prev) return true;
    return prev.minijuegos.every(id => superado(id));
  }

  /* Etapa más alta alcanzada */
  function etapaMaxima() {
    let max = 1;
    for (let n = 2; n <= 4; n++) if (etapaDesbloqueada(n)) max = n;
    return max;
  }

  /* Detalle de lo que falta para abrir la etapa n */
  function requisitosEtapa(n) {
    const prev = ETAPAS[n - 1];
    if (!prev || n <= 1) return { etapa: n, juegos: [], hechos: 0, total: 0, faltan: [] };
    const juegos = prev.minijuegos.map(id => ({
      id, hechos: modulosCompletados(id), requeridos: _requeridos(id), superado: superado(id)
    }));
    const faltan = juegos.filter(j => !j.superado);
    return { etapa: n - 1, origen: prev, juegos, hechos: juegos.length - faltan.length, total: juegos.length, faltan };
  }

  /* ¿Está bloqueada esta partícula según su etapa? */
  function etapaDeParticula(p, tipo) {
    if (tipo === 'higgs-cell' || tipo === 'higgs') return 4;
    if (tipo === 'boson') return 3;
    if (tipo === 'quark' || tipo === 'lepton') return (p && p.gen >= 2) ? 2 : 1;
    return 1;
  }

  function particulaBloqueada(p, tipo) {
    return !etapaDesbloqueada(etapaDeParticula(p, tipo));
  }

  /* ════════════════════════════════════════
     5. REGISTRO DE AVANCE
     ════════════════════════════════════════ */
  function moduloCompletado(id, clave) {
    if (!id) return;
    if (!_e.modulos[id]) _e.modulos[id] = {};
    const claveFinal = clave == null ? ('mod' + (Object.keys(_e.modulos[id]).length + 1)) : String(clave);
    const yaEstaba = !!_e.modulos[id][claveFinal];
    _e.modulos[id][claveFinal] = true;

    let recienSuperado = false;
    if (!_e.superados[id] && _cuentaModulos(_e, id) >= _requeridos(id)) {
      _e.superados[id] = true;
      recienSuperado = true;
    }

    /* ¿Se abrió una etapa nueva? */
    const antes = _e.etapaNotificada;
    const ahora = etapaMaxima();
    _guardar();

    if (!yaEstaba && typeof actualizarPerfil === 'function') _refrescarUI();
    if (recienSuperado) avisar(`✅ ¡Minijuego superado! ${_nombreJuego(id)}`);
    if (ahora > antes) {
      _e.etapaNotificada = ahora;
      _guardar();
      setTimeout(() => avisar(`🔓 ¡Etapa ${ahora} desbloqueada: ${ETAPAS[ahora].nombre}!`), 1200);
    }
    return recienSuperado;
  }

  function registrarPartida(id, datos) {
    if (!id) return null;
    datos = datos || {};
    const pts = Number(datos.puntaje) || 0;
    const logro = logroDe(id, pts);
    const entrada = {
      juego:   id,
      fecha:   new Date().toLocaleDateString('es-MX'),
      puntaje: pts,
      combos:  Number(datos.combos)  || 0,
      errores: Number(datos.errores) || 0,
      logro:   logro.nombre
    };
    _e.historial.unshift(entrada);
    if (_e.historial.length > 40) _e.historial.length = 40;
    _guardar();
    _refrescarUI();
    return entrada;
  }

  /* Historial completo o filtrado por minijuego */
  function historial(id) {
    return id ? _e.historial.filter(h => h.juego === id) : _e.historial.slice();
  }

  function mejorPuntaje(id) {
    const h = historial(id);
    if (!h.length) return null;
    return h.reduce((best, x) => x.puntaje > best.puntaje ? x : best, h[0]);
  }

  function logroDe(id, pts) {
    const u = UMBRALES[id] || UMBRALES._default;
    const nombre = ORDEN_MEDALLAS.find(n => pts >= u[n]) || 'Bronce';
    return { nombre, min: u[nombre], ...MEDALLAS[nombre] };
  }

  /* Minijuegos con al menos una partida o módulo registrado */
  function juegosTocados() {
    const set = {};
    Object.keys(_e.modulos).forEach(id => { set[id] = true; });
    _e.historial.forEach(h => { set[h.juego] = true; });
    return Object.keys(set);
  }

  function reiniciar() {
    _e = _estadoVacio();
    try { localStorage.removeItem(CLAVE); } catch (err) {}
    _guardar();
    _refrescarUI();
  }

  /* ════════════════════════════════════════
     6. AVISOS NO BLOQUEANTES
     ════════════════════════════════════════ */
  let _avisoTimer = null;
  function avisar(texto) {
    let el = document.getElementById('progreso-aviso');
    if (!el) {
      el = document.createElement('div');
      el.id = 'progreso-aviso';
      el.className = 'progreso-aviso';
      document.body.appendChild(el);
    }
    el.textContent = texto;
    el.classList.add('visible');
    if (_avisoTimer) clearTimeout(_avisoTimer);
    _avisoTimer = setTimeout(() => el.classList.remove('visible'), 3600);
  }

  /* ════════════════════════════════════════
     7. AUXILIARES
     ════════════════════════════════════════ */
  function _nombreJuego(id) {
    try {
      for (const s of MINIJUEGOS_DATA) {
        const j = s.juegos.find(x => x.id === id);
        if (j) return j.nombre;
      }
    } catch (err) {}
    return id;
  }

  /* Etiqueta corta del tipo de etapa de cada juego (para el perfil) */
  function nombreEtapa(n) { return ETAPAS[n] ? ETAPAS[n].nombre : ('Etapa ' + n); }

  return {
    ETAPAS, MEDALLAS, MODULOS_REQUERIDOS,
    moduloCompletado, registrarPartida,
    modulosCompletados, superado, juegosTocados,
    etapaDesbloqueada, etapaMaxima, requisitosEtapa, nombreEtapa,
    etapaDeParticula, particulaBloqueada,
    historial, mejorPuntaje, logroDe,
    reiniciar, avisar
  };
})();
