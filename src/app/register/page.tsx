"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { loginUser, registerUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/fields";

export default function RegisterPage() {
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
              const payload = {
                name: String(form.get("name") ?? ""),
                email: String(form.get("email") ?? ""),
                password: String(form.get("password") ?? ""),
              };
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
        <h1 className="font-display text-3xl font-bold text-ink-900">Create your tracker</h1>
        <p className="text-sm text-ink-600">Start tracking your house construction project.</p>
        
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 leading-relaxed">
            {error}
          </div>
        )}

        <Field label="Full Name">
          <TextInput name="name" required placeholder="e.g. Ramesh" />
        </Field>
        
        <Field label="Email / User ID">
          <TextInput name="email" type="text" required placeholder="name@example.com" autoCapitalize="none" />
        </Field>
        
        <Field label="Password">
          <TextInput name="password" type="password" minLength={6} required placeholder="Minimum 6 characters" />
        </Field>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating…" : "Create account"}
        </Button>
        
        <p className="text-sm text-ink-600 text-center">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-clay-700 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
