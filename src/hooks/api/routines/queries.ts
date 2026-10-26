import { supabase } from "@/lib/supabase";

type Language = "en" | "es";

export type Routine = {
  id: string;
  name: string;
  color: string;
  quantity: number;
  tags: string[];
};

export type CreateRoutineInput = { name: string; color: string };
export type UpdateRoutineInput = { id: string; name: string; color: string };

export async function getRoutines(language: Language = "es"): Promise<Routine[]> {
  const { data, error } = await supabase.rpc("get_routines", { p_language: language });
  if (error) throw error;
  return (data ?? []) as Routine[];
}

export async function createRoutine(input: CreateRoutineInput): Promise<Routine> {
  const { data, error } = await supabase.rpc("create_routine", {
    p_name: input.name,
    p_color: input.color,
  });
  if (error) throw error;
  return data?.[0] as Routine;
}

export async function updateRoutine(input: UpdateRoutineInput): Promise<Routine> {
  const { data, error } = await supabase.rpc("update_routine", {
    p_id: input.id,
    p_name: input.name,
    p_color: input.color,
  });
  if (error) throw error;
  return data?.[0] as Routine;
}

export async function deleteRoutine(id: string): Promise<string> {
  const { data, error } = await supabase.rpc("delete_routine", { p_id: id });
  if (error) throw error;
  return data as string;
}
