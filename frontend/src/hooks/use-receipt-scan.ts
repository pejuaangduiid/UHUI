import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";

export interface ConfirmReceiptPayload {
  scan_id: string;
  tx_type: "sale" | "expense" | "restock";
  total_amount_idr: number;
  description: string;
  items: {
    inventory_item_id: string;
    qty: number;
    unit_price_idr: number;
  }[];
}

export function useReceiptScan(smeId?: string) {
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: async ({ imageBase64, filename }: { imageBase64: string; filename?: string }) => {
      if (!smeId) throw new Error("smeId required");
      const { data, error } = await api.POST("/api/v1/smes/{sme_id}/receipts/scan", {
        params: { path: { sme_id: smeId } },
        body: { image_base64: imageBase64, filename },
      });
      if (error) throw error;
      return data;
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (payload: ConfirmReceiptPayload) => {
      if (!smeId) throw new Error("smeId required");
      const { data, error } = await api.POST("/api/v1/smes/{sme_id}/receipts/confirm", {
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

  return {
    scanReceipt: scanMutation,
    confirmReceipt: confirmMutation,
  };
}

