"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { seedUserMasters } from "@/lib/catalog/seed-masters";
import { registerSchema } from "@/lib/validations";

export async function registerUser(input: unknown) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: "An account with this email already exists" };

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
      },
    });
    await seedUserMasters(user.id);
    return { ok: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Registration error:", error);
    return {
      error:
        message.includes("connect") || message.includes("database")
          ? "Unable to connect to database. Please check your Vercel DATABASE_URL setting."
          : "Registration failed. Please try again.",
    };
  }
}

export async function loginUser(input: { email: string; password: string }) {
  try {
    await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirect: false,
    });
    return { ok: true };
  } catch (error: unknown) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Invalid user ID or password" };
      }
      return { error: "Authentication failed. Please verify your credentials." };
    }
    const message = error instanceof Error ? error.message : String(error);
    const digest = error && typeof error === "object" && "digest" in error ? String((error as { digest: unknown }).digest) : "";

    // Next.js redirect errors are expected if redirect is invoked internally
    if (message.includes("NEXT_REDIRECT") || digest.startsWith("NEXT_REDIRECT")) {
      return { ok: true };
    }
    console.error("Login action error:", error);
    if (
      message.includes("DATABASE_CONNECTION_ERROR") ||
      message.includes("connect") ||
      message.includes("database")
    ) {
      return {
        error:
          "Database connection error. Please verify DATABASE_URL and AUTH_SECRET in your Vercel environment variables.",
      };
    }
    return {
      error: "Invalid user ID or password.",
    };
  }
}
