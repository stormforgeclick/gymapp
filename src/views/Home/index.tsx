import { ScrollView, StyleSheet } from "react-native";

import { ScreenContainer } from "@/components/ScreenContainer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RoutineColors } from "@/constants/theme";
import DayRoutineComponent from "./DayRoutineComponent";
import SugestedRoutineComponent from "./SugestedRoutineComponent";

const HomeScreen = () => {
  return (
    <ScreenContainer>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleSection}>
          <ThemedText style={styles.textheader}>Monday · July 20</ThemedText>
          <ThemedText type="title" style={styles.title}>
            READY TO{"\n"}LIFT? 💪
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.sugestedSection}>
          <SugestedRoutineComponent
            title="Leg Day"
            subtitle="4 ex."
            color={RoutineColors.routineOne}
            action={() => console.log("Leg")}
          />
        </ThemedView>

        <ThemedView style={styles.routinesSection}>
          <ThemedText style={styles.textheader}>YOUR ROUTINES</ThemedText>

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

  textheader: {
    textAlign: "left",
    opacity: 0.6,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1,
    color: "#6A6A80",
  },

  titleSection: {
    marginTop: 10,
  },

  title: {
    textAlign: "left",
  },

  sugestedSection: {},

  routinesSection: {
    flex: 1,
    gap: 8,
  },

  scrollView: {
    flex: 1,
  },

  routinesContainer: {
    gap: 8,
  },
});

export default HomeScreen;
