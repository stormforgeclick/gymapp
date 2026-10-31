-- The RPCs that lean on the ownership and visibility checks keep working end to
-- end: starting and finishing a workout, sharing and importing a routine,
-- viewing a profile and reviewing a trainer application. Needs _helpers.sql.
--   owner = a, another user = b, admin = c
do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  c uuid := gen_random_uuid();
  v_routine uuid;
  v_split uuid;
  v_target_split uuid;
  v_imported uuid;
  v_workout uuid;
  v_application uuid;
  v_exercises uuid[];
begin
  perform pg_temp.make_user(a);
  perform pg_temp.make_user(b);
  perform pg_temp.make_user(c);
  update public.custom_users set profile_privacy = 'public' where id = a;
  insert into public.user_roles (user_id, role) values (c, 'admin');

  v_routine := pg_temp.scalar_as(a,
    $q$select id from public.create_routine('Flow test', '#112233', null)$q$)::uuid;
  select split_id into v_split from public.routines where id = v_routine;
  select array_agg(id) into v_exercises from (select id from public.gymbro_exercises order by id limit 2) x;
  perform pg_temp.scalar_as(a,
    format($q$select count(*) from public.add_routine_exercises(%L, %L::uuid[])$q$, v_routine, v_exercises));

  -- Workout: only the owner starts it, it copies the routine, and a finished
  -- one can't be edited any more.
  perform pg_temp.expect_error(b, format($q$select public.start_workout(%L)$q$, v_routine),
    'not found or not owned');
  v_workout := pg_temp.scalar_as(a, format($q$select public.start_workout(%L)$q$, v_routine))::uuid;
  perform pg_temp.assert_eq('workout copies the routine exercises',
    (select count(*)::text from public.workout_exercises where workout_id = v_workout), '2');
  perform pg_temp.assert_eq('a set can be completed while the workout is open',
    pg_temp.scalar_as(a, format($q$
      with changed as (
        update public.workout_sets set completed = true
         where workout_exercise_id in (select id from public.workout_exercises where workout_id = %L)
        returning 1)
      select (count(*) > 0)::text from changed$q$, v_workout)), 'true');
  perform pg_temp.scalar_as(a, format($q$select id from public.finish_workout(%L)$q$, v_workout));
  perform pg_temp.expect_error(a, format($q$
      update public.workout_sets set completed = false
       where workout_exercise_id in (select id from public.workout_exercises where workout_id = %L)$q$, v_workout),
    'cannot be modified');

  -- Profile: a public profile is visible to anyone signed in, a private one to
  -- a stranger is not.
  perform pg_temp.assert_eq('public profile is visible',
    pg_temp.scalar_as(b, format($q$select count(*) from public.get_profile(%L)$q$, a)), '1');
  update public.custom_users set profile_privacy = 'private' where id = a;
  perform pg_temp.assert_eq('private profile is hidden from a stranger',
    pg_temp.scalar_as(b, format($q$select count(*) from public.get_profile(%L)$q$, a)), '0');
  update public.custom_users set profile_privacy = 'public' where id = a;

  -- Shared routine: hidden while the split is private, readable and importable
  -- once it is public.
  perform pg_temp.assert_eq('private split: routine not shared',
    pg_temp.scalar_as(b, format($q$select count(*) from public.get_shared_routine(%L)$q$, v_routine)), '0');
  perform pg_temp.expect_error(b, format($q$select count(*) from public.import_routine(%L, gen_random_uuid())$q$, v_routine),
    'Target split not found');

  perform pg_temp.scalar_as(a, format($q$select public.set_split_privacy(%L, 'public')$q$, v_split));
  perform pg_temp.assert_eq('public split: routine shared',
    pg_temp.scalar_as(b, format($q$select count(*) from public.get_shared_routine(%L)$q$, v_routine)), '1');
  perform pg_temp.assert_eq('public split: its exercises are shared',
    pg_temp.scalar_as(b, format($q$select count(*) from public.get_shared_routine_exercises(%L, 'en')$q$, v_routine)), '2');

  v_imported := pg_temp.scalar_as(b,
    $q$select id from public.create_routine('Mine', '#445566', null)$q$)::uuid;
  select split_id into v_target_split from public.routines where id = v_imported;
  v_imported := pg_temp.scalar_as(b,
    format($q$select public.import_routine(%L, %L, 'Copy')$q$, v_routine, v_target_split))::uuid;
  perform pg_temp.assert_eq('imported routine belongs to the importer',
    (select count(*)::text from public.routines r join public.splits s on s.id = r.split_id
      where r.id = v_imported and s.user_id = b), '1');
  perform pg_temp.assert_eq('imported routine has the exercises',
    (select count(*)::text from public.routine_exercises where routine_id = v_imported), '2');

  -- Trainer applications: only an admin reviews them.
  v_application := pg_temp.scalar_as(a, $q$select id from public.apply_for_trainer('I coach')$q$)::uuid;
  perform pg_temp.expect_error(b, format($q$select public.review_trainer_application(%L, true, null)$q$, v_application),
    'Only admins');
  perform pg_temp.scalar_as(c, format($q$select id from public.review_trainer_application(%L, true, 'welcome')$q$, v_application));
  perform pg_temp.assert_eq('approved applicant gets the trainer role',
    (select count(*)::text from public.user_roles where user_id = a and role = 'trainer'), '1');

  raise exception 'ROLLBACK_TEST: rpc_flows ok';
end $$;
