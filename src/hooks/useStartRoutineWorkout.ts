import { useRouter } from "expo-router";

import { useRoutines } from "@/hooks/api/routines";
import {
  useActiveWorkout,
  useDiscardWorkout,
  useStartWorkout,
} from "@/hooks/api/workouts";
import { useT } from "@/i18n";
import { errorKind } from "@/lib/errors";
import { useDialog } from "@/providers/DialogProvider";
import { useToast } from "@/providers/ToastProvider";

export type StartableRoutine = {
  id: string;
  name: string;
  /** Number of exercises the routine currently has. */
  quantity: number;
};

/**
 * Starts (or resumes) a workout from a routine, covering the cases the
 * database can't handle on its own: there is only one unfinished workout per
 * user, and a routine without exercises can't be started.
 */
export function useStartRoutineWorkout() {
  const router = useRouter();
  const { t, language } = useT();
  const toast = useToast();
  const dialog = useDialog();

  const { data: activeWorkout } = useActiveWorkout();
  const { data: routines } = useRoutines(language);
  const startWorkout = useStartWorkout();
  const discardWorkout = useDiscardWorkout();

  const openWorkout = (workoutId: string) =>
    router.push({ pathname: "/workout/[id]", params: { id: workoutId } });

  const showStartError = () =>
    toast.show(t("workout.startError"), { tone: "error" });

  const showEmptyRoutine = (
    routine: StartableRoutine,
    onAddExercises?: () => void
  ) =>
    dialog.show({
      title: t("workout.emptyTitle"),
      message: t("workout.emptyMessage", { name: routine.name }),
      actions: [
        {
          label: t("workout.addExercises"),
          onPress:
            onAddExercises ??
            (() =>
              router.push({
                pathname: "/routine/[id]",
                params: { id: routine.id },
              })),
        },
        { label: t("common.cancel"), variant: "cancel" },
      ],
    });

  const startNew = (routine: StartableRoutine, onAddExercises?: () => void) =>
    startWorkout.mutate(routine.id, {
      onSuccess: openWorkout,
      onError: (error) => {
        // The routine was emptied after the list was fetched; the database
        // is the last line of defense.
        if (errorKind(error) === "routineEmpty") {
          showEmptyRoutine(routine, onAddExercises);
        } else {
          showStartError();
        }
      },
    });

  const start = (routine: StartableRoutine, onAddExercises?: () => void) => {
    if (activeWorkout && activeWorkout.routine_id === routine.id) {
      openWorkout(activeWorkout.id);
      return;
    }

    if (routine.quantity === 0) {
      showEmptyRoutine(routine, onAddExercises);
      return;
    }

    if (activeWorkout) {
      const other = routines?.find((r) => r.id === activeWorkout.routine_id);
      dialog.show({
        title: t("workout.activeTitle"),
        message: t("workout.activeMessage", {
          name: other?.name ?? t("workout.title"),
        }),
        actions: [
          {
            label: t("workout.continue"),
            onPress: () => openWorkout(activeWorkout.id),
          },
          {
            label: t("workout.discard"),
            variant: "destructive",
            onPress: () =>
              discardWorkout.mutate(activeWorkout.id, {
                onSuccess: () => startNew(routine, onAddExercises),
                onError: showStartError,
              }),
          },
          { label: t("common.cancel"), variant: "cancel" },
        ],
      });
      return;
    }

    startNew(routine, onAddExercises);
  };

  return {
    start,
    isStarting: startWorkout.isPending || discardWorkout.isPending,
    activeRoutineId: activeWorkout?.routine_id ?? null,
  };
}
