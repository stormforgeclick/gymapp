import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appendSet, applySetPatch, removeSet } from "./cache";
import {
  addWorkoutSet,
  deleteWorkoutSet,
  discardWorkout,
  finishWorkout,
  getActiveWorkout,
  getLastWorkouts,
  getWorkoutExercises,
  startWorkout,
  updateWorkoutSet,
  type WorkoutExercise,
  type WorkoutSet,
  type WorkoutSetPatch,
} from "./queries";
import type { Language } from "@/i18n";

const workoutKey = (workoutId: string, language: Language) =>
  ["workoutExercises", workoutId, language] as const;

export const useActiveWorkout = () =>
  useQuery({
    queryKey: ["activeWorkout"],
    queryFn: getActiveWorkout,
  });

export const useLastWorkouts = () =>
  useQuery({
    queryKey: ["lastWorkouts"],
    queryFn: () => getLastWorkouts(),
  });

export const useWorkoutExercises = (
  workoutId: string,
  language: Language = "es"
) =>
  useQuery({
    queryKey: workoutKey(workoutId, language),
    queryFn: () => getWorkoutExercises(workoutId, language),
    enabled: !!workoutId,
  });

export const useStartWorkout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routineId: string) => startWorkout(routineId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["activeWorkout"] }),
  });
};

export const useFinishWorkout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workoutId: string) => finishWorkout(workoutId),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["activeWorkout"] }),
        qc.invalidateQueries({ queryKey: ["lastWorkouts"] }),
      ]),
  });
};

export const useDiscardWorkout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workoutId: string) => discardWorkout(workoutId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["activeWorkout"] }),
  });
};

/**
 * Edits to a set are applied to the cache first so the table feels instant;
 * if the save fails the previous data is restored.
 */
export const useUpdateWorkoutSet = (workoutId: string, language: Language) => {
  const qc = useQueryClient();
  const key = workoutKey(workoutId, language);

  return useMutation({
    mutationFn: ({ setId, patch }: { setId: string; patch: WorkoutSetPatch }) =>
      updateWorkoutSet(setId, patch),
    onMutate: async ({ setId, patch }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<WorkoutExercise[]>(key);
      qc.setQueryData<WorkoutExercise[]>(
        key,
        (data) => data && applySetPatch(data, setId, patch)
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
  });
};

export const useAddWorkoutSet = (workoutId: string, language: Language) => {
  const qc = useQueryClient();
  const key = workoutKey(workoutId, language);

  return useMutation({
    mutationFn: addWorkoutSet,
    onSuccess: (created: WorkoutSet, { workoutExerciseId }) => {
      qc.setQueryData<WorkoutExercise[]>(
        key,
        (data) => data && appendSet(data, workoutExerciseId, created)
      );
    },
  });
};

export const useDeleteWorkoutSet = (workoutId: string, language: Language) => {
  const qc = useQueryClient();
  const key = workoutKey(workoutId, language);

  return useMutation({
    mutationFn: (setId: string) => deleteWorkoutSet(setId),
    onMutate: async (setId) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<WorkoutExercise[]>(key);
      qc.setQueryData<WorkoutExercise[]>(
        key,
        (data) => data && removeSet(data, setId)
      );
      return { previous };
    },
    onError: (_error, _setId, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
  });
};
