"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/fields";

export default function LoginForm() {
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper-50 px-4">
      <form
        className="w-full max-w-md space-y-4 rounded-3xl bg-white p-8 shadow-card border border-paper-200"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          const form = new FormData(event.currentTarget);
          start(async () => {
            try {
              const result = await loginUser({
                email: String(form.get("email") ?? ""),
                password: String(form.get("password") ?? ""),
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
        }}
      >
        <h1 className="font-display text-3xl font-bold text-ink-900">Welcome back</h1>
        <p className="text-sm text-ink-600">Sign in to your construction tracker.</p>
        
        {error && (
          <div className="space-y-2">
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 leading-relaxed">
              {error}
            </div>
            <a
              href="/api/setup"
              target="_blank"
              rel="noreferrer"
              className="block text-center text-xs text-clay-700 font-bold hover:text-clay-900 underline"
            >
              First time deploying on Vercel? Click here to verify database connection →
            </a>
          </div>
        )}

        <Field label="User ID / Email">
          <TextInput
            name="email"
            type="text"
            required
            defaultValue="admin"
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
            defaultValue="test123"
            placeholder="Password"
          />
        </Field>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>

        <p className="text-sm text-ink-600 text-center">
          New here?{" "}
          <Link href="/register" className="font-semibold text-clay-700 hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}
