-- Relation between two users as seen by the first. Internal: clients cannot call it.
create or replace function public.gymbro_relation(p_viewer uuid, p_other uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce((
    select case
      when f.status = 'accepted' then 'accepted'
      when f.status = 'blocked' then 'blocked'
      when f.status = 'pending' and f.requester_id = p_viewer then 'pending_sent'
      when f.status = 'pending' then 'pending_received'
      when f.status = 'rejected' and f.requester_id = p_viewer then 'unavailable'
      else 'none'
    end
    from public.friendships f
    where least(f.requester_id, f.addressee_id) = least(p_viewer, p_other)
      and greatest(f.requester_id, f.addressee_id) = greatest(p_viewer, p_other)
  ), 'none');
$function$;

revoke all on function public.gymbro_relation(uuid, uuid) from public, anon, authenticated;

-- Public profiles are found by name or @username prefix; "gymbros" profiles only by exact @username.
create or replace function public.search_profiles(p_query text, p_limit int default 20, p_offset int default 0)
returns table (id uuid, user_name text, first_name text, last_name text, avatar_url text, relation text)
language sql
stable
security definer
set search_path = ''
as $function$
  with q as (
    select lower(btrim(regexp_replace(coalesce(p_query, ''), '^@', ''))) as term
  )
  select u.id, u.user_name, u.first_name, u.last_name, u.avatar_url,
         public.gymbro_relation(auth.uid(), u.id) as relation
  from public.custom_users u, q
  where auth.uid() is not null
    and length(q.term) >= 2
    and u.id <> auth.uid()
    and u.user_name is not null
    and public.gymbro_relation(auth.uid(), u.id) <> 'blocked'
    and (
      (u.profile_privacy = 'public' and (
        starts_with(u.user_name, q.term)
        or starts_with(lower(coalesce(u.first_name, '')), q.term)
        or starts_with(lower(coalesce(u.last_name, '')), q.term)
      ))
      or (u.profile_privacy = 'gymbros' and u.user_name = q.term)
    )
  order by (u.user_name = q.term) desc, u.user_name
  limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$function$;

create or replace function public.get_profile(p_user_id uuid)
returns table (
  id uuid, user_name text, first_name text, last_name text, bio text, avatar_url text,
  relation text, friendship_id uuid, is_self boolean, can_view_full boolean
)
language sql
stable
security definer
set search_path = ''
as $function$
  select u.id, u.user_name, u.first_name, u.last_name,
         case when x.can_view then u.bio end,
         u.avatar_url, x.relation, f.id, u.id = auth.uid(), x.can_view
  from public.custom_users u
  cross join lateral (
    select public.can_view_profile(u.id, auth.uid()) as can_view,
           public.gymbro_relation(auth.uid(), u.id) as relation
  ) x
  left join public.friendships f
    on least(f.requester_id, f.addressee_id) = least(auth.uid(), u.id)
   and greatest(f.requester_id, f.addressee_id) = greatest(auth.uid(), u.id)
  where u.id = p_user_id
    and auth.uid() is not null
    and x.relation <> 'blocked'
    and (x.can_view or u.profile_privacy = 'gymbros' or x.relation <> 'none');
$function$;

create or replace function public.get_gymbros()
returns table (id uuid, user_name text, first_name text, last_name text, avatar_url text)
language sql
stable
security definer
set search_path = ''
as $function$
  select u.id, u.user_name, u.first_name, u.last_name, u.avatar_url
  from public.friendships f
  join public.custom_users u
    on u.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  where f.status = 'accepted'
    and auth.uid() in (f.requester_id, f.addressee_id)
  order by lower(coalesce(nullif(btrim(concat_ws(' ', u.first_name, u.last_name)), ''), u.user_name, ''));
$function$;

create or replace function public.get_gymbro_requests()
returns table (
  friendship_id uuid, direction text, id uuid, user_name text, first_name text,
  last_name text, avatar_url text, created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $function$
  select f.id,
         case when f.addressee_id = auth.uid() then 'incoming' else 'outgoing' end,
         u.id, u.user_name, u.first_name, u.last_name, u.avatar_url, f.created_at
  from public.friendships f
  join public.custom_users u
    on u.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  where f.status = 'pending'
    and auth.uid() in (f.requester_id, f.addressee_id)
  order by f.created_at desc;
$function$;

-- Returns 'pending', or 'accepted' when the other person had already asked.
create or replace function public.send_gymbro_request(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_me uuid := auth.uid();
  v_target public.custom_users;
  v_f public.friendships;
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  if p_user_id = v_me then raise exception 'cannot add yourself'; end if;

  select * into v_target from public.custom_users where id = p_user_id;
  if not found then raise exception 'user unavailable'; end if;

  select * into v_f from public.friendships f
   where least(f.requester_id, f.addressee_id) = least(v_me, p_user_id)
     and greatest(f.requester_id, f.addressee_id) = greatest(v_me, p_user_id)
   for update;

  if found then
    if v_f.status = 'accepted' then
      raise exception 'already gymbros';
    elsif v_f.status = 'blocked' then
      raise exception 'user unavailable';
    elsif v_f.status = 'pending' then
      if v_f.requester_id = v_me then raise exception 'request already sent'; end if;
      update public.friendships set status = 'accepted' where id = v_f.id;
      return 'accepted';
    else
      -- Rejected: only the person who rejected may change their mind.
      if v_f.requester_id = v_me then raise exception 'user unavailable'; end if;
      update public.friendships
         set requester_id = v_me, addressee_id = p_user_id, status = 'pending'
       where id = v_f.id;
      return 'pending';
    end if;
  end if;

  if v_target.profile_privacy = 'private' then raise exception 'user unavailable'; end if;

  insert into public.friendships (requester_id, addressee_id, status)
  values (v_me, p_user_id, 'pending');
  return 'pending';
end;
$function$;

create or replace function public.remove_gymbro(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  delete from public.friendships f
   where f.status = 'accepted'
     and least(f.requester_id, f.addressee_id) = least(auth.uid(), p_user_id)
     and greatest(f.requester_id, f.addressee_id) = greatest(auth.uid(), p_user_id);

  if not found then raise exception 'gymbro not found'; end if;
end;
$function$;

revoke all on function public.search_profiles(text, int, int) from public, anon;
revoke all on function public.get_profile(uuid) from public, anon;
revoke all on function public.get_gymbros() from public, anon;
revoke all on function public.get_gymbro_requests() from public, anon;
revoke all on function public.send_gymbro_request(uuid) from public, anon;
revoke all on function public.remove_gymbro(uuid) from public, anon;
grant execute on function public.search_profiles(text, int, int) to authenticated;
grant execute on function public.get_profile(uuid) to authenticated;
grant execute on function public.get_gymbros() to authenticated;
grant execute on function public.get_gymbro_requests() to authenticated;
grant execute on function public.send_gymbro_request(uuid) to authenticated;
grant execute on function public.remove_gymbro(uuid) to authenticated;

-- Requests now go through send_gymbro_request, which enforces who can be reached.
drop policy "Users send friendship requests" on public.friendships;
;
