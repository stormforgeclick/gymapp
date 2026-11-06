-- Undoes 20261106020000_index_foreign_keys.sql: drops the eleven indexes it
-- creates. Nothing depends on them, so dropping them only makes deletes and
-- joins through those foreign keys slower again.
--
-- 20261106010000_storage_buckets_and_avatar_policies.sql has no rollback on
-- purpose: it declares what production already had, with the same values, so
-- applying it changes nothing and there is nothing to go back to. Dropping those
-- policies would remove the rules that protect the profile pictures.
--
-- Run it like the migration (supabase db push does not run files from this
-- folder): psql against the database, as the owner. Tested on the local database.

drop index if exists public.custom_users_active_split_id_idx;
drop index if exists public.exercise_secondary_muscles_muscle_group_id_idx;
drop index if exists public.gymbro_exercises_category_id_idx;
drop index if exists public.gymbro_exercises_equipment_id_idx;
drop index if exists public.gymbro_exercises_exercise_name_id_idx;
drop index if exists public.gymbro_exercises_muscle_group_id_idx;
drop index if exists public.gymbro_exercises_target_id_idx;
drop index if exists public.routines_source_routine_id_idx;
drop index if exists public.trainer_applications_reviewed_by_idx;
drop index if exists public.trainer_assignments_imported_split_id_idx;
drop index if exists public.workout_exercises_routine_exercise_id_idx;
