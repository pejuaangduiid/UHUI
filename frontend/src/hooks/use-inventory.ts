import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";

export interface CreateItemPayload {
  sku: string;
  name: string;
  stock_qty: number;
  unit_cost_idr: number;
  selling_price_idr: number;
  low_stock_threshold?: number;
}

export function useInventory(smeId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: smeId ? queryKeys.sme.inventory(smeId) : ["inventory"],
    queryFn: async () => {
      if (!smeId) return [];
      const { data, error } = await api.GET("/api/v1/smes/{sme_id}/inventory", {
        params: { path: { sme_id: smeId } },
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!smeId,
  });

  const createItem = useMutation({
    mutationFn: async (payload: CreateItemPayload) => {
      if (!smeId) throw new Error("smeId required");
      const { data, error } = await api.POST("/api/v1/smes/{sme_id}/inventory", {
        params: { path: { sme_id: smeId } },
        body: {
          ...payload,
          low_stock_threshold: payload.low_stock_threshold ?? 5,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (smeId) queryClient.invalidateQueries({ queryKey: queryKeys.sme.inventory(smeId) });
    },
  });

  const adjustStock = useMutation({
    mutationFn: async ({ itemId, delta, reason }: { itemId: string; delta: number; reason: string }) => {
      if (!smeId) throw new Error("smeId required");
      const { data, error } = await api.POST("/api/v1/smes/{sme_id}/inventory/{id}/adjust", {
        params: { path: { sme_id: smeId, id: itemId } },
        body: { delta_qty: delta, reason },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (smeId) queryClient.invalidateQueries({ queryKey: queryKeys.sme.inventory(smeId) });
    },
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createItem,
    adjustStock,
  };
}

export function useStockMovements(smeId?: string, itemId?: string) {
  return useQuery({
    queryKey: smeId && itemId ? ["sme", smeId, "stock-movements", itemId] : ["stock-movements"],
    queryFn: async () => {
      if (!smeId || !itemId) return [];
      const { data, error } = await api.GET("/api/v1/smes/{sme_id}/inventory/{id}/movements", {
        params: { path: { sme_id: smeId, id: itemId } },
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!smeId && !!itemId,
  });
}
