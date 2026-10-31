export type ErrorKind = "routineEmpty" | "nameTaken" | "unavailable" | "unknown";

// The database reports these cases only through the text of its exceptions.
const MARKERS: [text: string, kind: ErrorKind][] = [
  ["has no exercises", "routineEmpty"],
  ["already exists", "nameTaken"],
  ["unavailable", "unavailable"],
];

/** Which known failure an error from the database is, or "unknown". */
export function errorKind(error: unknown): ErrorKind {
  const message = (error as { message?: unknown } | null | undefined)?.message;
  if (typeof message !== "string") return "unknown";

  return MARKERS.find(([text]) => message.includes(text))?.[1] ?? "unknown";
}
