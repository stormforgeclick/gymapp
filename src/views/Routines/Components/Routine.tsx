import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Pill from "@/components/ui/Pill";
import { Opacity, Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useRoutineColor } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";
import { capitalize } from "@/lib/text";
import type { IRoutineResponse } from "@/types/routine";
import { Pressable, View } from "react-native";

interface IProps extends IRoutineResponse {
  action: () => void;
}

const makeStyles = (c: ThemeColors) => ({
  wrapper: {
    paddingLeft: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.border,
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

const RoutineComponent = ({ name, quantity, color: storedColor, tags, action }: IProps) => {
  const styles = useThemedStyles(makeStyles);
  const color = useRoutineColor(storedColor);
  const { t } = useT();
  const exerciseCount = t("routines.exercises", { count: quantity });

  return (
    <Pressable
      onPress={action}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${exerciseCount}`}
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
            {exerciseCount}
          </ThemedText>
        </View>

        <View style={styles.tagsSection}>
          {tags.map((tag) => (
            <Pill label={capitalize(tag)} key={tag} backgroundColor={color} />
          ))}
        </View>
      </ThemedView>
    </Pressable>
  );
};

export default RoutineComponent;
