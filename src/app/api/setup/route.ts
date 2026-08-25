import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { seedUserMasters, seedProjectStructure } from "@/lib/catalog/seed-masters";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shouldRedirect = searchParams.get("redirect") === "true";

  try {
    // 1. Verify DB connection
    await prisma.$queryRaw`SELECT 1`;

    // 2. Ensure admin user exists
    const passwordHash = await bcrypt.hash("test123", 10);
    const user = await prisma.user.upsert({
      where: { email: "admin" },
      update: { name: "Admin", passwordHash },
      create: { email: "admin", name: "Admin", passwordHash },
    });

    // 3. Seed user masters (materials, labours, work areas)
    await seedUserMasters(user.id);

    // 4. Ensure default project exists
    let project = await prisma.project.findFirst({ where: { userId: user.id } });
    if (!project) {
      project = await prisma.project.create({
        data: {
          userId: user.id,
          name: "Nandakam",
          location: "Pruthvi Layout, Channasandra",
          builtUpArea: 3200,
          plotArea: 2400,
          totalBudget: 4000000,
          status: "IN_PROGRESS",
          startDate: new Date("2026-01-10"),
        },
      });
    }

    await seedProjectStructure(project.id, { demoProgress: true });

    if (shouldRedirect) {
      return NextResponse.redirect(new URL("/login?setup=success", request.url));
    }

    return NextResponse.json({
      ok: true,
      message: "Database connected, tables verified, and admin user initialized successfully!",
      credentials: {
        userId: "admin",
        password: "test123",
      },
      projectName: project.name,
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
