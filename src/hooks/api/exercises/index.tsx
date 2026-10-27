import {
  getExercise,
  getExercises,
  getExercisesFilters,
} from "@/hooks/api/exercises/queries";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

type Language = "en" | "es";

export function useExercises(
  selectedFilters: Record<string, string | undefined>,
  search: string,
  language: Language = "es"
) {
  return useInfiniteQuery({
    queryKey: ["exercises", selectedFilters, search, language],

    queryFn: ({ pageParam }) => {
      return getExercises(selectedFilters, search, language, pageParam);
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

export const useExercisesFilters = (language: Language = "es") => {
  return useQuery({
    queryKey: ["exercisesFilters", language],
    queryFn: () => getExercisesFilters(language),
    staleTime: Infinity,
  });
};

export const useExercise = (id: string, language: Language = "es") => {
  return useQuery({
    queryKey: ["exercise", id, language],
    queryFn: () => getExercise(id, language),
  });
};
