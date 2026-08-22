import { supabase } from "@/lib/supabase";

type Language = "en" | "es";

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

export async function getExercises(
  selectedFilters: Record<string, string | undefined>,
  language: Language = "es",
  pageParam = 0
) {
  const pageSize = 20;

  const { data, error } = await supabase.rpc("get_exercises", {
    p_language: language,
    p_category_id: selectedFilters.category ?? null,
    p_equipment_id: selectedFilters.equipment ?? null,
    p_muscle_group_id: selectedFilters.muscle_group ?? null,
    p_target_id: selectedFilters.target ?? null,
    p_limit: pageSize,
    p_offset: pageParam,
  });

  if (error) throw error;

  return data;
}

export async function getExercisesFilters(language: Language = "es") {
  const { data, error } = await supabase.rpc("get_exercise_filters", {
    p_language: language,
  });

  if (error) {
    return;
  }

  return data;
}
