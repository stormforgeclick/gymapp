import { BottomTabBarButtonProps } from "expo-router/build/react-navigation/bottom-tabs";
import { Pressable } from "react-native";

import { Opacity } from "@/constants/theme";

export function TabBarButton({
  style,
  children,
  ...props
}: BottomTabBarButtonProps) {
  const { ref, ...pressableProps } = props as any;

  return (
    <Pressable
      {...pressableProps}
      android_ripple={{ color: "transparent" }}
      style={({ pressed }) => [style, { opacity: pressed ? Opacity.pressed : 1 }]}
    >
      {children}
    </Pressable>
  );
}
