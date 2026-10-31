revoke execute on function public.clone_split_for_user(uuid, uuid, text) from public, anon, authenticated;

revoke execute on function
  public.accept_trainer_assignment(uuid),
  public.apply_for_trainer(text),
  public.can_view_profile(uuid, uuid),
  public.can_view_split(uuid, uuid),
  public.decline_trainer_assignment(uuid),
  public.finish_workout(uuid),
  public.has_active_trainer_relationship(uuid, uuid),
  public.import_routine(uuid, uuid, text),
  public.import_split(uuid, text),
  public.is_admin(uuid),
  public.is_gymbro(uuid, uuid),
  public.is_trainer(uuid),
  public.owns_routine(uuid, uuid),
  public.owns_split(uuid, uuid),
  public.owns_workout(uuid, uuid),
  public.respond_to_friendship(uuid, public.friendship_status),
  public.respond_to_trainer_request(uuid, public.trainer_gymbro_status),
  public.review_trainer_application(uuid, boolean, text),
  public.revoke_trainer_assignment(uuid),
  public.start_workout(uuid),
  public.withdraw_trainer_application(uuid)
from public, anon;

grant execute on function
  public.accept_trainer_assignment(uuid),
  public.apply_for_trainer(text),
  public.can_view_profile(uuid, uuid),
  public.can_view_split(uuid, uuid),
  public.decline_trainer_assignment(uuid),
  public.finish_workout(uuid),
  public.has_active_trainer_relationship(uuid, uuid),
  public.import_routine(uuid, uuid, text),
  public.import_split(uuid, text),
  public.is_admin(uuid),
  public.is_gymbro(uuid, uuid),
  public.is_trainer(uuid),
  public.owns_routine(uuid, uuid),
  public.owns_split(uuid, uuid),
  public.owns_workout(uuid, uuid),
  public.respond_to_friendship(uuid, public.friendship_status),
  public.respond_to_trainer_request(uuid, public.trainer_gymbro_status),
  public.review_trainer_application(uuid, boolean, text),
  public.revoke_trainer_assignment(uuid),
  public.start_workout(uuid),
  public.withdraw_trainer_application(uuid)
to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

create or replace function public.review_trainer_application(
  p_application_id uuid,
  p_approve boolean,
  p_response_message text default null
)
returns public.trainer_applications
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_application public.trainer_applications;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can review trainer applications';
  end if;

  update public.trainer_applications
  set
    status = (case when p_approve then 'approved' else 'rejected' end)::public.trainer_application_status,
    response_message = nullif(trim(p_response_message), ''),
    reviewed_by = auth.uid(),
    reviewed_at = now()
  where id = p_application_id
    and status = 'pending'
  returning * into v_application;

  if not found then
    raise exception 'Pending trainer application not found';
  end if;

  if p_approve then
    insert into public.user_roles (user_id, role)
    values (v_application.applicant_id, 'trainer')
    on conflict (user_id, role) do nothing;
  end if;

  return v_application;
end;
$function$;

alter function public.get_exercises(text, uuid, uuid, uuid, uuid, integer, integer, text) set search_path = public;
alter function public.get_exercise(uuid, text) set search_path = public;
alter function public.get_exercise_filters(text) security invoker;;
