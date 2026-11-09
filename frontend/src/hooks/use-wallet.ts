"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

const DEFAULT_SIM_BALANCE = 50_000_000;

export function useWallet() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["wallet", "balance"],
    queryFn: async () => {
      try {
        const { data, error } = await api.GET("/api/v1/wallet" as never);
        if (error || !data) {
          const cached = typeof window !== "undefined" ? localStorage.getItem("uhui_wallet_balance") : null;
          return { balance_idr: cached ? parseInt(cached, 10) : DEFAULT_SIM_BALANCE, currency: "IDR" };
        }
        const bal = (data as { balance_idr?: number }).balance_idr ?? DEFAULT_SIM_BALANCE;
        if (typeof window !== "undefined") {
          localStorage.setItem("uhui_wallet_balance", bal.toString());
        }
        return { balance_idr: bal, currency: "IDR" };
      } catch {
        const cached = typeof window !== "undefined" ? localStorage.getItem("uhui_wallet_balance") : null;
        return { balance_idr: cached ? parseInt(cached, 10) : DEFAULT_SIM_BALANCE, currency: "IDR" };
      }
    },
    staleTime: 15_000,
  });

  const topUpMutation = useMutation({
    mutationFn: async (amountIdr: number) => {
      const { data, error } = await api.POST("/api/v1/wallet/topup" as never, {
        body: { amount_idr: amountIdr },
      } as never);
      if (error) throw error;
      return data as { balance_idr: number };
    },
    onSuccess: (res) => {
      if (res?.balance_idr && typeof window !== "undefined") {
        localStorage.setItem("uhui_wallet_balance", res.balance_idr.toString());
      }
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });

  const balance = query.data?.balance_idr ?? DEFAULT_SIM_BALANCE;

  return {
    balance,
    isLoading: query.isLoading,
    topUp: topUpMutation.mutateAsync,
    isTopUpPending: topUpMutation.isPending,
    refetch: query.refetch,
  };
}

