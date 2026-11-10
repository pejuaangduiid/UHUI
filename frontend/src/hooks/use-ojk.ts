import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  FALLBACK_SCF_PARTNERS,
  type SCFPartner,
  type OJKCheckResult,
  type SMEScreeningResult,
} from "@/lib/ojk-constants";

export { FALLBACK_SCF_PARTNERS, type SCFPartner, type OJKCheckResult, type SMEScreeningResult };

export function useSCFPartners() {
  return useQuery({
    queryKey: ["ojk", "scf-partners"],
    queryFn: async (): Promise<SCFPartner[]> => {
      try {
        const { data, error } = await api.GET("/api/v1/ojk/scf-partners");
        if (error || !data || data.length === 0) {
          return FALLBACK_SCF_PARTNERS;
        }
        return data;
      } catch {
        return FALLBACK_SCF_PARTNERS;
      }
    },
    staleTime: 1000 * 60 * 30, // 30 mins
    initialData: FALLBACK_SCF_PARTNERS,
  });
}

export function useOJKCheck(query: string) {
  return useQuery({
    queryKey: ["ojk", "check", query],
    queryFn: async (): Promise<OJKCheckResult> => {
      if (!query.trim()) {
        return {
          query: "",
          total_matches: 0,
          status: "NOT_FOUND_CLEAN",
          licensed_matches: [],
          illegal_matches: [],
          data_source: "fallback_offline",
          disclaimer: "Status perizinan mengacu pada basis data publik OJK dan Satgas Waspada Investasi.",
        };
      }
      try {
        const { data, error } = await api.GET("/api/v1/ojk/check", {
          params: { query: { query } },
        });
        if (error || !data) {
          throw new Error("Gagal memeriksa status OJK");
        }
        return data;
      } catch {
        const lower = query.toLowerCase();
        const lic = FALLBACK_SCF_PARTNERS.filter(
          (p) => p.brand_name.toLowerCase().includes(lower) || p.entity_name.toLowerCase().includes(lower)
        );
        return {
          query,
          total_matches: lic.length,
          status: lic.length > 0 ? "VERIFIED_LICENSED" : "NOT_FOUND_CLEAN",
          licensed_matches: lic,
          illegal_matches: [],
          data_source: "fallback_offline",
          disclaimer: "Sistem menggunakan data luring lokal karena server upstream tidak merespons.",
        };
      }
    },
    enabled: query.trim().length > 1,
  });
}

export function useSMEScreening(smeId?: string) {
  return useQuery({
    queryKey: ["ojk", "screening", smeId],
    queryFn: async (): Promise<SMEScreeningResult | null> => {
      if (!smeId) return null;
      try {
        const { data, error } = await api.GET("/api/v1/admin/smes/{id}/ojk-screening", {
          params: { path: { id: smeId } },
        });
        if (error) return null;
        return data ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!smeId,
  });
}

export function useOJKSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await api.POST("/api/v1/admin/ojk/sync");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ojk"] });
    },
  });
}
