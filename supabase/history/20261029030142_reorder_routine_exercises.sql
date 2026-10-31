-- (routine_id, position) is UNIQUE and not deferrable, so the positions are parked
-- out of the way before the final ones are assigned.
CREATE OR REPLACE FUNCTION public.reorder_routine_exercises(p_routine_id uuid, p_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_count int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  perform 1
    from public.routines r
    join public.splits s on s.id = r.split_id
   where r.id = p_routine_id and s.user_id = auth.uid() and r.archived_at is null
   for update of r;
  if not found then raise exception 'routine not found or not owned'; end if;

  select count(*) into v_count
    from public.routine_exercises where routine_id = p_routine_id;

  if coalesce(array_length(p_ids, 1), 0) <> v_count
     or (select count(distinct i) from unnest(p_ids) as i) <> v_count
     or exists (
       select 1 from unnest(p_ids) as i
        where not exists (
          select 1 from public.routine_exercises re
           where re.id = i and re.routine_id = p_routine_id
        )
     ) then
    raise exception 'ids must be exactly the exercises of the routine';
  end if;

  update public.routine_exercises
     set position = position + 1000000
   where routine_id = p_routine_id;

  update public.routine_exercises re
     set position = o.n
    from unnest(p_ids) with ordinality as o(id, n)
   where re.id = o.id;
end;
$function$;

revoke all on function public.reorder_routine_exercises(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_routine_exercises(uuid, uuid[]) to authenticated;
;
