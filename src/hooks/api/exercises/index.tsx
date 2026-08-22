import {
  getExercises,
  getExercisesFilters,
} from "@/hooks/api/exercises/queries";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

type Language = "en" | "es";

export function useExercises(
  selectedFilters: Record<string, string | undefined>,
  language: Language = "es"
) {
  return useInfiniteQuery({
    queryKey: ["exercises", selectedFilters, language],

    queryFn: ({ pageParam }) => {
      return getExercises(selectedFilters, language, pageParam);
    },

    initialPageParam: 0,

    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) {
        return undefined;
      }

      return allPages.length * 20;
    },
  });
}

export const useExercisesFilters = () => {
  return useQuery({
    queryKey: ["exercisesFilters"],
    queryFn: () => getExercisesFilters(),
  });
};
