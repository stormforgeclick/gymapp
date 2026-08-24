import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ScreenContainer } from "@/components/ui/ScreenContainer";
import Title from "@/components/ui/Title";

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
      <View style={styles.headerSection}>
        <Title title="EXERCISES" />
      </View>

      <SearchInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search exercises..."
      />

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
  searchInput: {
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },
});

export default ExercisesScreen;
