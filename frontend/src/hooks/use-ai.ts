import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import type { components } from "@/types/api";

export type ReportDTO = components["schemas"]["ReportDTO"];
export type AISettingsDTO = components["schemas"]["AISettingsDTO"];
export type ActionItem = components["schemas"]["ActionItem"];

export function useLatestAIReport(smeId?: string) {
  return useQuery({
    queryKey: smeId ? [...queryKeys.sme.aiReports(smeId), "latest"] : ["ai-report-latest"],
    queryFn: async () => {
      if (!smeId) return null;
      const { data, error } = await api.GET("/api/v1/smes/{sme_id}/ai/reports/latest", {
        params: { path: { sme_id: smeId } },
      });
      if (error) {
        if ("status" in error && error.status === 404) return null;
        throw error;
      }
      return data ?? null;
    },
    enabled: !!smeId,
  });
}

export function useAIReports(smeId?: string, limit = 10) {
  return useQuery({
    queryKey: smeId ? [...queryKeys.sme.aiReports(smeId), limit] : ["ai-reports"],
    queryFn: async () => {
      if (!smeId) return [];
      const { data, error } = await api.GET("/api/v1/smes/{sme_id}/ai/reports", {
        params: { path: { sme_id: smeId }, query: { limit } },
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!smeId,
  });
}

export function useToggleActionItem(smeId?: string) {
  const queryClient = useQueryClient();
  const latestKey = smeId ? [...queryKeys.sme.aiReports(smeId), "latest"] : ["ai-report-latest"];

  return useMutation({
    mutationFn: async ({
      reportId,
      actionId,
      done,
    }: {
      reportId: string;
      actionId: string;
      done: boolean;
    }) => {
      if (!smeId) throw new Error("smeId required");
      const { data, error } = await api.PATCH(
        "/api/v1/smes/{sme_id}/ai/reports/{report_id}/action-items/{id}",
        {
          params: { path: { sme_id: smeId, report_id: reportId, id: actionId } },
          body: { done },
        }
      );
      if (error) throw error;
      return data;
    },
    onMutate: async ({ actionId, done }) => {
      await queryClient.cancelQueries({ queryKey: latestKey });
      const previous = queryClient.getQueryData<ReportDTO | null>(latestKey);
      queryClient.setQueryData<ReportDTO | null>(latestKey, (old) => {
        if (!old?.action_items) return old ?? null;
        return {
          ...old,
          action_items: old.action_items.map((item) =>
            item.id === actionId ? { ...item, done } : item
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(latestKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: latestKey });
    },
  });
}

export function useUpdateAISettings(smeId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interval: "14_days" | "28_days" | "disabled") => {
      if (!smeId) throw new Error("smeId required");
      const { data, error } = await api.PATCH("/api/v1/smes/{sme_id}/ai/settings", {
        params: { path: { sme_id: smeId } },
        body: { interval },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (smeId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sme.detail(smeId) });
      }
    },
  });
}
