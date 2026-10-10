/* ══════════════════════════════════════════
   js/firebase-config.js
   Configuración de Firebase para Higgs Adventure.

   ── QUÉ HACER AQUÍ ─────────────────────────
   1. Crea tu proyecto en https://console.firebase.google.com
   2. En «Configuración del proyecto → Tus apps → Web» copia el
      objeto de configuración y pégalo abajo, sustituyendo los
      valores «PEGA_AQUI…».
   3. Sigue los pasos de docs/FIREBASE.md (activar los proveedores
      de acceso y crear la base de datos).

   ── IMPORTANTE SOBRE ESTAS CLAVES ──────────
   Estas claves NO son secretas: viajan al navegador de cualquier
   visitante, y así está diseñado. La seguridad de tus datos NO
   depende de esconderlas, sino de las reglas de acceso de
   firestore.rules, que impiden que un usuario lea o escriba los
   datos de otro.

   Lo que NUNCA debe subirse al repositorio es la clave de
   administrador («service account» / «service_role»). Esa no se
   usa en este proyecto.

   Mientras los valores sigan siendo «PEGA_AQUI…», el sitio
   funciona igual que siempre: con el progreso guardado en el
   navegador (localStorage) y sin cuentas.
   ══════════════════════════════════════════ */

const FIREBASE_CONFIG = {
  apiKey:            'PEGA_AQUI_TU_API_KEY',
  authDomain:        'PEGA_AQUI.firebaseapp.com',
  projectId:         'PEGA_AQUI',
  storageBucket:     'PEGA_AQUI.appspot.com',
  messagingSenderId: 'PEGA_AQUI',
  appId:             'PEGA_AQUI'
};

/* Versión del SDK de Firebase que se descarga desde el CDN oficial.
   Si algún día esta versión dejara de existir, cambia solo esta
   línea (la versión más reciente aparece en
   https://firebase.google.com/docs/web/setup o en
   https://registry.npmjs.org/firebase/latest). */
const FIREBASE_SDK_VERSION = '13.0.0';
const FIREBASE_CDN = 'https://www.gstatic.com/firebasejs/' + FIREBASE_SDK_VERSION + '/';

/* ── Comportamiento del acceso ── */
const HIGGS_AUTH = {
  /* true  = se puede jugar sin registrarse (modo invitado).
             El progreso se guarda en una cuenta anónima y luego se
             puede «vincular» a un correo sin perder nada.
             RECOMENDADO para aulas: nadie se queda fuera.
     false = hay que registrarse o entrar antes de jugar. */
  modoInvitado: true,

  /* true  = pedir confirmación del correo para poder jugar.
     false = se puede jugar sin confirmar (recomendado: el límite de
             correos del plan gratuito es de 1,000 al día y confirmar
             solo sirve para poder recuperar la cuenta). */
  exigirVerificacion: false,

  /* Milisegundos de espera antes de subir el progreso a la nube.
     Evita escribir en cada clic: agrupa ráfagas de cambios. */
  retardoSubida: 1500
};

/* ¿Ya se pegó una configuración real? */
function firebaseEstaConfigurado() {
  const k = (FIREBASE_CONFIG.apiKey || '').trim();
  const p = (FIREBASE_CONFIG.projectId || '').trim();
  if (!k || !p) return false;
  if (k.indexOf('PEGA_AQUI') === 0 || p.indexOf('PEGA_AQUI') === 0) return false;
  /* Una apiKey de Firebase ronda los 39 caracteres y empieza por AIza */
  return k.length > 20;
}

/* ¿Se está abriendo el sitio con file:// ? Firebase Auth necesita
   un origen http(s) para funcionar. */
function estaEnArchivoLocal() {
  return location.protocol === 'file:';
}
