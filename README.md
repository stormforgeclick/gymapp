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

Hay tres tipos de pruebas:

### Unitarias (Jest)

`npm test` corre todo; `npm run test:watch` vuelve a correr al guardar; `npx jest src/lib` corre una carpeta o archivo.

Cubren la lógica que no depende de la pantalla: funciones puras (`src/lib/`, `utils/`), validaciones, la traducción de textos, los cambios optimistas del caché de React Query (`hooks/api/*/cache.ts`) y los hooks, con `@testing-library/react-native`.

- Los archivos van en una carpeta `__tests__/` junto al código y terminan en `.test.ts(x)`. **Nunca dentro de `src/app/`**: Expo Router lo tomaría como una ruta.
- Los datos de ejemplo salen de `src/test-utils/factories.ts`.
- Para algo nuevo: escribe primero la prueba, mira que falle por la razón correcta y luego escribe el código mínimo para que pase (TDD). Si la lógica está dentro de una pantalla, sácala a una función pura y pruébala ahí.
- `jest-expo` está fijado en `57.0.4` (sin `~`): la `57.0.6` pide `react-native@0.86.3` y esta app usa `0.86.2`. Súbelo junto con React Native, en el mismo cambio que requiere reconstruir la app.

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

Corren contra una base **local** (Docker), no contra producción:

```
npx supabase start -x studio,imgproxy,edge-runtime,logflare,vector,mailpit,realtime,storage-api,supavisor   # una vez por sesión
npx supabase db reset      # base limpia: migraciones + seed pequeño (supabase/seed.sql)
npm run test:db            # todas; `npm run test:db -- rpc_flows` corre solo las que contengan ese texto
```

`scripts/test-db.ts` envía `_helpers.sql` más cada archivo a `psql` dentro del contenedor `supabase_db_gymapp`.

#### Cambiar el esquema (TDD)

1. Escribe primero la prueba en `supabase/tests/` y mira que falle (`npm run test:db`).
2. `npx supabase migration new nombre` y escribe la migración en `supabase/migrations/`.
3. `npx supabase db reset` y `npm run test:db`: todo en verde.
4. `npm run db:types` para regenerar `src/types/database.ts`, y `npx tsc --noEmit`.
5. Aplicar a producción (`npx supabase db push`) se hace aparte y solo después de revisar la migración. No apliques migraciones por el conector de Supabase: no quedarían en el repo.

- `supabase/migrations/20261030000000_baseline.sql` es el esquema de producción a esa fecha (las 24 migraciones anteriores nunca estuvieron en el repo). Los cambios nuevos van en migraciones posteriores.
- `supabase/seed.sql` es un **subconjunto pequeño** del catálogo (las tablas de apoyo completas y 40 ejercicios) porque el repo es público: no lleva datos de usuarios ni la tabla `exercises` (la fuente de importación, que nadie lee por la API; solo conserva `id` y `name` por una clave foránea). `scripts/__tests__/seed.test.ts` lo vigila.
- Para trabajar en local con el catálogo completo (1324 ejercicios), pon el volcado en `supabase/seed.full.sql` (git lo ignora) y apunta `[db.seed] sql_paths` de `supabase/config.toml` a ese archivo. `supabase db dump --data-only` también trae `auth.*` y `storage.*`; quédate solo con las tablas del catálogo y conviértelo a `INSERT`, porque `db reset` no puede leer `COPY ... FROM stdin`.
- `src/types/database.ts` está generado. Los resultados de funciones que devuelven `TABLE(...)` salen con todas las columnas como no nulas y las `jsonb` como `Json`, por eso algunos `queries.ts` conservan un `as` hacia el tipo escrito a mano.

## Integración continua

`.github/workflows/ci.yml` corre en cada push a `main` y en cada pull request, con dos trabajos en paralelo:

- **`app`**: `npx tsc --noEmit`, `npm run lint` y `npm test -- --ci`. No necesita secretos ni red.
- **`database`**: levanta Supabase local en Docker (`npx supabase start`, con las migraciones y el seed pequeño), corre `npm run test:db` y comprueba que `src/types/database.ts` esté al día (`npm run db:types` no debe dejar cambios en git). Nunca toca producción.

Para reproducirlo en local, corre esos mismos comandos. Si la comprobación de tipos falla, regenera con `npm run db:types` y commitea el resultado. Para exigir que `app` y `database` pasen antes de hacer merge: Settings → Branches → Branch protection rules → *Require status checks to pass*.
