-- Split privacy: who can see a split and its routines. Needs _helpers.sql.
--   owner = a, gymbro of the owner = b, stranger = c, assigned gymbro = d
--   private  -> only a      gymbros -> a and b      public -> a, b and c
-- The owner's profile is public in the first part, so only the split's own
-- privacy decides; after that the profile's privacy and archiving are checked.
do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  c uuid := gen_random_uuid();
  d uuid := gen_random_uuid();
  v_routine uuid;
  v_split uuid;
  v_exercise uuid;
  v_imported uuid;
  v_privacy text;
  v_expected text;       -- who should see it: a|ab|abc
  v_who uuid;
  v_name text;
  v_seen text;
begin
  perform pg_temp.make_user(a);
  perform pg_temp.make_user(b);
  perform pg_temp.make_user(c);
  perform pg_temp.make_user(d);
  update public.custom_users set profile_privacy = 'public' where id = a;
  insert into public.friendships (requester_id, addressee_id, status) values (a, b, 'accepted');

  v_routine := pg_temp.scalar_as(a,
    $q$select id from public.create_routine('Shared test', '#112233', null)$q$)::uuid;
  select split_id into v_split from public.routines where id = v_routine;
  select id into v_exercise from public.gymbro_exercises order by id limit 1;
  perform pg_temp.scalar_as(a,
    format($q$select count(*) from public.add_routine_exercises(%L, array[%L]::uuid[])$q$, v_routine, v_exercise));

  -- A new split starts private.
  perform pg_temp.assert_eq('new split is private', (select privacy::text from public.splits where id = v_split), 'private');

  foreach v_privacy in array array['private', 'gymbros', 'public'] loop
    perform pg_temp.scalar_as(a, format($q$select public.set_split_privacy(%L, %L)$q$, v_split, v_privacy));
    v_expected := case v_privacy when 'private' then 'a' when 'gymbros' then 'ab' else 'abc' end;

    -- The split row, the routine row, its exercises and the profile listing all agree.
    foreach v_name in array array['split', 'routine', 'exercises', 'listing'] loop
      v_seen := '';
      foreach v_who in array array[a, b, c] loop
        if pg_temp.scalar_as(v_who, case v_name
          when 'split' then format($q$select count(*) from public.splits where id = %L$q$, v_split)
          when 'routine' then format($q$select count(*) from public.routines where id = %L$q$, v_routine)
          when 'exercises' then format($q$select count(*) from public.routine_exercises where routine_id = %L$q$, v_routine)
          else format($q$select count(*) from public.get_profile_routines(%L, 'en') where id = %L$q$, a, v_routine)
        end)::int > 0 then
          v_seen := v_seen || case v_who when a then 'a' when b then 'b' else 'c' end;
        end if;
      end loop;
      perform pg_temp.assert_eq(format('%s of a %s split seen by', v_name, v_privacy), v_seen, v_expected);
    end loop;
  end loop;

  -- Only the owner changes the privacy.
  perform pg_temp.expect_error(b, format($q$select public.set_split_privacy(%L, 'public')$q$, v_split),
    'split not found');
  perform pg_temp.assert_eq('privacy still public after a stranger tried',
    (select privacy::text from public.splits where id = v_split), 'public');

  -- A private profile closes its splits to others, whatever the split says:
  -- the routines, the split row, and importing it (which copies its routines).
  update public.custom_users set profile_privacy = 'private' where id = a;
  perform pg_temp.assert_eq('private profile hides routines from a stranger',
    pg_temp.scalar_as(c, format($q$select count(*) from public.routines where id = %L$q$, v_routine)), '0');
  perform pg_temp.assert_eq('private profile hides a public split row from a stranger',
    pg_temp.scalar_as(c, format($q$select count(*) from public.splits where id = %L$q$, v_split)), '0');
  perform pg_temp.expect_error(c, format($q$select public.import_split(%L)$q$, v_split), 'cannot import');
  perform pg_temp.assert_eq('nothing was copied to the stranger',
    (select count(*)::text from public.splits where user_id = c), '0');
  perform pg_temp.assert_eq('the owner still sees the routine',
    pg_temp.scalar_as(a, format($q$select count(*) from public.routines where id = %L$q$, v_routine)), '1');
  perform pg_temp.assert_eq('the owner still sees the split',
    pg_temp.scalar_as(a, format($q$select count(*) from public.splits where id = %L$q$, v_split)), '1');

  -- Same for a gymbro with a gymbros split, until the profile lets gymbros in.
  perform pg_temp.scalar_as(a, format($q$select public.set_split_privacy(%L, 'gymbros')$q$, v_split));
  perform pg_temp.assert_eq('private profile hides a gymbros split from a gymbro',
    pg_temp.scalar_as(b, format($q$select count(*) from public.splits where id = %L$q$, v_split)), '0');
  update public.custom_users set profile_privacy = 'gymbros' where id = a;
  perform pg_temp.assert_eq('gymbros profile shows a gymbros split to a gymbro',
    pg_temp.scalar_as(b, format($q$select count(*) from public.splits where id = %L$q$, v_split)), '1');
  perform pg_temp.assert_eq('gymbros profile still hides it from a stranger',
    pg_temp.scalar_as(c, format($q$select count(*) from public.splits where id = %L$q$, v_split)), '0');

  -- A trainer assignment opens that one split to the gymbro it was assigned to,
  -- even though the profile is private.
  perform pg_temp.scalar_as(a, format($q$select public.set_split_privacy(%L, 'private')$q$, v_split));
  update public.custom_users set profile_privacy = 'private' where id = a;
  perform pg_temp.assert_eq('no assignment, no access',
    pg_temp.scalar_as(d, format($q$select count(*) from public.splits where id = %L$q$, v_split)), '0');
  insert into public.trainer_assignments (trainer_id, gymbro_id, split_id, status) values (a, d, v_split, 'accepted');
  perform pg_temp.assert_eq('assigned split is visible to the assigned gymbro',
    pg_temp.scalar_as(d, format($q$select count(*) from public.splits where id = %L$q$, v_split)), '1');
  perform pg_temp.assert_eq('and still hidden from everyone else',
    pg_temp.scalar_as(c, format($q$select count(*) from public.splits where id = %L$q$, v_split)), '0');

  -- With a public profile and a public split a stranger can see and import it.
  update public.custom_users set profile_privacy = 'public' where id = a;
  perform pg_temp.scalar_as(a, format($q$select public.set_split_privacy(%L, 'public')$q$, v_split));
  v_imported := pg_temp.scalar_as(c, format($q$select public.import_split(%L)$q$, v_split))::uuid;
  perform pg_temp.assert_eq('a public split of a public profile can be imported',
    (select count(*)::text from public.splits where id = v_imported and user_id = c), '1');

  -- Archived routines are not shared.
  update public.routines set archived_at = now() where id = v_routine;
  perform pg_temp.assert_eq('archived routine is hidden from others',
    pg_temp.scalar_as(c, format($q$select count(*) from public.routines where id = %L$q$, v_routine)), '0');

  -- Neither are archived splits (the owner still sees them).
  update public.splits set archived_at = now() where id = v_split;
  perform pg_temp.assert_eq('archived split is hidden from others',
    pg_temp.scalar_as(b, format($q$select count(*) from public.splits where id = %L$q$, v_split)), '0');
  perform pg_temp.expect_error(b, format($q$select public.import_split(%L)$q$, v_split), 'cannot import');
  perform pg_temp.assert_eq('the owner still sees the archived split',
    pg_temp.scalar_as(a, format($q$select count(*) from public.splits where id = %L$q$, v_split)), '1');

  raise exception 'ROLLBACK_TEST: split_privacy ok';
end $$;
