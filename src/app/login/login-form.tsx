"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles, Building2, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { loginUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/fields";

export default function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("test123");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    start(async () => {
      try {
        const result = await loginUser({
          email: email.trim(),
          password: password,
        });
        if (result && result.error) {
          setError(result.error);
          return;
        }
        const target = params.get("callbackUrl") || "/dashboard";
        window.location.href = target;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
        setError(msg);
      }
    });
  };

  const handleQuickAdminLogin = () => {
    setEmail("admin");
    setPassword("test123");
    setError(null);

    start(async () => {
      try {
        const result = await loginUser({
          email: "admin",
          password: "test123",
        });
        if (result && result.error) {
          setError(result.error);
          return;
        }
        const target = params.get("callbackUrl") || "/dashboard";
        window.location.href = target;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
        setError(msg);
      }
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper-50 px-4 py-8">
      <div className="w-full max-w-md space-y-5 rounded-3xl bg-white p-6 sm:p-8 shadow-card border border-paper-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-clay-600 text-white shadow-xs">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-900">Welcome back</h1>
            <p className="text-xs text-ink-500 font-medium">House Construction Tracker & Budget</p>
          </div>
        </div>

        {params.get("setup") === "success" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs font-semibold text-emerald-800 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900">Database Ready!</p>
              <p className="text-emerald-700">Tables and admin user verified. Click below to sign in.</p>
            </div>
          </div>
        )}

        {/* 1-Click Quick Demo Sign In Button */}
        <button
          type="button"
          onClick={handleQuickAdminLogin}
          disabled={pending}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-clay-50 to-amber-50/70 border-2 border-clay-300 hover:border-clay-500 hover:shadow-xs transition active:scale-[0.98] text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-clay-600 text-white group-hover:scale-105 transition">
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink-900">⚡ 1-Click Demo Login (Admin)</p>
              <p className="text-[11px] text-ink-500 font-medium">Auto-fills admin / test123 and signs in</p>
            </div>
          </div>
          <span className="text-xs font-bold text-clay-700 group-hover:translate-x-0.5 transition">
            {pending ? "…" : "Sign In ➔"}
          </span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-paper-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-ink-400">
            or sign in with credentials
          </span>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          {error && (
            <div className="space-y-2.5">
              <div className="rounded-2xl border border-red-200 bg-red-50/90 p-3.5 text-xs font-semibold text-red-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-red-900 leading-tight">Sign In Failed</p>
                  <p className="text-red-700 mt-0.5">{error}</p>
                </div>
              </div>

              <a
                href="/api/setup?redirect=true"
                className="block text-center rounded-xl border border-clay-300 bg-clay-50/80 px-3 py-2 text-xs text-clay-800 font-bold hover:bg-clay-100 transition"
              >
                🛠️ First time on Vercel? Auto-Initialize Database & Admin →
              </a>
            </div>
          )}

          <Field label="User ID / Email">
            <TextInput
              name="email"
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin or user@example.com"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </Field>

          <Field label="Password">
            <TextInput
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </Field>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in…</span>
              </span>
            ) : (
              "Sign In"
            )}
          </Button>

          <p className="text-xs text-ink-600 text-center pt-2">
            New here?{" "}
            <Link href="/register" className="font-bold text-clay-700 hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
