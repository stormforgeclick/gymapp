import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ToastProvider, useToast } from "../ToastProvider";

// The toast animates in and out with Reanimated, whose native side (and the one of
// its worklets package) does not exist under Jest. Both ship a mock for it.
jest.mock("react-native-worklets", () => jest.requireActual("react-native-worklets/src/mock"));
jest.mock("react-native-reanimated", () => jest.requireActual("react-native-reanimated/mock"));
// The theme hook reaches the data layer, which builds the Supabase client on import.
jest.mock("@/lib/supabase", () => ({ supabase: {} }));
// The device language decides the texts; fix it so the test does not depend on the machine.
jest.mock("expo-localization", () => ({
  useLocales: () => [{ languageCode: "es", languageTag: "es-ES" }],
}));
// The preferences provider reads the device storage, which does not exist under Jest.
jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const metrics = {
  frame: { x: 0, y: 0, width: 360, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

// The toast is shown from outside the tree, the way a screen does it after an action.
let toast: ReturnType<typeof useToast>;
const Capture = () => {
  const current = useToast();
  useEffect(() => {
    toast = current;
  }, [current]);
  return null;
};

const setup = () =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastProvider>
        <Capture />
      </ToastProvider>
    </SafeAreaProvider>
  );

const passTime = (ms: number) => act(() => void jest.advanceTimersByTime(ms));

describe("ToastProvider", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("shows the message it is given", async () => {
    await setup();

    await act(() => toast.show("Rutina guardada"));

    expect(screen.getByText("Rutina guardada")).toBeTruthy();
  });

  it("has no button when it has no action", async () => {
    await setup();

    await act(() => toast.show("Rutina guardada"));

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("goes away after three seconds when it has no action", async () => {
    await setup();
    await act(() => toast.show("Rutina guardada"));

    await passTime(2900);
    expect(screen.getByText("Rutina guardada")).toBeTruthy();

    await passTime(200);
    expect(screen.queryByText("Rutina guardada")).toBeNull();
  });

  it("is replaced by the next one", async () => {
    await setup();
    await act(() => toast.show("Primero"));

    await act(() => toast.show("Segundo"));

    expect(screen.queryByText("Primero")).toBeNull();
    expect(screen.getByText("Segundo")).toBeTruthy();
  });

  it("offers a button for its action", async () => {
    await setup();

    await act(() =>
      toast.show("Serie 3 eliminada", { action: { label: "Deshacer", onPress: jest.fn() } })
    );

    expect(screen.getByRole("button", { name: "Deshacer" })).toBeTruthy();
  });

  it("runs the action and goes away when its button is pressed", async () => {
    const onPress = jest.fn();
    await setup();
    await act(() => toast.show("Serie 3 eliminada", { action: { label: "Deshacer", onPress } }));

    await fireEvent.press(screen.getByRole("button", { name: "Deshacer" }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Serie 3 eliminada")).toBeNull();
  });

  // A failed undo reports itself with a toast of its own, which has to stay on screen.
  it("keeps a toast that its own action shows", async () => {
    await setup();
    const onPress = () => toast.show("No se pudo deshacer", { tone: "error" });
    await act(() => toast.show("Serie 3 eliminada", { action: { label: "Deshacer", onPress } }));

    await fireEvent.press(screen.getByRole("button", { name: "Deshacer" }));

    expect(screen.getByText("No se pudo deshacer")).toBeTruthy();
  });

  // Reading the message and reaching for the button takes longer than a plain notice.
  it("stays for five seconds when it has an action", async () => {
    await setup();
    await act(() =>
      toast.show("Serie 3 eliminada", { action: { label: "Deshacer", onPress: jest.fn() } })
    );

    await passTime(4900);
    expect(screen.getByText("Serie 3 eliminada")).toBeTruthy();

    await passTime(200);
    expect(screen.queryByText("Serie 3 eliminada")).toBeNull();
  });

  it("does not keep the action of the toast it replaced", async () => {
    await setup();
    await act(() =>
      toast.show("Serie 3 eliminada", { action: { label: "Deshacer", onPress: jest.fn() } })
    );

    await act(() => toast.show("Rutina guardada"));

    expect(screen.queryByRole("button", { name: "Deshacer" })).toBeNull();
  });
});
