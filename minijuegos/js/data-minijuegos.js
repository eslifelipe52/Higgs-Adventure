/* ══════════════════════════════════════════
   minijuegos/js/data-minijuegos.js
   Definición de todas las secciones y
   minijuegos. Para agregar uno nuevo:
   1. Añade un objeto al array `juegos` de
      la sección correspondiente.
   2. Pon su asset en minijuegos/assets/
   3. Crea su archivo js/minijuego-NOMBRE.js

   Campos de cada juego:
     id        → identificador único (string)
     nombre    → título visible
     asset     → ruta relativa al asset (desde index.html)
     propKey   → clave de prop en detail.js que lo enlaza
                 (null si no se muestra en panel de partícula)
     desc      → descripción corta que aparece antes de JUGAR
     disponible → true = jugable, false = "próximamente"
   ══════════════════════════════════════════ */

const MINIJUEGOS_DATA = [

  /* ════════════════════════════════════
     FASE 1 — Sección Propiedades
     Desbloqueada desde el inicio.
     Minijuegos sobre las 4 propiedades
     fundamentales de las partículas.
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
        desc: 'Los quarks llevan una "carga de color": rojo, verde o azul. Para formar partículas estables (hadrones) los colores deben combinarse en blanco. ¡Arrastra los quarks y forma tríos o pares color-anticolor!',
        disponible: true
      },
      {
        id: 'carga-electrica',
        nombre: 'Carga Eléctrica',
        asset: 'minijuegos/assets/cargaelectrica.png',
        propKey: 'charge',
        desc: 'Las cargas eléctricas se atraen y repelen según su signo. En este minijuego deberás equilibrar las cargas de un sistema de partículas para lograr neutralidad eléctrica.',
        disponible: false
      },
      {
        id: 'spin',
        nombre: 'Espín',
        asset: 'minijuegos/assets/spin.png',
        propKey: 'spin',
        desc: 'El espín es el momento angular intrínseco de una partícula. Fermiones (espín 1/2) y bosones (espín entero) se comportan de forma muy distinta. ¡Clasifica las partículas por su espín y descubre el principio de exclusión de Pauli!',
        disponible: false
      },
      {
        id: 'masa',
        nombre: 'Masa',
        asset: 'minijuegos/assets/higgsfield.png',
        propKey: 'mass',
        desc: 'La masa de las partículas proviene de su interacción con el campo de Higgs. Ordena las partículas por masa y descubre cuáles interactúan más con este campo misterioso.',
        disponible: false
      }
    ]
  },

  /* ════════════════════════════════════
     FASE 2 — Sección Gen II y III
     Se desbloquea al completar Fase 1.
     Minijuegos sobre las generaciones
     pesadas de quarks y leptones.
     ════════════════════════════════════ */
  {
    id: 'generaciones',
    label: 'Sección Gen II y III',
    fase: 2,
    color: '#7c4dff',
    juegos: [
      {
        id: 'radiacion',
        nombre: 'Radiación',
        asset: 'minijuegos/assets/radiacion.png',
        propKey: null,
        desc: 'Las partículas inestables de las generaciones superiores se desintegran emitiendo radiación. Identifica el tipo de radiación (α, β, γ) producida en cada desintegración.',
        disponible: false
      },
      {
        id: 'desintegracion',
        nombre: 'Desintegración',
        asset: 'minijuegos/assets/desintegracion.png',
        propKey: null,
        desc: 'Los quarks pesados (charm, strange, top, bottom) se desintegran en quarks más ligeros. Construye la cadena de desintegración correcta antes de que se agote el tiempo.',
        disponible: false
      },
      {
        id: 'deteccion-muones',
        nombre: 'Detección de Muones',
        asset: 'minijuegos/assets/muon.png',
        propKey: null,
        desc: 'Los muones generados por rayos cósmicos atraviesan la atmósfera a velocidades relativistas. Simula un detector de partículas y atrapa los muones que llegan desde el espacio.',
        disponible: false
      },

    ]
  },

  /* ════════════════════════════════════
     FASE 3 — Sección Interacción de Campos
     Se desbloquea al completar Fase 2.
     Minijuegos sobre bosones mediadores
     y diagramas de Feynman.
     ════════════════════════════════════ */
  {
    id: 'interacciones',
    label: 'Sección Interacción de Campos',
    fase: 3,
    color: '#ff6d00',
    juegos: [
      {
        id: 'gluon',
        nombre: 'Gluón',
        asset: 'minijuegos/assets/gluon.png',
        propKey: 'fuerza',
        desc: 'El gluón es el mediador de la fuerza fuerte. En este minijuego, mantén los quarks confinados dentro del hadrón intercambiando gluones de los colores correctos.',
        disponible: false
      },
      {
        id: 'foton',
        nombre: 'Fotón',
        asset: 'minijuegos/assets/foton.png',
        propKey: null,
        desc: 'Construye diagramas de Feynman de QED: emisión de fotones, dispersión entre partículas cargadas, aniquilación e⁻e⁺ y creación de pares. 6 niveles progresivos con Modo Detective y Modo Desafío.',
        disponible: true
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
     Se desbloquea al completar Fase 3.
     Minijuegos sobre el bosón de Higgs
     y el campo de Higgs.
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
