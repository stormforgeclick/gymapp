
-- Índice único parcial: un solo split "Default" por usuario
create unique index if not exists splits_user_default_uq
  on public.splits (user_id)
  where name = 'Default';

-- RPC 1: get_or_create_default_split
create or replace function public.get_or_create_default_split()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_split_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select id into v_split_id
  from public.splits
  where user_id = v_user_id and name = 'Default'
  limit 1;

  if v_split_id is not null then
    return v_split_id;
  end if;

  insert into public.splits (user_id, name, privacy)
  values (v_user_id, 'Default', 'private')
  returning id into v_split_id;

  return v_split_id;
end;
$$;

revoke all on function public.get_or_create_default_split() from public;
grant execute on function public.get_or_create_default_split() to authenticated;

-- RPC 2: create_routine (atómica)
create or replace function public.create_routine(
  p_name text,
  p_color text,
  p_exercises jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_split_id uuid;
  v_routine_id uuid;
  v_next_pos int;
  v_ex jsonb;
  v_ex_index int := 0;
  v_routine_exercise_id uuid;
  v_sets int;
  v_set_i int;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if coalesce(btrim(p_name), '') = '' then
    raise exception 'name required';
  end if;
  if coalesce(btrim(p_color), '') = '' then
    raise exception 'color required';
  end if;
  if jsonb_typeof(p_exercises) <> 'array' or jsonb_array_length(p_exercises) = 0 then
    raise exception 'at least one exercise required';
  end if;

  v_split_id := public.get_or_create_default_split();

  select coalesce(max(position), 0) + 1 into v_next_pos
  from public.routines where split_id = v_split_id;

  insert into public.routines (split_id, position, name, color, privacy)
  values (v_split_id, v_next_pos, btrim(p_name), p_color, 'private')
  returning id into v_routine_id;

  for v_ex in select * from jsonb_array_elements(p_exercises) loop
    v_ex_index := v_ex_index + 1;
    v_sets := coalesce((v_ex->>'sets')::int, 0);

    if (v_ex->>'gymbro_exercise_id') is null then
      raise exception 'exercise % missing gymbro_exercise_id', v_ex_index;
    end if;
    if v_sets < 1 or v_sets > 20 then
      raise exception 'exercise % invalid sets (%)', v_ex_index, v_sets;
    end if;
    if (v_ex->>'min_reps')::int < 1
       or (v_ex->>'max_reps')::int < (v_ex->>'min_reps')::int then
      raise exception 'exercise % invalid rep range', v_ex_index;
    end if;
    if coalesce((v_ex->>'weight')::numeric, 0) < 0 then
      raise exception 'exercise % invalid weight', v_ex_index;
    end if;

    insert into public.routine_exercises (routine_id, gymbro_exercise_id, position)
    values (v_routine_id, (v_ex->>'gymbro_exercise_id')::uuid, v_ex_index)
    returning id into v_routine_exercise_id;

    for v_set_i in 1..v_sets loop
      insert into public.routine_exercise_sets
        (routine_exercise_id, position, min_reps, max_reps, weight, rir)
      values (
        v_routine_exercise_id,
        v_set_i,
        (v_ex->>'min_reps')::int,
        (v_ex->>'max_reps')::int,
        nullif((v_ex->>'weight')::numeric, 0),
        null
      );
    end loop;
  end loop;

  return v_routine_id;
end;
$$;

revoke all on function public.create_routine(text, text, jsonb) from public;
grant execute on function public.create_routine(text, text, jsonb) to authenticated;

-- RPC 3: get_routines
create or replace function public.get_routines(p_language text default 'es')
returns table (id uuid, name text, color text, exercise_count int, muscle_group_tags text[])
language sql
security definer
set search_path = ''
stable
as $$
  select
    r.id,
    r.name,
    r.color,
    coalesce(ec.cnt, 0)::int,
    coalesce(mg.tags, array[]::text[])
  from public.routines r
  join public.splits s on s.id = r.split_id
  left join lateral (
    select count(*)::int as cnt
    from public.routine_exercises re where re.routine_id = r.id
  ) ec on true
  left join lateral (
    select array_agg(distinct upper(coalesce(
      case when p_language = 'en' then mug.name_en else mug.name_es end,
      mug.name_en
    ))) filter (where mug.id is not null) as tags
    from public.routine_exercises re
    join public.gymbro_exercises ge on ge.id = re.gymbro_exercise_id
    left join public.muscle_groups mug on mug.id = ge.muscle_group_id
    where re.routine_id = r.id
  ) mg on true
  where s.user_id = auth.uid()
  order by r.created_at desc;
$$;

revoke all on function public.get_routines(text) from public;
grant execute on function public.get_routines(text) to authenticated;
;
