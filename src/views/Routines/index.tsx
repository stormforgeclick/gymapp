import { ScreenContainer } from "@/components/ui/ScreenContainer";
import RoutineComponent from "./RoutineComponent";
import { Colors, RoutineColors } from "@/constants/theme";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import Title from "@/components/ui/Title";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const RoutinesScreen = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  return (
    <ScreenContainer>
      <View style={styles.headerSection}>
        <Title title="ROUTINES" />
        <Pressable
          style={[styles.button, { backgroundColor: colors.icon }]}
          onPress={() => console.log("Add")}
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
          action={() => console.log("Leg")}
          tags={["Leg Press", "Bulgarian", "Extentions", "Curl", "Adductors"]}
        />
      </ScrollView>
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
