import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import DayRoutineComponent from "@/components/ui/DayRoutineComponent";
import SugestedRoutineComponent from "@/components/ui/SugestedRoutineComponent";

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
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
            color="#D9FF00"
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
              color="#D9FF00"
              action={() => console.log("Leg")}
            />

            <DayRoutineComponent
              title="Pull Day"
              subtitle="4 ex."
              color="#14C7FF"
              action={() => console.log("Pull")}
            />
          </ScrollView>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 15,
  },

  textheader: {
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
