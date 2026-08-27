import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-clay-600 text-white hover:bg-clay-700 shadow-sm focus-visible:ring-clay-500",
  secondary:
    "bg-white text-ink-800 border border-paper-300 hover:bg-paper-50 focus-visible:ring-ink-500",
  ghost: "text-ink-700 hover:bg-paper-100 focus-visible:ring-ink-500",
  danger: "bg-danger text-white hover:bg-red-700 focus-visible:ring-red-600",
};

const sizes = {
  sm: "h-9 px-3 text-xs sm:text-sm",
  md: "h-11 px-4 text-sm min-h-[44px]",
  lg: "h-12 px-5 text-base min-h-[48px]",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
