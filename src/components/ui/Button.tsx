import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";

import { TextTone, ThemedText } from "@/components/themed-text";
import { IconSize, Opacity, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "md" | "sm";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ComponentProps<typeof MaterialCommunityIcons>["name"];
  /** Custom fill for primary buttons (e.g. a routine color). Text stays `onPrimary`. */
  color?: string;
  /** Dashed outline, for "add" affordances. */
  dashed?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

const TEXT_TONE: Record<ButtonVariant, TextTone> = {
  primary: "onPrimary",
  secondary: "default",
  outline: "secondary",
  ghost: "secondary",
  danger: "danger",
};

const Button = ({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  leftIcon,
  color,
  dashed = false,
  fullWidth = true,
  accessibilityLabel,
  accessibilityHint,
  style,
}: ButtonProps) => {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const tone = TEXT_TONE[variant];

  const foreground = {
    onPrimary: theme.onPrimary,
    default: theme.text,
    secondary: theme.textSecondary,
    danger: theme.danger,
    tertiary: theme.textTertiary,
    accent: theme.accentText,
  }[tone];

  const background =
    variant === "primary"
      ? (color ?? theme.primary)
      : variant === "secondary"
        ? theme.surfaceInput
        : "transparent";

  const borderColor =
    variant === "danger"
      ? theme.danger
      : variant === "outline"
        ? theme.textSecondary
        : variant === "primary"
          ? theme.edge
          : undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={size === "sm" ? 4 : undefined}
      style={({ pressed }) => [
        styles.base,
        size === "md" ? styles.md : styles.sm,
        fullWidth ? styles.fullWidth : styles.autoWidth,
        { backgroundColor: background },
        borderColor !== undefined && {
          borderColor,
          borderWidth: 1,
          borderStyle: dashed && variant === "outline" ? "dashed" : "solid",
        },
        isDisabled && { opacity: Opacity.disabled },
        pressed && !isDisabled && { opacity: Opacity.pressed },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {leftIcon && (
            <MaterialCommunityIcons
              name={leftIcon}
              size={IconSize.md}
              color={foreground}
              importantForAccessibility="no"
              accessibilityElementsHidden
            />
          )}
          <ThemedText
            type={size === "md" ? "bodyStrong" : "label"}
            tone={tone}
            numberOfLines={1}
          >
            {label}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    borderRadius: Radius.md,
  },
  md: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
  },
  sm: {
    minHeight: 36,
    paddingHorizontal: Spacing.tight,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  autoWidth: {
    alignSelf: "flex-start",
  },
});

export default Button;
