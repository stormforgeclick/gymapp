-- Postgres doesn't index the referencing side of a foreign key. Without an index,
-- deleting or changing a row of the referenced table scans the whole referencing
-- table, and so does a join through that column. These eleven were the ones the
-- Supabase advisor (unindexed_foreign_keys) reported. The tables are small today,
-- so this costs next to nothing to build and keeps those operations cheap as they
-- grow. supabase/tests/foreign_keys_indexed.sql makes sure a new one isn't missed.

create index if not exists custom_users_active_split_id_idx
  on public.custom_users (active_split_id);

create index if not exists exercise_secondary_muscles_muscle_group_id_idx
  on public.exercise_secondary_muscles (muscle_group_id);

create index if not exists gymbro_exercises_category_id_idx
  on public.gymbro_exercises (category_id);

create index if not exists gymbro_exercises_equipment_id_idx
  on public.gymbro_exercises (equipment_id);

create index if not exists gymbro_exercises_exercise_name_id_idx
  on public.gymbro_exercises (exercise_name_id);

create index if not exists gymbro_exercises_muscle_group_id_idx
  on public.gymbro_exercises (muscle_group_id);

create index if not exists gymbro_exercises_target_id_idx
  on public.gymbro_exercises (target_id);

create index if not exists routines_source_routine_id_idx
  on public.routines (source_routine_id);

create index if not exists trainer_applications_reviewed_by_idx
  on public.trainer_applications (reviewed_by);

create index if not exists trainer_assignments_imported_split_id_idx
  on public.trainer_assignments (imported_split_id);

create index if not exists workout_exercises_routine_exercise_id_idx
  on public.workout_exercises (routine_exercise_id);
