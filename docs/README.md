# Documentación de Gymbro

Gymbro es una app móvil para planear y registrar entrenamientos de gimnasio, con una capa social (rutinas compartidas entre amigos). Está hecha con Expo y React Native, y su backend es Supabase.

Esta carpeta es la guía para quien se incorpora al proyecto. Se mantiene junto al código: si cambias algo que aquí se describe, actualiza el documento en el mismo PR.

## Por dónde empezar

| Si quieres… | Lee |
|---|---|
| Instalar el proyecto y tener tu propia base de datos en menos de una hora | [empezar.md](empezar.md) |
| Entender cómo está organizado el código y dónde poner una pantalla nueva | [arquitectura.md](arquitectura.md) |
| Tocar la base de datos, una migración o los permisos | [base-de-datos.md](base-de-datos.md) |
| Escribir pruebas, entender la CI o saber qué corre antes de un PR | [pruebas.md](pruebas.md) |
| Mandar tu primer PR | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| Resolver un error raro de instalación, Supabase o npm | [problemas-conocidos.md](problemas-conocidos.md) |

Orden recomendado para tu primer día: **empezar → arquitectura → CONTRIBUTING**. El resto, cuando lo necesites.

## Lo esencial en una pantalla

- **Una base de datos por persona.** Desarrollas contra tu propio Supabase en Docker (`npx supabase start`); nadie necesita claves del proyecto real.
- **La app habla con Postgres casi siempre por funciones RPC** y todo está protegido por RLS. El esquema vive en `supabase/migrations/`.
- **TDD.** Primero la prueba, la ves fallar, luego el código.
- **La CI revisa tipos, lint, pruebas y la base** en cada PR.
- **El repo es público.** Nada de secretos ni datos de personas.

## Otros documentos

- [README principal](../README.md): comandos del día a día y builds con EAS.
- `AGENTS.md` y `CLAUDE.md`: instrucciones para asistentes de IA que trabajan en el repo.
