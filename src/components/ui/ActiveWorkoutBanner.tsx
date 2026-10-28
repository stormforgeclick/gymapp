import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  IconSize,
  Opacity,
  Radius,
  RoutineColors,
  Spacing,
  type ThemeColors,
} from "@/constants/theme";
import { useRoutines } from "@/hooks/api/routines";
import { useActiveWorkout } from "@/hooks/api/workouts";
import { useRoutineColor, useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";

const makeStyles = (c: ThemeColors) => ({
  card: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.tight,
    marginBottom: Spacing.tight,
    paddingRight: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    overflow: "hidden" as const,
  },
  // Spans the card's full height, so the vertical padding lives on `texts`.
  stripe: {
    alignSelf: "stretch" as const,
    width: 6,
  },
  texts: {
    flex: 1,
    paddingVertical: Spacing.tight,
  },
  action: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
});

/** Shown only while the user has an unfinished workout; tapping resumes it. */
const ActiveWorkoutBanner = () => {
  const router = useRouter();
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t, language } = useT();

  const { data: workout } = useActiveWorkout();
  const { data: routines } = useRoutines(language);

  const routine = routines?.find((r) => r.id === workout?.routine_id);
  const color = useRoutineColor(routine?.color ?? RoutineColors.routineOne);

  if (!workout) return null;

  const name = routine?.name ?? t("workout.title");

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/workout/[id]", params: { id: workout.id } })
      }
      accessibilityRole="button"
      accessibilityLabel={`${t("workout.inProgress")}. ${name}. ${t("workout.continue")}`}
      style={({ pressed }) => [styles.card, pressed && { opacity: Opacity.pressed }]}
    >
      <View style={[styles.stripe, { backgroundColor: color }]} />

      <View style={styles.texts}>
        <ThemedText type="overline" tone="secondary">
          {t("workout.inProgress")}
        </ThemedText>
        <ThemedText type="bodyStrong" numberOfLines={1}>
          {name}
        </ThemedText>
      </View>

      <View style={styles.action}>
        <ThemedText type="label" tone="accent">
          {t("workout.continue")}
        </ThemedText>
        <MaterialCommunityIcons
          name="chevron-right"
          size={IconSize.lg}
          color={theme.accentText}
        />
      </View>
    </Pressable>
  );
};

export default ActiveWorkoutBanner;
