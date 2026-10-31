-- Several splits per user, one of them active. Splits are archived, never deleted,
-- because finished workouts keep pointing at their routines.

alter table public.splits add column archived_at timestamptz;
alter table public.custom_users
  add column active_split_id uuid references public.splits(id) on delete set null;

-- The name 'Default' no longer means anything.
drop index public.splits_user_default_uq;

update public.splits s
   set name = case when cu.language = 'es' then 'Principal' else 'Main' end
  from public.custom_users cu
 where cu.id = s.user_id and s.name = 'Default';

create unique index splits_user_name_uq
  on public.splits (user_id, lower(btrim(name)))
  where archived_at is null;

update public.custom_users cu
   set active_split_id = (
     select s.id from public.splits s
      where s.user_id = cu.id and s.archived_at is null
      order by s.created_at limit 1
   )
 where cu.active_split_id is null;

-- The user's active split, repaired or created when it is missing.
CREATE OR REPLACE FUNCTION public.ensure_default_split()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_split uuid;
  v_lang text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  insert into public.custom_users (id) values (v_uid) on conflict (id) do nothing;

  select s.id into v_split
    from public.custom_users cu
    join public.splits s on s.id = cu.active_split_id
   where cu.id = v_uid and s.user_id = v_uid and s.archived_at is null;
  if v_split is not null then return v_split; end if;

  select id into v_split from public.splits
   where user_id = v_uid and archived_at is null
   order by created_at limit 1;

  if v_split is null then
    select language into v_lang from public.custom_users where id = v_uid;
    insert into public.splits (user_id, name, privacy)
    values (v_uid, case when v_lang = 'es' then 'Principal' else 'Main' end, 'private')
    returning id into v_split;
  end if;

  update public.custom_users set active_split_id = v_split where id = v_uid;
  return v_split;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_splits()
 RETURNS TABLE (id uuid, name text, is_active boolean, routines integer, created_at timestamptz)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with mine as (
    select s.* from public.splits s
     where s.user_id = auth.uid() and s.archived_at is null
  ),
  effective as (
    select coalesce(
      (select m.id from mine m join public.custom_users cu on cu.active_split_id = m.id where cu.id = auth.uid()),
      (select m.id from mine m order by m.created_at limit 1)
    ) as id
  )
  select m.id, m.name, m.id = (select e.id from effective e),
         (select count(*)::int from public.routines r where r.split_id = m.id and r.archived_at is null),
         m.created_at
  from mine m
  order by m.created_at, m.name;
$function$;

