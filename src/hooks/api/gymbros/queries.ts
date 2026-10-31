import type { RoutineExercise } from "@/hooks/api/routineExercises/queries";
import type { Routine } from "@/hooks/api/routines/queries";
import { supabase } from "@/lib/supabase";
import type { Language } from "@/i18n";

/** How the signed-in user stands with another person. */
export type Relation =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "accepted"
  | "unavailable";

export type Person = {
  id: string;
  user_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export type SearchResult = Person & { relation: Relation };

export type GymbroRequest = Person & {
  friendship_id: string;
  direction: "incoming" | "outgoing";
  created_at: string;
};

export type GymbroProfile = Person & {
  /** Hidden (null) unless the viewer may see the full profile. */
  bio: string | null;
  relation: Relation;
  friendship_id: string | null;
  is_self: boolean;
  can_view_full: boolean;
};

/** A routine someone shares, with the split it belongs to. */
export type ProfileRoutine = Routine & { split_name: string };

/** Someone else's routine, with who made it. */
export type SharedRoutine = {
  id: string;
  name: string;
  color: string;
  quantity: number;
  owner_id: string;
  owner_user_name: string | null;
  owner_first_name: string | null;
  owner_last_name: string | null;
  owner_avatar_url: string | null;
};

export async function searchProfiles(query: string): Promise<SearchResult[]> {
  const { data, error } = await supabase.rpc("search_profiles", {
    p_query: query,
    p_limit: 20,
    p_offset: 0,
  });
  if (error) throw error;
  return (data ?? []) as SearchResult[];
}

export async function getGymbros(): Promise<Person[]> {
  const { data, error } = await supabase.rpc("get_gymbros");
  if (error) throw error;
  return data ?? [];
}

export async function getGymbroRequests(): Promise<GymbroRequest[]> {
  const { data, error } = await supabase.rpc("get_gymbro_requests");
  if (error) throw error;
  return (data ?? []) as GymbroRequest[];
}

/** Null when the profile doesn't exist or the viewer can't reach it. */
export async function getProfile(userId: string): Promise<GymbroProfile | null> {
  const { data, error } = await supabase.rpc("get_profile", {
    p_user_id: userId,
  });
  if (error) throw error;
  return ((data ?? []) as GymbroProfile[])[0] ?? null;
}

/** `accepted` when the other person had already asked, otherwise `pending`. */
export async function sendGymbroRequest(
  userId: string
): Promise<"pending" | "accepted"> {
  const { data, error } = await supabase.rpc("send_gymbro_request", {
    p_user_id: userId,
  });
  if (error) throw error;
  return data as "pending" | "accepted";
}

export async function respondToRequest(
  friendshipId: string,
  status: "accepted" | "rejected"
): Promise<void> {
  const { error } = await supabase.rpc("respond_to_friendship", {
    p_friendship_id: friendshipId,
    p_status: status,
  });
  if (error) throw error;
}

/** Withdraws a request the user sent; the database only lets the sender do this. */
export async function cancelRequest(friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);
  if (error) throw error;
}

export async function removeGymbro(userId: string): Promise<void> {
  const { error } = await supabase.rpc("remove_gymbro", { p_user_id: userId });
  if (error) throw error;
}

/** The routines of this person that the viewer is allowed to see. */
export async function getProfileRoutines(
  userId: string,
  language: Language
): Promise<ProfileRoutine[]> {
  const { data, error } = await supabase.rpc("get_profile_routines", {
    p_user_id: userId,
    p_language: language,
  });
  if (error) throw error;
  return data ?? [];
}

/** Null when the routine doesn't exist or isn't shared with the viewer. */
export async function getSharedRoutine(
  routineId: string
): Promise<SharedRoutine | null> {
  const { data, error } = await supabase.rpc("get_shared_routine", {
    p_routine_id: routineId,
  });
  if (error) throw error;
  return (data ?? [])[0] ?? null;
}

export async function getSharedRoutineExercises(
  routineId: string,
  language: Language
): Promise<RoutineExercise[]> {
  const { data, error } = await supabase.rpc("get_shared_routine_exercises", {
    p_routine_id: routineId,
    p_language: language,
  });
  if (error) throw error;
  return (data ?? []) as RoutineExercise[];
}

/** Copies a shared routine, with its exercises and sets, into the user's own. */
export async function importRoutine(routineId: string): Promise<string> {
  const { data: splitId, error: splitError } =
    await supabase.rpc("ensure_default_split");
  if (splitError) throw splitError;

  const { data, error } = await supabase.rpc("import_routine", {
    p_source_routine_id: routineId,
    p_target_split_id: splitId,
  });
  if (error) throw error;
  return data as string;
}

export async function countPendingRequests(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("friendships")
    .select("id", { count: "exact", head: true })
    .eq("addressee_id", userId)
    .eq("status", "pending");
  if (error) throw error;
  return count ?? 0;
}
