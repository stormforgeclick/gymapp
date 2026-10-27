import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
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
import ExerciseCard from "@/views/Exercises/Components/ExerciseCard";
import ExercisesList from "@/views/Exercises/Components/ExercisesList";
import Filter from "@/views/Exercises/Components/Filter";
import { useRowMutationState } from "../hooks/useRowMutationState";

type Exercise = {
  id: string;
  name: string;
  image: string;
  category: string;
  equipment: string;
};

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
});

const AddExercisesSheet = ({ routineId, onClose }: IProps) => {
  const ref = useRef<BottomSheetModal>(null);
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const sheet = useSheetStyles();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [adding, setAdding] = useState<Set<string>>(new Set());

  const { data: routineExercises } = useRoutineExercises(routineId);
  const addedIds = useMemo(
    () => new Set(routineExercises?.map((re) => re.gymbro_exercise_id) ?? []),
    [routineExercises]
  );

  const { data: filters } = useExercisesFilters();
  const categories = filters?.categories ?? [];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExercises({ category: categoryId }, search);
  const addMut = useAddRoutineExercise(routineId);
  const errors = useRowMutationState<string>();

  const exercises = useMemo(
    () => (data?.pages.flat() ?? []) as Exercise[],
    [data]
  );
  const isLoading = !data && !isFetchingNextPage;

  useEffect(() => {
    ref.current?.present();
  }, []);

  const handleTap = async (gymbroExerciseId: string) => {
    if (addedIds.has(gymbroExerciseId) || adding.has(gymbroExerciseId)) return;

    setAdding((prev) => new Set(prev).add(gymbroExerciseId));
    errors.clearError(gymbroExerciseId);

    try {
      await addMut.mutateAsync(gymbroExerciseId);
    } catch (e: any) {
      errors.fail(gymbroExerciseId, e?.message ?? "Error al agregar");
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
        ListComponent={BottomSheetFlatList as any}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: bottom + Spacing.three }}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="headline" accessibilityRole="header">
              AGREGAR EJERCICIOS
            </ThemedText>
            <SearchInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar ejercicio..."
              TextInputComponent={BottomSheetTextInput as any}
            />
            {categories.length > 0 && (
              <Filter
                items={categories}
                selectedId={categoryId}
                onSelect={setCategoryId}
                allLabel="Todos"
              />
            )}
          </View>
        }
        renderItem={({ item }) => {
          const isAdded = addedIds.has(item.id);
          const isInFlight = adding.has(item.id);
          const rowError = errors.errorFor(item.id);
          const a11yState = isInFlight
            ? "Agregando"
            : isAdded
              ? "Ya agregado"
              : "Agregar";

          return (
            <View>
              <ExerciseCard
                exercise={item}
                onPress={() => handleTap(item.id)}
                disabled={isAdded || isInFlight}
                dimmed={isAdded}
                accessibilityLabel={`${item.name}. ${a11yState}`}
                rightSlot={renderRightSlot(isInFlight, isAdded)}
              />
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
    </BottomSheetModal>
  );
};

export default AddExercisesSheet;
