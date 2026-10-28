import { supabase } from "@/lib/supabase";

type Language = "en" | "es";

export type Routine = {
  id: string;
  name: string;
  color: string;
  quantity: number;
  tags: string[];
};

/** Who may see a routine: only its owner, the owner's gymbros, or anyone. */
export type RoutinePrivacy = "private" | "gymbros" | "public";

export type RoutineSharing = {
  id: string;
  name: string;
  color: string;
  privacy: RoutinePrivacy;
  quantity: number;
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

export async function getRoutineSharing(): Promise<RoutineSharing[]> {
  const { data, error } = await supabase.rpc("get_routine_sharing");
  if (error) throw error;
  return (data ?? []) as RoutineSharing[];
}

export async function setRoutinePrivacy(
  id: string,
  privacy: RoutinePrivacy
): Promise<void> {
  // `.single()` turns "no row matched" (not the owner) into an error.
  const { error } = await supabase
    .from("routines")
    .update({ privacy })
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw error;
}

export async function deleteRoutine(id: string): Promise<string> {
  const { data, error } = await supabase.rpc("delete_routine", { p_id: id });
  if (error) throw error;
  return data as string;
}
