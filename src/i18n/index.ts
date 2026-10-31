import { useLocales } from "expo-localization";
import { useCallback } from "react";

import { usePreferences } from "@/providers/PreferencesProvider";
import { en } from "./en";
import { es, type Translations } from "./es";
import {
  resolveLanguage,
  translate,
  type Language,
  type PluralEntry,
} from "./translate";

export { resolveLanguage };
export type { Language };

/** Dot paths to every string or plural entry in the dictionary. */
type Paths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string | PluralEntry
    ? `${Prefix}${K}`
    : Paths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = Paths<typeof es>;

const dictionaries: Record<Language, Translations> = { es, en };

const FALLBACK_DATE_LOCALES: Record<Language, string> = {
  es: "es-ES",
  en: "en-US",
};

/**
 * Translator bound to the language the user picked in settings, or to the
 * device's when they follow the system: English when the phone is set to
 * English, Spanish for anything else. `dateLocale` is the device's own locale
 * tag when it's one we translate, so dates match the interface language.
 */
export function useT() {
  const [deviceLocale] = useLocales();
  const { language: preference } = usePreferences();

  const language = resolveLanguage(preference, deviceLocale?.languageCode);
  const dictionary = dictionaries[language];

  const dateLocale =
    deviceLocale?.languageCode === language
      ? (deviceLocale.languageTag ?? FALLBACK_DATE_LOCALES[language])
      : FALLBACK_DATE_LOCALES[language];

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(dictionary, key, params),
    [dictionary],
  );

  return { t, language, dateLocale };
}
