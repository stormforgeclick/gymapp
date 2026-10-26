import FilterButton from "@/components/ui/FilterButton";

import { StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import FilterSkeleton from "./FilterSkeleton";

type FilterItem = { id: string; name: string };

interface FilterProps {
  items?: FilterItem[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  allLabel?: string;
  isLoading?: boolean;
}

const Filter = ({
  items,
  selectedId,
  onSelect,
  allLabel = "Todos",
  isLoading,
}: FilterProps) => {
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
              label={allLabel}
              selected={selectedId === undefined}
              onPress={() => onSelect(undefined)}
            />

            {items?.map((item) => {
              const isSelected = selectedId === item.id;

              return (
                <FilterButton
                  key={item.id}
                  label={item.name}
                  selected={isSelected}
                  onPress={() => onSelect(isSelected ? undefined : item.id)}
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
