import type { SetInput } from "@/hooks/api/routineExercises/queries";

export const defaultDraftSet = (): SetInput => ({
  min_reps: 8,
  max_reps: 12,
  weight: null,
});
