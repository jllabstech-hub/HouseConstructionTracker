"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/fields";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper-50 px-4">
      <form
        className="w-full max-w-md space-y-4 rounded-3xl bg-white p-8 shadow-card"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          start(async () => {
            const result = await loginUser({
              email: String(form.get("email") ?? ""),
              password: String(form.get("password") ?? ""),
            });
            if (result.error) {
              setError(result.error);
              return;
            }
            router.push(params.get("callbackUrl") || "/dashboard");
            router.refresh();
          });
        }}
      >
        <h1 className="font-display text-3xl">Welcome back</h1>
        <p className="text-sm text-ink-600">Sign in to your construction tracker.</p>
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
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-sm text-ink-600">
          New here?{" "}
          <Link href="/register" className="font-semibold text-clay-700">
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}
