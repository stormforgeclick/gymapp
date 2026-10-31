import { BottomSheetFlatList, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import type { ComponentType, ReactElement } from "react";
import type { FlatListProps, TextInputProps } from "react-native";

/**
 * The bottom sheet's input and list take the sheet's own ref types, so they don't
 * match the plain React Native components our shared fields and lists ask for.
 * At runtime they accept the same props; these casts are the only place that says so.
 */
export const SheetTextInput =
  BottomSheetTextInput as unknown as ComponentType<TextInputProps>;

export const SheetFlatList = BottomSheetFlatList as unknown as <T>(
  props: FlatListProps<T>
) => ReactElement | null;
