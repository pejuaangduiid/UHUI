import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { components } from "@/types/api";

export type CreateSMEInput = components["schemas"]["CreateSMEInput"];
export type SMEItem = components["schemas"]["SmeDTO"];

export function useMySMEs() {
  return useQuery({
    queryKey: ["my-smes"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/smes");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useCreateMySME() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateSMEInput) => {
      const { data, error } = await api.POST("/api/v1/smes", { body });
      if (error || !data) throw error ?? new Error("Gagal mendaftarkan bisnis");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-smes"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}
