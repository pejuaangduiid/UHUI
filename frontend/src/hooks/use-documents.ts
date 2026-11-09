import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";

export interface UpdateProfilePayload {
  business_name: string;
  sector: string;
  description: string;
  is_incorporated_pt: boolean;
  verify_show_figures: boolean;
}

export function useDocuments(smeId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: smeId ? queryKeys.sme.documents(smeId) : ["documents"],
    queryFn: async () => {
      if (!smeId) return [];
      const { data, error } = await api.GET("/api/v1/smes/{sme_id}/documents", {
        params: { path: { sme_id: smeId } },
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!smeId,
  });

  const uploadDoc = useMutation({
    mutationFn: async ({ docType, fileBase64, filename }: { docType: string; fileBase64: string; filename?: string }) => {
      if (!smeId) throw new Error("smeId required");
      const { data, error } = await api.PUT("/api/v1/smes/{sme_id}/documents/{doc_type}", {
        params: { path: { sme_id: smeId, doc_type: docType } },
        body: { file_base64: fileBase64, filename },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (!smeId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.sme.documents(smeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sme.readiness(smeId) });
    },
  });

  return {
    documents: query.data ?? [],
    isLoading: query.isLoading,
    uploadDocument: uploadDoc,
    refetch: query.refetch,
  };
}

export function useSMEProfile(smeId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: smeId ? queryKeys.sme.detail(smeId) : ["sme-detail"],
    queryFn: async () => {
      if (!smeId) return null;
      const { data, error } = await api.GET("/api/v1/smes/{sme_id}", {
        params: { path: { sme_id: smeId } },
      });
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!smeId,
  });

  const updateProfile = useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      if (!smeId) throw new Error("smeId required");
      const { data, error } = await api.PATCH("/api/v1/smes/{sme_id}", {
        params: { path: { sme_id: smeId } },
        body: payload,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (!smeId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.sme.detail(smeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sme.readiness(smeId) });
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    updateProfile,
    refetch: query.refetch,
  };
}

