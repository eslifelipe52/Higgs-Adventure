# Activar las cuentas con Firebase

Guía paso a paso. Son unos 15 minutos y no hace falta tarjeta de crédito.

Mientras no hagas esto, **el sitio funciona igual que siempre**: el progreso se
guarda en el navegador y no aparece ninguna pantalla de acceso molesta. En cuanto
pegues la configuración, las cuentas se activan solas.

---

## 1. Crear el proyecto

1. Entra en <https://console.firebase.google.com> con tu cuenta de Google.
2. Pulsa **Crear un proyecto** (o «Agregar proyecto»).
3. Ponle un nombre, por ejemplo `higgs-adventure`.
4. Google Analytics es **opcional**: puedes desactivarlo, no lo necesitamos.
5. Espera a que termine y pulsa **Continuar**.

## 2. Registrar la aplicación web y copiar la configuración

1. En la pantalla del proyecto, pulsa el icono **`</>`** («Web»).
2. Ponle un apodo, por ejemplo `Higgs Adventure Web`. **No** marques la casilla de
   Firebase Hosting.
3. Pulsa **Registrar app**. Aparecerá un bloque de código con un objeto parecido a este:

   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "higgs-adventure.firebaseapp.com",
     projectId: "higgs-adventure",
     storageBucket: "higgs-adventure.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef123456"
   };
   ```

4. Copia esos valores y pégalos en **`js/firebase-config.js`**, sustituyendo los
   `'PEGA_AQUI...'`. Debe quedar así:

   ```js
   const FIREBASE_CONFIG = {
     apiKey:            'AIza...tu_clave...',
     authDomain:        'higgs-adventure.firebaseapp.com',
     projectId:         'higgs-adventure',
     storageBucket:     'higgs-adventure.appspot.com',
     messagingSenderId: '1234567890',
     appId:             '1:1234567890:web:abcdef123456'
   };
   ```

### Sobre estas claves

**No son secretas y no pasa nada porque estén en el repositorio.** Están hechas
para viajar al navegador de cualquier visitante; así funciona Firebase. La
seguridad de los datos **no** depende de esconderlas, sino de las reglas del
paso 5.

Lo que nunca debe subirse al repositorio es la clave de **cuenta de servicio**
(«service account»). Este proyecto no la usa.

## 3. Activar los proveedores de acceso

1. En el menú lateral: **Compilación → Authentication**.
2. Pulsa **Comenzar**.
3. En la pestaña **Método de acceso**, habilita dos proveedores:
   - **Correo electrónico/contraseña** → habilítalo.
     Deja **desactivada** la opción «Vínculo de correo electrónico (acceso sin contraseña)»,
     porque el plan gratuito solo permite 5 correos al día de ese tipo.
   - **Anónimo** → habilítalo. Es lo que permite jugar como invitado sin
     registrarse, y lo que hace que nadie se quede fuera de la clase.

## 4. Crear la base de datos

> ⚠️ **Elige la edición STANDARD, no Enterprise.**
> Firestore ahora ofrece dos ediciones y el asistente puede ofrecerte
> Enterprise. Los SDK de Firebase, que son los que usa este proyecto, están
> hechos para **Standard**. Con una base Enterprise *todo parece correcto en la
> consola*, pero la aplicación falla con el error `unavailable`, la REST API
> responde que la base «does not exist» y no se guarda nada. No hay ningún
> mensaje que lo explique, así que es un fallo muy difícil de diagnosticar.
> Si ya creaste una Enterprise, tendrás que borrarla y crear otra Standard
> (es seguro si está vacía).

1. Menú lateral: **Compilación → Firestore Database**.
2. Pulsa **Crear base de datos**.
3. **Edición: Standard.** Comprueba este punto antes de seguir.
4. Modo: **Nativo** (*Native mode*). **No** elijas «Modo Datastore».
5. Elige **Modo de producción** (las reglas del paso siguiente se encargan de todo).
6. Ubicación: la que te proponga; `us-central1` o `southamerica-east1` funcionan bien.
   *No se puede cambiar después.*
7. Pulsa **Crear** y **espera a que termine**. No cierres la pestaña hasta que
   desaparezca el indicador de progreso.

Para comprobarlo, abre la lista **Databases** y mira la columna **Edition**: debe
decir **Standard**. Si dice Enterprise, no funcionará.

## 5. Pegar las reglas de seguridad

**Este paso es obligatorio.** Sin él, cualquiera podría leer y modificar el
progreso de todos los usuarios.

1. Dentro de Firestore, pestaña **Reglas**.
2. Borra lo que haya y pega **todo** el contenido del archivo
   [`firestore.rules`](../firestore.rules) del repositorio.
3. Pulsa **Publicar**.

## 6. Autorizar tus dominios

Firebase solo permite iniciar sesión desde dominios que le hayas autorizado.

1. **Authentication → Settings → Dominios autorizados**.
2. `localhost` ya viene incluido, así que para probar en tu computadora no hay
   que hacer nada.
3. Cuando publiques el sitio, pulsa **Agregar dominio** y escribe el tuyo, por
   ejemplo `tuusuario.github.io`.

---

## 7. Probar en tu computadora

**Importante:** abrir `index.html` con doble clic (dirección `file://`) **no
funciona** para las cuentas: Firebase necesita un origen `http://`. Además, los
navegadores bloquean los módulos de JavaScript en `file://`.

