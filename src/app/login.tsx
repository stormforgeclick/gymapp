import { useAuth } from "@/providers/AuthProvider";
import { LoginView } from "@/views/Auth/LoginView";
import { Redirect } from "expo-router";

export default function LoginScreen() {
  const { session, isLoading } = useAuth();

  if (!isLoading && session) {
    return <Redirect href="/(tabs)" />;
  }

  return <LoginView />;
}
