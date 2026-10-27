import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
import { renderSheetBackdrop, useSheetStyles } from "@/components/ui/sheet";
import TextField from "@/components/ui/TextField";
import {
  IconSize,
  RoutineColorNames,
  RoutineColors,
  Spacing,
  type ThemeColors,
} from "@/constants/theme";
import { useCreateRoutine, useDeleteRoutine, useUpdateRoutine } from "@/hooks/api/routines";
import type { Routine } from "@/hooks/api/routines/queries";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import {
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface IProps {
  setShowAdd: (status: boolean) => void;
  routineToEdit?: Routine | null;
}

const makeStyles = (c: ThemeColors) => ({
  container: {
    padding: Spacing.three,
  },
  contentContainer: {
    gap: Spacing.four,
  },
  colorSection: {
    gap: Spacing.two,
  },
  colorsContainer: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: Spacing.two,
  },
  colorOptionWrapper: {
    width: 44,
    height: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: c.text,
  },
  deleteButton: {
    marginTop: Spacing.three,
  },
});

const AddRoutineComponent = ({ setShowAdd, routineToEdit }: IProps) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const sheet = useSheetStyles();

  const initialColor =
    (Object.entries(RoutineColors).find(
      ([, v]) => v === routineToEdit?.color
    )?.[0] as keyof typeof RoutineColors) ?? "routineOne";

  const [name, setName] = useState<string>(routineToEdit?.name ?? "");
  const [selectedColor, setSelectedColor] =
    useState<keyof typeof RoutineColors>(initialColor);

  const createMut = useCreateRoutine();
  const updateMut = useUpdateRoutine();
  const deleteMut = useDeleteRoutine();

  const isSubmitting =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;
  const errorMsg =
    createMut.error?.message ??
    updateMut.error?.message ??
    deleteMut.error?.message ??
    null;

  useEffect(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const dismiss = () => bottomSheetModalRef.current?.dismiss();

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const color = RoutineColors[selectedColor];

    if (routineToEdit) {
      updateMut.mutate(
        { id: routineToEdit.id, name: trimmed, color },
        { onSuccess: dismiss }
      );
    } else {
      createMut.mutate({ name: trimmed, color }, { onSuccess: dismiss });
    }
  };

  const handleDelete = () => {
    if (!routineToEdit) return;
    Alert.alert(
      "Eliminar rutina",
      "¿Estás seguro de que quieres eliminar esta rutina? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteMut.mutate(routineToEdit.id, { onSuccess: dismiss }),
        },
      ]
    );
  };

  const trimmedName = name.trim();
  const isEditing = !!routineToEdit;

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      onDismiss={() => setShowAdd(false)}
      backgroundStyle={sheet.background}
      handleIndicatorStyle={sheet.handleIndicator}
      backdropComponent={renderSheetBackdrop}
      keyboardBehavior="interactive"
    >
      <BottomSheetView style={styles.container}>
        <View style={[styles.contentContainer, { paddingBottom: bottom }]}>
          <ThemedText type="headline" accessibilityRole="header">
            {isEditing ? "EDITAR RUTINA" : "NUEVA RUTINA"}
          </ThemedText>

          <TextField
            label="Nombre"
            value={name}
            onChangeText={setName}
            placeholder="Upper, Chest Day, etc. ..."
            autoCapitalize="sentences"
            TextInputComponent={BottomSheetTextInput as any}
          />

          <View style={styles.colorSection}>
            <ThemedText type="overline" tone="secondary">
              Color
            </ThemedText>
            <View style={styles.colorsContainer}>
              {Object.entries(RoutineColors).map(([key, color]) => {
                const colorKey = key as keyof typeof RoutineColors;
                const isSelected = selectedColor === colorKey;

                return (
                  <Pressable
                    key={key}
                    onPress={() => setSelectedColor(colorKey)}
                    style={styles.colorOptionWrapper}
                    accessibilityRole="button"
                    accessibilityLabel={`Color ${RoutineColorNames[colorKey]}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        isSelected && styles.selectedColor,
                      ]}
                    >
                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check"
                          size={IconSize.sm}
                          color={theme.onPrimary}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {errorMsg && (
            <ThemedText
              type="label"
              tone="danger"
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
            >
              {errorMsg}
            </ThemedText>
          )}

          <View>
            <Button
              label={isEditing ? "Guardar" : "Crear rutina"}
              color={RoutineColors[selectedColor]}
              onPress={handleSubmit}
              loading={isSubmitting && !deleteMut.isPending}
              disabled={!trimmedName || isSubmitting}
            />

            {isEditing && (
              <Button
                label="Eliminar rutina"
                variant="danger"
                onPress={handleDelete}
                loading={deleteMut.isPending}
                disabled={isSubmitting}
                style={styles.deleteButton}
              />
            )}
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default AddRoutineComponent;
