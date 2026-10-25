import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { AuthInput } from "@/components/ui/AuthInput";
import { useLogin } from "@/hooks/api/auth";

export function LoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { mutate: login, isPending, error } = useLogin();

  function handleLogin() {
    login(
      { email: email.trim(), password },
      { onSuccess: () => router.replace("/(tabs)") }
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="dumbbell" size={32} color="#080810" />
            </View>
            <ThemedText type="title" style={styles.appName}>
              GYMAPP
            </ThemedText>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.greeting}>
              BIENVENIDO DE VUELTA
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Inicia sesión para continuar tu progreso
            </ThemedText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <AuthInput
              label="Correo electrónico"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              keyboardType="email-address"
            />

            <AuthInput
              label="Contraseña"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureEntry
            />

            {error && (
              <ThemedText type="small" style={styles.errorText}>
                {error.message}
              </ThemedText>
            )}

            <TouchableOpacity style={styles.forgotButton}>
              <ThemedText type="small" style={styles.forgotText}>
                ¿Olvidaste tu contraseña?
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* CTA */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryButton, isPending && styles.primaryButtonDisabled]}
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator color="#080810" />
              ) : (
                <ThemedText type="semiBold" style={styles.primaryButtonText}>
                  Iniciar sesión
                </ThemedText>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.dividerText}>
                o
              </ThemedText>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              onPress={() => router.replace("/register")}
            >
              <ThemedText type="semiBold" style={styles.secondaryButtonText}>
                Crear cuenta
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#080810",
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    gap: 40,
  },
  logoWrapper: {
    alignItems: "center",
    gap: 12,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#C8FF00",
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    color: "#C8FF00",
    letterSpacing: 4,
    fontSize: 28,
    lineHeight: 36,
  },
  header: {
    gap: 6,
  },
  greeting: {
    fontSize: 22,
    lineHeight: 30,
    color: "#ffffff",
  },
  form: {
    gap: 20,
  },
  errorText: {
    color: "#FF2D78",
  },
  forgotButton: {
    alignSelf: "flex-end",
  },
  forgotText: {
    color: "#6A6A80",
  },
  actions: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "#C8FF00",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#080810",
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#212225",
  },
  dividerText: {
    fontSize: 13,
  },
  secondaryButton: {
    backgroundColor: "#212225",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
  },
});
