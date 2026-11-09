import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import type { components } from "@/types/api";

export type SnapshotDTO = components["schemas"]["SnapshotDTO"];
export type VerificationDTO = components["schemas"]["VerificationDTO"];

export function useReportSnapshot(smeId?: string, docType?: string, period?: string) {
  return useQuery({
    queryKey: smeId && docType ? queryKeys.sme.reports(smeId, docType, period) : ["reports"],
    queryFn: async () => {
      if (!smeId || !docType) return null;
      const { data, error } = await api.GET("/api/v1/smes/{sme_id}/reports/{doc_type}", {
        params: {
          path: { sme_id: smeId, doc_type: docType },
          query: { period: period || "" },
        },
      });
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!smeId && !!docType,
  });
}

export function useUpdateVerifyShowFigures(smeId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (showFigures: boolean) => {
      if (!smeId) throw new Error("smeId required");
      const { data, error } = await api.PATCH("/api/v1/smes/{sme_id}/reports/settings", {
        params: { path: { sme_id: smeId } },
        body: { verify_show_figures: showFigures },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (smeId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sme.detail(smeId) });
      }
    },
  });
}

export function usePublicVerification(hash?: string) {
  return useQuery({
    queryKey: hash ? queryKeys.verify(hash) : ["verify"],
    queryFn: async () => {
      if (!hash) return null;
      const { data, error } = await api.GET("/api/v1/verify/{sha256}", {
        params: { path: { sha256: hash } },
      });
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!hash && hash.length === 64,
  });
}
