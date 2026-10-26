import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";

/**
 * Authentication state for WanderLust. The app uses tab-based navigation
 * (no react-router), so this hook exposes plain state + actions; views that
 * need a signed-in user render a sign-in prompt instead of redirecting.
 */
export function useAuth() {
  const utils = trpc.useUtils();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      // Without a route change, a failed post-logout refetch (401) keeps the
      // last successful user cached — reset drops it so the UI signs out.
      await utils.auth.me.reset();
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading: isLoading || logoutMutation.isPending,
      error,
      logout,
      refresh: refetch,
    }),
    [user, isLoading, logoutMutation.isPending, error, logout, refetch],
  );
}
