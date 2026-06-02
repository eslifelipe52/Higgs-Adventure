/* ══════════════════════════════════════════
   js/data.js
   Datos de partículas del Modelo Estándar,
   textos de propiedades y pasos de introducción.
   ══════════════════════════════════════════ */

const PARTICLES = {
  quarks: [
    { sym:'u', name:'Up', mass:'2.2 MeV', charge:'+2/3', spin:'1/2', gen:1, desc:'El quark up es uno de los quarks más ligeros y fundamentales. Junto con el quark down forma los protones y neutrones del núcleo atómico. Dos quarks up y un quark down combinados con gluones forman un protón (uud).', props:{ charge:'+2/3 e', spin:'1/2 ℏ', mass:'2.2 MeV/c²', color:'R, G o B' } },
    { sym:'d', name:'Down', mass:'4.7 MeV', charge:'−1/3', spin:'1/2', gen:1, desc:'El quark down compone junto al quark up los hadrones más estables del universo. Dos quarks up y uno down forman un protón; uno up y dos down forman un neutrón (udd).', props:{ charge:'−1/3 e', spin:'1/2 ℏ', mass:'4.7 MeV/c²', color:'R, G o B' } },
    { sym:'c', name:'Charm', mass:'1.28 GeV', charge:'+2/3', spin:'1/2', gen:2, desc:'El quark charm fue predicho teóricamente en 1964 y descubierto en 1974 (partícula J/ψ), en la "Revolución de Noviembre" de la física de partículas.', props:{ charge:'+2/3 e', spin:'1/2 ℏ', mass:'1.28 GeV/c²', color:'R, G o B' } },
    { sym:'s', name:'Strange', mass:'96 MeV', charge:'−1/3', spin:'1/2', gen:2, desc:'El quark strange fue el primero en revelar que existía una "extrañeza" conservada en algunas interacciones. Aparece en los kaones detectados en rayos cósmicos.', props:{ charge:'−1/3 e', spin:'1/2 ℏ', mass:'96 MeV/c²', color:'R, G o B' } },
    { sym:'t', name:'Top', mass:'173 GeV', charge:'+2/3', spin:'1/2', gen:3, desc:'El quark top es el más masivo de todos, comparable a un átomo de oro. Se desintegra tan rápido que nunca forma hadrones. Descubierto en 1995 en el Fermilab.', props:{ charge:'+2/3 e', spin:'1/2 ℏ', mass:'173 GeV/c²', color:'R, G o B' } },
    { sym:'b', name:'Bottom', mass:'4.18 GeV', charge:'−1/3', spin:'1/2', gen:3, desc:'El quark bottom fue descubierto en 1977 en el Fermilab. Forma los mesones B, laboratorios naturales para estudiar la violación de la simetría CP.', props:{ charge:'−1/3 e', spin:'1/2 ℏ', mass:'4.18 GeV/c²', color:'R, G o B' } }
  ],
  leptons: [
    { sym:'e⁻', name:'Electrón', mass:'0.511 MeV', charge:'−1', spin:'1/2', gen:1, desc:'El electrón fue descubierto por J.J. Thomson en 1897. Los electrones son responsables de los enlaces químicos, la electricidad y la luz emitida por los átomos.', props:{ charge:'−1 e', spin:'1/2 ℏ', mass:'0.511 MeV/c²', color:'Ninguna' } },
    { sym:'νₑ', name:'Neutrino e', mass:'< 2 eV', charge:'0', spin:'1/2', gen:1, desc:'El neutrino electrónico raramente interactúa con la materia. Billones atraviesan tu cuerpo cada segundo. Fue predicho por Pauli en 1930 y detectado en 1956.', props:{ charge:'0', spin:'1/2 ℏ', mass:'< 2 eV/c²', color:'Ninguna' } },
    { sym:'μ⁻', name:'Muón', mass:'105.7 MeV', charge:'−1', spin:'1/2', gen:2, desc:'El muón es como un electrón 207 veces más masivo. Se produce en la atmósfera por rayos cósmicos. Su existencia desconcertó a I.I. Rabi: "¿Quién ordenó eso?"', props:{ charge:'−1 e', spin:'1/2 ℏ', mass:'105.7 MeV/c²', color:'Ninguna' } },
    { sym:'νμ', name:'Neutrino μ', mass:'< 0.17 MeV', charge:'0', spin:'1/2', gen:2, desc:'El neutrino muónico se asocia al muón. Las oscilaciones de neutrinos demostraron que sí tienen masa, algo no previsto en el ME original.', props:{ charge:'0', spin:'1/2 ℏ', mass:'< 0.17 MeV/c²', color:'Ninguna' } },
    { sym:'τ⁻', name:'Tau', mass:'1777 MeV', charge:'−1', spin:'1/2', gen:3, desc:'El leptón tau tiene una vida media de 2.9 × 10⁻¹³ s. Descubierto por Martin Perl en 1975, lo que le valió el Nobel de 1995.', props:{ charge:'−1 e', spin:'1/2 ℏ', mass:'1777 MeV/c²', color:'Ninguna' } },
    { sym:'ντ', name:'Neutrino τ', mass:'< 18.2 MeV', charge:'0', spin:'1/2', gen:3, desc:'El neutrino tauónico completa la tercera generación. Fue detectado por el experimento DONUT (Fermilab) en el año 2000.', props:{ charge:'0', spin:'1/2 ℏ', mass:'< 18.2 MeV/c²', color:'Ninguna' } }
  ],
  bosons: [
    { sym:'γ', name:'Fotón', mass:'0', charge:'0', spin:'1', desc:'El fotón media el electromagnetismo. Sin masa, viaja a 299,792,458 m/s. Es la partícula de toda la radiación electromagnética: luz, rayos X, radio...', props:{ charge:'0', spin:'1 ℏ', mass:'0', fuerza:'Electromagnética' } },
    { sym:'g', name:'Gluón', mass:'0', charge:'0', spin:'1', desc:'El gluón media la fuerza fuerte (QCD). Lleva carga de color, por lo que los gluones también interactúan entre sí. Existen 8 tipos distintos.', props:{ charge:'0', spin:'1 ℏ', mass:'0', fuerza:'Fuerza fuerte (QCD)' } },
    { sym:'Z⁰', name:'Bosón Z', mass:'91.2 GeV', charge:'0', spin:'1', desc:'El bosón Z media la corriente neutral débil. Predicho por Glashow, Salam y Weinberg (Nobel 1979) y descubierto en el CERN en 1983.', props:{ charge:'0', spin:'1 ℏ', mass:'91.2 GeV/c²', fuerza:'Fuerza débil' } },
    { sym:'W±', name:'Bosón W', mass:'80.4 GeV', charge:'±1', spin:'1', desc:'Los bosones W± median la corriente cargada débil. Fundamentales para la fusión nuclear y la desintegración beta. Su gran masa explica el corto alcance de la fuerza débil.', props:{ charge:'±1 e', spin:'1 ℏ', mass:'80.4 GeV/c²', fuerza:'Fuerza débil' } }
  ],
  higgs: {
    sym:'H⁰', name:'Bosón de Higgs', mass:'125.1 GeV', charge:'0', spin:'0',
    desc:'El bosón de Higgs fue postulado en 1964 por Peter Higgs y descubierto el 4 de julio de 2012 en el LHC del CERN (Nobel 2013). Es la excitación del campo de Higgs, que otorga masa a las partículas fundamentales.',
    props:{ charge:'0', spin:'0', mass:'125.1 GeV/c²', tipo:'Bosón escalar' }
  }
};

