import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import { ThemedText } from "@/components/themed-text";
import IconButton from "@/components/ui/IconButton";
import { Spacing } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

interface ScreenHeaderProps {
  title: string;
  overline?: string;
  onBack?: () => void;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const makeStyles = () => ({
  container: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.two,
    marginTop: Spacing.tight,
    marginBottom: Spacing.two,
  },
  back: {
    marginLeft: -Spacing.two,
  },
  titles: {
    flex: 1,
  },
});

const ScreenHeader = ({ title, overline, onBack, right, style }: ScreenHeaderProps) => {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.container, style]}>
      {onBack && (
        <IconButton
          icon="arrow-left"
          onPress={onBack}
          accessibilityLabel="Volver"
          style={styles.back}
        />
      )}

      <View style={styles.titles}>
        {overline && (
          <ThemedText type="overline" tone="secondary">
            {overline}
          </ThemedText>
        )}
        <ThemedText
          type="headline"
          numberOfLines={1}
          accessibilityRole="header"
        >
          {title}
        </ThemedText>
      </View>

      {right}
    </View>
  );
};

export default ScreenHeader;
