import { supabase } from "@/lib/supabase";

export async function getExercises(
  selectedFilters: Record<string, string | undefined>
) {
  let query = supabase.from("exercises").select("*").order("name").limit(10);

  Object.entries(selectedFilters).forEach(([key, value]) => {
    if (value) {
      query = query.eq(key, value);
    }
  });

  const { data, error } = await query;

  if (error) throw error;

  return data;
}

export async function getExercisesFilters() {
  const { data, error } = await supabase.rpc("get_exercise_filters");

  if (error) {
    console.error(error);
    return;
  }

  return data;
}
