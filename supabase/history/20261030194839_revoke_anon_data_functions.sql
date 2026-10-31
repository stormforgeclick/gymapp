-- These run with the caller's rights and are only used behind the login, so a
-- signed-out caller has no reason to reach them. authenticated and service_role
-- keep the execute permission they already have. The exercise catalog functions
-- (get_exercise, get_exercise_filters, get_exercises) stay public on purpose.
revoke execute on function public.add_routine_exercises(uuid, uuid[]) from public, anon;
revoke execute on function public.delete_routine(uuid) from public, anon;
revoke execute on function public.delete_routine_exercise(uuid) from public, anon;
revoke execute on function public.replace_routine_exercise_sets(uuid, jsonb) from public, anon;
revoke execute on function public.get_routine_exercises(uuid, text) from public, anon;
revoke execute on function public.get_workout_exercises(uuid, text) from public, anon;;
