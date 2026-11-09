"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { LessonStudyView } from "./LessonStudyView";
import { LessonActiveCard } from "./LessonActiveCard";
import { LessonListCard } from "./LessonListCard";
import type { components } from "@/types/api";

type Lesson = components["schemas"]["LessonDTO"];

interface LessonViewerProps {
  lessons: Lesson[];
  isEnrolled: boolean;
}

export function LessonViewer({ lessons, isEnrolled }: LessonViewerProps) {
  const uniqueLessons = useMemo(() => {
    const seen = new Set<string>();
    return lessons.filter((l) => {
      const key = `${l.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [lessons]);

  const courseId = lessons[0]?.course_id || "default";
  const storageKey = `uhui_lms_completed_${courseId}`;

  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(uniqueLessons[0] || null);
  const [studyingLesson, setStudyingLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setCompletedLessons(JSON.parse(saved));
    } catch {
      setCompletedLessons({});
    }
  }, [storageKey]);

  const handleToggleComplete = useCallback((id: string) => {
    setCompletedLessons((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch { }
      return next;
    });
  }, [storageKey]);

  const completedCount = useMemo(() => {
    return uniqueLessons.filter((l) => Boolean(completedLessons[l.id])).length;
  }, [uniqueLessons, completedLessons]);

  const progressPct = uniqueLessons.length > 0 ? Math.round((completedCount / uniqueLessons.length) * 100) : 0;

  if (studyingLesson) {
    const idx = uniqueLessons.findIndex((l) => l.id === studyingLesson.id);
    return (
      <LessonStudyView
        lesson={studyingLesson}
        lessonIndex={idx >= 0 ? idx : 0}
        totalLessons={uniqueLessons.length}
        lessons={uniqueLessons}
        completedLessons={completedLessons}
        onToggleComplete={handleToggleComplete}
        onBack={() => setStudyingLesson(null)}
        onSelectLesson={(l) => { setStudyingLesson(l); setActiveLesson(l); }}
        onPrevLesson={idx > 0 ? () => { setStudyingLesson(uniqueLessons[idx - 1]); setActiveLesson(uniqueLessons[idx - 1]); } : undefined}
        onNextLesson={idx < uniqueLessons.length - 1 ? () => { setStudyingLesson(uniqueLessons[idx + 1]); setActiveLesson(uniqueLessons[idx + 1]); } : undefined}
      />
    );
  }

  const isActiveDone = activeLesson ? Boolean(completedLessons[activeLesson.id]) : false;

  return (
    <div className="space-y-6">
      {isEnrolled && activeLesson && (
        <LessonActiveCard
          lesson={activeLesson}
          isActiveDone={isActiveDone}
          onToggleComplete={() => handleToggleComplete(activeLesson.id)}
          onStudy={() => setStudyingLesson(activeLesson)}
        />
      )}

      <LessonListCard
        lessons={uniqueLessons}
        activeLessonId={activeLesson?.id}
        isEnrolled={isEnrolled}
        completedLessons={completedLessons}
        completedCount={completedCount}
        progressPct={progressPct}
        onSelectLesson={(lesson) => {
          setActiveLesson(lesson);
          if (isEnrolled) setStudyingLesson(lesson);
        }}
      />
    </div>
  );
}
