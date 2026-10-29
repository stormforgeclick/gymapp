import { supabase } from "@/lib/supabase";

/** Who may see the routines of a split: only the owner, the owner's gymbros, or anyone. */
export type SplitPrivacy = "private" | "gymbros" | "public";

export type Split = {
  id: string;
  name: string;
  privacy: SplitPrivacy;
  /** The split Home and Routines work with. Exactly one split is active. */
  is_active: boolean;
  /** Routines it currently holds. */
  routines: number;
  created_at: string;
};

export async function getSplits(): Promise<Split[]> {
  const { data, error } = await supabase.rpc("get_splits");
  if (error) throw error;
  return (data ?? []) as Split[];
}

/** Creates the split and makes it the active one. */
export async function createSplit(name: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_split", { p_name: name });
  if (error) throw error;
  return data as string;
}

export async function renameSplit(id: string, name: string): Promise<void> {
  const { error } = await supabase.rpc("rename_split", {
    p_id: id,
    p_name: name,
  });
  if (error) throw error;
}

export async function setSplitPrivacy(
  id: string,
  privacy: SplitPrivacy
): Promise<void> {
  const { error } = await supabase.rpc("set_split_privacy", {
    p_id: id,
    p_privacy: privacy,
  });
  if (error) throw error;
}

export async function setActiveSplit(id: string): Promise<void> {
  const { error } = await supabase.rpc("set_active_split", { p_id: id });
  if (error) throw error;
}

/** Archives the split with its routines; the workout history stays. */
export async function archiveSplit(id: string): Promise<void> {
  const { error } = await supabase.rpc("archive_split", { p_id: id });
  if (error) throw error;
}

/** Copies the split's routines into a new split and makes it the active one. */
export async function duplicateSplit(id: string, name: string): Promise<string> {
  const { data, error } = await supabase.rpc("duplicate_split", {
    p_id: id,
    p_name: name,
  });
  if (error) throw error;
  return data as string;
}

export async function moveRoutineToSplit(
  routineId: string,
  splitId: string
): Promise<void> {
  const { error } = await supabase.rpc("move_routine_to_split", {
    p_routine_id: routineId,
    p_split_id: splitId,
  });
  if (error) throw error;
}

/** The database rejects a name another of the user's splits already has. */
export const isNameTaken = (error: unknown) =>
  String((error as { message?: string })?.message ?? "").includes(
    "already exists"
  );
