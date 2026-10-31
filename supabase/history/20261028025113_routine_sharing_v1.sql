-- A routine is visible to its owner, to people its privacy allows (and whose profile
-- allows them), and to the gymbro a trainer assigned it to.
create or replace function public.can_view_routine(p_routine_id uuid, p_viewer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.routines r
    join public.splits s on s.id = r.split_id
    where r.id = p_routine_id
      and r.archived_at is null
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

revoke all on function public.can_view_routine(uuid, uuid) from public, anon;
grant execute on function public.can_view_routine(uuid, uuid) to authenticated;

drop policy "Users view routines of permitted split" on public.routines;
create policy "Users view shared routines" on public.routines
  for select to authenticated
  using (public.can_view_routine(id, (select auth.uid())));

drop policy "Users view exercises of permitted routine" on public.routine_exercises;
create policy "Users view exercises of shared routines" on public.routine_exercises
  for select to authenticated
  using (public.can_view_routine(routine_id, (select auth.uid())));

drop policy "Users view sets of permitted routine" on public.routine_exercise_sets;
create policy "Users view sets of shared routines" on public.routine_exercise_sets
  for select to authenticated
  using (exists (
    select 1 from public.routine_exercises re
    where re.id = routine_exercise_sets.routine_exercise_id
      and public.can_view_routine(re.routine_id, (select auth.uid()))
  ));

-- Importing checks the routine's own privacy instead of its split's.
create or replace function public.import_routine(p_source_routine_id uuid, p_target_split_id uuid, p_name text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_source_routine public.routines%rowtype;
  v_source_exercise public.routine_exercises%rowtype;
  v_source_set public.routine_exercise_sets%rowtype;
  v_new_routine_id uuid;
  v_new_exercise_id uuid;
  v_position integer;
begin
  perform 1
  from public.splits
  where id = p_target_split_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Target split not found or not owned by current user';
  end if;

  select r.*
  into v_source_routine
  from public.routines r
  where r.id = p_source_routine_id;

  if not found
    or not public.can_view_routine(p_source_routine_id, auth.uid()) then
    raise exception 'Source routine not found or unavailable';
  end if;

  select coalesce(max(position), 0) + 1
  into v_position
  from public.routines
  where split_id = p_target_split_id;

  insert into public.routines (split_id, position, name, color, privacy, source_routine_id)
  values (
    p_target_split_id,
    v_position,
    coalesce(nullif(trim(p_name), ''), v_source_routine.name),
    v_source_routine.color,
    'private',
    v_source_routine.id
  )
  returning id into v_new_routine_id;

  for v_source_exercise in
    select * from public.routine_exercises
    where routine_id = v_source_routine.id
    order by position
  loop
    insert into public.routine_exercises (routine_id, gymbro_exercise_id, position, notes)
    values (v_new_routine_id, v_source_exercise.gymbro_exercise_id, v_source_exercise.position, v_source_exercise.notes)
    returning id into v_new_exercise_id;

    for v_source_set in
      select * from public.routine_exercise_sets
      where routine_exercise_id = v_source_exercise.id
      order by position
    loop
      insert into public.routine_exercise_sets (routine_exercise_id, position, min_reps, max_reps, rir, weight)
      values (v_new_exercise_id, v_source_set.position, v_source_set.min_reps, v_source_set.max_reps, v_source_set.rir, v_source_set.weight);
    end loop;
  end loop;

  return v_new_routine_id;
end;
$function$;

-- The user's own routines with their sharing level, for the profile screen.
create or replace function public.get_routine_sharing()
returns table (id uuid, name text, color text, privacy text, quantity integer)
language sql
stable
security definer
set search_path = ''
as $function$
  select r.id, r.name, r.color, r.privacy::text,
         (select count(*)::int from public.routine_exercises re where re.routine_id = r.id)
  from public.routines r
  join public.splits s on s.id = r.split_id
  where s.user_id = auth.uid() and r.archived_at is null
  order by r.position asc, r.created_at asc;
$function$;

-- What the viewer is allowed to see of another person's routines.
create or replace function public.get_profile_routines(p_user_id uuid, p_language text default 'es')
returns table (id uuid, name text, color text, quantity integer, tags text[])
language sql
stable
security definer
set search_path = ''
as $function$
  select
    r.id, r.name, r.color,
    (select count(*)::int from public.routine_exercises re where re.routine_id = r.id) as quantity,
    coalesce((
      select array_agg(distinct case when p_language = 'en' then mg.name_en else coalesce(mg.name_es, mg.name_en) end)
      from public.routine_exercises re
      join public.gymbro_exercises ge on ge.id = re.gymbro_exercise_id
      join public.muscle_groups mg on mg.id = ge.muscle_group_id
      where re.routine_id = r.id
    ), array[]::text[]) as tags
  from public.routines r
  join public.splits s on s.id = r.split_id
  where s.user_id = p_user_id
    and auth.uid() is not null
    and public.can_view_routine(r.id, auth.uid())
  order by r.position asc, r.created_at asc;
$function$;

create or replace function public.get_shared_routine(p_routine_id uuid)
returns table (
  id uuid, name text, color text, quantity integer, owner_id uuid, owner_user_name text,
  owner_first_name text, owner_last_name text, owner_avatar_url text
)
language sql
stable
security definer
set search_path = ''
as $function$
  select r.id, r.name, r.color,
         (select count(*)::int from public.routine_exercises re where re.routine_id = r.id),
         u.id, u.user_name, u.first_name, u.last_name, u.avatar_url
  from public.routines r
  join public.splits s on s.id = r.split_id
  join public.custom_users u on u.id = s.user_id
  where r.id = p_routine_id
    and auth.uid() is not null
    and public.can_view_routine(r.id, auth.uid());
$function$;

create or replace function public.get_shared_routine_exercises(p_routine_id uuid, p_language text default 'es')
returns table (id uuid, gymbro_exercise_id uuid, "position" integer, name text, image text, muscle_group text, sets jsonb)
language sql
stable
security definer
set search_path = ''
as $function$
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
  where re.routine_id = p_routine_id
    and auth.uid() is not null
    and public.can_view_routine(re.routine_id, auth.uid())
  order by re.position asc;
$function$;

revoke all on function public.get_routine_sharing() from public, anon;
revoke all on function public.get_profile_routines(uuid, text) from public, anon;
revoke all on function public.get_shared_routine(uuid) from public, anon;
revoke all on function public.get_shared_routine_exercises(uuid, text) from public, anon;
grant execute on function public.get_routine_sharing() to authenticated;
grant execute on function public.get_profile_routines(uuid, text) to authenticated;
grant execute on function public.get_shared_routine(uuid) to authenticated;
grant execute on function public.get_shared_routine_exercises(uuid, text) to authenticated;
;
