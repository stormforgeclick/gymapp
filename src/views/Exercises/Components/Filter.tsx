import FilterButton from "@/components/ui/FilterButton";
import { StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

type ExerciseFilters = {
  category?: string;
  equipment?: string;
  target?: string;
};

const Filter = ({
  selectedFilters,
  setFilter,
  filters,
}: {
  selectedFilters: ExerciseFilters;
  setFilter: (key: keyof ExerciseFilters, value: string | undefined) => void;
  filters: {
    categories: { id: string; name: string }[];
    equipment?: { id: string; name: string }[];
  };
}) => {
  return (
    <View style={styles.filterSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
      >
        <FilterButton
          label="All"
          selected={selectedFilters.category === undefined}
          onPress={() => setFilter("category", undefined)}
        />

        {filters?.categories?.map((category: { id: string; name: string }) => {
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default Filter;
