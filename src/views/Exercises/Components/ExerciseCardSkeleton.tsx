import Skeleton from "@/components/ui/Skeleton";
import { Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

import { View } from "react-native";

const makeStyles = (c: ThemeColors) => ({
  card: {
    backgroundColor: c.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: Spacing.three,

    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.tight,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
  },
  textContainer: {
    flex: 1,
    gap: 6,
  },
  name: {
    width: "80%" as const,
    height: 14,
    borderRadius: 4,
  },
  nameShort: {
    width: "50%" as const,
    height: 14,
    borderRadius: 4,
  },
  icon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});

const ExerciseCardSkeleton = () => {
  const styles = useThemedStyles(makeStyles);

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

export default ExerciseCardSkeleton;
