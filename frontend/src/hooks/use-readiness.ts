import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";

export function useReadiness(smeId?: string, scheme: string = "revenue_sharing") {
  const queryClient = useQueryClient();

  const preview = useQuery({
    queryKey: smeId ? queryKeys.sme.readiness(smeId, scheme) : ["readiness", scheme],
    queryFn: async () => {
      if (!smeId) return null;
      const { data, error } = await api.GET("/api/v1/smes/{sme_id}/readiness", {
        params: { path: { sme_id: smeId }, query: { scheme } },
      });
      if (error) throw error;
      return data ?? null;
    },
    staleTime: 60_000,
    enabled: !!smeId,
  });

  const latest = useQuery({
    queryKey: smeId ? ["sme", smeId, "readiness-latest"] : ["readiness-latest"],
    queryFn: async () => {
      if (!smeId) return null;
      const { data, error } = await api.GET("/api/v1/smes/{sme_id}/readiness/submissions/latest", {
        params: { path: { sme_id: smeId } },
      });
      if (error) return null;
      return data ?? null;
    },
    staleTime: 60_000,
    enabled: !!smeId,
  });

  const submit = useMutation({
    mutationFn: async (targetScheme: string) => {
      if (!smeId) throw new Error("smeId required");
      const { data, error } = await api.POST("/api/v1/smes/{sme_id}/readiness/submissions", {
        params: { path: { sme_id: smeId } },
        body: { scheme: targetScheme },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (!smeId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.sme.readiness(smeId) });
      queryClient.invalidateQueries({ queryKey: ["sme", smeId, "readiness-latest"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.sme.detail(smeId) });
    },
  });

  return {
    score: preview.data,
    latestSubmitted: latest.data,
    isLoading: preview.isLoading,
    submitScore: submit,
    refetch: preview.refetch,
  };
}
