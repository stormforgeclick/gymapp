import { useState } from "react";
import { TextInput, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import {
  Radius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/constants/theme";
import type {
  RoutineExerciseSet,
  SetInput,
} from "@/hooks/api/routineExercises/queries";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import { defaultDraftSet } from "../utils/defaultDraftSet";
import { parseDraftSets, type DraftSet } from "../utils/parseDraftSets";

function toDraft(sets: RoutineExerciseSet[]): DraftSet[] {
  if (sets.length === 0) {
    const d = defaultDraftSet();
    return [{ reps: String(d.min_reps), weight: "" }];
  }
  return sets.map((s) => ({
    id: s.id,
    reps: String(s.min_reps),
    weight: s.weight != null ? String(s.weight) : "",
  }));
}

interface IProps {
  initialSets: RoutineExerciseSet[];
  color: string;
  isSaving: boolean;
  saveError: string | null;
  onSave: (sets: SetInput[]) => void;
  onCancel: () => void;
}

const makeStyles = (c: ThemeColors) => ({
  container: {
    gap: Spacing.two,
  },
  setEditRow: {
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    gap: Spacing.two,
  },
  setIndex: {
    width: 20,
    textAlign: "right" as const,
    // Aligns the index with the input text rather than the REPS/KG label.
    paddingBottom: Spacing.tight,
  },
  inputGroup: {
    flex: 1,
    gap: Spacing.one,
  },
  input: {
    minHeight: 44,
    backgroundColor: c.surfaceInput,
    borderRadius: Radius.md,
    color: c.text,
    textAlign: "center" as const,
    paddingVertical: Spacing.two,
    fontFamily: Typography.bodyStrong.fontFamily,
    fontSize: Typography.bodyStrong.fontSize,
    fontVariant: ["tabular-nums" as const],
  },
  addSetButton: {
    minHeight: 44,
    marginTop: Spacing.one,
  },
  saveButton: {
    marginTop: Spacing.one,
  },
});

const SetEditor = ({
  initialSets,
  color,
  isSaving,
  saveError,
  onSave,
  onCancel,
}: IProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();

  const [draft, setDraft] = useState<DraftSet[]>(() => toDraft(initialSets));
  const [validationError, setValidationError] = useState<string | null>(null);

  const addRow = () => {
    const last = draft[draft.length - 1];
    setDraft((d) => [
      ...d,
      { reps: last?.reps ?? "0", weight: last?.weight ?? "" },
    ]);
  };

  const removeRow = (i: number) => {
    setDraft((d) => d.filter((_, idx) => idx !== i));
  };

  const updateRow = (i: number, field: "reps" | "weight", value: string) => {
    setDraft((d) => d.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const handleSave = () => {
    const parsed = parseDraftSets(draft);
    if ("error" in parsed) {
      setValidationError(
        t(parsed.error === "reps" ? "sets.repsError" : "sets.weightError")
      );
      return;
    }
    setValidationError(null);
    onSave(parsed.sets);
  };

  const errorToShow = validationError ?? saveError;
  const onlyOneRow = draft.length === 1;

  return (
    <View style={styles.container}>
      {draft.map((d, i) => (
        <View key={i} style={styles.setEditRow}>
          <ThemedText type="caption" tone="secondary" tabular style={styles.setIndex}>
            {i + 1}
          </ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText type="caption" tone="secondary" accessibilityElementsHidden>
              {t("sets.reps")}
            </ThemedText>
            <TextInput
              style={styles.input}
              value={d.reps}
              onChangeText={(v) => updateRow(i, "reps", v)}
              keyboardType="numeric"
              selectTextOnFocus
              accessibilityLabel={t("sets.repsA11y")}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="caption" tone="secondary" accessibilityElementsHidden>
              {t("sets.kg")}
            </ThemedText>
            <TextInput
              style={styles.input}
              value={d.weight}
              onChangeText={(v) => updateRow(i, "weight", v)}
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor={theme.textTertiary}
              selectTextOnFocus
              accessibilityLabel={t("sets.weightA11y")}
            />
          </View>

          <IconButton
            icon="trash-can-outline"
            variant="filled"
            color={theme.surfaceInput}
            iconColor={onlyOneRow ? theme.textTertiary : theme.danger}
            onPress={() => removeRow(i)}
            disabled={onlyOneRow || isSaving}
            accessibilityLabel={t("sets.deleteSet", { n: i + 1 })}
          />
        </View>
      ))}

      <Button
        label={t("sets.addSet")}
        variant="outline"
        dashed
        size="sm"
        leftIcon="plus"
        onPress={addRow}
        style={styles.addSetButton}
      />

      {errorToShow ? (
        <ThemedText
          type="caption"
          tone="danger"
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {errorToShow}
        </ThemedText>
      ) : null}

      <Button
        label={t("sets.save")}
        color={color}
        onPress={handleSave}
        loading={isSaving}
        style={styles.saveButton}
      />

      <Button
        label={t("common.cancel")}
        variant="ghost"
        onPress={onCancel}
        disabled={isSaving}
        accessibilityLabel={t("sets.cancelA11y")}
      />
    </View>
  );
};

export default SetEditor;
