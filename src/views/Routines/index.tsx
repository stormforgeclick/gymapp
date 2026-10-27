import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { Spacing } from "@/constants/theme";
import { useRoutines } from "@/hooks/api/routines";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, View } from "react-native";
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
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: Spacing.three,
  },
});

const RoutinesScreen = () => {
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);

  const [showAdd, setShowAdd] = useState(false);

  const { data: routines, isLoading, isError, refetch } = useRoutines();

  const handleRoutinePress = useCallback(
    (routineId: string) => {
      router.push({ pathname: "/routine/[id]", params: { id: routineId } });
    },
    [router]
  );

  return (
    <ScreenContainer>
      <ScreenHeader
        title="RUTINAS"
        right={
          <IconButton
            icon="plus"
            variant="filled"
            onPress={() => setShowAdd(true)}
            accessibilityLabel="Crear rutina"
          />
        }
      />

      {isLoading && (
        <View style={styles.routinesContainer}>
          <RoutineSkeleton />
          <RoutineSkeleton />
          <RoutineSkeleton />
        </View>
      )}

      {isError && (
        <View style={styles.centered}>
          <ThemedText
            tone="secondary"
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            Hubo un error cargando tus rutinas
          </ThemedText>
          <Button
            label="Reintentar"
            variant="outline"
            fullWidth={false}
            onPress={() => refetch()}
          />
        </View>
      )}

      {!isLoading && !isError && routines?.length === 0 && (
        <View style={styles.centered}>
          <ThemedText tone="secondary">Aún no tienes rutinas</ThemedText>
          <Button
            label="Crear tu primera rutina"
            fullWidth={false}
            onPress={() => setShowAdd(true)}
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
