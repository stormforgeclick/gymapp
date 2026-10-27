import { ComponentType } from "react";
import {
  FlatList,
  FlatListProps,
  ListRenderItem,
  View,
} from "react-native";

import ExerciseCard from "./ExerciseCard";
import ExerciseCardSkeleton from "./ExerciseCardSkeleton";

type Exercise = {
  id: string;
  name: string;
  category: string;
  equipment: string;
  image: string;
};

type ListComponentType = ComponentType<FlatListProps<Exercise>>;

interface ExercisesListProps {
  exercises: Exercise[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  fetchNextPage: () => void;
  ListComponent?: ListComponentType;
  renderItem?: ListRenderItem<Exercise>;
  ListHeaderComponent?: FlatListProps<Exercise>["ListHeaderComponent"];
  stickyHeaderIndices?: FlatListProps<Exercise>["stickyHeaderIndices"];
  contentContainerStyle?: FlatListProps<Exercise>["contentContainerStyle"];
}

const SKELETON_DATA: Exercise[] = Array.from({ length: 6 }, (_, index) => ({
  id: `skeleton-${index}`,
  name: "",
  category: "",
  equipment: "",
  image: "",
}));

const defaultRenderItem: ListRenderItem<Exercise> = ({ item }) => (
  <ExerciseCard exercise={item} />
);

const ExercisesList = ({
  exercises,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  fetchNextPage,
  ListComponent,
  renderItem = defaultRenderItem,
  ListHeaderComponent,
  stickyHeaderIndices,
  contentContainerStyle,
}: ExercisesListProps) => {
  const List = (ListComponent ?? FlatList) as ListComponentType;

  if (isLoading) {
    return (
      <List
        data={SKELETON_DATA}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          { gap: 12, paddingBottom: 16 },
          contentContainerStyle,
        ]}
        ListHeaderComponent={ListHeaderComponent}
        stickyHeaderIndices={stickyHeaderIndices}
        renderItem={() => <ExerciseCardSkeleton />}
      />
    );
  }

  return (
    <List
      data={exercises}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        { gap: 12, paddingBottom: 16 },
        contentContainerStyle,
      ]}
      ListHeaderComponent={ListHeaderComponent}
      stickyHeaderIndices={stickyHeaderIndices}
      renderItem={renderItem}
      removeClippedSubviews
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={{ gap: 12 }}>
            <ExerciseCardSkeleton />
            <ExerciseCardSkeleton />
          </View>
        ) : null
      }
    />
  );
};

export default ExercisesList;
