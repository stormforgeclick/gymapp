import type { Language } from "@/i18n";
import { supabase } from "@/lib/supabase";

export type Exercise = {
  id: string;
  name: string;
  category: string | null;
  equipment: string | null;
  muscleGroup: string | null;
  target: string | null;
  instructions: string | null;
  image: string | null;
  gifUrl: string | null;
};

export type FilterOption = { id: string; name: string };

/** What the exercise list can be filtered by; the database returns it as JSON. */
export type ExerciseFilters = {
  categories: FilterOption[];
  equipment: FilterOption[];
  muscle_groups: FilterOption[];
  targets: FilterOption[];
};

export async function getExercises(
  selectedFilters: Record<string, string | undefined>,
  search = "",
  language: Language = "es",
  pageParam = 0
) {
  const pageSize = 20;

  const { data, error } = await supabase.rpc("get_exercises", {
    p_language: language,

    p_category_id: selectedFilters.category,
    p_equipment_id: selectedFilters.equipment,
    p_muscle_group_id: selectedFilters.muscle_group,
    p_target_id: selectedFilters.target,

    p_search: search.trim() || undefined,

    p_limit: pageSize,
    p_offset: pageParam,
  });

  if (error) throw error;

  return data;
}

export async function getExercisesFilters(
  language: Language = "es"
): Promise<ExerciseFilters> {
  const { data, error } = await supabase.rpc("get_exercise_filters", {
    p_language: language,
  });

  if (error) throw error;

  return data as unknown as ExerciseFilters;
}

export async function getExercise(id: string, language: Language = "es") {
  const { data, error } = await supabase.rpc("get_exercise", {
    p_id: id,
    p_language: language,
  });

  if (error) throw error;

  return data?.[0] ?? null;
}
