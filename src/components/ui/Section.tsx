import { ReactNode } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

interface SectionProps {
  title: string;
  children: ReactNode;
}

const makeStyles = () => ({
  section: {
    gap: Spacing.tight,
  },
});

const Section = ({ title, children }: SectionProps) => {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.section}>
      <ThemedText type="overline" tone="secondary" accessibilityRole="header">
        {title}
      </ThemedText>
      {children}
    </View>
  );
};

export default Section;