const PROP_INFO = {
  charge: { title:'Carga Eléctrica', text:'La carga eléctrica determina la intensidad con la que una partícula interactúa con el campo electromagnético. Las cargas del mismo signo se repelen; las opuestas se atraen (ley de Coulomb). En el Modelo Estándar, los quarks tienen cargas fraccionarias (+2/3 ó −1/3), mientras que los leptones cargados tienen carga entera (−1). Los protones y neutrones tienen carga entera o nula porque sus quarks se combinan de forma que las fracciones suman valores enteros.' },
  spin: { title:'Espín (Momento Angular Intrínseco)', text:'El espín es una propiedad cuántica intrínseca de las partículas, sin análogo clásico directo. Las partículas con espín semientero (1/2, 3/2...) son <strong>fermiones</strong> y obedecen el Principio de Exclusión de Pauli: dos fermiones no pueden ocupar el mismo estado cuántico. Las partículas con espín entero (0, 1, 2...) son <strong>bosones</strong> y pueden compartir estados cuánticos, lo que explica el láser y los condensados de Bose-Einstein.' },
  mass: { title:'Masa (Mecanismo de Higgs)', text:'La masa de una partícula elemental está relacionada con su energía en reposo (E = mc²). En el Modelo Estándar, las masas de los quarks, leptones y bosones W/Z se originan por su interacción con el campo de Higgs: partículas que se acoplan más fuertemente a este campo tienen mayor masa. El fotón y el gluón no interactúan con el campo de Higgs, por lo que tienen masa cero y viajan a la velocidad de la luz.' },
  color: { title:'Carga de Color (Cromodinámica Cuántica)', text:'La carga de color es la carga de la fuerza nuclear fuerte, con tres variedades: <strong>rojo, verde y azul</strong> (y sus anticolores). Los quarks llevan una carga de color; los gluones llevan combinaciones de color-anticolor. Los hadrones observables son siempre "blancos": los bariones combinan tres quarks de colores distintos (RGB), y los mesones combinan un quark con su antiquark de anticolor. Este confinamiento explica por qué nunca observamos quarks aislados.' },
  fuerza: { title:'Bosones Mediadores de Fuerzas', text:'Los bosones de gauge son los portadores de las fuerzas fundamentales. <strong>El fotón (γ)</strong> media el electromagnetismo. <strong>Los gluones (g)</strong> median la fuerza fuerte entre quarks. <strong>Los bosones W± y Z⁰</strong> median la fuerza débil responsable de la desintegración beta y la fusión nuclear. La gravedad no está incorporada en el ME: su bosón hipotético, el gravitón, aún no ha sido detectado.' },
  tipo: { title:'Bosón Escalar (Espín 0)', text:'El bosón de Higgs es el único bosón escalar (espín 0) del Modelo Estándar. A diferencia de los bosones de gauge (espín 1) que median fuerzas, el Higgs es una excitación del campo de Higgs, un campo escalar que permea todo el espacio. La interacción de las partículas con este campo genera sus masas. Su descubrimiento en 2012 completó el ME y confirmó el mecanismo de ruptura espontánea de la simetría electrodébil.' }
};

