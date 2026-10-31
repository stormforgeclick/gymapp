import type { TranslationKey } from "@/i18n";

export type FieldName = "email" | "password" | "confirmPassword";

export type RegisterValues = Record<FieldName, string>;

// Validators return translation keys so the message follows the device language.
export type FieldErrors = Partial<Record<FieldName, TranslationKey>>;

export const validators: Record<
  FieldName,
  (values: RegisterValues) => TranslationKey | undefined
> = {
  email: ({ email }) =>
    !email.trim().includes("@") || !email.trim().includes(".")
      ? "auth.register.errors.invalidEmail"
      : undefined,
  password: ({ password }) =>
    password.length < 8 ? "auth.register.errors.passwordTooShort" : undefined,
  confirmPassword: ({ password, confirmPassword }) =>
    password !== confirmPassword
      ? "auth.register.errors.passwordMismatch"
      : undefined,
};

/** Every field's error at once; fields that are fine are left out. */
export function validateAll(values: RegisterValues): FieldErrors {
  const errors: FieldErrors = {};
  (Object.keys(validators) as FieldName[]).forEach((field) => {
    const message = validators[field](values);
    if (message) errors[field] = message;
  });
  return errors;
}
