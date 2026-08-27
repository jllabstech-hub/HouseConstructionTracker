"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open && !loading) {
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
  }, [open, onClose, loading]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={() => {
          if (!loading) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={dialogRef}
        className="relative z-10 max-w-md w-full rounded-3xl bg-white p-6 shadow-2xl border border-paper-200 animate-in zoom-in-95 fade-in duration-200 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                variant === "danger"
                  ? "bg-danger-50 text-danger border border-danger-100"
                  : "bg-clay-50 text-clay-700 border border-clay-100"
              }`}
              aria-hidden="true"
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="font-display text-base sm:text-lg font-bold text-ink-900 leading-snug">
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
            className="rounded-xl p-2 text-ink-400 hover:bg-paper-100 hover:text-ink-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p id="confirm-dialog-desc" className="text-xs sm:text-sm text-ink-600 leading-relaxed pl-1">
          {description}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-paper-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="px-4 text-xs font-semibold min-h-[44px]"
          >
            {cancelText}
          </Button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 min-h-[44px] ${
              variant === "danger"
                ? "bg-danger hover:bg-red-700 focus-visible:ring-red-600"
                : "bg-clay-600 hover:bg-clay-700 focus-visible:ring-clay-500"
            }`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
