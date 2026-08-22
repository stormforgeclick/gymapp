import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import Title from "@/components/ui/Title";

import { useExercises, useExercisesFilters } from "@/hooks/api/exercises";
import { FlatList } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

type ExerciseFilters = {
  category?: string;
  equipment?: string;
  target?: string;
};

const ExercisesScreen = () => {
  const [selectedFilters, setSelectedFilters] = useState<ExerciseFilters>({});

  const {
    data: exercisesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExercises(selectedFilters);

  const exercises = exercisesData?.pages.flat() ?? [];

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

          {filters?.categories?.map(
            (category: { id: string; name: string }) => {
              const isSelected = selectedFilters.category === category.id;

              return (
                <Pressable
                  key={category.id}
                  onPress={() => setFilter("category", category.id)}
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
                    {category.name}
                  </ThemedText>
                </Pressable>
              );
            }
          )}
        </ScrollView>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item: { id: string }) => item.id}
        renderItem={({ item }: { item: { id: string; name: string } }) => (
          <View style={styles.exerciseList}>
            <ThemedText style={styles.exerciseName}>{item.name}</ThemedText>
          </View>
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
      />
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
