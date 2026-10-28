/** Uppercases the first letter and leaves the rest as it is. */
export const capitalize = (text: string) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
