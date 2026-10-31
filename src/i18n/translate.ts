import type { LanguagePreference } from "@/providers/PreferencesProvider";
import type { Translations } from "./es";

export type PluralEntry = { one: string; other: string };

export type Language = "es" | "en";

const FALLBACK_LANGUAGE: Language = "es";

/** The language to use: the user's choice, or the phone's when they follow the system. */
export function resolveLanguage(
  preference: LanguagePreference,
  deviceLanguageCode: string | null | undefined
): Language {
  if (preference !== "system") return preference;
  return deviceLanguageCode === "en" ? "en" : FALLBACK_LANGUAGE;
}

function resolve(dictionary: Translations, key: string): string | PluralEntry {
  return key
    .split(".")
    .reduce<any>((node, part) => node?.[part], dictionary);
}

function interpolate(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in params ? String(params[name]) : match,
  );
}

/**
 * Looks up a dot-path key and fills in its `{placeholders}`. Plural entries
 * take their singular form when the `count` param is 1 and the other form for
 * anything else.
 */
export function translate(
  dictionary: Translations,
  key: string,
  params?: Record<string, string | number>
): string {
  const entry = resolve(dictionary, key);
  const template =
    typeof entry === "string"
      ? entry
      : params?.count === 1
        ? entry.one
        : entry.other;

  return interpolate(template, params);
}
