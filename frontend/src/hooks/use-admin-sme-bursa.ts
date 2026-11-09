import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";

export function useAdminSMEs() {
  const queryClient = useQueryClient();

  const smesQuery = useQuery({
    queryKey: queryKeys.admin.smes(),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/admin/smes");
      if (error) throw error;
      return data ?? [];
    },
  });

  const suspendSMEMutation = useMutation({
    mutationFn: async ({ id, isSuspended, reason }: { id: string; isSuspended: boolean; reason?: string }) => {
      const { data, error } = await api.POST("/api/v1/admin/smes/{id}/suspend", {
        params: { path: { id } },
        body: { is_suspended: isSuspended, reason },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.smes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() });
    },
  });

  return {
    smes: smesQuery.data ?? [],
    isLoading: smesQuery.isLoading,
    refetch: smesQuery.refetch,
    setSMESuspension: suspendSMEMutation,
  };
}

export function useAdminCampaigns() {
  const queryClient = useQueryClient();

  const campaignsQuery = useQuery({
    queryKey: queryKeys.admin.campaigns(),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/admin/campaigns");
      if (error) throw error;
      return data ?? [];
    },
  });

  const suspendCampaignMutation = useMutation({
    mutationFn: async ({ id, isSuspended, reason }: { id: string; isSuspended: boolean; reason?: string }) => {
      const { data, error } = await api.POST("/api/v1/admin/campaigns/{id}/suspend", {
        params: { path: { id } },
        body: { is_suspended: isSuspended, reason },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.campaigns() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() });
    },
  });

  return {
    campaigns: campaignsQuery.data ?? [],
    isLoading: campaignsQuery.isLoading,
    refetch: campaignsQuery.refetch,
    setCampaignSuspension: suspendCampaignMutation,
  };
}

