import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

type SkeletonVariant = "text" | "image" | "pill" | "card";

type SkeletonProps = {
  variant?: SkeletonVariant;
  style?: StyleProp<ViewStyle>;
};

const Skeleton = ({ variant = "text", style }: SkeletonProps) => {
  const translateX = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: 100,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => animation.stop();
  }, [translateX]);

  return (
    <View style={[styles.container, styles[variant], style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#242432",
  },

  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: "#303044",
    opacity: 0.7,
    transform: [{ skewX: "-20deg" }],
  },

  text: {
    borderRadius: 4,
  },

  image: {
    borderRadius: 12,
  },

  pill: {
    borderRadius: 999,
  },

  card: {
    borderRadius: 10,
  },
});

export default Skeleton;
