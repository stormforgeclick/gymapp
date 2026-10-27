import FilterButton from "@/components/ui/FilterButton";
import { Spacing } from "@/constants/theme";

import { StyleSheet } from "react-native";
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterList}
      style={styles.filterScroll}
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
  );
};

const styles = StyleSheet.create({
  filterScroll: {
    flexGrow: 1,
  },
  filterList: {
    flexDirection: "row",
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
});

export default Filter;
