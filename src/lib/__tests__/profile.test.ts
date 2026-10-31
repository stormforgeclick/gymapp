import { displayName } from "../profile";

const profile = (
  first_name: string | null,
  last_name: string | null,
  user_name: string | null
) => ({ first_name, last_name, user_name });

describe("displayName", () => {
  it("joins first and last name", () => {
    expect(displayName(profile("Ana", "Lopez", "ana"))).toBe("Ana Lopez");
  });

  it("uses only the first name when there is no last name", () => {
    expect(displayName(profile("Ana", null, "ana"))).toBe("Ana");
  });

  it("uses only the last name when there is no first name", () => {
    expect(displayName(profile(null, "Lopez", null))).toBe("Lopez");
  });

  it("falls back to @user when there is no name", () => {
    expect(displayName(profile(null, null, "ana"))).toBe("@ana");
  });

  it("falls back to @user when the names are empty or blank", () => {
    expect(displayName(profile("", " ", "ana"))).toBe("@ana");
  });

  it("returns null when the person has neither a name nor a user name", () => {
    expect(displayName(profile(null, null, null))).toBeNull();
    expect(displayName(profile("", "", ""))).toBeNull();
  });
});
