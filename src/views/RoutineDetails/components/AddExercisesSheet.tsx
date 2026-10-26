import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import SearchInput from "@/components/ui/SearchInput";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useExercises, useExercisesFilters } from "@/hooks/api/exercises";
import {
  useAddRoutineExercise,
  useRoutineExercises,
} from "@/hooks/api/routineExercises";
import ExerciseCard from "@/views/Exercises/Components/ExerciseCard";
import ExercisesList from "@/views/Exercises/Components/ExercisesList";
import Filter from "@/views/Exercises/Components/Filter";
import { useRowMutationState } from "../hooks/useRowMutationState";

const BACKGROUND = "#0F0F1C";

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

const AddExercisesSheet = ({ routineId, onClose }: IProps) => {
  const ref = useRef<BottomSheetModal>(null);
  const { bottom } = useSafeAreaInsets();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [adding, setAdding] = useState<Set<string>>(new Set());

  const { data: routineExercises } = useRoutineExercises(routineId);
  const addedIds = new Set(
    routineExercises?.map((re) => re.gymbro_exercise_id) ?? []
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

  const exercises = (data?.pages.flat() ?? []) as Exercise[];
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
      return <ActivityIndicator size="small" color="#C8FF00" />;
    }
    if (isAdded) {
      return (
        <View style={styles.addedBadge}>
          <MaterialCommunityIcons name="check" size={16} color="#C8FF00" />
        </View>
      );
    }
    return <MaterialCommunityIcons name="plus" size={22} color="#C8FF00" />;
  };

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={["90%"]}
      enableDynamicSizing={false}
      onDismiss={onClose}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handleIndicator}
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
        contentContainerStyle={{ paddingBottom: bottom + 16 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText style={styles.title}>AGREGAR EJERCICIOS</ThemedText>
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

const styles = StyleSheet.create({
  background: {
    backgroundColor: BACKGROUND,
  },
  handleIndicator: {
    backgroundColor: "#666",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: BACKGROUND,
  },
  title: {
    fontSize: 24,
    fontFamily: "BarlowCondensed_900Black",
  },
  addedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(200,255,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowError: {
    fontSize: 11,
    color: "#FF4D6D",
    paddingHorizontal: 16,
    paddingTop: 4,
  },
});

export default AddExercisesSheet;
