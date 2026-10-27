import { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  Opacity,
  Radius,
  Spacing,
  type ThemeColors,
} from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";

interface ExerciseTabsProps {
  names: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Fill of the selected tab, normally the routine color. */
  color: string;
}

// Tabs only navigate, so they share one width and cut long names; the full
// name is shown right below them and is what screen readers announce.
const TAB_WIDTH = 88;
const TAB_GAP = Spacing.two;

const makeStyles = (c: ThemeColors) => ({
  tab: {
    width: TAB_WIDTH,
    height: 40,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: c.surfaceInput,
  },
  tabSelected: {
    borderColor: c.edge,
  },
  label: {
    textAlign: "center" as const,
  },
});

const capitalize = (text: string) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

const ExerciseTabs = ({ names, selectedIndex, onSelect, color }: ExerciseTabsProps) => {
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();
  const scrollRef = useRef<ScrollView>(null);

  // Keep the active tab in view when "Next" moves to an exercise off-screen.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      x: Math.max(selectedIndex * (TAB_WIDTH + TAB_GAP) - Spacing.three, 0),
      animated: true,
    });
  }, [selectedIndex]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={listStyles.list}
      style={listStyles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      {names.map((name, index) => {
        const selected = index === selectedIndex;

        return (
          <Pressable
            key={index}
            onPress={() => onSelect(index)}
            hitSlop={{ top: 2, bottom: 2 }}
            accessibilityRole="button"
            accessibilityLabel={t("workout.tabA11y", {
              name,
              n: index + 1,
              total: names.length,
            })}
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.tab,
              selected && styles.tabSelected,
              selected && { backgroundColor: color },
              pressed && { opacity: Opacity.pressed },
            ]}
          >
            <ThemedText
              type="label"
              tone={selected ? "onPrimary" : "secondary"}
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.label}
            >
              {capitalize(name)}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const listStyles = StyleSheet.create({
  // Keeps the row at tab height instead of stretching in a flex column.
  scroll: {
    flexGrow: 0,
  },
  list: {
    gap: TAB_GAP,
    paddingVertical: Spacing.one,
  },
});

export default ExerciseTabs;
