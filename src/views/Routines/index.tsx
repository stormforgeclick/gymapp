import { ScreenContainer } from "@/components/ui/ScreenContainer";
import Title from "@/components/ui/Title";
import { Colors } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import RoutineComponent from "./Components/Routine";
import AddRoutineComponent from "./Components/AddRoutine";
import { useState } from "react";
import { useRouter } from "expo-router";
import { routinesMock } from "@/mocks/routines";

const RoutinesScreen = () => {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const [showAdd, setShowAdd] = useState<boolean>(false);

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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.routinesContainer}
        showsVerticalScrollIndicator={false}
      >
        {routinesMock.map((routine) => (
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
      {showAdd && <AddRoutineComponent setShowAdd={setShowAdd} />}
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
});

export default RoutinesScreen;
