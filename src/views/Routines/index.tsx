import { ScreenContainer } from "@/components/ui/ScreenContainer";
import Title from "@/components/ui/Title";
import { Colors, RoutineColors } from "@/constants/theme";
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

const RoutinesScreen = () => {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const [showAdd, setShowAdd] = useState<boolean>(false);

  return (
    <ScreenContainer>
      <View style={styles.headerSection}>
        <Title title="ROUTINES" />
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
        <RoutineComponent
          title="Leg Day"
          subtitle="4 Exercies"
          color={RoutineColors.routineOne}
          action={() =>
            router.push({
              pathname: "/routine/[id]",
              params: { id: "123" },
            })
          }
          tags={["Leg Press", "Bulgarian", "Extentions", "Curl", "Adductors"]}
        />
        <RoutineComponent
          title="Pull Day"
          subtitle="4 Exercies"
          color={RoutineColors.routineTwo}
          action={() =>
            router.push({
              pathname: "/routine/[id]",
              params: { id: "123" },
            })
          }
          tags={["Pull-ups", "Rows", "Lat Pulldowns", "Curls", "Hammer Curls"]}
        />
        <RoutineComponent
          title="Push Day"
          subtitle="4 Exercies"
          color={RoutineColors.routineThree}
          action={() =>
            router.push({
              pathname: "/routine/[id]",
              params: { id: "123" },
            })
          }
          tags={[
            "Bench Press",
            "Incline Press",
            "Shoulder Press",
            "Tricep Dips",
            "Chest Flys",
          ]}
        />
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
