import { validateAll, validators } from "../validators";

const values = (overrides: Partial<Parameters<typeof validateAll>[0]> = {}) => ({
  email: "ana@correo.com",
  password: "supersecret",
  confirmPassword: "supersecret",
  ...overrides,
});

describe("validators.email", () => {
  it("accepts an address with an @ and a dot", () => {
    expect(validators.email(values())).toBeUndefined();
  });

  it("ignores spaces around the address", () => {
    expect(validators.email(values({ email: "  ana@correo.com " }))).toBeUndefined();
  });

  it.each(["", "ana", "ana@correo", "ana.correo.com"])(
    "rejects %p",
    (email) => {
      expect(validators.email(values({ email }))).toBe(
        "auth.register.errors.invalidEmail"
      );
    }
  );
});

describe("validators.password", () => {
  it("accepts 8 characters", () => {
    expect(validators.password(values({ password: "12345678" }))).toBeUndefined();
  });

  it("rejects 7 characters", () => {
    expect(validators.password(values({ password: "1234567" }))).toBe(
      "auth.register.errors.passwordTooShort"
    );
  });
});

describe("validators.confirmPassword", () => {
  it("accepts a matching password", () => {
    expect(validators.confirmPassword(values())).toBeUndefined();
  });

  it("rejects a different password", () => {
    expect(
      validators.confirmPassword(values({ confirmPassword: "supersecreT" }))
    ).toBe("auth.register.errors.passwordMismatch");
  });
});

describe("validateAll", () => {
  it("returns no errors when every field is valid", () => {
    expect(validateAll(values())).toEqual({});
  });

  it("returns only the fields that are wrong", () => {
    expect(
      validateAll(values({ email: "ana", confirmPassword: "other" }))
    ).toEqual({
      email: "auth.register.errors.invalidEmail",
      confirmPassword: "auth.register.errors.passwordMismatch",
    });
  });
});
