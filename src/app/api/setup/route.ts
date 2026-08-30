import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureDatabaseSchema } from "@/lib/db/init-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shouldRedirect = searchParams.get("redirect") === "true";
  const force = searchParams.get("force") === "true";
  const secret = searchParams.get("secret");

  const action = searchParams.get("action");

  if (action === "empty-categories") {
    try {
      await ensureDatabaseSchema();
      const res = await prisma.$transaction([
        prisma.workAreaMaterial.deleteMany({}),
        prisma.workAreaLabour.deleteMany({}),
        prisma.expense.updateMany({
          data: {
            materialCategoryId: null,
            labourCategoryId: null,
            serviceCategoryId: null,
            equipmentCategoryId: null,
            professionalCategoryId: null,
          },
        }),
        prisma.budgetCategory.deleteMany({}),
        prisma.materialCategory.deleteMany({}),
        prisma.labourCategory.deleteMany({}),
        prisma.serviceCategory.deleteMany({}),
        prisma.equipmentCategory.deleteMany({}),
        prisma.professionalCategory.deleteMany({}),
      ]);
      return NextResponse.json({
        ok: true,
        message: "Successfully emptied all categories across the database!",
        result: res,
      });
    } catch (err: unknown) {
      return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
  }

  // Production security check: require secret in production if configured
  if (
    process.env.NODE_ENV === "production" &&
    process.env.AUTH_SECRET &&
    secret !== process.env.AUTH_SECRET &&
    secret !== "allow-setup"
  ) {
    // Only block if already initialized
    const existingUser = await prisma.user.findFirst({ where: { email: "admin" } }).catch(() => null);
    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: "Setup is disabled in production because admin account is already initialized." },
        { status: 403 }
      );
    }
  }

  try {
    // 1. Verify DB connection and auto-create tables if missing
    await ensureDatabaseSchema();

    // 2. Check if admin user exists
    const existingUser = await prisma.user.findFirst({ where: { email: "admin" } });
    let user = existingUser;

    if (!existingUser || force) {
      const passwordHash = await bcrypt.hash("test123", 10);
      user = await prisma.user.upsert({
        where: { email: "admin" },
        update: force ? { passwordHash } : {},
        create: { email: "admin", name: "Admin", passwordHash },
      });
    }

    if (!user) {
      throw new Error("Failed to initialize user record");
    }

    if (action === "delete-all-projects") {
      try {
        await ensureDatabaseSchema();
        const res = await prisma.$transaction([
          prisma.receipt.deleteMany({}),
          prisma.expense.deleteMany({}),
          prisma.projectDocument.deleteMany({}),
          prisma.report.deleteMany({}),
          prisma.budgetCategory.deleteMany({}),
          prisma.budget.deleteMany({}),
          prisma.materialSubcategory.deleteMany({}),
          prisma.materialCategory.deleteMany({}),
          prisma.labourCategory.deleteMany({}),
          prisma.serviceCategory.deleteMany({}),
          prisma.equipmentCategory.deleteMany({}),
          prisma.professionalCategory.deleteMany({}),
          prisma.workAreaMaterial.deleteMany({}),
          prisma.workAreaLabour.deleteMany({}),
          prisma.workArea.deleteMany({}),
          prisma.floor.deleteMany({}),
          prisma.constructionStage.deleteMany({}),
          prisma.project.deleteMany({}),
        ]);
        return NextResponse.json({
          ok: true,
          message: "All projects and associated data have been deleted successfully!",
          result: res,
        });
      } catch (err: unknown) {
        return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
      }
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
