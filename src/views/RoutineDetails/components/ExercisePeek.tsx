import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import CustomImage from "@/components/ui/CustomImage";
import { Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { capitalize } from "@/lib/text";

const GIF_SIZE = 220;

interface ExercisePeekProps {
  exercise: {
    id: string;
    name: string;
    category: string;
    equipment: string;
    image: string;
    gif_url?: string | null;
    target?: string | null;
  };
}

const makeStyles = (c: ThemeColors) => ({
  card: {
    alignItems: "center" as const,
    gap: Spacing.tight,
    padding: Spacing.three,
    maxWidth: 300,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceElevated,
  },
  gif: {
    width: GIF_SIZE,
    height: GIF_SIZE,
    borderRadius: Radius.md,
    backgroundColor: c.surfaceInput,
  },
  texts: {
    alignItems: "center" as const,
    gap: Spacing.half,
  },
  centered: {
    textAlign: "center" as const,
  },
});

/**
 * A quick look at an exercise while its row is held down. It is a plain view
 * with `pointerEvents="none"`, not a Modal: a Modal would take the touch from
 * the row and close the preview the moment it appeared.
 */
const ExercisePeek = ({ exercise }: ExercisePeekProps) => {
  const styles = useThemedStyles(makeStyles);
  const reduceMotion = useReducedMotion();

  const details = [exercise.target, exercise.equipment]
    .filter(Boolean)
    .map((part) => capitalize(part as string))
    .join(" · ");

  return (
    <Animated.View
      pointerEvents="none"
      entering={reduceMotion ? undefined : FadeIn.duration(150)}
      style={[StyleSheet.absoluteFill, peekStyles.scrim]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.card}>
        <CustomImage
          source={{ uri: exercise.gif_url ?? exercise.image }}
          style={styles.gif}
          contentFit="contain"
          autoplay={!reduceMotion}
        />

        <View style={styles.texts}>
          <ThemedText type="titleSm" style={styles.centered} numberOfLines={2}>
            {capitalize(exercise.name)}
          </ThemedText>
          {!!details && (
            <ThemedText type="label" tone="secondary" style={styles.centered}>
              {details}
            </ThemedText>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const peekStyles = StyleSheet.create({
  scrim: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
});

export default ExercisePeek;
