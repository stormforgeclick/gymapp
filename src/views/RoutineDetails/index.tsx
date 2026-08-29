import { useLocalSearchParams } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import { ScreenContainer } from "@/components/ui/ScreenContainer";
import RoutineExerciseDetailComponent from "./components/routineExerciseDetail";

import { RoutineColors } from "@/constants/theme";
import { routinesMock } from "@/mocks/routines";
import { routineExercisesMock } from "@/mocks/routineExercise";

const RoutineDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  const routine = routinesMock.find((routine) => routine.id === id);

  const routineExercises = routineExercisesMock.filter(
    (exercise) => exercise.exerciseRoutineDetail.routineId === id,
  );

  const handleAddExercise = () => {
    console.log("add");
  };

  const handleRemoveExercise = (routineExerciseId: string) => {
    console.log("remove", routineExerciseId);
  };

  const handleUpdateExercise = (routineExerciseId: string) => {
    console.log("update", routineExerciseId);
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.exercisesContainer}
        showsVerticalScrollIndicator={false}
      >
        {routineExercises.map((exercise) => (
          <RoutineExerciseDetailComponent
            key={exercise.exerciseRoutineDetail.id}
            exercise={exercise}
            color={routine?.color ?? RoutineColors.routineOne}
            handleRemove={() =>
              handleRemoveExercise(exercise.exerciseRoutineDetail.id)
            }
            handleUpdate={() =>
              handleUpdateExercise(exercise.exerciseRoutineDetail.id)
            }
          />
        ))}

        <Pressable style={styles.button} onPress={handleAddExercise}>
          <ThemedText style={styles.buttonText}>+ Agregar ejercicio</ThemedText>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingTop: 10,
  },

  exercisesContainer: {
    gap: 10,
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
