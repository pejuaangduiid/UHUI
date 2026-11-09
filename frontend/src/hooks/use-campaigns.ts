import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import type { components } from "@/types/api";

export type CreateCampaignInput = components["schemas"]["CreateCampaignReq"];

export function usePublicCampaigns(filters?: {
  scheme?: string;
  sector?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.bursa.all(filters),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/bursa", {
        params: {
          query: {
            scheme: filters?.scheme ?? "",
            sector: filters?.sector ?? "",
            limit: filters?.limit ?? 50,
          },
        },
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePublicCampaign(slug: string) {
  return useQuery({
    queryKey: queryKeys.bursa.detail(slug),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/bursa/{slug}", {
        params: { path: { slug } },
      });
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!slug,
  });
}

export function useSmeCampaigns(smeId?: string) {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: smeId ? queryKeys.campaigns.bySme(smeId) : ["sme-campaigns"],
    queryFn: async () => {
      if (!smeId) return [];
      const { data, error } = await api.GET("/api/v1/smes/{sme_id}/campaigns", {
        params: { path: { sme_id: smeId } },
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!smeId,
  });

  const create = useMutation({
    mutationFn: async (body: CreateCampaignInput) => {
      if (!smeId) throw new Error("smeId required");
      const { data, error } = await api.POST("/api/v1/smes/{sme_id}/campaigns", {
        params: { path: { sme_id: smeId } },
        body,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (!smeId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.bySme(smeId) });
    },
  });

  const submit = useMutation({
    mutationFn: async (campaignId: string) => {
      if (!smeId) throw new Error("smeId required");
      const { data, error } = await api.POST(
        "/api/v1/smes/{sme_id}/campaigns/{id}/submit",
        {
          params: { path: { sme_id: smeId, id: campaignId } },
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (!smeId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.bySme(smeId) });
    },
  });

  const cancel = useMutation({
    mutationFn: async (campaignId: string) => {
      if (!smeId) throw new Error("smeId required");
      const { data, error } = await api.POST(
        "/api/v1/smes/{sme_id}/campaigns/{id}/cancel",
        {
          params: { path: { sme_id: smeId, id: campaignId } },
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (!smeId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.bySme(smeId) });
    },
  });

  return { list, create, submit, cancel };
}

