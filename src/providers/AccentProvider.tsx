import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { useRoutines } from "@/hooks/api/routines";
import { useActiveSplitRoutines } from "@/hooks/api/splits";
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
  // A workout in progress may belong to another split, so it is looked up
  // among every routine; the suggestion only considers the active split.
  const { data: routines } = useRoutines(language);
  const { data: activeSplitRoutines } = useActiveSplitRoutines(language);
  const { data: activeWorkout } = useActiveWorkout();
  const { data: finishedWorkouts } = useLastWorkouts();

  // Wait for all of them so the color doesn't settle on a suggestion and then
  // jump to the active workout's routine.
  const ready =
    routines !== undefined &&
    activeSplitRoutines !== undefined &&
    activeWorkout !== undefined &&
    finishedWorkouts !== undefined;

  let color: string | null = null;
  if (ready) {
    color = activeWorkout
      ? (routines.find((routine) => routine.id === activeWorkout.routine_id)
          ?.color ?? null)
      : (suggestRoutine(activeSplitRoutines, finishedWorkouts)?.color ?? null);
  }

  useEffect(() => onChange(color), [color, onChange]);

  return null;
}

export function AccentProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [color, setColor] = useState<string | null>(null);

  // Signing out clears the color, so the next account never sees the last one's.
  const signedIn = !!session;
  const [wasSignedIn, setWasSignedIn] = useState(signedIn);
  if (wasSignedIn !== signedIn) {
    setWasSignedIn(signedIn);
    if (!signedIn) setColor(null);
  }

  return (
    <AccentContext.Provider value={session ? color : null}>
      {children}
      {/* A sibling, not a wrapper, so signing in or out doesn't remount the app. */}
      {session && <AccentSource onChange={setColor} />}
    </AccentContext.Provider>
  );
}
