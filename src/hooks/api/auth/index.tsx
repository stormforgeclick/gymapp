import { useAuth } from "@/providers/AuthProvider";
import { useMutation } from "@tanstack/react-query";

import { login, logout, register } from "./queries";
import type { LoginCredentials, RegisterCredentials } from "./queries";

export { useAuth as useSession };

export function useLogin() {
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => register(credentials),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: logout,
  });
}
