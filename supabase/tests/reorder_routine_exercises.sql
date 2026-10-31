-- reorder_routine_exercises: the owner can reorder; bad id lists, other users,
-- archived routines and anonymous callers are refused and change nothing.
-- Needs _helpers.sql.
do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  v_routine uuid;
  v_ex uuid[];
  v_ids uuid[];
  v_reversed uuid[];
  v_call text := $q$select public.reorder_routine_exercises(%L, %L::uuid[])$q$;
  v_order text := $q$select string_agg(id::text, ',' order by position) from public.routine_exercises where routine_id = %L$q$;
begin
  perform pg_temp.make_user(a);
  perform pg_temp.make_user(b);

  v_routine := pg_temp.scalar_as(a,
    $q$select id from public.create_routine('Reorder test', '#112233', null)$q$)::uuid;
  select array_agg(id) into v_ex from (select id from public.gymbro_exercises order by id limit 3) x;
  perform pg_temp.scalar_as(a,
    format($q$select count(*) from public.add_routine_exercises(%L, %L::uuid[])$q$, v_routine, v_ex));

  select array_agg(id order by position) into v_ids
    from public.routine_exercises where routine_id = v_routine;
  perform pg_temp.assert_eq('three exercises added', coalesce(array_length(v_ids, 1), 0)::text, '3');
  v_reversed := array[v_ids[3], v_ids[2], v_ids[1]];

  -- The owner reorders; positions end up exactly 1..n in the new order.
  perform pg_temp.scalar_as(a, format(v_call, v_routine, v_reversed));
  perform pg_temp.assert_eq('new order saved',
    (select string_agg(id::text, ',' order by position) from public.routine_exercises where routine_id = v_routine),
    array_to_string(v_reversed, ','));
  perform pg_temp.assert_eq('positions are 1..n',
    (select string_agg(position::text, ',' order by position) from public.routine_exercises where routine_id = v_routine),
    '1,2,3');

  -- Bad id lists are refused...
  perform pg_temp.expect_error(a, format(v_call, v_routine, array[v_ids[1], v_ids[2]]),
    'ids must be exactly');
  perform pg_temp.expect_error(a, format(v_call, v_routine, array[v_ids[1], v_ids[1], v_ids[2]]),
    'ids must be exactly');
  perform pg_temp.expect_error(a, format(v_call, v_routine, array[v_ids[1], v_ids[2], gen_random_uuid()]),
    'ids must be exactly');
  perform pg_temp.expect_error(a, format(v_call, v_routine, array[]::uuid[]),
    'ids must be exactly');

  -- ...as is anyone who does not own the routine, or is not signed in.
  perform pg_temp.expect_error(b, format(v_call, v_routine, v_ids), 'not found or not owned');
  perform pg_temp.expect_error(null, format(v_call, v_routine, v_ids),
    'not authenticated|permission denied');

  -- None of that changed the saved order.
  perform pg_temp.assert_eq('order unchanged after refusals',
    (select string_agg(id::text, ',' order by position) from public.routine_exercises where routine_id = v_routine),
    array_to_string(v_reversed, ','));

  -- An archived routine can't be reordered.
  update public.routines set archived_at = now() where id = v_routine;
  perform pg_temp.expect_error(a, format(v_call, v_routine, v_ids), 'not found or not owned');

  raise exception 'ROLLBACK_TEST: reorder_routine_exercises ok';
end $$;
