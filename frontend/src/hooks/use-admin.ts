import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";

export function useAdmin() {
  const queryClient = useQueryClient();

  const queue = useQuery({
    queryKey: queryKeys.admin.reviewQueue(),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/admin/review-queue");
      if (error) throw error;
      return data ?? [];
    },
  });

  const reviewDoc = useMutation({
    mutationFn: async ({ id, status, reviewNote }: { id: string; status: "approved" | "rejected"; reviewNote?: string }) => {
      const { data, error } = await api.POST("/api/v1/admin/documents/{id}/review", {
        params: { path: { id } },
        body: { status, review_note: reviewNote },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.reviewQueue() });
    },
  });

  return {
    queue: queue.data ?? [],
    isLoading: queue.isLoading,
    reviewDocument: reviewDoc,
    refetch: queue.refetch,
  };
}

