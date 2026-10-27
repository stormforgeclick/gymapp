import { ReactNode } from "react";
import { StyleProp, StyleSheet, ViewProps, ViewStyle } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";
import { ThemedView } from "../themed-view";

type ScreenContainerProps = ViewProps & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Pass `["top", "bottom"]` on screens that sit outside the tab bar. */
  edges?: Edge[];
};

export function ScreenContainer({
  children,
  style,
  edges = ["top"],
  ...props
}: ScreenContainerProps) {
  return (
    <ThemedView style={[styles.container, style]}>
      <SafeAreaView edges={edges} style={styles.safeArea} {...props}>
        {children}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.comfy,
  },
});
