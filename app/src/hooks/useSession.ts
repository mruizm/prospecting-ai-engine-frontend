import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchSession, login, logout } from "../lib/api";

const SESSION_KEY = ["session"] as const;

export function useSession() {
  return useQuery({
    queryKey: SESSION_KEY,
    queryFn: fetchSession,
    staleTime: Infinity,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: () => {
      queryClient.setQueryData(SESSION_KEY, { authenticated: true });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(SESSION_KEY, { authenticated: false });
    },
  });
}
