import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import type { components } from "@/types/api";

type ThreadDTO = components["schemas"]["ThreadDTO"];

export function useVote(threadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST(
        "/api/v1/community/threads/{id}/vote",
        {
          params: { path: { id: threadId } },
        }
      );
      if (error) throw error;
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.community.thread(threadId),
      });

      const prev = queryClient.getQueryData<ThreadDTO>(
        queryKeys.community.thread(threadId)
      );

      if (prev) {
        queryClient.setQueryData<ThreadDTO>(
          queryKeys.community.thread(threadId),
          {
            ...prev,
            has_voted: !prev.has_voted,
            upvotes_count: prev.has_voted
              ? Math.max(prev.upvotes_count - 1, 0)
              : prev.upvotes_count + 1,
          }
        );
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(
          queryKeys.community.thread(threadId),
          context.prev
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.community.thread(threadId),
      });
      queryClient.invalidateQueries({ queryKey: ["community"] });
    },
  });
}

