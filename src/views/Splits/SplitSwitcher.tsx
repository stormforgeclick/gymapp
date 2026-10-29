import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import Skeleton from "@/components/ui/Skeleton";
import {
  IconSize,
  Opacity,
  Radius,
  Spacing,
  type ThemeColors,
} from "@/constants/theme";
import { useActiveSplit } from "@/hooks/api/splits";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import SplitSheet from "./SplitSheet";

const makeStyles = (c: ThemeColors) => ({
  row: {
    flexDirection: "row" as const,
  },
  chip: {
    flexShrink: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.two,
    minHeight: 44,
    paddingHorizontal: Spacing.tight,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  name: {
    flexShrink: 1,
  },
  skeleton: {
    width: 160,
    height: 44,
  },
});

/**
 * The split the user is working in, as a chip under the screen header. Tapping
 * it opens the list of splits to switch, create or manage them.
 */
const SplitSwitcher = () => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();
  const { activeSplit, isLoading } = useActiveSplit();
  const [open, setOpen] = useState(false);

  if (isLoading) return <Skeleton variant="pill" style={styles.skeleton} />;
  if (!activeSplit) return null;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t("splits.switcherA11y", { name: activeSplit.name })}
        accessibilityHint={t("splits.switcherHint")}
        style={({ pressed }) => [
          styles.chip,
          pressed && { opacity: Opacity.pressed },
        ]}
      >
        <MaterialCommunityIcons
          name="layers-outline"
          size={IconSize.md}
          color={theme.textSecondary}
          importantForAccessibility="no"
          accessibilityElementsHidden
        />
        <ThemedText type="bodyStrong" numberOfLines={1} style={styles.name}>
          {activeSplit.name}
        </ThemedText>
        <MaterialCommunityIcons
          name="unfold-more-horizontal"
          size={IconSize.md}
          color={theme.textSecondary}
          importantForAccessibility="no"
          accessibilityElementsHidden
        />
      </Pressable>

      {open && <SplitSheet onClose={() => setOpen(false)} />}
    </View>
  );
};

export default SplitSwitcher;
