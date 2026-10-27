import ActiveWorkoutBanner from "@/components/ui/ActiveWorkoutBanner";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { Spacing } from "@/constants/theme";
import { useRoutines } from "@/hooks/api/routines";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import AddRoutineComponent from "./Components/AddRoutine";
import RoutineComponent from "./Components/Routine";
import RoutineSkeleton from "./Components/RoutineSkeleton";

const makeStyles = () => ({
  list: {
    flex: 1,
  },
  routinesContainer: {
    gap: Spacing.tight,
    paddingBottom: Spacing.three,
  },
  centered: {
    flex: 1,
    justifyContent: "center" as const,
  },
});

const RoutinesScreen = () => {
  const router = useRouter();
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t, language } = useT();

  const [showAdd, setShowAdd] = useState(false);

  const {
    data: routines,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useRoutines(language);

  const handleRoutinePress = useCallback(
    (routineId: string) => {
      router.push({ pathname: "/routine/[id]", params: { id: routineId } });
    },
    [router]
  );

  return (
    <ScreenContainer>
      <ScreenHeader
        title={t("routines.title")}
        right={
          <IconButton
            icon="plus"
            variant="filled"
            onPress={() => setShowAdd(true)}
            accessibilityLabel={t("routines.create")}
          />
        }
      />

      <ActiveWorkoutBanner />

      {isLoading && (
        <View style={styles.routinesContainer}>
          <RoutineSkeleton />
          <RoutineSkeleton />
          <RoutineSkeleton />
        </View>
      )}

      {isError && (
        <View style={styles.centered}>
          <EmptyState
            alert
            icon="alert-circle-outline"
            title={t("routines.loadError")}
            actionLabel={t("common.retry")}
            onAction={() => refetch()}
          />
        </View>
      )}

      {!isLoading && !isError && routines?.length === 0 && (
        <View style={styles.centered}>
          <EmptyState
            icon="dumbbell"
            title={t("routines.empty")}
            actionLabel={t("routines.createFirst")}
            actionVariant="primary"
            onAction={() => setShowAdd(true)}
          />
        </View>
      )}

      {!isLoading && !isError && routines && routines.length > 0 && (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.routinesContainer}
          showsVerticalScrollIndicator={false}
          data={routines}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={theme.accentText}
              colors={[theme.accentText]}
              progressBackgroundColor={theme.surface}
            />
          }
          renderItem={({ item }) => (
            <RoutineComponent
              {...item}
              action={() => handleRoutinePress(item.id)}
            />
          )}
        />
      )}

      {showAdd && <AddRoutineComponent setShowAdd={setShowAdd} />}
    </ScreenContainer>
  );
};

export default RoutinesScreen;
