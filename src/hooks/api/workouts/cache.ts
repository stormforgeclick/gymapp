import type {
  WorkoutExercise,
  WorkoutSet,
  WorkoutSetPatch,
} from "./queries";

/**
 * Pure edits to the cached exercises of a workout. The mutation hooks use them
 * to show a change before the server confirms it.
 */

export const applySetPatch = (
  exercises: WorkoutExercise[],
  setId: string,
  patch: WorkoutSetPatch
): WorkoutExercise[] =>
  exercises.map((exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) =>
      set.id === setId ? { ...set, ...patch } : set
    ),
  }));

export const removeSet = (
  exercises: WorkoutExercise[],
  setId: string
): WorkoutExercise[] =>
  exercises.map((exercise) => ({
    ...exercise,
    sets: exercise.sets.filter((set) => set.id !== setId),
  }));

/**
 * Where a deleted set goes when the delete is undone: back to its own position
 * if that is still free (the planned reps are looked up by position), after the
 * last set otherwise, since the database allows one set per position.
 */
export const restoredPosition = (remaining: WorkoutSet[], deleted: WorkoutSet) =>
  remaining.some((set) => set.position === deleted.position)
    ? Math.max(...remaining.map((set) => set.position)) + 1
    : deleted.position;

export const appendSet = (
  exercises: WorkoutExercise[],
  workoutExerciseId: string,
  created: WorkoutSet
): WorkoutExercise[] =>
  exercises.map((exercise) =>
    exercise.id === workoutExerciseId
      ? { ...exercise, sets: [...exercise.sets, created] }
      : exercise
  );
