import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createRoutine,
  deleteRoutine,
  getRoutineSharing,
  getRoutines,
  setRoutinePrivacy,
  updateRoutine,
  type CreateRoutineInput,
  type RoutinePrivacy,
  type RoutineSharing,
  type UpdateRoutineInput,
} from "./queries";

type Language = "en" | "es";

const SHARING_KEY = ["routineSharing"] as const;

export const useRoutines = (language: Language = "es") =>
  useQuery({
    queryKey: ["routines", language],
    queryFn: () => getRoutines(language),
  });

/** The user's routines with who can see each one. */
export const useRoutineSharing = () =>
  useQuery({
    queryKey: SHARING_KEY,
    queryFn: getRoutineSharing,
  });

/** Changing the list of routines changes what can be shared, too. */
const useInvalidateRoutines = () => {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["routines"] }),
      qc.invalidateQueries({ queryKey: SHARING_KEY }),
    ]);
};

export const useCreateRoutine = () => {
  const invalidate = useInvalidateRoutines();
  return useMutation({
    mutationFn: (input: CreateRoutineInput) => createRoutine(input),
    onSuccess: invalidate,
  });
};

export const useUpdateRoutine = () => {
  const invalidate = useInvalidateRoutines();
  return useMutation({
    mutationFn: (input: UpdateRoutineInput) => updateRoutine(input),
    onSuccess: invalidate,
  });
};

export const useDeleteRoutine = () => {
  const qc = useQueryClient();
  const invalidate = useInvalidateRoutines();
  return useMutation({
    mutationFn: (id: string) => deleteRoutine(id),
    // Deleting also discards the routine's workout in progress.
    onSuccess: () =>
      Promise.all([
        invalidate(),
        qc.invalidateQueries({ queryKey: ["activeWorkout"] }),
      ]),
  });
};

/** The new level shows right away and is rolled back if saving fails. */
export const useSetRoutinePrivacy = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; privacy: RoutinePrivacy }) =>
      setRoutinePrivacy(input.id, input.privacy),
    onMutate: async ({ id, privacy }) => {
      await qc.cancelQueries({ queryKey: SHARING_KEY });
      const previous = qc.getQueryData<RoutineSharing[]>(SHARING_KEY);
      qc.setQueryData<RoutineSharing[]>(SHARING_KEY, (data) =>
        data?.map((routine) =>
          routine.id === id ? { ...routine, privacy } : routine
        )
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) qc.setQueryData(SHARING_KEY, context.previous);
    },
  });
};
