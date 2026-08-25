import FilterButton from "@/components/ui/FilterButton";

import { StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import FilterSkeleton from "./FilterSkeleton";

type ExerciseFilters = {
  category?: string;
  equipment?: string;
  target?: string;
};

const Filter = ({
  selectedFilters,
  setFilter,
  filters,
  isLoading,
}: {
  selectedFilters: ExerciseFilters;
  setFilter: (key: keyof ExerciseFilters, value: string | undefined) => void;
  filters?: {
    categories: { id: string; name: string }[];
    equipment?: { id: string; name: string }[];
  };
  isLoading: boolean;
}) => {
  return (
    <View style={styles.filterSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
      >
        {isLoading ? (
          <FilterSkeleton />
        ) : (
          <>
            <FilterButton
              label="All"
              selected={selectedFilters.category === undefined}
              onPress={() => setFilter("category", undefined)}
            />

            {filters?.categories?.map((category) => {
              const isSelected = selectedFilters.category === category.id;

              return (
                <FilterButton
                  key={category.id}
                  label={category.name}
                  selected={isSelected}
                  onPress={() => setFilter("category", category.id)}
                />
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filterSection: {},

  filterList: {
    flexDirection: "row",
    gap: 8,
  },

  filterSkeleton: {
    width: 60,
    height: 36,
  },
});

export default Filter;
