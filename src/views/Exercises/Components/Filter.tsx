import { ThemedText } from "@/components/themed-text";
import { Pressable, StyleSheet, View } from "react-native";
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
        <Pressable
          onPress={() => setFilter("category", undefined)}
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

        {filters?.categories?.map((category: { id: string; name: string }) => {
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
});

export default Filter;
