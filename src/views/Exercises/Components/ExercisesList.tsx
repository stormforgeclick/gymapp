import { ThemedText } from "@/components/themed-text";
import { FlatList, StyleSheet, View } from "react-native";

const ExercisesList = ({
  exercises,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  exercises: { id: string; name: string }[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}) => {
  return (
    <FlatList
      data={exercises}
      keyExtractor={(item: { id: string }) => item.id}
      renderItem={({ item }: { item: { id: string; name: string } }) => (
        <View style={styles.exerciseList}>
          <ThemedText style={styles.exerciseName}>{item.name}</ThemedText>
        </View>
      )}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.5}
    />
  );
};

const styles = StyleSheet.create({
  exerciseList: {
    marginTop: 24,
  },

  exerciseName: {
    fontSize: 16,
    marginBottom: 8,
  },
});

export default ExercisesList;
