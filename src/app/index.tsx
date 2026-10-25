import { useAuth } from "@/providers/AuthProvider";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color="#C8FF00" />
      </View>
    );
  }

  return <Redirect href={session ? "/(tabs)" : "/login"} />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: "#080810",
    alignItems: "center",
    justifyContent: "center",
  },
});
