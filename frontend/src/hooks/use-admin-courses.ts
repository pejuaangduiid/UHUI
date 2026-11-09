import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/query-keys";
import type { components } from "@/types/api";

type CreateCourseInput = components["schemas"]["CreateCourseInput"];
type UpdateCourseInput = components["schemas"]["UpdateCourseInput"];
type CreateLessonInput = components["schemas"]["CreateLessonInput"];
type UpdateLessonInput = components["schemas"]["UpdateLessonInput"];

export function useAdminCourses() {
  const queryClient = useQueryClient();

  const coursesQuery = useQuery({
    queryKey: queryKeys.admin.courses(),
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/admin/courses");
      if (error) throw error;
      return data ?? [];
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (input: CreateCourseInput) => {
      const { data, error } = await api.POST("/api/v1/admin/courses", { body: input });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() });
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateCourseInput }) => {
      const { data, error } = await api.PUT("/api/v1/admin/courses/{id}", {
        params: { path: { id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses() });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await api.DELETE("/api/v1/admin/courses/{id}", {
        params: { path: { id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() });
    },
  });

  return {
    courses: coursesQuery.data ?? [],
    isLoading: coursesQuery.isLoading,
    refetch: coursesQuery.refetch,
    createCourse: createCourseMutation,
    updateCourse: updateCourseMutation,
    deleteCourse: deleteCourseMutation,
  };
}

export function useAdminLessons(courseId: string) {
  const queryClient = useQueryClient();

  const lessonsQuery = useQuery({
    queryKey: queryKeys.admin.lessons(courseId),
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await api.GET("/api/v1/admin/courses/{id}/lessons", {
        params: { path: { id: courseId } },
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(courseId),
  });

  const createLessonMutation = useMutation({
    mutationFn: async (input: CreateLessonInput) => {
      const { data, error } = await api.POST("/api/v1/admin/courses/{id}/lessons", {
        params: { path: { id: courseId } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.lessons(courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses() });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateLessonInput }) => {
      const { data, error } = await api.PUT("/api/v1/admin/lessons/{id}", {
        params: { path: { id } },
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.lessons(courseId) });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await api.DELETE("/api/v1/admin/lessons/{id}", {
        params: { path: { id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.lessons(courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses() });
    },
  });

  return {
    lessons: lessonsQuery.data ?? [],
    isLoading: lessonsQuery.isLoading,
    createLesson: createLessonMutation,
    updateLesson: updateLessonMutation,
    deleteLesson: deleteLessonMutation,
  };
}

