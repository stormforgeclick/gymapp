import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
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
  emptyState: {
    paddingVertical: Spacing.five + Spacing.two,
    alignItems: "center" as const,
  },
});

const RoutineDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);

  const { data: routines } = useRoutines();
  const routine = routines?.find((r) => r.id === id);
  const routineColor = routine?.color ?? RoutineColors.routineOne;

  const { data: exercises, isLoading, isError } = useRoutineExercises(id ?? "");

  const replaceMut = useReplaceRoutineExerciseSets(id ?? "");
  const deleteMut = useDeleteRoutineExercise(id ?? "");

  const save = useRowMutationState<string>();
  const del = useRowMutationState<string>();

  const [showPicker, setShowPicker] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const handleSave = (routineExerciseId: string) => (sets: SetInput[]) => {
    save.begin(routineExerciseId);
    replaceMut.mutate(
      { routineExerciseId, sets },
      {
        onSuccess: () => save.succeed(routineExerciseId),
        onError: (err) => save.fail(routineExerciseId, err.message),
      }
    );
  };

  const handleDelete = (routineExerciseId: string) => () => {
    del.begin(routineExerciseId);
    deleteMut.mutate(routineExerciseId, {
      onSuccess: () => del.succeed(routineExerciseId),
      onError: (err) => del.fail(routineExerciseId, err.message),
    });
  };

  return (
    <ScreenContainer edges={["top", "bottom"]}>
      <ScreenHeader
        title={routine?.name ?? ""}
        onBack={() => router.back()}
        right={
          <IconButton
            icon="pencil"
            variant="filled"
            color={routineColor}
            onPress={() => setShowEdit(true)}
            accessibilityLabel="Editar rutina"
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
          <ThemedText tone="secondary">Error al cargar los ejercicios</ThemedText>
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
            <View style={styles.emptyState}>
              <ThemedText tone="secondary">Aún no has agregado ejercicios</ThemedText>
            </View>
          }
          ListFooterComponent={
            <Button
              label="Agregar ejercicio"
              variant="outline"
              dashed
              leftIcon="plus"
              onPress={() => setShowPicker(true)}
            />
          }
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
