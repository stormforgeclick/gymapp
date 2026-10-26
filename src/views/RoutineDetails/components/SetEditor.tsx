import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import type {
  RoutineExerciseSet,
  SetInput,
} from "@/hooks/api/routineExercises/queries";
import { defaultDraftSet } from "../utils/defaultDraftSet";

type DraftSet = {
  id?: string;
  reps: string;
  weight: string;
};

function toDraft(sets: RoutineExerciseSet[]): DraftSet[] {
  if (sets.length === 0) {
    const d = defaultDraftSet();
    return [{ reps: String(d.min_reps), weight: "" }];
  }
  return sets.map((s) => ({
    id: s.id,
    reps: String(s.min_reps),
    weight: s.weight != null ? String(s.weight) : "",
  }));
}

interface IProps {
  initialSets: RoutineExerciseSet[];
  color: string;
  isSaving: boolean;
  saveError: string | null;
  onSave: (sets: SetInput[]) => void;
  onCancel: () => void;
}

const SetEditor = ({
  initialSets,
  color,
  isSaving,
  saveError,
  onSave,
  onCancel,
}: IProps) => {
  const [draft, setDraft] = useState<DraftSet[]>(() => toDraft(initialSets));
  const [validationError, setValidationError] = useState<string | null>(null);

  const addRow = () => {
    const last = draft[draft.length - 1];
    setDraft((d) => [
      ...d,
      { reps: last?.reps ?? "0", weight: last?.weight ?? "" },
    ]);
  };

  const removeRow = (i: number) => {
    setDraft((d) => d.filter((_, idx) => idx !== i));
  };

  const updateRow = (i: number, field: "reps" | "weight", value: string) => {
    setDraft((d) => d.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const handleSave = () => {
    const parsed: SetInput[] = [];
    for (const d of draft) {
      const reps = Number(d.reps);
      if (!Number.isInteger(reps) || reps <= 0) {
        setValidationError("Las repeticiones deben ser enteros mayores a 0");
        return;
      }
      const trimmedWeight = d.weight.trim();
      let weight: number | null = null;
      if (trimmedWeight !== "") {
        const w = Number(trimmedWeight);
        if (!Number.isFinite(w) || w < 0) {
          setValidationError("El peso debe ser un número válido (≥ 0)");
          return;
        }
        weight = w;
      }
      parsed.push({ id: d.id, min_reps: reps, max_reps: reps, weight });
    }
    setValidationError(null);
    onSave(parsed);
  };

  const errorToShow = validationError ?? saveError;

  return (
    <View style={styles.container}>
      {draft.map((d, i) => (
        <View key={i} style={styles.setEditRow}>
          <ThemedText style={styles.setIndex}>{i + 1}</ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>REPS</ThemedText>
            <TextInput
              style={styles.input}
              value={d.reps}
              onChangeText={(v) => updateRow(i, "reps", v)}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>KG</ThemedText>
            <TextInput
              style={styles.input}
              value={d.weight}
              onChangeText={(v) => updateRow(i, "weight", v)}
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor="#6A6A80"
              selectTextOnFocus
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.trashButton,
              draft.length === 1 && styles.trashDisabled,
              pressed && !isSaving && draft.length > 1 && styles.pressed,
            ]}
            onPress={() => removeRow(i)}
            disabled={draft.length === 1}
            accessibilityRole="button"
            accessibilityLabel={`Eliminar serie ${i + 1}`}
            accessibilityState={{ disabled: draft.length === 1 }}
            hitSlop={6}
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={18}
              color={draft.length === 1 ? "#6A6A80" : "#E53935"}
            />
          </Pressable>
        </View>
      ))}

      <Pressable
        onPress={addRow}
        accessibilityRole="button"
        accessibilityLabel="Agregar serie"
        style={({ pressed }) => [styles.addSetButton, pressed && styles.pressed]}
      >
        <ThemedText style={styles.addSetText}>+ Agregar serie</ThemedText>
      </Pressable>

      {errorToShow ? (
        <ThemedText
          style={styles.errorText}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {errorToShow}
        </ThemedText>
      ) : null}

      <Pressable
        onPress={handleSave}
        disabled={isSaving}
        accessibilityRole="button"
        accessibilityLabel="Guardar cambios"
        accessibilityState={{ disabled: isSaving }}
        style={({ pressed }) => [
          styles.saveButton,
          { backgroundColor: color },
          isSaving && styles.buttonDisabled,
          pressed && !isSaving && styles.pressed,
        ]}
      >
        {isSaving ? (
          <ActivityIndicator color="#000" />
        ) : (
          <ThemedText style={styles.saveButtonText}>Guardar cambios</ThemedText>
        )}
      </Pressable>

      <Pressable
        onPress={onCancel}
        disabled={isSaving}
        accessibilityRole="button"
        accessibilityLabel="Cancelar edición"
        hitSlop={10}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <ThemedText style={styles.cancelText}>Cancelar</ThemedText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  setEditRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  setIndex: {
    fontSize: 12,
    color: "#6A6A80",
    width: 16,
    textAlign: "right",
    paddingBottom: 12,
  },
  inputGroup: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontSize: 10,
    color: "#6A6A80",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#22222E",
    borderRadius: 12,
    color: "#FFF",
    textAlign: "center",
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  trashButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#22222E",
    alignItems: "center",
    justifyContent: "center",
  },
  trashDisabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
  addSetButton: {
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#6A6A80",
    borderStyle: "dashed",
    borderRadius: 8,
    marginTop: 4,
  },
  addSetText: {
    fontSize: 13,
    color: "#6A6A80",
    fontFamily: "Inter_600SemiBold",
  },
  errorText: {
    color: "#FF4D6D",
    fontSize: 12,
  },
  saveButton: {
    borderRadius: 4,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#000",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  cancelText: {
    fontSize: 14,
    color: "#6A6A80",
    textAlign: "center",
    paddingVertical: 4,
  },
});

export default SetEditor;
