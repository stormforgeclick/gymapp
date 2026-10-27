import { ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { RoutineColors, Spacing } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import DayRoutineComponent from "./components/DayRoutineComponent";
import SugestedRoutineComponent from "./components/SugestedRoutineComponent";

const formatDate = (date: Date) =>
  date.toLocaleDateString("es-ES", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

const makeStyles = () => ({
  container: {
    flex: 1,
    gap: Spacing.three,
  },
  routinesSection: {
    flex: 1,
    gap: Spacing.two,
  },
  scrollView: {
    flex: 1,
  },
  routinesContainer: {
    gap: Spacing.three,
  },
});

const HomeScreen = () => {
  const styles = useThemedStyles(makeStyles);

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <ScreenHeader
          overline={formatDate(new Date())}
          title="¿LISTO PARA ENTRENAR?"
        />

        <SugestedRoutineComponent
          title="Leg Day"
          subtitle="4 ejercicios"
          color={RoutineColors.routineOne}
          action={() => console.log("Leg")}
        />

        <View style={styles.routinesSection}>
          <ThemedText type="overline" tone="secondary" accessibilityRole="header">
            Tus rutinas
          </ThemedText>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.routinesContainer}
            showsVerticalScrollIndicator={false}
          >
            <DayRoutineComponent
              title="Leg Day"
              subtitle="4 ejercicios"
              color={RoutineColors.routineOne}
              action={() => console.log("Leg")}
            />

            <DayRoutineComponent
              title="Pull Day"
              subtitle="4 ejercicios"
              color={RoutineColors.routineTwo}
              action={() => console.log("Pull")}
            />
          </ScrollView>
        </View>
      </View>
    </ScreenContainer>
  );
};

export default HomeScreen;
