# Decisiones de diseño

Las decisiones que más preguntas generan, con su porqué. Si piensas cambiar una, discútela en un PR o issue antes. Cada una dice qué se decidió, por qué y qué cuesta.

## 1. La app habla con funciones RPC y RLS, no escribe tablas sueltas

- **Decisión:** las operaciones con reglas de negocio (crear rutinas, empezar y terminar entrenamientos, solicitudes de amistad…) son funciones SQL `SECURITY DEFINER` que se llaman con `supabase.rpc`. Las pocas tablas que la app toca directo están protegidas por RLS.
- **Por qué:** los permisos y las reglas viven en un solo lugar, la base, donde se prueban con SQL; la app no puede saltárselos aunque tenga un error. Un cliente móvil no es de confianza: cualquiera puede extraer la clave pública y llamar a la API.
- **Costo:** hay lógica en SQL además de en TypeScript, y los tipos generados son imprecisos para `RETURNS TABLE` y `jsonb` (de ahí algunos `as` en `queries.ts`).
- **Dónde:** [base-de-datos.md](base-de-datos.md).

## 2. Las funciones auxiliares de permisos viven en el esquema `private`

- **Decisión:** `is_gymbro`, `is_admin`, `owns_routine`, `can_view_split` y similares están en `private`, que la API no expone.
- **Por qué:** reciben un id de usuario cualquiera. En `public`, cualquier persona con sesión podía llamarlas por `/rest/v1/rpc` y averiguar amistades y roles de otros.
- **Costo:** las políticas y funciones las llaman como `private.is_gymbro(...)`. Moverlas de vuelta a `public` reabre el hueco; una prueba SQL (`helpers_not_exposed`) lo impide.

## 3. El seed del repo es un trozo pequeño del catálogo

- **Decisión:** `supabase/seed.sql` lleva las tablas de apoyo y 40 ejercicios; el catálogo completo (1324) vive solo en `supabase/seed.full.sql`, que git ignora.
- **Por qué:** el repo es público. La tabla `exercises` es la fuente de importación y se dejó sin lectura por la API a propósito; subirla entera la publicaría. Además, un volcado `--data-only` arrastra cuentas reales (`auth.*`).
- **Costo:** la base local tiene pocos ejercicios. Una prueba (`scripts/__tests__/seed.test.ts`) evita que el seed crezca o incluya datos de personas por accidente.

## 4. `jest-expo` está fijado en la 57.0.4

- **Decisión:** versión exacta, sin `~` ni `^`.
- **Por qué:** desde la 57.0.5 exige `react-native@0.86.3` y la app usa `0.86.2`. Subir solo `jest-expo` rompe la instalación.
- **Costo:** hay que acordarse de soltarlo cuando se actualice el SDK de Expo (`npx expo install --check`), que además requiere reconstruir la app. Dependabot ignora los paquetes que gobierna Expo por la misma razón.

## 5. Cada persona desarrolla contra su propia base local

- **Decisión:** el onboarding usa Supabase en Docker; nadie recibe claves del proyecto real.
- **Por qué:** el proyecto real tiene cuentas de verdad. Cualquier prueba o error en local no puede tocarlas, y no hay claves que se filtren.
- **Costo:** el E2E con Maestro todavía corre contra producción (es solo para mantenedores) y las imágenes del catálogo se cargan del Storage real. Un proyecto de staging lo resolvería.
