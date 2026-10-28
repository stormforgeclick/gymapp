import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Opacity, Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for screen readers. */
  accessibilityLabel: string;
  disabled?: boolean;
}

const makeStyles = (c: ThemeColors) => ({
  track: {
    flexDirection: "row" as const,
    gap: Spacing.one,
    padding: Spacing.one,
    borderRadius: Radius.md,
    backgroundColor: c.surfaceInput,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.sm,
    // Reserved on every segment so selecting one doesn't shift the row.
    borderWidth: 1,
    borderColor: "transparent",
  },
  segmentSelected: {
    backgroundColor: c.primary,
    borderColor: c.edge,
  },
});

/** A short, mutually exclusive choice, e.g. a theme or a privacy level. */
const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  disabled = false,
}: SegmentedControlProps<T>) => {
  const styles = useThemedStyles(makeStyles);

  return (
    <View
      style={[styles.track, disabled && { opacity: Opacity.disabled }]}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected, disabled }}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              pressed && !selected && { opacity: Opacity.pressed },
            ]}
          >
            <ThemedText
              type="label"
              tone={selected ? "onPrimary" : "secondary"}
              numberOfLines={1}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
};

export default SegmentedControl;
