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
    where r.id = p_routine_id and s.user_id = auth.uid()
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
$function$;;