/* ════════════════════════════════════════════════════════
   PASOS DE INTRODUCCIÓN
   Campos:
     img       → ruta relativa assets/
     anim      → 'float' | 'pulse' | 'spin-slow' | 'glow-pulse'
     clickable → true = clic avanza al siguiente paso
     level     → etiqueta de escala
     title     → título del paso
     desc      → texto HTML (acepta <strong>)
     list      → (opcional) array de strings para lista con viñetas
     hint      → texto parpadeante si clickable=true
     last      → true en el último paso
   ════════════════════════════════════════════════════════ */
const INTRO_STEPS = [
  {
    img: 'assets/manzana.png', anim: 'float', clickable: true,
    level: 'Escala macroscópica — ~10 cm',
    title: 'El mundo que conocemos',
    desc: 'Todo en tu vida cotidiana está hecho de materia: esta manzana, tu cuerpo, el agua, el aire. Pero si pudieras ampliarla infinitamente, ¿qué encontrarías en su interior? Los griegos ya se preguntaban si la materia podía dividirse indefinidamente. <strong>Haz clic en la manzana para explorar su interior.</strong>',
    hint: '← Haz clic en la manzana'
  },
  {
    img: 'assets/celula.png', anim: 'pulse', clickable: false,
    level: 'Escala celular — ~10⁻⁵ m',
    title: 'Células: los bloques de la vida',
    desc: 'Al ampliar la manzana vemos sus <strong>células vegetales</strong>: membrana celular, cloroplastos y núcleo con ADN. Esta es la escala de la biología. Schleiden y Schwann establecieron la Teoría Celular en 1839. Pero las células están hechas de moléculas... ¿y las moléculas de qué están hechas?'
  },
  {
    img: 'assets/molecula.png', anim: 'spin-slow', clickable: false,
    level: 'Escala molecular — ~10⁻⁹ m',
    title: 'Moléculas y átomos',
    desc: 'Las moléculas son grupos de <strong>átomos</strong> enlazados. Demócrito (~400 a.C.) ya proponía el átomo como unidad mínima indivisible. En el siglo XIX, Dalton, Avogadro y Mendeleev construyeron la química moderna. En <strong>1897, J.J. Thomson</strong> descubrió el electrón, demostrando que el átomo sí podía dividirse.'
  },
  {
    img: 'assets/atomo.png', anim: 'glow-pulse', clickable: false,
    level: 'Escala atómica — ~10⁻¹⁰ m',
    title: 'El modelo atómico y la energía cuantizada',
    desc: 'Rutherford descubrió el núcleo en 1911. En <strong>1913, Bohr</strong> propuso que los electrones solo pueden ocupar órbitas con energías fijas y discretas: <strong>cuantizadas</strong>. Esto explica el espectro de colores del hidrógeno. La energía no varía de forma continua, sino en "saltos" definidos por la constante de Planck <em>h</em>. Planck (1900) y Einstein (1905, efecto fotoeléctrico) ya habían revelado que la luz también viene en paquetes discretos: los <strong>fotones</strong>.'
  },
  {
    img: 'assets/revolucioncuantica.png', anim: 'float', clickable: false,
    level: 'Revolución cuántica — 1920s',
    title: 'La mecánica cuántica',
    desc: 'En los años 1920, <strong>Heisenberg, Schrödinger y Dirac</strong> formularon la mecánica cuántica. Sus pilares son: el <strong>Principio de Incertidumbre</strong> (posición y velocidad no pueden conocerse exactas simultáneamente), la <strong>dualidad onda-partícula</strong> y la <strong>superposición cuántica</strong>. Dirac (1928) predijo la antimateria; Anderson (1932) descubrió el positrón. Por cada partícula existe una antipartícula.'
  },
  {
    img: 'assets/quarks.png', anim: 'glow-pulse', clickable: false,
    level: 'Escala subnuclear — ~10⁻¹⁵ m',
    title: 'Los quarks: el interior del protón',
    desc: 'Experimentos en el SLAC (1968-1969) revelaron que protones y neutrones <strong>no son elementales</strong>: están hechos de <strong>quarks</strong>. Gell-Mann y Zweig lo habían propuesto en 1964. Los quarks se mantienen unidos mediante la <strong>Fuerza Nuclear Fuerte</strong>, mediada por gluones. Esta fuerza es tan intensa que los quarks nunca se observan libres: siempre están "confinados" dentro de partículas compuestas (hadrones).'
  },
  {
    img: 'assets/fermiones.png', anim: 'pulse', clickable: false,
    level: 'Constituyentes fundamentales — Fermiones',
    title: 'Los fermiones: la materia',
    desc: 'Los fermiones son las partículas que constituyen la materia. Existen <strong>12 fermiones fundamentales</strong> organizados en 3 generaciones:',
    list: [
      '<strong>Quarks (6 sabores):</strong> up, down (gen. 1) · charm, strange (gen. 2) · top, bottom (gen. 3). Descubiertos entre 1968 y 1995. Confinados en hadrones.',
      '<strong>Leptones (6):</strong> electrón (1897) · muón (1936) · tau (1975) y sus neutrinos correspondientes. No sienten la fuerza fuerte, por lo que pueden existir libres.',
      'Solo la <strong>primera generación</strong> es estable y forma la materia ordinaria. Las generaciones 2 y 3 son copias más masivas e inestables: desaparecen en microsegundos.'
    ]
  },
  {
    img: 'assets/bosones.jpg', anim: 'spin-slow', clickable: false,
    level: 'Constituyentes fundamentales — Bosones',
    title: 'Los bosones: las fuerzas',
    desc: 'En mecánica cuántica, <strong>toda fuerza es mediada por una partícula bosónica</strong>. Esto unifica la relatividad especial con la teoría cuántica:',
    list: [
      '<strong>Fotón (γ):</strong> Media el electromagnetismo. Sin masa, alcance infinito. Conocido desde Einstein (1905).',
      '<strong>Gluones (g):</strong> 8 tipos. Median la fuerza fuerte entre quarks (DESY, 1979). Ellos mismos llevan carga de color.',
      '<strong>Bosones W⁺, W⁻ y Z⁰:</strong> Median la fuerza débil: desintegración radiactiva y fusión solar. Descubiertos en el CERN en 1983 (Nobel 1984).',
      '<strong>Bosón de Higgs (H⁰):</strong> Asociado al Campo de Higgs que otorga masa a las partículas. Descubierto en el LHC del CERN, 4 de julio de 2012 (Nobel 2013). La última pieza del Modelo Estándar.'
    ]
  },
  {
    img: 'assets/modeloestandar.png', anim: 'glow-pulse', clickable: false, last: true,
    level: 'El panorama completo',
    title: '¡Listo para explorar el Modelo Estándar!',
    desc: 'El <strong>Modelo Estándar</strong> (formulado en los años 1970) es la teoría más precisa jamás construida. Unifica en un solo marco los <strong>12 fermiones</strong> (6 quarks + 6 leptones) y los <strong>bosones</strong> (γ, g, W⁺, W⁻, Z⁰, H⁰) junto con tres fuerzas fundamentales. Ha sobrevivido décadas de pruebas experimentales con precisión extraordinaria. Sus fronteras abiertas: la gravedad, la materia oscura y por qué hay más materia que antimateria. ¡Es hora de explorarlo tú mismo!'
  }
];
