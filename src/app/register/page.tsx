"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Building2, Sparkles, AlertCircle, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { loginUser, registerUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/fields";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper-50 px-4 py-8">
      <div className="w-full max-w-md space-y-5 rounded-3xl bg-white p-6 sm:p-8 shadow-card border border-paper-200">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-clay-600 text-white shadow-xs">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-900">Create Account</h1>
            <p className="text-xs text-ink-500 font-medium">House Construction Tracker & Budget</p>
          </div>
        </div>

        {/* 1-Click Demo Login Banner */}
        <div className="rounded-2xl border border-clay-200 bg-clay-50/70 p-3 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-clay-600 shrink-0" />
            <span className="text-ink-700 font-medium">Just exploring the demo?</span>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-bold text-clay-700 hover:text-clay-900 transition"
          >
            <span>1-Click Sign In</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

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
                window.location.href = "/projects";
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "An unexpected error occurred during registration.";
                setError(msg);
              }
            });
          }}
        >
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50/90 p-3.5 text-xs font-semibold text-red-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-bold text-red-900 leading-tight">Registration Failed</p>
                <p className="text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <Field label="Full Name">
            <TextInput name="name" required placeholder="e.g. Ramesh Kumar" autoFocus />
          </Field>

          <Field label="User ID / Email">
            <TextInput
              name="email"
              type="text"
              required
              placeholder="e.g. ramesh or ramesh@example.com"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </Field>

          <Field label="Password">
            <TextInput
              name="password"
              type="password"
              minLength={6}
              required
              placeholder="Minimum 6 characters"
            />
          </Field>

          {/* Value Props */}
          <div className="rounded-xl bg-paper-50 p-2.5 border border-paper-200 text-[11px] text-ink-600 space-y-1">
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Strict Material & Labour expense separation</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>20-stage sequential construction milestones</span>
            </div>
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating account…</span>
              </span>
            ) : (
              "Create Account & Start"
            )}
          </Button>

          <p className="text-xs text-ink-600 text-center pt-2">
            Already registered?{" "}
            <Link href="/login" className="font-bold text-clay-700 hover:underline">
              Sign in to your tracker
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
