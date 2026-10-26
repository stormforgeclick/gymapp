import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Pill from "@/components/ui/Pill";
import type { IRoutineResponse } from "@/types/routine";
import { Pressable, StyleSheet, View } from "react-native";

interface IProps extends IRoutineResponse {
  action: () => void;
}

const RoutineComponent = ({ name, quantity, color, tags, action }: IProps) => {
  return (
    <Pressable
      onPress={action}
      style={[styles.wrapper, { backgroundColor: color }]}
    >
      <ThemedView type="backgroundElement" style={styles.container}>
        <View style={styles.headerSection}>
          <View style={styles.textContainer}>
            <ThemedText style={styles.title}>{name}</ThemedText>

            <ThemedText style={styles.subtitle}>
              {quantity} Ejercicios
            </ThemedText>
          </View>
        </View>

        <View style={styles.tagsSection}>
          {tags.map((tag) => (
            <Pill label={tag} key={tag} backgroundColor={color} />
          ))}
        </View>
      </ThemedView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingLeft: 6,
    borderRadius: 12,
    overflow: "hidden",
  },

  container: {
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

  tagsSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
});

export default RoutineComponent;
