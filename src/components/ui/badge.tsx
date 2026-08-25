import { cn } from "@/lib/utils";

const tones = {
  material: "bg-clay-100 text-clay-800",
  labour: "bg-timber-100 text-timber-700",
  service: "bg-sky-100 text-sky-800",
  equipment: "bg-amber-100 text-amber-800",
  professional: "bg-violet-100 text-violet-800",
  other: "bg-ink-100 text-ink-700",
  warn: "bg-red-100 text-red-800",
  ok: "bg-emerald-100 text-emerald-800",
};

export function Badge({
  children,
  tone = "other",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

export function expenseTone(type: string): keyof typeof tones {
  if (type === "MATERIAL") return "material";
  if (type === "LABOUR") return "labour";
  if (type === "SERVICE") return "service";
  if (type === "EQUIPMENT") return "equipment";
  if (type === "PROFESSIONAL") return "professional";
  return "other";
}
