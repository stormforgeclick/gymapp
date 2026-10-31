


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Not part of the dump. A fresh Supabase database gives the API roles EXECUTE on
-- every new function in `public`; production doesn't have that on most of them
-- (they were revoked), and the dump only states what each function grants. Start
-- from nothing so the explicit GRANTs below are the whole story. The default
-- privileges are set again at the end of this file.
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon", "authenticated", "service_role";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'trainer',
    'admin'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."assignment_status" AS ENUM (
    'pending',
    'accepted',
    'declined',
    'revoked'
);


ALTER TYPE "public"."assignment_status" OWNER TO "postgres";


CREATE TYPE "public"."friendship_status" AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'blocked'
);


ALTER TYPE "public"."friendship_status" OWNER TO "postgres";


CREATE TYPE "public"."profile_privacy" AS ENUM (
    'public',
    'gymbros',
    'private'
);


ALTER TYPE "public"."profile_privacy" OWNER TO "postgres";


CREATE TYPE "public"."trainer_application_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'withdrawn'
);


ALTER TYPE "public"."trainer_application_status" OWNER TO "postgres";


CREATE TYPE "public"."trainer_gymbro_status" AS ENUM (
    'pending',
    'active',
    'declined',
    'ended'
);


ALTER TYPE "public"."trainer_gymbro_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_trainer_assignment"("p_assignment_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_assignment public.trainer_assignments%rowtype;
  v_new_split_id uuid;
begin
  select *
  into v_assignment
  from public.trainer_assignments
  where id = p_assignment_id
    and gymbro_id = auth.uid()
    and status = 'pending'
  for update;

  if not found then
    raise exception 'Pending assignment not found';
  end if;

  if not public.has_active_trainer_relationship(
    v_assignment.trainer_id,
    v_assignment.gymbro_id
  ) then
    raise exception 'Trainer relationship is no longer active';
  end if;

  if not public.owns_split(
    v_assignment.split_id,
    v_assignment.trainer_id
  ) then
    raise exception 'Trainer no longer owns this split';
  end if;

  v_new_split_id := public.clone_split_for_user(
    v_assignment.split_id,
    v_assignment.gymbro_id,
    null
  );

  update public.trainer_assignments
  set
    status = 'accepted',
    imported_split_id = v_new_split_id,
    responded_at = now()
  where id = v_assignment.id;

  return v_new_split_id;
end;
$$;


ALTER FUNCTION "public"."accept_trainer_assignment"("p_assignment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_routine_exercises"("p_routine_id" "uuid", "p_gymbro_exercise_ids" "uuid"[]) RETURNS SETOF "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_owned boolean;
  v_pos int;
  v_id uuid;
  v_ex uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select exists (
    select 1 from public.routines r join public.splits s on s.id = r.split_id
    where r.id = p_routine_id and s.user_id = auth.uid() and r.archived_at is null
  ) into v_owned;
  if not v_owned then raise exception 'routine not found or not owned'; end if;

  perform 1 from public.routines where id = p_routine_id for update;

  select coalesce(max(re.position), 0) into v_pos
    from public.routine_exercises re where re.routine_id = p_routine_id;

  foreach v_ex in array coalesce(p_gymbro_exercise_ids, array[]::uuid[]) loop
    v_pos := v_pos + 1;
    insert into public.routine_exercises (routine_id, gymbro_exercise_id, position)
    values (p_routine_id, v_ex, v_pos)
    returning routine_exercises.id into v_id;

    insert into public.routine_exercise_sets (routine_exercise_id, position, min_reps, max_reps, weight)
    values (v_id, 1, 8, 12, null);

    return next v_id;
  end loop;
end;
$$;


ALTER FUNCTION "public"."add_routine_exercises"("p_routine_id" "uuid", "p_gymbro_exercise_ids" "uuid"[]) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."trainer_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "applicant_id" "uuid" NOT NULL,
    "message" "text",
    "status" "public"."trainer_application_status" DEFAULT 'pending'::"public"."trainer_application_status" NOT NULL,
    "response_message" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "trainer_applications_check" CHECK (((("status" = ANY (ARRAY['pending'::"public"."trainer_application_status", 'withdrawn'::"public"."trainer_application_status"])) AND ("reviewed_at" IS NULL)) OR (("status" = ANY (ARRAY['approved'::"public"."trainer_application_status", 'rejected'::"public"."trainer_application_status"])) AND ("reviewed_at" IS NOT NULL))))
);


ALTER TABLE "public"."trainer_applications" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_for_trainer"("p_message" "text" DEFAULT NULL::"text") RETURNS "public"."trainer_applications"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_application public.trainer_applications;
begin
  if public.is_trainer(auth.uid()) then
    raise exception 'User is already a trainer';
  end if;

  insert into public.trainer_applications (
    applicant_id,
    message,
    status
  )
  values (
    auth.uid(),
    nullif(trim(p_message), ''),
    'pending'
  )
  returning * into v_application;

  return v_application;
end;
$$;


ALTER FUNCTION "public"."apply_for_trainer"("p_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_split"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare v_next uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  perform 1 from public.splits
   where id = p_id and user_id = auth.uid() and archived_at is null
   for update;
  if not found then raise exception 'split not found'; end if;

  if (select count(*) from public.splits
       where user_id = auth.uid() and archived_at is null) <= 1 then
    raise exception 'cannot archive the only split';
  end if;

  delete from public.workouts w
   using public.routines r
   where w.routine_id = r.id and r.split_id = p_id
     and w.finished_at is null and w.user_id = auth.uid();

  update public.routines set archived_at = now()
   where split_id = p_id and archived_at is null;
  update public.splits set archived_at = now() where id = p_id;

  if (select active_split_id from public.custom_users where id = auth.uid()) is not distinct from p_id then
    select id into v_next from public.splits
     where user_id = auth.uid() and archived_at is null
     order by created_at limit 1;
    update public.custom_users set active_split_id = v_next where id = auth.uid();
  end if;
end;
$$;


ALTER FUNCTION "public"."archive_split"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_profile"("p_profile_id" "uuid", "p_viewer_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.custom_users u
    where u.id = p_profile_id
      and (
        p_profile_id = p_viewer_id
        or u.profile_privacy = 'public'
        or (
          u.profile_privacy = 'gymbros'
          and public.is_gymbro(p_profile_id, p_viewer_id)
        )
      )
  );
$$;


ALTER FUNCTION "public"."can_view_profile"("p_profile_id" "uuid", "p_viewer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_routine"("p_routine_id" "uuid", "p_viewer_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.routines r
    join public.splits s on s.id = r.split_id
    where r.id = p_routine_id
      and r.archived_at is null
      and s.archived_at is null
      and (
        s.user_id = p_viewer_id
        or (
          public.can_view_profile(s.user_id, p_viewer_id)
          and (
            s.privacy = 'public'
            or (s.privacy = 'gymbros' and public.is_gymbro(s.user_id, p_viewer_id))
          )
        )
        or exists (
          select 1
          from public.trainer_assignments ta
          where ta.split_id = s.id
            and ta.gymbro_id = p_viewer_id
            and ta.status in ('pending', 'accepted')
        )
      )
  );
$$;


ALTER FUNCTION "public"."can_view_routine"("p_routine_id" "uuid", "p_viewer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_split"("p_split_id" "uuid", "p_viewer_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.splits s
    where s.id = p_split_id
      and (
        s.user_id = p_viewer_id
        or (
          s.archived_at is null
          and public.can_view_profile(s.user_id, p_viewer_id)
          and (
            s.privacy = 'public'
            or (s.privacy = 'gymbros' and public.is_gymbro(s.user_id, p_viewer_id))
          )
        )
        or exists (
          select 1
          from public.trainer_assignments ta
          where ta.split_id = s.id
            and ta.gymbro_id = p_viewer_id
            and ta.status in ('pending', 'accepted')
        )
      )
  );
$$;


ALTER FUNCTION "public"."can_view_split"("p_split_id" "uuid", "p_viewer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clone_split_for_user"("p_source_split_id" "uuid", "p_target_user_id" "uuid", "p_name" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_source_split public.splits%rowtype;
  v_source_routine public.routines%rowtype;
  v_source_exercise public.routine_exercises%rowtype;
  v_source_set public.routine_exercise_sets%rowtype;
  v_new_split_id uuid;
  v_new_routine_id uuid;
  v_new_exercise_id uuid;
begin
  select *
  into v_source_split
  from public.splits
  where id = p_source_split_id;

  if not found then
    raise exception 'Source split not found';
  end if;

  insert into public.splits (
    user_id,
    name,
    privacy,
    source_split_id
  )
  values (
    p_target_user_id,
    coalesce(nullif(trim(p_name), ''), v_source_split.name),
    'private',
    v_source_split.id
  )
  returning id into v_new_split_id;

  for v_source_routine in
    select *
    from public.routines
    where split_id = v_source_split.id
    order by position
  loop
    insert into public.routines (
      split_id,
      position,
      name,
      color,
      privacy,
      source_routine_id
    )
    values (
      v_new_split_id,
      v_source_routine.position,
      v_source_routine.name,
      v_source_routine.color,
      'private',
      v_source_routine.id
    )
    returning id into v_new_routine_id;

    for v_source_exercise in
      select *
      from public.routine_exercises
      where routine_id = v_source_routine.id
      order by position
    loop
      insert into public.routine_exercises (
        routine_id,
        gymbro_exercise_id,
        position,
        notes
      )
      values (
        v_new_routine_id,
        v_source_exercise.gymbro_exercise_id,
        v_source_exercise.position,
        v_source_exercise.notes
      )
      returning id into v_new_exercise_id;

      for v_source_set in
        select *
        from public.routine_exercise_sets
        where routine_exercise_id = v_source_exercise.id
        order by position
      loop
        insert into public.routine_exercise_sets (
          routine_exercise_id,
          position,
          min_reps,
          max_reps,
          rir,
          weight
        )
        values (
          v_new_exercise_id,
          v_source_set.position,
          v_source_set.min_reps,
          v_source_set.max_reps,
          v_source_set.rir,
          v_source_set.weight
        );
      end loop;
    end loop;
  end loop;

  return v_new_split_id;
end;
$$;


ALTER FUNCTION "public"."clone_split_for_user"("p_source_split_id" "uuid", "p_target_user_id" "uuid", "p_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_routine"("p_name" "text", "p_color" "text", "p_split_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "name" "text", "color" "text", "quantity" integer, "tags" "text"[], "split_id" "uuid")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_split uuid;
  v_pos int;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'name required'; end if;

  if p_split_id is null then
    v_split := public.ensure_default_split();
  else
    select s.id into v_split from public.splits s
     where s.id = p_split_id and s.user_id = auth.uid() and s.archived_at is null;
    if v_split is null then raise exception 'split not found'; end if;
  end if;

  select coalesce(max(position), 0) + 1 into v_pos from public.routines where routines.split_id = v_split;

  insert into public.routines (split_id, position, name, color, privacy)
  values (v_split, v_pos, btrim(p_name), p_color, 'private')
  returning routines.id into v_id;

  return query select v_id, btrim(p_name), p_color, 0::int, array[]::text[], v_split;
end;
$$;


ALTER FUNCTION "public"."create_routine"("p_name" "text", "p_color" "text", "p_split_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_split"("p_name" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare v_id uuid := gen_random_uuid();
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'name required'; end if;

  begin
    insert into public.splits (id, user_id, name, privacy)
    values (v_id, auth.uid(), btrim(p_name), 'private');
  exception when unique_violation then
    raise exception 'split name already exists';
  end;

  update public.custom_users set active_split_id = v_id where id = auth.uid();
  return v_id;
end;
$$;


ALTER FUNCTION "public"."create_split"("p_name" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trainer_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trainer_id" "uuid" NOT NULL,
    "gymbro_id" "uuid" NOT NULL,
    "split_id" "uuid" NOT NULL,
    "imported_split_id" "uuid",
    "status" "public"."assignment_status" DEFAULT 'pending'::"public"."assignment_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "responded_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "trainer_assignments_check" CHECK (("trainer_id" <> "gymbro_id"))
);


ALTER TABLE "public"."trainer_assignments" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decline_trainer_assignment"("p_assignment_id" "uuid") RETURNS "public"."trainer_assignments"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_assignment public.trainer_assignments;
begin
  update public.trainer_assignments
  set
    status = 'declined',
    responded_at = now()
  where id = p_assignment_id
    and gymbro_id = auth.uid()
    and status = 'pending'
  returning * into v_assignment;

  if not found then
    raise exception 'Pending assignment not found';
  end if;

  return v_assignment;
end;
$$;


ALTER FUNCTION "public"."decline_trainer_assignment"("p_assignment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_routine"("p_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare v_del uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  update public.routines r
     set archived_at = now()
   where r.id = p_id
     and r.archived_at is null
     and exists (select 1 from public.splits s where s.id = r.split_id and s.user_id = auth.uid())
  returning r.id into v_del;
  if v_del is null then raise exception 'routine not found or not owned'; end if;

  -- A workout in progress for this routine can't continue; discard it.
  delete from public.workouts w
   where w.routine_id = v_del
     and w.finished_at is null
     and w.user_id = auth.uid();

  return v_del;
end;
$$;


ALTER FUNCTION "public"."delete_routine"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_routine_exercise"("p_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare v_del uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from public.routine_exercises re
   where re.id = p_id and exists (
     select 1 from public.routines r join public.splits s on s.id = r.split_id
     where r.id = re.routine_id and s.user_id = auth.uid()
   )
  returning re.id into v_del;
  if v_del is null then raise exception 'routine exercise not found or not owned'; end if;
  return v_del;
end;
$$;


ALTER FUNCTION "public"."delete_routine_exercise"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."duplicate_split"("p_id" "uuid", "p_name" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_src public.splits;
  v_new uuid := gen_random_uuid();
  v_routine record;
  v_exercise record;
  v_new_routine uuid;
  v_new_exercise uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'name required'; end if;

  select * into v_src from public.splits
   where id = p_id and user_id = auth.uid() and archived_at is null;
  if not found then raise exception 'split not found'; end if;

  begin
    insert into public.splits (id, user_id, name, privacy, source_split_id)
    values (v_new, auth.uid(), btrim(p_name), 'private', v_src.id);
  exception when unique_violation then
    raise exception 'split name already exists';
  end;

  for v_routine in
    select * from public.routines
     where split_id = p_id and archived_at is null order by position
  loop
    insert into public.routines (split_id, position, name, color, privacy, source_routine_id)
    values (v_new, v_routine.position, v_routine.name, v_routine.color, 'private', v_routine.id)
    returning id into v_new_routine;

    for v_exercise in
      select * from public.routine_exercises
       where routine_id = v_routine.id order by position
    loop
      insert into public.routine_exercises (routine_id, gymbro_exercise_id, position, notes)
      values (v_new_routine, v_exercise.gymbro_exercise_id, v_exercise.position, v_exercise.notes)
      returning id into v_new_exercise;

      insert into public.routine_exercise_sets (routine_exercise_id, position, min_reps, max_reps, rir, weight)
      select v_new_exercise, position, min_reps, max_reps, rir, weight
        from public.routine_exercise_sets
       where routine_exercise_id = v_exercise.id;
    end loop;
  end loop;

  update public.custom_users set active_split_id = v_new where id = auth.uid();
  return v_new;
end;
$$;


ALTER FUNCTION "public"."duplicate_split"("p_id" "uuid", "p_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_default_split"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_uid uuid := auth.uid();
  v_split uuid;
  v_lang text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  insert into public.custom_users (id) values (v_uid) on conflict (id) do nothing;

  select s.id into v_split
    from public.custom_users cu
    join public.splits s on s.id = cu.active_split_id
   where cu.id = v_uid and s.user_id = v_uid and s.archived_at is null;
  if v_split is not null then return v_split; end if;

  select id into v_split from public.splits
   where user_id = v_uid and archived_at is null
   order by created_at limit 1;

  if v_split is null then
    select language into v_lang from public.custom_users where id = v_uid;
    insert into public.splits (user_id, name, privacy)
    values (v_uid, case when v_lang = 'es' then 'Principal' else 'Main' end, 'private')
    returning id into v_split;
  end if;

  update public.custom_users set active_split_id = v_split where id = v_uid;
  return v_split;
end;
$$;


ALTER FUNCTION "public"."ensure_default_split"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "routine_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finished_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workouts_check" CHECK ((("finished_at" IS NULL) OR ("finished_at" >= "started_at")))
);


ALTER TABLE "public"."workouts" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."finish_workout"("p_workout_id" "uuid") RETURNS "public"."workouts"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_workout public.workouts;
begin
  update public.workouts
  set finished_at = now()
  where id = p_workout_id
    and user_id = auth.uid()
    and finished_at is null
  returning * into v_workout;

  if not found then
    raise exception 'Active workout not found';
  end if;

  return v_workout;
end;
$$;


ALTER FUNCTION "public"."finish_workout"("p_workout_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_exercise"("p_id" "uuid", "p_language" "text" DEFAULT 'es'::"text") RETURNS TABLE("id" "uuid", "exercise_id" "text", "name" "text", "category" "text", "equipment" "text", "muscle_group" "text", "target" "text", "instructions" "text", "image" "text", "gif_url" "text")
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$
  SELECT
    ge.id,
    ge.exercise_id,

    CASE
      WHEN p_language = 'es'
        THEN COALESCE(en.name_es, en.name_en)
      ELSE en.name_en
    END AS name,

    CASE
      WHEN p_language = 'es'
        THEN COALESCE(c.name_es, c.name_en)
      ELSE c.name_en
    END AS category,

    CASE
      WHEN p_language = 'es'
        THEN COALESCE(eq.name_es, eq.name_en)
      ELSE eq.name_en
    END AS equipment,

    CASE
      WHEN p_language = 'es'
        THEN COALESCE(mg.name_es, mg.name_en)
      ELSE mg.name_en
    END AS muscle_group,

    CASE
      WHEN p_language = 'es'
        THEN COALESCE(t.name_es, t.name_en)
      ELSE t.name_en
    END AS target,

    CASE
      WHEN p_language = 'es'
        THEN COALESCE(ge.instructions_es, ge.instructions_en)
      ELSE ge.instructions_en
    END AS instructions,

    ge.image,
    ge.gif_url

  FROM gymbro_exercises ge

  JOIN exercise_names en
    ON en.id = ge.exercise_name_id

  LEFT JOIN categories c
    ON c.id = ge.category_id

  LEFT JOIN equipment eq
    ON eq.id = ge.equipment_id

  LEFT JOIN muscle_groups mg
    ON mg.id = ge.muscle_group_id

  LEFT JOIN targets t
    ON t.id = ge.target_id

  WHERE ge.id = p_id;
$$;


ALTER FUNCTION "public"."get_exercise"("p_id" "uuid", "p_language" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_exercise_filters"("p_language" "text" DEFAULT 'en'::"text") RETURNS json
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$
    SELECT json_build_object(
        'categories',
        COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'id', c.id,
                        'name',
                            CASE
                                WHEN p_language = 'es'
                                    THEN COALESCE(c.name_es, c.name_en)
                                ELSE c.name_en
                            END
                    )
                    ORDER BY c.name_en
                )
                FROM categories c
            ),
            '[]'::json
        ),

        'equipment',
        COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'id', e.id,
                        'name',
                            CASE
                                WHEN p_language = 'es'
                                    THEN COALESCE(e.name_es, e.name_en)
                                ELSE e.name_en
                            END
                    )
                    ORDER BY e.name_en
                )
                FROM equipment e
            ),
            '[]'::json
        ),

        'muscle_groups',
        COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'id', mg.id,
                        'name',
                            CASE
                                WHEN p_language = 'es'
                                    THEN COALESCE(mg.name_es, mg.name_en)
                                ELSE mg.name_en
                            END
                    )
                    ORDER BY mg.name_en
                )
                FROM muscle_groups mg
            ),
            '[]'::json
        ),

        'targets',
        COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'id', t.id,
                        'name',
                            CASE
                                WHEN p_language = 'es'
                                    THEN COALESCE(t.name_es, t.name_en)
                                ELSE t.name_en
                            END
                    )
                    ORDER BY t.name_en
                )
                FROM targets t
            ),
            '[]'::json
        )
    );
