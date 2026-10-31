import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import IconButton from "@/components/ui/IconButton";
import SearchInput from "@/components/ui/SearchInput";
import { renderSheetBackdrop, useSheetStyles } from "@/components/ui/sheet";
import { IconSize, Spacing, type ThemeColors } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useExercises, useExercisesFilters } from "@/hooks/api/exercises";
import {
  useAddRoutineExercise,
  useRoutineExercises,
} from "@/hooks/api/routineExercises";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import ExerciseCard from "@/views/Exercises/Components/ExerciseCard";
import ExercisesList from "@/views/Exercises/Components/ExercisesList";
import Filter from "@/views/Exercises/Components/Filter";
import { useRowMutationState } from "../hooks/useRowMutationState";
import ExerciseInlineDetails from "./ExerciseInlineDetails";
import ExercisePeek from "./ExercisePeek";

type Exercise = {
  id: string;
  name: string;
  image: string;
  category: string;
  equipment: string;
  gif_url?: string | null;
  target?: string | null;
};

/** Set once the user has held an exercise to preview it, so the hint stops showing. */
const PEEK_HINT_KEY = "gymbro.hints.exercisePeek";

interface IProps {
  routineId: string;
  onClose: () => void;
}

const makeStyles = (c: ThemeColors) => ({
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.tight,
    gap: Spacing.tight,
    // Sticky header: must match the sheet background or rows show through.
    backgroundColor: c.surfaceElevated,
  },
  addedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.surfaceInput,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  rowError: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
  },
  rightSlot: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.one,
  },
});

