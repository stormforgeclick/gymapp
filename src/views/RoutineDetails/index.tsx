import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { IconSize, RoutineColors, Spacing } from "@/constants/theme";
import {
  useDeleteRoutineExercise,
  useReorderRoutineExercises,
  useReplaceRoutineExerciseSets,
  useRoutineExercises,
} from "@/hooks/api/routineExercises";
import type { RoutineExercise, SetInput } from "@/hooks/api/routineExercises/queries";
import { useRoutines } from "@/hooks/api/routines";
import { useRoutineColor, useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useStartRoutineWorkout } from "@/hooks/useStartRoutineWorkout";
import { useT } from "@/i18n";
import { moveItem } from "@/lib/array";
import { useToast } from "@/providers/ToastProvider";
import AddRoutineComponent from "@/views/Routines/Components/AddRoutine";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import Sortable, {
  type SortableGridDragEndParams,
} from "react-native-sortables";
import { ThemedText } from "@/components/themed-text";
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
  reorderHint: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  reorderHintText: {
    flex: 1,
  },
});

/** Set once the user has reordered an exercise, so the hint stops showing. */
const REORDER_HINT_KEY = "gymbro.hints.reorderExercises";

const getExerciseKey = (exercise: RoutineExercise) => exercise.id;

const RoutineDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  const theme = useTheme();
  const { t, language } = useT();
  const toast = useToast();

  const { data: routines } = useRoutines(language);
  const routine = routines?.find((r) => r.id === id);
  const routineColor = useRoutineColor(
    routine?.color ?? RoutineColors.routineOne
  );

  const {
    data: exercises,
    isLoading,
    isError,
    refetch,
  } = useRoutineExercises(id ?? "", language);

  const replaceMut = useReplaceRoutineExerciseSets(id ?? "");
  const deleteMut = useDeleteRoutineExercise(id ?? "");
  const reorderMut = useReorderRoutineExercises(id ?? "", language);

  const save = useRowMutationState<string>();
  const del = useRowMutationState<string>();

  const [showPicker, setShowPicker] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  // The cards whose sets are open for editing.
  const [editingIds, setEditingIds] = useState<ReadonlySet<string>>(new Set());
  // Bumped to rebuild the sortable list from the saved order when a save fails.
  const [gridKey, setGridKey] = useState(0);
  // Starts hidden so the hint doesn't flash before the saved choice is read.
  const [hintSeen, setHintSeen] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(REORDER_HINT_KEY)
      .then((value) => setHintSeen(value === "1"))
      .catch(() => {});
  }, []);

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

  const setEditing = (routineExerciseId: string, editing: boolean) =>
    setEditingIds((prev) => {
      const next = new Set(prev);
      if (editing) next.add(routineExerciseId);
      else next.delete(routineExerciseId);
      return next;
    });

  // Dragging only starts when nothing else is going on: a card being edited
  // has text fields that fight the drag gesture, and a save or a delete in
  // flight would change the list under the finger. One new order is saved at a
  // time so the cache and the database can't end up disagreeing.
  const canDrag =
    (exercises?.length ?? 0) >= 2 &&
    !exercises?.some((exercise) => editingIds.has(exercise.id)) &&
    !replaceMut.isPending &&
    !deleteMut.isPending &&
    !reorderMut.isPending;

  // The optimistic update in the mutation reorders the cache, which is what the
  // list reads, so the new order shows as soon as it is saved here.
  const saveOrder = (orderedIds: string[]) =>
    reorderMut.mutate(orderedIds, {
      onError: () => {
        // The cache is already back to the saved order; rebuild the list from it.
        setGridKey((key) => key + 1);
        toast.show(t("routineDetails.reorder.saveError"), { tone: "error" });
      },
    });

  const handleDragEnd = ({
    data,
    fromIndex,
    toIndex,
  }: SortableGridDragEndParams<RoutineExercise>) => {
    if (fromIndex === toIndex) return;
    saveOrder(data.map((exercise) => exercise.id));

    if (!hintSeen) {
      setHintSeen(true);
      AsyncStorage.setItem(REORDER_HINT_KEY, "1").catch(() => {});
    }
  };

  // The screen reader's "move up/down" on a card.
  const moveExercise = (from: number, to: number) => {
    if (!exercises || from === to) return;
    if (from < 0 || to < 0 || from >= exercises.length || to >= exercises.length) {
      return;
    }
    saveOrder(moveItem(exercises, from, to).map((exercise) => exercise.id));
  };

  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const handleSave = (routineExerciseId: string) => (sets: SetInput[]) => {
    save.begin(routineExerciseId);
    replaceMut.mutate(
      { routineExerciseId, sets },
      {
        onSuccess: () => {
          save.succeed(routineExerciseId);
          setEditing(routineExerciseId, false);
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
        setEditing(routineExerciseId, false);
        toast.show(t("routineDetails.toast.exerciseRemoved"));
      },
      onError: (err) => del.fail(routineExerciseId, err.message),
    });
  };

  return (
    <ScreenContainer edges={["top", "bottom"]} testID="screen-routine-details">
      <ScreenHeader
        title={routine?.name ?? ""}
        size="headline"
        titleLines={1}
        onBack={() => router.back()}
        right={
          <IconButton
            icon="pencil"
            testID="edit-routine-button"
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
        <Animated.ScrollView
          ref={scrollRef}
          style={styles.list}
          contentContainerStyle={styles.exercisesContainer}
          showsVerticalScrollIndicator={false}
        >
          {!!exercises?.length && (
            <>
              {exercises.length >= 2 && !hintSeen && (
                <View style={styles.reorderHint}>
                  <MaterialCommunityIcons
                    name="gesture-tap-hold"
                    size={IconSize.md}
                    color={theme.textSecondary}
                  />
                  <ThemedText
                    type="caption"
                    tone="secondary"
                    style={styles.reorderHintText}
                  >
                    {t("routineDetails.reorder.hint")}
                  </ThemedText>
                </View>
              )}

              {/* The hold-then-drag gesture is the whole control: it only
                  starts after a short press, so scrolling never begins a drag. */}
              <Sortable.Grid
                key={gridKey}
                columns={1}
                rowGap={Spacing.tight}
                data={exercises}
                keyExtractor={getExerciseKey}
                scrollableRef={scrollRef}
                sortEnabled={canDrag}
                dragActivationDelay={250}
                activeItemScale={1.03}
                enableActiveItemSnap={false}
                onDragEnd={handleDragEnd}
                renderItem={({ item: re, index }) => (
                  <RoutineExerciseDetailComponent
                    routineExercise={re}
                    color={routineColor}
                    isSaving={save.isActive(re.id)}
                    saveError={save.errorFor(re.id)}
                    isDeleting={del.isActive(re.id)}
                    onSave={handleSave(re.id)}
                    onDelete={handleDelete(re.id)}
                    editing={editingIds.has(re.id)}
                    onEditingChange={(editing) => setEditing(re.id, editing)}
                    index={index}
                    total={exercises.length}
                    canMove={canDrag}
                    onMove={(to) => moveExercise(index, to)}
                  />
                )}
              />
            </>
          )}

          {exercises?.length === 0 && (
            <EmptyState
              icon="dumbbell"
              title={t("routineDetails.empty")}
              description={t("routineDetails.emptyHint")}
            />
          )}

          <Button
            testID="add-exercise-button"
            label={t("routineDetails.addExercise")}
            variant="outline"
            dashed
            leftIcon="plus"
            onPress={() => setShowPicker(true)}
          />
        </Animated.ScrollView>
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
        <AddRoutineComponent
          setShowAdd={setShowEdit}
          routineToEdit={routine}
          onDeleted={() => router.back()}
        />
      )}
    </ScreenContainer>
  );
};

export default RoutineDetail;