$$;


ALTER FUNCTION "public"."get_exercise_filters"("p_language" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_exercises"("p_language" "text", "p_category_id" "uuid" DEFAULT NULL::"uuid", "p_equipment_id" "uuid" DEFAULT NULL::"uuid", "p_muscle_group_id" "uuid" DEFAULT NULL::"uuid", "p_target_id" "uuid" DEFAULT NULL::"uuid", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0, "p_search" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "name" "text", "image" "text", "category" "text", "equipment" "text", "gif_url" "text", "target" "text")
    LANGUAGE "sql"
    SET "search_path" TO 'public'
    AS $$
  SELECT
    ge.id,
    CASE WHEN p_language = 'es' THEN COALESCE(en.name_es, en.name_en) ELSE en.name_en END AS name,
    ge.image,
    CASE WHEN p_language = 'es' THEN COALESCE(c.name_es, c.name_en) ELSE c.name_en END AS category,
    CASE WHEN p_language = 'es' THEN COALESCE(eq.name_es, eq.name_en) ELSE eq.name_en END AS equipment,
    ge.gif_url,
    CASE WHEN p_language = 'es' THEN COALESCE(tg.name_es, tg.name_en) ELSE tg.name_en END AS target
  FROM gymbro_exercises ge
  JOIN exercise_names en ON en.id = ge.exercise_name_id
  LEFT JOIN categories c ON c.id = ge.category_id
  LEFT JOIN equipment eq ON eq.id = ge.equipment_id
  LEFT JOIN targets tg ON tg.id = ge.target_id
  WHERE
    (p_category_id IS NULL OR ge.category_id = p_category_id)
    AND (p_equipment_id IS NULL OR ge.equipment_id = p_equipment_id)
    AND (p_muscle_group_id IS NULL OR ge.muscle_group_id = p_muscle_group_id)
    AND (p_target_id IS NULL OR ge.target_id = p_target_id)
    AND (
      p_search IS NULL
      OR en.name_en ILIKE '%' || p_search || '%'
      OR en.name_es ILIKE '%' || p_search || '%'
    )
  ORDER BY
    CASE WHEN p_language = 'es' THEN COALESCE(en.name_es, en.name_en) ELSE en.name_en END ASC,
    ge.id ASC
  LIMIT LEAST(p_limit, 100)
  OFFSET p_offset;
$$;


ALTER FUNCTION "public"."get_exercises"("p_language" "text", "p_category_id" "uuid", "p_equipment_id" "uuid", "p_muscle_group_id" "uuid", "p_target_id" "uuid", "p_limit" integer, "p_offset" integer, "p_search" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_gymbro_requests"() RETURNS TABLE("friendship_id" "uuid", "direction" "text", "id" "uuid", "user_name" "text", "first_name" "text", "last_name" "text", "avatar_url" "text", "created_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select f.id,
         case when f.addressee_id = auth.uid() then 'incoming' else 'outgoing' end,
         u.id, u.user_name, u.first_name, u.last_name, u.avatar_url, f.created_at
  from public.friendships f
  join public.custom_users u
    on u.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  where f.status = 'pending'
    and auth.uid() in (f.requester_id, f.addressee_id)
  order by f.created_at desc;
$$;


ALTER FUNCTION "public"."get_gymbro_requests"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_gymbros"() RETURNS TABLE("id" "uuid", "user_name" "text", "first_name" "text", "last_name" "text", "avatar_url" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select u.id, u.user_name, u.first_name, u.last_name, u.avatar_url
  from public.friendships f
  join public.custom_users u
    on u.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  where f.status = 'accepted'
    and auth.uid() in (f.requester_id, f.addressee_id)
  order by lower(coalesce(nullif(btrim(concat_ws(' ', u.first_name, u.last_name)), ''), u.user_name, ''));
$$;


ALTER FUNCTION "public"."get_gymbros"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_default_split"() RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := auth.uid();
  v_split_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select id into v_split_id
  from public.splits
  where user_id = v_user_id and name = 'Default'
  limit 1;

  if v_split_id is not null then
    return v_split_id;
  end if;

  insert into public.splits (user_id, name, privacy)
  values (v_user_id, 'Default', 'private')
  returning id into v_split_id;

  return v_split_id;
end;
$$;


ALTER FUNCTION "public"."get_or_create_default_split"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile"("p_user_id" "uuid") RETURNS TABLE("id" "uuid", "user_name" "text", "first_name" "text", "last_name" "text", "bio" "text", "avatar_url" "text", "relation" "text", "friendship_id" "uuid", "is_self" boolean, "can_view_full" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "public"."get_profile"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile_routines"("p_user_id" "uuid", "p_language" "text" DEFAULT 'es'::"text") RETURNS TABLE("id" "uuid", "name" "text", "color" "text", "quantity" integer, "tags" "text"[], "split_id" "uuid", "split_name" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    r.id, r.name, r.color,
    (select count(*)::int from public.routine_exercises re where re.routine_id = r.id) as quantity,
    coalesce((
      select array_agg(distinct case when p_language = 'en' then tg.name_en else coalesce(tg.name_es, tg.name_en) end)
      from public.routine_exercises re
      join public.gymbro_exercises ge on ge.id = re.gymbro_exercise_id
      join public.targets tg on tg.id = ge.target_id
      where re.routine_id = r.id
    ), array[]::text[]) as tags,
    s.id,
    s.name
  from public.routines r
  join public.splits s on s.id = r.split_id
  where s.user_id = p_user_id
    and auth.uid() is not null
    and public.can_view_routine(r.id, auth.uid())
  order by s.created_at asc, r.position asc, r.created_at asc;
$$;


ALTER FUNCTION "public"."get_profile_routines"("p_user_id" "uuid", "p_language" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_routine_exercises"("p_routine_id" "uuid", "p_language" "text" DEFAULT 'es'::"text") RETURNS TABLE("id" "uuid", "gymbro_exercise_id" "uuid", "position" integer, "name" "text", "image" "text", "muscle_group" "text", "sets" "jsonb")
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select
    re.id, re.gymbro_exercise_id, re.position,
    case when p_language = 'es' then coalesce(en.name_es, en.name_en) else en.name_en end as name,
    ge.image,
    case when p_language = 'es' then coalesce(tg.name_es, tg.name_en) else tg.name_en end as muscle_group,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'position', s.position,
        'min_reps', s.min_reps, 'max_reps', s.max_reps, 'weight', s.weight
      ) order by s.position)
      from public.routine_exercise_sets s where s.routine_exercise_id = re.id
    ), '[]'::jsonb) as sets
  from public.routine_exercises re
  join public.gymbro_exercises ge on ge.id = re.gymbro_exercise_id
  join public.exercise_names en on en.id = ge.exercise_name_id
  left join public.targets tg on tg.id = ge.target_id
  join public.routines r on r.id = re.routine_id
  join public.splits sp on sp.id = r.split_id
  where re.routine_id = p_routine_id and sp.user_id = auth.uid() and r.archived_at is null
  order by re.position asc;
