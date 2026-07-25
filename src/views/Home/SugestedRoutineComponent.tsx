import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Pressable, StyleSheet, View } from "react-native";

interface IProps {
  title: string;
  subtitle: string;
  color: string;
  action: () => void;
}

const SugestedRoutineComponent = ({
  color,
  title,
  subtitle,
  action,
}: IProps) => {
  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.leftContent}>
        <View>
          <ThemedText style={styles.subtitle}>Sugested Today</ThemedText>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
        </View>
      </View>

      <Pressable
        style={[
          styles.button,
          {
            backgroundColor: color,
          },
        ]}
        onPress={action}
      >
        <ThemedText style={styles.buttonText}>Start</ThemedText>
      </Pressable>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 18,
  },

  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  title: {
    fontSize: 24,
    fontFamily: "BarlowCondensed_900Black",
    lineHeight: 32,
    color: "#FFFFFF",
  },

  subtitle: {
    opacity: 0.6,
    fontSize: 10,
    lineHeight: 15,
    color: "#6A6A6A",
  },

  button: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 15,
  },

  buttonText: {
    color: "#000000",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});

export default SugestedRoutineComponent;
