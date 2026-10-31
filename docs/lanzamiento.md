# Lanzamiento y distribución (beta con APK)

Cómo se construye, se reparte y se revierte una versión de la app. Es para **personas mantenedoras**: usa la cuenta de Expo y toca el proyecto real de Supabase. Hoy el reparto es por APK a un grupo cerrado de testers; no hay publicación en tiendas ni actualizaciones OTA todavía.

> Lo que no está montado aún (nombre de paquete definitivo, actualizaciones OTA, reporte de fallos) y qué lo bloquea está en la lista de pendientes del final.

## Perfiles de build (`eas.json`)

| Perfil | Para qué | Quién lo usa |
|---|---|---|
| `development` | App de desarrollo (`expo-dev-client`): se conecta a `npm start` | Desarrolladores, nunca testers |
| `preview` | APK normal, sin servidor: el que se reparte a testers. Sube el número de versión solo en cada build | Testers |
| `production` | Para las tiendas. **No está configurado ni se usa** | — |

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

## Si algo sale mal

- **La app nueva falla:** pide a los testers volver a instalar el APK anterior: guarda siempre el APK que repartes, porque los builds de EAS no se conservan para siempre. No hay forma de revertir a distancia hasta que existan las actualizaciones OTA.
- **Una migración sale mal:** usa su script de reversa de `supabase/rollbacks/` si existe. Para una migración nueva, escribe y prueba la reversa **antes** de aplicarla.
- **Un dato se corrompe:** depende de las copias de seguridad de Supabase. Confirma cuáles tiene el plan del proyecto *antes* de necesitarlas (pendiente abajo).

## Qué falta para un lanzamiento cómodo

Cada punto necesita una decisión o una acción de una persona mantenedora:

| Pendiente | Por qué importa | Qué lo bloquea |
|---|---|---|
| Nombre de paquete definitivo (hoy `com.anonymous.gymbroapp`) | Cambiarlo después obliga a reinstalar y rompe la firma | Decidir el identificador antes de repartir |
| Actualizaciones OTA (`expo-updates`, canales) | Corregir JavaScript sin que cada tester instale un APK | Reconstruir la app de desarrollo |
| Reporte de fallos | Enterarse de cuándo se cae la app en el teléfono de alguien | Una cuenta del servicio y reconstruir |
| Paquetes de Expo al día (`npx expo install --check`) | Cierra avisos de seguridad y permite soltar el pin de `jest-expo` | Reconstruir y probar en un teléfono |
| Política de privacidad y términos reales | La pantalla de registro hoy menciona documentos que no existen | Redactarlos y publicarlos |
| Copias de seguridad y contraseñas filtradas en Supabase | Proteger las cuentas reales | Revisar el plan y activar el ajuste en el Dashboard |

El detalle y la prioridad de cada uno están en el plan de buenas prácticas del proyecto; esta lista es la parte que afecta a repartir versiones.
