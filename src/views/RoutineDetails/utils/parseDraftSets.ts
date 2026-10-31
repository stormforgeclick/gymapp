import type { SetInput } from "@/hooks/api/routineExercises/queries";
import { parseNumber } from "@/lib/numbers";

/** A row of the set editor, as typed. */
export type DraftSet = {
  id?: string;
  reps: string;
  weight: string;
};

export type ParsedDraftSets =
  | { sets: SetInput[] }
  | { error: "reps" | "weight" };

/**
 * Reads the editor's rows into sets to save, or says which field of the first
 * wrong row is at fault. Reps must be a whole number above zero; an empty
 * weight means no weight.
 */
export function parseDraftSets(draft: DraftSet[]): ParsedDraftSets {
  const sets: SetInput[] = [];

  for (const row of draft) {
    const reps = parseNumber(row.reps, { integer: true });
    // Empty, invalid and zero all fail here.
    if (!reps) return { error: "reps" };

    const weight = parseNumber(row.weight);
    if (weight === undefined) return { error: "weight" };

    sets.push({ id: row.id, min_reps: reps, max_reps: reps, weight });
  }

  return { sets };
}
