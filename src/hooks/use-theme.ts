/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useMemo } from 'react';

import { Colors, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { readableAccent, routineTone } from '@/lib/color';
import { useAccent } from '@/providers/AccentProvider';

export function useThemeMode(): 'light' | 'dark' {
  const scheme = useColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}

/** A stored routine color, as it should be painted in the current color scheme. */
export function useRoutineColor(hex: string): string {
  return routineTone(hex, useThemeMode());
}

/**
 * The palette for the current color scheme. While there is a routine of the
 * day its color replaces the brand accent (`primary` for fills, `accentText`
 * for text and icons), so everything built on those tokens follows it.
 */
export function useTheme(): ThemeColors {
  const mode = useThemeMode();
  const accent = useAccent();

  return useMemo(() => {
    const base = Colors[mode];
    if (!accent) return base;
    const tone = routineTone(accent, mode);
    return { ...base, primary: tone, accentText: readableAccent(tone, mode) };
  }, [mode, accent]);
}
