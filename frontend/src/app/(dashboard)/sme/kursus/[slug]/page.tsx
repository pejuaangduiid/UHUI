"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCourse, useEnrollCourse } from "@/hooks/use-lms";
import { useWallet } from "@/hooks/use-wallet";
import { formatIDR } from "@/lib/money";
import { TopUpModal } from "@/components/domain/wallet/TopUpModal";
import { LessonViewer } from "@/components/domain/lms/LessonViewer";
import { ArrowLeft, CheckCircle, Wallet, Sparkles } from "lucide-react";

export default function SmeCourseDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { data: course, isLoading, error } = useCourse(slug);
  const enrollMutation = useEnrollCourse();
  const { balance } = useWallet();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [justEnrolled, setJustEnrolled] = useState(false);

  if (isLoading) {
    return <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />;
  }

  if (error || !course) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 space-y-3">
        <p>Kursus tidak ditemukan atau telah diarsipkan.</p>
        <Link href="/sme/kursus" className="text-blue-500 font-bold underline">
          Kembali ke Katalog Kursus
        </Link>
      </div>
    );
  }

  const isEnrolled = justEnrolled || course.is_enrolled;
  const isFree = course.price_idr === 0;
  const canAfford = balance >= course.price_idr;

  const handleEnroll = () => {
    if (!isFree && !canAfford) {
      setTopUpOpen(true);
      return;
    }
    enrollMutation.mutate(course.id, {
      onSuccess: () => setJustEnrolled(true),
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/sme/kursus"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-medium"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Katalog Kursus
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#121827] space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-extrabold uppercase text-blue-500 px-2.5 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">
            Tingkat {course.level}
          </span>
          <span className="text-slate-400">&bull;</span>
          <span className="text-slate-500 dark:text-slate-400 font-medium">Instruktur: {course.instructor_name}</span>
          <span className="text-slate-400">&bull;</span>
          <span className="text-slate-500 dark:text-slate-400 font-medium">{course.lesson_count} Modul Materi</span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{course.title}</h1>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{course.description}</p>

        {isEnrolled ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3.5 py-2 rounded-xl">
            <CheckCircle className="h-4 w-4" />
            <span>Status: Akses Kursus Terbuka • Anda telah memiliki kursus ini</span>
          </div>
        ) : (
          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.05] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">Biaya Pendaftaran Kursus</div>
              <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                {isFree ? "Gratis" : formatIDR(course.price_idr)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-white/5">
                <Wallet className="h-3.5 w-3.5 text-blue-500" />
                <span>Saldo Anda:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{formatIDR(balance)}</span>
              </div>

              {!isFree && !canAfford ? (
                <button
                  type="button"
                  onClick={() => setTopUpOpen(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  <span>Saldo Kurang • Top Up Saldo</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={enrollMutation.isPending}
                  onClick={handleEnroll}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/25 flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{enrollMutation.isPending ? "Memproses..." : isFree ? "Daftar Gratis" : "Beli Kursus dengan Saldo"}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <LessonViewer lessons={course.lessons ?? []} isEnrolled={isEnrolled} />
      <TopUpModal isOpen={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </div>
  );
}
