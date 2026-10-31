# Arquitectura

Cómo está armada la app y dónde poner cada cosa. Si es tu primer día, haz antes [empezar.md](empezar.md).

## Qué es Gymbro

Una app móvil para planear y registrar entrenamientos de gimnasio, con una capa social. Estos son los conceptos que verás en el código:

| Concepto | Qué es |
|---|---|
| **Split** | Un plan de entrenamiento (por ejemplo "Push/Pull/Legs"). Cada persona tiene varios y **uno activo**. Tiene privacidad propia. |
| **Rutina** | Un día del split. Tiene un color, un orden y una lista de ejercicios. |
| **Ejercicio de rutina** y **serie** | Un ejercicio del catálogo dentro de una rutina, con sus series planeadas (repeticiones y peso). |
| **Entrenamiento** (`workout`) | Una sesión real. Se crea copiando una rutina y se va completando serie por serie. Solo puede haber uno sin terminar por persona. |
| **Gymbro** | Un amigo: se envía una solicitud, se acepta, y entonces se pueden ver rutinas compartidas. |
| **Catálogo** | Los ~1300 ejercicios con nombre, músculos, equipo, imagen y GIF, en español e inglés. |
| **Privacidad** | `private`, `gymbros` o `public`, tanto en el perfil como en cada split. |

Las tablas de **entrenadores** (`trainer_*`, `user_roles`) existen en la base, pero la app todavía no tiene pantallas para ellas.

## Stack

| Qué | Con qué |
|---|---|
| App | Expo SDK 57, React Native 0.86, React 19 con React Compiler activado |
| Navegación | Expo Router (rutas por archivos, rutas tipadas) |
| Datos del servidor | `@tanstack/react-query` sobre `@supabase/supabase-js` |
| Backend | Supabase: Postgres con RLS y funciones RPC, Auth y Storage (la app sube avatares; las imágenes y GIF del catálogo también se sirven desde ahí) |
| Interfaz | Componentes propios en `src/components/ui`, `@gorhom/bottom-sheet`, `react-native-reanimated`, `react-native-sortables` |
| Lenguaje | TypeScript en modo `strict` |
| Pruebas | Jest + `jest-expo` + Testing Library, pruebas SQL, Maestro (E2E) |

> **Importante:** esta versión de Expo cambió bastante. Antes de escribir código que dependa de Expo, lee la documentación de la versión exacta: <https://docs.expo.dev/versions/v57.0.0/> (lo pide también `AGENTS.md`).

## Mapa del código

```
src/
  app/               Rutas de Expo Router. Archivos finos: importan una vista y nada más.
  views/<Feature>/   Cada pantalla: index.tsx, components/, hooks/, utils/ (solo lo suyo).
  components/ui/     Piezas de interfaz reutilizables: Button, TextField, Sheet, Skeleton…
  hooks/api/<dominio>/
                     Acceso a datos de un dominio: queries.ts + index.tsx (+ cache.ts).
  hooks/             Hooks transversales: tema, useStartRoutineWorkout, useDebounce.
  providers/         Auth, Preferences, Accent, Toast, Dialog.
  i18n/              es.ts (fuente de verdad), en.ts, translate.ts, index.ts (useT).
  lib/               Funciones puras, sin React: color, text, errors, suggestRoutine…
  constants/theme.ts Tokens de diseño: colores, espacios, tipografía.
  types/database.ts  GENERADO desde la base. No se edita a mano.
  test-utils/        Fábricas de datos para pruebas.
```

Regla práctica: **la lógica que se puede probar sin React va a `src/lib` o a un `utils/` junto a la pantalla**, no dentro del componente. Así se prueba con Jest en milisegundos (ver [pruebas.md](pruebas.md)).

## Rutas y pantallas

Las rutas viven en `src/app` y cada una importa su vista de `src/views`:

| Ruta | Vista | Para qué |
|---|---|---|
| `/` | `src/app/index.tsx` | Redirige a `/(tabs)` si hay sesión o a `/login` si no |
| `/login`, `/register` | `Auth/LoginView`, `Auth/RegisterView` | Entrar y crear cuenta |
| `/(tabs)` (Inicio) | `Home` | Rutina sugerida del día |
| `/(tabs)/routines` | `Routines` | Rutinas del split activo y cambio de split |
| `/(tabs)/gymbros` | `Gymbros` | Buscar personas, solicitudes y lista de gymbros |
| `/(tabs)/profile` | `Profile` | Tu perfil y la privacidad de tus splits |
| `/routine/[id]` | `RoutineDetails` | Ejercicios y series de una rutina; arrastrar para reordenar |
| `/workout/[id]` | `Workout` | Entrenamiento en curso |
| `/exercises`, `/exercises/[id]` | `Exercises`, `ExerciseDetails` | Catálogo |
| `/user/[id]` | `UserProfile` | Perfil de otra persona |
| `/shared-routine/[id]` | `SharedRoutine` | Ver e importar una rutina compartida |
| `/settings`, `/edit-profile` | `Settings`, `EditProfile` | Tema, idioma y datos del perfil |

`src/app/(tabs)/_layout.tsx` protege las pestañas: sin sesión redirige a `/login`. Los `testID` de las pestañas y pantallas (`tab-home`, `screen-routines`…) los usa Maestro; no los quites.

### Árbol de providers

`src/app/_layout.tsx` los anida en este orden, de afuera hacia adentro:

