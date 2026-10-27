import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

import type { ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

/** Dimmed scrim behind a sheet; tapping it dismisses the sheet. */
export const renderSheetBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop
    {...props}
    appearsOnIndex={0}
    disappearsOnIndex={-1}
    opacity={0.6}
    pressBehavior="close"
  />
);

const makeStyles = (c: ThemeColors) => ({
  background: {
    backgroundColor: c.surfaceElevated,
  },
  handleIndicator: {
    backgroundColor: c.textTertiary,
  },
});

/** Background and handle styles shared by every bottom sheet. */
export function useSheetStyles() {
  return useThemedStyles(makeStyles);
}
