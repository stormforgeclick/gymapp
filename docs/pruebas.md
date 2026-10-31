# Pruebas y calidad

El proyecto se desarrolla con **TDD**: primero la prueba, la ves fallar, y solo entonces escribes el código. Este documento explica las capas de pruebas, cómo escribir una y qué corre la CI.

## Las capas

| Capa | Qué comprueba | Comando | Necesita |
|---|---|---|---|
| **Jest** | Lógica pura, hooks y funciones de acceso a datos | `npm test` | Solo Node |
| **SQL** | Reglas de la base: RLS, funciones RPC, privacidad | `npm run test:db` | Supabase local (Docker) |
| **Tipos y lint** | Que todo compile y siga el estilo | `npx tsc --noEmit` y `npm run lint` | Solo Node |
| **E2E (Maestro)** | La app real en un emulador | `npm run e2e` | Emulador, build release, cuenta de pruebas (solo mantenedores) |

Lo normal antes de abrir un PR: las cuatro primeras, en verde.

## Jest

- Los archivos van en una carpeta **`__tests__/` junto al código** y terminan en `.test.ts` o `.test.tsx`. **Nunca dentro de `src/app/`**: Expo Router lo tomaría como una ruta.
- `npm run test:watch` vuelve a correr al guardar; `npx jest src/lib` corre una carpeta.
- Los datos de ejemplo salen de `src/test-utils/factories.ts` (`makeSet`, `makeWorkoutExercise`, `makeRoutineExercise`).
- Los hooks se prueban con `renderHook` de Testing Library, que en esta versión es **asíncrono**: `await renderHook(…)` y `await act(…)`. Ejemplo: `src/views/RoutineDetails/hooks/__tests__/useRowMutationState.test.ts`.
- **Mockea solo en el borde.** El único mock del proyecto es el cliente de Supabase (`src/hooks/api/exercises/__tests__/queries.test.ts`). Todo lo demás se prueba con código real.
- Lo que se puede probar mejor es lo que **no depende de React**: por eso la lógica de las pantallas se extrae a funciones puras (`src/lib`, `utils/`, `cache.ts`).

### El ciclo, con un ejemplo real

Se quería aceptar la coma decimal al escribir un peso (`12,5`). Tres pasos:

1. **Rojo.** Escribe la prueba antes que el código, en `src/lib/__tests__/numbers.test.ts`:

   ```ts
   it("accepts a decimal comma", () => {
     expect(parseNumber("12,5")).toBe(12.5);
   });
   ```

   Corre `npx jest src/lib/__tests__/numbers.test.ts`. **Tiene que fallar, y por la razón correcta** (aquí: el módulo no existe todavía). Si pasa de entrada, no prueba nada nuevo; si falla por un error tuyo de sintaxis, arréglalo y vuelve a correr.
2. **Verde.** Escribe lo mínimo para que pase (`src/lib/numbers.ts`) y vuelve a correr.
3. **Refactor.** Con todo en verde, limpia: nombres, duplicación, extraer funciones. No agregues comportamiento nuevo aquí.

Al arreglar un error el orden es el mismo: primero una prueba que lo reproduce.

## Pruebas SQL

- Viven en `supabase/tests/*.sql` y se corren contra tu Supabase local: `npx supabase db reset` (base limpia) y `npm run test:db`. `npm run test:db -- rpc_flows` corre solo los archivos cuyo nombre contenga ese texto.
- `scripts/test-db.ts` manda `supabase/tests/_helpers.sql` más cada archivo a `psql` dentro del contenedor `supabase_db_gymapp`. Una prueba pasa cuando termina con el error `ROLLBACK_TEST`; cualquier otro error es un fallo.
- Cómo se escribe una y cuándo hace falta: [base-de-datos.md](base-de-datos.md#cambiar-el-esquema-con-tdd).

## Guardias contra el desorden

Dos pruebas de Jest que no prueban código sino el repo:

- `scripts/__tests__/seed.test.ts`: el seed del repo solo puede tener tablas del catálogo, ninguna de usuarios, y debe ser pequeño. El repo es público.
- `scripts/__tests__/docs.test.ts` (con la lógica en `scripts/docs-check.ts`): en `README.md`, `CONTRIBUTING.md` y `docs/`, los enlaces, los `npm run …` y las rutas del repo escritas entre comillas invertidas tienen que existir. Si renombras un archivo o un script, esta prueba te dice qué documento actualizar.

## Integración continua

`.github/workflows/ci.yml` corre en cada push a `main` y en cada pull request, con dos trabajos en paralelo y sin ningún secreto:

| Trabajo | Qué corre |
|---|---|
| `app` | `npx tsc --noEmit`, `npm run lint`, `npm test -- --ci` |
| `database` | Levanta Supabase local (migraciones y seed), `npm run test:db`, y comprueba que `src/types/database.ts` esté al día |

Para reproducir un fallo, corre lo mismo en tu equipo. Fallos típicos:

- **"Generated types are up to date" falla:** cambiaste el esquema y no regeneraste. Corre `npm run db:types` y commitea el resultado.
- **`database` falla solo en CI:** mira el último paso (`Diagnostics`), que imprime los contenedores y los últimos registros de la base.
- **`app` falla en `lint` o `tsc`:** corre el mismo comando en local; es determinista.

## E2E con Maestro (solo mantenedores)

Abre la app real en un emulador de Android y la usa: pestañas, crear una rutina con ejercicios y reordenarlos arrastrando. Los flujos están en `.maestro/flows/` (por ejemplo `smoke.yaml`) y `scripts/e2e.ts` los orquesta (Maestro no sabe mantener presionado y arrastrar, así que el arrastre se hace con `adb`).

**Hoy corre contra el proyecto real de Supabase**: usa la cuenta `e2e@gymbro.test` (que crea `scripts/e2e-user.ts` con `SUPABASE_SERVICE_ROLE_KEY`) y cada prueba crea y borra una rutina "E2E …". Por eso no es parte del onboarding ni de la CI. Apuntarlo a una base local o a un staging está pendiente. Los pasos para correrlo están en [README.md](../README.md#de-punta-a-punta-maestro--emulador-android).
