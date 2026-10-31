import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
import { renderSheetBackdrop, useSheetStyles } from "@/components/ui/sheet";
import TextField from "@/components/ui/TextField";
import {
  IconSize,
  Opacity,
  Radius,
  RoutineColors,
  RoutineColorsLight,
  Spacing,
  type ThemeColors,
} from "@/constants/theme";
import { useCreateRoutine, useDeleteRoutine, useUpdateRoutine } from "@/hooks/api/routines";
import type { Routine } from "@/hooks/api/routines/queries";
import { useActiveSplit, useMoveRoutine, useSplits } from "@/hooks/api/splits";
import { useActiveWorkout } from "@/hooks/api/workouts";
import { useTheme, useThemeMode } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import { useDialog } from "@/providers/DialogProvider";
import { useToast } from "@/providers/ToastProvider";
import {
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { SheetTextInput } from "@/components/ui/sheet-inputs";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface IProps {
  setShowAdd: (status: boolean) => void;
  routineToEdit?: Routine | null;
  /** Called once the routine has been deleted, e.g. to leave its detail screen. */
  onDeleted?: () => void;
}

const makeStyles = (c: ThemeColors) => ({
  container: {
    padding: Spacing.three,
  },
  contentContainer: {
    gap: Spacing.four,
  },
  colorSection: {
    gap: Spacing.two,
  },
  colorsContainer: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: Spacing.two,
  },
  colorOptionWrapper: {
    width: 44,
    height: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.edge,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: c.text,
  },
  deleteButton: {
    marginTop: Spacing.three,
  },
  splitRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.two,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceInput,
  },
  splitName: {
    flex: 1,
  },
});