```
PreferencesProvider          tema e idioma elegidos, guardados en el dispositivo
  SafeAreaProvider
    ThemeProvider            tema de navegación (claro/oscuro)
      QueryClientProvider    caché de React Query (src/lib/queryClient.ts)
        AuthProvider         sesión de Supabase
          AccentProvider     color de acento = color de la rutina del día
            GestureHandlerRootView
              BottomSheetModalProvider
                ToastProvider    useToast().show(texto, { tone })
                  DialogProvider useDialog().show({ title, message, actions })
                    Stack
```

La app no pinta nada hasta que cargan las fuentes y las preferencias, para no mostrar un destello del tema equivocado.

## Cómo viajan los datos

```
Pantalla (views)
  → hook de dominio      src/hooks/api/<dominio>/index.tsx   useQuery / useMutation
  → función de acceso    src/hooks/api/<dominio>/queries.ts  supabase.rpc(…) o supabase.from(…)
  → Postgres             funciones RPC + políticas RLS (ver base-de-datos.md)
```

- Un **dominio** es `routines`, `splits`, `routineExercises`, `workouts`, `gymbros`, `exercises`, `profile` o `auth`.
- Las claves de React Query incluyen el idioma (`["routines", language]`) porque los nombres vienen traducidos desde la base. **No incluyen el usuario**: por eso `AuthProvider` vacía toda la caché al cerrar sesión, para que la siguiente cuenta no vea datos de la anterior.
- Valores por defecto de la caché: datos frescos 5 minutos, 30 minutos en memoria, un reintento.
- **Actualizaciones optimistas.** Editar una serie del entrenamiento o reordenar ejercicios cambia la caché al instante y se deshace si falla el guardado. Los cambios en sí están en funciones puras (`cache.ts`: `applySetPatch`, `removeSet`, `appendSet`, `reorderByIds`), que se prueban sin red.
- **Errores.** La base reporta ciertos casos solo por el texto de su excepción ("has no exercises", "already exists", "unavailable"). `src/lib/errors.ts` (`errorKind`) los traduce a un tipo para que las pantallas no comparen texto. Si agregas un caso nuevo, agrégalo ahí y con prueba.
- **Errores inesperados.** Todo fallo que nadie maneja pasa por `reportError` (`src/lib/report.ts`), que **ignora los casos que ya explicamos a la persona** (los de `errorKind`) y entrega el resto a un *reporter* que se conecta con `setErrorReporter`. Hoy, en desarrollo, ese reporter escribe en la consola; conectar un servicio de reporte de fallos es cambiar esa línea. Lo llaman las consultas y mutaciones (`createQueryClient` en `src/lib/queryClient.ts`) y la pantalla de error. Si una pantalla se rompe al dibujarse, Expo Router muestra `ErrorFallback` (`src/components/ui/ErrorFallback.tsx`) mediante el `ErrorBoundary` exportado en `src/app/_layout.tsx`: un mensaje con botón de reintentar, sin mostrar el error técnico. Como puede dibujarse fuera de los providers, usa solo lo que funciona con sus valores por defecto.

## Internacionalización

- `src/i18n/es.ts` es la **fuente de verdad** de las cadenas; `src/i18n/en.ts` debe tener las mismas claves (TypeScript lo comprueba).
- `useT()` devuelve `{ t, language, dateLocale }`. Las claves están tipadas: `t("workout.finish")` falla al compilar si la clave no existe.
- Las cadenas con plural son `{ one, other }` y se eligen con el parámetro `count`: `t("tabs.gymbrosPending", { count: 2 })`. Los `{marcadores}` se rellenan con el resto de parámetros.
- La preferencia "sistema" sigue el idioma del teléfono: inglés si es inglés, español para cualquier otro.
- Una prueba comprueba que ambos idiomas tengan las mismas entradas y los mismos marcadores.
- Para una cadena nueva: agrégala a `es.ts` y a `en.ts`, nunca texto fijo en un componente.

## Tema y estilos

- Los colores, espacios, radios y tipografías están en `src/constants/theme.ts`. **No uses valores sueltos** (`#fff`, `16`): usa los tokens (`Spacing.three`, `Radius.md`, `Typography.body`).
- `useTheme()` devuelve la paleta del esquema actual. `useThemedStyles(makeStyles)` construye los estilos a partir de ella; define `makeStyles` **a nivel de módulo** para que se reconstruya solo al cambiar de tema.
- `ThemedText` recibe `type` (un token de `Typography`) y `tone` (`default`, `secondary`…).
- El **acento** de la app no es fijo: mientras haya una "rutina del día", su color reemplaza a `primary` y `accentText` (lo calcula `AccentProvider` con `suggestRoutine`). Los colores de rutina se guardan en su versión neón (`RoutineColors`) y en tema claro se oscurecen (`RoutineColorsLight`, `routineTone`, `readableAccent`).

## Convenciones al crear una pantalla

1. Ruta fina en `src/app/…` que importa la vista de `src/views/<Feature>`.
2. Datos: un hook en `src/hooks/api/<dominio>`; la pantalla no llama a `supabase` directamente.
3. Textos con `t()`, colores con tokens, estilos con `useThemedStyles`.
4. Estados de carga con `Skeleton`, de error con `EmptyState` (con botón de reintentar) y feedback con `useToast`.
5. Accesibilidad: `accessibilityLabel` en botones de ícono y `testID` en pestañas y pantallas.
6. La lógica que no necesita React sale a una función pura con su prueba.

Para el flujo de trabajo completo (ramas, TDD, PR) ve a [CONTRIBUTING.md](../CONTRIBUTING.md).
