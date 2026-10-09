/* ══════════════════════════════════════════
   minijuegos/js/data-minijuegos.js
   Definición de todas las secciones y
   minijuegos. Para agregar uno nuevo:
   1. Añade un objeto al array `juegos` de
      la sección correspondiente.
   2. Pon su asset en minijuegos/assets/
   3. Crea su archivo js/minijuego-NOMBRE.js
      con una función global iniciar_NOMBRE()
      (los guiones del id se vuelven guiones
      bajos: id 'rayos-cosmicos' → iniciar_rayos_cosmicos).

   Campos de cada juego:
     id        → identificador único (string).
                 DEBE coincidir con el nombre de la
                 función iniciar_<id> del minijuego.
     nombre    → título visible
     asset     → ruta relativa al asset (desde index.html)
     propKey   → clave de prop en detail.js que lo enlaza
                 (null si no se muestra en panel de partícula)
     desc      → descripción corta que aparece antes de JUGAR
     disponible → true = jugable, false = "próximamente"

   La sección `fase` (1–4) se corresponde con la
   etapa del proyecto y controla el desbloqueo
   progresivo (ver js/progreso.js).
   ══════════════════════════════════════════ */

const MINIJUEGOS_DATA = [

  /* ════════════════════════════════════
     FASE 1 — Sección Propiedades
     Etapa 1: Gen 1 de quarks y leptones.
     Minijuegos sobre las 4 propiedades
     fundamentales de las partículas.
     Desbloqueada desde el inicio.
     ════════════════════════════════════ */
  {
    id: 'propiedades',
    label: 'Sección Propiedades',
    fase: 1,
    color: '#00e5ff',
    juegos: [
      {
        id: 'carga-color',
        nombre: 'Carga de Color',
        asset: 'minijuegos/assets/cargacolor.png',
        propKey: 'color',
        desc: 'Los quarks llevan una "carga de color": rojo, verde o azul. Para formar partículas estables (hadrones) los colores deben combinarse en blanco. ¡Arrastra los quarks y forma tríos o pares color-anticolor! 9 niveles + Modo Libre puntuado.',
        disponible: true
      },
      {
        id: 'carga-electrica',
        nombre: 'Carga Eléctrica',
        asset: 'minijuegos/assets/cargaelectrica.png',
        propKey: 'charge',
        desc: 'La carga como etiqueta de comportamiento. Etapa 1: fuerzas de atracción y repulsión, el cable mágico y el generador de ondas. Etapa 2: electrodinámica cuántica (fotón virtual, onda y fotón, familias). Etapa 3: el enjambre electromagnético.',
        disponible: true
      },
      {
        id: 'spin',
        nombre: 'Espín',
        asset: 'minijuegos/assets/spin.png',
        propKey: 'spin',
        desc: 'El espín es el momento angular intrínseco de las partículas. Etapa 1: la brújula cuántica, el experimento de Stern-Gerlach, el principio de exclusión de Pauli y el momento magnético. Después: la familia del espín 1/2, helicidad y el espín de los bosones gauge.',
        disponible: true
      },
      {
        id: 'masa',
        nombre: 'Masa',
        asset: 'minijuegos/assets/masa.png',
        propKey: 'mass',
        desc: 'Etapa 1: calcula la fuerza necesaria para mover cada objeto (F = m·2d/t²) y descubre qué es la inercia. Etapa 2: inyecta energía en un acelerador y observa cómo evoluciona E² = (mc²)² + (pc)². Etapa 3: resuelve el puzle de decaimiento energético.',
        disponible: true
      }
    ]
  },

  /* ════════════════════════════════════
     FASE 2 — Sección Gen II y III
     Etapa 2: generaciones 2 y 3 de quarks
     y leptones, y sus fenómenos propios.
     ════════════════════════════════════ */
  {
    id: 'generaciones',
    label: 'Sección Gen II y III',
    fase: 2,
    color: '#7c4dff',
    juegos: [
      {
        id: 'decaimiento',
        nombre: 'Decaimiento',
        asset: 'minijuegos/assets/desintegracion.png',
        propKey: null,
        desc: 'Las partículas inestables de las generaciones superiores se desintegran en otras más ligeras. Repasa las leyes de conservación, elige el canal de decaimiento correcto, distingue un espectro continuo de uno monoenergético y ordena las partículas por vida media.',
        disponible: true
      },
      {
        id: 'rayos-cosmicos',
        nombre: 'Rayos Cósmicos',
        asset: 'minijuegos/assets/muon.png',
        propKey: null,
        desc: 'Un protón cósmico choca con la atmósfera y desata una cascada de partículas secundarias. Sigue el primer impacto hadrónico, la cascada electromagnética, la componente muónica (con dilatación temporal) y los neutrinos que escapan, y opera tu propio detector.',
        disponible: true
      }
    ]
  },

  /* ════════════════════════════════════
     FASE 3 — Sección Interacción de Campos
     Etapa 3: bosones gauge y diagramas
     de Feynman.
     ════════════════════════════════════ */
  {
    id: 'interacciones',
    label: 'Sección Interacción de Campos',
    fase: 3,
    color: '#ff6d00',
    juegos: [
      {
        id: 'foton',
        nombre: 'Fotón',
        asset: 'minijuegos/assets/foton.png',
        propKey: null,
        desc: 'Construye diagramas de Feynman de QED: emisión de fotones, dispersión entre partículas cargadas, aniquilación e⁻e⁺ y creación de pares. 6 niveles progresivos con Modo Detective y Modo Desafío.',
        disponible: true
      },
      {
        id: 'gluon',
        nombre: 'Gluón',
        asset: 'minijuegos/assets/gluon.png',
        propKey: 'fuerza',
        desc: 'El gluón es el mediador de la fuerza fuerte. En este minijuego, mantén los quarks confinados dentro del hadrón intercambiando gluones de los colores correctos.',
        disponible: false
      },
      {
        id: 'boson-z',
        nombre: 'Bosón Z',
        asset: 'minijuegos/assets/z.png',
        propKey: null,
        desc: 'El bosón Z media corrientes neutras débiles. Completa los diagramas de dispersión neutrino-electrón intercambiando bosones Z en los vértices correctos.',
        disponible: false
      },
      {
        id: 'bosones-w',
        nombre: 'Bosones W±',
        asset: 'minijuegos/assets/w.png',
        propKey: null,
        desc: 'Los bosones W± cambian el sabor de los quarks. Reconstruye el proceso de desintegración beta usando el diagrama de Feynman correcto con bosones W.',
        disponible: false
      }
    ]
  },

  /* ════════════════════════════════════
     FASE 4 — Sección Higgs
     Etapa 4: bosón de Higgs y campo
     de Higgs.
     ════════════════════════════════════ */
  {
    id: 'higgs-juegos',
    label: 'Sección Higgs',
    fase: 4,
    color: '#ffd740',
    juegos: [
      {
        id: 'campo-higgs',
        nombre: 'Campo de Higgs',
        asset: 'minijuegos/assets/higgsfield.png',
        propKey: null,
        desc: 'El campo de Higgs permea todo el espacio. Las partículas que más interactúan con él adquieren más masa. Arrastra partículas a través del campo y observa cómo se "frenan" según su masa.',
        disponible: false
      },
      {
        id: 'diagramas-higgs',
        nombre: 'Diagramas de Feynman',
        asset: 'minijuegos/assets/higgs.png',
        propKey: null,
        desc: 'Construye los diagramas de Feynman de producción del bosón de Higgs en el LHC: fusión de gluones, fusión de bosones vectoriales y producción asociada.',
        disponible: false
      }
    ]
  }

];

/* Auxiliar: todos los juegos en una sola lista plana */
const MINIJUEGOS_TODOS = MINIJUEGOS_DATA.reduce((acc, s) => acc.concat(s.juegos), []);
