import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";

export function useAdminStats() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/admin/stats");
      if (error) throw error;
      return data;
    },
  });

  return {
    stats: data,
    isLoading,
    error,
    refetch,
  };
}

