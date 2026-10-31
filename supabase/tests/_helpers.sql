-- Helpers shared by the tests in this folder. Run this file first, in the same
-- session/transaction as the test (the Supabase MCP gets both concatenated).
-- Everything lives in pg_temp, so nothing is left in the database.
--
-- A test is one DO block that builds its own users and data, checks things as
-- those users (RLS and auth.uid() apply) and finishes with
--   raise exception 'ROLLBACK_TEST: ...'
-- so nothing is ever saved. An error that starts with ROLLBACK_TEST means
-- every check passed; any other error is a failure.

create or replace function pg_temp.make_user(p_id uuid) returns void
language plpgsql as $$
begin
  -- handle_new_user() creates the matching public.custom_users row.
  insert into auth.users (id, email, aud, role)
  values (p_id, p_id || '@test.invalid', 'authenticated', 'authenticated');
end $$;

-- Runs p_sql as the given user (null = anonymous) and returns the first column
-- of its first row as text. Always called from the default role, so the role
-- switch only lasts for this statement.
create or replace function pg_temp.scalar_as(p_uid uuid, p_sql text) returns text
language plpgsql as $$
declare v text;
begin
  if p_uid is null then
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('role', 'anon', true);
  else
    perform set_config('request.jwt.claims',
      json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', p_uid::text, true);
    perform set_config('role', 'authenticated', true);
  end if;

  begin
    execute p_sql into v;
  exception when others then
    reset role;
    raise;
  end;

  reset role;
  return v;
end $$;

-- p_sql, run as the user, must fail with a message matching the regex.
create or replace function pg_temp.expect_error(p_uid uuid, p_sql text, p_pattern text) returns void
language plpgsql as $$
begin
  begin
    perform pg_temp.scalar_as(p_uid, p_sql);
  exception when others then
    if sqlerrm ~* p_pattern then return; end if;
    raise exception 'ASSERT FAILED: [%] raised [%], expected /%/', p_sql, sqlerrm, p_pattern;
  end;
  raise exception 'ASSERT FAILED: [%] did not fail, expected /%/', p_sql, p_pattern;
end $$;

create or replace function pg_temp.assert_eq(p_label text, p_actual text, p_expected text) returns void
language plpgsql as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'ASSERT FAILED: % (expected [%], got [%])', p_label, p_expected, p_actual;
  end if;
end $$;
