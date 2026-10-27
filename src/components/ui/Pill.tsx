import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

interface IProps {
  label: string;
  /** Tint behind the label, rendered at ~8% opacity. Defaults to a neutral tint. */
  backgroundColor?: string;
  /** Label color; defaults to the secondary text tone. */
  textColor?: string;
}

const makeStyles = () => ({
  container: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
});

const NEUTRAL_TINT = "rgba(128,128,150,0.14)";

const Pill = ({ label, backgroundColor, textColor }: IProps) => {
  const styles = useThemedStyles(makeStyles);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: backgroundColor ? `${backgroundColor}14` : NEUTRAL_TINT },
      ]}
    >
      <ThemedText
        type="caption"
        tone={textColor ? undefined : "secondary"}
        style={textColor ? { color: textColor } : undefined}
      >
        {label}
      </ThemedText>
    </View>
  );
};

export default Pill;
