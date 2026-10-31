## Qué cambia y por qué

<!-- El qué se ve en el diff; aquí cuenta el porqué. -->

## Cómo se probó

<!-- Qué pruebas escribiste (y viste fallar primero) y qué probaste a mano. -->

## Checklist

- [ ] Escribí la prueba primero y la vi fallar antes de escribir el código.
- [ ] `npm test`, `npx tsc --noEmit` y `npm run lint` pasan.
- [ ] Si toqué la base de datos: hay una migración **nueva** (no edité una ya aplicada), `npx supabase db reset` y `npm run test:db` pasan, y corrí `npm run db:types`.
- [ ] Si agregué texto visible: está en `src/i18n/es.ts` y en `src/i18n/en.ts`.
- [ ] Si cambié un comando, un script o la estructura: actualicé la documentación.
- [ ] No subí secretos, `.env`, ni datos de personas (el repo es público).

<!-- Los cambios a producción (migraciones, builds) los aplica una persona mantenedora tras revisar este PR. -->
