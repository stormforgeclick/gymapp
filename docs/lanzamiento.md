# Lanzamiento y distribución (beta con APK)

Cómo se construye, se reparte y se revierte una versión de la app. Es para **personas mantenedoras**: usa la cuenta de Expo y toca el proyecto real de Supabase. Hoy el reparto es por APK a un grupo cerrado de testers; no hay publicación en tiendas ni actualizaciones OTA todavía.

> Lo que falta para un lanzamiento cómodo (reporte de fallos con Sentry, política de privacidad, copias de seguridad) está en la lista de pendientes del final.

## Perfiles de build (`eas.json`)

| Perfil | Canal OTA | Para qué | Quién lo usa |
|---|---|---|---|
| `development` | — | App de desarrollo (`expo-dev-client`): se conecta a `npm start` | Desarrolladores, nunca testers |
| `preview` | `preview` | APK normal, sin servidor: el que se reparte a testers. Sube el número de versión solo en cada build | Testers |
| `production` | `production` | Para las tiendas. **No se usa todavía** | — |

La app es `com.stormforgeclick.gymbro`, del proyecto `@stormforge/gymbro-app` en Expo (organización `stormforge`). El nombre de paquete **no se cambia** una vez repartido un APK.

## Antes de construir

1. `main` actualizada y con la CI en verde (`app`, `database` y CodeQL).
2. `npx expo-doctor` sin fallos nuevos.
3. Las variables `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` del entorno `preview` de EAS apuntan al proyecto real (los pasos están en [README.md](../README.md#primera-vez-con-eas-mantenedores)). Un APK `preview` es una compilación de lanzamiento: Android bloquea ahí el tráfico `http`, así que no se usa con una base local.
4. Si hay migraciones nuevas, ya están aplicadas en producción (ver siguiente sección). La app nueva nunca debe salir antes que la base que necesita.

## Orden cuando hay cambios de base de datos

La base y la app no se actualizan a la vez: los testers siguen con la versión vieja hasta que instalen la nueva. Por eso:

1. **Primero la migración, compatible con la app vieja.** Agrega columnas o funciones; no borres ni renombres nada que la versión repartida todavía use.
2. Aplícala con las reglas de [base-de-datos.md](base-de-datos.md#producción): revisión en el PR, prueba local, `db push --dry-run` y luego `db push`.
3. **Después** construye y reparte la app que usa lo nuevo.
4. Cuando ya nadie use la versión vieja, una migración posterior limpia lo que sobra.

## Construir y repartir

```
npm run build:preview
```

El build se hace en la nube de Expo y tarda unos minutos. Al terminar, la terminal muestra un enlace y un QR para descargar el APK. Se lo pasas a los testers; en Android tienen que permitir la instalación de apps de origen desconocido.

Como `preview` sube el número de versión en cada build, un APK nuevo se instala **encima** del anterior sin perder los datos de la app, siempre que sea el mismo paquete y la misma firma. Por eso el nombre de paquete no debe cambiar una vez repartido.

Acompaña cada reparto de una nota breve (un GitHub Release o un mensaje) con qué cambia y qué conviene probar.

## Actualizaciones OTA (sin reinstalar)

Un arreglo que solo toca JavaScript, estilos, textos o imágenes llega a los teléfonos sin un APK nuevo:

```
npm run update:preview -- --message "qué cambia"
```

(Sin `--message`, EAS te lo pregunta.) El teléfono la descarga al abrir la app y la aplica la **segunda** vez que se abre.

- **Solo Android, a propósito.** `eas update` exporta todas las plataformas si no se le dice otra cosa, y la exportación web renderiza la app en Node, donde el cliente de Supabase busca `window` y falla (`ReferenceError: window is not defined`). La app no se publica en la web, así que el script ya trae `--platform android`. Si lo escribes a mano, no te olvides de ese parámetro.

- **Solo encaja con builds de la misma base nativa.** Cada build lleva un *fingerprint* (una huella de su código nativo) y una actualización solo se ofrece a los que coinciden. Si instalas una librería con código nativo, cambias `app.json`, `eas.json` o actualizas el SDK, la huella cambia y hace falta un **build nuevo** antes de publicar actualizaciones.
- **Para ver la huella actual:** `npx expo-updates fingerprint:generate --platform android`. La carpeta `android/` generada en tu equipo y los scripts de `package.json` no cuentan (ver `.fingerprintignore` y `fingerprint.config.js`), para que tu máquina y EAS calculen lo mismo. En cambio **`.gitignore` sí cuenta**: añadir o quitar una línea cambia la huella aunque no toque el código nativo.
- **Publica desde el mismo commit del build.** Una actualización publicada desde un estado con otra huella se sube sin error pero no se entrega al APK instalado. La salida de `eas update` muestra su *Runtime version*; debe ser la del build.
- **Cambios de base de datos primero:** la misma regla de orden de arriba. Una actualización OTA con código que espera una columna que aún no existe rompe a quien la reciba.
- **Si el build se corta con `Runtime version mismatch`**, tu `node_modules` no es el de una instalación limpia: corre `npm ci` y revisa [problemas-conocidos.md](problemas-conocidos.md#instalación-y-herramientas).
- **Verificado el 2026-11-06:** con un `node_modules` limpio, la huella de Android calculada aquí coincide con la que EAS calculó en sus servidores.
- **No verificado en dispositivo:** que un teléfono reciba la actualización. Se comprueba con la primera actualización de prueba.
- **Pendiente, sin resolver:** los mapas de código de Sentry se suben al compilar un build, pero una actualización OTA trae JavaScript nuevo y sus errores llegarían a Sentry sin símbolos legibles hasta que se suban también sus mapas. Se revisa en la documentación de Sentry cuando la primera actualización llegue a un teléfono.

## Reporte de fallos (Sentry)

Los builds `preview` y `production` envían a Sentry los errores inesperados; el de desarrollo no (ahí salen por la consola). Es la organización `stormforge-p0` (región de EE. UU.) y el proyecto `gymbroapp`.

- **Qué se envía:** el error, de dónde viene (consulta, mutación o pantalla rota) y la clave de la consulta. No se envían datos personales ni trazas de rendimiento. Los errores que la app ya explica a la persona (una rutina vacía, un nombre repetido…) no se reportan.
- **Dos variables de EAS** por entorno (las pone una persona mantenedora, una sola vez):

  ```
  eas env:set --name EXPO_PUBLIC_SENTRY_DSN --value <DSN> --environment preview --visibility plaintext
  eas env:set --name SENTRY_AUTH_TOKEN --value <token> --environment preview --visibility sensitive
  ```

  El DSN está en Sentry, *Project Settings → Client Keys (DSN)*; solo permite enviar eventos. El token es de organización (*Settings → Developer Settings → Auth Tokens*), es **secreto** y lo usa el build para subir los mapas de código. Repite lo mismo con `--environment production` cuando ese perfil se use.
- **Sin DSN** la app funciona igual y no reporta nada. **Sin el token**, el build `preview` puede fallar en el paso de subir los mapas.
- **Cómo comprobarlo** (**no verificado en dispositivo**): construir un `preview`, instalarlo y abrir la app; en Sentry debe aparecer la sesión de esa versión. Para provocar un error real sin tocar el código, abrir un enlace con un id inválido: `adb shell am start -a android.intent.action.VIEW -d "gymbroapp://exercises/xyz"`. La consulta del ejercicio falla, la pantalla muestra su estado de error y el fallo debe llegar a Sentry.

## Si algo sale mal

- **La app nueva falla:** si el arreglo es de JavaScript, publica una actualización OTA con el arreglo (o con la versión anterior del código). Si no, pide a los testers volver a instalar el APK anterior: guarda siempre el APK que repartes, porque los builds de EAS no se conservan para siempre. No hay forma de revertir a distancia hasta que existan las actualizaciones OTA.
- **Una migración sale mal:** usa su script de reversa de `supabase/rollbacks/` si existe. Para una migración nueva, escribe y prueba la reversa **antes** de aplicarla.
- **Un dato se corrompe:** el plan Free de Supabase no hace copias automáticas, así que depende de la última copia manual que hayas hecho (ver [Copias de seguridad](base-de-datos.md#copias-de-seguridad)). Haz una antes de cada migración en producción.

## Qué falta para un lanzamiento cómodo

Cada punto necesita una decisión o una acción de una persona mantenedora:

| Pendiente | Por qué importa | Qué lo bloquea |
|---|---|---|
| Reporte de fallos (Sentry) | Enterarse de cuándo se cae la app en el teléfono de alguien | El código y la configuración ya están. Falta poner `EXPO_PUBLIC_SENTRY_DSN` y `SENTRY_AUTH_TOKEN` en EAS, construir un `preview` y comprobar que llega un error |
| Reconstruir la app de desarrollo y probarla en un teléfono | Cambió el paquete de Android y el SDK de Expo se actualizó: hasta que se construya y se pruebe, nada de esto está verificado en un dispositivo | Hacer `npm run build:dev` e instalar el APK nuevo |
| Política de privacidad y términos reales | La pantalla de registro hoy menciona documentos que no existen | Redactarlos y publicarlos |
| Copias de seguridad automáticas y contraseñas filtradas | Proteger las cuentas reales | Las dos son del plan Pro de Supabase. Mientras tanto, la copia manual está documentada y probada en local (falta ensayarla en un proyecto nuevo); lo de las contraseñas es un riesgo aceptado ([decisión 7](decisiones.md#7-avisos-del-asesor-de-supabase-que-se-aceptan)) |

El detalle y la prioridad de cada uno están en el plan de buenas prácticas del proyecto; esta lista es la parte que afecta a repartir versiones.
