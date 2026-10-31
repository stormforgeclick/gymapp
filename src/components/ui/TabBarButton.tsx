import { BottomTabBarButtonProps } from "expo-router/build/react-navigation/bottom-tabs";
import { Pressable, type PressableProps } from "react-native";

import { Opacity } from "@/constants/theme";

export function TabBarButton({
  style,
  children,
  ...props
}: BottomTabBarButtonProps) {
  // The tab bar passes a `ref` that Pressable does not take as a prop.
  const { ref, ...pressableProps } = props as unknown as PressableProps & {
    ref?: unknown;
  };

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
