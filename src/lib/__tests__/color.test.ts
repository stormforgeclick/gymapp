import {
  Colors,
  RoutineColors,
  RoutineColorsLight,
} from "@/constants/theme";
import { contrastRatio, readableAccent, routineTone } from "../color";

describe("contrastRatio", () => {
  it("is 21 between black and white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("is 1 between a color and itself", () => {
    expect(contrastRatio("#6b8b00", "#6b8b00")).toBeCloseTo(1, 5);
  });

  it("does not depend on the order of the colors", () => {
    expect(contrastRatio("#123456", "#fedcba")).toBeCloseTo(
      contrastRatio("#fedcba", "#123456")!,
      10
    );
  });

  it("accepts upper and lower case hex", () => {
    expect(contrastRatio("#C8FF00", "#080810")).toBeCloseTo(
      contrastRatio("#c8ff00", "#080810")!,
      10
    );
  });

  it.each(["", "red", "#fff", "#12345", "#12345g", "123456"])(
    "returns null for %p, which is not #rrggbb",
    (invalid) => {
      expect(contrastRatio(invalid, "#ffffff")).toBeNull();
      expect(contrastRatio("#ffffff", invalid)).toBeNull();
    }
  );
});

describe("routineTone", () => {
  it("keeps the stored color on the dark theme", () => {
    expect(routineTone(RoutineColors.routineOne, "dark")).toBe(RoutineColors.routineOne);
  });

  it("maps every stored routine color to its darker tone on the light theme", () => {
    for (const name of Object.keys(RoutineColors) as (keyof typeof RoutineColors)[]) {
      expect(routineTone(RoutineColors[name], "light")).toBe(RoutineColorsLight[name]);
    }
  });

  it("matches the stored color regardless of case", () => {
    expect(routineTone("#c8ff00", "light")).toBe(RoutineColorsLight.routineOne);
  });

  it("returns colors that are not routine colors as they are", () => {
    expect(routineTone("#123456", "light")).toBe("#123456");
  });
});

describe("readableAccent", () => {
  const MIN_TEXT_CONTRAST = 4.5;

  it("keeps the color as it is on the dark theme", () => {
    expect(readableAccent("#C8FF00", "dark")).toBe("#C8FF00");
  });

  it("returns a value that is not #rrggbb as it is", () => {
    expect(readableAccent("not-a-color", "light")).toBe("not-a-color");
  });

  it("keeps a color that is already readable on the light theme", () => {
    expect(readableAccent("#000000", "light")).toBe("#000000");
  });

  it("darkens a bright color until it can be read on the light background", () => {
    const result = readableAccent("#C8FF00", "light");

    expect(result).not.toBe("#C8FF00");
    expect(contrastRatio(result, Colors.light.background)).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST
    );
  });

  it("makes every stored routine color readable on the light theme", () => {
    for (const hex of Object.values(RoutineColors)) {
      const result = readableAccent(routineTone(hex, "light"), "light");

      expect(contrastRatio(result, Colors.light.background)).toBeGreaterThanOrEqual(
        MIN_TEXT_CONTRAST
      );
    }
  });

  it("only darkens: no channel of the result is brighter than the input", () => {
    const [r, g, b] = [0xc8, 0xff, 0x00];
    const result = readableAccent("#C8FF00", "light");
    const channels = [1, 3, 5].map((i) => parseInt(result.slice(i, i + 2), 16));

    expect(channels[0]).toBeLessThanOrEqual(r);
    expect(channels[1]).toBeLessThanOrEqual(g);
    expect(channels[2]).toBeLessThanOrEqual(b);
  });
});
