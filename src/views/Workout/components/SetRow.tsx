import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  IconSize,
  Opacity,
  Radius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/constants/theme";
import type { WorkoutSet, WorkoutSetPatch } from "@/hooks/api/workouts/queries";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";

interface SetRowProps {
  set: WorkoutSet;
  /** Display number (1-based), independent of the stored position. */
  number: number;
  /** Planned reps shown as a hint while the field is empty. */
  placeholderReps: number | null;
  onChange: (patch: WorkoutSetPatch) => void;
}

/** `null` = empty field, `undefined` = not a valid value. */
function parseNumber(text: string, integer: boolean): number | null | undefined {
  const normalized = text.trim().replace(",", ".");
  if (normalized === "") return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return undefined;
  if (integer && !Number.isInteger(value)) return undefined;
  return value;
}

const format = (value: number | null) => (value === null ? "" : String(value));

export const COLUMN_NUMBER_WIDTH = 40;
export const COLUMN_CHECK_WIDTH = 44;

const makeStyles = (c: ThemeColors) => ({
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.two,
    paddingVertical: Spacing.one + Spacing.half,
    paddingHorizontal: Spacing.tight,
  },
  rowDone: {
    backgroundColor: c.surfaceElevated,
  },
  number: {
    width: COLUMN_NUMBER_WIDTH,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.md,
    backgroundColor: c.surfaceInput,
    color: c.text,
    textAlign: "center" as const,
    paddingVertical: Spacing.one,
    fontFamily: Typography.bodyStrong.fontFamily,
    fontSize: Typography.bodyStrong.fontSize,
    fontVariant: ["tabular-nums" as const],
  },
  checkHitArea: {
    width: COLUMN_CHECK_WIDTH,
    height: COLUMN_CHECK_WIDTH,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceInput,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  checkDone: {
    backgroundColor: c.primary,
    borderColor: c.edge,
  },
});

const SetRow = ({ set, number, placeholderReps, onChange }: SetRowProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();

  const [weightText, setWeightText] = useState(format(set.weight));
  const [repsText, setRepsText] = useState(format(set.reps));
  const [syncedWeight, setSyncedWeight] = useState(set.weight);
  const [syncedReps, setSyncedReps] = useState(set.reps);

  // Pick up server-side changes, e.g. a failed save being rolled back.
  if (syncedWeight !== set.weight) {
    setSyncedWeight(set.weight);
    setWeightText(format(set.weight));
  }
  if (syncedReps !== set.reps) {
    setSyncedReps(set.reps);
    setRepsText(format(set.reps));
  }

  const commitWeight = () => {
    const value = parseNumber(weightText, false);
    if (value === undefined) {
      setWeightText(format(set.weight));
      return;
    }
    if (value !== set.weight) onChange({ weight: value });
  };

  const commitReps = () => {
    const value = parseNumber(repsText, true);
    if (value === undefined) {
      setRepsText(format(set.reps));
      return;
    }
    if (value !== set.reps) onChange({ reps: value });
  };

  // Marking a set done also saves whatever is typed, and falls back to the
  // planned reps when none were entered, so "did what I planned" is one tap.
  const toggleDone = () => {
    if (set.completed) {
      onChange({ completed: false });
      return;
    }

    const patch: WorkoutSetPatch = { completed: true };

    const weight = parseNumber(weightText, false);
    if (weight !== undefined && weight !== set.weight) patch.weight = weight;

    const reps = parseNumber(repsText, true) ?? set.reps ?? placeholderReps;
    if (reps !== null && reps !== set.reps) {
      patch.reps = reps;
      setRepsText(format(reps));
    }

    onChange(patch);
  };

  return (
    <View style={[styles.row, set.completed && styles.rowDone]}>
      <ThemedText type="bodyStrong" tabular style={styles.number}>
        {number}
      </ThemedText>

      <TextInput
        style={styles.input}
        value={weightText}
        onChangeText={setWeightText}
        onBlur={commitWeight}
        keyboardType="decimal-pad"
        selectTextOnFocus
        placeholder="0"
        placeholderTextColor={theme.textTertiary}
        accessibilityLabel={t("workout.weightA11y", { n: number })}
      />

      <TextInput
        style={styles.input}
        value={repsText}
        onChangeText={setRepsText}
        onBlur={commitReps}
        keyboardType="number-pad"
        selectTextOnFocus
        placeholder={placeholderReps !== null ? String(placeholderReps) : "0"}
        placeholderTextColor={theme.textTertiary}
        accessibilityLabel={t("workout.repsA11y", { n: number })}
      />

      <Pressable
        onPress={toggleDone}
        style={({ pressed }) => [
          styles.checkHitArea,
          pressed && { opacity: Opacity.pressed },
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: set.completed }}
        accessibilityLabel={t("workout.doneA11y", { n: number })}
      >
        <View style={[styles.check, set.completed && styles.checkDone]}>
          {set.completed && (
            <MaterialCommunityIcons
              name="check"
              size={IconSize.md}
              color={theme.onPrimary}
            />
          )}
        </View>
      </Pressable>
    </View>
  );
};

export default SetRow;
