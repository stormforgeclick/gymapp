import { Colors } from "@/constants/theme";

const MIN_TEXT_CONTRAST = 4.5;

type Rgb = [number, number, number];

function parseHex(hex: string): Rgb | null {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) return null;
  return [
    parseInt(match[1], 16),
    parseInt(match[2], 16),
    parseInt(match[3], 16),
  ];
}

function toHex([r, g, b]: Rgb): string {
  const part = (value: number) =>
    Math.round(value).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** WCAG relative luminance. */
function luminance([r, g, b]: Rgb): number {
  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two hex colors, or null if either isn't `#rrggbb`. */
export function contrastRatio(a: string, b: string): number | null {
  const first = parseHex(a);
  const second = parseHex(b);
  if (!first || !second) return null;

  const [lighter, darker] = [luminance(first), luminance(second)].sort(
    (x, y) => y - x
  );
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Accent color usable as text or icon color. Routine colors are bright, so on
 * the dark theme they're used as they are; on the light theme they're darkened
 * until they reach the text contrast minimum against the page background.
 */
export function readableAccent(hex: string, mode: "light" | "dark"): string {
  const rgb = parseHex(hex);
  if (!rgb || mode === "dark") return hex;

  const background = Colors.light.background;

  for (let step = 0; step <= 20; step++) {
    const factor = 1 - step * 0.05;
    const candidate = toHex([rgb[0] * factor, rgb[1] * factor, rgb[2] * factor]);
    const ratio = contrastRatio(candidate, background);
    if (ratio !== null && ratio >= MIN_TEXT_CONTRAST) return candidate;
  }

  return toHex([0, 0, 0]);
}
