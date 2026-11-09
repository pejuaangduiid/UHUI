import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useSession } from "@/hooks/use-session";
import { queryKeys } from "@/lib/query-keys";

export function useValuationHistory(slug: string) {
  return useQuery({
    queryKey: ["bursa", "valuation-history", slug],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/bursa/{slug}/valuation-history", {
        params: { path: { slug } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(slug),
  });
}

export function useBoardroomAccess(slug: string) {
  const { user } = useSession();
  return useQuery({
    queryKey: ["bursa", "boardroom-access", slug, user?.id ?? "anon"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/bursa/{slug}/boardroom-access", {
        params: { path: { slug } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(slug),
  });
}

export function useBursaDocuments(slug: string) {
  return useQuery({
    queryKey: ["bursa", "documents", slug],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/bursa/{slug}/documents", {
        params: { path: { slug } },
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(slug),
  });
}

export function useBoardroomThreads(slug: string) {
  const { user } = useSession();
  return useQuery({
    queryKey: ["bursa", "boardroom-threads", slug, user?.id ?? "anon"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/bursa/{slug}/boardroom-threads", {
        params: { path: { slug } },
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(slug),
  });
}

export function useCreateBoardroomThread(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      const { data, error } = await api.POST("/api/v1/bursa/{slug}/boardroom-threads", {
        params: { path: { slug } },
        body: { title, content },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bursa", "boardroom-threads", slug] });
    },
  });
}

export function useCreateBoardroomComment(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ threadId, content }: { threadId: string; content: string }) => {
      const { data, error } = await api.POST("/api/v1/bursa/{slug}/boardroom-threads/{id}/comments", {
        params: { path: { slug, id: threadId } },
        body: { content },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bursa", "boardroom-threads", slug] });
    },
  });
}

export function useSellShares() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, amountIdr }: { campaignId: string; amountIdr: number }) => {
      const { data, error } = await api.POST("/api/v1/campaigns/{id}/sell", {
        params: { path: { id: campaignId } },
        body: { amount_idr: amountIdr },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.portfolio.me() });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["bursa"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
