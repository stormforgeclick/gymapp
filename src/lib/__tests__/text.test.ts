import { capitalize, getInitials } from "../text";

describe("capitalize", () => {
  it("uppercases the first letter", () => {
    expect(capitalize("press de banca")).toBe("Press de banca");
  });

  it("leaves the rest of the text as it is", () => {
    expect(capitalize("hOLA Mundo")).toBe("HOLA Mundo");
  });

  it("handles accented letters", () => {
    expect(capitalize("ñandú")).toBe("Ñandú");
  });

  it("returns an empty string as it is", () => {
    expect(capitalize("")).toBe("");
  });
});

describe("getInitials", () => {
  it("takes the first letter of up to two words", () => {
    expect(getInitials("ana lopez")).toBe("AL");
  });

  it("stops at two letters however many words there are", () => {
    expect(getInitials("ana maria lopez")).toBe("AM");
  });

  it("drops the @ of a user name", () => {
    expect(getInitials("@ana")).toBe("A");
  });

  it("ignores extra whitespace", () => {
    expect(getInitials("  ana    lopez  ")).toBe("AL");
  });

  it("returns an empty string for an empty name", () => {
    expect(getInitials("")).toBe("");
    expect(getInitials("   ")).toBe("");
  });
});
