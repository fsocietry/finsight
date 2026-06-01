"use client";

import { cn } from "@/lib/utils";

export type Period = "month" | "year" | "all";

export const PERIOD_LABEL: Record<Period, string> = {
  month: "bulan ini",
  year: "tahun ini",
  all: "sepanjang waktu",
};

const OPTIONS: { value: Period; label: string }[] = [
  { value: "month", label: "Bulan Ini" },
  { value: "year", label: "Tahun Ini" },
  { value: "all", label: "Semua" },
];

export default function PeriodFilter({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-ink/5 p-1 backdrop-blur-xl">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
            // Active segment matches the "Lihat semua" glass button.
            value === o.value
              ? "border-[color:var(--btn-glass-border)] bg-[var(--btn-glass-bg)] text-ink shadow-[inset_0_1px_0_var(--btn-glass-highlight)]"
              : "border-transparent text-ink/55 hover:text-ink"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
