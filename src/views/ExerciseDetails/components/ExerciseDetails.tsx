import Skeleton from "@/components/ui/Skeleton";
import { StyleSheet, View } from "react-native";

const ExerciseDetailsSkeleton = () => {
  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <Skeleton variant="image" style={styles.video} />
      </View>

      <View style={styles.titleContainer}>
        <Skeleton variant="text" style={styles.title} />
        <Skeleton variant="text" style={styles.titleShort} />
      </View>

      <View style={styles.tagsContainer}>
        <Skeleton variant="pill" style={styles.pill} />
        <Skeleton variant="pill" style={styles.pillMedium} />
        <Skeleton variant="pill" style={styles.pillSmall} />
      </View>

      <View style={styles.coachingContainer}>
        <Skeleton variant="text" style={styles.coachingTitle} />

        <View style={styles.coachingText}>
          <Skeleton variant="text" />
          <Skeleton variant="text" />
          <Skeleton variant="text" style={styles.textShort} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },

  videoContainer: {
    paddingVertical: 36,
    backgroundColor: "#0A0A16",
    borderRadius: 12,
    alignItems: "center",
  },

  video: {
    width: 180,
    aspectRatio: 1,
    borderRadius: 12,
  },

  titleContainer: {
    gap: 6,
  },

  title: {
    width: "85%",
    height: 28,
  },

  titleShort: {
    width: "55%",
    height: 28,
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  pill: {
    width: 80,
    height: 30,
  },

  pillMedium: {
    width: 100,
    height: 30,
  },

  pillSmall: {
    width: 70,
    height: 30,
  },

  coachingContainer: {
    padding: 12,
    backgroundColor: "#14141F",
    borderRadius: 12,
    gap: 12,
  },

  coachingTitle: {
    width: 110,
    height: 20,
  },

  coachingText: {
    gap: 8,
  },

  textShort: {
    width: "65%",
  },
});

export default ExerciseDetailsSkeleton;