$$;


ALTER FUNCTION "public"."get_routine_exercises"("p_routine_id" "uuid", "p_language" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_routines"("p_language" "text" DEFAULT 'es'::"text") RETURNS TABLE("id" "uuid", "name" "text", "color" "text", "quantity" integer, "tags" "text"[], "split_id" "uuid")
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select
    r.id, r.name, r.color,
    (select count(*)::int from public.routine_exercises re where re.routine_id = r.id) as quantity,
    coalesce((
      select array_agg(distinct case when p_language = 'en' then tg.name_en else coalesce(tg.name_es, tg.name_en) end)
      from public.routine_exercises re
      join public.gymbro_exercises ge on ge.id = re.gymbro_exercise_id
      join public.targets tg on tg.id = ge.target_id
      where re.routine_id = r.id
    ), array[]::text[]) as tags,
    r.split_id
  from public.routines r
  join public.splits s on s.id = r.split_id
  where s.user_id = auth.uid() and r.archived_at is null and s.archived_at is null
  order by r.position asc, r.created_at asc;
$$;


ALTER FUNCTION "public"."get_routines"("p_language" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_shared_routine"("p_routine_id" "uuid") RETURNS TABLE("id" "uuid", "name" "text", "color" "text", "quantity" integer, "owner_id" "uuid", "owner_user_name" "text", "owner_first_name" "text", "owner_last_name" "text", "owner_avatar_url" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select r.id, r.name, r.color,
         (select count(*)::int from public.routine_exercises re where re.routine_id = r.id),
         u.id, u.user_name, u.first_name, u.last_name, u.avatar_url
  from public.routines r
  join public.splits s on s.id = r.split_id
  join public.custom_users u on u.id = s.user_id
  where r.id = p_routine_id
    and auth.uid() is not null
    and public.can_view_routine(r.id, auth.uid());
$$;


ALTER FUNCTION "public"."get_shared_routine"("p_routine_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_shared_routine_exercises"("p_routine_id" "uuid", "p_language" "text" DEFAULT 'es'::"text") RETURNS TABLE("id" "uuid", "gymbro_exercise_id" "uuid", "position" integer, "name" "text", "image" "text", "muscle_group" "text", "sets" "jsonb")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    re.id, re.gymbro_exercise_id, re.position,
    case when p_language = 'es' then coalesce(en.name_es, en.name_en) else en.name_en end as name,
    ge.image,
    case when p_language = 'es' then coalesce(tg.name_es, tg.name_en) else tg.name_en end as muscle_group,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'position', s.position,
        'min_reps', s.min_reps, 'max_reps', s.max_reps, 'weight', s.weight
      ) order by s.position)
      from public.routine_exercise_sets s where s.routine_exercise_id = re.id
    ), '[]'::jsonb) as sets
  from public.routine_exercises re
  join public.gymbro_exercises ge on ge.id = re.gymbro_exercise_id
  join public.exercise_names en on en.id = ge.exercise_name_id
  left join public.targets tg on tg.id = ge.target_id
  where re.routine_id = p_routine_id
    and auth.uid() is not null
    and public.can_view_routine(re.routine_id, auth.uid())
  order by re.position asc;
$$;


