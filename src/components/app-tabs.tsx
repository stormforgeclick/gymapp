import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { usePendingRequestCount } from "@/hooks/api/gymbros";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/i18n";
import { TabBarButton } from "./ui/TabBarButton";

export default function AppTabs() {
  const colors = useTheme();
  const { t } = useT();
  const { data: pendingRequests = 0 } = usePendingRequestCount();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarButton: TabBarButton,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="routines"
        options={{
          title: t("tabs.routines"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dumbbell" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="gymbros"
        options={{
          title: t("tabs.gymbros"),
          tabBarBadge: pendingRequests > 0 ? pendingRequests : undefined,
          tabBarAccessibilityLabel:
            pendingRequests > 0
              ? t("tabs.gymbrosPending", { count: pendingRequests })
              : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
