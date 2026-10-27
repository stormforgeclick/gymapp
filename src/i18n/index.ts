import { useLocales } from "expo-localization";
import { useCallback } from "react";

import { en } from "./en";
import { es, type Translations } from "./es";

type PluralEntry = { one: string; other: string };

/** Dot paths to every string or plural entry in the dictionary. */
type Paths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string | PluralEntry
    ? `${Prefix}${K}`
    : Paths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = Paths<typeof es>;

type Language = "es" | "en";

const dictionaries: Record<Language, Translations> = { es, en };

const FALLBACK_LANGUAGE: Language = "es";
const FALLBACK_DATE_LOCALE = "es-ES";

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
 * Translator bound to the device language: English when the phone is set to
 * English, Spanish for anything else. `dateLocale` is the device's own locale
 * tag when it's one we translate, so dates match the interface language.
 */
export function useT() {
  const [deviceLocale] = useLocales();

  const language: Language =
    deviceLocale?.languageCode === "en" ? "en" : FALLBACK_LANGUAGE;
  const dictionary = dictionaries[language];

  const dateLocale =
    deviceLocale?.languageCode === language
      ? (deviceLocale.languageTag ?? FALLBACK_DATE_LOCALE)
      : FALLBACK_DATE_LOCALE;

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      const entry = resolve(dictionary, key);
      const template =
        typeof entry === "string"
          ? entry
          : params?.count === 1
            ? entry.one
            : entry.other;

      return interpolate(template, params);
    },
    [dictionary],
  );

  return { t, language, dateLocale };
}
