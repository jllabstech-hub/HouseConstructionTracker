import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "clay" | "timber" | "warn" | "neutral";
}) {
  return (
    <article
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-card",
        tone === "clay" && "border-clay-200",
        tone === "timber" && "border-timber-100",
        tone === "warn" && "border-red-200",
        !tone && "border-paper-200/80",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="number-inr mt-2 font-display text-2xl text-ink-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
    </article>
  );
}

export function Money({ value }: { value: { toString(): string } | string | number }) {
  return <span className="number-inr">{formatINR(value)}</span>;
}
