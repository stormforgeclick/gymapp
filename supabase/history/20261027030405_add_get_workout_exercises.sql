create or replace function public.get_workout_exercises(
  p_workout_id uuid,
  p_language text default 'es'
)
returns table(
  id uuid,
  gymbro_exercise_id uuid,
  "position" integer,
  name text,
  image text,
  muscle_group text,
  equipment text,
  sets jsonb
)
language sql
stable
set search_path to 'public'
as $function$
  select
    we.id, we.gymbro_exercise_id, we.position,
    case when p_language = 'es' then coalesce(en.name_es, en.name_en) else en.name_en end as name,
    ge.image,
    case when p_language = 'es' then coalesce(mg.name_es, mg.name_en) else mg.name_en end as muscle_group,
    case when p_language = 'es' then coalesce(eq.name_es, eq.name_en) else eq.name_en end as equipment,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'position', s.position,
        'weight', s.weight,
        'reps', s.reps,
        'completed', s.completed,
        'target_min_reps', rs.min_reps,
        'target_max_reps', rs.max_reps
      ) order by s.position)
      from public.workout_sets s
      left join public.routine_exercise_sets rs
        on rs.routine_exercise_id = we.routine_exercise_id
       and rs.position = s.position
      where s.workout_exercise_id = we.id
    ), '[]'::jsonb) as sets
  from public.workout_exercises we
  join public.workouts w on w.id = we.workout_id
  join public.gymbro_exercises ge on ge.id = we.gymbro_exercise_id
  join public.exercise_names en on en.id = ge.exercise_name_id
  left join public.muscle_groups mg on mg.id = ge.muscle_group_id
  left join public.equipment eq on eq.id = ge.equipment_id
  where we.workout_id = p_workout_id and w.user_id = auth.uid()
  order by we.position asc;
$function$;;
