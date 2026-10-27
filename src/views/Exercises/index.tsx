import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ScreenContainer } from "@/components/ui/ScreenContainer";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { Spacing } from "@/constants/theme";

import SearchInput from "@/components/ui/SearchInput";
import { useExercises, useExercisesFilters } from "@/hooks/api/exercises";
import { useT } from "@/i18n";
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

  const { t, language } = useT();

  const { data: filters } = useExercisesFilters(language);

  const {
    data: exercisesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    isRefetching,
    refetch,
  } = useExercises(selectedFilters, search, language);

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
      <ScreenHeader title={t("exercises.title")} />
      <View style={styles.container}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder={t("exercises.searchPlaceholder")}
        />

        <Filter
          items={filters?.categories}
          selectedId={selectedFilters.category}
          onSelect={(id) => setFilter("category", id)}
          allLabel={t("common.all")}
          isLoading={!filters}
        />

        <ExercisesList
          exercises={exercises}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          // Without the isError check a failed first load would show skeletons forever.
          isLoading={!exercisesData && !isError && !isFetchingNextPage}
          isError={isError && !exercisesData}
          onRetry={() => refetch()}
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={() => refetch()}
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
