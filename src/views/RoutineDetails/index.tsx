import { ThemedText } from "@/components/themed-text";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { RoutineColors } from "@/constants/theme";
import {
  useDeleteRoutineExercise,
  useReplaceRoutineExerciseSets,
  useRoutineExercises,
} from "@/hooks/api/routineExercises";
import type { SetInput } from "@/hooks/api/routineExercises/queries";
import { useRoutines } from "@/hooks/api/routines";
import AddRoutineComponent from "@/views/Routines/Components/AddRoutine";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import AddExercisesSheet from "./components/AddExercisesSheet";
import RoutineExerciseDetailComponent from "./components/routineExerciseDetail";
import { useRowMutationState } from "./hooks/useRowMutationState";

const RoutineDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

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
    <ScreenContainer>
      <View style={styles.header}>
        <ThemedText style={styles.routineTitle} numberOfLines={1}>
          {routine?.name ?? ""}
        </ThemedText>
        <Pressable
          onPress={() => setShowEdit(true)}
          accessibilityRole="button"
          accessibilityLabel="Editar rutina"
          hitSlop={8}
          style={({ pressed }) => [
            styles.editButton,
            { backgroundColor: routineColor },
            pressed && styles.pressed,
          ]}
          android_ripple={{ color: "rgba(0,0,0,0.15)", borderless: true }}
        >
          <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
        </Pressable>
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={routineColor} />
        </View>
      )}

      {isError && (
        <View style={styles.centered}>
          <ThemedText type="small" themeColor="textSecondary">
            Error al cargar los ejercicios
          </ThemedText>
        </View>
      )}

      {!isLoading && !isError && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.exercisesContainer}
          showsVerticalScrollIndicator={false}
        >
          {exercises?.length === 0 && (
            <View style={styles.emptyState}>
              <ThemedText type="small" themeColor="textSecondary">
                Aún no has agregado ejercicios
              </ThemedText>
            </View>
          )}

          {exercises?.map((re) => (
            <RoutineExerciseDetailComponent
              key={re.id}
              routineExercise={re}
              color={routineColor}
              isSaving={save.isActive(re.id)}
              saveError={save.errorFor(re.id)}
              isDeleting={del.isActive(re.id)}
              onSave={handleSave(re.id)}
              onDelete={handleDelete(re.id)}
            />
          ))}

          <Pressable style={styles.button} onPress={() => setShowPicker(true)}>
            <ThemedText style={styles.buttonText}>
              + Agregar ejercicio
            </ThemedText>
          </Pressable>
        </ScrollView>
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

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  routineTitle: {
    fontSize: 28,
    fontFamily: "BarlowCondensed_900Black",
    flex: 1,
    marginRight: 12,
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
    paddingTop: 10,
  },
  exercisesContainer: {
    gap: 10,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  button: {
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderColor: "#6A6A80",
    borderWidth: 1,
    borderRadius: 6,
    borderStyle: "dashed",
  },
  buttonText: {
    color: "#6A6A80",
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "Inter_700Bold",
    alignSelf: "center",
  },
});

export default RoutineDetail;
