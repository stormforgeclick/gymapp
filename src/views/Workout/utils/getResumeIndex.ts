import type { WorkoutExercise } from "@/hooks/api/workouts/queries";

const isPending = (exercise: WorkoutExercise) =>
  exercise.sets.some((set) => !set.completed);

/**
 * Exercise to show when a workout is opened: the first one with pending sets
 * from the last exercise the user worked on. Exercises skipped earlier come
 * after that, and a fully completed workout lands on the last exercise so the
 * bottom button reads "Finish".
 */
export const getResumeIndex = (exercises: WorkoutExercise[]): number => {
  const lastTouched = exercises.findLastIndex((exercise) =>
    exercise.sets.some((set) => set.completed)
  );

  const ahead = exercises.findIndex(
    (exercise, i) => i >= lastTouched && isPending(exercise)
  );
  if (ahead !== -1) return ahead;

  const skipped = exercises.findIndex(isPending);
  return skipped !== -1 ? skipped : Math.max(exercises.length - 1, 0);
};
