-- Signed-out callers (role anon) can do nothing with the app's data, and
-- signed-in users keep what the app needs. Needs _helpers.sql.
do $$
declare
  v_open text;
  v_closed text;
  v_table text;
  v_count text;
  v_function text;
begin
  -- No function of the app may be callable without a session. Only the
  -- exercise catalog is public on purpose (it holds no user data). Trigger
  -- functions can't be called directly, so they are left out.
  select string_agg(p.proname, ', ' order by p.proname) into v_open
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.prokind = 'f'
     and p.prorettype <> 'trigger'::regtype
     and p.proname not in ('get_exercise', 'get_exercise_filters', 'get_exercises')
     and has_function_privilege('anon', p.oid, 'execute');
  perform pg_temp.assert_eq('functions open to anon', coalesce(v_open, 'none'), 'none');

  -- ...while signed-in users keep the ones the app calls.
  select string_agg(p.proname, ', ' order by p.proname) into v_closed
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in ('add_routine_exercises', 'delete_routine', 'delete_routine_exercise',
                       'replace_routine_exercise_sets', 'get_routine_exercises', 'get_workout_exercises')
     and not has_function_privilege('authenticated', p.oid, 'execute');
  perform pg_temp.assert_eq('app functions closed to signed-in users', coalesce(v_closed, 'none'), 'none');

  -- The tables hold nothing for anon: denied, or RLS hides every row.
  foreach v_table in array array[
    'custom_users', 'friendships', 'splits', 'routines', 'routine_exercises',
    'routine_exercise_sets', 'workouts', 'workout_exercises', 'workout_sets',
    'user_roles', 'user_socials', 'trainer_assignments', 'trainer_gymbros', 'trainer_applications'
  ] loop
    begin
      v_count := pg_temp.scalar_as(null, format('select count(*) from public.%I', v_table));
    exception when insufficient_privilege then
      v_count := '0';
    end;
    perform pg_temp.assert_eq('rows of ' || v_table || ' visible to anon', v_count, '0');
  end loop;

  -- Calling them anyway is refused outright.
  foreach v_function in array array[
    'select public.delete_routine(gen_random_uuid())',
    'select public.delete_routine_exercise(gen_random_uuid())',
    'select count(*) from public.add_routine_exercises(gen_random_uuid(), array[gen_random_uuid()])',
    'select count(*) from public.replace_routine_exercise_sets(gen_random_uuid(), ''[{"min_reps":1,"max_reps":2}]''::jsonb)',
    'select count(*) from public.get_routine_exercises(gen_random_uuid(), ''en'')',
    'select count(*) from public.get_workout_exercises(gen_random_uuid(), ''en'')'
  ] loop
    perform pg_temp.expect_error(null, v_function, 'permission denied');
  end loop;

  raise exception 'ROLLBACK_TEST: anon_privileges ok';
end $$;
