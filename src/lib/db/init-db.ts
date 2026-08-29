import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { seedProjectMasters, seedProjectStructure } from "@/lib/catalog/seed-masters";

export async function ensureDatabaseSchema() {
  try {
    console.log("Ensuring database schema, enums and tables exist via idempotent DDL...");

    // 1. Create Enums if not exist
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('ADMIN', 'VIEWER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "StageStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "ExpenseType" AS ENUM ('MATERIAL', 'LABOUR', 'SERVICE', 'EQUIPMENT', 'PROFESSIONAL', 'OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'NEFT_RTGS', 'CHEQUE', 'CREDIT_CARD', 'DEBIT_CARD', 'OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "WorkerType" AS ENUM ('MASON', 'BAR_BENDER', 'CARPENTER', 'PAINTER', 'PLUMBER', 'ELECTRICIAN', 'TILE_LAYER', 'CENTRING_WORKER', 'FABRICATOR', 'GENERAL_LABOUR', 'CONTRACTOR', 'OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "LabourCalcMethod" AS ENUM ('DAILY_WAGE', 'FIXED_CONTRACT', 'WORK_BASED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "ReportType" AS ENUM ('TOTAL_EXPENDITURE', 'MATERIAL_EXPENDITURE', 'LABOUR_EXPENDITURE', 'CATEGORY_WISE', 'WORK_WISE', 'MONTHLY', 'BUDGET_VS_ACTUAL', 'CONSTRUCTION_STAGE', 'VENDOR', 'WORKER', 'PAYMENT_METHOD', 'FLOOR_WISE', 'CUSTOM_DATE_RANGE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "OcrStatus" AS ENUM ('PENDING', 'SKIPPED', 'COMPLETED', 'FAILED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "DocumentCategory" AS ENUM ('FLOOR_PLAN', 'STRUCTURAL', 'ELEVATION', 'MEP', 'APPROVAL', 'SITE_PHOTO', 'CONTRACT', 'OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // 2. Create Tables
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT,
        "email" TEXT NOT NULL UNIQUE,
        "emailVerified" TIMESTAMP(3),
        "image" TEXT,
        "passwordHash" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Account" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "type" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        "refresh_token" TEXT,
        "access_token" TEXT,
        "expires_at" INTEGER,
        "token_type" TEXT,
        "scope" TEXT,
        "id_token" TEXT,
        "session_state" TEXT,
        UNIQUE ("provider", "providerAccountId")
      );

      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "sessionToken" TEXT NOT NULL UNIQUE,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "expires" TIMESTAMP(3) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "VerificationToken" (
        "identifier" TEXT NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "expires" TIMESTAMP(3) NOT NULL,
        UNIQUE ("identifier", "token")
      );

      CREATE TABLE IF NOT EXISTS "Project" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "location" TEXT,
        "plotArea" DECIMAL(14,2),
        "builtUpArea" DECIMAL(14,2),
        "numberOfFloors" INTEGER,
        "startDate" DATE,
        "expectedCompletionDate" DATE,
        "actualCompletionDate" DATE,
        "totalBudget" DECIMAL(14,2) NOT NULL DEFAULT 0,
        "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Floor" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("projectId", "name")
      );

      CREATE TABLE IF NOT EXISTS "ConstructionStage" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "status" "StageStatus" NOT NULL DEFAULT 'NOT_STARTED',
        "percentageComplete" INTEGER NOT NULL DEFAULT 0,
        "startDate" DATE,
        "completionDate" DATE,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("projectId", "name")
      );

      CREATE TABLE IF NOT EXISTS "MaterialCategory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "groupName" TEXT NOT NULL,
        "unit" TEXT,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("projectId", "groupName", "name")
      );

      CREATE TABLE IF NOT EXISTS "MaterialSubcategory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "categoryId" TEXT NOT NULL REFERENCES "MaterialCategory"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("categoryId", "name")
      );

      CREATE TABLE IF NOT EXISTS "LabourCategory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "groupName" TEXT NOT NULL,
        "defaultDailyRate" DECIMAL(14,2),
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("projectId", "groupName", "name")
      );

      CREATE TABLE IF NOT EXISTS "LabourSubcategory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "categoryId" TEXT NOT NULL REFERENCES "LabourCategory"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("categoryId", "name")
      );

      CREATE TABLE IF NOT EXISTS "ServiceCategory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("projectId", "name")
      );

      CREATE TABLE IF NOT EXISTS "EquipmentCategory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("projectId", "name")
      );

      CREATE TABLE IF NOT EXISTS "ProfessionalCategory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("projectId", "name")
      );

      CREATE TABLE IF NOT EXISTS "Vendor" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "phone" TEXT,
        "gstNumber" TEXT,
        "address" TEXT,
        "bankDetails" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Worker" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "type" "WorkerType" NOT NULL DEFAULT 'GENERAL_LABOUR',
        "phone" TEXT,
        "dailyWageRate" DECIMAL(14,2),
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "WorkArea" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("projectId", "name")
      );

      CREATE TABLE IF NOT EXISTS "WorkAreaMaterial" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "workAreaId" TEXT NOT NULL REFERENCES "WorkArea"("id") ON DELETE CASCADE,
        "categoryId" TEXT NOT NULL REFERENCES "MaterialCategory"("id") ON DELETE CASCADE,
        UNIQUE ("workAreaId", "categoryId")
      );

      CREATE TABLE IF NOT EXISTS "WorkAreaLabour" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "workAreaId" TEXT NOT NULL REFERENCES "WorkArea"("id") ON DELETE CASCADE,
        "categoryId" TEXT NOT NULL REFERENCES "LabourCategory"("id") ON DELETE CASCADE,
        UNIQUE ("workAreaId", "categoryId")
      );

      CREATE TABLE IF NOT EXISTS "Expense" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
        "date" DATE NOT NULL,
        "expenseType" "ExpenseType" NOT NULL,
        "amount" DECIMAL(14,2) NOT NULL,
        "quantity" DECIMAL(14,4),
        "unit" TEXT,
        "rate" DECIMAL(14,2),
        "unitRate" DECIMAL(14,2),
        "taxAmount" DECIMAL(14,2),
        "totalAmount" DECIMAL(14,2),
        "numberOfWorkers" INTEGER,
        "numberOfDays" DECIMAL(8,2),
        "daysWorked" DECIMAL(6,2),
        "dailyWageRate" DECIMAL(14,2),
        "labourCalcMethod" "LabourCalcMethod",
        "description" TEXT NOT NULL,
        "invoiceNumber" TEXT,
        "notes" TEXT,
        "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
        "paymentRef" TEXT,
        "materialCategoryId" TEXT REFERENCES "MaterialCategory"("id") ON DELETE SET NULL,
        "materialSubcategoryId" TEXT REFERENCES "MaterialSubcategory"("id") ON DELETE SET NULL,
        "labourCategoryId" TEXT REFERENCES "LabourCategory"("id") ON DELETE SET NULL,
        "labourSubcategoryId" TEXT REFERENCES "LabourSubcategory"("id") ON DELETE SET NULL,
        "serviceCategoryId" TEXT REFERENCES "ServiceCategory"("id") ON DELETE SET NULL,
        "equipmentCategoryId" TEXT REFERENCES "EquipmentCategory"("id") ON DELETE SET NULL,
        "professionalCategoryId" TEXT REFERENCES "ProfessionalCategory"("id") ON DELETE SET NULL,
        "vendorId" TEXT REFERENCES "Vendor"("id") ON DELETE SET NULL,
        "workerId" TEXT REFERENCES "Worker"("id") ON DELETE SET NULL,
        "constructionStageId" TEXT REFERENCES "ConstructionStage"("id") ON DELETE SET NULL,
        "floorId" TEXT REFERENCES "Floor"("id") ON DELETE SET NULL,
        "workArea" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Budget" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
        "expenseType" "ExpenseType" NOT NULL,
        "amount" DECIMAL(14,2) NOT NULL,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("projectId", "expenseType")
      );

      CREATE TABLE IF NOT EXISTS "BudgetCategory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
        "expenseType" "ExpenseType" NOT NULL,
        "amount" DECIMAL(14,2) NOT NULL,
        "notes" TEXT,
        "materialCategoryId" TEXT REFERENCES "MaterialCategory"("id") ON DELETE SET NULL,
        "labourCategoryId" TEXT REFERENCES "LabourCategory"("id") ON DELETE SET NULL,
        "serviceCategoryId" TEXT REFERENCES "ServiceCategory"("id") ON DELETE SET NULL,
        "professionalCategoryId" TEXT REFERENCES "ProfessionalCategory"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Receipt" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "expenseId" TEXT NOT NULL REFERENCES "Expense"("id") ON DELETE CASCADE,
        "fileName" TEXT NOT NULL,
        "storedName" TEXT NOT NULL,
        "mimeType" TEXT NOT NULL,
        "sizeBytes" INTEGER NOT NULL,
        "storagePath" TEXT NOT NULL,
        "ocrStatus" "OcrStatus" NOT NULL DEFAULT 'SKIPPED',
        "ocrVendor" TEXT,
        "ocrDate" TIMESTAMP(3),
        "ocrInvoiceNumber" TEXT,
        "ocrMaterial" TEXT,
        "ocrQuantity" DECIMAL(14,4),
        "ocrRate" DECIMAL(14,2),
        "ocrGst" DECIMAL(14,2),
        "ocrTotal" DECIMAL(14,2),
        "ocrRawJson" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Report" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
        "type" "ReportType" NOT NULL,
        "title" TEXT NOT NULL,
        "dateFrom" DATE,
        "dateTo" DATE,
        "filters" JSONB,
        "lastGeneratedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "ProjectDocument" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
        "category" "DocumentCategory" NOT NULL DEFAULT 'FLOOR_PLAN',
        "title" TEXT NOT NULL,
        "description" TEXT,
        "floorId" TEXT REFERENCES "Floor"("id") ON DELETE SET NULL,
        "constructionStageId" TEXT REFERENCES "ConstructionStage"("id") ON DELETE SET NULL,
        "fileName" TEXT NOT NULL,
        "storedName" TEXT NOT NULL,
        "mimeType" TEXT NOT NULL,
        "sizeBytes" INTEGER NOT NULL,
        "storagePath" TEXT NOT NULL,
        "version" TEXT,
        "isPinned" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2b. Migrate existing category tables from userId to projectId if needed
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='MaterialCategory' AND column_name='userId') THEN
          ALTER TABLE "MaterialCategory" ADD COLUMN IF NOT EXISTS "projectId" TEXT REFERENCES "Project"("id") ON DELETE CASCADE;
          
          UPDATE "MaterialCategory" mc
          SET "projectId" = (SELECT p.id FROM "Project" p WHERE p."userId" = mc."userId" ORDER BY p."createdAt" ASC LIMIT 1)
          WHERE mc."projectId" IS NULL;

          DELETE FROM "MaterialCategory" WHERE "projectId" IS NULL;

          DELETE FROM "MaterialCategory" a USING "MaterialCategory" b
          WHERE a.id > b.id AND a."projectId" = b."projectId" AND a."groupName" = b."groupName" AND a.name = b.name;

          ALTER TABLE "MaterialCategory" ALTER COLUMN "projectId" SET NOT NULL;
          ALTER TABLE "MaterialCategory" DROP CONSTRAINT IF EXISTS "MaterialCategory_userId_groupName_name_key";
          ALTER TABLE "MaterialCategory" DROP COLUMN IF EXISTS "userId";
          ALTER TABLE "MaterialCategory" DROP CONSTRAINT IF EXISTS "MaterialCategory_projectId_groupName_name_key";
          ALTER TABLE "MaterialCategory" ADD CONSTRAINT "MaterialCategory_projectId_groupName_name_key" UNIQUE ("projectId", "groupName", "name");
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='LabourCategory' AND column_name='userId') THEN
          ALTER TABLE "LabourCategory" ADD COLUMN IF NOT EXISTS "projectId" TEXT REFERENCES "Project"("id") ON DELETE CASCADE;
          
          UPDATE "LabourCategory" lc
          SET "projectId" = (SELECT p.id FROM "Project" p WHERE p."userId" = lc."userId" ORDER BY p."createdAt" ASC LIMIT 1)
          WHERE lc."projectId" IS NULL;

          DELETE FROM "LabourCategory" WHERE "projectId" IS NULL;

          DELETE FROM "LabourCategory" a USING "LabourCategory" b
          WHERE a.id > b.id AND a."projectId" = b."projectId" AND a."groupName" = b."groupName" AND a.name = b.name;

          ALTER TABLE "LabourCategory" ALTER COLUMN "projectId" SET NOT NULL;
          ALTER TABLE "LabourCategory" DROP CONSTRAINT IF EXISTS "LabourCategory_userId_groupName_name_key";
          ALTER TABLE "LabourCategory" DROP COLUMN IF EXISTS "userId";
          ALTER TABLE "LabourCategory" DROP CONSTRAINT IF EXISTS "LabourCategory_projectId_groupName_name_key";
          ALTER TABLE "LabourCategory" ADD CONSTRAINT "LabourCategory_projectId_groupName_name_key" UNIQUE ("projectId", "groupName", "name");
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ServiceCategory' AND column_name='userId') THEN
          ALTER TABLE "ServiceCategory" ADD COLUMN IF NOT EXISTS "projectId" TEXT REFERENCES "Project"("id") ON DELETE CASCADE;
          
          UPDATE "ServiceCategory" sc
          SET "projectId" = (SELECT p.id FROM "Project" p WHERE p."userId" = sc."userId" ORDER BY p."createdAt" ASC LIMIT 1)
          WHERE sc."projectId" IS NULL;

          DELETE FROM "ServiceCategory" WHERE "projectId" IS NULL;

          DELETE FROM "ServiceCategory" a USING "ServiceCategory" b
          WHERE a.id > b.id AND a."projectId" = b."projectId" AND a.name = b.name;

          ALTER TABLE "ServiceCategory" ALTER COLUMN "projectId" SET NOT NULL;
          ALTER TABLE "ServiceCategory" DROP CONSTRAINT IF EXISTS "ServiceCategory_userId_name_key";
          ALTER TABLE "ServiceCategory" DROP COLUMN IF EXISTS "userId";
          ALTER TABLE "ServiceCategory" DROP CONSTRAINT IF EXISTS "ServiceCategory_projectId_name_key";
          ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_projectId_name_key" UNIQUE ("projectId", "name");
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='EquipmentCategory' AND column_name='userId') THEN
          ALTER TABLE "EquipmentCategory" ADD COLUMN IF NOT EXISTS "projectId" TEXT REFERENCES "Project"("id") ON DELETE CASCADE;
          
          UPDATE "EquipmentCategory" ec
          SET "projectId" = (SELECT p.id FROM "Project" p WHERE p."userId" = ec."userId" ORDER BY p."createdAt" ASC LIMIT 1)
          WHERE ec."projectId" IS NULL;

          DELETE FROM "EquipmentCategory" WHERE "projectId" IS NULL;

          DELETE FROM "EquipmentCategory" a USING "EquipmentCategory" b
          WHERE a.id > b.id AND a."projectId" = b."projectId" AND a.name = b.name;

          ALTER TABLE "EquipmentCategory" ALTER COLUMN "projectId" SET NOT NULL;
          ALTER TABLE "EquipmentCategory" DROP CONSTRAINT IF EXISTS "EquipmentCategory_userId_name_key";
          ALTER TABLE "EquipmentCategory" DROP COLUMN IF EXISTS "userId";
          ALTER TABLE "EquipmentCategory" DROP CONSTRAINT IF EXISTS "EquipmentCategory_projectId_name_key";
          ALTER TABLE "EquipmentCategory" ADD CONSTRAINT "EquipmentCategory_projectId_name_key" UNIQUE ("projectId", "name");
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ProfessionalCategory' AND column_name='userId') THEN
          ALTER TABLE "ProfessionalCategory" ADD COLUMN IF NOT EXISTS "projectId" TEXT REFERENCES "Project"("id") ON DELETE CASCADE;
          
          UPDATE "ProfessionalCategory" pc
          SET "projectId" = (SELECT p.id FROM "Project" p WHERE p."userId" = pc."userId" ORDER BY p."createdAt" ASC LIMIT 1)
          WHERE pc."projectId" IS NULL;

          DELETE FROM "ProfessionalCategory" WHERE "projectId" IS NULL;

          DELETE FROM "ProfessionalCategory" a USING "ProfessionalCategory" b
          WHERE a.id > b.id AND a."projectId" = b."projectId" AND a.name = b.name;

          ALTER TABLE "ProfessionalCategory" ALTER COLUMN "projectId" SET NOT NULL;
          ALTER TABLE "ProfessionalCategory" DROP CONSTRAINT IF EXISTS "ProfessionalCategory_userId_name_key";
          ALTER TABLE "ProfessionalCategory" DROP COLUMN IF EXISTS "userId";
          ALTER TABLE "ProfessionalCategory" DROP CONSTRAINT IF EXISTS "ProfessionalCategory_projectId_name_key";
          ALTER TABLE "ProfessionalCategory" ADD CONSTRAINT "ProfessionalCategory_projectId_name_key" UNIQUE ("projectId", "name");
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='WorkArea' AND column_name='userId') THEN
          ALTER TABLE "WorkArea" ADD COLUMN IF NOT EXISTS "projectId" TEXT REFERENCES "Project"("id") ON DELETE CASCADE;
          
          UPDATE "WorkArea" wa
          SET "projectId" = (SELECT p.id FROM "Project" p WHERE p."userId" = wa."userId" ORDER BY p."createdAt" ASC LIMIT 1)
          WHERE wa."projectId" IS NULL;

          DELETE FROM "WorkArea" WHERE "projectId" IS NULL;

          DELETE FROM "WorkArea" a USING "WorkArea" b
          WHERE a.id > b.id AND a."projectId" = b."projectId" AND a.name = b.name;

          ALTER TABLE "WorkArea" ALTER COLUMN "projectId" SET NOT NULL;
          ALTER TABLE "WorkArea" DROP CONSTRAINT IF EXISTS "WorkArea_userId_name_key";
          ALTER TABLE "WorkArea" DROP COLUMN IF EXISTS "userId";
          ALTER TABLE "WorkArea" DROP CONSTRAINT IF EXISTS "WorkArea_projectId_name_key";
          ALTER TABLE "WorkArea" ADD CONSTRAINT "WorkArea_projectId_name_key" UNIQUE ("projectId", "name");
        END IF;

        -- Expense column migrations
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='Expense') THEN
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "rate" DECIMAL(14,2);
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "numberOfDays" DECIMAL(8,2);
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "notes" TEXT;
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "serviceCategoryId" TEXT REFERENCES "ServiceCategory"("id") ON DELETE SET NULL;
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "equipmentCategoryId" TEXT REFERENCES "EquipmentCategory"("id") ON DELETE SET NULL;
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "professionalCategoryId" TEXT REFERENCES "ProfessionalCategory"("id") ON DELETE SET NULL;
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "materialCategoryId" TEXT REFERENCES "MaterialCategory"("id") ON DELETE SET NULL;
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "labourCategoryId" TEXT REFERENCES "LabourCategory"("id") ON DELETE SET NULL;
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "materialSubcategoryId" TEXT REFERENCES "MaterialSubcategory"("id") ON DELETE SET NULL;
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "labourSubcategoryId" TEXT REFERENCES "LabourSubcategory"("id") ON DELETE SET NULL;
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "numberOfWorkers" INTEGER;
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "labourCalcMethod" "LabourCalcMethod";
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "floorId" TEXT REFERENCES "Floor"("id") ON DELETE SET NULL;
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "constructionStageId" TEXT REFERENCES "ConstructionStage"("id") ON DELETE SET NULL;
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "vendorId" TEXT REFERENCES "Vendor"("id") ON DELETE SET NULL;
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "workerId" TEXT REFERENCES "Worker"("id") ON DELETE SET NULL;
          ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "workArea" TEXT;

          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Expense' AND column_name='unitRate') THEN
            UPDATE "Expense" SET "rate" = "unitRate" WHERE "rate" IS NULL AND "unitRate" IS NOT NULL;
          END IF;
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Expense' AND column_name='daysWorked') THEN
            UPDATE "Expense" SET "numberOfDays" = "daysWorked" WHERE "numberOfDays" IS NULL AND "daysWorked" IS NOT NULL;
          END IF;
        END IF;

        -- BudgetCategory column migrations
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='BudgetCategory') THEN
          ALTER TABLE "BudgetCategory" ADD COLUMN IF NOT EXISTS "amount" DECIMAL(14,2);
          ALTER TABLE "BudgetCategory" ADD COLUMN IF NOT EXISTS "notes" TEXT;
          ALTER TABLE "BudgetCategory" ADD COLUMN IF NOT EXISTS "materialCategoryId" TEXT REFERENCES "MaterialCategory"("id") ON DELETE SET NULL;
          ALTER TABLE "BudgetCategory" ADD COLUMN IF NOT EXISTS "labourCategoryId" TEXT REFERENCES "LabourCategory"("id") ON DELETE SET NULL;
          ALTER TABLE "BudgetCategory" ADD COLUMN IF NOT EXISTS "serviceCategoryId" TEXT REFERENCES "ServiceCategory"("id") ON DELETE SET NULL;
          ALTER TABLE "BudgetCategory" ADD COLUMN IF NOT EXISTS "professionalCategoryId" TEXT REFERENCES "ProfessionalCategory"("id") ON DELETE SET NULL;

          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='BudgetCategory' AND column_name='allocatedAmount') THEN
            UPDATE "BudgetCategory" SET "amount" = "allocatedAmount" WHERE "amount" IS NULL AND "allocatedAmount" IS NOT NULL;
          END IF;
        END IF;

        -- Budget column migrations
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='Budget') THEN
          ALTER TABLE "Budget" ADD COLUMN IF NOT EXISTS "expenseType" "ExpenseType";
          ALTER TABLE "Budget" ADD COLUMN IF NOT EXISTS "amount" DECIMAL(14,2);
          ALTER TABLE "Budget" ADD COLUMN IF NOT EXISTS "notes" TEXT;
        END IF;
      END $$;
    `);

    // 3. Ensure default Admin user exists
    const passwordHash = await bcrypt.hash("test123", 10);
    const adminUser = await prisma.user.upsert({
      where: { email: "admin" },
      update: { name: "Admin", passwordHash },
      create: { email: "admin", name: "Admin", passwordHash },
    });

    // 4. Ensure default project exists with 20 stages & masters
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

    // 5. Seed project masters (materials & labours)
    await seedProjectMasters(project.id);

    console.log("Database schema successfully verified and created via DDL.");
    return { created: true, message: "Tables created successfully", userId: adminUser.id, projectId: project.id };
  } catch (error) {
    console.error("ensureDatabaseSchema error:", error);
    throw error;
  }
}
