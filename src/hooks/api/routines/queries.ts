import { supabase } from "@/lib/supabase";
import type { Language } from "@/i18n";

export type Routine = {
  id: string;
  name: string;
  color: string;
  quantity: number;
  tags: string[];
  split_id: string;
};

/** Without `splitId` the routine goes into the active split. */
export type CreateRoutineInput = {
  name: string;
  color: string;
  splitId?: string;
};
export type UpdateRoutineInput = { id: string; name: string; color: string };

export async function getRoutines(language: Language = "es"): Promise<Routine[]> {
  const { data, error } = await supabase.rpc("get_routines", { p_language: language });
  if (error) throw error;
  return data ?? [];
}

export async function createRoutine(input: CreateRoutineInput): Promise<Routine> {
  const { data, error } = await supabase.rpc("create_routine", {
    p_name: input.name,
    p_color: input.color,
    p_split_id: input.splitId,
  });
  if (error) throw error;
  return data[0];
}

export async function updateRoutine(input: UpdateRoutineInput): Promise<Routine> {
  const { data, error } = await supabase.rpc("update_routine", {
    p_id: input.id,
    p_name: input.name,
    p_color: input.color,
  });
  if (error) throw error;
  return data[0];
}

export async function deleteRoutine(id: string): Promise<string> {
  const { data, error } = await supabase.rpc("delete_routine", { p_id: id });
  if (error) throw error;
  return data as string;
}
