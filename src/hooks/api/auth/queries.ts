import { supabase } from "@/lib/supabase";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = {
  name: string;
  email: string;
  password: string;
  language: "en" | "es";
};

export async function login({ email, password }: LoginCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function register({
  name,
  email,
  password,
  language,
}: RegisterCredentials) {
  // The profile trigger reads these keys: the first word is the first name
  // and the rest the last name.
  const [firstName, ...rest] = name.split(/\s+/).filter(Boolean);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName ?? "",
        last_name: rest.join(" "),
        language,
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
