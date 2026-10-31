-- INSERT ... RETURNING on splits fails its SELECT policy (can_view_split cannot see the
-- row being inserted in the same statement), so the id is generated up front instead.

CREATE OR REPLACE FUNCTION public.create_split(p_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare v_id uuid := gen_random_uuid();
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'name required'; end if;

  begin
    insert into public.splits (id, user_id, name, privacy)
    values (v_id, auth.uid(), btrim(p_name), 'private');
  exception when unique_violation then
    raise exception 'split name already exists';
  end;

  update public.custom_users set active_split_id = v_id where id = auth.uid();
  return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.duplicate_split(p_id uuid, p_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_src public.splits;
  v_new uuid := gen_random_uuid();
  v_routine record;
  v_exercise record;
  v_new_routine uuid;
  v_new_exercise uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'name required'; end if;

  select * into v_src from public.splits
   where id = p_id and user_id = auth.uid() and archived_at is null;
  if not found then raise exception 'split not found'; end if;

  begin
    insert into public.splits (id, user_id, name, privacy, source_split_id)
    values (v_new, auth.uid(), btrim(p_name), 'private', v_src.id);
  exception when unique_violation then
    raise exception 'split name already exists';
  end;

  for v_routine in
    select * from public.routines
     where split_id = p_id and archived_at is null order by position
  loop
    insert into public.routines (split_id, position, name, color, privacy, source_routine_id)
    values (v_new, v_routine.position, v_routine.name, v_routine.color, 'private', v_routine.id)
    returning id into v_new_routine;

    for v_exercise in
      select * from public.routine_exercises
       where routine_id = v_routine.id order by position
    loop
      insert into public.routine_exercises (routine_id, gymbro_exercise_id, position, notes)
      values (v_new_routine, v_exercise.gymbro_exercise_id, v_exercise.position, v_exercise.notes)
      returning id into v_new_exercise;

      insert into public.routine_exercise_sets (routine_exercise_id, position, min_reps, max_reps, rir, weight)
      select v_new_exercise, position, min_reps, max_reps, rir, weight
        from public.routine_exercise_sets
       where routine_exercise_id = v_exercise.id;
    end loop;
  end loop;

  update public.custom_users set active_split_id = v_new where id = auth.uid();
  return v_new;
end;
$function$;
;
