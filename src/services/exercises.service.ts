import { supabase } from "@/lib/supabase";

export async function getExercises() {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("name")
    .limit(10);

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
