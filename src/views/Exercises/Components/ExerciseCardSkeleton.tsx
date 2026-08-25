import Skeleton from "@/components/ui/Skeleton";

import { StyleSheet, View } from "react-native";

const ExerciseCardSkeleton = () => {
  return (
    <View style={styles.card}>
      <Skeleton variant="image" style={styles.image} />

      <View style={styles.textContainer}>
        <Skeleton variant="text" style={styles.name} />

        <Skeleton variant="text" style={styles.nameShort} />
      </View>

      <Skeleton variant="text" style={styles.icon} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#14141F",
    borderRadius: 10,
    padding: 16,

    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  image: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },

  textContainer: {
    flex: 1,
    gap: 6,
  },

  name: {
    width: "80%",
    height: 14,
    borderRadius: 4,
  },

  nameShort: {
    width: "50%",
    height: 14,
    borderRadius: 4,
  },

  icon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});

export default ExerciseCardSkeleton;
