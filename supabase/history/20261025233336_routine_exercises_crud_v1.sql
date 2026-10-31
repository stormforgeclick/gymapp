
-- ========= RLS policies =========
create policy "routine_exercises_select_own" on public.routine_exercises
  for select using (exists (
    select 1 from public.routines r join public.splits s on s.id = r.split_id
    where r.id = routine_exercises.routine_id and s.user_id = auth.uid()));
create policy "routine_exercises_insert_own" on public.routine_exercises
  for insert with check (exists (
    select 1 from public.routines r join public.splits s on s.id = r.split_id
    where r.id = routine_exercises.routine_id and s.user_id = auth.uid()));
create policy "routine_exercises_update_own" on public.routine_exercises
  for update using (exists (
    select 1 from public.routines r join public.splits s on s.id = r.split_id
    where r.id = routine_exercises.routine_id and s.user_id = auth.uid()));
create policy "routine_exercises_delete_own" on public.routine_exercises
  for delete using (exists (
    select 1 from public.routines r join public.splits s on s.id = r.split_id
    where r.id = routine_exercises.routine_id and s.user_id = auth.uid()));

create policy "routine_exercise_sets_select_own" on public.routine_exercise_sets
  for select using (exists (
    select 1 from public.routine_exercises re
    join public.routines r on r.id = re.routine_id
    join public.splits s on s.id = r.split_id
    where re.id = routine_exercise_sets.routine_exercise_id and s.user_id = auth.uid()));
create policy "routine_exercise_sets_insert_own" on public.routine_exercise_sets
  for insert with check (exists (
    select 1 from public.routine_exercises re
    join public.routines r on r.id = re.routine_id
    join public.splits s on s.id = r.split_id
    where re.id = routine_exercise_sets.routine_exercise_id and s.user_id = auth.uid()));
create policy "routine_exercise_sets_update_own" on public.routine_exercise_sets
  for update using (exists (
    select 1 from public.routine_exercises re
    join public.routines r on r.id = re.routine_id
    join public.splits s on s.id = r.split_id
    where re.id = routine_exercise_sets.routine_exercise_id and s.user_id = auth.uid()));
create policy "routine_exercise_sets_delete_own" on public.routine_exercise_sets
  for delete using (exists (
    select 1 from public.routine_exercises re
    join public.routines r on r.id = re.routine_id
    join public.splits s on s.id = r.split_id
    where re.id = routine_exercise_sets.routine_exercise_id and s.user_id = auth.uid()));

-- ========= get_routine_exercises =========
create or replace function public.get_routine_exercises(
  p_routine_id uuid, p_language text default 'es'
) returns table (
  id uuid, gymbro_exercise_id uuid, "position" int,
  name text, image text, muscle_group text,
  sets jsonb
)
language sql stable security invoker set search_path = public
as $$
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
  where re.routine_id = p_routine_id and sp.user_id = auth.uid()
  order by re.position asc;
$$;
grant execute on function public.get_routine_exercises(uuid, text) to authenticated;

-- ========= add_routine_exercises =========
create or replace function public.add_routine_exercises(
  p_routine_id uuid,
  p_gymbro_exercise_ids uuid[]
) returns setof uuid
language plpgsql security invoker set search_path = public
as $$
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

  select coalesce(max(re.position), 0) into v_pos
    from public.routine_exercises re where re.routine_id = p_routine_id;

  foreach v_ex in array coalesce(p_gymbro_exercise_ids, array[]::uuid[]) loop
    v_pos := v_pos + 1;
    insert into public.routine_exercises (routine_id, gymbro_exercise_id, position)
    values (p_routine_id, v_ex, v_pos)
    returning routine_exercises.id into v_id;

    insert into public.routine_exercise_sets (routine_exercise_id, position, min_reps, max_reps, weight)
    values (v_id, 1, 10, 10, null);

    return next v_id;
  end loop;
end;
$$;
grant execute on function public.add_routine_exercises(uuid, uuid[]) to authenticated;

-- ========= delete_routine_exercise =========
create or replace function public.delete_routine_exercise(p_id uuid)
returns uuid
language plpgsql security invoker set search_path = public
as $$
declare v_del uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from public.routine_exercises re
   where re.id = p_id and exists (
     select 1 from public.routines r join public.splits s on s.id = r.split_id
     where r.id = re.routine_id and s.user_id = auth.uid()
   )
  returning re.id into v_del;
  if v_del is null then raise exception 'routine exercise not found or not owned'; end if;
  return v_del;
end;
$$;
grant execute on function public.delete_routine_exercise(uuid) to authenticated;

-- ========= replace_routine_exercise_sets =========
create or replace function public.replace_routine_exercise_sets(
  p_routine_exercise_id uuid,
  p_sets jsonb
) returns table (id uuid, "position" int, min_reps int, max_reps int, weight numeric)
language plpgsql security invoker set search_path = public
as $$
declare
  v_owned boolean;
  v_item jsonb;
  v_keep uuid[] := array[]::uuid[];
  v_pos int := 0;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select exists (
    select 1 from public.routine_exercises re
    join public.routines r on r.id = re.routine_id
    join public.splits s on s.id = r.split_id
    where re.id = p_routine_exercise_id and s.user_id = auth.uid()
  ) into v_owned;
  if not v_owned then raise exception 'routine exercise not found or not owned'; end if;
  if jsonb_typeof(p_sets) <> 'array' or jsonb_array_length(p_sets) = 0 then
    raise exception 'at least one set required';
  end if;

  for v_item in select * from jsonb_array_elements(p_sets) loop
    v_pos := v_pos + 1;
    if v_item ? 'id' and (v_item->>'id') is not null then
      update public.routine_exercise_sets s2
         set position = v_pos,
             min_reps = (v_item->>'min_reps')::int,
             max_reps = (v_item->>'max_reps')::int,
             weight   = nullif(v_item->>'weight','')::numeric,
             updated_at = now()
       where s2.id = (v_item->>'id')::uuid
         and s2.routine_exercise_id = p_routine_exercise_id
       returning s2.id into v_id;
      if v_id is null then raise exception 'set % not found', v_item->>'id'; end if;
    else
      insert into public.routine_exercise_sets (routine_exercise_id, position, min_reps, max_reps, weight)
      values (p_routine_exercise_id, v_pos,
              (v_item->>'min_reps')::int,
              (v_item->>'max_reps')::int,
              nullif(v_item->>'weight','')::numeric)
      returning routine_exercise_sets.id into v_id;
    end if;
    v_keep := array_append(v_keep, v_id);
  end loop;

  delete from public.routine_exercise_sets s3
   where s3.routine_exercise_id = p_routine_exercise_id
     and s3.id <> all(v_keep);

  return query
    select s4.id, s4.position, s4.min_reps, s4.max_reps, s4.weight
      from public.routine_exercise_sets s4
     where s4.routine_exercise_id = p_routine_exercise_id
     order by s4.position;
end;
$$;
grant execute on function public.replace_routine_exercise_sets(uuid, jsonb) to authenticated;
;