Tienes dos formas sencillas de levantar un servidor local:

**Con Visual Studio Code**

1. Instala la extensión **Live Server**.
2. Clic derecho sobre `index.html` → **Open with Live Server**.

**Con Python** (si lo tienes instalado), desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Y abre <http://localhost:8000> en el navegador.

Si abres el sitio con `file://`, el panel de perfil te lo dirá con un mensaje
claro en lugar de fallar en silencio.

---

## 8. Cómo queda la experiencia

Con `modoInvitado: true` (el valor por defecto):

1. El alumno entra al sitio y **empieza a jugar de inmediato**, sin registrarse.
   Por dentro se le crea una cuenta anónima y su progreso ya se guarda en la nube.
2. Al final de la clase puede pulsar **«Crear cuenta y conservar mi progreso»**.
   Escribe su correo y su contraseña, y **todo lo que jugó se mantiene**: la
   cuenta anónima se «vincula» al correo en lugar de reemplazarse.
3. La clase siguiente, desde otra computadora, entra con su correo y recupera
   su progreso y sus logros.

Si prefieres obligar a registrarse antes de jugar, cambia esto en
`js/firebase-config.js`:

```js
modoInvitado: false,
```

---

## 9. Publicar el sitio

El sitio es estático, así que GitHub Pages, Netlify o Vercel funcionan sin
cambios. Solo recuerda el **paso 6**: agrega el dominio publicado a la lista de
dominios autorizados, o el acceso fallará con el error
`auth/unauthorized-domain`.

---

## 10. Problemas frecuentes

**Antes de nada:** abre la página de diagnóstico que viene incluida. Te dice en
un segundo si el problema son las reglas, la configuración o la sesión.

```
http://localhost:8000/tools/diagnostico.html
```

Puedes añadir `?soloLectura=1` al final para que compruebe sin escribir nada en
tu base de datos.

| Mensaje que ves | Qué significa | Solución |
|---|---|---|
| **«Firestore está rechazando el acceso (reglas de seguridad)»** | Las reglas siguen en el modo cerrado por defecto | Paso 5 |
| **`unavailable`** | O la base no existe o es de edición **Enterprise**, o algo corta la conexión. Tus reglas no son el problema | «No se llega a Firestore», abajo |
| «El proveedor no está habilitado» | No activaste el método de acceso | Paso 3 |
| «Este dominio no está autorizado» | Falta tu dominio en la lista | Paso 6 |
| «No se pudo descargar el SDK de Firebase» | Sin internet, o la versión del SDK cambió | Revisa la conexión; si persiste, actualiza `FIREBASE_SDK_VERSION` en `js/firebase-config.js` |
| Las cuentas no aparecen y el perfil dice «Progreso local» | La configuración sigue con `PEGA_AQUI` | Paso 2 |
| Todo funciona pero al recargar no hay progreso | Las reglas rechazan la escritura | Paso 5 |
| «Demasiados intentos seguidos» | Límite de seguridad de Firebase | Espera unos minutos |
| La página se queda en «Comprobando…» | Se abrió con `file://` | Paso 6 |

### El error más habitual: las reglas

