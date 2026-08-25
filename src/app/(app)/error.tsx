"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-card">
      <h2 className="font-display text-2xl">Something went wrong</h2>
      <p className="mt-2 text-sm text-ink-600">{error.message}</p>
      <button type="button" className="mt-4 rounded-xl bg-clay-600 px-4 py-2 text-white" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
