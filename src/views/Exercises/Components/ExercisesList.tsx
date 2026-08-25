import { FlatList, View } from "react-native";

import ExerciseCard from "./ExerciseCard";
import ExerciseCardSkeleton from "./ExerciseCardSkeleton";

type Exercise = {
  id: string;
  name: string;
  category: string;
  equipment: string;
  image: string;
};

const ExercisesList = ({
  exercises,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  fetchNextPage,
}: {
  exercises: Exercise[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  fetchNextPage: () => void;
}) => {
  if (isLoading) {
    return (
      <FlatList
        data={Array.from({ length: 6 })}
        keyExtractor={(_, index) => `skeleton-${index}`}
        contentContainerStyle={{
          gap: 12,
          paddingBottom: 16,
        }}
        renderItem={() => <ExerciseCardSkeleton />}
      />
    );
  }

  return (
    <FlatList
      contentContainerStyle={{
        gap: 12,
        paddingBottom: 16,
      }}
      data={exercises}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ExerciseCard exercise={item} />}
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
