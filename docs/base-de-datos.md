# Base de datos

Supabase (Postgres 17). El esquema vive en el repo, se levanta en tu equipo con Docker y se prueba con SQL. Antes de tocar nada lee la sección [Producción](#producción).

## Cómo habla la app con la base

- **Casi todo va por funciones RPC** (`supabase.rpc("get_routines", …)`): son funciones `SECURITY DEFINER` que validan quién llama (`auth.uid()`) y devuelven solo lo permitido. La app usa 35: crear y mover rutinas, empezar y terminar entrenamientos, solicitudes de gymbros, catálogo, etc. La lista exacta está en `src/hooks/api/*/queries.ts`.
- **Algunas tablas se leen y escriben directo**, protegidas por RLS: `custom_users` (tu perfil), `friendships` (cancelar una solicitud y contar las pendientes), `workouts` y `workout_sets` (entrenamiento en curso), más el bucket de Storage `avatars` y Supabase Auth.
- **Nadie llama a las tablas del catálogo ni a las de entrenadores** desde la app.
- Los tipos TypeScript de todo esto se generan en `src/types/database.ts` (ver [Tipos](#tipos-generados)).

## El modelo

```
auth.users ─1:1─ custom_users (perfil, privacidad, split activo)
                   ├── friendships            solicitudes y amistades entre dos perfiles
                   ├── splits                 planes de entrenamiento
                   │     └── routines         un día del split (color, orden, archivada o no)
                   │           └── routine_exercises      ejercicio del catálogo dentro de la rutina
                   │                 └── routine_exercise_sets   series planeadas (reps, peso, RIR)
                   └── workouts               sesiones reales (una cada vez que entrenas una rutina)
                         └── workout_exercises    copia del ejercicio al empezar
                               └── workout_sets   series reales (reps, peso, completada)
```

| Tabla | Qué guarda | Quién la escribe |
|---|---|---|
| `custom_users` | Perfil: nombre, `user_name`, avatar, idioma, privacidad, split activo | El trigger `on_auth_user_created` al registrarse; la app para editar |
| `friendships` | Solicitud entre dos personas y su estado (`pending`, `accepted`, `rejected`, `blocked`) | RPC `send_gymbro_request`, `respond_to_friendship`, `remove_gymbro` |
| `splits` | Plan: nombre, privacidad, `archived_at` | RPC `create_split`, `rename_split`, `set_split_privacy`, `archive_split`… |
| `routines`, `routine_exercises`, `routine_exercise_sets` | El plan en detalle | RPC `create_routine`, `add_routine_exercises`, `replace_routine_exercise_sets`, `reorder_routine_exercises`… |
| `workouts`, `workout_exercises`, `workout_sets` | La sesión real | RPC `start_workout` y `finish_workout`; la app edita las series directo |
| `gymbro_exercises` | **El catálogo que lee la app**: ejercicio, imagen, GIF, instrucciones | Nadie desde la app (se importa) |
| `exercise_names`, `categories`, `equipment`, `muscle_groups`, `targets`, `exercise_secondary_muscles` | Tablas de apoyo del catálogo, en español e inglés | Nadie desde la app |
| `exercises` | La fuente **privada** de importación del catálogo. Nadie la lee por la API; solo es el destino de una clave foránea | Importación |
| `trainer_applications`, `trainer_assignments`, `trainer_gymbros`, `user_roles` | Entrenadores: solicitudes, asignaciones y roles (`trainer`, `admin`) | RPC que la app todavía no usa |
| `user_socials` | Redes sociales del perfil | La app todavía no la usa |

Detalles que sorprenden:

- Una rutina o un split **archivado** (`archived_at`) es un borrado suave: desaparece para los demás y de las listas, pero el historial de entrenamientos se conserva.
- `routines.privacy` existe pero hoy **no decide nada**: la visibilidad de una rutina la fija su split.
- Quién ve un split: su dueño; o cualquiera que pueda ver el perfil del dueño **y** que el split sea `public` (o `gymbros` y sea su gymbro); o un gymbro al que un entrenador se lo asignó.
- Los ejercicios y series de un entrenamiento **terminado** no se pueden modificar: lo impiden los triggers `workout_exercises_block_finished_changes` y `workout_sets_block_finished_changes`.

## Seguridad: tres capas

1. **RLS en todas las tablas de `public`.** Cada política dice quién puede leer o escribir qué fila.
2. **RPC con `SECURITY DEFINER` y `search_path` vacío.** Hacen la validación en el servidor. Los usuarios sin sesión (`anon`) solo pueden llamar a las tres funciones públicas del catálogo.
3. **El esquema `private`.** Las funciones auxiliares que reciben un id de usuario cualquiera (`is_gymbro`, `is_admin`, `owns_routine`, `can_view_split`…) viven en `private`, que la API no expone. Antes estaban en `public` y cualquiera con sesión podía llamarlas para averiguar amistades y roles. Úsalas como `private.is_gymbro(a, b)` dentro de políticas y funciones; **no las muevas de vuelta a `public`**.

Estas reglas las vigilan pruebas SQL: `anon_privileges`, `helpers_not_exposed`, `rls_routine_rows` y `split_privacy`.

## Carpeta `supabase/`

```
supabase/
  config.toml        Configuración del stack local (proyecto "gymapp", Postgres 17).
  migrations/        Lo que se aplica, en orden. Empieza por la migración base.
  seed.sql           Datos de arranque: un trocito del catálogo (ver abajo).
  tests/             Pruebas SQL (se corren con npm run test:db).
  history/           Las 24 migraciones antiguas, solo como referencia. NO se aplican.
  rollbacks/         Scripts para deshacer migraciones concretas. NO son migraciones.
```

- `supabase/migrations/20261030000000_baseline.sql` es el esquema de producción al 2026-10-30. Las migraciones que lo construyeron nunca estuvieron en el repo; están en `supabase/history/` para entender de dónde viene cada cosa.
- Los cambios posteriores son migraciones nuevas (hoy: `move_helpers_to_private` y `drop_duplicate_routine_row_policies`).
- `supabase/seed.sql` es **un subconjunto pequeño** del catálogo (las tablas de apoyo completas y 40 ejercicios), porque el repo es público. No lleva datos de usuarios, y de `exercises` solo conserva `id` y `name`. Una prueba (`scripts/__tests__/seed.test.ts`) lo exige.
- Para trabajar con el catálogo completo, pon tu volcado en `supabase/seed.full.sql` (git lo ignora) y apunta `sql_paths` en `[db.seed]` de `supabase/config.toml` a ese archivo. Los volcados `supabase db dump --data-only` traen también `auth.*` y `storage.*` (datos reales): **nunca** los metas al repo; quédate solo con las tablas del catálogo y conviértelas a `INSERT`, porque `db reset` no puede leer `COPY … FROM stdin`.
- Las imágenes y GIF del seed apuntan al Storage público del proyecto real: se cargan desde internet aunque tu base sea local.

## Trabajar en local

```
npx supabase start -x studio,imgproxy,edge-runtime,logflare,vector,mailpit,realtime,storage-api,supavisor
npx supabase status -o env       # URL y claves de tu base local
npx supabase db reset            # base limpia: migraciones + seed
npm run test:db                  # pruebas SQL
npx supabase stop                # apagar (--no-backup descarta los datos)
```

- Corre con Docker. El `-x …` omite servicios que no necesitas (Studio, Realtime, Storage…), así arranca más rápido.
- La API queda en `http://127.0.0.1:54321` y Postgres en el puerto `54322`.
- Mirar los datos: `docker exec -it supabase_db_gymapp psql -U postgres -d postgres`.
- En local **no hace falta confirmar el correo** al registrarse.

## Cambiar el esquema (con TDD)

1. **Escribe la prueba primero** en `supabase/tests/` y mira que falle (`npm run test:db`). Si no falla, no prueba nada.
2. `npx supabase migration new nombre_corto` y escribe la migración en `supabase/migrations/`. **Nunca edites una migración que ya se aplicó** (ni la base): agrega otra.
3. `npx supabase db reset` y `npm run test:db`: todo en verde.
4. `npm run db:types` para regenerar `src/types/database.ts`, y `npx tsc --noEmit`. La CI falla si olvidas regenerarlos.
5. Si cambia el comportamiento, actualiza el código de la app, sus pruebas y estos documentos.
6. Abre el PR. **No apliques migraciones a producción tú mismo** (ver abajo).

Una prueba SQL es un bloque `do $$ … $$` que crea sus propios usuarios y datos, comprueba cosas *como esos usuarios* (para que RLS aplique) y termina con `raise exception 'ROLLBACK_TEST: …'`, así que no deja nada. Ese error significa que todo pasó. Las ayudas (`make_user`, `scalar_as`, `expect_error`, `assert_eq`) están en `supabase/tests/_helpers.sql`.

## Tipos generados

`src/types/database.ts` lo genera `npm run db:types` desde tu base local. Dos límites a tener en cuenta:

- Las funciones que devuelven `TABLE(…)` salen con **todas las columnas como no nulas**, aunque en la base puedan ser nulas, y las columnas `jsonb` salen como `Json`. Por eso algunos `queries.ts` conservan un `as` hacia el tipo escrito a mano.
- Los argumentos opcionales de una RPC se pasan como `undefined`, no como `null`.

## Producción

El proyecto real (`gymbro`) tiene cuentas de personas de verdad. Reglas:

- **Solo las personas mantenedoras** aplican migraciones, con el CLI y la contraseña de la base: `npx supabase db push --linked --skip-vault --dry-run` primero, luego sin `--dry-run`. Nunca por el editor SQL del Dashboard ni por herramientas externas: quedarían fuera del repo y el historial se descuadra.
- Antes de aplicar, la migración se revisa en el PR y se prueba en local con `db reset`.
- El historial de producción quedó alineado el 2026-10-31: una fila para la migración base y una por cada migración posterior. Si ves una diferencia entre `supabase/migrations/` y `npx supabase migration list --linked`, **detente** y consulta antes de forzar nada.
- Si una migración sale mal, `supabase/rollbacks/20261031_undo_security_fixes.sql` deshace las dos últimas (probado en local). Para una nueva, escribe su reversa **antes** de aplicarla y pruébala igual.
- Los scripts de `scripts/` que usan `SUPABASE_SERVICE_ROLE_KEY` escriben en producción. No los corras sin saber qué hacen.
