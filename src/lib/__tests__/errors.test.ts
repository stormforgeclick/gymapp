import { errorKind } from "../errors";

describe("errorKind", () => {
  it("recognizes a routine without exercises", () => {
    expect(errorKind({ message: "routine 123 has no exercises" })).toBe(
      "routineEmpty"
    );
  });

  it("recognizes a name that is already taken", () => {
    expect(
      errorKind({ message: 'split "Push" already exists for this user' })
    ).toBe("nameTaken");
  });

  it("recognizes a person who is unavailable", () => {
    expect(errorKind({ message: "user unavailable" })).toBe("unavailable");
  });

  it("reads the message of a real Error", () => {
    expect(errorKind(new Error("routine has no exercises"))).toBe("routineEmpty");
  });

  it("returns unknown for any other message", () => {
    expect(errorKind({ message: "permission denied" })).toBe("unknown");
  });

  it.each([null, undefined, "unavailable", 42, {}, { message: 7 }])(
    "returns unknown for %p, which has no text message",
    (error) => {
      expect(errorKind(error)).toBe("unknown");
    }
  );
});
