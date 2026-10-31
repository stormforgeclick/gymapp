
-- RLS policies already exist; skip.

-- Drop existing functions with incompatible signatures before replacing.
drop function if exists public.get_routines(text);
drop function if exists public.create_routine(text, text, jsonb);

-- ========= ensure_default_split =========
create or replace function public.ensure_default_split()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_split uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  insert into public.custom_users (id) values (v_uid) on conflict (id) do nothing;

  select id into v_split from public.splits
   where user_id = v_uid and name = 'Default' limit 1;

  if v_split is null then
    insert into public.splits (user_id, name, privacy)
    values (v_uid, 'Default', 'private')
    returning id into v_split;
  end if;

  return v_split;
end;
$$;
revoke all on function public.ensure_default_split() from public;
grant execute on function public.ensure_default_split() to authenticated;

-- ========= get_routines =========
create or replace function public.get_routines(p_language text default 'es')
returns table (id uuid, name text, color text, quantity int, tags text[])
language sql stable security invoker set search_path = public
as $$
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
  where s.user_id = auth.uid()
  order by r.position asc, r.created_at asc;
$$;
grant execute on function public.get_routines(text) to authenticated;

-- ========= create_routine =========
create or replace function public.create_routine(p_name text, p_color text)
returns table (id uuid, name text, color text, quantity int, tags text[])
language plpgsql security invoker set search_path = public
as $$
declare
  v_split uuid;
  v_pos int;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'name required'; end if;

  v_split := public.ensure_default_split();
  select coalesce(max(position), 0) + 1 into v_pos from public.routines where split_id = v_split;

  insert into public.routines (split_id, position, name, color, privacy)
  values (v_split, v_pos, btrim(p_name), p_color, 'private')
  returning routines.id into v_id;

  return query select v_id, btrim(p_name), p_color, 0::int, array[]::text[];
end;
$$;
grant execute on function public.create_routine(text, text) to authenticated;

-- ========= update_routine =========
create or replace function public.update_routine(p_id uuid, p_name text, p_color text)
returns table (id uuid, name text, color text, quantity int, tags text[])
language plpgsql security invoker set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'name required'; end if;

  update public.routines r
     set name = btrim(p_name), color = p_color, updated_at = now()
   where r.id = p_id
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
$$;
grant execute on function public.update_routine(uuid, text, text) to authenticated;

-- ========= delete_routine =========
create or replace function public.delete_routine(p_id uuid)
returns uuid
language plpgsql security invoker set search_path = public
as $$
declare v_del uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from public.routines r
   where r.id = p_id
     and exists (select 1 from public.splits s where s.id = r.split_id and s.user_id = auth.uid())
  returning r.id into v_del;
  if v_del is null then raise exception 'routine not found or not owned'; end if;
  return v_del;
end;
$$;
grant execute on function public.delete_routine(uuid) to authenticated;
;