const AddExercisesSheet = ({ routineId, onClose }: IProps) => {
  const ref = useRef<BottomSheetModal>(null);
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const sheet = useSheetStyles();
  const { t, language } = useT();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [adding, setAdding] = useState<Set<string>>(new Set());
  // The exercise being held down, and the one whose details are open in its row.
  const [peek, setPeek] = useState<Exercise | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Starts hidden so the hint doesn't flash before the saved choice is read.
  const [hintSeen, setHintSeen] = useState(true);

  const { data: routineExercises } = useRoutineExercises(routineId, language);
  const addedIds = useMemo(
    () => new Set(routineExercises?.map((re) => re.gymbro_exercise_id) ?? []),
    [routineExercises]
  );

  const { data: filters } = useExercisesFilters(language);
  const categories = filters?.categories ?? [];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    refetch,
  } = useExercises({ category: categoryId }, search, language);
  const addMut = useAddRoutineExercise(routineId);
  const errors = useRowMutationState<string>();

  const exercises = useMemo(
    () => (data?.pages.flat() ?? []) as Exercise[],
    [data]
  );
  // A failed first load must stop showing skeletons so the error state can appear.
  const isLoading = !data && !isError && !isFetchingNextPage;

  useEffect(() => {
    ref.current?.present();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(PEEK_HINT_KEY)
      .then((value) => setHintSeen(value === "1"))
      .catch(() => {});
  }, []);

  const startPeek = (exercise: Exercise) => {
    // Warm the GIF while the card appears.
    if (exercise.gif_url) Image.prefetch(exercise.gif_url);
    setPeek(exercise);
    // Saved now, hidden next time: hiding it here would shift the rows under the finger.
    AsyncStorage.setItem(PEEK_HINT_KEY, "1").catch(() => {});
  };

  const handleTap = async (gymbroExerciseId: string) => {
    if (addedIds.has(gymbroExerciseId) || adding.has(gymbroExerciseId)) return;

    setAdding((prev) => new Set(prev).add(gymbroExerciseId));
    errors.clearError(gymbroExerciseId);

    try {
      await addMut.mutateAsync(gymbroExerciseId);
    } catch {
      errors.fail(gymbroExerciseId, t("routineDetails.picker.addError"));
    } finally {
      setAdding((prev) => {
        const next = new Set(prev);
        next.delete(gymbroExerciseId);
        return next;
      });
    }
  };

  const renderRightSlot = (isInFlight: boolean, isAdded: boolean) => {
    if (isInFlight) {
      return <ActivityIndicator size="small" color={theme.accentText} />;
    }
    if (isAdded) {
      return (
        <View style={styles.addedBadge}>
          <MaterialCommunityIcons
            name="check"
            size={IconSize.sm}
            color={theme.accentText}
          />
        </View>
      );
    }
    return (
      <MaterialCommunityIcons
        name="plus"
        size={IconSize.lg}
        color={theme.accentText}
      />
    );
  };

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={["90%"]}
      enableDynamicSizing={false}
      // Dragging the list must only scroll it: with content panning on, flinging
      // back to the top hands the gesture to the sheet and pan-down-to-close
      // (on by default in modals) dismisses it. The handle still closes it.
      enableContentPanningGesture={false}
      onDismiss={onClose}
      backgroundStyle={sheet.background}
      handleIndicatorStyle={sheet.handleIndicator}
      backdropComponent={renderSheetBackdrop}
      keyboardBehavior="interactive"
    >
      <ExercisesList
        exercises={exercises}
        isLoading={isLoading}
        hasNextPage={!!hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        isError={isError && !data}
        onRetry={() => refetch()}
        ListComponent={BottomSheetFlatList as any}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: bottom + Spacing.three }}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="headline" accessibilityRole="header">
              {t("routineDetails.picker.title")}
            </ThemedText>
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder={t("routineDetails.picker.searchPlaceholder")}
              TextInputComponent={BottomSheetTextInput as any}
            />
            {categories.length > 0 && (
              <Filter
                items={categories}
                selectedId={categoryId}
                onSelect={setCategoryId}
                allLabel={t("common.all")}
              />
            )}
            {!hintSeen && (
              <ThemedText type="caption" tone="secondary">
                {t("routineDetails.picker.peekHint")}
              </ThemedText>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const isAdded = addedIds.has(item.id);
          const isInFlight = adding.has(item.id);
          const rowError = errors.errorFor(item.id);
          const a11yState = isInFlight
            ? t("routineDetails.picker.adding")
            : isAdded
              ? t("routineDetails.picker.alreadyAdded")
              : t("routineDetails.picker.add");

          const expanded = expandedId === item.id;

          return (
            <View>
              {/* Not `disabled` when added: an added exercise can still be previewed. */}
              <ExerciseCard
                testID="picker-exercise-row"
                exercise={item}
                onPress={() => handleTap(item.id)}
                onPeekStart={() => startPeek(item)}
                onPeekEnd={() => setPeek(null)}
                dimmed={isAdded}
                accessibilityLabel={t("routineDetails.picker.rowA11y", {
                  name: item.name,
                  state: a11yState,
                })}
                rightSlot={
                  <View style={styles.rightSlot}>
                    <IconButton
                      icon={expanded ? "chevron-up" : "information-outline"}
                      onPress={() => setExpandedId(expanded ? null : item.id)}
                      accessibilityLabel={t(
                        expanded
                          ? "routineDetails.picker.hideDetailsA11y"
                          : "routineDetails.picker.detailsA11y",
                        { name: item.name }
                      )}
                    />
                    {renderRightSlot(isInFlight, isAdded)}
                  </View>
                }
              />
              {expanded && (
                <ExerciseInlineDetails
                  exerciseId={item.id}
                  isAdded={isAdded}
                  isAdding={isInFlight}
                  onAdd={() => handleTap(item.id)}
                />
              )}
              {rowError && (
                <ThemedText
                  type="caption"
                  tone="danger"
                  style={styles.rowError}
                  accessibilityLiveRegion="polite"
                  accessibilityRole="alert"
                >
                  {rowError}
                </ThemedText>
              )}
            </View>
          );
        }}
      />

      {peek && <ExercisePeek exercise={peek} />}
    </BottomSheetModal>
  );
};

export default AddExercisesSheet;
