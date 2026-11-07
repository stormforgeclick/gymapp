import { render, screen, userEvent } from "@testing-library/react-native";

import ExerciseTabs from "../ExerciseTabs";

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

// Three of these used to read "Zancada…": the tab was too narrow for the whole name.
const lunges = [
  { name: "Zancada caminando", complete: false },
  { name: "Zancada con mancuerna", complete: false },
  { name: "Zancadas estáticas", complete: false },
];

const setup = (props: Partial<React.ComponentProps<typeof ExerciseTabs>> = {}) =>
  render(
    <ExerciseTabs
      exercises={lunges}
      selectedIndex={0}
      onSelect={jest.fn()}
      color="#00D4FF"
      {...props}
    />
  );

describe("ExerciseTabs", () => {
  it("numbers the exercises instead of cutting their names", async () => {
    await setup();

    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.queryByText(/Zancada/)).toBeNull();
  });

  it("tells a screen reader the name and place of each exercise", async () => {
    await setup();

    expect(screen.getByRole("button", { name: "Zancada caminando, ejercicio 1 de 3" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Zancada con mancuerna, ejercicio 2 de 3" })
    ).toBeTruthy();
  });

  it("shows a check instead of the number once an exercise is done", async () => {
    await setup({
      exercises: [{ ...lunges[0], complete: true }, lunges[1], lunges[2]],
    });

    expect(screen.queryByText("1")).toBeNull();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("tells a screen reader which exercises are done", async () => {
    await setup({
      exercises: [{ ...lunges[0], complete: true }, lunges[1], lunges[2]],
    });

    expect(
      screen.getByRole("button", { name: "Zancada caminando, ejercicio 1 de 3, completo" })
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Zancada con mancuerna.*completo/ })).toBeNull();
  });

  it("marks the selected exercise", async () => {
    await setup({ selectedIndex: 1 });

    expect(screen.getByRole("button", { name: /ejercicio 2 de 3/, selected: true })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /ejercicio 1 de 3/, selected: true })).toBeNull();
  });

  it("goes to the exercise that is pressed", async () => {
    const onSelect = jest.fn();
    await setup({ onSelect });

    await userEvent.setup().press(screen.getByRole("button", { name: /ejercicio 3 de 3/ }));

    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
