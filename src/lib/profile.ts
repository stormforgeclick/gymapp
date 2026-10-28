type NameParts = {
  first_name: string | null;
  last_name: string | null;
  user_name: string | null;
};

/** "First Last", falling back to "@user"; null when the person has neither. */
export function displayName(profile: NameParts): string | null {
  const fullName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || (profile.user_name ? `@${profile.user_name}` : null);
}
