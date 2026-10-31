/// <reference types="node" />
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * The account the end-to-end flows sign in with. It lives in the real project
 * (there is only one), isolated from real users by RLS; the flows clean up the
 * routines they create. The credentials stay in an ignored file on this machine.
 */
export const E2E_EMAIL = "e2e@gymbro.test";
export const E2E_ENV_FILE = ".maestro/.env.e2e";

export type E2eCredentials = { email: string; password: string };

const readCredentials = (): E2eCredentials | null => {
  if (!existsSync(E2E_ENV_FILE)) return null;

  const values = Object.fromEntries(
    readFileSync(E2E_ENV_FILE, "utf8")
      .split(/\r?\n/)
      .map((line) => line.split("="))
      .filter(([key, ...rest]) => key && rest.length > 0)
      .map(([key, ...rest]) => [key.trim(), rest.join("=").trim()])
  );

  return values.E2E_EMAIL && values.E2E_PASSWORD
    ? { email: values.E2E_EMAIL, password: values.E2E_PASSWORD }
    : null;
};

const writeCredentials = ({ email, password }: E2eCredentials) => {
  mkdirSync(dirname(E2E_ENV_FILE), { recursive: true });
  writeFileSync(E2E_ENV_FILE, `E2E_EMAIL=${email}\nE2E_PASSWORD=${password}\n`);
};

/** Makes sure the test account exists and its credentials are saved; returns them. */
export async function ensureE2eUser(): Promise<E2eCredentials> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in .env"
    );
  }

  const saved = readCredentials();
  if (saved) {
    // The same sign-in the app does, to know the saved credentials still work.
    const anon = createClient(url, anonKey, { auth: { persistSession: false } });
    const { error } = await anon.auth.signInWithPassword(saved);
    if (!error) return saved;
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const credentials = {
    email: E2E_EMAIL,
    password: randomBytes(18).toString("base64url"),
  };

  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    perPage: 200,
  });
  if (listError) throw listError;

  const existing = list.users.find((user) => user.email === E2E_EMAIL);
  const { error } = existing
    ? await admin.auth.admin.updateUserById(existing.id, {
        password: credentials.password,
        email_confirm: true,
      })
    : await admin.auth.admin.createUser({
        email: credentials.email,
        password: credentials.password,
        email_confirm: true,
      });
  if (error) throw error;

  writeCredentials(credentials);
  return credentials;
}

if (require.main === module) {
  ensureE2eUser()
    .then(({ email }) => console.log(`E2E account ready: ${email} (${E2E_ENV_FILE})`))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
