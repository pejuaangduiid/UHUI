import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";

export function useBoardroomThreads(smeId?: string, limit = 50) {
  return useQuery({
    queryKey: smeId
      ? queryKeys.community.boardroom(smeId, limit)
      : ["boardroom-threads"],
    queryFn: async () => {
      if (!smeId) return [];
      const { data, error } = await api.GET(
        "/api/v1/smes/{sme_id}/boardroom/threads",
        {
          params: { path: { sme_id: smeId }, query: { limit } },
        }
      );
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!smeId,
  });
}

export function useCreateBoardroomThread(smeId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      kind: string;
      title: string;
      content: string;
      attached_ai_report_id?: string;
    }) => {
      if (!smeId) throw new Error("smeId required");
      const { data, error } = await api.POST(
        "/api/v1/smes/{sme_id}/boardroom/threads",
        {
          params: { path: { sme_id: smeId } },
          body: payload,
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (!smeId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.community.boardroom(smeId),
      });
    },
  });
}

export function useShareAiReportToBoardroom(smeId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      note,
      confirm,
    }: {
      reportId: string;
      note?: string;
      confirm: boolean;
    }) => {
      if (!smeId) throw new Error("smeId required");
      const { data, error } = await api.POST(
        "/api/v1/smes/{sme_id}/ai/reports/{id}/share",
        {
          params: { path: { sme_id: smeId, id: reportId } },
          body: { confirm, note: note ?? "" },
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (!smeId) return;
      queryClient.invalidateQueries({
        queryKey: queryKeys.community.boardroom(smeId),
      });
    },
  });
}

