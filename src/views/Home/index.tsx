import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import ActiveWorkoutBanner from "@/components/ui/ActiveWorkoutBanner";
import EmptyState from "@/components/ui/EmptyState";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { Spacing } from "@/constants/theme";
import { useActiveSplitRoutines } from "@/hooks/api/splits";
import { useActiveWorkout, useLastWorkouts } from "@/hooks/api/workouts";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useStartRoutineWorkout } from "@/hooks/useStartRoutineWorkout";
import { useT } from "@/i18n";
import { suggestRoutine } from "@/lib/suggestRoutine";
import RoutineSkeleton from "@/views/Routines/Components/RoutineSkeleton";
import SplitSwitcher from "@/views/Splits/SplitSwitcher";
import DayRoutineComponent from "./components/DayRoutineComponent";
import SugestedRoutineComponent from "./components/SugestedRoutineComponent";

const makeStyles = () => ({
  container: {
    flex: 1,
    gap: Spacing.three,
  },
  routinesSection: {
    flex: 1,
    gap: Spacing.two,
  },
  scrollView: {
    flex: 1,
  },
  routinesContainer: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
});

const HomeScreen = () => {
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  const { t, language, dateLocale } = useT();

  const {
    data: routines,
    isLoading: routinesLoading,
    isError,
    refetch,
  } = useActiveSplitRoutines(language);
  const { data: activeWorkout, isLoading: activeLoading } = useActiveWorkout();
  const { data: finishedWorkouts, isLoading: historyLoading } = useLastWorkouts();
  const { start, isStarting, activeRoutineId } = useStartRoutineWorkout();

  const today = new Date().toLocaleDateString(dateLocale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // With a workout in progress the banner already says what to do next, and
  // waiting for the history avoids flashing a suggestion that then changes.
  const suggested =
    routines && !activeWorkout && !activeLoading && !historyLoading
      ? suggestRoutine(routines, finishedWorkouts ?? [])
      : null;

  const openRoutine = (routineId: string) =>
    router.push({ pathname: "/routine/[id]", params: { id: routineId } });

  const renderRoutines = () => {
    if (routinesLoading) {
      return (
        <View style={styles.routinesContainer}>
          <RoutineSkeleton />
          <RoutineSkeleton />
          <RoutineSkeleton />
        </View>
      );
    }

    if (isError) {
      return (
        <EmptyState
          alert
          icon="alert-circle-outline"
          title={t("routines.loadError")}
          actionLabel={t("common.retry")}
          onAction={() => refetch()}
        />
      );
    }

    if (!routines || routines.length === 0) {
      return (
        <EmptyState
          icon="dumbbell"
          title={t("splits.emptyRoutines")}
          actionLabel={t("routines.createFirst")}
          actionVariant="primary"
          onAction={() => router.push("/(tabs)/routines")}
        />
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.routinesContainer}
        showsVerticalScrollIndicator={false}
      >
        {routines.map((routine) => (
          <DayRoutineComponent
            key={routine.id}
            title={routine.name}
            subtitle={t("routines.exercises", { count: routine.quantity })}
            color={routine.color}
            resuming={routine.id === activeRoutineId}
            disabled={isStarting}
            action={() => start(routine)}
            onPress={() => openRoutine(routine.id)}
          />
        ))}
      </ScrollView>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <ScreenHeader overline={today} title={t("home.heading")} />

        <SplitSwitcher />

        <ActiveWorkoutBanner />

        {suggested && (
          <SugestedRoutineComponent
            title={suggested.name}
            subtitle={t("routines.exercises", { count: suggested.quantity })}
            color={suggested.color}
            action={() => start(suggested)}
          />
        )}

        <View style={styles.routinesSection}>
          <ThemedText type="overline" tone="secondary" accessibilityRole="header">
            {t("home.yourRoutines")}
          </ThemedText>

          {renderRoutines()}
        </View>
      </View>
    </ScreenContainer>
  );
};

export default HomeScreen;
