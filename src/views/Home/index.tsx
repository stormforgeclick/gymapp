import { ScrollView, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { RoutineColors } from "@/constants/theme";
import DayRoutineComponent from "./DayRoutineComponent";
import SugestedRoutineComponent from "./SugestedRoutineComponent";

const HomeScreen = () => {
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    <ScreenContainer>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleSection}>
          <ThemedText style={styles.textHeader}>
            {formatDate(new Date())}
          </ThemedText>
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

  textHeader: {
    textAlign: "left",
    opacity: 0.6,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1,
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
  },

  scrollView: {
    flex: 1,
  },

  routinesContainer: {
    gap: 16,
  },
});

export default HomeScreen;
