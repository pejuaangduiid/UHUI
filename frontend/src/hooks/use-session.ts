import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import { useUiStore } from "@/stores/ui-store";

export function useSession() {
  const queryClient = useQueryClient();
  const selectedSmeId = useUiStore((s) => s.selectedSmeId);
  const setSelectedSmeId = useUiStore((s) => s.setSelectedSmeId);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("uhui_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        queryClient.setQueryData(queryKeys.auth.me(), (old: unknown) => old ?? parsed);
      }
    } catch {
      
    }
  }, [queryClient]);

  const query = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      try {
          const { data, error, response } = await api.GET("/api/v1/auth/me", {
            signal: AbortSignal.timeout(10000),
          });
            if (response?.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("uhui_session");
          }
          return null;
        }
        if (error || !data) {
          const saved = typeof window !== "undefined" ? localStorage.getItem("uhui_session") : null;
          return saved ? JSON.parse(saved) : null;
        }
        if (typeof window !== "undefined") {
          localStorage.setItem("uhui_session", JSON.stringify(data));
        }
        return data;
      } catch {
        const saved = typeof window !== "undefined" ? localStorage.getItem("uhui_session") : null;
        return saved ? JSON.parse(saved) : null;
      }
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const logout = async () => {
    try {
      await api.POST("/api/v1/auth/logout");
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("uhui_session");
      }
      queryClient.clear();
      useUiStore.getState().resetUi();
      window.location.href = "/login";
    }
  };

  const effectiveSmeId = selectedSmeId || query.data?.sme_id || "";

  return {
    user: query.data?.user,
    smeId: effectiveSmeId,
    defaultSmeId: query.data?.sme_id,
    setSelectedSmeId,
    role: query.data?.user?.role,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data?.user,
    logout,
    refetch: query.refetch,
  };
}
