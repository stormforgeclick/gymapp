import { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Radius, type ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

type SkeletonVariant = "text" | "image" | "pill" | "card";

type SkeletonProps = {
  variant?: SkeletonVariant;
  style?: StyleProp<ViewStyle>;
};

const makeStyles = (c: ThemeColors) => ({
  container: {
    overflow: "hidden" as const,
    backgroundColor: c.surfaceInput,
  },
  text: {
    borderRadius: 4,
  },
  image: {
    borderRadius: Radius.md,
  },
  pill: {
    borderRadius: Radius.pill,
  },
  card: {
    borderRadius: Radius.md,
  },
});

const Skeleton = ({ variant = "text", style }: SkeletonProps) => {
  const styles = useThemedStyles(makeStyles);
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 0;
      return;
    }

    progress.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    return () => cancelAnimation(progress);
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * 0.5,
  }));

  return (
    <Animated.View
      style={[styles.container, styles[variant], animatedStyle, style]}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
};

export default Skeleton;
