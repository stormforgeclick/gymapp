import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
import { Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

interface EmptyStateProps {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** `primary` for a call to create something, `outline` for a retry. */
  actionVariant?: "primary" | "outline";
  /** Announce the message to screen readers, for load failures. */
  alert?: boolean;
}

const makeStyles = (c: ThemeColors) => ({
  container: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: Spacing.three,
    paddingVertical: Spacing.five + Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    backgroundColor: c.surfaceInput,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  texts: {
    alignItems: "center" as const,
    gap: Spacing.one,
  },
  centered: {
    textAlign: "center" as const,
  },
});

const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = "outline",
  alert = false,
}: EmptyStateProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View
      style={styles.container}
      accessibilityRole={alert ? "alert" : undefined}
      accessibilityLiveRegion={alert ? "polite" : undefined}
    >
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons
          name={icon}
          size={32}
          color={theme.textSecondary}
          importantForAccessibility="no"
          accessibilityElementsHidden
        />
      </View>

      <View style={styles.texts}>
        <ThemedText type="bodyStrong" style={styles.centered}>
          {title}
        </ThemedText>
        {description && (
          <ThemedText type="label" tone="secondary" style={styles.centered}>
            {description}
          </ThemedText>
        )}
      </View>

      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          variant={actionVariant}
          fullWidth={false}
          onPress={onAction}
        />
      )}
    </View>
  );
};

export default EmptyState;
