import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Pill from "@/components/ui/Pill";
import { Opacity, Radius, Spacing } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import type { IRoutineResponse } from "@/types/routine";
import { Pressable, View } from "react-native";

interface IProps extends IRoutineResponse {
  action: () => void;
}

const makeStyles = () => ({
  wrapper: {
    paddingLeft: 6,
    borderRadius: Radius.md,
    overflow: "hidden" as const,
  },
  container: {
    padding: Spacing.tight,
    gap: Spacing.two,
  },
  textContainer: {
    gap: Spacing.half,
  },
  tagsSection: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: Spacing.two,
    marginTop: Spacing.tight,
  },
});

const RoutineComponent = ({ name, quantity, color, tags, action }: IProps) => {
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      onPress={action}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${quantity} ejercicios`}
      style={({ pressed }) => [
        styles.wrapper,
        { backgroundColor: color },
        pressed && { opacity: Opacity.pressed },
      ]}
    >
      <ThemedView type="surface" style={styles.container}>
        <View style={styles.textContainer}>
          <ThemedText type="title">{name}</ThemedText>

          <ThemedText type="label" tone="secondary">
            {quantity} Ejercicios
          </ThemedText>
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

export default RoutineComponent;
