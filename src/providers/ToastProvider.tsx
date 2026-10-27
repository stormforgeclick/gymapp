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
import { AccessibilityInfo } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { IconSize, Radius, Spacing, type ThemeColors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";

const TOAST_DURATION_MS = 3000;
// Clears the tab bar on the tab screens; elsewhere it just floats above the content.
const BOTTOM_OFFSET = Spacing.six + Spacing.four;

type ToastTone = "success" | "error";

type ToastContextValue = {
  show: (message: string, options?: { tone?: ToastTone }) => void;
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
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { bottom } = useSafeAreaInsets();

  const [toast, setToast] = useState<{
    id: number;
    text: string;
    tone: ToastTone;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  const show = useCallback((text: string, options?: { tone?: ToastTone }) => {
    clearTimer();
    setToast({ id: Date.now(), text, tone: options?.tone ?? "success" });
    // iOS ignores live regions; announce so screen readers hear it without moving focus.
    AccessibilityInfo.announceForAccessibility(text);
    timer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

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
          pointerEvents="none"
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
