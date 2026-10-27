import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Button from "@/components/ui/Button";
import { Radius, Spacing } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

interface IProps {
  title: string;
  subtitle: string;
  color: string;
  action: () => void;
}

const makeStyles = () => ({
  container: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  textContainer: {
    flex: 1,
  },
});

const SugestedRoutineComponent = ({
  color,
  title,
  subtitle,
  action,
}: IProps) => {
  const styles = useThemedStyles(makeStyles);

  return (
    <ThemedView type="surface" style={styles.container}>
      <View style={styles.textContainer}>
        <ThemedText type="overline" tone="secondary">
          Sugerida para hoy
        </ThemedText>
        <ThemedText type="headline" numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText type="label" tone="secondary">
          {subtitle}
        </ThemedText>
      </View>

      <Button
        label="Empezar"
        color={color}
        fullWidth={false}
        onPress={action}
        accessibilityLabel={`Empezar ${title}`}
      />
    </ThemedView>
  );
};

export default SugestedRoutineComponent;
