import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Button from "@/components/ui/Button";
import { Opacity, Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";

interface IProps {
  title: string;
  subtitle: string;
  color: string;
  /** Starts the workout (or resumes it when `resuming`). */
  action: () => void;
  /** Tapping the card body, e.g. to open the routine. */
  onPress: () => void;
  /** This routine is the one with an unfinished workout. */
  resuming?: boolean;
  disabled?: boolean;
}

const makeStyles = (c: ThemeColors) => ({
  container: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: c.border,
  },
  leftContent: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.tight,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  textContainer: {
    flex: 1,
  },
});

const DayRoutineComponent = ({
  color,
  title,
  subtitle,
  action,
  onPress,
  resuming = false,
  disabled = false,
}: IProps) => {
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();

  return (
    <ThemedView type="surface" style={styles.container}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${subtitle}`}
        style={({ pressed }) => [
          styles.leftContent,
          pressed && { opacity: Opacity.pressed },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: color }]} />

        <View style={styles.textContainer}>
          <ThemedText type="bodyStrong" numberOfLines={1}>
            {title}
          </ThemedText>
          <ThemedText type="caption" tone="secondary">
            {subtitle}
          </ThemedText>
        </View>
      </Pressable>

      <Button
        label={resuming ? t("workout.continue") : t("home.go")}
        size="sm"
        color={color}
        fullWidth={false}
        disabled={disabled}
        onPress={action}
        accessibilityLabel={
          resuming
            ? `${t("workout.resume")}: ${title}`
            : t("home.goA11y", { title })
        }
      />
    </ThemedView>
  );
};

export default DayRoutineComponent;
