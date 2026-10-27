import Skeleton from "@/components/ui/Skeleton";
import { Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { View } from "react-native";

const makeStyles = (c: ThemeColors) => ({
  container: {
    gap: Spacing.tight,
  },
  videoContainer: {
    paddingVertical: Spacing.five + Spacing.one,
    backgroundColor: c.surface,
    borderRadius: Radius.md,
    alignItems: "center" as const,
  },
  video: {
    width: 180,
    aspectRatio: 1,
    borderRadius: Radius.md,
  },
  titleContainer: {
    gap: 6,
  },
  title: {
    width: "85%" as const,
    height: 36,
  },
  titleShort: {
    width: "55%" as const,
    height: 36,
  },
  tagsContainer: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: Spacing.two,
  },
  pill: {
    width: 80,
    height: 26,
  },
  pillMedium: {
    width: 100,
    height: 26,
  },
  pillSmall: {
    width: 70,
    height: 26,
  },
  coachingContainer: {
    padding: Spacing.three,
    backgroundColor: c.surface,
    borderRadius: Radius.md,
    gap: Spacing.tight,
  },
  coachingTitle: {
    width: 110,
    height: 16,
  },
  coachingText: {
    gap: Spacing.two,
  },
  textShort: {
    width: "65%" as const,
  },
});

const ExerciseDetailsSkeleton = () => {
  const styles = useThemedStyles(makeStyles);

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
          <Skeleton variant="text" style={{ height: 16 }} />
          <Skeleton variant="text" style={{ height: 16 }} />
          <Skeleton variant="text" style={[{ height: 16 }, styles.textShort]} />
        </View>
      </View>
    </View>
  );
};

export default ExerciseDetailsSkeleton;
