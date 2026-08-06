import { getExercises } from "@/services/exercises.service";
import { useQuery } from "@tanstack/react-query";

export function useExercises() {
  return useQuery({
    queryKey: ["exercises"],
    queryFn: getExercises,
  });
}
