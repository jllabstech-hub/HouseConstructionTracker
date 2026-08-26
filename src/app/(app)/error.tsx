"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("In-app error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl border border-paper-200 bg-white p-7 sm:p-8 shadow-card text-center space-y-4">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="font-display text-xl font-bold text-ink-900">
            Something went wrong
          </h2>
          <p className="text-xs sm:text-sm text-ink-500 leading-relaxed">
            We could not complete this action. Your data is secure. You can try reloading or return to your dashboard.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-clay-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-clay-700 transition active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try again</span>
          </button>

          <Link
            href="/dashboard"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-paper-300 bg-white px-4 py-2.5 text-xs font-bold text-ink-700 hover:bg-paper-50 transition active:scale-95"
          >
            <Home className="h-4 w-4" />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
