import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.join(__dirname, "..", "node_modules", "@react-pdf", "hyphenate", "package.json");

if (fs.existsSync(pkgPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    let modified = false;
    if (pkg.exports && pkg.exports["./*"] && !pkg.exports["./*"].default) {
      pkg.exports["./*"].default = "./lib/*.js";
      modified = true;
    }
    if (pkg.exports && pkg.exports["."] && !pkg.exports["."].default) {
      pkg.exports["."].default = "./lib/index.js";
      modified = true;
    }
    if (pkg.exports && !pkg.exports["./package.json"]) {
      pkg.exports["./package.json"] = "./package.json";
      modified = true;
    }
    if (modified) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
      console.log("Patched @react-pdf/hyphenate package.json exports");
    }
  } catch (err) {
    console.warn("Could not patch @react-pdf/hyphenate:", err instanceof Error ? err.message : String(err));
  }
}

async function runNeonMigration() {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    console.log("Running Neon DB schema sync...");

    const tables = [
      "MaterialCategory",
      "LabourCategory",
      "ServiceCategory",
      "EquipmentCategory",
      "ProfessionalCategory",
      "WorkArea",
    ];

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "projectId" TEXT;`);
        const hasUserId = await prisma.$queryRawUnsafe(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = '${table}' AND column_name = 'userId'
          ) as exists;
        `);

        if (hasUserId && hasUserId[0] && hasUserId[0].exists) {
          await prisma.$executeRawUnsafe(`
            UPDATE "${table}" t 
            SET "projectId" = (SELECT p.id FROM "Project" p WHERE p."userId" = t."userId" ORDER BY p."createdAt" ASC LIMIT 1)
            WHERE t."projectId" IS NULL;
          `);
          await prisma.$executeRawUnsafe(`DELETE FROM "${table}" WHERE "projectId" IS NULL;`);
          await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${table}_userId_key";`);
          await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${table}_userId_name_key";`);
          await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${table}_userId_groupName_name_key";`);
          await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "userId";`);
        }

        await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ALTER COLUMN "projectId" SET NOT NULL;`);
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            ALTER TABLE "${table}" ADD CONSTRAINT "${table}_projectId_fkey" 
            FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE;
          EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);
      } catch (tableErr) {
        console.warn(`Table migration notice for ${table}:`, tableErr.message);
      }
    }

    const colQueries = [
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "rate" DECIMAL(14,2);`,
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "numberOfDays" DECIMAL(8,2);`,
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "notes" TEXT;`,
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "serviceCategoryId" TEXT REFERENCES "ServiceCategory"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "equipmentCategoryId" TEXT REFERENCES "EquipmentCategory"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "professionalCategoryId" TEXT REFERENCES "ProfessionalCategory"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "materialCategoryId" TEXT REFERENCES "MaterialCategory"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "labourCategoryId" TEXT REFERENCES "LabourCategory"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "materialSubcategoryId" TEXT REFERENCES "MaterialSubcategory"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "labourSubcategoryId" TEXT REFERENCES "LabourSubcategory"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "numberOfWorkers" INTEGER;`,
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "labourCalcMethod" "LabourCalcMethod";`,
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;`,
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "floorId" TEXT REFERENCES "Floor"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "constructionStageId" TEXT REFERENCES "ConstructionStage"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "vendorId" TEXT REFERENCES "Vendor"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "workerId" TEXT REFERENCES "Worker"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "workArea" TEXT;`,
      `ALTER TABLE "BudgetCategory" ADD COLUMN IF NOT EXISTS "amount" DECIMAL(14,2);`,
      `ALTER TABLE "BudgetCategory" ADD COLUMN IF NOT EXISTS "notes" TEXT;`,
      `ALTER TABLE "BudgetCategory" ADD COLUMN IF NOT EXISTS "materialCategoryId" TEXT REFERENCES "MaterialCategory"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "BudgetCategory" ADD COLUMN IF NOT EXISTS "labourCategoryId" TEXT REFERENCES "LabourCategory"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "BudgetCategory" ADD COLUMN IF NOT EXISTS "serviceCategoryId" TEXT REFERENCES "ServiceCategory"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "BudgetCategory" ADD COLUMN IF NOT EXISTS "professionalCategoryId" TEXT REFERENCES "ProfessionalCategory"("id") ON DELETE SET NULL;`,
      `ALTER TABLE "Budget" ADD COLUMN IF NOT EXISTS "expenseType" "ExpenseType";`,
      `ALTER TABLE "Budget" ADD COLUMN IF NOT EXISTS "amount" DECIMAL(14,2);`,
      `ALTER TABLE "Budget" ADD COLUMN IF NOT EXISTS "notes" TEXT;`,
    ];

    for (const q of colQueries) {
      try {
        await prisma.$executeRawUnsafe(q);
      } catch (qErr) {
        console.warn("Col query notice:", qErr.message);
      }
    }

    console.log("Neon DB schema sync complete!");
    await prisma.$disconnect();
  } catch (err) {
    console.warn("Neon migration notice:", err.message);
  }
}

await runNeonMigration();

