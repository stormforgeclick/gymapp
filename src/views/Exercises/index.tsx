import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ScreenContainer } from "@/components/ui/ScreenContainer";
import Title from "@/components/ui/Title";

import { useExercises, useExercisesFilters } from "@/hooks/api/exercises";
import ExercisesList from "./Components/ExercisesList";
import Filter from "./Components/filter";

type ExerciseFilters = {
  category?: string;
  equipment?: string;
  target?: string;
};

const ExercisesScreen = () => {
  const [selectedFilters, setSelectedFilters] = useState<ExerciseFilters>({});

  const { data: filters } = useExercisesFilters();

  const {
    data: exercisesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExercises(selectedFilters);

  const exercises = exercisesData?.pages.flat() ?? [];

  const setFilter = (key: keyof ExerciseFilters, value: string | undefined) => {
    setSelectedFilters((prev) => {
      if (value === undefined) {
        return {
          ...prev,
          [key]: undefined,
        };
      }

      return {
        ...prev,
        [key]: prev[key] === value ? undefined : value,
      };
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.headerSection}>
        <Title title="EXERCISES" />
      </View>

      <Filter
        selectedFilters={selectedFilters}
        setFilter={setFilter}
        filters={filters}
      />

      <ExercisesList
        exercises={exercises}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
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
});

export default ExercisesScreen;
