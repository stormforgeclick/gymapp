import { errorKind } from "./errors";

export type ErrorContext = {
  /** Where the error was caught. */
  source: "query" | "mutation" | "boundary";
  /** The query key, for errors from queries. */
  key?: readonly unknown[];
};

export type ErrorReporter = (error: Error, context: ErrorContext) => void;

let reporter: ErrorReporter | null = null;

/** Where unexpected errors go (a crash reporting service); `null` drops them. */
export function setErrorReporter(next: ErrorReporter | null) {
  reporter = next;
}

/** Prints to the console, for development builds. */
export const devConsoleReporter: ErrorReporter = (error, context) => {
  console.warn(`[error:${context.source}]`, error);
};

function toError(value: unknown): Error {
  if (value instanceof Error) return value;

  // The database client rejects with plain objects that carry a message.
  const message = (value as { message?: unknown } | null | undefined)?.message;
  if (typeof message === "string") return new Error(message, { cause: value });

  if (typeof value === "string") return new Error(value);
  return new Error("Unknown error", { cause: value });
}

/**
 * Reports an error nobody has handled. Failures the app already explains to the
 * person (a routine without exercises, a name that is taken...) are expected and
 * left out, so the reporter only sees what is worth looking at. Never throws:
 * reporting must not be what breaks the app.
 */
export function reportError(error: unknown, context: ErrorContext) {
  if (!reporter || errorKind(error) !== "unknown") return;

  try {
    reporter(toError(error), context);
  } catch {
    // A broken reporter has nowhere left to report to.
  }
}
