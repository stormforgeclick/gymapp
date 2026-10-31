import type { RoutineExercise } from "./queries";

/**
 * The exercises in the order of `orderedIds`, numbered from 1. An id that
 * isn't in the list is skipped, and so is an exercise that isn't in the ids.
 */
export const reorderByIds = (
  exercises: RoutineExercise[],
  orderedIds: string[]
): RoutineExercise[] => {
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  return orderedIds
    .flatMap((id) => byId.get(id) ?? [])
    .map((exercise, index) => ({ ...exercise, position: index + 1 }));
};
