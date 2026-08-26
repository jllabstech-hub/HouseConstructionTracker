"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function RootErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center p-4 text-[#1C1917]">
      <div className="max-w-md w-full rounded-3xl border border-[#E8DCC8] bg-white p-8 shadow-md text-center space-y-4">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-[#FBF4EE] text-[#B85C22] border border-[#F0D5C0]">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="space-y-1.5">
          <h1 className="font-serif text-xl font-bold text-[#1C1917]">
            Something went wrong
          </h1>
          <p className="text-xs text-[#78716C] leading-relaxed">
            We encountered an unexpected error while loading this page. Your data is safe.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#B85C22] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#9A4A1B] transition active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try again</span>
          </button>

          <Link
            href="/dashboard"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[#E7E5E4] bg-white px-4 py-2.5 text-xs font-bold text-[#44403C] hover:bg-[#F5F5F4] transition active:scale-95"
          >
            <Home className="h-4 w-4" />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
