-- The functions that only exist to serve the RLS policies and the RPCs
-- (ownership and visibility checks that take any user id) are not part of the
-- public API: a signed-in user can't call them through /rest/v1/rpc to find out
-- who is friends with whom or who is an admin. Needs _helpers.sql.
do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  v_exposed text;
  v_helper text;
begin
  perform pg_temp.make_user(a);
  perform pg_temp.make_user(b);

  -- None of them is callable from the API schema by a signed-in user or by anon.
  select string_agg(p.proname, ', ' order by p.proname) into v_exposed
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('can_view_profile', 'can_view_routine', 'can_view_split',
                       'has_active_trainer_relationship', 'is_admin', 'is_gymbro',
                       'is_trainer', 'owns_routine', 'owns_split', 'owns_workout')
     and (has_function_privilege('authenticated', p.oid, 'execute')
          or has_function_privilege('anon', p.oid, 'execute'));
  perform pg_temp.assert_eq('helpers callable through the API', coalesce(v_exposed, 'none'), 'none');

  -- Asking anyway is refused.
  foreach v_helper in array array[
    format('select public.is_gymbro(%L, %L)', a, b),
    format('select public.is_admin(%L)', b),
    format('select public.is_trainer(%L)', b),
    format('select public.can_view_profile(%L, %L)', b, a),
    format('select public.owns_routine(gen_random_uuid(), %L)', b)
  ] loop
    perform pg_temp.expect_error(a, v_helper, 'permission denied|does not exist');
  end loop;

  -- The policies still evaluate them as the signed-in user, so that role keeps
  -- what it needs to run them from the private schema.
  perform pg_temp.assert_eq('signed-in users can reach the private schema',
    has_schema_privilege('authenticated', 'private', 'usage')::text, 'true');
  perform pg_temp.assert_eq('signed-in users can run the ownership check inside policies',
    has_function_privilege('authenticated', 'private.owns_routine(uuid, uuid)', 'execute')::text, 'true');

  raise exception 'ROLLBACK_TEST: helpers_not_exposed ok';
end $$;
