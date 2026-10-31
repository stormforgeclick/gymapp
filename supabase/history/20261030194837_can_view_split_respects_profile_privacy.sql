-- A split is visible to others only if its owner's profile is visible to them,
-- the same rule can_view_routine already applies to routines. Before this, a
-- public split of a private profile could be listed and imported (import_split
-- copies its routines) by any signed-in user. Archived splits are also closed
-- to others. The owner, and a gymbro the split was assigned to, are unaffected.
create or replace function public.can_view_split(p_split_id uuid, p_viewer_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to ''
as $function$
  select exists (
    select 1
    from public.splits s
    where s.id = p_split_id
      and (
        s.user_id = p_viewer_id
        or (
          s.archived_at is null
          and public.can_view_profile(s.user_id, p_viewer_id)
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
$function$;;