ALTER FUNCTION "public"."get_shared_routine_exercises"("p_routine_id" "uuid", "p_language" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_splits"() RETURNS TABLE("id" "uuid", "name" "text", "is_active" boolean, "routines" integer, "created_at" timestamp with time zone, "privacy" "text")
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  with mine as (
    select s.* from public.splits s
     where s.user_id = auth.uid() and s.archived_at is null
  ),
  effective as (
    select coalesce(
      (select m.id from mine m join public.custom_users cu on cu.active_split_id = m.id where cu.id = auth.uid()),
      (select m.id from mine m order by m.created_at limit 1)
    ) as id
  )
  select m.id, m.name, m.id = (select e.id from effective e),
         (select count(*)::int from public.routines r where r.split_id = m.id and r.archived_at is null),
         m.created_at,
         m.privacy::text
  from mine m
  order by m.created_at, m.name;
$$;


ALTER FUNCTION "public"."get_splits"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_workout_exercises"("p_workout_id" "uuid", "p_language" "text" DEFAULT 'es'::"text") RETURNS TABLE("id" "uuid", "gymbro_exercise_id" "uuid", "position" integer, "name" "text", "image" "text", "gif_url" "text", "muscle_group" "text", "equipment" "text", "sets" "jsonb")
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select
    we.id, we.gymbro_exercise_id, we.position,
    case when p_language = 'es' then coalesce(en.name_es, en.name_en) else en.name_en end as name,
    ge.image,
    ge.gif_url,
    case when p_language = 'es' then coalesce(tg.name_es, tg.name_en) else tg.name_en end as muscle_group,
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
  left join public.targets tg on tg.id = ge.target_id
  left join public.equipment eq on eq.id = ge.equipment_id
  where we.workout_id = p_workout_id and w.user_id = auth.uid()
  order by we.position asc;
$$;


ALTER FUNCTION "public"."get_workout_exercises"("p_workout_id" "uuid", "p_language" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."gymbro_relation"("p_viewer" "uuid", "p_other" "uuid") RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "public"."gymbro_relation"("p_viewer" "uuid", "p_other" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.custom_users (
    id,
    user_name,
    first_name,
    last_name,
    language
  )
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'user_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'language', ''), 'en')
  );

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_active_trainer_relationship"("p_trainer_id" "uuid", "p_gymbro_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.trainer_gymbros tg
    where tg.trainer_id = p_trainer_id
      and tg.gymbro_id = p_gymbro_id
      and tg.status = 'active'
  );
$$;


ALTER FUNCTION "public"."has_active_trainer_relationship"("p_trainer_id" "uuid", "p_gymbro_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."import_routine"("p_source_routine_id" "uuid", "p_target_split_id" "uuid", "p_name" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_source_routine public.routines%rowtype;
  v_source_exercise public.routine_exercises%rowtype;
  v_source_set public.routine_exercise_sets%rowtype;
  v_new_routine_id uuid;
  v_new_exercise_id uuid;
  v_position integer;
begin
  perform 1
  from public.splits
  where id = p_target_split_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Target split not found or not owned by current user';
  end if;

  select r.*
  into v_source_routine
  from public.routines r
  where r.id = p_source_routine_id;

  if not found
    or not public.can_view_routine(p_source_routine_id, auth.uid()) then
    raise exception 'Source routine not found or unavailable';
  end if;

  select coalesce(max(position), 0) + 1
  into v_position
  from public.routines
  where split_id = p_target_split_id;

  insert into public.routines (split_id, position, name, color, privacy, source_routine_id)
  values (
    p_target_split_id,
    v_position,
    coalesce(nullif(trim(p_name), ''), v_source_routine.name),
    v_source_routine.color,
    'private',
    v_source_routine.id
  )
  returning id into v_new_routine_id;

  for v_source_exercise in
    select * from public.routine_exercises
    where routine_id = v_source_routine.id
    order by position
  loop
    insert into public.routine_exercises (routine_id, gymbro_exercise_id, position, notes)
    values (v_new_routine_id, v_source_exercise.gymbro_exercise_id, v_source_exercise.position, v_source_exercise.notes)
    returning id into v_new_exercise_id;

    for v_source_set in
      select * from public.routine_exercise_sets
      where routine_exercise_id = v_source_exercise.id
      order by position
    loop
      insert into public.routine_exercise_sets (routine_exercise_id, position, min_reps, max_reps, rir, weight)
      values (v_new_exercise_id, v_source_set.position, v_source_set.min_reps, v_source_set.max_reps, v_source_set.rir, v_source_set.weight);
    end loop;
  end loop;

  return v_new_routine_id;
end;
$$;


ALTER FUNCTION "public"."import_routine"("p_source_routine_id" "uuid", "p_target_split_id" "uuid", "p_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."import_split"("p_source_split_id" "uuid", "p_name" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_new_split_id uuid;
begin
  if not public.can_view_split(p_source_split_id, auth.uid()) then
    raise exception 'You cannot import this split';
  end if;

  v_new_split_id := public.clone_split_for_user(
    p_source_split_id,
    auth.uid(),
    p_name
  );

  return v_new_split_id;
end;
$$;


ALTER FUNCTION "public"."import_split"("p_source_split_id" "uuid", "p_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = p_user_id
      and ur.role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_gymbro"("p_user_a" "uuid", "p_user_b" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester_id = p_user_a and f.addressee_id = p_user_b)
        or
        (f.requester_id = p_user_b and f.addressee_id = p_user_a)
      )
  );
$$;


ALTER FUNCTION "public"."is_gymbro"("p_user_a" "uuid", "p_user_b" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_trainer"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = p_user_id
      and ur.role = 'trainer'
  );
$$;


ALTER FUNCTION "public"."is_trainer"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."move_routine_to_split"("p_routine_id" "uuid", "p_split_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_current uuid;
  v_pos int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select r.split_id into v_current
    from public.routines r
    join public.splits s on s.id = r.split_id
   where r.id = p_routine_id and s.user_id = auth.uid() and r.archived_at is null;
  if not found then raise exception 'routine not found'; end if;

  if v_current = p_split_id then return; end if;

  perform 1 from public.splits
   where id = p_split_id and user_id = auth.uid() and archived_at is null
   for update;
  if not found then raise exception 'split not found'; end if;

  select coalesce(max(position), 0) + 1 into v_pos
    from public.routines where split_id = p_split_id;

  update public.routines
     set split_id = p_split_id, position = v_pos
   where id = p_routine_id;
end;
$$;


ALTER FUNCTION "public"."move_routine_to_split"("p_routine_id" "uuid", "p_split_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."owns_routine"("p_routine_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.routines r
    join public.splits s on s.id = r.split_id
    where r.id = p_routine_id
      and s.user_id = p_user_id
  );
$$;


ALTER FUNCTION "public"."owns_routine"("p_routine_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."owns_split"("p_split_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1 from public.splits
    where id = p_split_id and user_id = p_user_id
  );
$$;


ALTER FUNCTION "public"."owns_split"("p_split_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."owns_workout"("p_workout_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1 from public.workouts
    where id = p_workout_id and user_id = p_user_id
  );
$$;


ALTER FUNCTION "public"."owns_workout"("p_workout_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_finished_workout_exercise_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  v_workout_id uuid;
  v_finished_at timestamptz;
begin
  v_workout_id := coalesce(new.workout_id, old.workout_id);

  select finished_at
  into v_finished_at
  from public.workouts
  where id = v_workout_id;

  if v_finished_at is not null then
    -- Removing an exercise from a routine detaches it from past workouts through
    -- the foreign key's ON DELETE SET NULL; nothing else may change.
    if tg_op = 'UPDATE'
       and pg_trigger_depth() > 1
       and old.routine_exercise_id is not null
       and new.routine_exercise_id is null
       and (to_jsonb(new) - 'routine_exercise_id' - 'updated_at')
         = (to_jsonb(old) - 'routine_exercise_id' - 'updated_at') then
      return new;
    end if;

    raise exception 'Finished workout exercises cannot be modified';
  end if;

  return coalesce(new, old);
end;
$$;


ALTER FUNCTION "public"."prevent_finished_workout_exercise_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_finished_workout_set_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  v_workout_exercise_id uuid;
  v_finished_at timestamptz;
begin
  v_workout_exercise_id := coalesce(
    new.workout_exercise_id,
    old.workout_exercise_id
  );

  select w.finished_at
  into v_finished_at
  from public.workout_exercises we
  join public.workouts w on w.id = we.workout_id
  where we.id = v_workout_exercise_id;

  if v_finished_at is not null then
    raise exception 'Finished workout sets cannot be modified';
  end if;

  return coalesce(new, old);
end;
$$;


ALTER FUNCTION "public"."prevent_finished_workout_set_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_gymbro"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  delete from public.friendships f
   where f.status = 'accepted'
     and least(f.requester_id, f.addressee_id) = least(auth.uid(), p_user_id)
     and greatest(f.requester_id, f.addressee_id) = greatest(auth.uid(), p_user_id);

  if not found then raise exception 'gymbro not found'; end if;
end;
$$;


ALTER FUNCTION "public"."remove_gymbro"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rename_split"("p_id" "uuid", "p_name" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'name required'; end if;

  begin
    update public.splits
       set name = btrim(p_name)
     where id = p_id and user_id = auth.uid() and archived_at is null;
  exception when unique_violation then
    raise exception 'split name already exists';
  end;

  if not found then raise exception 'split not found'; end if;
end;
$$;


ALTER FUNCTION "public"."rename_split"("p_id" "uuid", "p_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reorder_routine_exercises"("p_routine_id" "uuid", "p_ids" "uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."reorder_routine_exercises"("p_routine_id" "uuid", "p_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."replace_routine_exercise_sets"("p_routine_exercise_id" "uuid", "p_sets" "jsonb") RETURNS TABLE("id" "uuid", "position" integer, "min_reps" integer, "max_reps" integer, "weight" numeric)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_owned boolean;
  v_item jsonb;
  v_keep uuid[] := array[]::uuid[];
  v_pos int := 0;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select exists (
    select 1 from public.routine_exercises re
    join public.routines r on r.id = re.routine_id
    join public.splits s on s.id = r.split_id
    where re.id = p_routine_exercise_id and s.user_id = auth.uid()
  ) into v_owned;
  if not v_owned then raise exception 'routine exercise not found or not owned'; end if;
  if jsonb_typeof(p_sets) <> 'array' or jsonb_array_length(p_sets) = 0 then
    raise exception 'at least one set required';
  end if;

  for v_item in select * from jsonb_array_elements(p_sets) loop
    v_pos := v_pos + 1;
    if v_item ? 'id' and (v_item->>'id') is not null then
      update public.routine_exercise_sets s2
         set position = v_pos,
             min_reps = (v_item->>'min_reps')::int,
             max_reps = (v_item->>'max_reps')::int,
             weight   = nullif(v_item->>'weight','')::numeric,
             updated_at = now()
       where s2.id = (v_item->>'id')::uuid
         and s2.routine_exercise_id = p_routine_exercise_id
       returning s2.id into v_id;
      if v_id is null then raise exception 'set % not found', v_item->>'id'; end if;
    else
      insert into public.routine_exercise_sets (routine_exercise_id, position, min_reps, max_reps, weight)
      values (p_routine_exercise_id, v_pos,
              (v_item->>'min_reps')::int,
              (v_item->>'max_reps')::int,
              nullif(v_item->>'weight','')::numeric)
      returning routine_exercise_sets.id into v_id;
    end if;
    v_keep := array_append(v_keep, v_id);
  end loop;

  delete from public.routine_exercise_sets s3
   where s3.routine_exercise_id = p_routine_exercise_id
     and s3.id <> all(v_keep);

  return query
    select s4.id, s4.position, s4.min_reps, s4.max_reps, s4.weight
      from public.routine_exercise_sets s4
     where s4.routine_exercise_id = p_routine_exercise_id
     order by s4.position;
end;
$$;


ALTER FUNCTION "public"."replace_routine_exercise_sets"("p_routine_exercise_id" "uuid", "p_sets" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."friendships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "addressee_id" "uuid" NOT NULL,
    "status" "public"."friendship_status" DEFAULT 'pending'::"public"."friendship_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "friendships_check" CHECK (("requester_id" <> "addressee_id"))
);


ALTER TABLE "public"."friendships" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."respond_to_friendship"("p_friendship_id" "uuid", "p_status" "public"."friendship_status") RETURNS "public"."friendships"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_result public.friendships;
begin
  if p_status not in ('accepted', 'rejected', 'blocked') then
    raise exception 'Invalid friendship response';
  end if;

  update public.friendships
  set status = p_status
  where id = p_friendship_id
    and addressee_id = auth.uid()
    and status = 'pending'
  returning * into v_result;

  if not found then
    raise exception 'Friendship request not found or unavailable';
  end if;

  return v_result;
end;
$$;


ALTER FUNCTION "public"."respond_to_friendship"("p_friendship_id" "uuid", "p_status" "public"."friendship_status") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trainer_gymbros" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trainer_id" "uuid" NOT NULL,
    "gymbro_id" "uuid" NOT NULL,
    "status" "public"."trainer_gymbro_status" DEFAULT 'pending'::"public"."trainer_gymbro_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "trainer_gymbros_check" CHECK (("trainer_id" <> "gymbro_id"))
);


ALTER TABLE "public"."trainer_gymbros" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."respond_to_trainer_request"("p_relationship_id" "uuid", "p_status" "public"."trainer_gymbro_status") RETURNS "public"."trainer_gymbros"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_result public.trainer_gymbros;
begin
  if p_status not in ('active', 'declined') then
    raise exception 'Invalid trainer relationship response';
  end if;

  update public.trainer_gymbros
  set status = p_status
  where id = p_relationship_id
    and gymbro_id = auth.uid()
    and status = 'pending'
  returning * into v_result;

  if not found then
    raise exception 'Trainer request not found or unavailable';
  end if;

  return v_result;
end;
$$;


ALTER FUNCTION "public"."respond_to_trainer_request"("p_relationship_id" "uuid", "p_status" "public"."trainer_gymbro_status") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."review_trainer_application"("p_application_id" "uuid", "p_approve" boolean, "p_response_message" "text" DEFAULT NULL::"text") RETURNS "public"."trainer_applications"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "public"."review_trainer_application"("p_application_id" "uuid", "p_approve" boolean, "p_response_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_trainer_assignment"("p_assignment_id" "uuid") RETURNS "public"."trainer_assignments"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_result public.trainer_assignments;
begin
  update public.trainer_assignments
  set
    status = 'revoked',
    responded_at = coalesce(responded_at, now())
  where id = p_assignment_id
    and trainer_id = auth.uid()
    and status in ('pending', 'accepted')
  returning * into v_result;

  if not found then
    raise exception 'Assignment not found or unavailable';
  end if;

  -- La copia importada NO se borra: ya pertenece al gymbro.
  return v_result;
end;
$$;


ALTER FUNCTION "public"."revoke_trainer_assignment"("p_assignment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_profiles"("p_query" "text", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "user_name" "text", "first_name" "text", "last_name" "text", "avatar_url" "text", "relation" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "public"."search_profiles"("p_query" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_gymbro_request"("p_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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
$$;


ALTER FUNCTION "public"."send_gymbro_request"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_active_split"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  perform 1 from public.splits
   where id = p_id and user_id = auth.uid() and archived_at is null;
  if not found then raise exception 'split not found'; end if;

  update public.custom_users set active_split_id = p_id where id = auth.uid();
end;
$$;


ALTER FUNCTION "public"."set_active_split"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_split_privacy"("p_id" "uuid", "p_privacy" "public"."profile_privacy") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  update public.splits set privacy = p_privacy
   where id = p_id and user_id = auth.uid() and archived_at is null;
  if not found then raise exception 'split not found'; end if;
end;
$$;


ALTER FUNCTION "public"."set_split_privacy"("p_id" "uuid", "p_privacy" "public"."profile_privacy") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_workout"("p_routine_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_workout_id uuid;
  v_routine_exercise public.routine_exercises%rowtype;
  v_routine_set public.routine_exercise_sets%rowtype;
  v_workout_exercise_id uuid;
begin
  if not public.owns_routine(p_routine_id, auth.uid()) then
    raise exception 'Routine not found or not owned by current user';
  end if;

  if exists (
    select 1 from public.routines where id = p_routine_id and archived_at is not null
  ) then
    raise exception 'Routine not found or not owned by current user';
  end if;

  if not exists (
    select 1 from public.routine_exercises where routine_id = p_routine_id
  ) then
    raise exception 'Routine has no exercises';
  end if;

  insert into public.workouts (
    user_id,
    routine_id,
    started_at
  )
  values (
    auth.uid(),
    p_routine_id,
    now()
  )
  returning id into v_workout_id;

  for v_routine_exercise in
    select *
    from public.routine_exercises
    where routine_id = p_routine_id
    order by position
  loop
    insert into public.workout_exercises (
      workout_id,
      routine_exercise_id,
      gymbro_exercise_id,
      position,
      notes_snapshot
    )
    values (
      v_workout_id,
      v_routine_exercise.id,
      v_routine_exercise.gymbro_exercise_id,
      v_routine_exercise.position,
      v_routine_exercise.notes
    )
    returning id into v_workout_exercise_id;

    for v_routine_set in
      select *
      from public.routine_exercise_sets
      where routine_exercise_id = v_routine_exercise.id
      order by position
    loop
      insert into public.workout_sets (
        workout_exercise_id,
        position,
        weight,
        completed
      )
      values (
        v_workout_exercise_id,
        v_routine_set.position,
        v_routine_set.weight,
        false
      );
    end loop;
  end loop;

  return v_workout_id;
end;
$$;


ALTER FUNCTION "public"."start_workout"("p_routine_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_routine"("p_id" "uuid", "p_name" "text", "p_color" "text") RETURNS TABLE("id" "uuid", "name" "text", "color" "text", "quantity" integer, "tags" "text"[], "split_id" "uuid")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'name required'; end if;

  update public.routines r
     set name = btrim(p_name), color = p_color, updated_at = now()
   where r.id = p_id
     and r.archived_at is null
     and exists (select 1 from public.splits s where s.id = r.split_id and s.user_id = auth.uid());

  if not found then raise exception 'routine not found or not owned'; end if;

  return query
  select r.id, r.name, r.color,
    (select count(*)::int from public.routine_exercises re where re.routine_id = r.id),
    coalesce((select array_agg(distinct coalesce(tg.name_es, tg.name_en))
      from public.routine_exercises re
      join public.gymbro_exercises ge on ge.id = re.gymbro_exercise_id
      join public.targets tg on tg.id = ge.target_id
      where re.routine_id = r.id), array[]::text[]),
    r.split_id
  from public.routines r where r.id = p_id;
end;
$$;


ALTER FUNCTION "public"."update_routine"("p_id" "uuid", "p_name" "text", "p_color" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_workout_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if new.routine_id is not null and not public.owns_routine(new.routine_id, new.user_id) then
    raise exception 'Workout routine must belong to the workout owner';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."validate_workout_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_workout_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  -- No se puede reabrir ni editar un Workout ya cerrado.
  if old.finished_at is not null then
    raise exception 'Finished workouts cannot be modified';
  end if;

  -- La rutina elegida debe pertenecer al dueño del Workout.
  if new.routine_id is not null and not public.owns_routine(new.routine_id, new.user_id) then
    raise exception 'Workout routine must belong to the workout owner';
  end if;

  -- No permitir alterar el dueño.
  if new.user_id <> old.user_id then
    raise exception 'Workout owner cannot be changed';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."validate_workout_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."withdraw_trainer_application"("p_application_id" "uuid") RETURNS "public"."trainer_applications"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_application public.trainer_applications;
begin
  update public.trainer_applications
  set status = 'withdrawn'
  where id = p_application_id
    and applicant_id = auth.uid()
    and status = 'pending'
  returning * into v_application;

  if not found then
    raise exception 'Pending application not found';
  end if;

  return v_application;
end;
$$;


ALTER FUNCTION "public"."withdraw_trainer_application"("p_application_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name_en" "text" NOT NULL,
    "name_es" "text"
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_users" (
    "id" "uuid" NOT NULL,
    "user_name" "text",
    "first_name" "text",
    "last_name" "text",
    "bio" "text",
    "avatar_url" "text",
    "language" "text" DEFAULT 'en'::"text" NOT NULL,
    "profile_privacy" "public"."profile_privacy" DEFAULT 'private'::"public"."profile_privacy" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "active_split_id" "uuid",
    CONSTRAINT "custom_users_bio_check" CHECK (("char_length"("bio") <= 500)),
    CONSTRAINT "custom_users_language_check" CHECK (("language" = ANY (ARRAY['en'::"text", 'es'::"text"]))),
    CONSTRAINT "custom_users_user_name_format" CHECK ((("user_name" IS NULL) OR ("user_name" ~ '^[a-z0-9_]{3,20}$'::"text")))
);


ALTER TABLE "public"."custom_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."equipment" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name_en" "text" NOT NULL,
    "name_es" "text"
);


ALTER TABLE "public"."equipment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercise_names" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name_en" "text" NOT NULL,
    "name_es" "text"
);


ALTER TABLE "public"."exercise_names" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercise_secondary_muscles" (
    "exercise_id" "uuid" NOT NULL,
    "muscle_group_id" "uuid" NOT NULL
);


ALTER TABLE "public"."exercise_secondary_muscles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exercises" (
    "id" character varying(10) NOT NULL,
    "name" character varying(255) NOT NULL,
    "category" character varying(100),
    "equipment" character varying(100),
    "instructions_en" "text",
    "instructions_es" "text",
    "instructions_it" "text",
    "instructions_tr" "text",
    "instructions_ru" "text",
    "instructions_zh" "text",
    "instructions_hi" "text",
    "instructions_pl" "text",
    "instructions_ko" "text",
    "muscle_group" character varying(100),
    "secondary_muscles" "jsonb",
    "target" character varying(100),
    "image" character varying(500),
    "gif_url" character varying(500),
    "created_at" timestamp with time zone
);


ALTER TABLE "public"."exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gymbro_exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "exercise_id" character varying NOT NULL,
    "exercise_name_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "equipment_id" "uuid",
    "target_id" "uuid",
    "muscle_group_id" "uuid",
    "instructions_en" "text",
    "instructions_es" "text",
    "image" "text",
    "gif_url" "text"
);


ALTER TABLE "public"."gymbro_exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."muscle_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name_en" "text" NOT NULL,
    "name_es" "text"
);


ALTER TABLE "public"."muscle_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."routine_exercise_sets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "routine_exercise_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "min_reps" integer,
    "max_reps" integer,
    "rir" numeric(3,1),
    "weight" numeric(8,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "routine_exercise_sets_check" CHECK ((("min_reps" IS NULL) OR ("max_reps" IS NULL) OR ("min_reps" <= "max_reps"))),
    CONSTRAINT "routine_exercise_sets_max_reps_check" CHECK ((("max_reps" IS NULL) OR ("max_reps" > 0))),
    CONSTRAINT "routine_exercise_sets_min_reps_check" CHECK ((("min_reps" IS NULL) OR ("min_reps" > 0))),
    CONSTRAINT "routine_exercise_sets_position_check" CHECK (("position" > 0)),
    CONSTRAINT "routine_exercise_sets_rir_check" CHECK ((("rir" IS NULL) OR (("rir" >= (0)::numeric) AND ("rir" <= (10)::numeric)))),
    CONSTRAINT "routine_exercise_sets_weight_check" CHECK ((("weight" IS NULL) OR ("weight" >= (0)::numeric)))
);


ALTER TABLE "public"."routine_exercise_sets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."routine_exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "routine_id" "uuid" NOT NULL,
    "gymbro_exercise_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "routine_exercises_position_check" CHECK (("position" > 0))
);


ALTER TABLE "public"."routine_exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."routines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "split_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "name" "text" NOT NULL,
    "color" "text",
    "privacy" "public"."profile_privacy" DEFAULT 'private'::"public"."profile_privacy" NOT NULL,
    "source_routine_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    CONSTRAINT "routines_name_check" CHECK (("char_length"(TRIM(BOTH FROM "name")) > 0)),
    CONSTRAINT "routines_position_check" CHECK (("position" > 0))
);


ALTER TABLE "public"."routines" OWNER TO "postgres";


COMMENT ON COLUMN "public"."routines"."privacy" IS 'Deprecated: visibility is set per split (splits.privacy).';



CREATE TABLE IF NOT EXISTS "public"."splits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "privacy" "public"."profile_privacy" DEFAULT 'private'::"public"."profile_privacy" NOT NULL,
    "source_split_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    CONSTRAINT "splits_name_check" CHECK (("char_length"(TRIM(BOTH FROM "name")) > 0))
);


ALTER TABLE "public"."splits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."targets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name_en" "text" NOT NULL,
    "name_es" "text"
);


ALTER TABLE "public"."targets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_socials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "url" "text",
    "platform" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_socials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_exercises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workout_id" "uuid" NOT NULL,
    "routine_exercise_id" "uuid",
    "gymbro_exercise_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "notes_snapshot" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workout_exercises_position_check" CHECK (("position" > 0))
);


ALTER TABLE "public"."workout_exercises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workout_sets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workout_exercise_id" "uuid" NOT NULL,
    "position" integer NOT NULL,
    "reps" integer,
    "weight" numeric(8,2),
    "completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workout_sets_position_check" CHECK (("position" > 0)),
    CONSTRAINT "workout_sets_reps_check" CHECK ((("reps" IS NULL) OR ("reps" >= 0))),
    CONSTRAINT "workout_sets_weight_check" CHECK ((("weight" IS NULL) OR ("weight" >= (0)::numeric)))
);


