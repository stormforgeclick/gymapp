import { render, screen, userEvent } from "@testing-library/react-native";

import { reportError } from "@/lib/report";
import ErrorFallback from "../ErrorFallback";

jest.mock("@/lib/report", () => ({ reportError: jest.fn() }));
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

const reportErrorMock = reportError as jest.Mock;

// The root error boundary can be shown outside every provider of the app, so
// nothing here is wrapped in one: the screen has to work with the defaults.
describe("ErrorFallback", () => {
  beforeEach(() => reportErrorMock.mockClear());

  it("tells the person something went wrong and offers to try again", async () => {
    await render(<ErrorFallback error={new Error("boom")} retry={jest.fn()} />);

    expect(screen.getByText("Algo salió mal")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeTruthy();
  });

  it("does not show the technical error to the person", async () => {
    await render(<ErrorFallback error={new Error("secret internal detail")} retry={jest.fn()} />);

    expect(screen.queryByText(/secret internal detail/)).toBeNull();
  });

  it("tries again when the button is pressed", async () => {
    const retry = jest.fn().mockResolvedValue(undefined);
    await render(<ErrorFallback error={new Error("boom")} retry={retry} />);

    await userEvent.setup().press(screen.getByRole("button", { name: "Reintentar" }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("reports the error once, as coming from the boundary", async () => {
    const error = new Error("boom");
    await render(<ErrorFallback error={error} retry={jest.fn()} />);

    expect(reportErrorMock).toHaveBeenCalledTimes(1);
    expect(reportErrorMock).toHaveBeenCalledWith(error, { source: "boundary" });
  });

  it("can be found by tests of the whole app", async () => {
    await render(<ErrorFallback error={new Error("boom")} retry={jest.fn()} />);

    expect(screen.getByTestId("screen-error")).toBeTruthy();
  });
});
