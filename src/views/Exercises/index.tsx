import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import Title from "@/components/ui/Title";

import { useExercises, useExercisesFilters } from "@/hooks/api/exercises";
import { ScrollView } from "react-native-gesture-handler";

type ExerciseFilters = {
  category?: string;
  equipment?: string;
  target?: string;
};

const ExercisesScreen = () => {
  const [selectedFilters, setSelectedFilters] = useState<ExerciseFilters>({});

  const { data: exercises, isLoading, isError } = useExercises(selectedFilters);

  const { data: filters } = useExercisesFilters();

  const setFilter = (key: keyof ExerciseFilters, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? undefined : value,
    }));
  };

  return (
    <ScreenContainer>
      <View style={styles.headerSection}>
        <Title title="EXERCISES" />
      </View>

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          <Pressable
            onPress={() => setSelectedFilters({})}
            style={[
              styles.filterItem,
              !selectedFilters.category && styles.filterItemSelected,
            ]}
          >
            <ThemedText
              style={[
                styles.filterText,
                !selectedFilters.category && styles.filterTextSelected,
              ]}
            >
              All
            </ThemedText>
          </Pressable>

          {filters?.categories?.map((category: string) => {
            const isSelected = selectedFilters.category === category;

            return (
              <Pressable
                key={category}
                onPress={() => setFilter("category", category)}
                style={[
                  styles.filterItem,
                  isSelected && styles.filterItemSelected,
                ]}
              >
                <ThemedText
                  style={[
                    styles.filterText,
                    isSelected && styles.filterTextSelected,
                  ]}
                >
                  {category}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.exerciseList}>
        {exercises?.map((exercise: { id: string; name: string }) => (
          <View key={exercise.id}>
            <ThemedText style={styles.exerciseName}>{exercise.name}</ThemedText>
          </View>
        ))}
      </View>
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

  filterSection: {
    marginTop: 20,
  },

  filterTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },

  filterList: {
    flexDirection: "row",
    gap: 8,
  },

  filterItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },

  filterItemSelected: {
    opacity: 0.6,
  },

  filterText: {
    fontSize: 14,
  },

  filterTextSelected: {
    fontWeight: "700",
  },

  clearButton: {
    marginTop: 20,
    paddingVertical: 10,
  },

  exerciseList: {
    marginTop: 24,
  },

  exerciseName: {
    fontSize: 16,
    marginBottom: 8,
  },
});

export default ExercisesScreen;
