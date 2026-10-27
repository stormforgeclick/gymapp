import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Pill from "@/components/ui/Pill";
import { Opacity, Radius, Spacing, type ThemeColors } from "@/constants/theme";
import type { RoutineExercise, SetInput } from "@/hooks/api/routineExercises/queries";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import { useDialog } from "@/providers/DialogProvider";
import SetEditor from "./SetEditor";

interface IProps {
  routineExercise: RoutineExercise;
  color: string;
  onDelete: () => void;
  onSave: (sets: SetInput[]) => void;
  isSaving: boolean;
  saveError: string | null;
  isDeleting: boolean;
}

const makeStyles = (c: ThemeColors) => ({
  container: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: Spacing.three,
    gap: Spacing.tight,
  },
  headerSection: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  titleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.two,
    flex: 1,
  },
  title: {
    flexShrink: 1,
  },
  actionsRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  actionButton: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: Spacing.two,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  setsReadList: {
    gap: Spacing.two,
  },
  setReadRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.tight,
  },
  setIndex: {
    width: 20,
    textAlign: "right" as const,
  },
});

const RoutineExerciseDetailComponent = ({
  routineExercise,
  color,
  onDelete,
  onSave,
  isSaving,
  saveError,
  isDeleting,
}: IProps) => {
  const { name, muscle_group, sets } = routineExercise;
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();
  const dialog = useDialog();

  const [editing, setEditing] = useState(false);

  const prevSavingRef = useRef(false);
  useEffect(() => {
    if (prevSavingRef.current && !isSaving && !saveError) {
      setEditing(false);
    }
    prevSavingRef.current = isSaving;
  }, [isSaving, saveError]);

  const handleDeletePress = () => {
    dialog.show({
      title: t("routineDetails.deleteConfirmTitle"),
      message: t("routineDetails.deleteConfirmMessage", { name }),
      actions: [
        { label: t("common.cancel"), variant: "cancel" },
        { label: t("common.delete"), variant: "destructive", onPress: onDelete },
      ],
    });
  };

  return (
    <ThemedView type="surface" style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <ThemedText type="titleSm" style={styles.title} numberOfLines={1}>
            {name}
          </ThemedText>
          {muscle_group && <Pill label={muscle_group} backgroundColor={color} />}
        </View>

        {!editing && (
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => setEditing(true)}
              accessibilityRole="button"
              accessibilityLabel={t("routineDetails.editExercise", { name })}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && { opacity: Opacity.pressed },
              ]}
            >
              <ThemedText type="label" tone="secondary">
                {t("common.edit")}
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={handleDeletePress}
              disabled={isDeleting}
              accessibilityRole="button"
              accessibilityLabel={t("routineDetails.deleteExercise", { name })}
              accessibilityHint={t("routineDetails.deleteExerciseHint")}
              accessibilityState={{ disabled: isDeleting, busy: isDeleting }}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && { opacity: Opacity.pressed },
              ]}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={theme.danger} />
              ) : (
                <ThemedText type="label" tone="danger">
                  {t("common.delete")}
                </ThemedText>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {!editing ? (
        <View style={styles.setsReadList}>
          {sets.map((s, i) => {
            const reps =
              s.min_reps === s.max_reps
                ? `${s.min_reps}`
                : `${s.min_reps}-${s.max_reps}`;
            return (
              <View
                key={s.id ?? i}
                style={styles.setReadRow}
                accessible={true}
                accessibilityLabel={
                  s.weight != null
                    ? t("routineDetails.setA11yWithWeight", {
                        n: i + 1,
                        reps,
                        weight: s.weight,
                      })
                    : t("routineDetails.setA11y", { n: i + 1, reps })
                }
              >
                <ThemedText type="caption" tone="secondary" tabular style={styles.setIndex}>
                  {i + 1}
                </ThemedText>
                <ThemedText type="label" tone="secondary" tabular>
                  {t("routineDetails.reps", { reps })}
                </ThemedText>
                {s.weight != null && (
                  <ThemedText type="label" tone="secondary" tabular>
                    {t("routineDetails.weight", { weight: s.weight })}
                  </ThemedText>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <SetEditor
          initialSets={sets}
          color={color}
          isSaving={isSaving}
          saveError={saveError}
          onSave={onSave}
          onCancel={() => setEditing(false)}
        />
      )}
    </ThemedView>
  );
};

export default RoutineExerciseDetailComponent;
