import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Pill from "@/components/ui/Pill";
import { IRoutineExerciseResponse } from "@/types/exercise";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

interface IProps {
  color: string;
  exercise: IRoutineExerciseResponse;
  handleRemove: () => void;
  handleUpdate: (updatedData: {
    sets: number;
    reps: number;
    weight: number;
  }) => void;
}

const RoutineExerciseDetailComponent = ({
  color,
  exercise,
  handleRemove,
  handleUpdate,
}: IProps) => {
  const { name, tag, exerciseRoutineDetail } = exercise;

  const [showEdit, setShowEdit] = useState<boolean>(false);
  const [sets, setSets] = useState(String(exerciseRoutineDetail.sets));
  const [reps, setReps] = useState(String(exerciseRoutineDetail.minReps));
  const [weight, setWeight] = useState(String(exerciseRoutineDetail.weight));

  const handleSave = () => {
    handleUpdate({
      sets: Number(sets),
      reps: Number(reps),
      weight: Number(weight),
    });
    setShowEdit(false);
  };

  const handleCancel = () => {
    setSets(String(exerciseRoutineDetail.sets));
    setReps(String(exerciseRoutineDetail.minReps));
    setWeight(String(exerciseRoutineDetail.weight));
    setShowEdit(false);
  };

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <ThemedText style={styles.title}>{name}</ThemedText>
          <Pill label={tag} backgroundColor={color} />
        </View>

        <View style={styles.actionsRow}>
          {showEdit ? (
            <Pressable onPress={handleCancel}>
              <ThemedText style={styles.actionTextSecondary}>Cancel</ThemedText>
            </Pressable>
          ) : (
            <Pressable onPress={() => setShowEdit(true)}>
              <ThemedText style={styles.actionTextSecondary}>Edit</ThemedText>
            </Pressable>
          )}

          <Pressable onPress={handleRemove}>
            <ThemedText style={styles.actionTextDanger}>Remove</ThemedText>
          </Pressable>
        </View>
      </View>

      {!showEdit ? (
        <View style={styles.readOnlyRow}>
          <ThemedText style={styles.infoText}>
            {exerciseRoutineDetail.sets} sets
          </ThemedText>
          <ThemedText style={styles.infoText}>
            {exerciseRoutineDetail.minReps}-{exerciseRoutineDetail.maxReps} reps
          </ThemedText>
          <ThemedText style={styles.infoText}>
            {exerciseRoutineDetail.weight} kg
          </ThemedText>
        </View>
      ) : (
        <View style={styles.editSection}>
          <View style={styles.inputsContainer}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>SETS</ThemedText>
              <TextInput
                style={styles.input}
                value={sets}
                onChangeText={setSets}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>REPS</ThemedText>
              <TextInput
                style={styles.input}
                value={reps}
                onChangeText={setReps}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>WEIGHT KG</ThemedText>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Pressable style={styles.saveButton} onPress={handleSave}>
            <ThemedText style={styles.checkIcon}>✓</ThemedText>
          </Pressable>
        </View>
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
  },
  title: {
    fontSize: 18,
    fontFamily: "BarlowCondensed_900Black",
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
  readOnlyRow: {
    flexDirection: "row",
    gap: 16,
  },
  infoText: {
    fontSize: 14,
    color: "#6A6A80",
  },
  editSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  inputsContainer: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  inputGroup: {
    flex: 1,
    gap: 4,
  },
  label: {
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
  saveButton: {
    backgroundColor: "#CCFF00",
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkIcon: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default RoutineExerciseDetailComponent;
