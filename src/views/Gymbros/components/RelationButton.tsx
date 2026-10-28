import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
import { IconSize, Spacing } from "@/constants/theme";
import type { Relation } from "@/hooks/api/gymbros/queries";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";

interface RelationButtonProps {
  relation: Relation;
  /** Person's name, so the button is announced as "Add Ana", not just "Add". */
  name: string;
  onAdd: () => void;
  onAccept: () => void;
  /** Without it a sent request is shown as a plain label. */
  onCancel?: () => void;
  loading?: boolean;
}

const makeStyles = () => ({
  status: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
});

/** The one action that fits where the user stands with this person. */
const RelationButton = ({
  relation,
  name,
  onAdd,
  onAccept,
  onCancel,
  loading = false,
}: RelationButtonProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();

  switch (relation) {
    case "none":
      return (
        <Button
          label={t("gymbros.add")}
          size="sm"
          leftIcon="account-plus-outline"
          fullWidth={false}
          loading={loading}
          onPress={onAdd}
          accessibilityLabel={t("gymbros.addA11y", { name })}
        />
      );

    case "pending_received":
      return (
        <Button
          label={t("gymbros.accept")}
          size="sm"
          fullWidth={false}
          loading={loading}
          onPress={onAccept}
          accessibilityLabel={t("gymbros.acceptA11y", { name })}
        />
      );

    case "pending_sent":
      return onCancel ? (
        <Button
          label={t("gymbros.pending")}
          variant="outline"
          size="sm"
          fullWidth={false}
          loading={loading}
          onPress={onCancel}
          accessibilityLabel={t("gymbros.pendingA11y", { name })}
        />
      ) : (
        <ThemedText type="label" tone="secondary" style={styles.status}>
          {t("gymbros.pending")}
        </ThemedText>
      );

    case "accepted":
      return (
        <View style={styles.status} accessible accessibilityLabel={t("gymbros.isGymbro")}>
          <MaterialCommunityIcons
            name="check"
            size={IconSize.sm}
            color={theme.accentText}
          />
          <ThemedText type="label" tone="accent">
            {t("gymbros.isGymbro")}
          </ThemedText>
        </View>
      );

    case "unavailable":
      return (
        <ThemedText type="label" tone="tertiary" style={styles.status}>
          {t("gymbros.unavailable")}
        </ThemedText>
      );
  }
};

export default RelationButton;
