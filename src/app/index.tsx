import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/AuthProvider";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet } from "react-native";

export default function Index() {
  const { session, isLoading } = useAuth();
  const theme = useTheme();

  if (isLoading) {
    return (
      <ThemedView style={styles.loader}>
        <ActivityIndicator color={theme.accentText} />
      </ThemedView>
    );
  }

  return <Redirect href={session ? "/(tabs)" : "/login"} />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
