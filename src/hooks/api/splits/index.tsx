import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { useRoutines } from "@/hooks/api/routines";
import {
  archiveSplit,
  createSplit,
  duplicateSplit,
  getSplits,
  moveRoutineToSplit,
  renameSplit,
  setActiveSplit,
  setSplitPrivacy,
  type Split,
  type SplitPrivacy,
} from "./queries";
import type { Language } from "@/i18n";

const SPLITS_KEY = ["splits"] as const;

export const useSplits = () =>
  useQuery({
    queryKey: SPLITS_KEY,
    queryFn: getSplits,
  });

/** The split the user is working in, or undefined while it loads. */
export const useActiveSplit = () => {
  const query = useSplits();
  const activeSplit = query.data?.find((split) => split.is_active);
  return { ...query, activeSplit };
};

/**
 * Routines of the active split. `useRoutines` still returns every routine,
 * because a workout in progress can belong to another split.
 */
export const useActiveSplitRoutines = (language: Language) => {
  const routines = useRoutines(language);
  const splits = useActiveSplit();

  const data = useMemo(() => {
    if (splits.activeSplit) {
      return routines.data?.filter(
        (routine) => routine.split_id === splits.activeSplit?.id
      );
    }
    // Without splits to filter by, show everything rather than nothing.
    return splits.isError ? routines.data : undefined;
  }, [routines.data, splits.activeSplit, splits.isError]);

  return {
    ...routines,
    data,
    isLoading: routines.isLoading || splits.isLoading,
  };
};

/** Splits and their routines depend on each other. */
const useInvalidateSplits = () => {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: SPLITS_KEY }),
      qc.invalidateQueries({ queryKey: ["routines"] }),
    ]);
};

export const useCreateSplit = () => {
  const invalidate = useInvalidateSplits();
  return useMutation({
    mutationFn: (name: string) => createSplit(name),
    onSuccess: invalidate,
  });
};

export const useRenameSplit = () => {
  const invalidate = useInvalidateSplits();
  return useMutation({
    mutationFn: (input: { id: string; name: string }) =>
      renameSplit(input.id, input.name),
    onSuccess: invalidate,
  });
};

/** The new split shows right away and is rolled back if saving fails. */
export const useSetActiveSplit = () => {
  const qc = useQueryClient();
  const invalidate = useInvalidateSplits();

  return useMutation({
    mutationFn: (id: string) => setActiveSplit(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: SPLITS_KEY });
      const previous = qc.getQueryData<Split[]>(SPLITS_KEY);
      qc.setQueryData<Split[]>(SPLITS_KEY, (data) =>
        data?.map((split) => ({ ...split, is_active: split.id === id }))
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) qc.setQueryData(SPLITS_KEY, context.previous);
    },
    onSettled: invalidate,
  });
};

/** The new level shows right away and is rolled back if saving fails. */
export const useSetSplitPrivacy = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; privacy: SplitPrivacy }) =>
      setSplitPrivacy(input.id, input.privacy),
    onMutate: async ({ id, privacy }) => {
      await qc.cancelQueries({ queryKey: SPLITS_KEY });
      const previous = qc.getQueryData<Split[]>(SPLITS_KEY);
      qc.setQueryData<Split[]>(SPLITS_KEY, (data) =>
        data?.map((split) => (split.id === id ? { ...split, privacy } : split))
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) qc.setQueryData(SPLITS_KEY, context.previous);
    },
  });
};

export const useArchiveSplit = () => {
  const qc = useQueryClient();
  const invalidate = useInvalidateSplits();

  return useMutation({
    mutationFn: (id: string) => archiveSplit(id),
    // Archiving also discards workouts in progress for the split's routines.
    onSuccess: () =>
      Promise.all([
        invalidate(),
        qc.invalidateQueries({ queryKey: ["activeWorkout"] }),
      ]),
  });
};

export const useDuplicateSplit = () => {
  const invalidate = useInvalidateSplits();
  return useMutation({
    mutationFn: (input: { id: string; name: string }) =>
      duplicateSplit(input.id, input.name),
    onSuccess: invalidate,
  });
};

export const useMoveRoutine = () => {
  const invalidate = useInvalidateSplits();
  return useMutation({
    mutationFn: (input: { routineId: string; splitId: string }) =>
      moveRoutineToSplit(input.routineId, input.splitId),
    onSuccess: invalidate,
  });
};
