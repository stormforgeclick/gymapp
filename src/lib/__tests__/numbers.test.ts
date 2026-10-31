import { parseNumber } from "../numbers";

describe("parseNumber", () => {
  it.each(["", "   "])("returns null for the empty field %p", (text) => {
    expect(parseNumber(text)).toBeNull();
  });

  it.each([
    ["0", 0],
    ["12", 12],
    ["12.5", 12.5],
    [" 7 ", 7],
    [".5", 0.5],
    ["5.", 5],
  ])("reads %p as %p", (text, expected) => {
    expect(parseNumber(text)).toBe(expected);
  });

  it("accepts a decimal comma", () => {
    expect(parseNumber("12,5")).toBe(12.5);
  });

  it.each(["-1", "-0", "abc", "12kg", "1.2.3", "1,2,3", "1e3", "0x10", "Infinity", "NaN"])(
    "returns undefined for %p, which is not a number",
    (text) => {
      expect(parseNumber(text)).toBeUndefined();
    }
  );

  describe("with integer: true", () => {
    it("reads whole numbers", () => {
      expect(parseNumber("12", { integer: true })).toBe(12);
      expect(parseNumber("", { integer: true })).toBeNull();
    });

    it.each(["12.5", "12,5", "0.5"])("returns undefined for %p", (text) => {
      expect(parseNumber(text, { integer: true })).toBeUndefined();
    });

    it("accepts a trailing dot, which is still a whole number", () => {
      expect(parseNumber("5.", { integer: true })).toBe(5);
    });
  });
});