const AddRoutineComponent = ({ setShowAdd, routineToEdit, onDeleted }: IProps) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  // Painted with the light tones on the light theme; `RoutineColors` is stored.
  const palette = useThemeMode() === "light" ? RoutineColorsLight : RoutineColors;
  const styles = useThemedStyles(makeStyles);
  const sheet = useSheetStyles();
  const { t } = useT();
  const toast = useToast();
  const dialog = useDialog();
  const { data: activeWorkout } = useActiveWorkout();
  const { activeSplit } = useActiveSplit();
  const { data: splits } = useSplits();
  const moveMut = useMoveRoutine();

  const currentSplit = splits?.find(
    (split) => split.id === routineToEdit?.split_id
  );
  const otherSplits = splits?.filter(
    (split) => split.id !== routineToEdit?.split_id
  );

  const initialColor =
    (Object.entries(RoutineColors).find(
      ([, v]) => v === routineToEdit?.color
    )?.[0] as keyof typeof RoutineColors) ?? "routineOne";

  const [name, setName] = useState<string>(routineToEdit?.name ?? "");
  const [selectedColor, setSelectedColor] =
    useState<keyof typeof RoutineColors>(initialColor);

  const createMut = useCreateRoutine();
  const updateMut = useUpdateRoutine();
  const deleteMut = useDeleteRoutine();

  const isSubmitting =
    createMut.isPending ||
    updateMut.isPending ||
    deleteMut.isPending ||
    moveMut.isPending;
  const errorMsg =
    createMut.error?.message ??
    updateMut.error?.message ??
    deleteMut.error?.message ??
    null;

  useEffect(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const dismiss = () => bottomSheetModalRef.current?.dismiss();

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const color = RoutineColors[selectedColor];

    const done = (message: string) => () => {
      toast.show(message);
      dismiss();
    };

    if (routineToEdit) {
      updateMut.mutate(
        { id: routineToEdit.id, name: trimmed, color },
        { onSuccess: done(t("routines.toast.updated")) }
      );
    } else {
      createMut.mutate(
        { name: trimmed, color, splitId: activeSplit?.id },
        { onSuccess: done(t("routines.toast.created")) }
      );
    }
  };

  const handleMove = () => {
    if (!routineToEdit || !otherSplits?.length) return;

    dialog.show({
      title: t("splits.moveTitle"),
      message: t("splits.moveMessage", { name: routineToEdit.name }),
      actions: [
        ...otherSplits.map((split) => ({
          // The routine is seen according to the destination split's privacy.
          label: `${split.name} · ${t(`splits.visibility.${split.privacy}`)}`,
          variant: "secondary" as const,
          onPress: () =>
            moveMut.mutate(
              { routineId: routineToEdit.id, splitId: split.id },
              {
                onSuccess: () => {
                  toast.show(t("splits.moved", { split: split.name }));
                  dismiss();
                },
                onError: () =>
                  toast.show(t("splits.errorGeneric"), { tone: "error" }),
              }
            ),
        })),
        { label: t("common.cancel"), variant: "cancel" as const },
      ],
    });
  };

  const handleDelete = () => {
    if (!routineToEdit) return;
    const hasActiveWorkout = activeWorkout?.routine_id === routineToEdit.id;
    dialog.show({
      title: t("routines.sheet.deleteConfirmTitle"),
      message: t(
        hasActiveWorkout
          ? "routines.sheet.deleteConfirmActive"
          : "routines.sheet.deleteConfirmMessage"
      ),
      actions: [
        { label: t("common.cancel"), variant: "cancel" },
        {
          label: t("common.delete"),
          variant: "destructive",
          onPress: async () => {
            // Awaited rather than `mutate(..., { onSuccess })`: once the routine
            // leaves the list, the screen that shows this sheet drops it, and a
            // callback of an unmounted component never runs, so the user would
            // be left on the deleted routine's screen. The error, if any, is
            // shown in the sheet by `deleteMut.error`.
            try {
              await deleteMut.mutateAsync(routineToEdit.id);
            } catch {
              return;
            }
            toast.show(t("routines.toast.deleted"));
            dismiss();
            onDeleted?.();
          },
        },
      ],
    });
  };

  const trimmedName = name.trim();
  const isEditing = !!routineToEdit;

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      onDismiss={() => setShowAdd(false)}
      backgroundStyle={sheet.background}
      handleIndicatorStyle={sheet.handleIndicator}
      backdropComponent={renderSheetBackdrop}
      keyboardBehavior="interactive"
    >
      <BottomSheetView style={styles.container}>
        <View style={[styles.contentContainer, { paddingBottom: bottom }]}>
          <ThemedText type="headline" accessibilityRole="header">
            {isEditing ? t("routines.sheet.editTitle") : t("routines.sheet.newTitle")}
          </ThemedText>

          <TextField
            testID="routine-name-input"
            label={t("routines.sheet.name")}
            value={name}
            onChangeText={setName}
            placeholder={t("routines.sheet.namePlaceholder")}
            autoCapitalize="sentences"
            TextInputComponent={SheetTextInput}
          />

          {isEditing && currentSplit && !!otherSplits?.length && (
            <View style={styles.colorSection}>
              <ThemedText type="overline" tone="secondary">
                {t("splits.moveRow")}
              </ThemedText>
              <Pressable
                onPress={handleMove}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel={t("splits.moveA11y", { name: currentSplit.name })}
                style={({ pressed }) => [
                  styles.splitRow,
                  pressed && { opacity: Opacity.pressed },
                ]}
              >
                <ThemedText type="bodyStrong" numberOfLines={1} style={styles.splitName}>
                  {currentSplit.name}
                </ThemedText>
                <MaterialCommunityIcons
                  name="swap-horizontal"
                  size={IconSize.md}
                  color={theme.textSecondary}
                  importantForAccessibility="no"
                  accessibilityElementsHidden
                />
              </Pressable>
            </View>
          )}

          <View style={styles.colorSection}>
            <ThemedText type="overline" tone="secondary">
              {t("routines.sheet.color")}
            </ThemedText>
            <View style={styles.colorsContainer}>
              {Object.entries(palette).map(([key, color]) => {
                const colorKey = key as keyof typeof RoutineColors;
                const isSelected = selectedColor === colorKey;

                return (
                  <Pressable
                    key={key}
                    onPress={() => setSelectedColor(colorKey)}
                    style={styles.colorOptionWrapper}
                    accessibilityRole="button"
                    accessibilityLabel={t("routines.sheet.colorA11y", {
                      name: t(`colors.${colorKey}`),
                    })}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        isSelected && styles.selectedColor,
                      ]}
                    >
                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check"
                          size={IconSize.sm}
                          color={theme.onPrimary}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {errorMsg && (
            <ThemedText
              type="label"
              tone="danger"
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {errorMsg}
            </ThemedText>
          )}

          <View>
            <Button
              testID="routine-submit-button"
              label={isEditing ? t("routines.sheet.save") : t("routines.sheet.create")}
              color={palette[selectedColor]}
              onPress={handleSubmit}
              loading={isSubmitting && !deleteMut.isPending}
              disabled={!trimmedName || isSubmitting}
            />

            {isEditing && (
              <Button
                testID="routine-delete-button"
                label={t("routines.sheet.delete")}
                variant="danger"
                onPress={handleDelete}
                loading={deleteMut.isPending}
                disabled={isSubmitting}
                style={styles.deleteButton}
              />
            )}
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default AddRoutineComponent;
