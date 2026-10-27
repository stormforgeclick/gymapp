import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { useRoutines } from "@/hooks/api/routines";
import { useActiveWorkout, useLastWorkouts } from "@/hooks/api/workouts";
import { useT } from "@/i18n";
import { suggestRoutine } from "@/lib/suggestRoutine";
import { useAuth } from "@/providers/AuthProvider";

/** Routine color that drives the app's accent, or null for the default one. */
const AccentContext = createContext<string | null>(null);

export const useAccent = () => useContext(AccentContext);

/**
 * Works out the accent from the "routine of the day": the one with an
 * unfinished workout or, failing that, the one Home suggests. Renders nothing;
 * it only reports the color upward.
 */
function AccentSource({ onChange }: { onChange: (color: string | null) => void }) {
  const { language } = useT();
  const { data: routines } = useRoutines(language);
  const { data: activeWorkout } = useActiveWorkout();
  const { data: finishedWorkouts } = useLastWorkouts();

  // Wait for all three so the color doesn't settle on a suggestion and then
  // jump to the active workout's routine.
  const ready =
    routines !== undefined &&
    activeWorkout !== undefined &&
    finishedWorkouts !== undefined;

  let color: string | null = null;
  if (ready) {
    color = activeWorkout
      ? (routines.find((routine) => routine.id === activeWorkout.routine_id)
          ?.color ?? null)
      : (suggestRoutine(routines, finishedWorkouts)?.color ?? null);
  }

  useEffect(() => onChange(color), [color, onChange]);

  return null;
}

export function AccentProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (!session) setColor(null);
  }, [session]);

  return (
    <AccentContext.Provider value={session ? color : null}>
      {children}
      {/* A sibling, not a wrapper, so signing in or out doesn't remount the app. */}
      {session && <AccentSource onChange={setColor} />}
    </AccentContext.Provider>
  );
}
