import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureDatabaseSchema } from "@/lib/db/init-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // This route exists only to bootstrap a local development database. It must
  // never expose test credentials or destructive maintenance actions in a
  // deployed application.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const shouldRedirect = searchParams.get("redirect") === "true";

  try {
    // 1. Verify DB connection and auto-create tables if missing
    await ensureDatabaseSchema();

    // 2. Check if admin user exists
    const existingUser = await prisma.user.findFirst({ where: { email: "admin" } });
    let user = existingUser;

    if (!existingUser) {
      const passwordHash = await bcrypt.hash("test123", 10);
      user = await prisma.user.upsert({
        where: { email: "admin" },
        update: {},
        create: { email: "admin", name: "Admin", passwordHash },
      });
    }

    if (!user) {
      throw new Error("Failed to initialize user record");
    }

    if (shouldRedirect) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const host = forwardedHost || request.headers.get("host") || new URL(request.url).host;
      const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      return NextResponse.redirect(new URL("/login?setup=success", `${proto}://${host}`));
    }

    return NextResponse.json({
      ok: true,
      message: "Database verified and admin user confirmed ready!",
      credentials: {
        userId: "admin",
        password: "test123",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Setup API Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: "Please ensure DATABASE_URL is correctly configured in your Vercel Project Environment Variables.",
      },
      { status: 500 }
    );
  }
}
