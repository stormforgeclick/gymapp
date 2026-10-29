import { View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
import CustomImage from "@/components/ui/CustomImage";
import Pill from "@/components/ui/Pill";
import Skeleton from "@/components/ui/Skeleton";
import { Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useExercise } from "@/hooks/api/exercises";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import { capitalize } from "@/lib/text";

const GIF_SIZE = 180;

interface ExerciseInlineDetailsProps {
  exerciseId: string;
  isAdded: boolean;
  isAdding: boolean;
  onAdd: () => void;
}

const makeStyles = (c: ThemeColors) => ({
  container: {
    gap: Spacing.tight,
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  gifWrapper: {
    alignItems: "center" as const,
  },
  gif: {
    width: GIF_SIZE,
    height: GIF_SIZE,
    borderRadius: Radius.md,
    backgroundColor: c.surfaceInput,
  },
  pills: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: Spacing.two,
  },
  skeleton: {
    height: GIF_SIZE,
    borderRadius: Radius.md,
  },
});

/**
 * The details of one exercise, shown inside its picker row: the GIF, its
 * muscle, equipment and category, the instructions, and the action to add it.
 * It sits in a sheet's portal, so it can't use the toast or dialog providers.
 */
const ExerciseInlineDetails = ({
  exerciseId,
  isAdded,
  isAdding,
  onAdd,
}: ExerciseInlineDetailsProps) => {
  const styles = useThemedStyles(makeStyles);
  const { t, language } = useT();
  const reduceMotion = useReducedMotion();
  const { data: exercise, isLoading } = useExercise(exerciseId, language);

  return (
    <View style={styles.container}>
      {isLoading || !exercise ? (
        <Skeleton variant="card" style={styles.skeleton} />
      ) : (
        <>
          <View style={styles.gifWrapper}>
            <CustomImage
              source={{ uri: exercise.gif_url ?? exercise.image }}
              style={styles.gif}
              contentFit="contain"
              autoplay={!reduceMotion}
            />
          </View>

          <View style={styles.pills}>
            {!!exercise.target && <Pill label={capitalize(exercise.target)} />}
            {!!exercise.equipment && <Pill label={capitalize(exercise.equipment)} />}
            {!!exercise.category && <Pill label={capitalize(exercise.category)} />}
          </View>

          <ThemedText type="overline" tone="secondary" accessibilityRole="header">
            {t("routineDetails.picker.instructions")}
          </ThemedText>
          <ThemedText type="body" tone="secondary">
            {exercise.instructions || t("routineDetails.picker.noInstructions")}
          </ThemedText>
        </>
      )}

      <Button
        label={
          isAdded
            ? t("routineDetails.picker.alreadyAdded")
            : t("routineDetails.picker.addToRoutine")
        }
        leftIcon={isAdded ? "check" : "plus"}
        onPress={onAdd}
        disabled={isAdded}
        loading={isAdding}
      />
    </View>
  );
};

export default ExerciseInlineDetails;
