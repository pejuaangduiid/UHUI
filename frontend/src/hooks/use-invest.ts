import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import { createIdempotencyKey } from "@/lib/idempotency";

export function usePortfolio() {
  return useQuery({
    queryKey: queryKeys.portfolio.me(),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/me/portfolio", {});
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useInvest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      campaignId,
      amountIdr,
      idempotencyKey = createIdempotencyKey(),
    }: {
      campaignId: string;
      amountIdr: number;
      idempotencyKey?: string;
    }) => {
      const { data, error } = await api.POST("/api/v1/campaigns/{id}/invest", {
        params: {
          path: { id: campaignId },
          header: { "Idempotency-Key": idempotencyKey },
        },
        body: { amount_idr: amountIdr },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.me() });
      queryClient.invalidateQueries({ queryKey: ["bursa"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useCampaignDistributions(campaignId?: string) {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: campaignId
      ? queryKeys.campaigns.distributions(campaignId)
      : ["distributions"],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await api.GET(
        "/api/v1/campaigns/{id}/distributions",
        {
          params: { path: { id: campaignId } },
        }
      );
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!campaignId,
  });

  const distribute = useMutation({
    mutationFn: async (payload: {
      pool_idr: number;
      period_start: string;
      period_end: string;
      report_snapshot_id?: string;
    }) => {
      if (!campaignId) throw new Error("campaignId required");
      const { data, error } = await api.POST(
        "/api/v1/campaigns/{id}/distributions",
        {
          params: { path: { id: campaignId } },
          body: payload,
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (!campaignId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.campaigns.distributions(campaignId),
      });
    },
  });

  return { list, distribute };
}

