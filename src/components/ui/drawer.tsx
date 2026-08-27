"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  position = "right",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: "right" | "bottom";
  className?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-labelledby="drawer-heading">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        ref={contentRef}
        className={cn(
          "relative z-10 flex flex-col bg-white shadow-2xl transition-transform animate-in duration-200 ease-out",
          position === "right"
            ? "ml-auto h-full w-full max-w-md slide-in-from-right"
            : "mt-auto h-auto max-h-[85vh] w-full rounded-t-3xl slide-in-from-bottom",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-paper-200 px-5 py-4">
          <div>
            <h2 id="drawer-heading" className="font-display text-lg font-bold text-ink-900 leading-snug">{title}</h2>
            {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-xl p-2 text-ink-400 hover:bg-paper-100 hover:text-ink-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-paper-200 bg-paper-50/50 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
