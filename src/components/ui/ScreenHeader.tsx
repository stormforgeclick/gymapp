import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import { ThemedText } from "@/components/themed-text";
import IconButton from "@/components/ui/IconButton";
import { Spacing } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";

interface ScreenHeaderProps {
  title: string;
  overline?: string;
  onBack?: () => void;
  right?: ReactNode;
  /** `display` is 36px; `headline` (28px) fits headers that share the row with actions. */
  size?: "display" | "headline";
  /** Lines the title may use before truncating; `\n` in `title` breaks a line. */
  titleLines?: number;
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

const ScreenHeader = ({
  title,
  overline,
  onBack,
  right,
  size = "display",
  titleLines = 2,
  style,
}: ScreenHeaderProps) => {
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();

  return (
    <View style={[styles.container, style]}>
      {onBack && (
        <IconButton
          icon="arrow-left"
          onPress={onBack}
          accessibilityLabel={t("common.back")}
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
          type={size}
          numberOfLines={titleLines}
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
