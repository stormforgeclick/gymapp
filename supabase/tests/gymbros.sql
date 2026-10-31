-- Gymbro requests: who can send, accept and see what. Needs _helpers.sql.
do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  c uuid := gen_random_uuid();
  d uuid := gen_random_uuid();
  v_request uuid;
begin
  perform pg_temp.make_user(a);
  perform pg_temp.make_user(b);
  perform pg_temp.make_user(c);
  perform pg_temp.make_user(d);
  -- New profiles are private: b and d can be found, c can not.
  update public.custom_users set profile_privacy = 'gymbros' where id = b;
  update public.custom_users set profile_privacy = 'public' where id = d;

  -- Requests to oneself or to a private profile are refused.
  perform pg_temp.expect_error(a, format($q$select public.send_gymbro_request(%L)$q$, a), 'cannot add yourself');
  perform pg_temp.expect_error(a, format($q$select public.send_gymbro_request(%L)$q$, c), 'user unavailable');
  perform pg_temp.expect_error(null, format($q$select public.send_gymbro_request(%L)$q$, b),
    'not authenticated|permission denied');

  -- a asks b.
  perform pg_temp.assert_eq('request is pending',
    pg_temp.scalar_as(a, format($q$select public.send_gymbro_request(%L)$q$, b)), 'pending');
  perform pg_temp.assert_eq('relation from the sender',
    public.gymbro_relation(a, b), 'pending_sent');
  perform pg_temp.assert_eq('relation from the receiver',
    public.gymbro_relation(b, a), 'pending_received');
  perform pg_temp.expect_error(a, format($q$select public.send_gymbro_request(%L)$q$, b), 'request already sent');

  -- Only the receiver answers; before that, a is no gymbro of b.
  select id into v_request from public.friendships where requester_id = a and addressee_id = b;
  perform pg_temp.expect_error(a, format($q$select public.respond_to_friendship(%L, 'accepted')$q$, v_request),
    'not found or unavailable');
  perform pg_temp.expect_error(c, format($q$select public.respond_to_friendship(%L, 'accepted')$q$, v_request),
    'not found or unavailable');
  perform pg_temp.assert_eq('not gymbros yet', public.is_gymbro(a, b)::text, 'false');
  perform pg_temp.assert_eq('a profile for gymbros stays hidden from a stranger',
    pg_temp.scalar_as(c, format($q$select count(*) from public.custom_users where id = %L$q$, b)), '0');

  -- Strangers can't see the request, and nobody writes the table directly.
  perform pg_temp.assert_eq('c sees no friendships',
    pg_temp.scalar_as(c, $q$select count(*) from public.friendships$q$), '0');
  perform pg_temp.expect_error(c,
    format($q$insert into public.friendships (requester_id, addressee_id, status) values (%L, %L, 'accepted')$q$, c, a),
    'row-level security|permission denied');

  -- b accepts: they are gymbros both ways, and b's profile opens up to a.
  perform pg_temp.scalar_as(b, format($q$select (public.respond_to_friendship(%L, 'accepted')).status$q$, v_request));
  perform pg_temp.assert_eq('now gymbros', public.is_gymbro(a, b)::text, 'true');
  perform pg_temp.assert_eq('a lists b',
    pg_temp.scalar_as(a, $q$select count(*) from public.get_gymbros()$q$), '1');
  perform pg_temp.assert_eq('b lists a',
    pg_temp.scalar_as(b, $q$select count(*) from public.get_gymbros()$q$), '1');
  perform pg_temp.assert_eq('a sees the profile of b',
    pg_temp.scalar_as(a, format($q$select count(*) from public.custom_users where id = %L$q$, b)), '1');
  perform pg_temp.expect_error(a, format($q$select public.send_gymbro_request(%L)$q$, b), 'already gymbros');

  -- Removing a gymbro ends it for both.
  perform pg_temp.scalar_as(a, format($q$select public.remove_gymbro(%L)$q$, b));
  perform pg_temp.assert_eq('no longer gymbros', public.is_gymbro(a, b)::text, 'false');

  -- A rejection can not be pushed through by the one who asked...
  perform pg_temp.scalar_as(a, format($q$select public.send_gymbro_request(%L)$q$, d));
  select id into v_request from public.friendships where requester_id = a and addressee_id = d;
  perform pg_temp.scalar_as(d, format($q$select (public.respond_to_friendship(%L, 'rejected')).status$q$, v_request));
  perform pg_temp.expect_error(a, format($q$select public.send_gymbro_request(%L)$q$, d), 'user unavailable');
  -- ...but the one who rejected can change their mind.
  perform pg_temp.assert_eq('the rejecter can ask instead',
    pg_temp.scalar_as(d, format($q$select public.send_gymbro_request(%L)$q$, a)), 'pending');

  raise exception 'ROLLBACK_TEST: gymbros ok';
end $$;
