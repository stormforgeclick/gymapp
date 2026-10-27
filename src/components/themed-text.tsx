import { Text, type TextProps } from "react-native";

import { ThemeColor, Typography, TypographyType } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type TextTone =
  | "default"
  | "secondary"
  | "tertiary"
  | "accent"
  | "danger"
  | "onPrimary";

const TONE_COLOR: Record<TextTone, ThemeColor> = {
  default: "text",
  secondary: "textSecondary",
  tertiary: "textTertiary",
  accent: "accentText",
  danger: "danger",
  onPrimary: "onPrimary",
};

export type ThemedTextProps = TextProps & {
  type?: TypographyType;
  tone?: TextTone;
  /** Fixed-width digits so values like reps and weight don't shift layout. */
  tabular?: boolean;
};

export function ThemedText({
  style,
  type = "body",
  tone = "default",
  tabular,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        Typography[type],
        { color: theme[TONE_COLOR[tone]] },
        tabular && { fontVariant: ["tabular-nums"] },
        style,
      ]}
      {...rest}
    />
  );
}
