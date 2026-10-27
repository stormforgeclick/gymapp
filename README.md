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
