import { ThemedText } from "@/components/themed-text";
import CustomImage from "@/components/ui/CustomImage";
import IconButton from "@/components/ui/IconButton";
import Pill from "@/components/ui/Pill";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useExercise } from "@/hooks/api/exercises";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import { capitalize } from "@/lib/text";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import ExerciseDetailsSkeleton from "./components/ExerciseDetails";

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
    borderWidth: 1,
    borderColor: c.border,
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
    borderWidth: 1,
    borderColor: c.border,
    gap: Spacing.two,
  },
});

const ExerciseDetailsScreen = () => {
  const { id: exerciseId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t, language } = useT();

  const { data: exercise, isLoading } = useExercise(exerciseId, language);

  return (
    <ScreenContainer edges={["top", "bottom"]}>
      <IconButton
        icon="arrow-left"
        onPress={() => router.back()}
        accessibilityLabel={t("common.back")}
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
          <ThemedText tone="secondary">{t("exerciseDetails.notFound")}</ThemedText>
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
            {capitalize(exercise.name)}
          </ThemedText>

          <View style={styles.tagsContainer}>
            <Pill
              label={capitalize(exercise.category)}
              backgroundColor={theme.accentText}
              textColor={theme.accentText}
            />

            <Pill label={capitalize(exercise.equipment)} />

            <Pill label={capitalize(exercise.target)} />
          </View>

          <View style={styles.coachingContainer}>
            <ThemedText type="overline" tone="accent">
              {t("exerciseDetails.technique")}
            </ThemedText>

            <ThemedText tone="secondary">{exercise.instructions}</ThemedText>
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

export default ExerciseDetailsScreen;