ALTER TABLE "public"."workout_sets" OWNER TO "postgres";


ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_users"
    ADD CONSTRAINT "custom_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_users"
    ADD CONSTRAINT "custom_users_user_name_key" UNIQUE ("user_name");



ALTER TABLE ONLY "public"."equipment"
    ADD CONSTRAINT "equipment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercise_names"
    ADD CONSTRAINT "exercise_names_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exercise_secondary_muscles"
    ADD CONSTRAINT "exercise_secondary_muscles_pkey" PRIMARY KEY ("exercise_id", "muscle_group_id");



ALTER TABLE ONLY "public"."exercises"
    ADD CONSTRAINT "exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gymbro_exercises"
    ADD CONSTRAINT "gymbro_exercises_exercise_id_key" UNIQUE ("exercise_id");



ALTER TABLE ONLY "public"."gymbro_exercises"
    ADD CONSTRAINT "gymbro_exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."muscle_groups"
    ADD CONSTRAINT "muscle_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."routine_exercise_sets"
    ADD CONSTRAINT "routine_exercise_sets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."routine_exercise_sets"
    ADD CONSTRAINT "routine_exercise_sets_routine_exercise_id_position_key" UNIQUE ("routine_exercise_id", "position");



ALTER TABLE ONLY "public"."routine_exercises"
    ADD CONSTRAINT "routine_exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."routine_exercises"
    ADD CONSTRAINT "routine_exercises_routine_id_position_key" UNIQUE ("routine_id", "position");



