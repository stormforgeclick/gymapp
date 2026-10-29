import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createRoutine,
  deleteRoutine,
  getRoutines,
  updateRoutine,
  type CreateRoutineInput,
  type UpdateRoutineInput,
} from "./queries";

type Language = "en" | "es";

export const useRoutines = (language: Language = "es") =>
  useQuery({
    queryKey: ["routines", language],
    queryFn: () => getRoutines(language),
  });

export const useCreateRoutine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRoutineInput) => createRoutine(input),
    // A split's routine count comes with the list of splits.
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["routines"] }),
        qc.invalidateQueries({ queryKey: ["splits"] }),
      ]),
  });
};

export const useUpdateRoutine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateRoutineInput) => updateRoutine(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["routines"] }),
  });
};

export const useDeleteRoutine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRoutine(id),
    // Deleting also discards the routine's workout in progress.
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["routines"] }),
        qc.invalidateQueries({ queryKey: ["splits"] }),
        qc.invalidateQueries({ queryKey: ["activeWorkout"] }),
      ]),
  });
};
