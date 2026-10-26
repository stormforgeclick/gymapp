import { ScreenContainer } from "@/components/ui/ScreenContainer";
import Title from "@/components/ui/Title";
import { Colors } from "@/constants/theme";
import { useRoutines } from "@/hooks/api/routines";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import RoutineComponent from "./Components/Routine";
import AddRoutineComponent from "./Components/AddRoutine";

const RoutinesScreen = () => {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  const [showAdd, setShowAdd] = useState(false);

  const { data: routines, isLoading, isError } = useRoutines();

  return (
    <ScreenContainer>
      <View style={styles.headerSection}>
        <Title title="RUTINAS" />
        <Pressable
          style={[styles.button, { backgroundColor: colors.icon }]}
          onPress={() => setShowAdd(true)}
        >
          <MaterialCommunityIcons name="plus" size={35} />
        </Pressable>
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.icon} />
        </View>
      )}

      {isError && (
        <View style={styles.centered}>
          <ThemedText type="small" themeColor="textSecondary">
            Hubo un error cargando tus rutinas
          </ThemedText>
        </View>
      )}

      {!isLoading && !isError && routines?.length === 0 && (
        <View style={styles.centered}>
          <ThemedText type="small" themeColor="textSecondary">
            Aún no tienes rutinas
          </ThemedText>
        </View>
      )}

      {!isLoading && !isError && routines && routines.length > 0 && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.routinesContainer}
          showsVerticalScrollIndicator={false}
        >
          {routines.map((routine) => (
            <RoutineComponent
              key={routine.id}
              {...routine}
              action={() =>
                router.push({
                  pathname: "/routine/[id]",
                  params: { id: routine.id },
                })
              }
            />
          ))}
        </ScrollView>
      )}

      {showAdd && (
        <AddRoutineComponent setShowAdd={setShowAdd} />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerSection: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  button: {
    borderRadius: 999,
  },
  scrollView: {
    flex: 1,
  },
  routinesContainer: {
    gap: 10,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default RoutinesScreen;
