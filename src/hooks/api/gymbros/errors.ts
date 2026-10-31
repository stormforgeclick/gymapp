import type { TranslationKey } from "@/i18n";
import { errorKind } from "@/lib/errors";

/** The message to show when a gymbro action (request, answer, remove) fails. */
export const gymbroErrorKey = (error: unknown): TranslationKey =>
  errorKind(error) === "unavailable"
    ? "gymbros.errorUnavailable"
    : "gymbros.errorGeneric";
