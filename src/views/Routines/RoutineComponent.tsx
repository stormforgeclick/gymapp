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
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: color,
        },
      ]}
    >
      <ThemedView type="backgroundElement" style={styles.container}>
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
          {tags.map((x, id) => (
            <Pill label={x} key={id} backgroundColor={color} />
          ))}
        </View>
      </ThemedView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingLeft: 6,
    borderRadius: 12,
    overflow: "hidden",
  },
  container: {
    alignItems: "center",
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
    fontSize: 10,
    color: "#6A6A80",
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
