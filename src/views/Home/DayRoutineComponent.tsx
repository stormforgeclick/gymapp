import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Pressable, StyleSheet, View } from "react-native";

interface IProps {
  title: string;
  subtitle: string;
  color: string;
  action: () => void;
}

const DayRoutineComponent = ({ color, title, subtitle, action }: IProps) => {
  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.leftContent}>
        <View
          style={[
            styles.dot,
            {
              backgroundColor: color,
            },
          ]}
        />

        <View style={styles.textContainer}>
          <ThemedText style={styles.title} type="smallBold">
            {title}
          </ThemedText>
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
        <ThemedText style={styles.buttonText}>Go</ThemedText>
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

  dot: {
    width: 8,
    height: 8,
    borderRadius: 5,
  },

  textContainer: {
    flexDirection: "row",
    gap: 8,
  },

  title: {
    fontSize: 14,
  },

  subtitle: {
    opacity: 0.6,
    fontSize: 10,
    color: "#6A6A6A",
  },

  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  buttonText: {
    color: "#000",
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "Inter_700Bold",
  },
});

export default DayRoutineComponent;
