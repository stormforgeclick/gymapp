import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ComponentProps, ComponentType, useState } from "react";
import { Pressable, TextInput, TextInputProps, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  IconSize,
  Radius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useT } from "@/i18n";

type TextFieldProps = TextInputProps & {
  label?: string;
  icon?: ComponentProps<typeof MaterialCommunityIcons>["name"];
  error?: string | null;
  /** Password field with a show/hide toggle. */
  secureEntry?: boolean;
  /** Swap the underlying input, e.g. `BottomSheetTextInput` inside a sheet. */
  TextInputComponent?: ComponentType<TextInputProps>;
};

const makeStyles = (c: ThemeColors) => ({
  wrapper: {
    gap: Spacing.two,
  },
  container: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    minHeight: 48,
    backgroundColor: c.surfaceInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: Spacing.three,
    gap: Spacing.tight,
  },
  containerFocused: {
    borderColor: c.accentText,
  },
  containerError: {
    borderColor: c.danger,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.tight,
    color: c.text,
    fontFamily: Typography.body.fontFamily,
    fontSize: Typography.body.fontSize,
  },
  toggle: {
    width: 44,
    height: 44,
    marginRight: -Spacing.tight,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
});

const TextField = ({
  label,
  icon,
  error,
  secureEntry = false,
  TextInputComponent = TextInput,
  onFocus,
  onBlur,
  accessibilityLabel,
  ...props
}: TextFieldProps) => {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useT();
  const [visible, setVisible] = useState(!secureEntry);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && (
        <ThemedText type="overline" tone="secondary" accessibilityElementsHidden>
          {label}
        </ThemedText>
      )}

      <View
        style={[
          styles.container,
          focused && styles.containerFocused,
          !!error && styles.containerError,
        ]}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={IconSize.lg}
            color={theme.textSecondary}
            importantForAccessibility="no"
            accessibilityElementsHidden
          />
        )}

        <TextInputComponent
          style={styles.input}
          placeholderTextColor={theme.textTertiary}
          secureTextEntry={secureEntry && !visible}
          autoCapitalize="none"
          accessibilityLabel={accessibilityLabel ?? label}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />

        {secureEntry && (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            style={styles.toggle}
            accessibilityRole="button"
            accessibilityLabel={
              visible ? t("auth.hidePassword") : t("auth.showPassword")
            }
          >
            <MaterialCommunityIcons
              name={visible ? "eye-off-outline" : "eye-outline"}
              size={IconSize.lg}
              color={theme.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {!!error && (
        <ThemedText
          type="caption"
          tone="danger"
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {error}
        </ThemedText>
      )}
    </View>
  );
};

export default TextField;
