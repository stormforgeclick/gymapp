-- Undoes 20261031010000_move_helpers_to_private and
-- 20261031020000_drop_duplicate_routine_row_policies.
--
-- This is NOT a migration and must stay out of supabase/migrations/. Run it by
-- hand (psql, or the SQL editor) only if those two migrations have to be
-- reverted on a database that already has them. It is safe to run once.

-- 1. The helpers go back to `public`.
alter function private.can_view_profile(uuid, uuid) set schema public;
alter function private.can_view_routine(uuid, uuid) set schema public;
alter function private.can_view_split(uuid, uuid) set schema public;
alter function private.has_active_trainer_relationship(uuid, uuid) set schema public;
alter function private.is_admin(uuid) set schema public;
alter function private.is_gymbro(uuid, uuid) set schema public;
alter function private.is_trainer(uuid) set schema public;
alter function private.owns_routine(uuid, uuid) set schema public;
alter function private.owns_split(uuid, uuid) set schema public;
alter function private.owns_workout(uuid, uuid) set schema public;

-- 2. Function bodies call them by their old name again.
do $$
declare
  v_pattern constant text :=
    'private\.(can_view_profile|can_view_routine|can_view_split|has_active_trainer_relationship|is_admin|is_gymbro|is_trainer|owns_routine|owns_split|owns_workout)\(';
  v_function oid;
begin
  for v_function in
    select p.oid
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prokind = 'f'
       and p.prosrc ~ v_pattern
  loop
    execute regexp_replace(pg_get_functiondef(v_function), v_pattern, 'public.\1(', 'g');
  end loop;
end $$;

drop schema private;

-- 3. The eight older owner policies, as they were in production.
CREATE POLICY "routine_exercises_delete_own" ON "public"."routine_exercises" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."routines" "r"
     JOIN "public"."splits" "s" ON (("s"."id" = "r"."split_id")))
  WHERE (("r"."id" = "routine_exercises"."routine_id") AND ("s"."user_id" = "auth"."uid"())))));

CREATE POLICY "routine_exercises_insert_own" ON "public"."routine_exercises" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."routines" "r"
     JOIN "public"."splits" "s" ON (("s"."id" = "r"."split_id")))
  WHERE (("r"."id" = "routine_exercises"."routine_id") AND ("s"."user_id" = "auth"."uid"())))));

CREATE POLICY "routine_exercises_select_own" ON "public"."routine_exercises" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."routines" "r"
     JOIN "public"."splits" "s" ON (("s"."id" = "r"."split_id")))
  WHERE (("r"."id" = "routine_exercises"."routine_id") AND ("s"."user_id" = "auth"."uid"())))));

CREATE POLICY "routine_exercises_update_own" ON "public"."routine_exercises" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."routines" "r"
     JOIN "public"."splits" "s" ON (("s"."id" = "r"."split_id")))
  WHERE (("r"."id" = "routine_exercises"."routine_id") AND ("s"."user_id" = "auth"."uid"())))));

CREATE POLICY "routine_exercise_sets_delete_own" ON "public"."routine_exercise_sets" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (("public"."routine_exercises" "re"
     JOIN "public"."routines" "r" ON (("r"."id" = "re"."routine_id")))
     JOIN "public"."splits" "s" ON (("s"."id" = "r"."split_id")))
  WHERE (("re"."id" = "routine_exercise_sets"."routine_exercise_id") AND ("s"."user_id" = "auth"."uid"())))));

CREATE POLICY "routine_exercise_sets_insert_own" ON "public"."routine_exercise_sets" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."routine_exercises" "re"
     JOIN "public"."routines" "r" ON (("r"."id" = "re"."routine_id")))
     JOIN "public"."splits" "s" ON (("s"."id" = "r"."split_id")))
  WHERE (("re"."id" = "routine_exercise_sets"."routine_exercise_id") AND ("s"."user_id" = "auth"."uid"())))));

CREATE POLICY "routine_exercise_sets_select_own" ON "public"."routine_exercise_sets" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."routine_exercises" "re"
     JOIN "public"."routines" "r" ON (("r"."id" = "re"."routine_id")))
     JOIN "public"."splits" "s" ON (("s"."id" = "r"."split_id")))
  WHERE (("re"."id" = "routine_exercise_sets"."routine_exercise_id") AND ("s"."user_id" = "auth"."uid"())))));

CREATE POLICY "routine_exercise_sets_update_own" ON "public"."routine_exercise_sets" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (("public"."routine_exercises" "re"
     JOIN "public"."routines" "r" ON (("r"."id" = "re"."routine_id")))
     JOIN "public"."splits" "s" ON (("s"."id" = "r"."split_id")))
  WHERE (("re"."id" = "routine_exercise_sets"."routine_exercise_id") AND ("s"."user_id" = "auth"."uid"())))));
