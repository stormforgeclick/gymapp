-- Sharing is decided per split. A split takes the most restrictive level among its
-- routines, so nothing becomes more visible than it was.
update public.splits s
   set privacy = x.level
  from (
    select r.split_id,
           (case min(case r.privacy when 'private' then 0 when 'gymbros' then 1 else 2 end)
              when 0 then 'private' when 1 then 'gymbros' else 'public' end)::public.profile_privacy as level
      from public.routines r
     where r.archived_at is null
     group by r.split_id
  ) x
 where x.split_id = s.id and s.privacy is distinct from x.level;

comment on column public.routines.privacy is
  'Deprecated: visibility is set per split (splits.privacy).';

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
            s.privacy = 'public'
            or (s.privacy = 'gymbros' and public.is_gymbro(s.user_id, p_viewer_id))
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

drop function public.get_splits();

CREATE OR REPLACE FUNCTION public.get_splits()
 RETURNS TABLE (id uuid, name text, is_active boolean, routines integer, created_at timestamptz, privacy text)
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
         m.created_at,
         m.privacy::text
  from mine m
  order by m.created_at, m.name;
$function$;

CREATE OR REPLACE FUNCTION public.set_split_privacy(p_id uuid, p_privacy public.profile_privacy)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  update public.splits set privacy = p_privacy
   where id = p_id and user_id = auth.uid() and archived_at is null;
  if not found then raise exception 'split not found'; end if;
end;
$function$;

drop function public.get_profile_routines(uuid, text);

CREATE OR REPLACE FUNCTION public.get_profile_routines(p_user_id uuid, p_language text default 'es')
 RETURNS TABLE(id uuid, name text, color text, quantity integer, tags text[], split_id uuid, split_name text)
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
    ), array[]::text[]) as tags,
    s.id,
    s.name
  from public.routines r
  join public.splits s on s.id = r.split_id
  where s.user_id = p_user_id
    and auth.uid() is not null
    and public.can_view_routine(r.id, auth.uid())
  order by s.created_at asc, r.position asc, r.created_at asc;
$function$;

drop function public.get_routine_sharing();

revoke all on function public.get_splits() from public, anon;
revoke all on function public.set_split_privacy(uuid, public.profile_privacy) from public, anon;
revoke all on function public.get_profile_routines(uuid, text) from public, anon;
grant execute on function public.get_splits() to authenticated;
grant execute on function public.set_split_privacy(uuid, public.profile_privacy) to authenticated;
grant execute on function public.get_profile_routines(uuid, text) to authenticated;
;
