import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { components } from "@/types/api";

type Group = components["schemas"]["CommunityGroupDTO"];

export function useCommunityGroups() {
  return useQuery({
    queryKey: ["community", "groups"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/community/groups", {});
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useJoinCommunityGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data, error } = await api.POST("/api/v1/community/groups/{id}/join", {
        params: { path: { id: groupId } },
      });
      if (error) throw error;
      return data;
    },
      onMutate: async (groupId: string) => {
        await qc.cancelQueries({ queryKey: ["community", "groups"] });
        const prev = qc.getQueryData<Group[]>(["community", "groups"]);
        if (prev) {
          qc.setQueryData(["community", "groups"], prev.map((g) => (g.id === groupId ? { ...g, is_member: true, member_count: g.member_count + 1 } : g)));
        }
        return { prev };
      },
        onError: (_err, _vars, ctx) => {
          if (ctx?.prev) qc.setQueryData(["community", "groups"], ctx.prev);
        },
          onSettled: () => {
            qc.invalidateQueries({ queryKey: ["community", "groups"] });
          },
  });
}

export function useLeaveCommunityGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data, error } = await api.POST("/api/v1/community/groups/{id}/leave", {
        params: { path: { id: groupId } },
      });
      if (error) throw error;
      return data;
    },
      onMutate: async (groupId: string) => {
        await qc.cancelQueries({ queryKey: ["community", "groups"] });
        const prev = qc.getQueryData<Group[]>(["community", "groups"]);
        if (prev) {
          qc.setQueryData(["community", "groups"], prev.map((g) => (g.id === groupId ? { ...g, is_member: false, member_count: Math.max(0, g.member_count - 1) } : g)));
        }
        return { prev };
      },
        onError: (_err, _vars, ctx) => {
          if (ctx?.prev) qc.setQueryData(["community", "groups"], ctx.prev);
        },
          onSettled: () => {
            qc.invalidateQueries({ queryKey: ["community", "groups"] });
          },
  });
}

export function useCreateCommunityGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      sector,
      description,
      iconName = "users",
    }: {
      name: string;
      sector: string;
      description: string;
      iconName?: string;
    }) => {
      const { data, error } = await api.POST("/api/v1/community/groups", {
        body: { name, sector, description, icon_name: iconName },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community", "groups"] });
    },
  });
}

export function useGroupThreads(groupId: string) {
  return useQuery({
    queryKey: ["community", "group-threads", groupId],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/community/groups/{id}/threads", {
        params: { path: { id: groupId } },
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(groupId),
  });
}

export function useCreateGroupThread(defaultGroupId = "") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      ...payload
    }: {
      groupId?: string;
      kind: string;
      title: string;
      content: string;
    }) => {
      const gid = groupId || defaultGroupId;
      const { data, error } = await api.POST("/api/v1/community/groups/{id}/threads", {
        params: { path: { id: gid } },
        body: payload,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      const gid = vars.groupId || defaultGroupId;
      qc.invalidateQueries({ queryKey: ["community", "group-threads", gid] });
      qc.invalidateQueries({ queryKey: ["community", "hub"] });
      qc.invalidateQueries({ queryKey: ["community", "me-threads"] });
    },
  });
}

