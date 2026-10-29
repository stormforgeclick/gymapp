import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { renderSheetBackdrop, useSheetStyles } from "@/components/ui/sheet";
import {
  IconSize,
  Opacity,
  Radius,
  Spacing,
  type ThemeColors,
} from "@/constants/theme";
import {
  useArchiveSplit,
  useSetActiveSplit,
  useSplits,
} from "@/hooks/api/splits";
import type { Split } from "@/hooks/api/splits/queries";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import { useDialog } from "@/providers/DialogProvider";
import { useToast } from "@/providers/ToastProvider";
import SplitForm, { type SplitFormMode } from "./SplitForm";

interface SplitSheetProps {
  onClose: () => void;
}

const makeStyles = (c: ThemeColors) => ({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.two,
    paddingLeft: Spacing.tight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  rowActive: {
    borderColor: c.accentText,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.tight,
    minHeight: 56,
  },
  texts: {
    flex: 1,
  },
});

/**
 * Every split of the user: tap one to switch to it, use its menu to rename,
 * duplicate or archive it, or add a new one. Naming a split replaces the list
 * inside this same sheet.
 */
const SplitSheet = ({ onClose }: SplitSheetProps) => {
  const ref = useRef<BottomSheetModal>(null);
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const sheet = useSheetStyles();
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();
  const toast = useToast();
  const dialog = useDialog();

  const { data: splits } = useSplits();
  const setActive = useSetActiveSplit();
  const archive = useArchiveSplit();

  const [form, setForm] = useState<SplitFormMode | null>(null);

  useEffect(() => {
    ref.current?.present();
  }, []);

  const dismiss = () => ref.current?.dismiss();

  const choose = (split: Split) => {
    if (!split.is_active) setActive.mutate(split.id);
    dismiss();
  };

  const confirmArchive = (split: Split) =>
    dialog.show({
      title: t("splits.archiveConfirmTitle"),
      message: t("splits.archiveConfirmMessage", {
        name: split.name,
        count: split.routines,
      }),
      actions: [
        { label: t("common.cancel"), variant: "cancel" },
        {
          label: t("splits.archive"),
          variant: "destructive",
          onPress: () =>
            archive.mutate(split.id, {
              onSuccess: () => toast.show(t("splits.archived")),
              onError: () =>
                toast.show(t("splits.errorGeneric"), { tone: "error" }),
            }),
        },
      ],
    });

  const openMenu = (split: Split) => {
    const onlyOne = (splits?.length ?? 0) <= 1;

    dialog.show({
      title: split.name,
      message: onlyOne ? t("splits.cannotArchiveLast") : undefined,
      actions: [
        {
          label: t("splits.rename"),
          variant: "secondary",
          onPress: () => setForm({ type: "rename", split }),
        },
        {
          label: t("splits.duplicate"),
          variant: "secondary",
          onPress: () => setForm({ type: "duplicate", split }),
        },
        ...(onlyOne
          ? []
          : [
              {
                label: t("splits.archive"),
                variant: "destructive" as const,
                onPress: () => confirmArchive(split),
              },
            ]),
        { label: t("common.cancel"), variant: "cancel" },
      ],
    });
  };

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={onClose}
      backgroundStyle={sheet.background}
      handleIndicatorStyle={sheet.handleIndicator}
      backdropComponent={renderSheetBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottom + Spacing.three },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {form ? (
          <SplitForm
            mode={form}
            onBack={() => setForm(null)}
            onDone={dismiss}
            showToast={toast.show}
          />
        ) : (
          <>
            <View style={styles.header}>
              <ThemedText type="headline" accessibilityRole="header">
                {t("splits.title")}
              </ThemedText>
              <IconButton
                icon="close"
                onPress={dismiss}
                accessibilityLabel={t("splits.close")}
              />
            </View>

            <View style={styles.list} accessibilityRole="radiogroup">
              {splits?.map((split) => (
                <View
                  key={split.id}
                  style={[styles.row, split.is_active && styles.rowActive]}
                >
                  <Pressable
                    onPress={() => choose(split)}
                    accessibilityRole="radio"
                    accessibilityLabel={`${split.name}, ${t("splits.routines", {
                      count: split.routines,
                    })}, ${t(`splits.visibility.${split.privacy}`)}`}
                    accessibilityState={{ selected: split.is_active }}
                    style={({ pressed }) => [
                      styles.rowMain,
                      pressed && { opacity: Opacity.pressed },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={split.is_active ? "check-circle" : "circle-outline"}
                      size={IconSize.lg}
                      color={
                        split.is_active ? theme.accentText : theme.textTertiary
                      }
                      importantForAccessibility="no"
                      accessibilityElementsHidden
                    />
                    <View style={styles.texts}>
                      <ThemedText type="bodyStrong" numberOfLines={1}>
                        {split.name}
                      </ThemedText>
                      <ThemedText type="caption" tone="secondary">
                        {t("splits.routines", { count: split.routines })}
                        {" · "}
                        {t(`splits.visibility.${split.privacy}`)}
                      </ThemedText>
                    </View>
                  </Pressable>

                  <IconButton
                    icon="dots-vertical"
                    onPress={() => openMenu(split)}
                    accessibilityLabel={t("splits.menuA11y", {
                      name: split.name,
                    })}
                  />
                </View>
              ))}
            </View>

            <Button
              label={t("splits.new")}
              variant="outline"
              dashed
              leftIcon="plus"
              onPress={() => setForm({ type: "create" })}
            />
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

export default SplitSheet;
