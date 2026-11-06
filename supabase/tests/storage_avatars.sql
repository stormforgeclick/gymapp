-- Profile pictures live in the avatars bucket, one file per person at
-- <user id>/avatar (see avatarPath in src/hooks/api/profile/queries.ts). The
-- bucket is public, so anyone can read a picture from its URL; what the policies
-- guard is who can write, replace or delete one: only its owner, only in their
-- own folder. Needs _helpers.sql.
do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  v_bucket text;
begin
  perform pg_temp.make_user(a);
  perform pg_temp.make_user(b);

  -- The buckets the app uses exist with the same settings as in production.
  -- The size limit and the allowed types are enforced by the Storage API; here
  -- we only check that they are configured.
  select format('%s|%s|%s', public::text, file_size_limit, array_to_string(allowed_mime_types, ','))
    into v_bucket from storage.buckets where id = 'avatars';
  perform pg_temp.assert_eq('avatars bucket', v_bucket, 'true|5242880|image/jpeg,image/png,image/webp');

  select format('%s|%s|%s', public::text, coalesce(file_size_limit::text, 'none'), coalesce(array_to_string(allowed_mime_types, ','), 'any'))
    into v_bucket from storage.buckets where id = 'exercise-images';
  perform pg_temp.assert_eq('exercise-images bucket', v_bucket, 'true|none|any');

  select format('%s|%s|%s', public::text, coalesce(file_size_limit::text, 'none'), coalesce(array_to_string(allowed_mime_types, ','), 'any'))
    into v_bucket from storage.buckets where id = 'exercise-gifs';
  perform pg_temp.assert_eq('exercise-gifs bucket', v_bucket, 'true|none|any');

  -- Everyone puts a picture in their own folder.
  perform pg_temp.assert_eq('a uploads to their folder',
    pg_temp.scalar_as(a, format($q$with i as (insert into storage.objects (bucket_id, name)
      values ('avatars', %L) returning 1) select count(*) from i$q$, a || '/avatar')), '1');

  -- ...and not in somebody else's, nor in the catalog buckets, nor signed out.
  perform pg_temp.expect_error(a,
    format($q$insert into storage.objects (bucket_id, name) values ('avatars', %L)$q$, b || '/avatar'),
    'row-level security');
  perform pg_temp.expect_error(a,
    format($q$insert into storage.objects (bucket_id, name) values ('exercise-images', %L)$q$, a || '/avatar'),
    'row-level security');
  perform pg_temp.expect_error(null,
    format($q$insert into storage.objects (bucket_id, name) values ('avatars', %L)$q$, a || '/other'),
    'row-level security');

  -- b has a picture too (put there as the owner of the database, past RLS).
  insert into storage.objects (bucket_id, name) values ('avatars', b || '/avatar');

  -- Each one sees, replaces and deletes only their own.
  perform pg_temp.assert_eq('a sees their picture',
    pg_temp.scalar_as(a, format($q$select count(*) from storage.objects where bucket_id = 'avatars' and name = %L$q$, a || '/avatar')), '1');
  perform pg_temp.assert_eq('a sees b''s picture',
    pg_temp.scalar_as(a, format($q$select count(*) from storage.objects where bucket_id = 'avatars' and name = %L$q$, b || '/avatar')), '0');

  perform pg_temp.assert_eq('a replaces their picture',
    pg_temp.scalar_as(a, format($q$with u as (update storage.objects set metadata = '{"v":2}'::jsonb
      where bucket_id = 'avatars' and name = %L returning 1) select count(*) from u$q$, a || '/avatar')), '1');
  perform pg_temp.assert_eq('a replaces b''s picture',
    pg_temp.scalar_as(a, format($q$with u as (update storage.objects set metadata = '{"v":2}'::jsonb
      where bucket_id = 'avatars' and name = %L returning 1) select count(*) from u$q$, b || '/avatar')), '0');
  -- A picture can't be handed over to someone else by renaming it either.
  perform pg_temp.expect_error(a,
    format($q$update storage.objects set name = %L where bucket_id = 'avatars' and name = %L$q$, b || '/avatar', a || '/avatar'),
    'row-level security');

  -- Storage refuses direct deletes unless the API says it allows them; the policy
  -- still decides which rows, so allow them for this transaction to check it.
  perform set_config('storage.allow_delete_query', 'true', true);
  perform pg_temp.assert_eq('a deletes b''s picture',
    pg_temp.scalar_as(a, format($q$with d as (delete from storage.objects
      where bucket_id = 'avatars' and name = %L returning 1) select count(*) from d$q$, b || '/avatar')), '0');
  perform pg_temp.assert_eq('a deletes their picture',
    pg_temp.scalar_as(a, format($q$with d as (delete from storage.objects
      where bucket_id = 'avatars' and name = %L returning 1) select count(*) from d$q$, a || '/avatar')), '1');
  perform pg_temp.assert_eq('b still has their picture',
    (select count(*)::text from storage.objects where bucket_id = 'avatars' and name = b || '/avatar'), '1');

  raise exception 'ROLLBACK_TEST: storage_avatars ok';
end $$;
