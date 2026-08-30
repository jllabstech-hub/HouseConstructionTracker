import { cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  hint,
  error,
  required,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
}) {
  const ariaLabel = typeof label === "string" ? label : undefined;
  const control = isValidElement(children)
    ? cloneElement(
        children as React.ReactElement<{
          "aria-label"?: string;
          "aria-invalid"?: boolean;
          "aria-required"?: boolean;
        }>,
        {
          ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
          ...(error ? { "aria-invalid": true } : {}),
          ...(required ? { "aria-required": true } : {}),
        }
      )
    : children;

  return (
    <div className="block space-y-1.5">
      <label className="text-xs sm:text-sm font-bold text-ink-800 flex items-center justify-between">
        <span>
          {label} {required && <span className="text-danger" aria-hidden="true">*</span>}
        </span>
      </label>
      {control}
      {hint && !error ? <p className="text-xs text-ink-500">{hint}</p> : null}
      {error ? (
        <p className="text-xs font-semibold text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-paper-200 bg-paper-100/60 px-4 py-3 text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-500/30 shadow-2xs transition";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, "min-h-24", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputClass, props.className)} />;
}
