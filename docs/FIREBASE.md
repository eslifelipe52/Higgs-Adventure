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

1. Menú lateral: **Compilación → Firestore Database**.
2. Pulsa **Crear base de datos**.
3. Elige **Modo de producción** (las reglas del paso siguiente se encargan de todo).
4. Ubicación: la que te proponga; `us-central1` o `southamerica-east1` funcionan bien.

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
| «El proveedor no está habilitado» | No activaste el método de acceso | Paso 3 |
| «Este dominio no está autorizado» | Falta tu dominio en la lista | Paso 6 |
| «No se pudo descargar el SDK de Firebase» | Sin internet, o la versión del SDK cambió | Revisa la conexión; si persiste, actualiza `FIREBASE_SDK_VERSION` en `js/firebase-config.js` |
| Las cuentas no aparecen y el perfil dice «Progreso local» | La configuración sigue con `PEGA_AQUI` | Paso 2 |
| Todo funciona pero al recargar no hay progreso | Las reglas rechazan la escritura | Paso 5 |
| «Demasiados intentos seguidos» | Límite de seguridad de Firebase | Espera unos minutos |
| La página se queda en «Comprobando…» | Se abrió con `file://` | Paso 6 |

### El error más habitual

El «modo de producción» de Firestore, que es el que se elige al crearla, **deja
la base cerrada a todo el mundo** por defecto. Es una decisión de seguridad
correcta, pero significa que hasta que no pegues `firestore.rules` y pulses
**Publicar**, el acceso funciona (las cuentas viven en otro servicio) pero
**nada se guarda**: ni el progreso ni los logros.

El síntoma exacto es este:

- En **Authentication → Users** sí aparece el usuario (anónimo al principio).
- En **Firestore → Datos** no hay ninguna colección `progreso`.
- El perfil muestra «Jugando como invitado», pero el progreso no viaja.

Si ves eso, es el paso 5. Vuelve a pegarlo y publica.

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
