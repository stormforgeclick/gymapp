import { ThemedText } from "@/components/themed-text";
import CustomImage from "@/components/ui/CustomImage";
import Pill from "@/components/ui/Pill";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { useExercise } from "@/hooks/api/exercises";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import ExerciseDetailsSkeleton from "./components/ExerciseDetails";

const ExerciseDetailsScreen = () => {
  const { id: exerciseId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: exercise, isLoading } = useExercise(exerciseId);
  const [imageLoading, setImageLoading] = useState(true);

  const capitalizeString = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color="#6A6A80" />
        </Pressable>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <ExerciseDetailsSkeleton />
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Pressable onPress={() => router.back()} style={styles.iconButton}>
        <Ionicons name="chevron-back" size={24} color="#6A6A80" />
      </Pressable>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.videoContainer}>
          <CustomImage
            source={{ uri: exercise.gif_url }}
            style={styles.video}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </View>

        <ThemedText type="title" style={styles.title}>
          {capitalizeString(exercise.name)}
        </ThemedText>

        <View style={styles.tagsContainer}>
          <Pill
            label={capitalizeString(exercise.category)}
            backgroundColor="rgba(200, 255, 0, 0.05)"
            textColor="#C8FF00"
          />

          <Pill
            label={capitalizeString(exercise.equipment)}
            backgroundColor="rgba(255, 255, 255, 0.05)"
            textColor="#6A6A80"
          />

          <Pill
            label={capitalizeString(exercise.target)}
            backgroundColor="rgba(255, 255, 255, 0.05)"
            textColor="#6A6A80"
          />
        </View>

        <View style={styles.coachingContainer}>
          <ThemedText type="bold" style={styles.coachingTitle}>
            Coaching Tip
          </ThemedText>

          <ThemedText type="small" style={styles.coachingText}>
            {exercise.instructions}
          </ThemedText>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    padding: 16,
  },

  scrollView: {
    flex: 1,
  },

  contentContainer: {
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },

  title: {
    lineHeight: 32,
  },

  videoContainer: {
    paddingVertical: 36,
    backgroundColor: "#0A0A16",
    borderRadius: 12,
    alignItems: "center",
  },

  video: {
    width: 180,
    aspectRatio: 1,
    borderRadius: 12,
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  coachingContainer: {
    padding: 12,
    backgroundColor: "#14141F",
    borderRadius: 12,
    gap: 12,
  },

  coachingTitle: {
    color: "#C8FF00",
  },

  coachingText: {
    color: "#FFFFFFBF",
  },
});

export default ExerciseDetailsScreen;
