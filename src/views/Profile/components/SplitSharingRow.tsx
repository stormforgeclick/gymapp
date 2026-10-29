import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { IconSize, Radius, Spacing, type ThemeColors } from "@/constants/theme";
import type { Split, SplitPrivacy } from "@/hooks/api/splits/queries";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";

interface SplitSharingRowProps {
  split: Split;
  onChange: (privacy: SplitPrivacy) => void;
}

const makeStyles = (c: ThemeColors) => ({
  card: {
    gap: Spacing.tight,
    padding: Spacing.tight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  titleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.two,
  },
  name: {
    flex: 1,
  },
});

/** One of the user's splits with a control for who can see its routines. */
const SplitSharingRow = ({ split, onChange }: SplitSharingRowProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();

  const options: { value: SplitPrivacy; label: string }[] = [
    { value: "private", label: t("splits.visibility.private") },
    { value: "gymbros", label: t("splits.visibility.gymbros") },
    { value: "public", label: t("splits.visibility.public") },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <MaterialCommunityIcons
          name="layers-outline"
          size={IconSize.md}
          color={theme.textSecondary}
          importantForAccessibility="no"
          accessibilityElementsHidden
        />
        <ThemedText type="bodyStrong" numberOfLines={1} style={styles.name}>
          {split.name}
        </ThemedText>
        <ThemedText type="caption" tone="secondary">
          {t("splits.routines", { count: split.routines })}
        </ThemedText>
      </View>

      <SegmentedControl
        options={options}
        value={split.privacy}
        onChange={onChange}
        accessibilityLabel={t("profile.sharing.levelA11y", { name: split.name })}
      />
    </View>
  );
};

export default SplitSharingRow;
