import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { RoutineColors, Spacing } from "@/constants/theme";
import {
  useDeleteRoutineExercise,
  useReplaceRoutineExerciseSets,
  useRoutineExercises,
} from "@/hooks/api/routineExercises";
import type { SetInput } from "@/hooks/api/routineExercises/queries";
import { useRoutines } from "@/hooks/api/routines";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useStartRoutineWorkout } from "@/hooks/useStartRoutineWorkout";
import { useT } from "@/i18n";
import { useToast } from "@/providers/ToastProvider";
import AddRoutineComponent from "@/views/Routines/Components/AddRoutine";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import AddExercisesSheet from "./components/AddExercisesSheet";
import RoutineExerciseDetailComponent from "./components/routineExerciseDetail";
import { useRowMutationState } from "./hooks/useRowMutationState";

const makeStyles = () => ({
  list: {
    flex: 1,
  },
  exercisesContainer: {
    gap: Spacing.tight,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  centered: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  startButton: {
    marginTop: Spacing.two,
  },
});

const RoutineDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  const { t, language } = useT();
  const toast = useToast();

  const { data: routines } = useRoutines(language);
  const routine = routines?.find((r) => r.id === id);
  const routineColor = routine?.color ?? RoutineColors.routineOne;

  const {
    data: exercises,
    isLoading,
    isError,
    refetch,
  } = useRoutineExercises(id ?? "", language);

  const replaceMut = useReplaceRoutineExerciseSets(id ?? "");
  const deleteMut = useDeleteRoutineExercise(id ?? "");

  const save = useRowMutationState<string>();
  const del = useRowMutationState<string>();

  const [showPicker, setShowPicker] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const { start, isStarting, activeRoutineId } = useStartRoutineWorkout();

  const isResuming = activeRoutineId === id;
  // The loaded exercises are the freshest count; the list's count covers the gap.
  const exerciseCount = exercises?.length ?? routine?.quantity ?? 0;
  const canStart = !isLoading && !isError && !!routine;

  // An empty routine isn't hidden from here: starting it explains why it can't
  // and offers to open the exercise picker.
  const handleStartWorkout = () => {
    if (!routine) return;
    start(
      { id: routine.id, name: routine.name, quantity: exerciseCount },
      () => setShowPicker(true)
    );
  };

  const handleSave = (routineExerciseId: string) => (sets: SetInput[]) => {
    save.begin(routineExerciseId);
    replaceMut.mutate(
      { routineExerciseId, sets },
      {
        onSuccess: () => {
          save.succeed(routineExerciseId);
          toast.show(t("routineDetails.toast.setsSaved"));
        },
        onError: (err) => save.fail(routineExerciseId, err.message),
      }
    );
  };

  const handleDelete = (routineExerciseId: string) => () => {
    del.begin(routineExerciseId);
    deleteMut.mutate(routineExerciseId, {
      onSuccess: () => {
        del.succeed(routineExerciseId);
        toast.show(t("routineDetails.toast.exerciseRemoved"));
      },
      onError: (err) => del.fail(routineExerciseId, err.message),
    });
  };

  return (
    <ScreenContainer edges={["top", "bottom"]}>
      <ScreenHeader
        title={routine?.name ?? ""}
        size="headline"
        titleLines={1}
        onBack={() => router.back()}
        right={
          <IconButton
            icon="pencil"
            variant="filled"
            color={routineColor}
            onPress={() => setShowEdit(true)}
            accessibilityLabel={t("routineDetails.editRoutine")}
          />
        }
      />

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={routineColor} />
        </View>
      )}

      {isError && (
        <View style={styles.centered}>
          <EmptyState
            alert
            icon="alert-circle-outline"
            title={t("routineDetails.loadError")}
            actionLabel={t("common.retry")}
            onAction={() => refetch()}
          />
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.exercisesContainer}
          showsVerticalScrollIndicator={false}
          data={exercises ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item: re }) => (
            <RoutineExerciseDetailComponent
              routineExercise={re}
              color={routineColor}
              isSaving={save.isActive(re.id)}
              saveError={save.errorFor(re.id)}
              isDeleting={del.isActive(re.id)}
              onSave={handleSave(re.id)}
              onDelete={handleDelete(re.id)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="dumbbell"
              title={t("routineDetails.empty")}
              description={t("routineDetails.emptyHint")}
            />
          }
          ListFooterComponent={
            <Button
              label={t("routineDetails.addExercise")}
              variant="outline"
              dashed
              leftIcon="plus"
              onPress={() => setShowPicker(true)}
            />
          }
        />
      )}

      {canStart && (
        <Button
          label={isResuming ? t("workout.resume") : t("workout.start")}
          color={routineColor}
          onPress={handleStartWorkout}
          loading={isStarting}
          style={styles.startButton}
        />
      )}

      {showPicker && id && (
        <AddExercisesSheet
          routineId={id}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showEdit && routine && (
        <AddRoutineComponent setShowAdd={setShowEdit} routineToEdit={routine} />
      )}
    </ScreenContainer>
  );
};

export default RoutineDetail;
