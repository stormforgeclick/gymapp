import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useItemContext } from "react-native-sortables";

import { IconSize, Opacity } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

const DURATION = 200;

interface DragHandleProps {
  /** Whether the card can be dragged right now; the handle dims when it can't. */
  enabled: boolean;
  /** The routine color, shown on the handle while its card is being dragged. */
  color: string;
}

const makeStyles = () => ({
  handle: {
    width: IconSize.md,
    height: IconSize.md,
  },
  active: {
    position: "absolute" as const,
    top: 0,
    left: 0,
  },
});

/**
 * The grip that tells a card can be reordered. It is only a signal: the drag
 * starts from anywhere on the card, so it takes no touches and the screen
 * reader skips it (the card's title offers "move up" and "move down").
 *
 * It reads the dragged state from the sortable item, so it only works inside
 * `Sortable.Grid`, where the card is always drawn.
 */
const DragHandle = ({ enabled, color }: DragHandleProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const reduceMotion = useReducedMotion();
  const { isActive } = useItemContext();

  const availability = useSharedValue(enabled ? 1 : 0);
  useEffect(() => {
    const next = enabled ? 1 : 0;
    availability.value = reduceMotion ? next : withTiming(next, { duration: DURATION });
  }, [enabled, reduceMotion, availability]);

  const idleStyle = useAnimatedStyle(() => ({
    opacity: Opacity.disabled + (1 - Opacity.disabled) * availability.value,
  }));

  const activeStyle = useAnimatedStyle(() => {
    const target = isActive.value ? 1 : 0;
    return { opacity: reduceMotion ? target : withTiming(target, { duration: DURATION }) };
  });

  return (
    <View
      style={styles.handle}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={idleStyle}>
        <MaterialCommunityIcons
          name="drag-vertical"
          size={IconSize.md}
          color={theme.textSecondary}
        />
      </Animated.View>
      <Animated.View style={[styles.active, activeStyle]}>
        <MaterialCommunityIcons
          name="drag-vertical"
          size={IconSize.md}
          color={color}
        />
      </Animated.View>
    </View>
  );
};

export default DragHandle;
