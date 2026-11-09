import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import { useSession } from "@/hooks/use-session";
import type { components } from "@/types/api";

type SuspendUserInput = components["schemas"]["SuspendUserInput"];

export function useAdminCommunity() {
  const queryClient = useQueryClient();
  const { role } = useSession();
  const isAdmin = role === "admin" || role === "superadmin";

  const threadsQuery = useQuery({
    queryKey: queryKeys.admin.threads(50),
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/admin/community/threads", {
        params: { query: { limit: 50 } },
      });
      if (error) throw error;
      return data ?? [];
    },
  });

  const suspendedUsersQuery = useQuery({
    queryKey: queryKeys.admin.suspendedUsers(),
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/admin/users/suspended");
      if (error) throw error;
      return data ?? [];
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data, error } = await api.POST("/api/v1/admin/community/threads/{id}/delete", {
        params: { path: { id } },
        body: { reason },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.threads(50) });
      queryClient.invalidateQueries({ queryKey: ["community"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data, error } = await api.POST("/api/v1/admin/community/comments/{id}/delete", {
        params: { path: { id } },
        body: { reason },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.threads(50) });
      queryClient.invalidateQueries({ queryKey: ["community"] });
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: SuspendUserInput }) => {
      const { data, error } = await api.POST("/api/v1/admin/users/{id}/suspend", {
        params: { path: { id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.suspendedUsers() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.threads(50) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() });
    },
  });

  const unsuspendUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await api.POST("/api/v1/admin/users/{id}/unsuspend", {
        params: { path: { id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.suspendedUsers() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() });
    },
  });

  return {
    threads: threadsQuery.data ?? [],
    suspendedUsers: suspendedUsersQuery.data ?? [],
    isLoading: threadsQuery.isLoading || suspendedUsersQuery.isLoading,
    refetch: () => {
      threadsQuery.refetch();
      suspendedUsersQuery.refetch();
    },
    deleteThread: deleteThreadMutation,
    deleteComment: deleteCommentMutation,
    suspendUser: suspendUserMutation,
    unsuspendUser: unsuspendUserMutation,
  };
}
