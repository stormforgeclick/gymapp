/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useMemo } from 'react';

import { Colors, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { readableAccent } from '@/lib/color';
import { useAccent } from '@/providers/AccentProvider';

/**
 * The palette for the current color scheme. While there is a routine of the
 * day its color replaces the brand accent (`primary` for fills, `accentText`
 * for text and icons), so everything built on those tokens follows it.
 */
export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  const mode = scheme === 'unspecified' ? 'light' : scheme;
  const accent = useAccent();

  return useMemo(() => {
    const base = Colors[mode];
    if (!accent) return base;
    return { ...base, primary: accent, accentText: readableAccent(accent, mode) };
  }, [mode, accent]);
}
