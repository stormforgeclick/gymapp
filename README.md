# gymapp

## Qué comando uso

| Quiero... | Comando | Cuándo |
|---|---|---|
| Programar con recarga en vivo | `npm start` | Todos los días. Abre la app "dev" ya instalada en el teléfono. |
| Instalar la app **dev** (APK con herramientas de desarrollo) | `npm run build:dev` | Una vez, y otra vez solo si cambias algo nativo (instalar una librería con código nativo, tocar `app.json`, subir de SDK). |
| Una app **normal** para usar o compartir sin la PC (APK) | `npm run build:preview` | Cuando quieres probar la app "de verdad" o pasársela a alguien. |
| Subir a Google Play / App Store | _(todavía no)_ | Requiere cuenta de Google Play Developer / Apple Developer. |

Los builds se hacen en la nube de Expo (EAS) y tardan unos minutos. Al terminar, la terminal muestra un enlace y un QR; abre el enlace en el teléfono Android para descargar e instalar el APK. Si Android pide permiso para instalar apps de origen desconocido, acéptalo.

**Regla simple:** JS/TS cambia → `npm start`, no rebuild. Algo nativo cambia → `npm run build:dev`. Quieres la app final → `npm run build:preview`.

## Primera vez

1. `npm install --global eas-cli` y `eas login` (cuenta de expo.dev).
2. Cargar las variables de Supabase **una vez por entorno**. El archivo `.env` no se sube a la nube, así que los builds no lo ven. Copia los valores de tu `.env` (solo las dos `EXPO_PUBLIC_*`):

   ```
   eas env:set --name EXPO_PUBLIC_SUPABASE_URL --value <url> --environment development --visibility plaintext
   eas env:set --name EXPO_PUBLIC_SUPABASE_URL --value <url> --environment preview --visibility plaintext
   eas env:set --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon-key> --environment development --visibility plaintext
   eas env:set --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon-key> --environment preview --visibility plaintext
   ```

   Nunca subas `SUPABASE_SERVICE_ROLE_KEY` ni `OPENAI_API_KEY` como variables `EXPO_PUBLIC_*`: todo lo que va en la app se puede extraer.
3. `npm run build:dev` e instala el APK; luego `npm start`.

## Perfiles (`eas.json`)

- `development`: APK con `expo-dev-client`, se conecta a `npm start`.
- `preview`: APK normal, sin servidor de desarrollo. Sube el número de versión solo en cada build para poder instalarlo encima del anterior.
- `production`: para las tiendas; hoy no se usa.
- `development-simulator`: solo para el simulador de iOS en un Mac.

## Pruebas

No hay Jest por ahora. Hay dos tipos de pruebas:

### De punta a punta (Maestro + emulador Android)

Abren la app real, entran con una cuenta de pruebas y la usan: pestañas, crear una rutina con ejercicios y reordenarlos arrastrando (el orden se comprueba también después de reabrir la app).

1. Instala [Maestro](https://docs.maestro.dev/getting-started/installing-maestro/windows) (Java 17 o más). El script lo busca en `~/maestro/bin` o en el PATH; si está en otro lugar, define `MAESTRO_BIN`.
2. Arranca el emulador (`emulator -avd Medium_Phone_API_35`) o conecta un teléfono con depuración USB.
3. Instala un build **release** (lleva el JavaScript dentro, no necesita `npm start`): `npx expo run:android --variant release`. Hazlo otra vez cuando cambies código de la app.
4. `npm run e2e` corre todo; `npm run e2e -- smoke` (o `routine-crud`, `reorder`) corre uno solo.

La cuenta `e2e@gymbro.test` vive en el proyecto real de Supabase; `npm run e2e:user` la crea y guarda sus credenciales en `.maestro/.env.e2e` (ignorado por git; usa `SUPABASE_SERVICE_ROLE_KEY` de tu `.env`). Cada prueba crea una rutina "E2E …" y la elimina al terminar.

Maestro no sabe mantener presionado y arrastrar, así que `scripts/e2e.ts` hace el arrastre con `adb shell input draganddrop` y lee el orden de las tarjetas con `uiautomator dump`.

### De base de datos (`supabase/tests/`)

SQL que comprueba las reglas que protegen los datos: privacidad por split, reordenar, archivar rutinas, gymbros y qué puede hacer un usuario sin sesión. Cada archivo crea sus propios usuarios dentro de una transacción y termina con `ROLLBACK_TEST`, así que no deja nada: un error que empieza con `ROLLBACK_TEST` significa que **todo pasó**; cualquier otro error es un fallo.

Se corren con `psql -f` (primero `_helpers.sql`, en la misma sesión que el archivo) o pidiéndoselo a Claude, que los ejecuta por el conector de Supabase.
