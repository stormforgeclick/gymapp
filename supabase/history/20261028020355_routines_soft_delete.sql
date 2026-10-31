-- Routines are archived instead of deleted, so finished workouts keep their link.
alter table public.routines add column archived_at timestamptz;

CREATE OR REPLACE FUNCTION public.delete_routine(p_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare v_del uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  update public.routines r
     set archived_at = now()
   where r.id = p_id
     and r.archived_at is null
     and exists (select 1 from public.splits s where s.id = r.split_id and s.user_id = auth.uid())
  returning r.id into v_del;
  if v_del is null then raise exception 'routine not found or not owned'; end if;

  -- A workout in progress for this routine can't continue; discard it.
  delete from public.workouts w
   where w.routine_id = v_del
     and w.finished_at is null
     and w.user_id = auth.uid();

  return v_del;
end;
$function$;

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
      select array_agg(distinct case when p_language = 'en' then mg.name_en else mg.name_es end)
      from public.routine_exercises re
      join public.gymbro_exercises ge on ge.id = re.gymbro_exercise_id
      join public.muscle_groups mg on mg.id = ge.muscle_group_id
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
    case when p_language = 'es' then coalesce(mg.name_es, mg.name_en) else mg.name_en end as muscle_group,
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
  left join public.muscle_groups mg on mg.id = ge.muscle_group_id
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
    coalesce((select array_agg(distinct mg.name_es)
      from public.routine_exercises re
      join public.gymbro_exercises ge on ge.id = re.gymbro_exercise_id
      join public.muscle_groups mg on mg.id = ge.muscle_group_id
      where re.routine_id = r.id), array[]::text[])
  from public.routines r where r.id = p_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.add_routine_exercises(p_routine_id uuid, p_gymbro_exercise_ids uuid[])
 RETURNS SETOF uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_owned boolean;
  v_pos int;
  v_id uuid;
  v_ex uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select exists (
    select 1 from public.routines r join public.splits s on s.id = r.split_id
    where r.id = p_routine_id and s.user_id = auth.uid() and r.archived_at is null
  ) into v_owned;
  if not v_owned then raise exception 'routine not found or not owned'; end if;

  perform 1 from public.routines where id = p_routine_id for update;

  select coalesce(max(re.position), 0) into v_pos
    from public.routine_exercises re where re.routine_id = p_routine_id;

  foreach v_ex in array coalesce(p_gymbro_exercise_ids, array[]::uuid[]) loop
    v_pos := v_pos + 1;
    insert into public.routine_exercises (routine_id, gymbro_exercise_id, position)
    values (p_routine_id, v_ex, v_pos)
    returning routine_exercises.id into v_id;

    insert into public.routine_exercise_sets (routine_exercise_id, position, min_reps, max_reps, weight)
    values (v_id, 1, 8, 12, null);

    return next v_id;
  end loop;
end;
$function$;

CREATE OR REPLACE FUNCTION public.start_workout(p_routine_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_workout_id uuid;
  v_routine_exercise public.routine_exercises%rowtype;
  v_routine_set public.routine_exercise_sets%rowtype;
  v_workout_exercise_id uuid;
begin
  if not public.owns_routine(p_routine_id, auth.uid()) then
    raise exception 'Routine not found or not owned by current user';
  end if;

  if exists (
    select 1 from public.routines where id = p_routine_id and archived_at is not null
  ) then
    raise exception 'Routine not found or not owned by current user';
  end if;

  if not exists (
    select 1 from public.routine_exercises where routine_id = p_routine_id
  ) then
    raise exception 'Routine has no exercises';
  end if;

  insert into public.workouts (
    user_id,
    routine_id,
    started_at
  )
  values (
    auth.uid(),
    p_routine_id,
    now()
  )
  returning id into v_workout_id;

  for v_routine_exercise in
    select *
    from public.routine_exercises
    where routine_id = p_routine_id
    order by position
  loop
    insert into public.workout_exercises (
      workout_id,
      routine_exercise_id,
      gymbro_exercise_id,
      position,
      notes_snapshot
    )
    values (
      v_workout_id,
      v_routine_exercise.id,
      v_routine_exercise.gymbro_exercise_id,
      v_routine_exercise.position,
      v_routine_exercise.notes
    )
    returning id into v_workout_exercise_id;

    for v_routine_set in
      select *
      from public.routine_exercise_sets
      where routine_exercise_id = v_routine_exercise.id
      order by position
    loop
      insert into public.workout_sets (
        workout_exercise_id,
        position,
        weight,
        completed
      )
      values (
        v_workout_exercise_id,
        v_routine_set.position,
        v_routine_set.weight,
        false
      );
    end loop;
  end loop;

  return v_workout_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_finished_workout_exercise_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_workout_id uuid;
  v_finished_at timestamptz;
begin
  v_workout_id := coalesce(new.workout_id, old.workout_id);

  select finished_at
  into v_finished_at
  from public.workouts
  where id = v_workout_id;

  if v_finished_at is not null then
    -- Removing an exercise from a routine detaches it from past workouts through
    -- the foreign key's ON DELETE SET NULL; nothing else may change.
    if tg_op = 'UPDATE'
       and pg_trigger_depth() > 1
       and old.routine_exercise_id is not null
       and new.routine_exercise_id is null
       and (to_jsonb(new) - 'routine_exercise_id' - 'updated_at')
         = (to_jsonb(old) - 'routine_exercise_id' - 'updated_at') then
      return new;
    end if;

    raise exception 'Finished workout exercises cannot be modified';
  end if;

  return coalesce(new, old);
end;
$function$;

alter policy "Users view routines of permitted split" on public.routines
  using (can_view_split(split_id, (select auth.uid())) and archived_at is null);
;
