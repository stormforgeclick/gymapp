-- The storage buckets and the rules on the profile pictures only existed in
-- production: the baseline is a dump of the public schema and leaves storage out,
-- so a local database had no avatars bucket, nothing tested who may write to it,
-- and a project rebuilt from the repository would have lost the rules.
--
-- This declares what production already has, with the same values, so applying it
-- there changes nothing (the policies are dropped and created again in the same
-- transaction with the same text).
--
-- All three buckets are public: a picture or a catalog image is read from its URL
-- without any policy. The catalog buckets get no policy for writing, so only the
-- service role can put files in them. A picture goes in <user id>/avatar and only
-- its owner can add, replace or delete it. The size limit and the image types
-- are enforced by the Storage API.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('exercise-gifs', 'exercise-gifs', true, null, null),
  ('exercise-images', 'exercise-images', true, null, null)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users read own avatar files" on storage.objects;
create policy "Users read own avatar files" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
