import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export function useCourses() {
  return useQuery({
    queryKey: ["lms", "courses"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/courses", {});
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCourse(slug: string) {
  return useQuery({
    queryKey: ["lms", "course", slug],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/courses/{slug}", {
        params: { path: { slug } },
      });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(slug),
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { data, error } = await api.POST("/api/v1/courses/{id}/enroll", {
        params: { path: { id: courseId } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lms"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useWebinars() {
  return useQuery({
    queryKey: ["lms", "webinars"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/webinars", {});
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRegisterWebinar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webinarId: string) => {
      const { data, error } = await api.POST("/api/v1/webinars/{id}/register", {
        params: { path: { id: webinarId } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lms", "webinars"] });
    },
  });
}