ALTER TABLE ONLY "public"."routines"
    ADD CONSTRAINT "routines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."routines"
    ADD CONSTRAINT "routines_split_id_position_key" UNIQUE ("split_id", "position");



ALTER TABLE ONLY "public"."splits"
    ADD CONSTRAINT "splits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."targets"
    ADD CONSTRAINT "targets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainer_applications"
    ADD CONSTRAINT "trainer_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainer_assignments"
    ADD CONSTRAINT "trainer_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainer_gymbros"
    ADD CONSTRAINT "trainer_gymbros_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainer_gymbros"
    ADD CONSTRAINT "trainer_gymbros_trainer_id_gymbro_id_key" UNIQUE ("trainer_id", "gymbro_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."user_socials"
    ADD CONSTRAINT "user_socials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_socials"
    ADD CONSTRAINT "user_socials_user_id_platform_username_key" UNIQUE ("user_id", "platform", "username");



ALTER TABLE ONLY "public"."workout_exercises"
    ADD CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_exercises"
    ADD CONSTRAINT "workout_exercises_workout_id_position_key" UNIQUE ("workout_id", "position");



ALTER TABLE ONLY "public"."workout_sets"
    ADD CONSTRAINT "workout_sets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workout_sets"
    ADD CONSTRAINT "workout_sets_workout_exercise_id_position_key" UNIQUE ("workout_exercise_id", "position");



ALTER TABLE ONLY "public"."workouts"
    ADD CONSTRAINT "workouts_pkey" PRIMARY KEY ("id");



CREATE INDEX "exercises_category_idx" ON "public"."exercises" USING "btree" ("category");



CREATE INDEX "exercises_equipment_idx" ON "public"."exercises" USING "btree" ("equipment");



CREATE INDEX "exercises_muscle_group_idx" ON "public"."exercises" USING "btree" ("muscle_group");



CREATE INDEX "exercises_target_idx" ON "public"."exercises" USING "btree" ("target");



CREATE INDEX "friendships_addressee_status_idx" ON "public"."friendships" USING "btree" ("addressee_id", "status");



CREATE INDEX "friendships_requester_status_idx" ON "public"."friendships" USING "btree" ("requester_id", "status");



CREATE UNIQUE INDEX "friendships_unique_pair_idx" ON "public"."friendships" USING "btree" (LEAST("requester_id", "addressee_id"), GREATEST("requester_id", "addressee_id"));



CREATE UNIQUE INDEX "one_active_workout_per_user_idx" ON "public"."workouts" USING "btree" ("user_id") WHERE ("finished_at" IS NULL);



CREATE UNIQUE INDEX "one_pending_trainer_application_per_user_idx" ON "public"."trainer_applications" USING "btree" ("applicant_id") WHERE ("status" = 'pending'::"public"."trainer_application_status");



CREATE INDEX "routine_exercise_sets_routine_exercise_id_idx" ON "public"."routine_exercise_sets" USING "btree" ("routine_exercise_id");



CREATE INDEX "routine_exercises_gymbro_exercise_id_idx" ON "public"."routine_exercises" USING "btree" ("gymbro_exercise_id");



CREATE INDEX "routine_exercises_routine_id_idx" ON "public"."routine_exercises" USING "btree" ("routine_id");



CREATE INDEX "routines_split_id_idx" ON "public"."routines" USING "btree" ("split_id");



CREATE INDEX "splits_source_split_id_idx" ON "public"."splits" USING "btree" ("source_split_id");



CREATE INDEX "splits_user_id_idx" ON "public"."splits" USING "btree" ("user_id");



CREATE UNIQUE INDEX "splits_user_name_uq" ON "public"."splits" USING "btree" ("user_id", "lower"("btrim"("name"))) WHERE ("archived_at" IS NULL);



CREATE INDEX "trainer_applications_status_created_at_idx" ON "public"."trainer_applications" USING "btree" ("status", "created_at");



CREATE INDEX "trainer_assignments_gymbro_status_idx" ON "public"."trainer_assignments" USING "btree" ("gymbro_id", "status");



CREATE INDEX "trainer_assignments_split_id_idx" ON "public"."trainer_assignments" USING "btree" ("split_id");



CREATE INDEX "trainer_assignments_trainer_status_idx" ON "public"."trainer_assignments" USING "btree" ("trainer_id", "status");



CREATE INDEX "trainer_gymbros_gymbro_status_idx" ON "public"."trainer_gymbros" USING "btree" ("gymbro_id", "status");



CREATE INDEX "trainer_gymbros_trainer_status_idx" ON "public"."trainer_gymbros" USING "btree" ("trainer_id", "status");



CREATE INDEX "user_socials_user_id_idx" ON "public"."user_socials" USING "btree" ("user_id");



CREATE INDEX "workout_exercises_gymbro_exercise_id_idx" ON "public"."workout_exercises" USING "btree" ("gymbro_exercise_id");



CREATE INDEX "workout_exercises_workout_id_idx" ON "public"."workout_exercises" USING "btree" ("workout_id");



CREATE INDEX "workout_sets_workout_exercise_id_idx" ON "public"."workout_sets" USING "btree" ("workout_exercise_id");



CREATE INDEX "workouts_routine_id_idx" ON "public"."workouts" USING "btree" ("routine_id");



CREATE INDEX "workouts_user_started_at_idx" ON "public"."workouts" USING "btree" ("user_id", "started_at" DESC);



CREATE OR REPLACE TRIGGER "custom_users_set_updated_at" BEFORE UPDATE ON "public"."custom_users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "friendships_set_updated_at" BEFORE UPDATE ON "public"."friendships" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "routine_exercise_sets_set_updated_at" BEFORE UPDATE ON "public"."routine_exercise_sets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "routine_exercises_set_updated_at" BEFORE UPDATE ON "public"."routine_exercises" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "routines_set_updated_at" BEFORE UPDATE ON "public"."routines" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "splits_set_updated_at" BEFORE UPDATE ON "public"."splits" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trainer_applications_set_updated_at" BEFORE UPDATE ON "public"."trainer_applications" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trainer_assignments_set_updated_at" BEFORE UPDATE ON "public"."trainer_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trainer_gymbros_set_updated_at" BEFORE UPDATE ON "public"."trainer_gymbros" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "workout_exercises_block_finished_changes" BEFORE INSERT OR DELETE OR UPDATE ON "public"."workout_exercises" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_finished_workout_exercise_changes"();



CREATE OR REPLACE TRIGGER "workout_exercises_set_updated_at" BEFORE UPDATE ON "public"."workout_exercises" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "workout_sets_block_finished_changes" BEFORE INSERT OR DELETE OR UPDATE ON "public"."workout_sets" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_finished_workout_set_changes"();



CREATE OR REPLACE TRIGGER "workout_sets_set_updated_at" BEFORE UPDATE ON "public"."workout_sets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "workouts_set_updated_at" BEFORE UPDATE ON "public"."workouts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "workouts_validate_insert" BEFORE INSERT ON "public"."workouts" FOR EACH ROW EXECUTE FUNCTION "public"."validate_workout_insert"();



CREATE OR REPLACE TRIGGER "workouts_validate_update" BEFORE UPDATE ON "public"."workouts" FOR EACH ROW EXECUTE FUNCTION "public"."validate_workout_update"();



ALTER TABLE ONLY "public"."custom_users"
    ADD CONSTRAINT "custom_users_active_split_id_fkey" FOREIGN KEY ("active_split_id") REFERENCES "public"."splits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."custom_users"
    ADD CONSTRAINT "custom_users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exercise_secondary_muscles"
    ADD CONSTRAINT "exercise_secondary_muscles_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."gymbro_exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exercise_secondary_muscles"
    ADD CONSTRAINT "exercise_secondary_muscles_muscle_group_id_fkey" FOREIGN KEY ("muscle_group_id") REFERENCES "public"."muscle_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "public"."custom_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."custom_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gymbro_exercises"
    ADD CONSTRAINT "gymbro_exercises_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."gymbro_exercises"
    ADD CONSTRAINT "gymbro_exercises_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."gymbro_exercises"
    ADD CONSTRAINT "gymbro_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."gymbro_exercises"
    ADD CONSTRAINT "gymbro_exercises_exercise_name_id_fkey" FOREIGN KEY ("exercise_name_id") REFERENCES "public"."exercise_names"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."gymbro_exercises"
    ADD CONSTRAINT "gymbro_exercises_muscle_group_id_fkey" FOREIGN KEY ("muscle_group_id") REFERENCES "public"."muscle_groups"("id");



ALTER TABLE ONLY "public"."gymbro_exercises"
    ADD CONSTRAINT "gymbro_exercises_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "public"."targets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."routine_exercise_sets"
    ADD CONSTRAINT "routine_exercise_sets_routine_exercise_id_fkey" FOREIGN KEY ("routine_exercise_id") REFERENCES "public"."routine_exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routine_exercises"
    ADD CONSTRAINT "routine_exercises_gymbro_exercise_id_fkey" FOREIGN KEY ("gymbro_exercise_id") REFERENCES "public"."gymbro_exercises"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."routine_exercises"
    ADD CONSTRAINT "routine_exercises_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."routines"
    ADD CONSTRAINT "routines_source_routine_id_fkey" FOREIGN KEY ("source_routine_id") REFERENCES "public"."routines"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."routines"
    ADD CONSTRAINT "routines_split_id_fkey" FOREIGN KEY ("split_id") REFERENCES "public"."splits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."splits"
    ADD CONSTRAINT "splits_source_split_id_fkey" FOREIGN KEY ("source_split_id") REFERENCES "public"."splits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."splits"
    ADD CONSTRAINT "splits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."custom_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainer_applications"
    ADD CONSTRAINT "trainer_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."custom_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainer_applications"
    ADD CONSTRAINT "trainer_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."custom_users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trainer_assignments"
    ADD CONSTRAINT "trainer_assignments_gymbro_id_fkey" FOREIGN KEY ("gymbro_id") REFERENCES "public"."custom_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainer_assignments"
    ADD CONSTRAINT "trainer_assignments_imported_split_id_fkey" FOREIGN KEY ("imported_split_id") REFERENCES "public"."splits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trainer_assignments"
    ADD CONSTRAINT "trainer_assignments_split_id_fkey" FOREIGN KEY ("split_id") REFERENCES "public"."splits"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."trainer_assignments"
    ADD CONSTRAINT "trainer_assignments_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."custom_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainer_gymbros"
    ADD CONSTRAINT "trainer_gymbros_gymbro_id_fkey" FOREIGN KEY ("gymbro_id") REFERENCES "public"."custom_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainer_gymbros"
    ADD CONSTRAINT "trainer_gymbros_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "public"."custom_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."custom_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_socials"
    ADD CONSTRAINT "user_socials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."custom_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_exercises"
    ADD CONSTRAINT "workout_exercises_gymbro_exercise_id_fkey" FOREIGN KEY ("gymbro_exercise_id") REFERENCES "public"."gymbro_exercises"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."workout_exercises"
    ADD CONSTRAINT "workout_exercises_routine_exercise_id_fkey" FOREIGN KEY ("routine_exercise_id") REFERENCES "public"."routine_exercises"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workout_exercises"
    ADD CONSTRAINT "workout_exercises_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workout_sets"
    ADD CONSTRAINT "workout_sets_workout_exercise_id_fkey" FOREIGN KEY ("workout_exercise_id") REFERENCES "public"."workout_exercises"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workouts"
    ADD CONSTRAINT "workouts_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."workouts"
    ADD CONSTRAINT "workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."custom_users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins view trainer applications" ON "public"."trainer_applications" FOR SELECT TO "authenticated" USING ("public"."is_admin"(( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Applicants view own trainer applications" ON "public"."trainer_applications" FOR SELECT TO "authenticated" USING (("applicant_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Owners delete own splits" ON "public"."splits" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Owners manage routine exercises" ON "public"."routine_exercises" TO "authenticated" USING ("public"."owns_routine"("routine_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."owns_routine"("routine_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Owners manage routine sets" ON "public"."routine_exercise_sets" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."routine_exercises" "re"
  WHERE (("re"."id" = "routine_exercise_sets"."routine_exercise_id") AND "public"."owns_routine"("re"."routine_id", ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."routine_exercises" "re"
  WHERE (("re"."id" = "routine_exercise_sets"."routine_exercise_id") AND "public"."owns_routine"("re"."routine_id", ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Owners manage routines" ON "public"."routines" TO "authenticated" USING ("public"."owns_split"("split_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."owns_split"("split_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Owners update own splits" ON "public"."splits" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Participants view their friendships" ON "public"."friendships" FOR SELECT TO "authenticated" USING ((("requester_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("addressee_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Profiles visible according to privacy" ON "public"."custom_users" FOR SELECT TO "authenticated" USING ("public"."can_view_profile"("id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Public read categories" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Public read equipment" ON "public"."equipment" FOR SELECT USING (true);



CREATE POLICY "Public read exercise names" ON "public"."exercise_names" FOR SELECT USING (true);



CREATE POLICY "Public read exercise secondary muscles" ON "public"."exercise_secondary_muscles" FOR SELECT USING (true);



CREATE POLICY "Public read gymbro exercises" ON "public"."gymbro_exercises" FOR SELECT USING (true);



CREATE POLICY "Public read muscle groups" ON "public"."muscle_groups" FOR SELECT USING (true);



CREATE POLICY "Public read targets" ON "public"."targets" FOR SELECT USING (true);



CREATE POLICY "Requester cancels pending friendship" ON "public"."friendships" FOR DELETE TO "authenticated" USING ((("requester_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("status" = 'pending'::"public"."friendship_status")));



CREATE POLICY "Trainer and gymbro view assignments" ON "public"."trainer_assignments" FOR SELECT TO "authenticated" USING ((("trainer_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("gymbro_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Trainer and gymbro view relationship" ON "public"."trainer_gymbros" FOR SELECT TO "authenticated" USING ((("trainer_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("gymbro_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Trainer creates split assignment" ON "public"."trainer_assignments" FOR INSERT TO "authenticated" WITH CHECK ((("trainer_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("status" = 'pending'::"public"."assignment_status") AND "public"."is_trainer"(( SELECT "auth"."uid"() AS "uid")) AND "public"."has_active_trainer_relationship"("trainer_id", "gymbro_id") AND "public"."owns_split"("split_id", "trainer_id")));



CREATE POLICY "Trainers request gymbro relationship" ON "public"."trainer_gymbros" FOR INSERT TO "authenticated" WITH CHECK ((("trainer_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("status" = 'pending'::"public"."trainer_gymbro_status") AND "public"."is_trainer"(( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users create own splits" ON "public"."splits" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users create own workouts" ON "public"."workouts" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users delete active workouts" ON "public"."workouts" FOR DELETE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("finished_at" IS NULL)));



CREATE POLICY "Users manage exercises in own workouts" ON "public"."workout_exercises" TO "authenticated" USING ("public"."owns_workout"("workout_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."owns_workout"("workout_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users manage own socials" ON "public"."user_socials" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users manage sets in own workouts" ON "public"."workout_sets" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workout_exercises" "we"
  WHERE (("we"."id" = "workout_sets"."workout_exercise_id") AND "public"."owns_workout"("we"."workout_id", ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workout_exercises" "we"
  WHERE (("we"."id" = "workout_sets"."workout_exercise_id") AND "public"."owns_workout"("we"."workout_id", ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users read own role" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users update active workouts" ON "public"."workouts" FOR UPDATE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("finished_at" IS NULL))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users update own profile" ON "public"."custom_users" FOR UPDATE TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users view exercises of shared routines" ON "public"."routine_exercises" FOR SELECT TO "authenticated" USING ("public"."can_view_routine"("routine_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users view own workouts" ON "public"."workouts" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users view permitted splits" ON "public"."splits" FOR SELECT TO "authenticated" USING ("public"."can_view_split"("id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users view sets of shared routines" ON "public"."routine_exercise_sets" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."routine_exercises" "re"
  WHERE (("re"."id" = "routine_exercise_sets"."routine_exercise_id") AND "public"."can_view_routine"("re"."routine_id", ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "Users view shared routines" ON "public"."routines" FOR SELECT TO "authenticated" USING ("public"."can_view_routine"("id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users view socials with profile access" ON "public"."user_socials" FOR SELECT TO "authenticated" USING ("public"."can_view_profile"("user_id", ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."equipment" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exercise_names" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exercise_secondary_muscles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."friendships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gymbro_exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."muscle_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."routine_exercise_sets" ENABLE ROW LEVEL SECURITY;


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



ALTER TABLE "public"."routine_exercises" ENABLE ROW LEVEL SECURITY;


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



ALTER TABLE "public"."routines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."splits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."targets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trainer_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trainer_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trainer_gymbros" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_socials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workout_exercises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workout_sets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workouts" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."accept_trainer_assignment"("p_assignment_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."accept_trainer_assignment"("p_assignment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_trainer_assignment"("p_assignment_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."add_routine_exercises"("p_routine_id" "uuid", "p_gymbro_exercise_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_routine_exercises"("p_routine_id" "uuid", "p_gymbro_exercise_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_routine_exercises"("p_routine_id" "uuid", "p_gymbro_exercise_ids" "uuid"[]) TO "service_role";



GRANT ALL ON TABLE "public"."trainer_applications" TO "anon";
GRANT ALL ON TABLE "public"."trainer_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."trainer_applications" TO "service_role";



REVOKE ALL ON FUNCTION "public"."apply_for_trainer"("p_message" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."apply_for_trainer"("p_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_for_trainer"("p_message" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."archive_split"("p_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."archive_split"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_split"("p_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_view_profile"("p_profile_id" "uuid", "p_viewer_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_view_profile"("p_profile_id" "uuid", "p_viewer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_profile"("p_profile_id" "uuid", "p_viewer_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_view_routine"("p_routine_id" "uuid", "p_viewer_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_view_routine"("p_routine_id" "uuid", "p_viewer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_routine"("p_routine_id" "uuid", "p_viewer_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."can_view_split"("p_split_id" "uuid", "p_viewer_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_view_split"("p_split_id" "uuid", "p_viewer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_split"("p_split_id" "uuid", "p_viewer_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."clone_split_for_user"("p_source_split_id" "uuid", "p_target_user_id" "uuid", "p_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."clone_split_for_user"("p_source_split_id" "uuid", "p_target_user_id" "uuid", "p_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_routine"("p_name" "text", "p_color" "text", "p_split_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_routine"("p_name" "text", "p_color" "text", "p_split_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_routine"("p_name" "text", "p_color" "text", "p_split_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_split"("p_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_split"("p_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_split"("p_name" "text") TO "service_role";



GRANT ALL ON TABLE "public"."trainer_assignments" TO "anon";
GRANT ALL ON TABLE "public"."trainer_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."trainer_assignments" TO "service_role";



REVOKE ALL ON FUNCTION "public"."decline_trainer_assignment"("p_assignment_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."decline_trainer_assignment"("p_assignment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decline_trainer_assignment"("p_assignment_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."delete_routine"("p_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_routine"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_routine"("p_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."delete_routine_exercise"("p_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_routine_exercise"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_routine_exercise"("p_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."duplicate_split"("p_id" "uuid", "p_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."duplicate_split"("p_id" "uuid", "p_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."duplicate_split"("p_id" "uuid", "p_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."ensure_default_split"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."ensure_default_split"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_default_split"() TO "service_role";



GRANT ALL ON TABLE "public"."workouts" TO "anon";
GRANT ALL ON TABLE "public"."workouts" TO "authenticated";
GRANT ALL ON TABLE "public"."workouts" TO "service_role";



REVOKE ALL ON FUNCTION "public"."finish_workout"("p_workout_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."finish_workout"("p_workout_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."finish_workout"("p_workout_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_exercise"("p_id" "uuid", "p_language" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_exercise"("p_id" "uuid", "p_language" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_exercise"("p_id" "uuid", "p_language" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_exercise_filters"("p_language" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_exercise_filters"("p_language" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_exercise_filters"("p_language" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_exercises"("p_language" "text", "p_category_id" "uuid", "p_equipment_id" "uuid", "p_muscle_group_id" "uuid", "p_target_id" "uuid", "p_limit" integer, "p_offset" integer, "p_search" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_exercises"("p_language" "text", "p_category_id" "uuid", "p_equipment_id" "uuid", "p_muscle_group_id" "uuid", "p_target_id" "uuid", "p_limit" integer, "p_offset" integer, "p_search" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_exercises"("p_language" "text", "p_category_id" "uuid", "p_equipment_id" "uuid", "p_muscle_group_id" "uuid", "p_target_id" "uuid", "p_limit" integer, "p_offset" integer, "p_search" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_gymbro_requests"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_gymbro_requests"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_gymbro_requests"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_gymbros"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_gymbros"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_gymbros"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_or_create_default_split"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_or_create_default_split"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_default_split"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_profile"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_profile"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_profile_routines"("p_user_id" "uuid", "p_language" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_profile_routines"("p_user_id" "uuid", "p_language" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile_routines"("p_user_id" "uuid", "p_language" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_routine_exercises"("p_routine_id" "uuid", "p_language" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_routine_exercises"("p_routine_id" "uuid", "p_language" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_routine_exercises"("p_routine_id" "uuid", "p_language" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_routines"("p_language" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_routines"("p_language" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_routines"("p_language" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_shared_routine"("p_routine_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_shared_routine"("p_routine_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shared_routine"("p_routine_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_shared_routine_exercises"("p_routine_id" "uuid", "p_language" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_shared_routine_exercises"("p_routine_id" "uuid", "p_language" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shared_routine_exercises"("p_routine_id" "uuid", "p_language" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_splits"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_splits"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_splits"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_workout_exercises"("p_workout_id" "uuid", "p_language" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_workout_exercises"("p_workout_id" "uuid", "p_language" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_workout_exercises"("p_workout_id" "uuid", "p_language" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."gymbro_relation"("p_viewer" "uuid", "p_other" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."gymbro_relation"("p_viewer" "uuid", "p_other" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."has_active_trainer_relationship"("p_trainer_id" "uuid", "p_gymbro_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_active_trainer_relationship"("p_trainer_id" "uuid", "p_gymbro_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_active_trainer_relationship"("p_trainer_id" "uuid", "p_gymbro_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."import_routine"("p_source_routine_id" "uuid", "p_target_split_id" "uuid", "p_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."import_routine"("p_source_routine_id" "uuid", "p_target_split_id" "uuid", "p_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."import_routine"("p_source_routine_id" "uuid", "p_target_split_id" "uuid", "p_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."import_split"("p_source_split_id" "uuid", "p_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."import_split"("p_source_split_id" "uuid", "p_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."import_split"("p_source_split_id" "uuid", "p_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_gymbro"("p_user_a" "uuid", "p_user_b" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_gymbro"("p_user_a" "uuid", "p_user_b" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_gymbro"("p_user_a" "uuid", "p_user_b" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_trainer"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_trainer"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_trainer"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."move_routine_to_split"("p_routine_id" "uuid", "p_split_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."move_routine_to_split"("p_routine_id" "uuid", "p_split_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."move_routine_to_split"("p_routine_id" "uuid", "p_split_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."owns_routine"("p_routine_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."owns_routine"("p_routine_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owns_routine"("p_routine_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."owns_split"("p_split_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."owns_split"("p_split_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owns_split"("p_split_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."owns_workout"("p_workout_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."owns_workout"("p_workout_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owns_workout"("p_workout_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_finished_workout_exercise_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_finished_workout_exercise_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_finished_workout_exercise_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_finished_workout_set_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_finished_workout_set_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_finished_workout_set_changes"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."remove_gymbro"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remove_gymbro"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_gymbro"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."rename_split"("p_id" "uuid", "p_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rename_split"("p_id" "uuid", "p_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rename_split"("p_id" "uuid", "p_name" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."reorder_routine_exercises"("p_routine_id" "uuid", "p_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reorder_routine_exercises"("p_routine_id" "uuid", "p_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reorder_routine_exercises"("p_routine_id" "uuid", "p_ids" "uuid"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."replace_routine_exercise_sets"("p_routine_exercise_id" "uuid", "p_sets" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."replace_routine_exercise_sets"("p_routine_exercise_id" "uuid", "p_sets" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."replace_routine_exercise_sets"("p_routine_exercise_id" "uuid", "p_sets" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."friendships" TO "anon";
GRANT ALL ON TABLE "public"."friendships" TO "authenticated";
GRANT ALL ON TABLE "public"."friendships" TO "service_role";



REVOKE ALL ON FUNCTION "public"."respond_to_friendship"("p_friendship_id" "uuid", "p_status" "public"."friendship_status") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."respond_to_friendship"("p_friendship_id" "uuid", "p_status" "public"."friendship_status") TO "authenticated";
GRANT ALL ON FUNCTION "public"."respond_to_friendship"("p_friendship_id" "uuid", "p_status" "public"."friendship_status") TO "service_role";



GRANT ALL ON TABLE "public"."trainer_gymbros" TO "anon";
GRANT ALL ON TABLE "public"."trainer_gymbros" TO "authenticated";
GRANT ALL ON TABLE "public"."trainer_gymbros" TO "service_role";



REVOKE ALL ON FUNCTION "public"."respond_to_trainer_request"("p_relationship_id" "uuid", "p_status" "public"."trainer_gymbro_status") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."respond_to_trainer_request"("p_relationship_id" "uuid", "p_status" "public"."trainer_gymbro_status") TO "authenticated";
GRANT ALL ON FUNCTION "public"."respond_to_trainer_request"("p_relationship_id" "uuid", "p_status" "public"."trainer_gymbro_status") TO "service_role";



REVOKE ALL ON FUNCTION "public"."review_trainer_application"("p_application_id" "uuid", "p_approve" boolean, "p_response_message" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."review_trainer_application"("p_application_id" "uuid", "p_approve" boolean, "p_response_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."review_trainer_application"("p_application_id" "uuid", "p_approve" boolean, "p_response_message" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."revoke_trainer_assignment"("p_assignment_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."revoke_trainer_assignment"("p_assignment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_trainer_assignment"("p_assignment_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."search_profiles"("p_query" "text", "p_limit" integer, "p_offset" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."search_profiles"("p_query" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_profiles"("p_query" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."send_gymbro_request"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."send_gymbro_request"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_gymbro_request"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_active_split"("p_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_active_split"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_active_split"("p_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_split_privacy"("p_id" "uuid", "p_privacy" "public"."profile_privacy") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_split_privacy"("p_id" "uuid", "p_privacy" "public"."profile_privacy") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_split_privacy"("p_id" "uuid", "p_privacy" "public"."profile_privacy") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."start_workout"("p_routine_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."start_workout"("p_routine_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_workout"("p_routine_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_routine"("p_id" "uuid", "p_name" "text", "p_color" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_routine"("p_id" "uuid", "p_name" "text", "p_color" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_routine"("p_id" "uuid", "p_name" "text", "p_color" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_workout_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_workout_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_workout_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_workout_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_workout_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_workout_update"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."withdraw_trainer_application"("p_application_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."withdraw_trainer_application"("p_application_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."withdraw_trainer_application"("p_application_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."custom_users" TO "anon";
GRANT ALL ON TABLE "public"."custom_users" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_users" TO "service_role";



GRANT ALL ON TABLE "public"."equipment" TO "anon";
GRANT ALL ON TABLE "public"."equipment" TO "authenticated";
GRANT ALL ON TABLE "public"."equipment" TO "service_role";



GRANT ALL ON TABLE "public"."exercise_names" TO "anon";
GRANT ALL ON TABLE "public"."exercise_names" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise_names" TO "service_role";



GRANT ALL ON TABLE "public"."exercise_secondary_muscles" TO "anon";
GRANT ALL ON TABLE "public"."exercise_secondary_muscles" TO "authenticated";
GRANT ALL ON TABLE "public"."exercise_secondary_muscles" TO "service_role";



GRANT ALL ON TABLE "public"."exercises" TO "anon";
GRANT ALL ON TABLE "public"."exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."exercises" TO "service_role";



GRANT ALL ON TABLE "public"."gymbro_exercises" TO "anon";
GRANT ALL ON TABLE "public"."gymbro_exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."gymbro_exercises" TO "service_role";



GRANT ALL ON TABLE "public"."muscle_groups" TO "anon";
GRANT ALL ON TABLE "public"."muscle_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."muscle_groups" TO "service_role";



GRANT ALL ON TABLE "public"."routine_exercise_sets" TO "anon";
GRANT ALL ON TABLE "public"."routine_exercise_sets" TO "authenticated";
GRANT ALL ON TABLE "public"."routine_exercise_sets" TO "service_role";



GRANT ALL ON TABLE "public"."routine_exercises" TO "anon";
GRANT ALL ON TABLE "public"."routine_exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."routine_exercises" TO "service_role";



GRANT ALL ON TABLE "public"."routines" TO "anon";
GRANT ALL ON TABLE "public"."routines" TO "authenticated";
GRANT ALL ON TABLE "public"."routines" TO "service_role";



GRANT ALL ON TABLE "public"."splits" TO "anon";
GRANT ALL ON TABLE "public"."splits" TO "authenticated";
GRANT ALL ON TABLE "public"."splits" TO "service_role";



GRANT ALL ON TABLE "public"."targets" TO "anon";
GRANT ALL ON TABLE "public"."targets" TO "authenticated";
GRANT ALL ON TABLE "public"."targets" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_socials" TO "anon";
GRANT ALL ON TABLE "public"."user_socials" TO "authenticated";
GRANT ALL ON TABLE "public"."user_socials" TO "service_role";



GRANT ALL ON TABLE "public"."workout_exercises" TO "anon";
GRANT ALL ON TABLE "public"."workout_exercises" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_exercises" TO "service_role";



GRANT ALL ON TABLE "public"."workout_sets" TO "anon";
GRANT ALL ON TABLE "public"."workout_sets" TO "authenticated";
GRANT ALL ON TABLE "public"."workout_sets" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";




































-- Not part of the `public` dump: creates the profile row when someone signs up.
CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();
