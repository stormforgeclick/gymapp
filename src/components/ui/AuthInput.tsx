import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

type AuthInputProps = TextInputProps & {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  secureEntry?: boolean;
};

export function AuthInput({ label, icon, secureEntry = false, ...props }: AuthInputProps) {
  const [visible, setVisible] = useState(!secureEntry);

  return (
    <View style={styles.wrapper}>
      <ThemedText type="bold" style={styles.label}>
        {label.toUpperCase()}
      </ThemedText>
      <View style={styles.container}>
        <Ionicons name={icon} size={18} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholderTextColor="#6A6A80"
          secureTextEntry={!visible}
          autoCapitalize="none"
          {...props}
        />
        {secureEntry && (
          <TouchableOpacity onPress={() => setVisible((v) => !v)} hitSlop={8}>
            <Ionicons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={18}
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    color: "#6A6A80",
    letterSpacing: 1,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#15151C",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  icon: {
    color: "#6A6A80",
  },
  input: {
    flex: 1,
    color: "#ffffff",
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  eyeIcon: {
    color: "#6A6A80",
  },
});
