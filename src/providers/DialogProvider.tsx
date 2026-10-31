import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import Button from "@/components/ui/Button";
import { Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

export type DialogActionVariant =
  | "primary"
  | "destructive"
  | "secondary"
  | "cancel";

export type DialogAction = {
  label: string;
  onPress?: () => void;
  variant?: DialogActionVariant;
};

export type DialogOptions = {
  title: string;
  message?: string;
  actions: DialogAction[];
};

type DialogContextValue = {
  show: (options: DialogOptions) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

const SCRIM = "rgba(0,0,0,0.6)";

const BUTTON_VARIANT = {
  primary: "primary",
  destructive: "danger",
  secondary: "secondary",
  cancel: "ghost",
} as const;

const makeStyles = (c: ThemeColors) => ({
  root: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: Spacing.four,
  },
  card: {
    width: "100%" as const,
    maxWidth: 360,
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceElevated,
  },
  texts: {
    gap: Spacing.two,
  },
  actions: {
    gap: Spacing.two,
  },
});

/**
 * In-app replacement for `Alert.alert`, styled like the rest of the app. It is
 * a transparent `Modal`, so it also appears above bottom sheets.
 */
export function DialogProvider({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);

  // The options stay set while the dialog fades out so it doesn't go blank.
  const [dialog, setDialog] = useState<DialogOptions | null>(null);
  const [visible, setVisible] = useState(false);
  const activeId = useRef(0);

  const show = useCallback((options: DialogOptions) => {
    activeId.current += 1;
    setDialog(options);
    setVisible(true);
  }, []);

  const run = (action: DialogAction) => {
    const id = activeId.current;
    action.onPress?.();
    // If the action opened another dialog, keep the Modal up and let it swap
    // content; hiding and re-presenting a Modal back to back fails on iOS.
    if (activeId.current === id) setVisible(false);
  };

  const cancelAction = dialog?.actions.find((a) => a.variant === "cancel");
  const dismiss = () => {
    if (cancelAction) run(cancelAction);
  };

  const value = useMemo(() => ({ show }), [show]);

  // The cancel action always goes last, as on native alerts.
  const orderedActions = dialog
    ? [
        ...dialog.actions.filter((a) => a.variant !== "cancel"),
        ...dialog.actions.filter((a) => a.variant === "cancel"),
      ]
    : [];

  return (
    <DialogContext.Provider value={value}>
      {children}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={dismiss}
      >
        <View style={styles.root}>
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM }]}
            onPress={dismiss}
            accessible={false}
          />

          {dialog && (
            <View style={styles.card} accessibilityViewIsModal>
              <View style={styles.texts}>
                <ThemedText type="title" accessibilityRole="header">
                  {dialog.title}
                </ThemedText>
                {dialog.message && (
                  <ThemedText tone="secondary">{dialog.message}</ThemedText>
                )}
              </View>

              <View style={styles.actions}>
                {orderedActions.map((action, index) => (
                  <Button
                    key={index}
                    label={action.label}
                    testID={`dialog-action-${action.variant ?? "primary"}`}
                    variant={BUTTON_VARIANT[action.variant ?? "primary"]}
                    onPress={() => run(action)}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used inside <DialogProvider>");
  return context;
}
