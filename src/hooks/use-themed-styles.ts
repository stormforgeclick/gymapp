import { useMemo } from "react";
import { StyleSheet } from "react-native";

import type { ThemeColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * Builds a StyleSheet from the active theme palette. Pass a factory defined at
 * module level so its identity is stable and the sheet is only rebuilt when
 * the color scheme changes.
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ThemeColors) => T,
) {
  const colors = useTheme();

  return useMemo(() => StyleSheet.create(factory(colors)), [colors, factory]);
}
