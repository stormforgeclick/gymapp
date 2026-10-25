import { useAuth } from "@/providers/AuthProvider";
import { RegisterView } from "@/views/Auth/RegisterView";
import { Redirect } from "expo-router";

export default function RegisterScreen() {
  const { session, isLoading } = useAuth();

  if (!isLoading && session) {
    return <Redirect href="/(tabs)" />;
  }

  return <RegisterView />;
}
