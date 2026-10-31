# Empezar (tu primer día)

Al terminar tendrás el proyecto instalado, una base de datos **propia** corriendo en tu equipo y las pruebas en verde. No necesitas ninguna clave del proyecto real.

> **Verificado con:** Windows 11, Node 24, npm 11 y 12, Supabase CLI 2.122, Docker 28. Los pasos que no se pudieron comprobar en un teléfono llevan la etiqueta **No verificado en dispositivo**.

## 1. Requisitos

- **Git**.
- **Node.js 24** (la versión está en `.nvmrc`, que la CI también usa) con npm. Comprueba con `node --version`; con `nvm` basta `nvm use`.
- **Docker Desktop**, abierto y corriendo: la base de datos local vive en contenedores.
- Para ver la app en pantalla (paso 6): un teléfono Android o un emulador de Android Studio. Para los pasos 1 a 5 no hace falta.

No instales el CLI de Supabase por tu cuenta: viene en las dependencias del proyecto y se usa con `npx supabase`.

## 2. Clonar e instalar

```
git clone https://github.com/stormforgeclick/gymapp.git
cd gymapp
npm ci
```

`npm ci` instala exactamente las versiones del `package-lock.json`. Puede tardar varios minutos. Los avisos `npm warn install-scripts` y los de `react-reconciler` son esperados (ver [problemas-conocidos.md](problemas-conocidos.md)).

## 3. Levantar tu base de datos

```
npx supabase start -x studio,imgproxy,edge-runtime,logflare,vector,mailpit,realtime,storage-api,supavisor
```

La primera vez descarga las imágenes de Docker (varios minutos). Después aplica las migraciones de `supabase/migrations/` y el seed de `supabase/seed.sql`, y al final imprime las direcciones y claves de tu base local. Para volver a verlas:

```
npx supabase status -o env
```

Apágala al terminar con `npx supabase stop`. Si algo queda raro, `npx supabase db reset` la deja como nueva. Más detalles en [base-de-datos.md](base-de-datos.md).

## 4. Variables de entorno

```
cp .env.example .env
```

(En PowerShell: `Copy-Item .env.example .env`.) Edita `.env`:

- `EXPO_PUBLIC_SUPABASE_URL`: la dirección de tu base **vista desde el dispositivo que corre la app**. Un emulador de Android usa `http://10.0.2.2:54321`. Un teléfono usa la IP de tu PC en la red local (`http://<IP>:54321`).
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: el valor de `ANON_KEY` que imprime `npx supabase status -o env`.

`.env` está ignorado por git. No pongas ahí claves del proyecto real.

## 5. Comprobar que todo funciona

```
npm test
npm run test:db
npx tsc --noEmit
npm run lint
```

Si las cuatro pasan, tu entorno está bien. `npm test` y `npx tsc` no necesitan la base; `npm run test:db` sí (paso 3).

También se probó contra la base local, con peticiones directas a su API: registrar una cuenta, entrar, crear una rutina y listarla funcionan. En local **no se pide confirmar el correo**.

## 6. Ver la app en pantalla

La app usa `expo-dev-client`: **no funciona con Expo Go**. Necesita una "app de desarrollo" instalada en el dispositivo, que se construye una vez y se reutiliza mientras no cambie nada nativo. Hay dos caminos:

**A. En la nube con EAS.** Necesitas que una persona mantenedora te dé acceso al proyecto de Expo.

```
npm install --global eas-cli
eas login
npm run build:dev
```

Al terminar, la terminal muestra un enlace para descargar el APK; ábrelo en el teléfono Android e instálalo.

**B. En tu equipo.** `npm run android` compila e instala la app (`expo run:android`). Requiere Android Studio (con su SDK) y el JDK que pida Expo para esta versión: sigue <https://docs.expo.dev/get-started/set-up-your-environment/>. **No verificado aquí.**

Con la app de desarrollo instalada:

```
npm start
```

Abre la app de desarrollo en el dispositivo y conéctate al servidor que muestra la terminal. Expo lee tu `.env` al empaquetar el JavaScript, así que si lo cambias reinicia `npm start` (con `-c` si no ves el cambio). Crea tu cuenta desde la pantalla de registro.

Cosas a tener en cuenta:

- La app de desarrollo es una compilación *debug* y Android permite en ella hablar por `http` con tu PC (el `AndroidManifest` de debug lo habilita). Una app `preview` o de producción **no** podría. **No verificado en dispositivo.**
- Un teléfono físico necesita estar en la misma red que tu PC y que el firewall deje pasar el puerto 54321. **No verificado en dispositivo.**
- Las imágenes y GIF de los ejercicios se descargan del Storage público del proyecto real aunque tu base sea local.
- Cambiar código de JavaScript o TypeScript no requiere reconstruir la app; instalar una librería con código nativo o tocar `app.json` sí (`npm run build:dev`).

## 7. Y ahora

- Para entender cómo está organizado el código: [arquitectura.md](arquitectura.md).
- Para tocar la base de datos: [base-de-datos.md](base-de-datos.md).
- Para escribir pruebas y entender la CI: [pruebas.md](pruebas.md).
- Para mandar tu primer PR: [CONTRIBUTING.md](../CONTRIBUTING.md).
- Si algo falla: [problemas-conocidos.md](problemas-conocidos.md).
