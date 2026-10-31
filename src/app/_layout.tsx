import {
  BarlowCondensed_700Bold,
  BarlowCondensed_900Black,
} from "@expo-google-fonts/barlow-condensed";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  type ErrorBoundaryProps,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

import ErrorFallback from "@/components/ui/ErrorFallback";
import { Colors } from "@/constants/theme";
import { queryClient } from "@/lib/queryClient";
import { devConsoleReporter, setErrorReporter } from "@/lib/report";
import { AccentProvider } from "@/providers/AccentProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { DialogProvider } from "@/providers/DialogProvider";
import { PreferencesProvider, usePreferences } from "@/providers/PreferencesProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

// Until a crash reporting service is connected, errors only show up while developing.
if (__DEV__) setErrorReporter(devConsoleReporter);

const navigationThemes = {
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.dark.background,
      card: Colors.dark.surface,
      text: Colors.dark.text,
      border: Colors.dark.border,
      primary: Colors.dark.primary,
    },
  },
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.light.background,
      card: Colors.light.surface,
      text: Colors.light.text,
      border: Colors.light.border,
      primary: Colors.light.accentText,
    },
  },
};

/** Expo Router draws this when a screen throws while rendering. */
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorFallback {...props} />;
}

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <AppShell />
    </PreferencesProvider>
  );
}

function AppShell() {
  const colorScheme = useColorScheme();
  const { isLoaded: preferencesLoaded } = usePreferences();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    BarlowCondensed_700Bold,
    BarlowCondensed_900Black,
  });

  // The saved theme is applied once loaded, so the splash waits for it to
  // avoid a flash of the wrong one.
  const ready = fontsLoaded && preferencesLoaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider
        value={colorScheme === "dark" ? navigationThemes.dark : navigationThemes.light}
      >
        <StatusBar style="auto" />

        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AccentProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <BottomSheetModalProvider>
                  <ToastProvider>
                    <DialogProvider>
                      <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="login" />
                        <Stack.Screen name="register" />
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="settings" />
                        <Stack.Screen name="edit-profile" />
                        <Stack.Screen name="user/[id]" />
                        <Stack.Screen name="shared-routine/[id]" />
                        <Stack.Screen name="exercises/index" />
                        <Stack.Screen name="exercises/[id]" />
                        <Stack.Screen name="routine/[id]" options={{ headerShown: false }} />
                        <Stack.Screen name="workout/[id]" />
                      </Stack>
                    </DialogProvider>
                  </ToastProvider>
                </BottomSheetModalProvider>
              </GestureHandlerRootView>
            </AccentProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
