import type { Routine } from "@/hooks/api/routines/queries";
import type { FinishedWorkout } from "@/hooks/api/workouts/queries";

/**
 * Picks the routine that is due: among routines that have exercises, one that
 * has never been done (the first in list order), otherwise the one finished
 * longest ago. Returns null when nothing can be started.
 *
 * `finished` must be ordered newest first, so the first hit per routine is
 * its last workout. A routine missing from a truncated history is simply the
 * stalest one, which is what this ranking wants anyway.
 */
export function suggestRoutine(
  routines: Routine[],
  finished: FinishedWorkout[]
): Routine | null {
  const lastDone = new Map<string, number>();
  for (const workout of finished) {
    if (workout.routine_id && !lastDone.has(workout.routine_id)) {
      lastDone.set(workout.routine_id, new Date(workout.finished_at).getTime());
    }
  }

  let best: Routine | null = null;
  let bestTime = Infinity;

  for (const routine of routines) {
    if (routine.quantity === 0) continue;

    const time = lastDone.get(routine.id) ?? -Infinity;
    // Strict comparison keeps the first routine in list order on ties.
    if (best === null || time < bestTime) {
      best = routine;
      bestTime = time;
    }
  }

  return best;
}
