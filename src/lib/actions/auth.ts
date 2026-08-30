"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { seedUserMasters, seedProjectStructure } from "@/lib/catalog/seed-masters";
import { registerSchema } from "@/lib/validations";
import { clearActiveProjectId } from "@/lib/project-context";
import { ensureDatabaseSchema } from "@/lib/db/init-db";

export async function logoutUser() {
  await clearActiveProjectId();
  try {
    await signOut({ redirect: false });
  } catch {
    // safe catch for Next.js redirect
  }
  return { ok: true };
}

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
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
      },
    });

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
    const message = error instanceof Error ? error.message : String(error);
    let errorStr = message;
    try {
      errorStr = JSON.stringify(error, Object.getOwnPropertyNames(error as object));
    } catch {
      // ignore serialization error
    }
    const cause = (error as { cause?: { err?: Error; message?: string } })?.cause;
    const causeMsg = cause?.err?.message || cause?.message || "";
    const combinedError = `${message} ${errorStr} ${causeMsg}`;

    console.error("Login action caught error:", combinedError);

    if (
      combinedError.includes("empty string") ||
      combinedError.includes("nonempty URL") ||
      combinedError.includes("DATABASE_URL")
    ) {
      return {
        error:
          "Database connection string missing: Please configure DATABASE_URL in Vercel Dashboard → Settings → Environment Variables.",
      };
    }

    // Auto-heal on uninitialized database / missing tables:
    if (
      combinedError.includes("DATABASE_CONNECTION_ERROR") ||
      combinedError.includes("connect") ||
      combinedError.includes("relation") ||
      combinedError.includes("does not exist") ||
      combinedError.includes("P1001") ||
      combinedError.includes("P2021") ||
      combinedError.includes("PrismaClient")
    ) {
      console.log("Database tables missing. Executing automatic schema initialization and retry...");
      try {
        await ensureDatabaseSchema();
        const passwordHash = await bcrypt.hash("test123", 10);
        const adminUser = await prisma.user.upsert({
          where: { email: "admin" },
          update: { name: "Admin", passwordHash },
          create: { email: "admin", name: "Admin", passwordHash },
        });
        await seedUserMasters(adminUser.id);
        let project = await prisma.project.findFirst({ where: { userId: adminUser.id } });
        if (!project) {
          project = await prisma.project.create({
            data: {
              userId: adminUser.id,
              name: "Nandakam",
              location: "Pruthvi Layout, Channasandra",
              builtUpArea: 3200,
              plotArea: 2400,
              totalBudget: 4000000,
              status: "IN_PROGRESS",
              startDate: new Date("2026-01-10"),
            },
          });
          await seedProjectStructure(project.id, { demoProgress: true });
        }

        // Retry sign in!
        await signIn("credentials", {
          email: input.email,
          password: input.password,
          redirect: false,
        });
        return { ok: true };
      } catch (autoErr: unknown) {
        console.error("Auto-heal during login failed:", autoErr);
        return {
          error:
            "Database table error: Please click 'Auto-Initialize Database & Admin' below to initialize database tables.",
        };
      }
    }

    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Invalid credentials. Use User ID: admin and Password: test123" };
      }
      return { error: "Authentication failed. Please verify your credentials or click auto-initialize database below." };
    }

    const digest =
      error && typeof error === "object" && "digest" in error
        ? String((error as { digest: unknown }).digest)
        : "";

    if (message.includes("NEXT_REDIRECT") || digest.startsWith("NEXT_REDIRECT")) {
      return { ok: true };
    }

    return {
      error: "Invalid user ID or password. Use 'admin' and 'test123'.",
    };
  }
}