El «modo de producción» de Firestore, que es el que se elige al crearla, **deja
la base cerrada a todo el mundo** por defecto. Es una decisión de seguridad
correcta, pero significa que hasta que no pegues `firestore.rules` y pulses
**Publicar**, el acceso funciona (las cuentas viven en otro servicio) pero
**nada se guarda**: ni el progreso ni los logros.

El síntoma exacto es este:

- En **Authentication → Users** sí aparece el usuario (anónimo al principio).
- En **Firestore → Datos** no hay ninguna colección `progreso`.
- El perfil muestra «Jugando como invitado», pero el progreso no viaja.
- La página de diagnóstico dice **`permission-denied`**.

Si ves eso, es el paso 5. Vuelve a pegarlo y publica.

### No se llega a Firestore (`unavailable`)

Si la página de diagnóstico dice **`unavailable`** en lugar de
`permission-denied`, tus **reglas** están bien y el problema es otro. Hay dos
causas posibles, y conviene descartar la primera antes de tocar el navegador:

**1. La base de datos es de edición Enterprise (o no existe).** Es la causa más
traicionera porque en la consola *todo parece correcto*.

Compruébalo en dos segundos: pega esta dirección en el navegador, sustituyendo
`TU_API_KEY` por la de `js/firebase-config.js`:

```
https://firestore.googleapis.com/v1/projects/TU_PROJECT_ID/databases/(default)/documents/progreso?key=TU_API_KEY
```

- **`does not exist` / `NOT_FOUND`** → la base no está donde el SDK la busca:
  o no se creó, o es de **edición Enterprise**. Solución: paso 4, crea una base
  **Standard**.
- **`PERMISSION_DENIED`** → la base existe y las reglas están protegiendo los
  datos. Ese es el resultado correcto; el problema estará en el navegador.
- **Error de conexión** → no hay red o algo la bloquea.

**2. Algo en el navegador corta las conexiones a Google.** Esta causa solo
aplica si la comprobación anterior dio `PERMISSION_DENIED`:

1. **Bloqueadores de anuncios o de rastreadores.** uBlock Origin, AdGuard, las
   protecciones de Brave u **Opera GX** (que tiene dos ajustes separados: el
   bloqueador de anuncios y el de rastreadores). El SDK de Firestore usa
   conexiones persistentes, y esos filtros las cortan aunque dejen pasar las
   peticiones normales. **Prueba en una ventana de incógnito (Ctrl+Shift+N).**
2. **Antivirus con escudo web** (Avast, Kaspersky, ESET, Norton).
3. **La red**: la de la escuela, una VPN o un proxy bloqueando dominios de Google.
4. **Estar sin conexión.** La página de diagnóstico lo indica en la fila «El
   navegador dice estar».

La página de diagnóstico incluye un sondeo directo a `firestore.googleapis.com`,
así que sabrás si la red llega a Google o si el bloqueo está en tu equipo.

---

## 11. Límites del plan gratuito que conviene conocer

Verificados en la documentación de Firebase (plan Spark, sin costo):

| Operación | Límite gratuito |
|---|---|
| Creación de cuentas | 100 por hora **por dirección IP** |
| Cuentas registradas | Ilimitadas |
| Cuentas anónimas | 100 millones |
| Correos de verificación | 1,000 por día |
| Correos de restablecer contraseña | 150 por día |
| Acceso con vínculo por correo | **5 por día** ← por eso no lo usamos |

Notas prácticas para un aula:

- Toda la escuela suele salir a internet por **una sola dirección IP**. Con 100
  cuentas por hora tienes margen para una clase completa, pero si prevés varias
  clases registrándose el mismo día, puedes subir el límite temporalmente desde
  la consola de Firebase.
- **No** diseñes nada basado en «entrar con un enlace mágico por correo»: solo
  hay 5 al día.
- El acceso por **teléfono (SMS)** requiere el plan de pago. Por eso el modo
  invitado es la solución para los alumnos sin correo electrónico.

---

## 12. Qué se guarda de cada alumno

Únicamente:

- el correo electrónico (o nada, si juega como invitado),
- el nombre que escriba, si decide escribirlo,
- su progreso de juego y sus puntajes.

**No** se guarda nada más: ni ubicación, ni datos del dispositivo, ni analíticas
con fines publicitarios.

Si vas a usar esto con menores de edad en un aula, conviene que la escuela tenga
un **aviso de privacidad** que explique esto a los alumnos y a sus tutores.
Guardar tú los datos te convierte en responsable de ellos.
