import Constants from "expo-constants";
import { getLocales } from "expo-localization";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import ScreenHeader from "@/components/ui/ScreenHeader";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useLogout } from "@/hooks/api/auth";
import { updateMyLanguage } from "@/hooks/api/profile/queries";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { resolveLanguage, useT } from "@/i18n";
import { useAuth } from "@/providers/AuthProvider";
import { useDialog } from "@/providers/DialogProvider";
import {
  usePreferences,
  type LanguagePreference,
  type ThemePreference,
} from "@/providers/PreferencesProvider";
import { useToast } from "@/providers/ToastProvider";
import Section from "@/components/ui/Section";

const makeStyles = (c: ThemeColors) => ({
  content: {
    gap: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  field: {
    gap: Spacing.two,
  },
  readOnly: {
    gap: Spacing.half,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  // Kept apart from the other sections so it isn't tapped by mistake.
  sessionSection: {
    marginTop: Spacing.four,
  },
  version: {
    textAlign: "center" as const,
  },
});

const SettingsScreen = () => {
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();
  const { session } = useAuth();
  const dialog = useDialog();
  const toast = useToast();
  const preferences = usePreferences();
  const logout = useLogout();

  const themeOptions: { value: ThemePreference; label: string }[] = [
    { value: "system", label: t("settings.themeSystem") },
    { value: "light", label: t("settings.themeLight") },
    { value: "dark", label: t("settings.themeDark") },
  ];

  const languageOptions: { value: LanguagePreference; label: string }[] = [
    { value: "system", label: t("settings.languageSystem") },
    { value: "es", label: t("settings.languageEs") },
    { value: "en", label: t("settings.languageEn") },
  ];

  const handleLanguage = (value: LanguagePreference) => {
    preferences.setLanguage(value);
    if (!session) return;
    // Best effort: the interface already changed, the account copy can lag.
    updateMyLanguage(
      session.user.id,
      resolveLanguage(value, getLocales()[0]?.languageCode)
    ).catch(() => {});
  };

  const signOut = () =>
    logout.mutate(undefined, {
      onSuccess: () => {
        router.dismissAll();
        router.replace("/login");
      },
      onError: () => toast.show(t("settings.logoutError"), { tone: "error" }),
    });

  const confirmLogout = () =>
    dialog.show({
      title: t("settings.logoutConfirmTitle"),
      message: t("settings.logoutConfirmMessage"),
      actions: [
        { label: t("common.cancel"), variant: "cancel" },
        {
          label: t("settings.logout"),
          variant: "destructive",
          onPress: signOut,
        },
      ],
    });

  return (
    <ScreenContainer edges={["top", "bottom"]}>
      <ScreenHeader title={t("settings.title")} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Section title={t("settings.appearance")}>
          <View style={styles.field}>
            <ThemedText type="label" tone="secondary">
              {t("settings.theme")}
            </ThemedText>
            <SegmentedControl
              options={themeOptions}
              value={preferences.theme}
              onChange={preferences.setTheme}
              accessibilityLabel={t("settings.theme")}
            />
          </View>
        </Section>

        <Section title={t("settings.language")}>
          <SegmentedControl
            options={languageOptions}
            value={preferences.language}
            onChange={handleLanguage}
            accessibilityLabel={t("settings.language")}
          />
        </Section>

        <Section title={t("settings.account")}>
          <View
            style={styles.readOnly}
            accessible
            accessibilityLabel={`${t("settings.email")}: ${session?.user.email ?? ""}`}
          >
            <ThemedText type="caption" tone="secondary">
              {t("settings.email")}
            </ThemedText>
            <ThemedText type="body" numberOfLines={1}>
              {session?.user.email ?? "—"}
            </ThemedText>
          </View>
        </Section>

        <View style={styles.sessionSection}>
          <Section title={t("settings.session")}>
            <Button
              label={t("settings.logout")}
              variant="danger"
              leftIcon="logout"
              onPress={confirmLogout}
              loading={logout.isPending}
            />
          </Section>
        </View>

        <ThemedText type="caption" tone="tertiary" style={styles.version}>
          {t("settings.version", {
            version: Constants.expoConfig?.version ?? "1.0.0",
          })}
        </ThemedText>
      </ScrollView>
    </ScreenContainer>
  );
};

export default SettingsScreen;
