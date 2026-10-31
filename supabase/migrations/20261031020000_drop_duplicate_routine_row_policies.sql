-- routine_exercises and routine_exercise_sets each had two sets of owner
-- policies: "Owners manage ..." (signed-in users, ownership checked once per
-- query) and four older <table>_<action>_own policies that say the same thing
-- by joining routines and splits and calling auth.uid() for every row. Every
-- query had to run both, and the old ones also applied to anonymous callers
-- (who never match). The first set already covers everything, so the older
-- one goes.

drop policy "routine_exercises_select_own" on public.routine_exercises;
drop policy "routine_exercises_insert_own" on public.routine_exercises;
drop policy "routine_exercises_update_own" on public.routine_exercises;
drop policy "routine_exercises_delete_own" on public.routine_exercises;

drop policy "routine_exercise_sets_select_own" on public.routine_exercise_sets;
drop policy "routine_exercise_sets_insert_own" on public.routine_exercise_sets;
drop policy "routine_exercise_sets_update_own" on public.routine_exercise_sets;
drop policy "routine_exercise_sets_delete_own" on public.routine_exercise_sets;
