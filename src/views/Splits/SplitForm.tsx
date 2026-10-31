import { SheetTextInput } from "@/components/ui/sheet-inputs";
import { useState } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import TextField from "@/components/ui/TextField";
import { Spacing } from "@/constants/theme";
import {
  useCreateSplit,
  useDuplicateSplit,
  useRenameSplit,
} from "@/hooks/api/splits";
import { isNameTaken, type Split } from "@/hooks/api/splits/queries";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";

export type SplitFormMode =
  | { type: "create" }
  | { type: "rename"; split: Split }
  | { type: "duplicate"; split: Split };

interface SplitFormProps {
  mode: SplitFormMode;
  /** Back to the list of splits, without changes. */
  onBack: () => void;
  /** The split list should close: the active split changed. */
  onDone: () => void;
  /**
   * Passed in because a sheet's content is rendered in a portal above the
   * toast provider, so this component cannot call `useToast` itself.
   */
  showToast: (message: string, options?: { tone?: "success" | "error" }) => void;
}

const makeStyles = () => ({
  container: {
    gap: Spacing.four,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.two,
  },
  back: {
    marginLeft: -Spacing.two,
  },
  title: {
    flex: 1,
  },
});

/**
 * Asks for a split's name, to create it, rename it or name its copy. It lives
 * inside the splits sheet instead of opening a second sheet: stacking sheets
 * and raising the keyboard at once made both close.
 */
const SplitForm = ({ mode, onBack, onDone, showToast }: SplitFormProps) => {
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();

  const create = useCreateSplit();
  const rename = useRenameSplit();
  const duplicate = useDuplicateSplit();

  const [name, setName] = useState(() => {
    if (mode.type === "rename") return mode.split.name;
    if (mode.type === "duplicate") {
      return t("splits.copyName", { name: mode.split.name });
    }
    return "";
  });
  const [nameTaken, setNameTaken] = useState(false);

  const mutation =
    mode.type === "create" ? create : mode.type === "rename" ? rename : duplicate;
  const trimmed = name.trim();

  const handleError = (error: unknown) => {
    if (isNameTaken(error)) setNameTaken(true);
    else showToast(t("splits.errorGeneric"), { tone: "error" });
  };

  const submit = () => {
    if (!trimmed || mutation.isPending) return;

    if (mode.type === "create") {
      create.mutate(trimmed, {
        onSuccess: () => {
          showToast(t("splits.created"));
          onDone();
        },
        onError: handleError,
      });
    } else if (mode.type === "rename") {
      rename.mutate(
        { id: mode.split.id, name: trimmed },
        {
          onSuccess: () => {
            showToast(t("splits.renamed"));
            onBack();
          },
          onError: handleError,
        }
      );
    } else {
      duplicate.mutate(
        { id: mode.split.id, name: trimmed },
        {
          onSuccess: () => {
            showToast(t("splits.duplicated"));
            onDone();
          },
          onError: handleError,
        }
      );
    }
  };

  const title =
    mode.type === "create"
      ? t("splits.newTitle")
      : mode.type === "rename"
        ? t("splits.renameTitle")
        : t("splits.duplicateTitle");

  const submitLabel =
    mode.type === "create"
      ? t("splits.create")
      : mode.type === "rename"
        ? t("splits.save")
        : t("splits.duplicate");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          onPress={onBack}
          accessibilityLabel={t("common.back")}
          style={styles.back}
        />
        <ThemedText
          type="headline"
          accessibilityRole="header"
          style={styles.title}
        >
          {title}
        </ThemedText>
      </View>

      <TextField
        label={t("splits.name")}
        value={name}
        onChangeText={(text) => {
          setNameTaken(false);
          setName(text);
        }}
        placeholder={t("splits.namePlaceholder")}
        autoCapitalize="sentences"
        maxLength={40}
        error={nameTaken ? t("splits.nameTaken") : null}
        returnKeyType="done"
        onSubmitEditing={submit}
        TextInputComponent={SheetTextInput}
      />

      <Button
        label={submitLabel}
        onPress={submit}
        loading={mutation.isPending}
        disabled={!trimmed || mutation.isPending}
      />
    </View>
  );
};

export default SplitForm;
