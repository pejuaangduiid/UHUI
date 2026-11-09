import Link from "next/link";
import { GLOSSARY } from "@/lib/glossary";

interface PdpConsentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function PdpConsent({ checked, onChange }: PdpConsentProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/50">
      <input
        type="checkbox"
        id="pdp_consent"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
      />
      <label htmlFor="pdp_consent" className="text-zinc-600 dark:text-zinc-400">
        Saya menyetujui{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {GLOSSARY.pdpConsent.full}
        </span>{" "}
        untuk pemrosesan data keuangan dan profil usaha. Baca selengkapnya di{" "}
        <Link
          href="/kebijakan-privasi"
          target="_blank"
          className="text-zinc-900 underline underline-offset-2 hover:text-zinc-700 dark:text-zinc-100"
        >
          Kebijakan Privasi
        </Link>
        .
      </label>
    </div>
  );
}

