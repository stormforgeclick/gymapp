import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addRoutineExercises,
  deleteRoutineExercise,
  getRoutineExercises,
  replaceRoutineExerciseSets,
  type SetInput,
} from "./queries";

type Language = "en" | "es";

export const useRoutineExercises = (routineId: string, language: Language = "es") =>
  useQuery({
    queryKey: ["routineExercises", routineId, language],
    queryFn: () => getRoutineExercises(routineId, language),
    enabled: !!routineId,
  });

export const useAddRoutineExercises = (routineId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => addRoutineExercises(routineId, ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routineExercises", routineId] });
      qc.invalidateQueries({ queryKey: ["routines"] });
    },
  });
};

export const useDeleteRoutineExercise = (routineId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRoutineExercise(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routineExercises", routineId] });
      qc.invalidateQueries({ queryKey: ["routines"] });
    },
  });
};

export const useAddRoutineExercise = (routineId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (gymbroExerciseId: string) => {
      const ids = await addRoutineExercises(routineId, [gymbroExerciseId]);
      if (!ids[0]) throw new Error("No se pudo crear el ejercicio");
      return ids[0];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routineExercises", routineId] });
      qc.invalidateQueries({ queryKey: ["routines"] });
    },
  });
};

export const useReplaceRoutineExerciseSets = (routineId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      routineExerciseId,
      sets,
    }: {
      routineExerciseId: string;
      sets: SetInput[];
    }) => replaceRoutineExerciseSets(routineExerciseId, sets),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["routineExercises", routineId] }),
  });
};
