import { ThemedText } from "@/components/themed-text";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import Title from "@/components/ui/Title";
import { useExercises, useExercisesFilters } from "@/hooks/api/exercises";
import { StyleSheet, View } from "react-native";

const ExercisesScreen = () => {
  const { data: exercises, isLoading, isError } = useExercises();
  const { data: filters } = useExercisesFilters();

  console.log("filters", filters);

  if (isLoading) {
    return (
      <View>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.headerSection}>
        <Title title="EXERCISES" />
      </View>
      {/*       <View>
        {filters?.categories?.map((category) => (
          <ThemedText
            key={category.id}
            style={{ fontSize: 14, marginBottom: 4 }}
          >
            {category.name}
          </ThemedText>
        ))}
      </View> */}
      {exercises?.map((exercise) => (
        <View key={exercise.id}>
          <ThemedText style={{ fontSize: 16, marginBottom: 8 }}>
            {exercise.name}
          </ThemedText>
        </View>
      ))}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerSection: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
});

export default ExercisesScreen;
