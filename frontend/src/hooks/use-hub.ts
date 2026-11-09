import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";

export function useHubThreads(limit = 50) {
  return useQuery({
    queryKey: queryKeys.community.hub(limit),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/community/hub/threads", {
        params: { query: { limit } },
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateHubThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      kind: string;
      title: string;
      content: string;
      shared_metrics_json?: string;
    }) => {
      const { data, error } = await api.POST("/api/v1/community/hub/threads", {
        body: payload,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "hub"] });
      queryClient.invalidateQueries({ queryKey: ["community", "me-threads"] });
    },
  });
}

export function useThread(id: string) {
  return useQuery({
    queryKey: queryKeys.community.thread(id),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/community/threads/{id}", {
        params: { path: { id } },
      });
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!id,
  });
}

export function useThreadComments(threadId: string) {
  return useQuery({
    queryKey: queryKeys.community.comments(threadId),
    queryFn: async () => {
      const { data, error } = await api.GET(
        "/api/v1/community/threads/{id}/comments",
        {
          params: { path: { id: threadId } },
        }
      );
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!threadId,
  });
}

export function useCreateComment(threadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await api.POST(
        "/api/v1/community/threads/{id}/comments",
        {
          params: { path: { id: threadId } },
          body: { content },
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.community.comments(threadId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.community.thread(threadId),
      });
    },
  });
}

