"use client";

import React from "react";
import { BookOpen, CheckCircle2, ChevronRight, Clock } from "lucide-react";
import type { components } from "@/types/api";

type Lesson = components["schemas"]["LessonDTO"];

interface LessonListCardProps {
  lessons: Lesson[];
  activeLessonId?: string;
  isEnrolled: boolean;
  completedLessons: Record<string, boolean>;
  completedCount: number;
  progressPct: number;
  onSelectLesson: (l: Lesson) => void;
}

export function LessonListCard({
  lessons,
  activeLessonId,
  isEnrolled,
  completedLessons,
  completedCount,
  progressPct,
  onSelectLesson,
}: LessonListCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-500" />
          <span>Daftar Modul Kursus ({lessons.length})</span>
        </h4>
        {isEnrolled && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Progres: {completedCount}/{lessons.length}</span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full text-[11px]">{progressPct}%</span>
          </div>
        )}
      </div>

      {isEnrolled && (
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-[#1D5FAE] h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
        {lessons.map((lesson, idx) => {
          const isCurrent = activeLessonId === lesson.id;
          const isDone = Boolean(completedLessons[lesson.id]);
          return (
            <button
              key={lesson.id}
              type="button"
              onClick={() => onSelectLesson(lesson)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left text-xs transition group ${isCurrent ? "bg-[#DFE9F1]/60 text-[#1D5FAE] dark:bg-blue-950/40 dark:text-blue-200 font-bold" : "hover:bg-slate-50 dark:hover:bg-white/[0.02] text-slate-700 dark:text-slate-300"
                }`}
            >
              <div className="flex items-center gap-3">
                < div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${isDone ? "bg-[#1D5FAE] text-white" : isCurrent ? "bg-[#1D5FAE] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}>
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                </div>
                <div>
                  <span className="block text-xs font-semibold">{lesson.title}</span>
                  <span className="text-[11px] text-slate-400 font-normal line-clamp-1">{lesson.content_text}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <Clock className="h-3 w-3" />
                  <span>{lesson.duration_minutes}m</span>
                </div>
                {isEnrolled ? (
                  isDone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="h-3 w-3" /> Selesai
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                      Masuk Materi <ChevronRight className="h-3 w-3" />
                    </span>
                  )
                ) : (
                  <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">Terkunci</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

