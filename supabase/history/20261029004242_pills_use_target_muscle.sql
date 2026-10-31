-- The pill shows the exercise's primary muscle (targets). muscle_groups holds a
-- secondary muscle (e.g. triceps on chest presses), which made the pills wrong.

CREATE OR REPLACE FUNCTION public.get_routines(p_language text DEFAULT 'es'::text)
 RETURNS TABLE(id uuid, name text, color text, quantity integer, tags text[])
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select
    r.id, r.name, r.color,
    (select count(*)::int from public.routine_exercises re where re.routine_id = r.id) as quantity,
    coalesce((
      select array_agg(distinct case when p_language = 'en' then tg.name_en else coalesce(tg.name_es, tg.name_en) end)
      from public.routine_exercises re
      join public.gymbro_exercises ge on ge.id = re.gymbro_exercise_id
      join public.targets tg on tg.id = ge.target_id
      where re.routine_id = r.id
    ), array[]::text[]) as tags
  from public.routines r
  join public.splits s on s.id = r.split_id
  where s.user_id = auth.uid() and r.archived_at is null
  order by r.position asc, r.created_at asc;
$function$;

CREATE OR REPLACE FUNCTION public.get_routine_exercises(p_routine_id uuid, p_language text DEFAULT 'es'::text)
 RETURNS TABLE(id uuid, gymbro_exercise_id uuid, "position" integer, name text, image text, muscle_group text, sets jsonb)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select
    re.id, re.gymbro_exercise_id, re.position,
    case when p_language = 'es' then coalesce(en.name_es, en.name_en) else en.name_en end as name,
    ge.image,
    case when p_language = 'es' then coalesce(tg.name_es, tg.name_en) else tg.name_en end as muscle_group,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'position', s.position,
        'min_reps', s.min_reps, 'max_reps', s.max_reps, 'weight', s.weight
      ) order by s.position)
      from public.routine_exercise_sets s where s.routine_exercise_id = re.id
    ), '[]'::jsonb) as sets
  from public.routine_exercises re
  join public.gymbro_exercises ge on ge.id = re.gymbro_exercise_id
  join public.exercise_names en on en.id = ge.exercise_name_id
  left join public.targets tg on tg.id = ge.target_id
  join public.routines r on r.id = re.routine_id
  join public.splits sp on sp.id = r.split_id
  where re.routine_id = p_routine_id and sp.user_id = auth.uid() and r.archived_at is null
  order by re.position asc;
$function$;

CREATE OR REPLACE FUNCTION public.update_routine(p_id uuid, p_name text, p_color text)
 RETURNS TABLE(id uuid, name text, color text, quantity integer, tags text[])
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'name required'; end if;

  update public.routines r
     set name = btrim(p_name), color = p_color, updated_at = now()
   where r.id = p_id
     and r.archived_at is null
     and exists (select 1 from public.splits s where s.id = r.split_id and s.user_id = auth.uid());

  if not found then raise exception 'routine not found or not owned'; end if;

  return query
  select r.id, r.name, r.color,
    (select count(*)::int from public.routine_exercises re where re.routine_id = r.id),
    coalesce((select array_agg(distinct coalesce(tg.name_es, tg.name_en))
      from public.routine_exercises re
      join public.gymbro_exercises ge on ge.id = re.gymbro_exercise_id
      join public.targets tg on tg.id = ge.target_id
      where re.routine_id = r.id), array[]::text[])
  from public.routines r where r.id = p_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_profile_routines(p_user_id uuid, p_language text default 'es')
 RETURNS TABLE(id uuid, name text, color text, quantity integer, tags text[])
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  select
    r.id, r.name, r.color,
    (select count(*)::int from public.routine_exercises re where re.routine_id = r.id) as quantity,
    coalesce((
      select array_agg(distinct case when p_language = 'en' then tg.name_en else coalesce(tg.name_es, tg.name_en) end)
      from public.routine_exercises re
      join public.gymbro_exercises ge on ge.id = re.gymbro_exercise_id
      join public.targets tg on tg.id = ge.target_id
      where re.routine_id = r.id
    ), array[]::text[]) as tags
  from public.routines r
  join public.splits s on s.id = r.split_id
  where s.user_id = p_user_id
    and auth.uid() is not null
    and public.can_view_routine(r.id, auth.uid())
  order by r.position asc, r.created_at asc;
$function$;

CREATE OR REPLACE FUNCTION public.get_shared_routine_exercises(p_routine_id uuid, p_language text default 'es')
 RETURNS TABLE(id uuid, gymbro_exercise_id uuid, "position" integer, name text, image text, muscle_group text, sets jsonb)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  select
    re.id, re.gymbro_exercise_id, re.position,
    case when p_language = 'es' then coalesce(en.name_es, en.name_en) else en.name_en end as name,
    ge.image,
    case when p_language = 'es' then coalesce(tg.name_es, tg.name_en) else tg.name_en end as muscle_group,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'position', s.position,
        'min_reps', s.min_reps, 'max_reps', s.max_reps, 'weight', s.weight
      ) order by s.position)
      from public.routine_exercise_sets s where s.routine_exercise_id = re.id
    ), '[]'::jsonb) as sets
  from public.routine_exercises re
  join public.gymbro_exercises ge on ge.id = re.gymbro_exercise_id
  join public.exercise_names en on en.id = ge.exercise_name_id
  left join public.targets tg on tg.id = ge.target_id
  where re.routine_id = p_routine_id
    and auth.uid() is not null
    and public.can_view_routine(re.routine_id, auth.uid())
  order by re.position asc;
$function$;

CREATE OR REPLACE FUNCTION public.get_workout_exercises(p_workout_id uuid, p_language text DEFAULT 'es'::text)
 RETURNS TABLE(id uuid, gymbro_exercise_id uuid, "position" integer, name text, image text, gif_url text, muscle_group text, equipment text, sets jsonb)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select
    we.id, we.gymbro_exercise_id, we.position,
    case when p_language = 'es' then coalesce(en.name_es, en.name_en) else en.name_en end as name,
    ge.image,
    ge.gif_url,
    case when p_language = 'es' then coalesce(tg.name_es, tg.name_en) else tg.name_en end as muscle_group,
    case when p_language = 'es' then coalesce(eq.name_es, eq.name_en) else eq.name_en end as equipment,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'position', s.position,
        'weight', s.weight,
        'reps', s.reps,
        'completed', s.completed,
        'target_min_reps', rs.min_reps,
        'target_max_reps', rs.max_reps
      ) order by s.position)
      from public.workout_sets s
      left join public.routine_exercise_sets rs
        on rs.routine_exercise_id = we.routine_exercise_id
       and rs.position = s.position
      where s.workout_exercise_id = we.id
    ), '[]'::jsonb) as sets
  from public.workout_exercises we
  join public.workouts w on w.id = we.workout_id
  join public.gymbro_exercises ge on ge.id = we.gymbro_exercise_id
  join public.exercise_names en on en.id = ge.exercise_name_id
  left join public.targets tg on tg.id = ge.target_id
  left join public.equipment eq on eq.id = ge.equipment_id
  where we.workout_id = p_workout_id and w.user_id = auth.uid()
  order by we.position asc;
$function$;
;
