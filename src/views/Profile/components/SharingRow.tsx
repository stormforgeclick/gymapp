import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { Radius, Spacing, type ThemeColors } from "@/constants/theme";
import type {
  RoutinePrivacy,
  RoutineSharing,
} from "@/hooks/api/routines/queries";
import { useRoutineColor } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";

interface SharingRowProps {
  routine: RoutineSharing;
  onChange: (privacy: RoutinePrivacy) => void;
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  name: {
    flex: 1,
  },
});

/** One of the user's routines with a control for who can see it. */
const SharingRow = ({ routine, onChange }: SharingRowProps) => {
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();
  const color = useRoutineColor(routine.color);

  const options: { value: RoutinePrivacy; label: string }[] = [
    { value: "private", label: t("profile.sharing.private") },
    { value: "gymbros", label: t("profile.sharing.gymbros") },
    { value: "public", label: t("profile.sharing.public") },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <ThemedText type="bodyStrong" numberOfLines={1} style={styles.name}>
          {routine.name}
        </ThemedText>
        <ThemedText type="caption" tone="secondary">
          {t("routines.exercises", { count: routine.quantity })}
        </ThemedText>
      </View>

      <SegmentedControl
        options={options}
        value={routine.privacy}
        onChange={onChange}
        accessibilityLabel={t("profile.sharing.levelA11y", { name: routine.name })}
      />
    </View>
  );
};

export default SharingRow;
