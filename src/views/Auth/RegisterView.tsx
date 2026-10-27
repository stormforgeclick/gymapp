import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import TextField from "@/components/ui/TextField";
import { IconSize, Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useRegister } from "@/hooks/api/auth";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

type FieldName = "email" | "password" | "confirmPassword";
type FieldErrors = Partial<Record<FieldName, string>>;

const validators: Record<
  FieldName,
  (values: { email: string; password: string; confirmPassword: string }) => string | undefined
> = {
  email: ({ email }) =>
    !email.trim().includes("@") || !email.trim().includes(".")
      ? "Ingresa un correo electrónico válido"
      : undefined,
  password: ({ password }) =>
    password.length < 8
      ? "La contraseña debe tener al menos 8 caracteres"
      : undefined,
  confirmPassword: ({ password, confirmPassword }) =>
    password !== confirmPassword ? "Las contraseñas no coinciden" : undefined,
};

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
  terms: {
    textAlign: "center" as const,
  },
});

export function RegisterView() {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const { mutate: register, isPending, error } = useRegister();

  const values = { email, password, confirmPassword };
  const canSubmit = !!email.trim() && !!password && !!confirmPassword;

  function validateField(field: FieldName, next = values) {
    setErrors((prev) => ({ ...prev, [field]: validators[field](next) }));
  }

  // Once a field shows an error, re-check it as the user types so it clears
  // as soon as the value is fixed.
  function change(field: FieldName, setter: (v: string) => void) {
    return (value: string) => {
      setter(value);
      if (errors[field]) validateField(field, { ...values, [field]: value });
    };
  }

  function handleRegister() {
    const nextErrors: FieldErrors = {};
    (Object.keys(validators) as FieldName[]).forEach((field) => {
      const message = validators[field](values);
      if (message) nextErrors[field] = message;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    register(
      { name: name.trim(), email: email.trim(), password },
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
              CREA TU CUENTA
            </ThemedText>
            <ThemedText tone="secondary">
              Empieza a registrar tu progreso hoy
            </ThemedText>
          </View>

          <View style={styles.form}>
            <TextField
              label="Nombre"
              icon="account-outline"
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
            />

            <TextField
              label="Correo electrónico"
              icon="email-outline"
              value={email}
              onChangeText={change("email", setEmail)}
              onBlur={() => email && validateField("email")}
              placeholder="tu@correo.com"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              error={errors.email}
            />

            <TextField
              label="Contraseña"
              icon="lock-outline"
              value={password}
              onChangeText={change("password", setPassword)}
              onBlur={() => password && validateField("password")}
              placeholder="Mín. 8 caracteres"
              secureEntry
              autoComplete="new-password"
              textContentType="newPassword"
              error={errors.password}
            />

            <TextField
              label="Confirmar contraseña"
              icon="shield-check-outline"
              value={confirmPassword}
              onChangeText={change("confirmPassword", setConfirmPassword)}
              onBlur={() => confirmPassword && validateField("confirmPassword")}
              placeholder="Repite tu contraseña"
              secureEntry
              autoComplete="new-password"
              textContentType="newPassword"
              error={errors.confirmPassword}
            />
          </View>

          <View style={styles.actions}>
            {error && (
              <ThemedText
                type="label"
                tone="danger"
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
              >
                {error.message}
              </ThemedText>
            )}

            <Button
              label="Registrarse"
              onPress={handleRegister}
              loading={isPending}
              disabled={!canSubmit}
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <ThemedText type="label" tone="secondary">
                o
              </ThemedText>
              <View style={styles.divider} />
            </View>

            <Button
              label="Ya tengo cuenta"
              variant="secondary"
              onPress={() => router.replace("/login")}
            />
          </View>

          <ThemedText type="label" tone="secondary" style={styles.terms}>
            Al registrarte aceptas nuestros{" "}
            <ThemedText type="label" tone="accent" accessibilityRole="link">
              Términos de uso
            </ThemedText>{" "}
            y{" "}
            <ThemedText type="label" tone="accent" accessibilityRole="link">
              Política de privacidad
            </ThemedText>
          </ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
