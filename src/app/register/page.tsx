"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser, registerUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/fields";

export default function RegisterPage() {
  const router = useRouter();
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
            const payload = {
              name: String(form.get("name") ?? ""),
              email: String(form.get("email") ?? ""),
              password: String(form.get("password") ?? ""),
            };
            const result = await registerUser(payload);
            if (result.error) {
              setError(result.error);
              return;
            }
            await loginUser({ email: payload.email, password: payload.password });
            router.push("/projects");
            router.refresh();
          });
        }}
      >
        <h1 className="font-display text-3xl">Create your tracker</h1>
        <Field label="Name">
          <TextInput name="name" required />
        </Field>
        <Field label="Email">
          <TextInput name="email" type="email" required />
        </Field>
        <Field label="Password">
          <TextInput name="password" type="password" minLength={8} required />
        </Field>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating…" : "Create account"}
        </Button>
        <p className="text-sm text-ink-600">
          Already registered? <Link href="/login" className="font-semibold text-clay-700">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
