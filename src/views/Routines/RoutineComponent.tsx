import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Pill from "@/components/ui/Pill";
import { Pressable, StyleSheet, View } from "react-native";

interface IProps {
  title: string;
  subtitle: string;
  color: string;
  action: () => void;
  tags: string[];
}

const RoutineComponent = ({ color, title, subtitle, action, tags }: IProps) => {
  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.container, { borderLeftWidth: 6, borderLeftColor: color }]}
    >
      <View style={styles.headerSection}>
        <View style={styles.textContainer}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
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
          <ThemedText style={styles.buttonText}>Edit</ThemedText>
        </Pressable>
      </View>

      <View style={styles.tagsSection}>
        {tags.map((x) => (
          <Pill label={x} />
        ))}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderRadius: 5,
    padding: 12,
  },

  headerSection: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  textContainer: {
    gap: 2,
  },

  title: {
    fontSize: 24,
    fontFamily: "BarlowCondensed_900Black",
  },

  subtitle: {
    opacity: 0.6,
    fontSize: 10,
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

  tagsSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
});

export default RoutineComponent;
