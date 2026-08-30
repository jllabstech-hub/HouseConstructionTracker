"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, AlertCircle, Loader2, Home } from "lucide-react";
import { loginUser } from "@/lib/actions/auth";

export default function LoginForm({
  setup,
  callbackUrl,
}: {
  setup?: string;
  callbackUrl?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Load last entered login details for instant convenience upon logout/return
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("hct_last_login_user");
      const savedPass = localStorage.getItem("hct_last_login_pass");
      if (savedUser) {
        setEmail(savedUser);
        if (savedPass) setPassword(savedPass);
      } else {
        // First-time demo defaults
        setEmail("admin");
        setPassword("test123");
      }
    } catch {
      setEmail("admin");
      setPassword("test123");
    }
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const userToSave = email.trim();
    const passToSave = password;

    try {
      if (userToSave) localStorage.setItem("hct_last_login_user", userToSave);
      if (passToSave) localStorage.setItem("hct_last_login_pass", passToSave);
    } catch {
      // ignore storage errors
    }

    start(async () => {
      try {
        const result = await loginUser({
          email: userToSave,
          password: passToSave,
        });
        if (result && result.error) {
          setError(result.error);
          return;
        }
        const target = callbackUrl || "/dashboard";
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

    try {
      localStorage.setItem("hct_last_login_user", "admin");
      localStorage.setItem("hct_last_login_pass", "test123");
    } catch {
      // ignore
    }

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
        const target = callbackUrl || "/dashboard";
        window.location.href = target;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
        setError(msg);
      }
    });
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-paper-50 px-4 py-8 select-none">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Brand Icon Badge */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 shadow-xs border border-slate-700/60">
          <Home className="h-7 w-7 text-amber-400" />
        </div>

        {/* Editorial Heading */}
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight mt-4 text-center">
          House Tracker
        </h1>
        <p className="text-sm font-medium text-ink-500 mt-1 text-center">
          Sign in to continue.
        </p>

        {/* Form Card */}
        <div className="w-full rounded-3xl bg-white p-6 sm:p-7 shadow-xs border border-paper-200 mt-6 space-y-4">
          {setup === "success" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs font-semibold text-emerald-800 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Database Ready!</p>
                <p className="text-emerald-700">Tables and demo user verified. Click below to sign in.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50/90 p-3.5 text-xs font-semibold text-red-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-bold text-red-900 leading-tight">Sign In Failed</p>
                <p className="text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-ink-800 mb-1.5">
                Email or Username
              </label>
              <input
                name="email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin or user@example.com"
                autoComplete="username"
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
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
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
                  <span>Signing in…</span>
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Quick Demo Sign In */}
          <div className="pt-2 border-t border-paper-100 flex items-center justify-between text-xs">
            <span className="text-ink-500 font-medium">Quick Demo (admin):</span>
            <button
              type="button"
              onClick={handleQuickAdminLogin}
              disabled={pending}
              className="font-bold text-clay-700 hover:text-clay-800 hover:underline cursor-pointer"
            >
              1-Click Demo Login &rarr;
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-xs text-ink-500 text-center mt-6">
          New here?{" "}
          <Link href="/register" className="font-bold text-clay-700 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
