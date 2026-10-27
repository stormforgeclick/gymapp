import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Radius, type ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

interface ProgressBarProps {
  done: number;
  total: number;
  /** Fill color, normally the routine color. */
  color: string;
}

const makeStyles = (c: ThemeColors) => ({
  track: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: c.surfaceInput,
    overflow: "hidden" as const,
  },
  fill: {
    height: "100%" as const,
    borderRadius: Radius.pill,
  },
});

const ProgressBar = ({ done, total, color }: ProgressBarProps) => {
  const styles = useThemedStyles(makeStyles);
  const reduceMotion = useReducedMotion();

  const ratio = total > 0 ? Math.min(done / total, 1) : 0;
  const progress = useSharedValue(ratio);

  useEffect(() => {
    progress.value = reduceMotion ? ratio : withTiming(ratio, { duration: 200 });
  }, [ratio, reduceMotion, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View
      style={styles.track}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: done }}
    >
      <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
    </View>
  );
};

export default ProgressBar;
