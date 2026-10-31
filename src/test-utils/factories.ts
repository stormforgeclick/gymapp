import type { RoutineExercise } from "@/hooks/api/routineExercises/queries";
import type { WorkoutExercise, WorkoutSet } from "@/hooks/api/workouts/queries";

export const makeSet = (overrides: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: "set-1",
  position: 1,
  weight: null,
  reps: null,
  completed: false,
  target_min_reps: 8,
  target_max_reps: 12,
  ...overrides,
});

export const makeWorkoutExercise = (
  overrides: Partial<WorkoutExercise> = {}
): WorkoutExercise => ({
  id: "we-1",
  gymbro_exercise_id: "ge-1",
  position: 1,
  name: "Exercise",
  image: null,
  gif_url: null,
  muscle_group: null,
  equipment: null,
  sets: [],
  ...overrides,
});

export const makeRoutineExercise = (
  overrides: Partial<RoutineExercise> = {}
): RoutineExercise => ({
  id: "re-1",
  gymbro_exercise_id: "ge-1",
  position: 1,
  name: "Exercise",
  image: null,
  muscle_group: null,
  sets: [],
  ...overrides,
});
