const dark = {
  background: "#080810",
  surface: "#14141F",
  surfaceElevated: "#1A1A28",
  surfaceInput: "#22222E",
  border: "#2A2A3A",
  // Outline for color-filled controls; only needed where the fill blends into the background.
  edge: "transparent",
  text: "#FFFFFF",
  textSecondary: "#9A9AAE",
  textTertiary: "#6A6A80",
  primary: "#C8FF00",
  onPrimary: "#080810",
  accentText: "#C8FF00",
  danger: "#FF4D6D",
};

export type ThemeColors = Record<keyof typeof dark, string>;
export type ThemeColor = keyof ThemeColors;

const light: ThemeColors = {
  background: "#F6F6F9",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceInput: "#EEEEF3",
  border: "#E0E0E8",
  edge: "rgba(0,0,0,0.25)",
  text: "#0B0B12",
  textSecondary: "#5A5A6E",
  textTertiary: "#8A8A9C",
  primary: "#C8FF00",
  onPrimary: "#080810",
  accentText: "#4D6600",
  danger: "#D92D20",
};

export const Colors = { light, dark } as const;

export const RoutineColors = {
  routineOne: "#C8FF00",
  routineTwo: "#00D4FF",
  routineThree: "#FF6B35",
  routineFour: "#B44DFF",
  routineFive: "#FF2D78",
  routineSix: "#00FFB3",
  routineSeven: "#FFB300",
};

// Same hues for the light theme, darkened to at least 3:1 against the page
// background while keeping 4.5:1 for `onPrimary` text on top. `RoutineColors`
// is what gets stored; this is only how it is painted.
export const RoutineColorsLight: Record<keyof typeof RoutineColors, string> = {
  routineOne: "#6B8B00",
  routineTwo: "#078CA8",
  routineThree: "#E14F0D",
  routineFour: "#B44DFF",
  routineFive: "#FF2D78",
  routineSix: "#049265",
  routineSeven: "#AA7605",
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  // between steps of the scale, used by cards and form rows
  tight: 12,
  comfy: 20,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const IconSize = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export const Opacity = {
  pressed: 0.7,
  disabled: 0.4,
} as const;

const Barlow = "BarlowCondensed_900Black";

export const Typography = {
  display: { fontFamily: Barlow, fontSize: 36, lineHeight: 40 },
  headline: { fontFamily: Barlow, fontSize: 28, lineHeight: 32 },
  title: { fontFamily: Barlow, fontSize: 22, lineHeight: 28 },
  titleSm: { fontFamily: Barlow, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: "Inter_600SemiBold", fontSize: 16, lineHeight: 24 },
  label: { fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 16 },
  overline: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
} as const;

export type TypographyType = keyof typeof Typography;
