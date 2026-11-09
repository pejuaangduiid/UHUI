import Link from "next/link";
import { EmptyState } from "@/components/states/EmptyState";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <EmptyState
        title="Halaman Tidak Ditemukan (404)"
        description="Halaman yang Anda tuju tidak tersedia atau telah dipindahkan."
        action={
          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Kembali ke Beranda
          </Link>
        }
      />
    </div>
  );
}

