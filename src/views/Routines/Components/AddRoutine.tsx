import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import {
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { ThemedText } from "@/components/themed-text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RoutineColors } from "@/constants/theme";
import { useCreateRoutine, useDeleteRoutine, useUpdateRoutine } from "@/hooks/api/routines";
import type { Routine } from "@/hooks/api/routines/queries";

const ROUTINE_BACKGROUND = "#0F0F1C";

interface IProps {
  setShowAdd: (status: boolean) => void;
  routineToEdit?: Routine | null;
}

const AddRoutineComponent = ({ setShowAdd, routineToEdit }: IProps) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { bottom } = useSafeAreaInsets();

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
    deleteMut.mutate(routineToEdit.id, { onSuccess: dismiss });
  };

  const trimmedName = name.trim();
  const isEditing = !!routineToEdit;

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      onDismiss={() => setShowAdd(false)}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handleIndicator}
      keyboardBehavior="interactive"
    >
      <BottomSheetView style={styles.container}>
        <View style={[styles.contentContainer, { paddingBottom: bottom }]}>
          <ThemedText style={styles.title}>
            {isEditing ? "EDITAR RUTINA" : "NUEVA RUTINA"}
          </ThemedText>

          <View>
            <ThemedText style={styles.textHeader}>RUTINA</ThemedText>
            <BottomSheetTextInput
              style={styles.textInput}
              placeholder="Upper, Chest Day, etc. ..."
              placeholderTextColor="#6A6A80"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.colorSection}>
            <ThemedText style={styles.textHeader}>COLOR</ThemedText>
            <View style={styles.colorsContainer}>
              {Object.entries(RoutineColors).map(([key, color]) => (
                <Pressable
                  key={key}
                  onPress={() =>
                    setSelectedColor(key as keyof typeof RoutineColors)
                  }
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === key && styles.selectedColor,
                  ]}
                />
              ))}
            </View>
          </View>

          {errorMsg && (
            <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
          )}

          <Pressable
            style={[
              styles.button,
              { backgroundColor: RoutineColors[selectedColor] },
              (!trimmedName || isSubmitting) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!trimmedName || isSubmitting}
          >
            {isSubmitting && !deleteMut.isPending ? (
              <ActivityIndicator color="#000" />
            ) : (
              <ThemedText style={styles.buttonText}>
                {isEditing ? "Guardar" : "Crear Rutina"}
              </ThemedText>
            )}
          </Pressable>

          {isEditing && (
            <Pressable
              style={[styles.deleteButton, deleteMut.isPending && styles.buttonDisabled]}
              onPress={handleDelete}
              disabled={isSubmitting}
            >
              {deleteMut.isPending ? (
                <ActivityIndicator color="#FF4D6D" />
              ) : (
                <ThemedText style={styles.deleteButtonText}>
                  Eliminar rutina
                </ThemedText>
              )}
            </Pressable>
          )}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  background: {
    backgroundColor: ROUTINE_BACKGROUND,
  },
  handleIndicator: {
    backgroundColor: "#666",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: ROUTINE_BACKGROUND,
  },
  contentContainer: {
    gap: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: "BarlowCondensed_900Black",
  },
  textHeader: {
    textAlign: "left",
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 1,
    color: "#6A6A80",
  },
  textInput: {
    marginTop: 8,
    height: 36,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#1C1C2A",
    color: "#FFFFFF",
    fontSize: 13,
  },
  colorSection: {
    gap: 12,
  },
  colorsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  errorText: {
    color: "#FF4D6D",
    fontSize: 13,
  },
  button: {
    borderRadius: 4,
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    lineHeight: 16,
    fontFamily: "Inter_700Bold",
  },
  deleteButton: {
    borderRadius: 4,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF4D6D",
  },
  deleteButtonText: {
    color: "#FF4D6D",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});

export default AddRoutineComponent;
