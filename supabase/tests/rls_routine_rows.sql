-- Row level security on the exercises and sets of a routine: the owner reads and
-- changes them directly, nobody else can, and no policy of the app asks
-- auth.uid() once per row instead of once per query. Needs _helpers.sql.
--   owner = a, stranger = b
do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  v_routine uuid;
  v_exercises uuid[];
  v_routine_exercise uuid;
  v_set uuid;
  v_per_row text;
  v_who uuid;
  v_label text;
begin
  perform pg_temp.make_user(a);
  perform pg_temp.make_user(b);

  -- No policy calls auth.uid() bare: it has to be wrapped as (select auth.uid())
  -- so Postgres evaluates it once.
  select string_agg(tablename || '.' || policyname, ', ' order by tablename, policyname) into v_per_row
    from pg_policies
   where schemaname = 'public'
     and replace(coalesce(qual, '') || coalesce(with_check, ''), '( SELECT auth.uid() AS uid)', '')
         ~ 'auth\.uid\(\)';
  perform pg_temp.assert_eq('policies that call auth.uid() per row', coalesce(v_per_row, 'none'), 'none');

  v_routine := pg_temp.scalar_as(a,
    $q$select id from public.create_routine('Rows test', '#112233', null)$q$)::uuid;
  select array_agg(id) into v_exercises from (select id from public.gymbro_exercises order by id limit 2) x;
  perform pg_temp.scalar_as(a,
    format($q$select count(*) from public.add_routine_exercises(%L, %L::uuid[])$q$, v_routine, v_exercises));
  select id into v_routine_exercise from public.routine_exercises where routine_id = v_routine order by position limit 1;
  select id into v_set from public.routine_exercise_sets where routine_exercise_id = v_routine_exercise limit 1;

  -- Who can read them.
  foreach v_who in array array[a, b, null] loop
    v_label := case v_who when a then 'owner' when b then 'stranger' else 'anonymous' end;
    perform pg_temp.assert_eq('exercises read by ' || v_label,
      coalesce(pg_temp.scalar_as(v_who, format($q$select count(*) from public.routine_exercises where routine_id = %L$q$, v_routine)), '0'),
      case when v_who = a then '2' else '0' end);
    perform pg_temp.assert_eq('sets read by ' || v_label,
      coalesce(pg_temp.scalar_as(v_who, format($q$select count(*) from public.routine_exercise_sets where routine_exercise_id = %L$q$, v_routine_exercise)), '0'),
      case when v_who = a then '1' else '0' end);
  end loop;

  -- Who can change them.
  perform pg_temp.assert_eq('stranger updates no set',
    pg_temp.scalar_as(b, format($q$with c as (update public.routine_exercise_sets set weight = 99 where id = %L returning 1) select count(*) from c$q$, v_set)), '0');
  perform pg_temp.assert_eq('stranger deletes no set',
    pg_temp.scalar_as(b, format($q$with c as (delete from public.routine_exercise_sets where id = %L returning 1) select count(*) from c$q$, v_set)), '0');
  perform pg_temp.assert_eq('stranger deletes no exercise',
    pg_temp.scalar_as(b, format($q$with c as (delete from public.routine_exercises where id = %L returning 1) select count(*) from c$q$, v_routine_exercise)), '0');
  perform pg_temp.expect_error(b,
    format($q$insert into public.routine_exercise_sets (routine_exercise_id, position, min_reps, max_reps) values (%L, 9, 5, 5)$q$, v_routine_exercise),
    'row-level security');

  perform pg_temp.assert_eq('owner updates a set',
    pg_temp.scalar_as(a, format($q$with c as (update public.routine_exercise_sets set weight = 55 where id = %L returning 1) select count(*) from c$q$, v_set)), '1');
  perform pg_temp.assert_eq('the update was saved',
    (select (weight = 55)::text from public.routine_exercise_sets where id = v_set), 'true');
  perform pg_temp.assert_eq('owner adds a set',
    pg_temp.scalar_as(a, format($q$with c as (insert into public.routine_exercise_sets (routine_exercise_id, position, min_reps, max_reps) values (%L, 9, 5, 5) returning 1) select count(*) from c$q$, v_routine_exercise)), '1');
  perform pg_temp.assert_eq('owner deletes a set',
    pg_temp.scalar_as(a, format($q$with c as (delete from public.routine_exercise_sets where id = %L returning 1) select count(*) from c$q$, v_set)), '1');
  perform pg_temp.assert_eq('owner deletes an exercise',
    pg_temp.scalar_as(a, format($q$with c as (delete from public.routine_exercises where id = %L returning 1) select count(*) from c$q$, v_routine_exercise)), '1');

  raise exception 'ROLLBACK_TEST: rls_routine_rows ok';
end $$;
