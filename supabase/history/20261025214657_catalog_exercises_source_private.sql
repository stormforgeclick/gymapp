-- exercises es solo la fuente de importación: nadie la lee por la API
drop policy if exists "Public can read exercises" on public.exercises;
drop policy if exists "Authenticated can read exercises" on public.exercises;

-- gymbro_exercises: la política para {public} ya cubre anon y authenticated
drop policy if exists "Authenticated users read exercise catalog" on public.gymbro_exercises;;
