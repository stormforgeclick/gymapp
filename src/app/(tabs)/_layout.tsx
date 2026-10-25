import { useAuth } from "@/providers/AuthProvider";
import { Redirect } from "expo-router";
import AppTabs from "@/components/app-tabs";

export default function TabsLayout() {
  const { session, isLoading } = useAuth();

  if (!isLoading && !session) {
    return <Redirect href="/login" />;
  }

  return <AppTabs />;
}
