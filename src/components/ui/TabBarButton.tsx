import { BottomTabBarButtonProps } from "expo-router/build/react-navigation/bottom-tabs";
import { Pressable } from "react-native";

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
      style={({ pressed }) => [
        style,
        {
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      {children}
    </Pressable>
  );
}
