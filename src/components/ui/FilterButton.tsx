import { Pressable } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  Opacity,
  Radius,
  Spacing,
  type ThemeColors,
} from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

type FilterButtonProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

const capitalizeWords = (text: string) =>
  text.replace(/\b\w/g, (char) => char.toUpperCase());

const makeStyles = (c: ThemeColors) => ({
  button: {
    minHeight: 36,
    justifyContent: "center" as const,
    paddingHorizontal: Spacing.tight,
    borderRadius: Radius.pill,
    backgroundColor: c.surfaceInput,
    // Reserved on every chip so selecting one doesn't shift the row by 2px.
    borderWidth: 1,
    borderColor: "transparent",
  },
  buttonSelected: {
    backgroundColor: c.primary,
    borderColor: c.edge,
  },
});

const FilterButton = ({
  label,
  selected = false,
  onPress,
}: FilterButtonProps) => {
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      style={({ pressed }) => [
        styles.button,
        selected && styles.buttonSelected,
        pressed && { opacity: Opacity.pressed },
      ]}
    >
      <ThemedText type="bodyStrong" tone={selected ? "onPrimary" : "secondary"}>
        {capitalizeWords(label)}
      </ThemedText>
    </Pressable>
  );
};

export default FilterButton;
