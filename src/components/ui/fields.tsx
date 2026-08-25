import { cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  hint,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
}) {
  const ariaLabel = typeof label === "string" ? label : undefined;
  const control = isValidElement(children)
    ? cloneElement(children as React.ReactElement<{ "aria-label"?: string }>, ariaLabel ? { "aria-label": ariaLabel } : {})
    : children;

  return (
    <div className="block space-y-1.5">
      <span className="text-sm font-medium text-ink-700">{label}</span>
      {control}
      {hint ? <p className="text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-ink-900 outline-none ring-clay-500/30 placeholder:text-ink-400 focus:border-clay-500 focus:ring-4";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, "min-h-24", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputClass, props.className)} />;
}
