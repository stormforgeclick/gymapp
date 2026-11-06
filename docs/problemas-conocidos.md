# Problemas conocidos

Trampas que ya nos mordieron, con su síntoma, su causa y qué hacer. Si encuentras una nueva, agrégala aquí en el mismo PR que la arregla.

## Instalación y herramientas

**`npm install` falla con `ERESOLVE` al subir `react-native` o `jest-expo`.**
`jest-expo` y `react-native` se piden entre sí la misma versión de `@react-native/jest-preset`. Súbelos juntos con `npx expo install --fix` y, si npm sigue sin resolver, instala esa dependencia con la versión de React Native: `npm install --save-dev @react-native/jest-preset@<versión de react-native>`. No uses `--legacy-peer-deps`. Ver [decisiones.md](decisiones.md#4-los-paquetes-que-gobierna-expo-se-actualizan-juntos-con-npx-expo-install).

**`npx expo install … --dev` deja la librería en `dependencies`.**
Para herramientas de desarrollo usa `npm install --save-dev <paquete>`.

**Aviso `peer react@"^19.3.0"` de `test-renderer` / `react-reconciler`.**
Lo trae Testing Library 14 y la app usa React 19.2. npm lo deja pasar y las pruebas funcionan. Si algún día una prueba de hooks o componentes se comporta de forma rara, empieza por ahí.

**Avisos `npm warn install-scripts … esbuild, unrs-resolver`.**
npm bloquea scripts de instalación que aún no aprobaste. `tsx` y Jest funcionan igual; no hace falta hacer nada.

**Windows: "Filename too long" al borrar `node_modules` o una copia del proyecto.**
Las rutas de `node_modules` superan el límite. En PowerShell: `Remove-Item -LiteralPath '\\?\C:\ruta\a\la\carpeta' -Recurse -Force`.

**El build de EAS se corta con `Runtime version mismatch`.**
EAS calcula la huella del código nativo ([OTA](lanzamiento.md#actualizaciones-ota-sin-reinstalar)) en tu equipo y otra vez en sus servidores, y corta el build si no coinciden. El error trae un diff con el archivo que cambia: su `filePath` dice en qué paquete de `node_modules` tu copia no es la publicada. El 2026-11-06 pasó con `@react-native-masked-view/masked-view`: a su `android/src/main/AndroidManifest.xml` le faltaba el atributo `package` que trae el paquete original (quién lo quitó no se averiguó). EAS instala desde cero, así que no lo tenía. Las carpetas `android/build` de una compilación local **no** son la causa: Expo ya las ignora. Arreglo: `npm ci`, que deja `node_modules` como lo publican los paquetes. Para comprobarlo sin gastar un build: `npx expo-updates fingerprint:generate --platform android` debe dar el mismo hash que EAS dice haber calculado.

**Git avisa "CRLF will be replaced by LF".**
Es normal: `.gitattributes` fuerza finales de línea LF en el repo. No hace falta tocar nada.

**Variables de entorno en la terminal.**
En PowerShell se escribe `$env:NOMBRE="valor"; comando`; la forma `NOMBRE=valor comando` es de bash y falla con "no se reconoce como nombre de un cmdlet".

## Supabase local

**`npx supabase start` falla: no encuentra el daemon de Docker.**
Docker Desktop no está abierto. Ábrelo, espera a que diga que está corriendo y reintenta.

**El puerto 54321 o 54322 ya está en uso.**
Tienes otra base local de Supabase corriendo (de otro proyecto). Apágala con `npx supabase stop` en ese proyecto.

**`db reset` falla con `COPY from stdin failed: No source stream defined`.**
Un seed no puede usar `COPY … FROM stdin`; tiene que ser `INSERT`. Ver [base-de-datos.md](base-de-datos.md).

**Una llamada falla con `function public.is_gymbro(...) does not exist`.**
Las funciones auxiliares (`is_gymbro`, `is_admin`, `owns_routine`, `can_view_*`…) se movieron al esquema `private`. Usa `private.is_gymbro(...)`.

**Los tipos generados dicen que una columna no es nula y sí lo es.**
Las funciones `RETURNS TABLE(…)` salen con todas las columnas como no nulas. Por eso algunos `queries.ts` castean al tipo escrito a mano. Ver [base-de-datos.md](base-de-datos.md#tipos-generados).

## Producción (solo mantenedores)

**`supabase db dump --linked` falla con `DbConfigLoginRoleStatusError` (403).**
La cuenta del CLI no puede crear el rol temporal. Pasa la contraseña de la base: `-p` en los comandos que lo admiten, o la variable `SUPABASE_DB_PASSWORD`.

**El CLI falla con "IPv6 is not supported on your current network".**
Usó la conexión directa en lugar del pooler. Corre `npx supabase link --project-ref <ref>` o, si usas `--workdir`, copia también `supabase/.temp/` a esa carpeta.

**`supabase projects list` no muestra `gymbro`.**
El CLI está logueado con otra cuenta. `npx supabase logout` y `login` con la cuenta correcta; el navegador reutiliza la sesión abierta de supabase.com, así que cierra esa sesión o usa una ventana privada.

**`db push` dice que el historial remoto no coincide con `supabase/migrations/`.**
No fuerces nada. El historial de producción se alineó el 2026-10-31 y solo debe diferir por migraciones nuevas aún sin aplicar. Si hay otra diferencia, alguien cambió producción por fuera: consulta antes de reparar.

**Un volcado `supabase db dump --data-only` contiene cuentas reales.**
Trae `auth.*` y `storage.*`. Nunca lo metas al repo; mira [base-de-datos.md](base-de-datos.md) para el seed.

## La app

**La app de desarrollo pide reconstruirse.**
Instalaste una librería con código nativo o cambiaste `app.json`. Corre `npm run build:dev` otra vez. Para cambios de JavaScript o TypeScript basta con `npm start`.

**Una prueba dentro de `src/app/` aparece como ruta.**
Expo Router trata todo archivo de `src/app/` como una ruta. Las pruebas van en `__tests__/` junto al código, fuera de `src/app/`.

**Una actualización OTA no llega al teléfono.**
Lo más probable es que la huella nativa (*fingerprint*) del build instalado y la del momento de publicar no coincidan: se instaló una librería nativa, se cambió `app.json` o `eas.json`, o se actualizó el SDK después de construir. Compara `npx expo-updates fingerprint:generate --platform android` con el build y, si cambió, construye de nuevo. Ver [lanzamiento.md](lanzamiento.md#actualizaciones-ota-sin-reinstalar).
