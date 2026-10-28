/** Uppercases the first letter and leaves the rest as it is. */
export const capitalize = (text: string) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

/** Up to two capital letters from a name, e.g. "ana lopez" -> "AL". */
export const getInitials = (name: string) =>
  name
    .replace(/^@/, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
