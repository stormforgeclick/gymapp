import { ThemedText } from "@/components/themed-text";
import CustomImage from "@/components/ui/CustomImage";

import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type Exercise = {
  id: string;
  name: string;
  image: string;
  category: string;
  equipment: string;
};

const ExerciseCard = ({ exercise }: { exercise: Exercise }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const router = useRouter();

  const capitalizeFirstLetter = (str: string) => {
    if (!str) return str;

    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handlePress = () => {
    router.push(`/exercises/${exercise.id}`);
  };

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          <CustomImage
            source={{ uri: exercise.image }}
            style={styles.image}
            onLoadStart={() => setImageLoading(true)}
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
        </View>

        <View style={styles.textContainer}>
          <ThemedText
            type="semiBold"
            numberOfLines={2}
            style={styles.exerciseName}
          >
            {capitalizeFirstLetter(exercise.name)}
          </ThemedText>
          <ThemedText type="small" style={{ color: "#6A6A80" }}>
            {capitalizeFirstLetter(exercise.category)} •{" "}
            {capitalizeFirstLetter(exercise.equipment)}
          </ThemedText>
        </View>

        <Ionicons name="chevron-forward" size={24} style={styles.icon} />
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

  icon: {
    color: "#6A6A80",
    flexShrink: 0,
  },
});

export default ExerciseCard;
