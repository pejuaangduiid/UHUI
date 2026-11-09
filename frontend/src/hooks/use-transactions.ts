import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";

export interface CreateTxPayload {
  tx_type: "sale" | "expense" | "restock";
  total_amount_idr: number;
  description: string;
  tx_date?: string;
  items?: { inventory_item_id: string; qty: number; unit_price_idr: number }[];
}

export function useTransactions(smeId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: smeId ? queryKeys.sme.transactions(smeId) : ["transactions"],
    queryFn: async () => {
      if (!smeId) return [];
      const { data, error } = await api.GET("/api/v1/smes/{sme_id}/transactions", {
        params: { path: { sme_id: smeId } },
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
    enabled: !!smeId,
  });

  const aggregates = useQuery({
    queryKey: smeId ? ["sme", smeId, "aggregates"] : ["aggregates"],
    queryFn: async () => {
      if (!smeId) return null;
      const { data, error } = await api.GET("/api/v1/smes/{sme_id}/aggregates", {
        params: { path: { sme_id: smeId } },
      });
      if (error) throw error;
      return data ?? null;
    },
    staleTime: 30_000,
    enabled: !!smeId,
  });

  const createTx = useMutation({
    mutationFn: async (payload: CreateTxPayload) => {
      if (!smeId) throw new Error("smeId required");
      const { data, error } = await api.POST("/api/v1/smes/{sme_id}/transactions", {
        params: { path: { sme_id: smeId } },
        body: payload,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (!smeId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.sme.transactions(smeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sme.inventory(smeId) });
      queryClient.invalidateQueries({ queryKey: ["sme", smeId, "aggregates"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.sme.readiness(smeId) });
    },
  });

  const reverseTx = useMutation({
    mutationFn: async ({ txId, reason }: { txId: string; reason: string }) => {
      if (!smeId) throw new Error("smeId required");
      const { data, error } = await api.POST("/api/v1/smes/{sme_id}/transactions/{id}/reverse", {
        params: { path: { sme_id: smeId, id: txId } },
        body: { reason },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (!smeId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.sme.transactions(smeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sme.inventory(smeId) });
      queryClient.invalidateQueries({ queryKey: ["sme", smeId, "aggregates"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.sme.readiness(smeId) });
    },
  });

  return {
    transactions: query.data ?? [],
    aggregates: aggregates.data,
    isLoading: query.isLoading,
    createTx,
    reverseTx,
    refetch: query.refetch,
  };
}
