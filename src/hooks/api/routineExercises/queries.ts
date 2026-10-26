import { supabase } from "@/lib/supabase";

type Language = "en" | "es";

export type RoutineExerciseSet = {
  id?: string;
  position: number;
  min_reps: number;
  max_reps: number;
  weight: number | null;
};

export type RoutineExercise = {
  id: string;
  gymbro_exercise_id: string;
  position: number;
  name: string;
  image: string | null;
  muscle_group: string | null;
  sets: RoutineExerciseSet[];
};

export type SetInput = {
  id?: string;
  min_reps: number;
  max_reps: number;
  weight: number | null;
};

export async function getRoutineExercises(
  routineId: string,
  language: Language = "es"
): Promise<RoutineExercise[]> {
  const { data, error } = await supabase.rpc("get_routine_exercises", {
    p_routine_id: routineId,
    p_language: language,
  });
  if (error) throw error;
  return (data ?? []) as RoutineExercise[];
}

export async function addRoutineExercises(
  routineId: string,
  gymbroExerciseIds: string[]
): Promise<string[]> {
  const { data, error } = await supabase.rpc("add_routine_exercises", {
    p_routine_id: routineId,
    p_gymbro_exercise_ids: gymbroExerciseIds,
  });
  if (error) throw error;
  return (data ?? []) as string[];
}

export async function deleteRoutineExercise(id: string): Promise<string> {
  const { data, error } = await supabase.rpc("delete_routine_exercise", {
    p_id: id,
  });
  if (error) throw error;
  return data as string;
}

export async function replaceRoutineExerciseSets(
  routineExerciseId: string,
  sets: SetInput[]
): Promise<RoutineExerciseSet[]> {
  const { data, error } = await supabase.rpc("replace_routine_exercise_sets", {
    p_routine_exercise_id: routineExerciseId,
    p_sets: sets,
  });
  if (error) throw error;
  return (data ?? []) as RoutineExerciseSet[];
}
