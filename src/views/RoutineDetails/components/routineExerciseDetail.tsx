import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Pill from "@/components/ui/Pill";
import type { RoutineExercise, SetInput } from "@/hooks/api/routineExercises/queries";
import SetEditor from "./SetEditor";

interface IProps {
  routineExercise: RoutineExercise;
  color: string;
  onDelete: () => void;
  onSave: (sets: SetInput[]) => void;
  isSaving: boolean;
  saveError: string | null;
  isDeleting: boolean;
}

const RoutineExerciseDetailComponent = ({
  routineExercise,
  color,
  onDelete,
  onSave,
  isSaving,
  saveError,
  isDeleting,
}: IProps) => {
  const { name, muscle_group, sets } = routineExercise;

  const [editing, setEditing] = useState(false);

  const prevSavingRef = useRef(false);
  useEffect(() => {
    if (prevSavingRef.current && !isSaving && !saveError) {
      setEditing(false);
    }
    prevSavingRef.current = isSaving;
  }, [isSaving, saveError]);

  const handleDeletePress = () => {
    Alert.alert(
      "Eliminar ejercicio",
      `¿Eliminar "${name}" de la rutina?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: onDelete },
      ]
    );
  };

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.title} numberOfLines={1}>
            {name}
          </ThemedText>
          {muscle_group && <Pill label={muscle_group} backgroundColor={color} />}
        </View>

        {!editing && (
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => setEditing(true)}
              accessibilityRole="button"
              accessibilityLabel={`Editar ${name}`}
              hitSlop={10}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <ThemedText style={styles.actionTextSecondary}>Editar</ThemedText>
            </Pressable>

            <Pressable
              onPress={handleDeletePress}
              disabled={isDeleting}
              accessibilityRole="button"
              accessibilityLabel={`Eliminar ${name}`}
              hitSlop={10}
              style={({ pressed }) => pressed && styles.pressed}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#E53935" />
              ) : (
                <ThemedText style={styles.actionTextDanger}>Eliminar</ThemedText>
              )}
            </Pressable>
          </View>
        )}
      </View>

      {!editing ? (
        <View style={styles.setsReadList}>
          {sets.map((s, i) => {
            const repsLabel =
              s.min_reps === s.max_reps
                ? `${s.min_reps} reps`
                : `${s.min_reps}-${s.max_reps} reps`;
            return (
              <View key={s.id ?? i} style={styles.setReadRow}>
                <ThemedText style={styles.setIndex}>{i + 1}</ThemedText>
                <ThemedText style={styles.infoText}>{repsLabel}</ThemedText>
                {s.weight != null && (
                  <ThemedText style={styles.infoText}>{s.weight} kg</ThemedText>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <SetEditor
          initialSets={sets}
          color={color}
          isSaving={isSaving}
          saveError={saveError}
          onSave={onSave}
          onCancel={() => setEditing(false)}
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: "BarlowCondensed_900Black",
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.6,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionTextSecondary: {
    fontSize: 14,
    color: "#6A6A80",
  },
  actionTextDanger: {
    fontSize: 14,
    color: "#E53935",
  },
  setsReadList: {
    gap: 6,
  },
  setReadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  setIndex: {
    fontSize: 12,
    color: "#6A6A80",
    width: 16,
    textAlign: "right",
  },
  infoText: {
    fontSize: 14,
    color: "#6A6A80",
  },
});

export default RoutineExerciseDetailComponent;
