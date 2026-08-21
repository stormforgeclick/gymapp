import {
  getExercises,
  getExercisesFilters,
} from "@/hooks/api/exercises/queries";
import { useQuery } from "@tanstack/react-query";

export const useExercises = (
  selectedFilters: Record<string, string | undefined> = {}
) => {
  return useQuery({
    queryKey: ["exercises", selectedFilters],
    queryFn: () => getExercises(selectedFilters),
  });
};

export const useExercisesFilters = () => {
  return useQuery({
    queryKey: ["exercisesFilters"],
    queryFn: getExercisesFilters,
  });
};
