import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { Radius, Spacing, type ThemeColors } from "@/constants/theme";
import type {
  WorkoutExercise,
  WorkoutSetPatch,
} from "@/hooks/api/workouts/queries";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import SetRow, { COLUMN_CHECK_WIDTH, COLUMN_NUMBER_WIDTH } from "./SetRow";

interface SetsTableProps {
  exercise: WorkoutExercise;
  onUpdateSet: (setId: string, patch: WorkoutSetPatch) => void;
  onAddSet: () => void;
  onRemoveLastSet: () => void;
}

const makeStyles = (c: ThemeColors) => ({
  card: {
    backgroundColor: c.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    overflow: "hidden" as const,
  },
  headerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.two,
    paddingVertical: Spacing.tight,
    paddingHorizontal: Spacing.tight,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  headerNumber: {
    width: COLUMN_NUMBER_WIDTH,
  },
  headerCell: {
    flex: 1,
    textAlign: "center" as const,
  },
  headerCheck: {
    width: COLUMN_CHECK_WIDTH,
  },
  footer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.tight,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  footerSpacer: {
    width: COLUMN_CHECK_WIDTH,
  },
});

const SetsTable = ({
  exercise,
  onUpdateSet,
  onAddSet,
  onRemoveLastSet,
}: SetsTableProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();

  // Sets added during the workout have no planned reps, so they inherit the
  // hint from the set above.
  let fallbackReps: number | null = null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText type="caption" tone="secondary" style={styles.headerNumber}>
          {t("workout.colSet")}
        </ThemedText>
        <ThemedText type="caption" tone="secondary" style={styles.headerCell}>
          {t("workout.colWeight")}
        </ThemedText>
        <ThemedText type="caption" tone="secondary" style={styles.headerCell}>
          {t("workout.colReps")}
        </ThemedText>
        <View style={styles.headerCheck} />
      </View>

      {exercise.sets.map((set, index) => {
        const placeholderReps = set.target_min_reps ?? set.reps ?? fallbackReps;
        fallbackReps = placeholderReps;

        return (
          <SetRow
            key={set.id}
            set={set}
            number={index + 1}
            placeholderReps={placeholderReps}
            onChange={(patch) => onUpdateSet(set.id, patch)}
          />
        );
      })}

      <View style={styles.footer}>
        <View style={styles.footerSpacer} />
        <Button
          label={t("workout.addSet")}
          variant="ghost"
          size="sm"
          leftIcon="plus"
          fullWidth={false}
          onPress={onAddSet}
        />
        <IconButton
          icon="trash-can-outline"
          iconColor={theme.danger}
          onPress={onRemoveLastSet}
          disabled={exercise.sets.length <= 1}
          accessibilityLabel={t("workout.removeLastSet")}
        />
      </View>
    </View>
  );
};

export default SetsTable;
