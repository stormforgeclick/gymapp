-- delete_routine archives instead of deleting: history is kept, an unfinished
-- workout is discarded, and only the owner can do it. Needs _helpers.sql.
do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  v_open uuid;      -- routine with a workout in progress
  v_done uuid;      -- routine with a finished workout
  v_exercise uuid;
  v_workout uuid;
  v_finished uuid := gen_random_uuid();
begin
  perform pg_temp.make_user(a);
  perform pg_temp.make_user(b);
  select id into v_exercise from public.gymbro_exercises order by id limit 1;

  v_open := pg_temp.scalar_as(a, $q$select id from public.create_routine('Open workout', '#112233', null)$q$)::uuid;
  v_done := pg_temp.scalar_as(a, $q$select id from public.create_routine('Finished workout', '#112233', null)$q$)::uuid;
  perform pg_temp.scalar_as(a,
    format($q$select count(*) from public.add_routine_exercises(%L, array[%L]::uuid[])$q$, v_open, v_exercise));

  v_workout := pg_temp.scalar_as(a, format($q$select public.start_workout(%L)$q$, v_open))::uuid;
  insert into public.workouts (id, user_id, routine_id, started_at, finished_at)
  values (v_finished, a, v_done, now() - interval '1 hour', now());

  -- Someone else can't delete it.
  perform pg_temp.expect_error(b, format($q$select public.delete_routine(%L)$q$, v_open),
    'not found or not owned');

  -- The owner can: the row stays (archived) and the unfinished workout goes.
  perform pg_temp.scalar_as(a, format($q$select public.delete_routine(%L)$q$, v_open));
  perform pg_temp.assert_eq('routine is archived, not deleted',
    (select (archived_at is not null)::text from public.routines where id = v_open), 'true');
  perform pg_temp.assert_eq('workout in progress is discarded',
    (select count(*)::text from public.workouts where id = v_workout), '0');

  -- A routine with a finished workout keeps its history.
  perform pg_temp.scalar_as(a, format($q$select public.delete_routine(%L)$q$, v_done));
  perform pg_temp.assert_eq('finished workout is kept',
    (select count(*)::text from public.workouts where id = v_finished), '1');
  perform pg_temp.assert_eq('finished workout still points at its routine',
    (select routine_id::text from public.workouts where id = v_finished), v_done::text);

  -- Archived routines leave the list and can't be used.
  perform pg_temp.assert_eq('archived routines are not listed',
    pg_temp.scalar_as(a, format($q$select count(*) from public.get_routines('en') where id in (%L, %L)$q$, v_open, v_done)),
    '0');
  perform pg_temp.expect_error(a, format($q$select public.start_workout(%L)$q$, v_open),
    'not found or not owned');
  perform pg_temp.expect_error(a, format($q$select public.delete_routine(%L)$q$, v_open),
    'not found or not owned');

  raise exception 'ROLLBACK_TEST: routine_archive ok';
end $$;
