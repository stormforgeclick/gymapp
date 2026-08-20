import {
  getExercises,
  getExercisesFilters,
} from "@/services/exercises.service";
import { useQuery } from "@tanstack/react-query";

export function useExercises() {
  return useQuery({
    queryKey: ["exercises"],
    queryFn: getExercises,
  });
}

export function useExercisesFilters() {
  return useQuery({
    queryKey: ["exercisesFilters"],
    queryFn: getExercisesFilters,
  });
}
