-- The ownership and visibility checks take any user id as an argument. While they
-- sit in `public`, which the API exposes, any signed-in user can call them
-- through /rest/v1/rpc to look up who is friends with whom or who is an admin.
-- They only exist to serve the RLS policies and the RPCs, so they move to a
-- schema the API doesn't expose.
--
-- Policies keep working: they point at the functions by id, not by name, and
-- the signed-in role keeps EXECUTE on them plus USAGE on the schema.

create schema if not exists private;
grant usage on schema private to authenticated, service_role;

alter function public.can_view_profile(uuid, uuid) set schema private;
alter function public.can_view_routine(uuid, uuid) set schema private;
alter function public.can_view_split(uuid, uuid) set schema private;
alter function public.has_active_trainer_relationship(uuid, uuid) set schema private;
alter function public.is_admin(uuid) set schema private;
alter function public.is_gymbro(uuid, uuid) set schema private;
alter function public.is_trainer(uuid) set schema private;
alter function public.owns_routine(uuid, uuid) set schema private;
alter function public.owns_split(uuid, uuid) set schema private;
alter function public.owns_workout(uuid, uuid) set schema private;

-- Function bodies call them by name, so every call is pointed at the new schema.
-- The definition is read back from the database and recreated with the same
-- owner, grants and settings.
do $$
declare
  v_pattern constant text :=
    'public\.(can_view_profile|can_view_routine|can_view_split|has_active_trainer_relationship|is_admin|is_gymbro|is_trainer|owns_routine|owns_split|owns_workout)\(';
  v_function oid;
begin
  for v_function in
    select p.oid
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('public', 'private')
       and p.prokind = 'f'
       and p.prosrc ~ v_pattern
  loop
    execute regexp_replace(pg_get_functiondef(v_function), v_pattern, 'private.\1(', 'g');
  end loop;
end $$;
