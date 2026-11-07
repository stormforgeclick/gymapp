import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AccessibilityInfo, Pressable } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { IconSize, Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

const TOAST_DURATION_MS = 3000;
// Reading the message and reaching for its button takes longer than reading a notice.
const ACTION_TOAST_DURATION_MS = 5000;
// Clears the tab bar on the tab screens; elsewhere it just floats above the content.
const BOTTOM_OFFSET = Spacing.six + Spacing.four;
const MIN_TOUCH_TARGET = 44;

type ToastTone = "success" | "error";

/** A button on the toast, e.g. "Undo". Pressing it also closes the toast. */
type ToastAction = { label: string; onPress: () => void };

type ToastContextValue = {
  /** Only one toast is shown at a time: a new one replaces the previous one, and its action. */
  show: (
    message: string,
    options?: { tone?: ToastTone; action?: ToastAction }
  ) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const makeStyles = (c: ThemeColors) => ({
  host: {
    position: "absolute" as const,
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.tight,
    paddingVertical: Spacing.tight,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceElevated,
  },
  message: {
    flex: 1,
  },
  action: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: "center" as const,
    paddingHorizontal: Spacing.two,
  },
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { bottom } = useSafeAreaInsets();

  const [toast, setToast] = useState<{
    id: number;
    text: string;
    tone: ToastTone;
    action?: ToastAction;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  const show = useCallback<ToastContextValue["show"]>((text, options) => {
    clearTimer();
    setToast({
      id: Date.now(),
      text,
      tone: options?.tone ?? "success",
      action: options?.action,
    });
    // iOS ignores live regions; announce so screen readers hear it without moving focus.
    AccessibilityInfo.announceForAccessibility(text);
    timer.current = setTimeout(
      () => setToast(null),
      options?.action ? ACTION_TOAST_DURATION_MS : TOAST_DURATION_MS
    );
  }, []);

  const runAction = (action: ToastAction) => {
    // Close first: the action may show a toast of its own, which must not be closed with this one.
    clearTimer();
    setToast(null);
    action.onPress();
  };

  useEffect(() => clearTimer, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {toast && (
        <Animated.View
          key={toast.id}
          entering={FadeInDown.duration(200)}
          exiting={FadeOutDown.duration(150)}
          // With a button only the button takes touches; the rest lets them through to the screen.
          pointerEvents={toast.action ? "box-none" : "none"}
          accessibilityLiveRegion="polite"
          style={[styles.host, { bottom: bottom + BOTTOM_OFFSET }]}
        >
          <MaterialCommunityIcons
            name={toast.tone === "error" ? "alert-circle" : "check-circle"}
            size={IconSize.lg}
            color={toast.tone === "error" ? theme.danger : theme.accentText}
            importantForAccessibility="no"
          />
          <ThemedText type="label" style={styles.message}>
            {toast.text}
          </ThemedText>
          {toast.action && (
            <Pressable
              onPress={() => runAction(toast.action!)}
              accessibilityRole="button"
              accessibilityLabel={toast.action.label}
              style={styles.action}
            >
              <ThemedText type="label" tone="accent">
                {toast.action.label}
              </ThemedText>
            </Pressable>
          )}
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
