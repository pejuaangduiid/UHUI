"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useSMEProfile } from "@/hooks/use-documents";
import { useUpdateAISettings } from "@/hooks/use-ai";
import { IntervalForm } from "@/components/domain/copilot/IntervalForm";
import { LoadingState } from "@/components/states/LoadingState";

export default function CopilotSettingsPage() {
  const { smeId } = useSession();
  const { profile, isLoading } = useSMEProfile(smeId);
  const updateSettings = useUpdateAISettings(smeId);

  if (isLoading) {
    return <LoadingState message="Memuat pengaturan Co-Pilot..." />;
  }

  const handleSave = async (interval: "14_days" | "28_days" | "disabled") => {
    await updateSettings.mutateAsync(interval);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/sme/copilot"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dashboard Co-Pilot</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Pengaturan Jadwal Co-Pilot
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Konfigurasikan siklus otomatisasi analisis performa dan deteksi anomali operasional usaha.
        </p>
      </div>

      <IntervalForm
        currentInterval={profile?.ai_interval ?? "14_days"}
        nextAnalysisAt={
          typeof profile?.next_ai_analysis_at === "object" && profile?.next_ai_analysis_at?.Valid
            ? profile.next_ai_analysis_at.Time
            : typeof profile?.next_ai_analysis_at === "string"
              ? profile.next_ai_analysis_at
              : null
        }
        onSave={handleSave}
      />
    </div>
  );
}