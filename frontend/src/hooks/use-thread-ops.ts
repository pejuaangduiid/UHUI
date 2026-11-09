import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useMyThreads(limit = 50) {
  return useQuery({
    queryKey: ["community", "me-threads", limit],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/community/me/threads", {
        params: { query: { limit } },
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      content,
      kind = "discussion",
    }: {
      id: string;
      title: string;
      content: string;
      kind?: string;
    }) => {
      const { data, error } = await api.PUT("/api/v1/community/threads/{id}", {
        params: { path: { id } },
        body: { title, content, kind },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community"] });
    },
  });
}

export function useDeleteThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await api.DELETE("/api/v1/community/threads/{id}", {
        params: { path: { id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community"] });
    },
  });
}

