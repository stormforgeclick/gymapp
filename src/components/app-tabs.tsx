import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useTheme } from "@/hooks/use-theme";
import { TabBarButton } from "./ui/TabBarButton";

export default function AppTabs() {
  const colors = useTheme();

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
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="routines"
        options={{
          title: "Rutinas",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dumbbell" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: "Ejercicios",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="list-box" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
