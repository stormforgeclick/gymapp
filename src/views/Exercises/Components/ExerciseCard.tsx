import { ThemedText } from "@/components/themed-text";
import CustomImage from "@/components/ui/CustomImage";
import { IconSize, Opacity, Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { capitalize } from "@/lib/text";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, ReactNode } from "react";
import { Pressable, View } from "react-native";

type Exercise = {
  id: string;
  name: string;
  image: string;
  category: string;
  equipment: string;
};

interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: () => void;
  rightSlot?: ReactNode;
  disabled?: boolean;
  dimmed?: boolean;
  accessibilityLabel?: string;
}

const makeStyles = (c: ThemeColors) => ({
  card: {
    backgroundColor: c.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: Spacing.three,
  },
  cardContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.tight,
  },
  imageContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    overflow: "hidden" as const,
    backgroundColor: c.surfaceInput,
  },
  imageDimmed: {
    opacity: 0.5,
  },
  image: {
    width: "100%" as const,
    height: "100%" as const,
    borderRadius: Radius.md,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    justifyContent: "center" as const,
  },
  rightSlot: {
    minWidth: 32,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexShrink: 0,
  },
});

const ExerciseCard = ({
  exercise,
  onPress,
  rightSlot,
  disabled,
  dimmed,
  accessibilityLabel,
}: ExerciseCardProps) => {
  const router = useRouter();
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push(`/exercises/${exercise.id}`);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && !disabled && { opacity: Opacity.pressed },
      ]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? exercise.name}
      accessibilityState={{ disabled: !!disabled }}
      android_ripple={{ color: theme.border }}
    >
      <View style={styles.cardContent}>
        <View style={[styles.imageContainer, dimmed && styles.imageDimmed]}>
          <CustomImage source={{ uri: exercise.image }} style={styles.image} />
        </View>

        <View style={styles.textContainer}>
          <ThemedText
            type="bodyStrong"
            tone={dimmed ? "tertiary" : "default"}
            numberOfLines={2}
          >
            {capitalize(exercise.name)}
          </ThemedText>
          <ThemedText type="label" tone="secondary">
            {capitalize(exercise.category)}
            {exercise.equipment ? ` • ${capitalize(exercise.equipment)}` : ""}
          </ThemedText>
        </View>

        <View style={styles.rightSlot}>
          {rightSlot ?? (
            <MaterialCommunityIcons
              name="chevron-right"
              size={IconSize.lg}
              color={theme.textTertiary}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
};

export default memo(ExerciseCard);
