import { ThemedText } from "@/components/themed-text";
import CustomImage from "@/components/ui/CustomImage";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type Exercise = {
  id: string;
  name: string;
  image: string;
  category: string;
  equipment: string;
};

interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: () => void;
  rightSlot?: ReactNode;
  disabled?: boolean;
  dimmed?: boolean;
  accessibilityLabel?: string;
}

const ExerciseCard = ({
  exercise,
  onPress,
  rightSlot,
  disabled,
  dimmed,
  accessibilityLabel,
}: ExerciseCardProps) => {
  const router = useRouter();

  const capitalizeFirstLetter = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push(`/exercises/${exercise.id}`);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && !disabled && styles.cardPressed,
      ]}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? exercise.name}
      accessibilityState={{ disabled: !!disabled }}
      android_ripple={{ color: "rgba(255,255,255,0.06)" }}
    >
      <View style={styles.cardContent}>
        <View style={[styles.imageContainer, dimmed && styles.imageDimmed]}>
          <CustomImage source={{ uri: exercise.image }} style={styles.image} />
        </View>

        <View style={styles.textContainer}>
          <ThemedText
            type="semiBold"
            numberOfLines={2}
            style={[styles.exerciseName, dimmed && styles.textMuted]}
          >
            {capitalizeFirstLetter(exercise.name)}
          </ThemedText>
          <ThemedText type="small" style={styles.meta}>
            {capitalizeFirstLetter(exercise.category)}
            {exercise.equipment ? ` • ${capitalizeFirstLetter(exercise.equipment)}` : ""}
          </ThemedText>
        </View>

        <View style={styles.rightSlot}>
          {rightSlot ?? (
            <Ionicons name="chevron-forward" size={24} style={styles.icon} />
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#14141F",
    borderRadius: 10,
    padding: 16,
  },

  cardPressed: {
    opacity: 0.7,
  },

  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  imageContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
  },

  imageDimmed: {
    opacity: 0.5,
  },

  image: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },

  textContainer: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    justifyContent: "center",
  },

  exerciseName: {
    flexShrink: 1,
  },

  textMuted: {
    color: "#9A9AAE",
  },

  meta: {
    color: "#6A6A80",
  },

  rightSlot: {
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  icon: {
    color: "#6A6A80",
  },
});

export default ExerciseCard;
