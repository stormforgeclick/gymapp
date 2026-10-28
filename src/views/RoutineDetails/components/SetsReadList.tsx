import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import type { RoutineExerciseSet } from "@/hooks/api/routineExercises/queries";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";

interface SetsReadListProps {
  sets: RoutineExerciseSet[];
}

const makeStyles = () => ({
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.tight,
  },
  index: {
    width: 20,
    textAlign: "right" as const,
  },
});

/** The planned sets of an exercise, one line each, read-only. */
const SetsReadList = ({ sets }: SetsReadListProps) => {
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();

  return (
    <View style={styles.list}>
      {sets.map((s, i) => {
        const reps =
          s.min_reps === s.max_reps
            ? `${s.min_reps}`
            : `${s.min_reps}-${s.max_reps}`;

        return (
          <View
            key={s.id ?? i}
            style={styles.row}
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
            <ThemedText type="caption" tone="secondary" tabular style={styles.index}>
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
  );
};

export default SetsReadList;
