import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
import CustomImage from "@/components/ui/CustomImage";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import Skeleton from "@/components/ui/Skeleton";
import {
  Radius,
  RoutineColors,
  Spacing,
  type ThemeColors,
} from "@/constants/theme";
import { useRoutines } from "@/hooks/api/routines";
import {
  useActiveWorkout,
  useAddWorkoutSet,
  useDeleteWorkoutSet,
  useDiscardWorkout,
  useFinishWorkout,
  useUpdateWorkoutSet,
  useWorkoutExercises,
} from "@/hooks/api/workouts";
import type {
  WorkoutExercise,
  WorkoutSetPatch,
} from "@/hooks/api/workouts/queries";
import { useRoutineColor, useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import { useDialog } from "@/providers/DialogProvider";
import { useToast } from "@/providers/ToastProvider";
import ExerciseTabs from "./components/ExerciseTabs";
import ProgressBar from "./components/ProgressBar";
import SetsTable from "./components/SetsTable";
import { getResumeIndex } from "./utils/getResumeIndex";

const GIF_SIZE = 180;

const capitalize = (text: string) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

const makeStyles = (c: ThemeColors) => ({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.two,
    marginTop: Spacing.two,
    marginBottom: Spacing.tight,
  },
  headerTitles: {
    flex: 1,
    alignItems: "center" as const,
  },
  centerText: {
    textAlign: "center" as const,
  },
  body: {
    flex: 1,
    gap: Spacing.tight,
    paddingTop: Spacing.tight,
  },
  scrollContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  gifCard: {
    alignItems: "center" as const,
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  gif: {
    width: GIF_SIZE,
    aspectRatio: 1,
    borderRadius: Radius.md,
  },
  gifFallback: {
    width: GIF_SIZE,
    aspectRatio: 1,
    borderRadius: Radius.md,
    backgroundColor: c.surfaceInput,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  exerciseTitles: {
    gap: Spacing.one,
  },
  skeletonTabs: {
    flexDirection: "row" as const,
    gap: Spacing.two,
  },
  skeletonTab: {
    width: 88,
    height: 40,
  },
  skeletonGif: {
    height: GIF_SIZE + Spacing.three * 2,
    borderRadius: Radius.lg,
  },
  skeletonTitle: {
    width: "60%" as const,
    height: 36,
  },
  skeletonCard: {
    height: 220,
    borderRadius: Radius.lg,
  },
});

const WorkoutScreen = () => {
  const { id: workoutId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t, language } = useT();
  const toast = useToast();
  const dialog = useDialog();
  const reduceMotion = useReducedMotion();

  const { data: activeWorkout } = useActiveWorkout();
  const { data: routines } = useRoutines(language);
  const {
    data: exerciseData,
    isLoading,
    isError,
    refetch,
  } = useWorkoutExercises(workoutId, language);

  const updateSet = useUpdateWorkoutSet(workoutId, language);
  const addSet = useAddWorkoutSet(workoutId, language);
  const deleteSet = useDeleteWorkoutSet(workoutId, language);
  const finishWorkout = useFinishWorkout();
  const discardWorkout = useDiscardWorkout();

  const exercises = useMemo(() => exerciseData ?? [], [exerciseData]);
  // null until the data arrives, so the workout opens where it was left off.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  if (selectedIndex === null && exerciseData) {
    setSelectedIndex(getResumeIndex(exerciseData));
  }

  const routine = routines?.find(
    (r) => r.id === (activeWorkout?.id === workoutId ? activeWorkout.routine_id : null)
  );
  const color = useRoutineColor(routine?.color ?? RoutineColors.routineOne);
  const title = routine?.name ?? t("workout.title");

  const { done, total } = useMemo(() => {
    const sets = exercises.flatMap((exercise) => exercise.sets);
    return { done: sets.filter((set) => set.completed).length, total: sets.length };
  }, [exercises]);

  const index = Math.min(selectedIndex ?? 0, Math.max(exercises.length - 1, 0));
  const exercise: WorkoutExercise | undefined = exercises[index];
  const isLastExercise = index >= exercises.length - 1;

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [index]);

  // Warm the cache so "Next" shows the following GIF without a loading flash.
  const nextGif = exercises[index + 1]?.gif_url;
  useEffect(() => {
    if (nextGif) Image.prefetch(nextGif);
  }, [nextGif]);

  const showSaveError = () =>
    toast.show(t("workout.toast.saveError"), { tone: "error" });

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  const handleUpdateSet = (setId: string, patch: WorkoutSetPatch) =>
    updateSet.mutate({ setId, patch }, { onError: showSaveError });

  const handleAddSet = () => {
    if (!exercise) return;
    const last = exercise.sets[exercise.sets.length - 1];
    addSet.mutate(
      {
        workoutExerciseId: exercise.id,
        position: Math.max(0, ...exercise.sets.map((set) => set.position)) + 1,
        weight: last?.weight ?? null,
        reps: last?.reps ?? last?.target_min_reps ?? null,
      },
      { onError: showSaveError }
    );
  };

  const handleRemoveLastSet = () => {
    if (!exercise || exercise.sets.length <= 1) return;
    const last = exercise.sets[exercise.sets.length - 1];
    deleteSet.mutate(last.id, { onError: showSaveError });
  };

  const finish = () =>
    finishWorkout.mutate(workoutId, {
      onSuccess: () => {
        toast.show(t("workout.toast.saved"));
        leave();
      },
      onError: showSaveError,
    });

  const handleFinish = () => {
    const pending = total - done;
    if (pending === 0) {
      finish();
      return;
    }
    dialog.show({
      title: t("workout.finishTitle"),
      message: t("workout.finishPending", { count: pending }),
      actions: [
        { label: t("workout.keepTraining"), variant: "cancel" },
        { label: t("workout.finishAnyway"), onPress: finish },
      ],
    });
  };

  const confirmDiscard = () =>
    dialog.show({
      title: t("workout.discardTitle"),
      message: t("workout.discardMessage"),
      actions: [
        { label: t("common.cancel"), variant: "cancel" },
        {
          label: t("workout.discard"),
          variant: "destructive",
          onPress: () =>
            discardWorkout.mutate(workoutId, {
              onSuccess: () => {
                toast.show(t("workout.toast.discarded"));
                leave();
              },
              onError: showSaveError,
            }),
        },
      ],
    });

  const handleClose = () =>
    dialog.show({
      title: t("workout.leaveTitle"),
      message: t("workout.leaveMessage"),
      actions: [
        { label: t("workout.keepForLater"), onPress: leave },
        {
          label: t("workout.discard"),
          variant: "destructive",
          onPress: confirmDiscard,
        },
        { label: t("common.cancel"), variant: "cancel" },
      ],
    });

  const handleNext = () => {
    if (isLastExercise) handleFinish();
    else setSelectedIndex(index + 1);
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.body}>
          <View style={styles.skeletonTabs}>
            <Skeleton variant="pill" style={styles.skeletonTab} />
            <Skeleton variant="pill" style={styles.skeletonTab} />
            <Skeleton variant="pill" style={styles.skeletonTab} />
          </View>
          <Skeleton variant="card" style={styles.skeletonGif} />
          <Skeleton style={styles.skeletonTitle} />
          <Skeleton variant="card" style={styles.skeletonCard} />
        </View>
      );
    }

    if (isError) {
      return (
        <EmptyState
          alert
          icon="alert-circle-outline"
          title={t("workout.loadError")}
          actionLabel={t("common.retry")}
          onAction={() => refetch()}
        />
      );
    }

    if (!exercise) {
      return <EmptyState icon="dumbbell" title={t("workout.empty")} />;
    }

    const gifSource = exercise.gif_url ?? exercise.image;

    return (
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ExerciseTabs
          names={exercises.map((item) => item.name)}
          selectedIndex={index}
          onSelect={setSelectedIndex}
          color={color}
        />

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gifCard}>
            {gifSource ? (
              <CustomImage
                source={{ uri: gifSource }}
                recyclingKey={exercise.id}
                style={styles.gif}
                contentFit="contain"
                autoplay={!reduceMotion}
                accessibilityLabel={t("workout.gifA11y", { name: exercise.name })}
              />
            ) : (
              <View style={styles.gifFallback}>
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={48}
                  color={theme.textTertiary}
                />
              </View>
            )}
          </View>

          <View style={styles.exerciseTitles}>
            <ThemedText type="overline" tone="secondary" tabular>
              {t("workout.exerciseCounter", {
                n: index + 1,
                total: exercises.length,
              })}
            </ThemedText>
            <ThemedText type="display" numberOfLines={2} accessibilityRole="header">
              {capitalize(exercise.name)}
            </ThemedText>
            <ThemedText type="label" tone="secondary">
              {[exercise.muscle_group, exercise.equipment]
                .filter(Boolean)
                .map((part) => capitalize(part as string))
                .join(" · ")}
            </ThemedText>
          </View>

          <SetsTable
            exercise={exercise}
            onUpdateSet={handleUpdateSet}
            onAddSet={handleAddSet}
            onRemoveLastSet={handleRemoveLastSet}
          />
        </ScrollView>

        <Button
          label={isLastExercise ? t("workout.finish") : `${t("workout.next")}  →`}
          color={color}
          onPress={handleNext}
          loading={isLastExercise && finishWorkout.isPending}
          disabled={finishWorkout.isPending}
        />
      </KeyboardAvoidingView>
    );
  };

  return (
    <ScreenContainer edges={["top", "bottom"]}>
      <View style={styles.header}>
        <IconButton
          icon="close"
          onPress={handleClose}
          accessibilityLabel={t("workout.close")}
        />

        <View style={styles.headerTitles}>
          <ThemedText type="title" numberOfLines={1} style={styles.centerText}>
            {title}
          </ThemedText>
          <ThemedText type="caption" tone="secondary" tabular>
            {t("workout.setsDone", { done, total })}
          </ThemedText>
        </View>

        {/* Secondary on purpose: the bottom button is the screen's one primary action. */}
        <Button
          label={t("workout.finish")}
          variant="outline"
          size="sm"
          fullWidth={false}
          onPress={handleFinish}
          loading={finishWorkout.isPending}
          disabled={total === 0}
        />
      </View>

      <ProgressBar done={done} total={total} color={color} />

      {renderBody()}
    </ScreenContainer>
  );
};

export default WorkoutScreen;
