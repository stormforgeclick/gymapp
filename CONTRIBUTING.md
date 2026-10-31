# Contribuir a Gymbro

Gracias por sumarte. Esta guía explica cómo trabajar sin romper nada y qué esperamos de un PR. Si no lo hiciste aún, empieza por [docs/empezar.md](docs/empezar.md).

## El flujo

1. **Parte de `main` actualizada** y crea una rama con un prefijo que diga qué es: `feat/…`, `fix/…`, `refactor/…`, `chore/…`, `docs/…`, `ci/…`.
2. **Escribe la prueba primero** (TDD). Mírala fallar, escribe lo mínimo para que pase, y limpia. Detalles y un ejemplo en [docs/pruebas.md](docs/pruebas.md).
3. **Haz commits pequeños** con mensajes como los del historial (abajo).
4. **Corre todo en local** antes de abrir el PR (checklist abajo).
5. **Abre el PR** contra `main`. GitHub te da una plantilla: explica *qué* cambia y *por qué*, y marca el checklist. La CI corre sola.
6. Atiende la revisión con commits nuevos; no reescribas la historia de un PR que ya tiene comentarios.

No hagas push directo a `main`.

## Mensajes de commit

Formato `tipo: resumen en inglés, en imperativo`, como en el historial: `feat: add …`, `fix: correct …`, `refactor: extract …`, `chore: update …`, `docs: …`, `ci: …`. Para la base de datos se usa el alcance: `feat(db): …`.

El título dice qué; el cuerpo (si hace falta) dice **por qué**. El código y los commits están en inglés; la documentación, en español.

## Checklist del PR

- [ ] Hay pruebas para lo nuevo y se vio fallar la prueba antes de escribir el código.
- [ ] `npm run test:coverage`, `npx tsc --noEmit` y `npm run lint` pasan. Si mejoraste la cobertura de un área, sube su piso en `package.json`.
- [ ] Si tocaste la base: `npx supabase db reset` y `npm run test:db` pasan, hay una migración **nueva** (no editaste una ya aplicada), y corriste `npm run db:types` y commiteaste el resultado.
- [ ] Si agregaste texto visible: está en `src/i18n/es.ts` **y** en `src/i18n/en.ts`.
- [ ] Si cambiaste un comando, un script o la estructura: actualizaste la documentación (la prueba `docs.test.ts` te avisa de enlaces y rutas rotas).
- [ ] No subiste secretos ni datos de personas (ver abajo).

## Convenciones de código

- **Arquitectura:** ruta fina en `src/app`, pantalla en `src/views`, datos en `src/hooks/api`. La pantalla no llama a `supabase` directamente. Ver [docs/arquitectura.md](docs/arquitectura.md).
- **Lógica fuera de los componentes.** Si se puede probar sin React, va en `src/lib` o en un `utils/` junto a la pantalla, con su prueba en un `__tests__/` al lado.
- **Estilo:** tokens de `src/constants/theme.ts` (nada de colores ni medidas sueltas) y `useThemedStyles` con la función de estilos a nivel de módulo.
- **Textos:** siempre con `t("clave")`. Las claves están tipadas.
- **Errores:** si un caso nuevo de la base se reconoce por el texto de su excepción, se agrega en `src/lib/errors.ts` con prueba.
- **Comentarios:** explican el *porqué*, no repiten lo que hace la línea. Sigue la densidad de los archivos que tocas.
- **Pruebas:** mockea solo el borde (el cliente de Supabase). Nunca pongas pruebas dentro de `src/app/`.
- **Tipos:** `strict` está activo; evita `any`. `src/types/database.ts` se genera, no se edita.
- **Versión de Expo:** esta versión cambió mucho. Antes de usar una API de Expo, lee la documentación de la versión exacta: <https://docs.expo.dev/versions/v57.0.0/>.

## Base de datos

- Un cambio de esquema es una **migración nueva** en `supabase/migrations/`, con su prueba SQL escrita antes. El paso a paso está en [docs/base-de-datos.md](docs/base-de-datos.md#cambiar-el-esquema-con-tdd).
- **Tú no aplicas migraciones a producción.** Lo hace una persona mantenedora tras revisar el PR. No uses el editor SQL del Dashboard ni herramientas externas para cambiar el esquema.
- Las funciones auxiliares de permisos viven en el esquema `private`; no las muevas a `public`.

## Ajustes de GitHub (mantenedores)

Estas reglas se configuran en el sitio de GitHub, no en el repo:

1. **Proteger `main`**: Settings → Branches → Add branch ruleset (o *branch protection rule*) para `main`, con *Require a pull request before merging* (1 aprobación y *Dismiss stale approvals*), *Require status checks to pass* con `app` y `database` (aparecen en la lista después de la primera ejecución de la CI) y *Block force pushes*.
2. **Alertas de seguridad**: Settings → Code security → activar *Dependabot alerts*, *Secret scanning* con *Push protection*, y *Private vulnerability reporting*.
3. **CODEOWNERS**: cuando el equipo esté definido, agrega un archivo `CODEOWNERS` dentro de `.github/` con los usuarios de GitHub que deben revisar cada carpeta (`supabase/` y `.github/` son las más delicadas).

Dependabot y CodeQL ya vienen configurados en `.github/`. Dependabot no actualiza los paquetes que gobierna Expo: esos se suben juntos con `npx expo install` (ver [docs/decisiones.md](docs/decisiones.md)).

## Qué nunca se sube

El repo es **público**. No subas:

- `.env` ni ningún `.env*` (solo `.env.example`, que no lleva valores reales).
- Claves de servicio (`SUPABASE_SERVICE_ROLE_KEY`), claves de OpenAI, contraseñas de la base, tokens.
- Volcados de datos de la base real: `auth.*`, `storage.*` o tablas de usuarios. El seed de `supabase/seed.sql` es un trozo pequeño del catálogo y una prueba lo vigila.
- `supabase/seed.full.sql` (el catálogo completo; git ya lo ignora).
- Capturas, logs o pegadas de terminal con direcciones de correo, ids de usuario o claves.

Si subiste algo sensible por error, **avisa de inmediato**: borrar el commit no basta, la clave hay que cambiarla.

## Trabajar con Claude Code

El repo incluye `AGENTS.md` y `CLAUDE.md` con instrucciones para asistentes de IA: la principal es leer la documentación versionada de Expo antes de escribir código. Aplican las mismas reglas de esta guía: pruebas primero, nada de secretos, y los cambios a producción los decide una persona.

## Dudas

Pregunta en el PR o abre un issue en el repositorio.
