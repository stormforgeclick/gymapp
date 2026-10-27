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
  leftContent: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.tight,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  textContainer: {
    flex: 1,
  },
});

const DayRoutineComponent = ({ color, title, subtitle, action }: IProps) => {
  const styles = useThemedStyles(makeStyles);

  return (
    <ThemedView type="surface" style={styles.container}>
      <View style={styles.leftContent}>
        <View style={[styles.dot, { backgroundColor: color }]} />

        <View style={styles.textContainer}>
          <ThemedText type="bodyStrong" numberOfLines={1}>
            {title}
          </ThemedText>
          <ThemedText type="caption" tone="secondary">
            {subtitle}
          </ThemedText>
        </View>
      </View>

      <Button
        label="Ir"
        size="sm"
        color={color}
        fullWidth={false}
        onPress={action}
        accessibilityLabel={`Iniciar ${title}`}
      />
    </ThemedView>
  );
};

export default DayRoutineComponent;
