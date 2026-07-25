import { ReactNode } from "react";
import { StyleSheet, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedView } from "../themed-view";

type ScreenContainerProps = ViewProps & {
  children: ReactNode;
};

export function ScreenContainer({
  children,
  style,
  ...props
}: ScreenContainerProps) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea} {...props}>
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
    paddingHorizontal: 20,
  },
});
