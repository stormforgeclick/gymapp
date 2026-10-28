import { supabase } from "@/lib/supabase";

type Language = "en" | "es";

export type ProfilePrivacy = "public" | "gymbros" | "private";

export type Profile = {
  id: string;
  user_name: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  profile_privacy: ProfilePrivacy;
};

export type ProfilePatch = Partial<Omit<Profile, "id">>;

const PROFILE_COLUMNS =
  "id, user_name, first_name, last_name, bio, avatar_url, profile_privacy";

const AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Postgres error codes the profile form has a specific message for. */
export const UNIQUE_VIOLATION = "23505";
export const CHECK_VIOLATION = "23514";

const avatarPath = (userId: string) => `${userId}/avatar`;

export async function getMyProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("custom_users")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateMyProfile(
  userId: string,
  patch: ProfilePatch
): Promise<Profile> {
  const { data, error } = await supabase
    .from("custom_users")
    .update(patch)
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .single();
  if (error) throw error;
  return data as Profile;
}

/** Keeps the language stored with the account in step with the app's. */
export async function updateMyLanguage(
  userId: string,
  language: Language
): Promise<void> {
  const { error } = await supabase
    .from("custom_users")
    .update({ language })
    .eq("id", userId);
  if (error) throw error;
}

/**
 * Uploads the picked photo over the user's previous one and returns its public
 * URL. The file name never changes, so the URL is versioned to make image
 * caches fetch the new picture.
 */
export async function uploadAvatar(
  userId: string,
  uri: string,
  mimeType: string | null | undefined
): Promise<string> {
  const contentType =
    mimeType && AVATAR_MIME_TYPES.includes(mimeType) ? mimeType : "image/jpeg";

  const body = await (await fetch(uri)).arrayBuffer();

  const { error } = await supabase.storage
    .from("avatars")
    .upload(avatarPath(userId), body, { contentType, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(avatarPath(userId));
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function removeAvatarFile(userId: string): Promise<void> {
  const { error } = await supabase.storage
    .from("avatars")
    .remove([avatarPath(userId)]);
  if (error) throw error;
}
