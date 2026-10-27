import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ScreenContainer } from "@/components/ui/ScreenContainer";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { Spacing } from "@/constants/theme";

import SearchInput from "@/components/ui/SearchInput";
import { useExercises, useExercisesFilters } from "@/hooks/api/exercises";
import ExercisesList from "./Components/ExercisesList";
import Filter from "./Components/Filter";

type ExerciseFilters = {
  category?: string;
  equipment?: string;
  target?: string;
};

const ExercisesScreen = () => {
  const [selectedFilters, setSelectedFilters] = useState<ExerciseFilters>({});
  const [search, setSearch] = useState("");

  const { data: filters } = useExercisesFilters();

  const {
    data: exercisesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExercises(selectedFilters, search);

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
      <ScreenHeader title="EJERCICIOS" />
      <View style={styles.container}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar ejercicios..."
        />

        <Filter
          items={filters?.categories}
          selectedId={selectedFilters.category}
          onSelect={(id) => setFilter("category", id)}
          allLabel="Todos"
          isLoading={!filters}
        />

        <ExercisesList
          exercises={exercises}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          isLoading={!exercisesData && !isFetchingNextPage}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.three,
  },
});

export default ExercisesScreen;
