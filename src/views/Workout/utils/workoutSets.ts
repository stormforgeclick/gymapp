import type { WorkoutExercise } from "@/hooks/api/workouts/queries";

/** Completed and total sets across the whole workout. */
export const countSets = (exercises: WorkoutExercise[]) => {
  const sets = exercises.flatMap((exercise) => exercise.sets);
  return { done: sets.filter((set) => set.completed).length, total: sets.length };
};

/**
 * What a new set of the exercise starts with: it follows the last set, using
 * the planned reps when that one has none.
 */
export const nextSetDefaults = (exercise: WorkoutExercise) => {
  const last = exercise.sets[exercise.sets.length - 1];
  return {
    position: Math.max(0, ...exercise.sets.map((set) => set.position)) + 1,
    weight: last?.weight ?? null,
    reps: last?.reps ?? last?.target_min_reps ?? null,
  };
};
