import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  IconSize,
  Opacity,
  Radius,
  Spacing,
  type ThemeColors,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";

interface ExerciseTabsProps {
  exercises: { name: string; complete: boolean }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Fill of the selected tab, normally the routine color. */
  color: string;
}

// Tabs only navigate, so each one is a numbered circle. Names took a whole tab
// and were cut ("Zancada…" for three different exercises); the full name is shown
// right below and is what screen readers announce.
const TAB_SIZE = 44;
const TAB_GAP = Spacing.two;

const makeStyles = (c: ThemeColors) => ({
  tab: {
    width: TAB_SIZE,
    height: TAB_SIZE,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: c.surfaceInput,
  },
  tabSelected: {
    borderColor: c.edge,
  },
});

const ExerciseTabs = ({ exercises, selectedIndex, onSelect, color }: ExerciseTabsProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();
  const scrollRef = useRef<ScrollView>(null);

  // Keep the active tab in view when "Next" moves to an exercise off-screen.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      x: Math.max(selectedIndex * (TAB_SIZE + TAB_GAP) - Spacing.three, 0),
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
      {exercises.map(({ name, complete }, index) => {
        const selected = index === selectedIndex;

        return (
          <Pressable
            key={index}
            onPress={() => onSelect(index)}
            accessibilityRole="button"
            accessibilityLabel={t(complete ? "workout.tabDoneA11y" : "workout.tabA11y", {
              name,
              n: index + 1,
              total: exercises.length,
            })}
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.tab,
              selected && styles.tabSelected,
              selected && { backgroundColor: color },
              pressed && { opacity: Opacity.pressed },
            ]}
          >
            {complete ? (
              <MaterialCommunityIcons
                name="check"
                size={IconSize.md}
                color={selected ? theme.onPrimary : theme.accentText}
              />
            ) : (
              <ThemedText type="label" tone={selected ? "onPrimary" : "secondary"} tabular>
                {index + 1}
              </ThemedText>
            )}
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
