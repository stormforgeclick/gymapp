import Skeleton from "@/components/ui/Skeleton";
import { Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { View } from "react-native";

const makeStyles = (c: ThemeColors) => ({
  card: {
    backgroundColor: c.surface,
    borderRadius: Radius.md,
    padding: Spacing.tight,
    gap: Spacing.two,
  },
  name: {
    width: "45%" as const,
    height: 22,
  },
  quantity: {
    width: "30%" as const,
    height: 14,
  },
  tags: {
    flexDirection: "row" as const,
    gap: Spacing.two,
    marginTop: Spacing.tight,
  },
  tag: {
    width: 64,
    height: 22,
  },
});

const RoutineSkeleton = () => {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.card}>
      <Skeleton variant="text" style={styles.name} />
      <Skeleton variant="text" style={styles.quantity} />

      <View style={styles.tags}>
        <Skeleton variant="pill" style={styles.tag} />
        <Skeleton variant="pill" style={styles.tag} />
      </View>
    </View>
  );
};

export default RoutineSkeleton;
