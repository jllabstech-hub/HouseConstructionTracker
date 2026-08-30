"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, Home } from "lucide-react";
import { loginUser, registerUser } from "@/lib/actions/auth";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-paper-50 px-4 py-8 select-none">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Brand Icon Badge */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 shadow-xs border border-slate-700/60">
          <Home className="h-7 w-7 text-amber-400" />
        </div>

        {/* Editorial Heading */}
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight mt-4 text-center">
          Create Account
        </h1>
        <p className="text-sm font-medium text-ink-500 mt-1 text-center">
          Start tracking your house construction project.
        </p>

        {/* Form Card */}
        <div className="w-full rounded-3xl bg-white p-6 sm:p-7 shadow-xs border border-paper-200 mt-6 space-y-4">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50/90 p-3.5 text-xs font-semibold text-red-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-bold text-red-900 leading-tight">Registration Failed</p>
                <p className="text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setError(null);
              const form = new FormData(event.currentTarget);
              start(async () => {
                try {
                  const payload = {
                    name: String(form.get("name") ?? "").trim(),
                    email: String(form.get("email") ?? "").trim(),
                    password: String(form.get("password") ?? ""),
                  };
                  if (!payload.name || !payload.email || !payload.password) {
                    setError("Please fill in all required fields.");
                    return;
                  }
                  const result = await registerUser(payload);
                  if (result && result.error) {
                    setError(result.error);
                    return;
                  }
                  const loginResult = await loginUser({ email: payload.email, password: payload.password });
                  if (loginResult && loginResult.error) {
                    setError(loginResult.error);
                    return;
                  }
                  try {
                    localStorage.setItem("hct_last_login_user", payload.email);
                    localStorage.setItem("hct_last_login_pass", payload.password);
                  } catch {
                    // ignore
                  }
                  window.location.href = "/projects";
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : "An unexpected error occurred during registration.";
                  setError(msg);
                }
              });
            }}
          >
            <div>
              <label className="block text-xs font-bold text-ink-800 mb-1.5">
                Full Name
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                autoFocus
                className="w-full rounded-2xl border border-paper-200 bg-paper-100/60 px-4 py-3 text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-500/20 shadow-2xs transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-800 mb-1.5">
                Email or Username
              </label>
              <input
                name="email"
                type="text"
                required
                placeholder="e.g. ramesh or ramesh@example.com"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full rounded-2xl border border-paper-200 bg-paper-100/60 px-4 py-3 text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-500/20 shadow-2xs transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-800 mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                minLength={6}
                required
                placeholder="Minimum 6 characters"
                className="w-full rounded-2xl border border-paper-200 bg-paper-100/60 px-4 py-3 text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-500/20 shadow-2xs transition"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full inline-flex items-center justify-center rounded-2xl bg-clay-600 hover:bg-clay-700 py-3.5 px-4 text-sm font-bold text-white shadow-xs transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating account…</span>
                </span>
              ) : (
                "Create Account & Start"
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-xs text-ink-500 text-center mt-6">
          Already registered?{" "}
          <Link href="/login" className="font-bold text-clay-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
