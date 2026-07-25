import { ScrollView, StyleSheet } from "react-native";

import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ThemedView } from "@/components/themed-view";
import { RoutineColors } from "@/constants/theme";
import DayRoutineComponent from "./DayRoutineComponent";
import SugestedRoutineComponent from "./SugestedRoutineComponent";
import Title from "@/components/ui/Title";
import { ThemedText } from "@/components/themed-text";

const HomeScreen = () => {
  return (
    <ScreenContainer>
      <ThemedView style={styles.container}>
        <Title title={`READY TO \nLIFT? 💪`} subtitle="Monday · July 20" />
        <ThemedView>
          <SugestedRoutineComponent
            title="Leg Day"
            subtitle="4 ex."
            color={RoutineColors.routineOne}
            action={() => console.log("Leg")}
          />
        </ThemedView>
        <ThemedView style={styles.routinesSection}>
          <ThemedText style={styles.textHeader}>YOUR ROUTINES</ThemedText>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.routinesContainer}
            showsVerticalScrollIndicator={false}
          >
            <DayRoutineComponent
              title="Leg Day"
              subtitle="4 ex."
              color={RoutineColors.routineOne}
              action={() => console.log("Leg")}
            />

            <DayRoutineComponent
              title="Pull Day"
              subtitle="4 ex."
              color={RoutineColors.routineTwo}
              action={() => console.log("Pull")}
            />
          </ScrollView>
        </ThemedView>
      </ThemedView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },

  routinesSection: {
    flex: 1,
    gap: 8,
  },

  textHeader: {
    textAlign: "left",
    opacity: 0.6,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1,
    color: "#6A6A80",
  },

  scrollView: {
    flex: 1,
  },

  routinesContainer: {
    gap: 8,
  },
});

export default HomeScreen;
