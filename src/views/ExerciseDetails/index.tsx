import { ThemedText } from "@/components/themed-text";
import CustomImage from "@/components/ui/CustomImage";
import IconButton from "@/components/ui/IconButton";
import Pill from "@/components/ui/Pill";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useExercise } from "@/hooks/api/exercises";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import ExerciseDetailsSkeleton from "./components/ExerciseDetails";

const capitalizeString = (str: string) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const makeStyles = (c: ThemeColors) => ({
  backButton: {
    marginLeft: -Spacing.two,
    marginVertical: Spacing.one,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    gap: Spacing.tight,
    paddingBottom: Spacing.four,
  },
  centered: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  videoContainer: {
    paddingVertical: Spacing.five + Spacing.one,
    backgroundColor: c.surface,
    borderRadius: Radius.md,
    alignItems: "center" as const,
  },
  video: {
    width: 180,
    aspectRatio: 1,
    borderRadius: Radius.md,
  },
  tagsContainer: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: Spacing.two,
  },
  coachingContainer: {
    padding: Spacing.three,
    backgroundColor: c.surface,
    borderRadius: Radius.md,
    gap: Spacing.two,
  },
});

const ExerciseDetailsScreen = () => {
  const { id: exerciseId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);

  const { data: exercise, isLoading } = useExercise(exerciseId);

  return (
    <ScreenContainer edges={["top", "bottom"]}>
      <IconButton
        icon="arrow-left"
        onPress={() => router.back()}
        accessibilityLabel="Volver"
        style={[styles.backButton, { alignSelf: "flex-start" }]}
      />

      {isLoading ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <ExerciseDetailsSkeleton />
        </ScrollView>
      ) : !exercise ? (
        <View style={styles.centered}>
          <ThemedText tone="secondary">No se encontró el ejercicio</ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.videoContainer}>
            <CustomImage
              source={{ uri: exercise.gif_url }}
              style={styles.video}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </View>

          <ThemedText type="display" accessibilityRole="header">
            {capitalizeString(exercise.name)}
          </ThemedText>

          <View style={styles.tagsContainer}>
            <Pill
              label={capitalizeString(exercise.category)}
              backgroundColor={theme.accentText}
              textColor={theme.accentText}
            />

            <Pill label={capitalizeString(exercise.equipment)} />

            <Pill label={capitalizeString(exercise.target)} />
          </View>

          <View style={styles.coachingContainer}>
            <ThemedText type="overline" tone="accent">
              Técnica
            </ThemedText>

            <ThemedText tone="secondary">{exercise.instructions}</ThemedText>
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

export default ExerciseDetailsScreen;
