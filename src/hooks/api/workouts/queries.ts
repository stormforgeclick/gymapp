import { supabase } from "@/lib/supabase";
import type { Language } from "@/i18n";

export type WorkoutSet = {
  id: string;
  position: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
  /** Planned reps from the routine; null for sets added during the workout. */
  target_min_reps: number | null;
  target_max_reps: number | null;
};

export type WorkoutExercise = {
  id: string;
  gymbro_exercise_id: string;
  position: number;
  name: string;
  /** Static thumbnail. */
  image: string | null;
  /** Animated demonstration. */
  gif_url: string | null;
  muscle_group: string | null;
  equipment: string | null;
  sets: WorkoutSet[];
};

export type ActiveWorkout = {
  id: string;
  routine_id: string | null;
  started_at: string;
};

export type FinishedWorkout = {
  routine_id: string | null;
  finished_at: string;
};

export type WorkoutSetPatch = Partial<
  Pick<WorkoutSet, "weight" | "reps" | "completed">
>;

export async function getActiveWorkout(): Promise<ActiveWorkout | null> {
  const { data, error } = await supabase
    .from("workouts")
    .select("id, routine_id, started_at")
    .is("finished_at", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Most recent finished workouts first; enough history to rank routines by staleness. */
export async function getLastWorkouts(limit = 100): Promise<FinishedWorkout[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("routine_id, finished_at")
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getWorkoutExercises(
  workoutId: string,
  language: Language = "es"
): Promise<WorkoutExercise[]> {
  const { data, error } = await supabase.rpc("get_workout_exercises", {
    p_workout_id: workoutId,
    p_language: language,
  });
  if (error) throw error;
  return (data ?? []) as WorkoutExercise[];
}

export async function startWorkout(routineId: string): Promise<string> {
  const { data, error } = await supabase.rpc("start_workout", {
    p_routine_id: routineId,
  });
  if (error) throw error;
  return data as string;
}

export async function finishWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase.rpc("finish_workout", {
    p_workout_id: workoutId,
  });
  if (error) throw error;
}

export async function discardWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId);
  if (error) throw error;
}

export async function updateWorkoutSet(
  setId: string,
  patch: WorkoutSetPatch
): Promise<void> {
  const { error } = await supabase
    .from("workout_sets")
    .update(patch)
    .eq("id", setId);
  if (error) throw error;
}

export async function addWorkoutSet(input: {
  workoutExerciseId: string;
  position: number;
  weight: number | null;
  reps: number | null;
}): Promise<WorkoutSet> {
  const { data, error } = await supabase
    .from("workout_sets")
    .insert({
      workout_exercise_id: input.workoutExerciseId,
      position: input.position,
      weight: input.weight,
      reps: input.reps,
      completed: false,
    })
    .select("id, position, weight, reps, completed")
    .single();
  if (error) throw error;
  return { ...data, target_min_reps: null, target_max_reps: null } as WorkoutSet;
}

export async function deleteWorkoutSet(setId: string): Promise<void> {
  const { error } = await supabase
    .from("workout_sets")
    .delete()
    .eq("id", setId);
  if (error) throw error;
}
