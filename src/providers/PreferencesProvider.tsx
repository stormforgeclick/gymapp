import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance } from "react-native";

export type ThemePreference = "system" | "light" | "dark";
export type LanguagePreference = "system" | "es" | "en";

type Preferences = {
  theme: ThemePreference;
  language: LanguagePreference;
};

type PreferencesState = Preferences & {
  /** False until the saved choices have been read, so the UI can wait for them. */
  isLoaded: boolean;
  setTheme: (theme: ThemePreference) => void;
  setLanguage: (language: LanguagePreference) => void;
};

const STORAGE_KEY = "gymbro.preferences";

const DEFAULTS: Preferences = { theme: "system", language: "system" };

const THEMES: ThemePreference[] = ["system", "light", "dark"];
const LANGUAGES: LanguagePreference[] = ["system", "es", "en"];

const PreferencesContext = createContext<PreferencesState>({
  ...DEFAULTS,
  isLoaded: false,
  setTheme: () => {},
  setLanguage: () => {},
});

export const usePreferences = () => useContext(PreferencesContext);

function parse(raw: string | null): Preferences {
  if (!raw) return DEFAULTS;

  try {
    const value = JSON.parse(raw);
    return {
      theme: THEMES.includes(value?.theme) ? value.theme : DEFAULTS.theme,
      language: LANGUAGES.includes(value?.language)
        ? value.language
        : DEFAULTS.language,
    };
  } catch {
    // Unreadable saved value: start from the defaults.
    return DEFAULTS;
  }
}

/**
 * The user's own theme and language choices, kept on the device. "System"
 * (the default) follows the phone, so nothing changes until they pick.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setPreferences(parse(raw)))
      // Best effort: without the saved choices the defaults apply.
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    // Best effort: the choice still applies for this session if saving fails.
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)).catch(() => {});
  }, [preferences, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    // "unspecified" hands the choice back to the system.
    Appearance.setColorScheme(
      preferences.theme === "system" ? "unspecified" : preferences.theme
    );
  }, [preferences.theme, isLoaded]);

  const value = useMemo<PreferencesState>(
    () => ({
      ...preferences,
      isLoaded,
      setTheme: (theme) => setPreferences((current) => ({ ...current, theme })),
      setLanguage: (language) =>
        setPreferences((current) => ({ ...current, language })),
    }),
    [preferences, isLoaded]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
