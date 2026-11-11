#!/usr/bin/env node
/* ══════════════════════════════════════════
   tools/verificar.js
   Comprobaciones automáticas del proyecto
   Higgs Adventure. No necesita dependencias.

   Uso:
     node tools/verificar.js

   Comprueba:
     A. Que todos los CSS y JS enlazados en
        index.html existen en disco.
     B. Que el asset de cada minijuego existe.
     C. Que cada minijuego marcado como
        disponible tiene su función
        iniciar_<id>() definida y cargada.
     D. La lógica de desbloqueo por etapas
        de js/progreso.js.
   ══════════════════════════════════════════ */

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const RAIZ = path.resolve(__dirname, '..');
let fallos = 0;
let avisos = 0;

function ok(msg)     { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); }
function fallo(msg)  { fallos++; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
function aviso(msg)  { avisos++; console.log(`  \x1b[33m! ${msg}\x1b[0m`); }
function titulo(msg) { console.log(`\n\x1b[1m${msg}\x1b[0m`); }

const rel  = p => path.relative(RAIZ, p).replace(/\\/g, '/');
const leer = p => fs.readFileSync(path.join(RAIZ, p), 'utf8');
const existe = p => fs.existsSync(path.join(RAIZ, p));

/* ════════════════════════════════════════
   A. Referencias de index.html
   ════════════════════════════════════════ */
titulo('A. Referencias locales de index.html');

const html = leer('index.html');
const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
  .map(m => m[1])
  .filter(u => !/^(https?:)?\/\//.test(u) && !u.startsWith('#'));

if (!refs.length) fallo('No se encontró ninguna referencia local en index.html');

refs.forEach(u => {
  if (existe(u)) ok(u);
  else           fallo(`${u}  (enlazado pero no existe)`);
});

/* Ningún archivo de css/ o js/ debería quedar huérfano */
titulo('A2. Archivos de css/ y js/ sin enlazar (huérfanos)');

const enlazados = new Set(refs.map(r => r.replace(/\\/g, '/')));
const candidatos = [];
['css', 'js', 'minijuegos/css', 'minijuegos/js'].forEach(dir => {
  const abs = path.join(RAIZ, dir);
  if (!fs.existsSync(abs)) return;
  fs.readdirSync(abs)
    .filter(f => /\.(css|js)$/.test(f))
    .forEach(f => candidatos.push(`${dir}/${f}`));
});

const huerfanos = candidatos.filter(c => !enlazados.has(c));
if (huerfanos.length) huerfanos.forEach(h => fallo(`${h}  (existe pero no se carga desde index.html)`));
else                  ok(`${candidatos.length} archivos, todos enlazados`);

/* ════════════════════════════════════════
   B y C. Registro de minijuegos
   ════════════════════════════════════════ */
titulo('B/C. Minijuegos: assets y funciones iniciar_<id>()');

/* Cargamos data-minijuegos.js en un contexto aislado */
const ctxData = vm.createContext({ console });
vm.runInContext(leer('minijuegos/js/data-minijuegos.js') + '\n;globalThis.__D = MINIJUEGOS_DATA;', ctxData);
const MINIJUEGOS_DATA = ctxData.__D;

/* Todas las funciones iniciar_* definidas en los archivos de minijuegos */
const archivosMJ = fs.readdirSync(path.join(RAIZ, 'minijuegos/js'))
  .filter(f => /^minijuego-.*\.js$/.test(f));

const funciones = new Set();
archivosMJ.forEach(f => {
  const src = leer(`minijuegos/js/${f}`);
  [...src.matchAll(/function\s+(iniciar_[A-Za-z0-9_]+)\s*\(/g)].forEach(m => funciones.add(m[1]));
});

console.log(`  (${archivosMJ.length} archivos de minijuego, ${funciones.size} funciones iniciar_*)`);

let totalJuegos = 0, disponibles = 0;

MINIJUEGOS_DATA.forEach(seccion => {
  console.log(`\n  \x1b[1m${seccion.label}\x1b[0m  (fase ${seccion.fase})`);

  if (typeof seccion.fase !== 'number' || seccion.fase < 1 || seccion.fase > 4) {
    fallo(`${seccion.id}: 'fase' debe ser un número entre 1 y 4`);
  }

  seccion.juegos.forEach(j => {
    totalJuegos++;
    const fnEsperada = 'iniciar_' + j.id.replace(/-/g, '_');

    /* asset */
    if (!existe(j.asset)) fallo(`${j.id}: asset no encontrado → ${j.asset}`);

    /* ids duplicados */
    const repetidos = MINIJUEGOS_DATA
      .reduce((a, s) => a.concat(s.juegos), [])
      .filter(x => x.id === j.id).length;
    if (repetidos > 1) fallo(`${j.id}: id duplicado (${repetidos} veces)`);

    if (j.disponible) {
      disponibles++;
      if (funciones.has(fnEsperada)) {
        ok(`${j.id} → ${fnEsperada}()`);
      } else {
        fallo(`${j.id}: marcado disponible pero falta ${fnEsperada}()`);
      }
    } else {
      if (funciones.has(fnEsperada)) {
        aviso(`${j.id}: implementado (${fnEsperada}) pero marcado disponible:false`);
      } else {
        console.log(`  \x1b[90m·\x1b[0m ${j.id} (próximamente)`);
      }
    }
  });
});

const idsDeclarados = new Set(
  MINIJUEGOS_DATA.reduce((a, s) => a.concat(s.juegos), [])
    .map(j => 'iniciar_' + j.id.replace(/-/g, '_'))
);

/* Funciones implementadas que ningún juego declara.
   Se aceptan como válidas las «variantes» de un minijuego ya declarado:
   iniciar_carga_color_libre() y iniciar_carga_color_gluones() son formas
   alternativas de abrir carga-color, no minijuegos independientes. */
const declaradas = [...idsDeclarados];
const sinRegistro = [...funciones].filter(f => {
  if (declaradas.indexOf(f) >= 0) return false;
  return !declaradas.some(d => f.indexOf(d + '_') === 0);
});
if (sinRegistro.length) {
  sinRegistro.forEach(f => aviso(`${f}() existe pero ningún minijuego la declara`));
}

console.log(`\n  Total: ${totalJuegos} minijuegos, ${disponibles} jugables.`);

/* ════════════════════════════════════════
   D. Lógica de desbloqueo
   ════════════════════════════════════════ */
titulo('D. Lógica de desbloqueo por etapas (js/progreso.js)');

function nuevoProgreso() {
  /* localStorage falso */
  const almacen = {};
  const localStorage = {
    getItem: k => (k in almacen ? almacen[k] : null),
    setItem: (k, v) => { almacen[k] = String(v); },
    removeItem: k => { delete almacen[k]; }
  };
  const doc = {
    getElementById: () => null,
    createElement: () => ({ classList: { add() {}, remove() {}, toggle() {} }, style: {} }),
    body: { appendChild() {} }
  };
  const sandbox = {
    localStorage, document: doc, console,
    window: { addEventListener: () => {} },
    setTimeout: () => 0, clearTimeout: () => {}
  };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(
    leer('js/progreso.js') + '\n;globalThis.__P = Progreso;',
    ctx
  );
  return ctx.__P;
}

function probar(desc, fn) {
  try {
    const r = fn();
    if (r === true || r === undefined) ok(desc);
    else fallo(`${desc} → ${r}`);
  } catch (e) {
    fallo(`${desc} → excepción: ${e.message}`);
  }
}

probar('Un jugador nuevo tiene la Etapa 1 abierta y la 2 bloqueada', () => {
  const P = nuevoProgreso();
  if (!P.etapaDesbloqueada(1)) return 'la Etapa 1 debería estar abierta';
  if (P.etapaDesbloqueada(2))  return 'la Etapa 2 no debería estar abierta todavía';
  if (P.etapaMaxima() !== 1)   return `etapaMaxima() = ${P.etapaMaxima()}, esperado 1`;
  return true;
});

probar('Las partículas de gen 2/3 y los bosones empiezan bloqueados', () => {
  const P = nuevoProgreso();
  const q1 = { gen: 1 }, q2 = { gen: 2 }, bo = {};
  if (P.particulaBloqueada(q1, 'quark'))  return 'gen 1 no debería estar bloqueada';
  if (!P.particulaBloqueada(q2, 'quark')) return 'gen 2 debería estar bloqueada';
  if (!P.particulaBloqueada(bo, 'boson')) return 'los bosones deberían estar bloqueados';
  return true;
});

probar('Superar los 4 minijuegos de la Etapa 1 abre la Etapa 2', () => {
  const P = nuevoProgreso();
  const etapa1 = ['carga-color', 'carga-electrica', 'spin', 'masa'];
  etapa1.forEach(id => {
    const req = P.MODULOS_REQUERIDOS[id];
    for (let i = 0; i < req; i++) P.moduloCompletado(id, 'm' + i);
  });
  if (!etapa1.every(id => P.superado(id))) return 'no todos los minijuegos quedaron superados';
  if (!P.etapaDesbloqueada(2)) return 'la Etapa 2 debería estar abierta';
  if (P.etapaDesbloqueada(3))  return 'la Etapa 3 no debería estar abierta todavía';
  return true;
});

probar('Un minijuego no se marca superado antes de tiempo', () => {
  const P = nuevoProgreso();
  /* carga-electrica necesita 3 módulos */
  P.moduloCompletado('carga-electrica', 'a');
  P.moduloCompletado('carga-electrica', 'b');
  if (P.superado('carga-electrica')) return 'se marcó superado con solo 2 de 3 módulos';
  P.moduloCompletado('carga-electrica', 'c');
  if (!P.superado('carga-electrica')) return 'debería estar superado con 3 módulos';
  return true;
});

probar('Repetir la misma clave de módulo no infla el progreso', () => {
  const P = nuevoProgreso();
  for (let i = 0; i < 20; i++) P.moduloCompletado('spin', 'brujula');
  if (P.modulosCompletados('spin') !== 1) return `contó ${P.modulosCompletados('spin')} módulos, esperado 1`;
  return true;
});

probar('La cadena completa de etapas se abre en orden', () => {
  const P = nuevoProgreso();
  const superar = (ids) => ids.forEach(id => {
    for (let i = 0; i < P.MODULOS_REQUERIDOS[id]; i++) P.moduloCompletado(id, 'm' + i);
  });
  superar(P.ETAPAS[1].minijuegos);
  if (!P.etapaDesbloqueada(2) || P.etapaDesbloqueada(3)) return 'fallo al abrir la Etapa 2';
  superar(P.ETAPAS[2].minijuegos);
  if (!P.etapaDesbloqueada(3) || P.etapaDesbloqueada(4)) return 'fallo al abrir la Etapa 3';
  superar(P.ETAPAS[3].minijuegos);
  if (!P.etapaDesbloqueada(4)) return 'la Etapa 4 debería estar abierta';
  if (P.particulaBloqueada({}, 'boson')) return 'los bosones deberían estar desbloqueados';
  return true;
});

probar('El historial y las medallas se calculan por minijuego', () => {
  const P = nuevoProgreso();
  P.registrarPartida('carga-color', { puntaje: 3600, combos: 10, errores: 1 });
  P.registrarPartida('carga-color', { puntaje: 100 });
  P.registrarPartida('foton', { puntaje: 800 });
  if (P.historial().length !== 3)              return `historial con ${P.historial().length} entradas`;
  if (P.mejorPuntaje('carga-color').puntaje !== 3600) return 'mejor puntaje de carga-color incorrecto';
  if (P.logroDe('carga-color', 3600).nombre !== 'Diamante') return 'la medalla de carga-color no es Diamante';
  if (P.logroDe('foton', 800).nombre !== 'Diamante')        return 'la medalla de foton no es Diamante';
  if (P.logroDe('masa', 0).nombre !== 'Bronce')             return 'la medalla por defecto no es Bronce';
  return true;
});

probar('El progreso persiste entre sesiones (localStorage)', () => {
  const almacen = {};
  const localStorage = {
    getItem: k => (k in almacen ? almacen[k] : null),
    setItem: (k, v) => { almacen[k] = String(v); },
    removeItem: k => { delete almacen[k]; }
  };
  const doc = { getElementById: () => null,
                createElement: () => ({ classList: { add() {}, remove() {}, toggle() {} }, style: {} }),
                body: { appendChild() {} } };
  const cargar = () => {
    const ctx = vm.createContext({ localStorage, document: doc, console,
                                   setTimeout: () => 0, clearTimeout: () => {} });
    vm.runInContext(leer('js/progreso.js') + '\n;globalThis.__P = Progreso;', ctx);
    return ctx.__P;
  };
  const P1 = cargar();
  for (let i = 0; i < P1.MODULOS_REQUERIDOS['rayos-cosmicos']; i++)
    P1.moduloCompletado('rayos-cosmicos', 'm' + i);

  const P2 = cargar();   /* segunda "sesión" con el mismo localStorage */
  if (!P2.superado('rayos-cosmicos')) return 'el progreso no se recuperó tras recargar';
  return true;
});

probar('Migra los historiales antiguos (cc_historial / fy_historial)', () => {
  const almacen = {
    cc_historial: JSON.stringify([{ fecha: '01/01/2026', puntaje: 2000, combos: 5, errores: 2, logro: 'Plata' }]),
    fy_historial: JSON.stringify([{ fecha: '02/01/2026', puntaje: 600, logro: 'Oro' }])
  };
  const localStorage = {
    getItem: k => (k in almacen ? almacen[k] : null),
    setItem: (k, v) => { almacen[k] = String(v); },
    removeItem: k => { delete almacen[k]; }
  };
  const doc = { getElementById: () => null,
                createElement: () => ({ classList: { add() {}, remove() {}, toggle() {} }, style: {} }),
                body: { appendChild() {} } };
  const ctx = vm.createContext({ localStorage, document: doc, console,
                                 setTimeout: () => 0, clearTimeout: () => {} });
  vm.runInContext(leer('js/progreso.js') + '\n;globalThis.__P = Progreso;', ctx);
  const P = ctx.__P;
  if (P.historial().length !== 2)     return `se migraron ${P.historial().length} entradas, esperado 2`;
  if (!P.historial('carga-color').length) return 'no se migró cc_historial';
  if (!P.historial('foton').length)       return 'no se migró fy_historial';
  return true;
});

/* ════════════════════════════════════════
   E. Manejadores en línea
   ════════════════════════════════════════ */
titulo('E. Manejadores en línea (onclick=…): ¿existen sus funciones?');

/* Todo el código del proyecto, index.html incluido */
const fuentes = { 'index.html': html };
candidatos.forEach(f => { fuentes[f] = leer(f); });

/* Nombres globales disponibles (búsqueda permisiva: sin falsos positivos) */
const globales = new Set();
const definiciones = {};   /* solo funciones de nivel superior (columna 0) */

Object.entries(fuentes).forEach(([archivo, src]) => {
  [...src.matchAll(/^\s*function\s+([A-Za-z_$][\w$]*)/gm)].forEach(m => globales.add(m[1]));
  [...src.matchAll(/^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm)].forEach(m => globales.add(m[1]));
  /* Solo las funciones a columna 0 para detectar duplicados reales */
  [...src.matchAll(/^function\s+([A-Za-z_$][\w$]*)/gm)].forEach(m => {
    (definiciones[m[1]] = definiciones[m[1]] || []).push(archivo);
  });
  /* Los minijuegos se declaran con sangría variable; los aceptamos igual */
  [...src.matchAll(/^\s{2,}function\s+([A-Za-z_$][\w$]*)/gm)].forEach(m => globales.add(m[1]));
});

/* Extraemos el identificador de cabeza de cada atributo on*="..."
   (la cabeza, no la primera llamada: `Calculadora.toggle()` → Calculadora) */
const PALABRAS_CLAVE = new Set(['if', 'else', 'return', 'var', 'let', 'const', 'this',
  'function', 'typeof', 'new', 'for', 'while', 'switch', 'do', 'try', 'catch']);
const PERMITIDOS = new Set(['document', 'window', 'event', 'this']);

const manejadores = new Map();
Object.entries(fuentes).forEach(([archivo, src]) => {
  const re = /\bon(?:click|change|input|submit|mouseover|mouseout|mousedown)\s*=\s*"([^"]*)"/g;
  [...src.matchAll(re)].forEach(m => {
    const fm = m[1].trim().match(/^([A-Za-z_$][\w$]*)/);
    if (!fm) return;
    const nombre = fm[1];
    if (PALABRAS_CLAVE.has(nombre) || PERMITIDOS.has(nombre)) return;
    if (!manejadores.has(nombre)) manejadores.set(nombre, new Set());
    manejadores.get(nombre).add(archivo);
  });
});

const sinDefinir = [...manejadores.keys()].filter(n => !globales.has(n));
if (sinDefinir.length) {
  sinDefinir.forEach(n =>
    fallo(`onclick="${n}(…)" usado en ${[...manejadores.get(n)].join(', ')} pero ${n}() no está definida`));
} else {
  ok(`${manejadores.size} manejadores distintos, todos definidos`);
}

/* ════════════════════════════════════════
   F. Funciones globales duplicadas
   ════════════════════════════════════════ */
titulo('F. Funciones globales definidas en más de un archivo');

const duplicadas = Object.entries(definiciones).filter(([, arr]) => new Set(arr).size > 1);
if (duplicadas.length) {
  duplicadas.forEach(([nombre, arr]) =>
    fallo(`${nombre}() definida en: ${[...new Set(arr)].join(', ')} (la última sobrescribe a las demás)`));
} else {
  ok(`sin colisiones entre ${Object.keys(definiciones).length} funciones globales`);
}

/* ════════════════════════════════════════
   G. getElementById vs id="…" realmente creados
   ════════════════════════════════════════ */
titulo('G. Elementos referenciados con getElementById');

/* Todos los id que el proyecto crea en algún sitio (HTML o plantillas JS) */
const idsCreados = new Set();
Object.values(fuentes).forEach(src => {
  [...src.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].forEach(m => idsCreados.add(m[1]));
  /* ids generados dinámicamente, p. ej. `mj-canvas-${juego.id}` */
  [...src.matchAll(/\bid\s*=\s*["'`]([^"'`]*)\$\{/g)].forEach(m => {
    const prefijo = m[1];
    /* registramos el prefijo como comodín: cualquier id que empiece así vale */
    idsCreados.add(prefijo + '*');
  });
});

const idsReferenciados = new Map();
Object.entries(fuentes).forEach(([archivo, src]) => {
  [...src.matchAll(/getElementById\(\s*['"]([^'"]+)['"]\s*\)/g)].forEach(m => {
    if (!idsReferenciados.has(m[1])) idsReferenciados.set(m[1], new Set());
    idsReferenciados.get(m[1]).add(archivo);
  });
});

const idsRotos = [...idsReferenciados.keys()].filter(id => {
  if (idsCreados.has(id)) return false;
  /* ¿algún id creado con comodín (plantilla) cubre este id? */
  return ![...idsCreados].some(c => c.endsWith('*') && id.startsWith(c.slice(0, -1)));
});

if (idsRotos.length) {
  idsRotos.forEach(id =>
    fallo(`getElementById('${id}') en ${[...idsReferenciados.get(id)].join(', ')} — ningún id="${id}" se crea`));
} else {
  ok(`${idsReferenciados.size} ids distintos, todos creados en alguna parte`);
}

/* ════════════════════════════════════════
   H. Capa de autenticación (Firebase)
   ════════════════════════════════════════ */
titulo('H. Capa de autenticación (Firebase)');

/* Carga js/firebase-config.js en un contexto aislado.
   `sustituir` permite probar el caso «ya configurado». */
/* Carga js/firebase-config.js en un contexto aislado.
   modo:  undefined    → deja el archivo tal cual está
          'real'       → inyecta una configuración completa y válida
          'marcadores' → inyecta los marcadores PEGA_AQUI

   Se sustituye SOLO el bloque de configuración. No se puede hacer un
   reemplazo global de «'PEGA_AQUI'»: esa misma cadena aparece dentro de
   firebaseEstaConfigurado() como centinela, y reescribirla cambiaría el
   comportamiento de la función que queremos probar. */
function cargarConfig(modo) {
  const ctx = vm.createContext({ console, location: { protocol: 'https:' } });
  let src = leer('js/firebase-config.js');

  if (modo === 'real' || modo === 'marcadores') {
    const bloque = (modo === 'real')
      ? "const FIREBASE_CONFIG = {\n" +
        "  apiKey:            'AIzaSyA1234567890abcdefghijklmnopqrst',\n" +
        "  authDomain:        'higgs-adventure.firebaseapp.com',\n" +
        "  projectId:         'higgs-adventure',\n" +
        "  storageBucket:     'higgs-adventure.appspot.com',\n" +
        "  messagingSenderId: '1234567890',\n" +
        "  appId:             '1:1234567890:web:abcdef'\n" +
        "};"
      : "const FIREBASE_CONFIG = {\n" +
        "  apiKey:            'PEGA_AQUI_TU_API_KEY',\n" +
        "  authDomain:        'PEGA_AQUI.firebaseapp.com',\n" +
        "  projectId:         'PEGA_AQUI',\n" +
        "  storageBucket:     'PEGA_AQUI.appspot.com',\n" +
        "  messagingSenderId: 'PEGA_AQUI',\n" +
        "  appId:             'PEGA_AQUI'\n" +
        "};";
    src = src.replace(/const FIREBASE_CONFIG = \{[\s\S]*?\n\};/, bloque);
  }

  vm.runInContext(
    src + '\n;globalThis.__C = { FIREBASE_CONFIG, FIREBASE_CDN, HIGGS_AUTH, ' +
          'firebaseEstaConfigurado, estaEnArchivoLocal };',
    ctx
  );
  return ctx.__C;
}

probar('js/firebase-config.js expone lo esperado', () => {
  const C = cargarConfig();
  const faltan = ['FIREBASE_CONFIG', 'FIREBASE_CDN', 'HIGGS_AUTH',
                  'firebaseEstaConfigurado', 'estaEnArchivoLocal'].filter(k => C[k] === undefined);
  return faltan.length ? 'faltan: ' + faltan.join(', ') : true;
});

probar('La configuración tiene los 6 campos de Firebase', () => {
  const campos = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const faltan = campos.filter(c => cargarConfig().FIREBASE_CONFIG[c] === undefined);
  return faltan.length ? 'faltan: ' + faltan.join(', ') : true;
});

probar('Con marcadores «PEGA_AQUI», Firebase se considera sin configurar', () => {
  return cargarConfig('marcadores').firebaseEstaConfigurado() === false
      || 'devolvió true con los marcadores puestos';
});

probar('Con una configuración real, Firebase se considera configurado', () => {
  return cargarConfig('real').firebaseEstaConfigurado() === true
      || 'no detectó una configuración válida';
});

/* Estado real del proyecto: informativo, no es un fallo en ningún caso */
{
  const yaConfigurado = cargarConfig().firebaseEstaConfigurado();
  const proyecto = yaConfigurado ? cargarConfig().FIREBASE_CONFIG.projectId : '';
  console.log('  \x1b[90m·\x1b[0m Estado del proyecto: ' + (yaConfigurado
    ? 'Firebase configurado (proyecto «' + proyecto + '») → las cuentas están activas'
    : 'sin configurar → el progreso se guarda solo en el navegador'));
}

probar('La URL del CDN tiene el formato oficial y versión fijada', () => {
  const url = cargarConfig().FIREBASE_CDN;
  return /^https:\/\/www\.gstatic\.com\/firebasejs\/\d+\.\d+\.\d+\/$/.test(url)
      || 'es «' + url + '»';
});

probar('estaEnArchivoLocal() distingue file:// de http(s)', () => {
  const mk = proto => {
    const ctx = vm.createContext({ console, location: { protocol: proto } });
    vm.runInContext(leer('js/firebase-config.js') + '\n;globalThis.__f = estaEnArchivoLocal;', ctx);
    return ctx.__f;
  };
  if (mk('file:')()  !== true)  return 'no detecta file://';
  if (mk('https:')() !== false) return 'confunde https con file://';
  return true;
});

probar('firestore.rules existe y restringe el acceso al propio uid', () => {
  if (!existe('firestore.rules')) return 'no existe el archivo';
  const r = leer('firestore.rules');
  if (!/service cloud\.firestore/.test(r))  return 'no declara el servicio';
  if (!/request\.auth\.uid == uid/.test(r)) return 'no compara el uid del solicitante';
  if (!/allow read/.test(r))                return 'no define lectura';
  if (!/allow create, update/.test(r))      return 'no define escritura';
  return true;
});

probar('La política de acceso tiene los ajustes esperados', () => {
  const a = cargarConfig().HIGGS_AUTH;
  if (typeof a.modoInvitado !== 'boolean')       return 'falta modoInvitado';
  if (typeof a.exigirVerificacion !== 'boolean') return 'falta exigirVerificacion';
  if (typeof a.retardoSubida !== 'number')       return 'falta retardoSubida';
  if (a.retardoSubida < 200)                     return 'retardoSubida demasiado bajo';
  return true;
});

probar('Progreso expone la capa de nube', () => {
  const P = nuevoProgreso();
  const fns = ['conectarNube', 'desconectarNube', 'bajarDeNube', 'subirAhora',
               'estadoActual', 'reiniciarLocal', 'estadoNube'];
  const faltan = fns.filter(f => typeof P[f] !== 'function');
  return faltan.length ? 'faltan: ' + faltan.join(', ') : true;
});

probar('estadoNube() refleja la conexión del adaptador', () => {
  const P = nuevoProgreso();
  if (P.estadoNube().conectado) return 'dice conectado sin adaptador';
  P.conectarNube({ cargar: async () => null, guardar: async () => {} });
  if (!P.estadoNube().conectado) return 'no detecta el adaptador';
  P.desconectarNube();
  if (P.estadoNube().conectado) return 'no se desconecta';
  return true;
});

probar('Las acciones de cuenta están definidas', () => {
  const src = leer('js/perfil.js') + leer('js/auth.js');
  const necesarias = ['abrirAuth', 'cerrarSesion', 'reenviarVerificacionAuth'];
  const faltan = necesarias.filter(f => !new RegExp('function\\s+' + f + '\\s*\\(').test(src));
  return faltan.length ? 'faltan: ' + faltan.join(', ') : true;
});

/* ════════════════════════════════════════
   I. Scripts en línea dentro de los HTML
   Nada más los revisaba: un error de sintaxis en un <script> dentro
   de un .html deja la página muda y no lo detecta node --check.
   ════════════════════════════════════════ */
titulo('I. Sintaxis de los scripts en línea de los HTML');

{
  /* Todos los .html del proyecto (se saltan .git, node_modules y assets) */
  const htmls = [];
  (function recorrer(dir) {
    const abs = path.join(RAIZ, dir);
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      const rel = dir ? dir + '/' + e.name : e.name;
      if (e.isDirectory()) {
        if (['.git', 'node_modules', 'assets', 'docs'].indexOf(e.name) >= 0) continue;
        recorrer(rel);
      } else if (/\.html$/i.test(e.name)) {
        htmls.push(rel);
      }
    }
  })('');

  let revisados = 0;

  htmls.forEach(rel => {
    const src = leer(rel);
    const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
    let m, i = 0;
    while ((m = re.exec(src)) !== null) {
      const attrs = m[1] || '';
      if (/\bsrc\s*=/.test(attrs)) continue;   /* scripts externos */
      if (!m[2].trim()) continue;              /* vacíos */
      i++; revisados++;
      const esModulo = /type\s*=\s*["']module["']/.test(attrs);
      try {
        /* Para los módulos envolvemos en una función async porque usan
           await de nivel superior. */
        new vm.Script(esModulo ? `(async () => {${m[2]}\n})` : m[2],
                      { filename: rel + ' bloque ' + i });
        ok(rel + ' · bloque ' + i + (esModulo ? ' (módulo)' : ''));
      } catch (e) {
        fallo(rel + ' · bloque ' + i + ' → ' + e.message);
      }
    }
  });

  if (revisados === 0) aviso('no se encontró ningún script en línea que revisar');
}

/* ── Pruebas asíncronas de la sincronización ── */
(async () => {

  async function probarAsync(desc, fn) {
    try {
      const r = await fn();
      if (r === true || r === undefined) ok(desc);
      else fallo(`${desc} → ${r}`);
    } catch (e) {
      fallo(`${desc} → excepción: ${e.message}`);
    }
  }

  await probarAsync('Una cuenta nueva recibe el progreso hecho como invitado', async () => {
    const P = nuevoProgreso();
    P.moduloCompletado('spin', 'brujula');
    let subido = null;
    P.conectarNube({ cargar: async () => null, guardar: async (e) => { subido = e; } });
    await P.bajarDeNube();
    if (!subido) return 'no se subió nada a una cuenta vacía';
    if (!subido.modulos.spin || !subido.modulos.spin.brujula) return 'el progreso local no viajó';
    return true;
  });

  await probarAsync('Al entrar se FUSIONA lo local con lo remoto, sin perder nada', async () => {
    const P = nuevoProgreso();
    P.moduloCompletado('carga-color', 'a');
    P.moduloCompletado('carga-color', 'b');

    const remoto = {
      modulos: { 'carga-color': { c: true }, spin: { brujula: true } },
      superados: {},
      historial: [{ juego: 'foton', fecha: '01/01/2026', puntaje: 500, combos: 2, errores: 1, logro: 'Oro' }],
      etapaNotificada: 2
    };
    let subido = null;
    P.conectarNube({ cargar: async () => remoto, guardar: async (e) => { subido = e; } });
    await P.bajarDeNube();

    const est = P.estadoActual();
    if (!est.modulos['carga-color'].a || !est.modulos['carga-color'].b) return 'se perdió el progreso local';
    if (!est.modulos['carga-color'].c)                                 return 'se perdió el progreso remoto';
    if (!est.modulos.spin || !est.modulos.spin.brujula)                return 'no llegó el minijuego remoto';
    if (est.historial.length !== 1)                                    return 'historial incorrecto: ' + est.historial.length;
    if (est.etapaNotificada !== 2)                                     return 'no conservó la etapa más alta';
    if (!subido)                                                       return 'no se subió el resultado de la fusión';
    return true;
  });

  await probarAsync('El historial fusionado no duplica entradas repetidas', async () => {
    const P = nuevoProgreso();
    P.registrarPartida('foton', { puntaje: 500, combos: 2, errores: 1 });
    /* La misma partida exacta, como si viniera de la nube */
    const partida = Object.assign({}, P.historial()[0]);
    P.conectarNube({ cargar: async () => ({ historial: [partida] }), guardar: async () => {} });
    await P.bajarDeNube();
    const n = P.historial().length;
    return n === 1 || 'quedaron ' + n + ' entradas en lugar de 1';
  });

  await probarAsync('Sin nube conectada, subirAhora() no rompe nada', async () => {
    const P = nuevoProgreso();
    const r = await P.subirAhora();
    return r === false || 'devolvió ' + r;
  });

  await probarAsync('Un fallo al subir se registra y no interrumpe el juego', async () => {
    const P = nuevoProgreso();
    P.conectarNube({ cargar: async () => null, guardar: async () => { throw new Error('sin red'); } });
    const r = await P.subirAhora();
    if (r !== false) return 'no informó del fallo';
    if (!P.estadoNube().ultimoError) return 'no guardó el error';
    return true;
  });

  await probarAsync('Si la LECTURA falla, se avisa y NO se escribe a ciegas', async () => {
    const P = nuevoProgreso();
    P.moduloCompletado('spin', 'brujula');
    let seEscribio = false;
    P.conectarNube({
      cargar:  async () => { throw new Error('unavailable'); },
      guardar: async () => { seEscribio = true; }
    });
    await P.bajarDeNube();
    if (!P.estadoNube().ultimoError)  return 'no se registró el error: el perfil no avisaría de nada';
    if (!P.estadoNube().falloLectura) return 'no se marcó como fallo de lectura';
    if (seEscribio)                   return 'escribió sin haber leído: podría pisar el progreso de otro equipo';
    return true;
  });

  await probarAsync('reintentar() repite el ciclo completo y acaba subiendo', async () => {
    const P = nuevoProgreso();
    P.moduloCompletado('spin', 'brujula');
    let lecturaFalla = true, subido = null;
    P.conectarNube({
      cargar:  async () => { if (lecturaFalla) throw new Error('unavailable'); return null; },
      guardar: async (e) => { subido = e; }
    });
    await P.bajarDeNube();                       /* primer intento: falla la lectura */
    if (subido) return 'no debería haber subido nada todavía';
    lecturaFalla = false;                        /* el alumno arregla su conexión */
    const ok = await P.reintentar();
    if (!ok) return 'reintentar() no tuvo éxito';
    if (!subido || !subido.modulos.spin) return 'no se subió el progreso tras reintentar';
    if (P.estadoNube().ultimoError) return 'el error anterior no se limpió';
    return true;
  });

  await probarAsync('reiniciarLocal() vacía el progreso sin tocar la nube', async () => {
    const P = nuevoProgreso();
    P.moduloCompletado('spin', 'brujula');
    P.reiniciarLocal();
    return P.modulosCompletados('spin') === 0 || 'no se vació';
  });

  /* ════════════════════════════════════════
     Resumen
     ════════════════════════════════════════ */
  console.log('');
  if (fallos === 0 && avisos === 0) {
    console.log('\x1b[32m✔ Todo correcto.\x1b[0m');
  } else {
    console.log(`\x1b[1mResultado:\x1b[0m ${fallos} fallo(s), ${avisos} aviso(s).`);
  }
  if (fallos > 0) console.log('\x1b[31mHay fallos que corregir.\x1b[0m');
  process.exit(fallos > 0 ? 1 : 0);

})();
