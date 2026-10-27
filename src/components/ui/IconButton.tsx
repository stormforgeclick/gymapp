import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";

import { IconSize, Opacity, Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

interface IconButtonProps {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  onPress: () => void;
  accessibilityLabel: string;
  variant?: "plain" | "filled";
  /** Fill color for `filled` (defaults to the brand primary). */
  color?: string;
  /** Glyph color; defaults to `onPrimary` when filled, `text` otherwise. */
  iconColor?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const IconButton = ({
  icon,
  onPress,
  accessibilityLabel,
  variant = "plain",
  color,
  iconColor,
  disabled = false,
  style,
}: IconButtonProps) => {
  const theme = useTheme();
  const filled = variant === "filled";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        filled && {
          backgroundColor: color ?? theme.primary,
          borderWidth: 1,
          borderColor: theme.edge,
        },
        disabled && { opacity: Opacity.disabled },
        pressed && !disabled && { opacity: Opacity.pressed },
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={IconSize.lg}
        color={iconColor ?? (filled ? theme.onPrimary : theme.text)}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default IconButton;
