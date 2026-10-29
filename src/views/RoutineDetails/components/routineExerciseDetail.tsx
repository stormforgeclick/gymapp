import { AccessibilityInfo, ActivityIndicator, Pressable, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Pill from "@/components/ui/Pill";
import { Opacity, Radius, Spacing, type ThemeColors } from "@/constants/theme";
import type { RoutineExercise, SetInput } from "@/hooks/api/routineExercises/queries";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import { capitalize } from "@/lib/text";
import { useDialog } from "@/providers/DialogProvider";
import DragHandle from "./DragHandle";
import SetEditor from "./SetEditor";
import SetsReadList from "./SetsReadList";

interface IProps {
  routineExercise: RoutineExercise;
  color: string;
  onDelete: () => void;
  onSave: (sets: SetInput[]) => void;
  isSaving: boolean;
  saveError: string | null;
  isDeleting: boolean;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  /** Position in the routine, for the screen reader and its move actions. */
  index: number;
  total: number;
  /** Whether the card can be moved now; the screen decides, see `canDrag`. */
  canMove: boolean;
  onMove: (to: number) => void;
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
});

const RoutineExerciseDetailComponent = ({
  routineExercise,
  color,
  onDelete,
  onSave,
  isSaving,
  saveError,
  isDeleting,
  editing,
  onEditingChange,
  index,
  total,
  canMove,
  onMove,
}: IProps) => {
  const { name, muscle_group, sets } = routineExercise;
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();
  const dialog = useDialog();

  // Dragging is the visual way to reorder; this is the one for screen readers.
  const moveActions = canMove
    ? [
        ...(index > 0
          ? [{ name: "moveUp", label: t("routineDetails.reorder.moveUp") }]
          : []),
        ...(index < total - 1
          ? [{ name: "moveDown", label: t("routineDetails.reorder.moveDown") }]
          : []),
      ]
    : [];

  const move = (to: number) => {
    onMove(to);
    AccessibilityInfo.announceForAccessibility(
      t("routineDetails.reorder.moved", {
        name: capitalize(name),
        n: to + 1,
        total,
      })
    );
  };

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
        <View
          style={styles.titleRow}
          accessible
          accessibilityLabel={t("routineDetails.reorder.rowA11y", {
            name: capitalize(name),
            n: index + 1,
            total,
          })}
          accessibilityHint={
            moveActions.length > 0 ? t("routineDetails.reorder.a11yHint") : undefined
          }
          accessibilityActions={moveActions}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "moveUp") move(index - 1);
            if (event.nativeEvent.actionName === "moveDown") move(index + 1);
          }}
        >
          {total >= 2 && <DragHandle enabled={canMove} color={color} />}
          <ThemedText type="titleSm" style={styles.title} numberOfLines={1}>
            {capitalize(name)}
          </ThemedText>
          {muscle_group && (
            <Pill label={capitalize(muscle_group)} backgroundColor={color} />
          )}
        </View>

        {!editing && (
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => onEditingChange(true)}
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
        <SetsReadList sets={sets} />
      ) : (
        <SetEditor
          initialSets={sets}
          color={color}
          isSaving={isSaving}
          saveError={saveError}
          onSave={onSave}
          onCancel={() => onEditingChange(false)}
        />
      )}
    </ThemedView>
  );
};

export default RoutineExerciseDetailComponent;
