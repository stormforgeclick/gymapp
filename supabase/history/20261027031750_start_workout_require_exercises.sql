create or replace function public.start_workout(p_routine_id uuid)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_workout_id uuid;
  v_routine_exercise public.routine_exercises%rowtype;
  v_routine_set public.routine_exercise_sets%rowtype;
  v_workout_exercise_id uuid;
begin
  if not public.owns_routine(p_routine_id, auth.uid()) then
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
$function$;;