CREATE OR REPLACE FUNCTION public.create_split(p_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'name required'; end if;

  begin
    insert into public.splits (user_id, name, privacy)
    values (auth.uid(), btrim(p_name), 'private')
    returning id into v_id;
  exception when unique_violation then
    raise exception 'split name already exists';
  end;

  update public.custom_users set active_split_id = v_id where id = auth.uid();
  return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.rename_split(p_id uuid, p_name text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'name required'; end if;

  begin
    update public.splits
       set name = btrim(p_name)
     where id = p_id and user_id = auth.uid() and archived_at is null;
  exception when unique_violation then
    raise exception 'split name already exists';
  end;

  if not found then raise exception 'split not found'; end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_active_split(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  perform 1 from public.splits
   where id = p_id and user_id = auth.uid() and archived_at is null;
  if not found then raise exception 'split not found'; end if;

  update public.custom_users set active_split_id = p_id where id = auth.uid();
end;
$function$;

-- Archives the split and its routines. History is kept; workouts in progress for
-- those routines are discarded, as when a routine is deleted.
CREATE OR REPLACE FUNCTION public.archive_split(p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare v_next uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  perform 1 from public.splits
   where id = p_id and user_id = auth.uid() and archived_at is null
   for update;
  if not found then raise exception 'split not found'; end if;

  if (select count(*) from public.splits
       where user_id = auth.uid() and archived_at is null) <= 1 then
    raise exception 'cannot archive the only split';
  end if;

  delete from public.workouts w
   using public.routines r
   where w.routine_id = r.id and r.split_id = p_id
     and w.finished_at is null and w.user_id = auth.uid();

  update public.routines set archived_at = now()
   where split_id = p_id and archived_at is null;
  update public.splits set archived_at = now() where id = p_id;

  if (select active_split_id from public.custom_users where id = auth.uid()) is not distinct from p_id then
    select id into v_next from public.splits
     where user_id = auth.uid() and archived_at is null
     order by created_at limit 1;
    update public.custom_users set active_split_id = v_next where id = auth.uid();
  end if;
end;
$function$;

-- Copies the current routines, exercises and sets into a new split and activates it.
CREATE OR REPLACE FUNCTION public.duplicate_split(p_id uuid, p_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_src public.splits;
  v_new uuid;
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
    insert into public.splits (user_id, name, privacy, source_split_id)
    values (auth.uid(), btrim(p_name), 'private', v_src.id)
    returning id into v_new;
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

CREATE OR REPLACE FUNCTION public.move_routine_to_split(p_routine_id uuid, p_split_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_current uuid;
  v_pos int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select r.split_id into v_current
    from public.routines r
    join public.splits s on s.id = r.split_id
   where r.id = p_routine_id and s.user_id = auth.uid() and r.archived_at is null;
  if not found then raise exception 'routine not found'; end if;

  if v_current = p_split_id then return; end if;

  perform 1 from public.splits
   where id = p_split_id and user_id = auth.uid() and archived_at is null
   for update;
  if not found then raise exception 'split not found'; end if;

  select coalesce(max(position), 0) + 1 into v_pos
    from public.routines where split_id = p_split_id;

  update public.routines
     set split_id = p_split_id, position = v_pos
   where id = p_routine_id;
end;
$function$;

-- Changed signatures: drop the old ones so PostgREST never sees two candidates.
drop function public.get_routines(text);
drop function public.create_routine(text, text);
drop function public.update_routine(uuid, text, text);
drop function public.get_routine_sharing();

CREATE OR REPLACE FUNCTION public.get_routines(p_language text DEFAULT 'es'::text)
 RETURNS TABLE(id uuid, name text, color text, quantity integer, tags text[], split_id uuid)
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
    ), array[]::text[]) as tags,
    r.split_id
  from public.routines r
  join public.splits s on s.id = r.split_id
  where s.user_id = auth.uid() and r.archived_at is null and s.archived_at is null
  order by r.position asc, r.created_at asc;
$function$;

CREATE OR REPLACE FUNCTION public.create_routine(p_name text, p_color text, p_split_id uuid DEFAULT NULL)
 RETURNS TABLE(id uuid, name text, color text, quantity integer, tags text[], split_id uuid)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_split uuid;
  v_pos int;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'name required'; end if;

  if p_split_id is null then
    v_split := public.ensure_default_split();
  else
    select s.id into v_split from public.splits s
     where s.id = p_split_id and s.user_id = auth.uid() and s.archived_at is null;
    if v_split is null then raise exception 'split not found'; end if;
  end if;

  select coalesce(max(position), 0) + 1 into v_pos from public.routines where routines.split_id = v_split;

  insert into public.routines (split_id, position, name, color, privacy)
  values (v_split, v_pos, btrim(p_name), p_color, 'private')
  returning routines.id into v_id;

  return query select v_id, btrim(p_name), p_color, 0::int, array[]::text[], v_split;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_routine(p_id uuid, p_name text, p_color text)
 RETURNS TABLE(id uuid, name text, color text, quantity integer, tags text[], split_id uuid)
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
      where re.routine_id = r.id), array[]::text[]),
    r.split_id
  from public.routines r where r.id = p_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_routine_sharing()
 RETURNS TABLE (id uuid, name text, color text, privacy text, quantity integer, split_id uuid, split_name text)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  select r.id, r.name, r.color, r.privacy::text,
         (select count(*)::int from public.routine_exercises re where re.routine_id = r.id),
         s.id, s.name
  from public.routines r
  join public.splits s on s.id = r.split_id
  where s.user_id = auth.uid() and r.archived_at is null and s.archived_at is null
  order by s.created_at asc, r.position asc, r.created_at asc;
$function$;

CREATE OR REPLACE FUNCTION public.can_view_routine(p_routine_id uuid, p_viewer_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  select exists (
    select 1
    from public.routines r
    join public.splits s on s.id = r.split_id
    where r.id = p_routine_id
      and r.archived_at is null
      and s.archived_at is null
      and (
        s.user_id = p_viewer_id
        or (
          public.can_view_profile(s.user_id, p_viewer_id)
          and (
            r.privacy = 'public'
            or (r.privacy = 'gymbros' and public.is_gymbro(s.user_id, p_viewer_id))
          )
        )
        or exists (
          select 1
          from public.trainer_assignments ta
          where ta.split_id = s.id
            and ta.gymbro_id = p_viewer_id
            and ta.status in ('pending', 'accepted')
        )
      )
  );
$function$;

revoke all on function public.get_splits() from public, anon;
revoke all on function public.create_split(text) from public, anon;
revoke all on function public.rename_split(uuid, text) from public, anon;
revoke all on function public.set_active_split(uuid) from public, anon;
revoke all on function public.archive_split(uuid) from public, anon;
revoke all on function public.duplicate_split(uuid, text) from public, anon;
revoke all on function public.move_routine_to_split(uuid, uuid) from public, anon;
revoke all on function public.get_routines(text) from public, anon;
revoke all on function public.create_routine(text, text, uuid) from public, anon;
revoke all on function public.update_routine(uuid, text, text) from public, anon;
revoke all on function public.get_routine_sharing() from public, anon;
grant execute on function public.get_splits() to authenticated;
grant execute on function public.create_split(text) to authenticated;
grant execute on function public.rename_split(uuid, text) to authenticated;
grant execute on function public.set_active_split(uuid) to authenticated;
grant execute on function public.archive_split(uuid) to authenticated;
grant execute on function public.duplicate_split(uuid, text) to authenticated;
grant execute on function public.move_routine_to_split(uuid, uuid) to authenticated;
grant execute on function public.get_routines(text) to authenticated;
grant execute on function public.create_routine(text, text, uuid) to authenticated;
grant execute on function public.update_routine(uuid, text, text) to authenticated;
grant execute on function public.get_routine_sharing() to authenticated;
;
