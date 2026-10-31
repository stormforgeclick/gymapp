import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import TextField from "@/components/ui/TextField";
import { IconSize, Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useLogin } from "@/hooks/api/auth";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";

const makeStyles = (c: ThemeColors) => ({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    gap: Spacing.five,
  },
  logoWrapper: {
    alignItems: "center" as const,
    gap: Spacing.tight,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: Radius.pill,
    backgroundColor: c.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  appName: {
    letterSpacing: 4,
  },
  header: {
    gap: Spacing.one,
  },
  form: {
    gap: Spacing.comfy,
  },
  actions: {
    gap: Spacing.three,
  },
  dividerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.tight,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: c.border,
  },
});

export function LoginView() {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { mutate: login, isPending, error } = useLogin();

  const canSubmit = !!email.trim() && !!password;

  function handleLogin() {
    login(
      { email: email.trim(), password },
      { onSuccess: () => router.replace("/(tabs)") }
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons
                name="dumbbell"
                size={IconSize.lg + 8}
                color={theme.onPrimary}
              />
            </View>
            <ThemedText type="headline" tone="accent" style={styles.appName}>
              GYMAPP
            </ThemedText>
          </View>

          <View style={styles.header}>
            <ThemedText type="title" accessibilityRole="header">
              {t("auth.login.title")}
            </ThemedText>
            <ThemedText tone="secondary">{t("auth.login.subtitle")}</ThemedText>
          </View>

          <View style={styles.form}>
            <TextField
              testID="login-email"
              label={t("auth.email")}
              icon="email-outline"
              value={email}
              onChangeText={setEmail}
              placeholder={t("auth.emailPlaceholder")}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />

            <TextField
              testID="login-password"
              label={t("auth.password")}
              icon="lock-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureEntry
              autoComplete="current-password"
              textContentType="password"
              error={error?.message}
            />
          </View>

          <View style={styles.actions}>
            <Button
              testID="login-submit"
              label={t("auth.login.submit")}
              onPress={handleLogin}
              loading={isPending}
              disabled={!canSubmit}
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <ThemedText type="label" tone="secondary">
                {t("common.or")}
              </ThemedText>
              <View style={styles.divider} />
            </View>

            <Button
              label={t("auth.login.createAccount")}
              variant="secondary"
              onPress={() => router.replace("/register")}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
