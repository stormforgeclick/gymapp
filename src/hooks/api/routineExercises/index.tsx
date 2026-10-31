import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reorderByIds } from "./cache";
import {
  addRoutineExercises,
  deleteRoutineExercise,
  getRoutineExercises,
  reorderRoutineExercises,
  replaceRoutineExerciseSets,
  type RoutineExercise,
  type SetInput,
} from "./queries";
import type { Language } from "@/i18n";

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
      if (!ids[0]) throw new Error("add_routine_exercises returned no id");
      return ids[0];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["routineExercises", routineId] });
      qc.invalidateQueries({ queryKey: ["routines"] });
    },
  });
};

/**
 * The new order shows right away and is rolled back if saving fails. The list
 * is only refetched once the last pending reorder is done, so a quick second
 * drag isn't undone by the answer to the first.
 */
export const useReorderRoutineExercises = (
  routineId: string,
  language: Language
) => {
  const qc = useQueryClient();
  const key = ["routineExercises", routineId, language] as const;
  const mutationKey = ["reorderRoutineExercises", routineId] as const;

  return useMutation({
    mutationKey,
    mutationFn: (orderedIds: string[]) =>
      reorderRoutineExercises(routineId, orderedIds),
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<RoutineExercise[]>(key);
      qc.setQueryData<RoutineExercise[]>(
        key,
        (data) => data && reorderByIds(data, orderedIds)
      );
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSettled: () => {
      if (qc.isMutating({ mutationKey }) <= 1) {
        qc.invalidateQueries({ queryKey: ["routineExercises", routineId] });
      }
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
