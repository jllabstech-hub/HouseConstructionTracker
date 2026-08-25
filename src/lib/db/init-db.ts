import { prisma } from "@/lib/prisma";

export async function ensureDatabaseSchema() {
  try {
    // Check if core table 'User' exists
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      );
    `;

    const userTableExists = result?.[0]?.exists;
    if (userTableExists) {
      return { created: false, message: "Tables already exist" };
    }

    console.log("Database tables missing. Executing SQL DDL initialization...");

    // Create Enums if not exist
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

      DO $$ BEGIN
        CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'SITE_VISIT', 'ESTIMATE_SENT', 'NEGOTIATION', 'WON', 'LOST');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // Create Tables
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
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "groupName" TEXT NOT NULL,
        "unit" TEXT,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("userId", "groupName", "name")
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
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "groupName" TEXT NOT NULL,
        "defaultDailyRate" DECIMAL(14,2),
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("userId", "groupName", "name")
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
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("userId", "name")
      );

      CREATE TABLE IF NOT EXISTS "EquipmentCategory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("userId", "name")
      );

      CREATE TABLE IF NOT EXISTS "ProfessionalCategory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("userId", "name")
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
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "name" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("userId", "name")
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
        "quantity" DECIMAL(14,3),
        "unit" TEXT,
        "unitRate" DECIMAL(14,2),
        "taxAmount" DECIMAL(14,2),
        "totalAmount" DECIMAL(14,2) NOT NULL,
        "numberOfWorkers" INTEGER,
        "daysWorked" DECIMAL(6,2),
        "dailyWageRate" DECIMAL(14,2),
        "labourCalcMethod" "LabourCalcMethod",
        "description" TEXT,
        "invoiceNumber" TEXT,
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
        "totalBudget" DECIMAL(14,2) NOT NULL,
        "materialBudget" DECIMAL(14,2) NOT NULL DEFAULT 0,
        "labourBudget" DECIMAL(14,2) NOT NULL DEFAULT 0,
        "contingencyBudget" DECIMAL(14,2) NOT NULL DEFAULT 0,
        "otherBudget" DECIMAL(14,2) NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("projectId")
      );

      CREATE TABLE IF NOT EXISTS "BudgetCategory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "projectId" TEXT NOT NULL REFERENCES "Project"("id") ON DELETE CASCADE,
        "expenseType" "ExpenseType" NOT NULL,
        "allocatedAmount" DECIMAL(14,2) NOT NULL,
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
        "fileUrl" TEXT NOT NULL,
        "fileName" TEXT NOT NULL,
        "fileType" TEXT NOT NULL,
        "fileSize" INTEGER NOT NULL,
        "ocrStatus" "OcrStatus" NOT NULL DEFAULT 'PENDING',
        "ocrVendor" TEXT,
        "ocrInvoiceNumber" TEXT,
        "ocrDate" DATE,
        "ocrItemName" TEXT,
        "ocrQuantity" DECIMAL(14,3),
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

      CREATE TABLE IF NOT EXISTS "Lead" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "email" TEXT,
        "location" TEXT NOT NULL,
        "plotArea" TEXT,
        "builtUpArea" TEXT,
        "floors" TEXT,
        "budget" TEXT,
        "constructionStage" TEXT,
        "requirements" TEXT,
        "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Database schema successfully verified and created via DDL.");
    return { created: true, message: "Tables created successfully" };
  } catch (error) {
    console.error("ensureDatabaseSchema error:", error);
    throw error;
  }
}
