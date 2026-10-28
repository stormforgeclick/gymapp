import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import PersonRow from "@/components/ui/PersonRow";
import Pill from "@/components/ui/Pill";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import ScreenHeader from "@/components/ui/ScreenHeader";
import Skeleton from "@/components/ui/Skeleton";
import { Radius, RoutineColors, Spacing, type ThemeColors } from "@/constants/theme";
import {
  useImportRoutine,
  useSharedRoutine,
  useSharedRoutineExercises,
} from "@/hooks/api/gymbros";
import { useRoutineColor } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import { capitalize } from "@/lib/text";
import { useToast } from "@/providers/ToastProvider";
import SetsReadList from "@/views/RoutineDetails/components/SetsReadList";

const makeStyles = (c: ThemeColors) => ({
  list: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.tight,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  exercise: {
    gap: Spacing.tight,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: c.border,
  },
  exerciseHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.two,
  },
  exerciseName: {
    flexShrink: 1,
  },
  saveButton: {
    marginTop: Spacing.two,
  },
  skeletonCard: {
    height: 120,
    borderRadius: Radius.lg,
  },
});

const SharedRoutineScreen = () => {
  const { id: routineId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  const { t, language } = useT();
  const toast = useToast();

  const {
    data: routine,
    isLoading,
    isError,
    refetch,
  } = useSharedRoutine(routineId);
  const { data: exercises, isLoading: exercisesLoading } =
    useSharedRoutineExercises(routineId, language);
  const importRoutine = useImportRoutine();

  const color = useRoutineColor(routine?.color ?? RoutineColors.routineOne);
  const [savedId, setSavedId] = useState<string | null>(null);

  const openCopy = (id: string) =>
    router.push({ pathname: "/routine/[id]", params: { id } });

  const save = () =>
    importRoutine.mutate(routineId, {
      onSuccess: (newId) => {
        setSavedId(newId);
        toast.show(t("sharedRoutine.saved"));
      },
      onError: () =>
        toast.show(t("sharedRoutine.saveError"), { tone: "error" }),
    });

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.listContent}>
          <Skeleton variant="card" style={styles.skeletonCard} />
          <Skeleton variant="card" style={styles.skeletonCard} />
        </View>
      );
    }

    if (isError) {
      return (
        <EmptyState
          alert
          icon="alert-circle-outline"
          title={t("sharedRoutine.loadError")}
          actionLabel={t("common.retry")}
          onAction={() => refetch()}
        />
      );
    }

    if (!routine) {
      return <EmptyState icon="dumbbell" title={t("sharedRoutine.unavailable")} />;
    }

    return (
      <>
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          data={exercises ?? []}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <PersonRow
              person={{
                first_name: routine.owner_first_name,
                last_name: routine.owner_last_name,
                user_name: routine.owner_user_name,
                avatar_url: routine.owner_avatar_url,
              }}
              onPress={() =>
                router.push({
                  pathname: "/user/[id]",
                  params: { id: routine.owner_id },
                })
              }
            />
          }
          ListEmptyComponent={
            exercisesLoading ? (
              <Skeleton variant="card" style={styles.skeletonCard} />
            ) : (
              <EmptyState icon="dumbbell" title={t("sharedRoutine.noExercises")} />
            )
          }
          renderItem={({ item }) => (
            <ThemedView type="surface" style={styles.exercise}>
              <View style={styles.exerciseHeader}>
                <ThemedText type="titleSm" numberOfLines={1} style={styles.exerciseName}>
                  {capitalize(item.name)}
                </ThemedText>
                {item.muscle_group && (
                  <Pill label={capitalize(item.muscle_group)} backgroundColor={color} />
                )}
              </View>
              <SetsReadList sets={item.sets} />
            </ThemedView>
          )}
        />

        {savedId ? (
          <Button
            label={t("sharedRoutine.open")}
            variant="outline"
            onPress={() => openCopy(savedId)}
            style={styles.saveButton}
          />
        ) : (
          <Button
            label={t("sharedRoutine.save")}
            color={color}
            onPress={save}
            loading={importRoutine.isPending}
            disabled={!exercises || exercises.length === 0}
            style={styles.saveButton}
          />
        )}
      </>
    );
  };

  return (
    <ScreenContainer edges={["top", "bottom"]}>
      <ScreenHeader
        title={routine?.name ?? ""}
        size="headline"
        titleLines={1}
        onBack={() => router.back()}
      />
      {renderBody()}
    </ScreenContainer>
  );
};

export default SharedRoutineScreen;
