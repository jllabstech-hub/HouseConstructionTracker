-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('MATERIAL', 'LABOUR', 'SERVICE', 'EQUIPMENT', 'PROFESSIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED');

-- CreateEnum
CREATE TYPE "StageStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'CREDIT', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkerType" AS ENUM ('MASON', 'CARPENTER', 'ELECTRICIAN', 'PLUMBER', 'PAINTER', 'TILE_WORKER', 'FABRICATOR', 'GENERAL_LABOUR', 'CONTRACTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "LabourCalcMethod" AS ENUM ('DAILY_WAGE', 'FIXED_CONTRACT', 'WORK_BASED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('TOTAL_EXPENDITURE', 'MATERIAL_EXPENDITURE', 'LABOUR_EXPENDITURE', 'CATEGORY_WISE', 'WORK_WISE', 'MONTHLY', 'BUDGET_VS_ACTUAL', 'CONSTRUCTION_STAGE', 'VENDOR', 'WORKER', 'PAYMENT_METHOD', 'FLOOR_WISE', 'CUSTOM_DATE_RANGE');

-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('PENDING', 'SKIPPED', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
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

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Floor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Floor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionStage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "status" "StageStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "percentageComplete" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATE,
    "expectedEndDate" DATE,
    "actualEndDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialSubcategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialSubcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabourCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabourCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabourSubcategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabourSubcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WorkerType" NOT NULL DEFAULT 'OTHER',
    "phone" TEXT,
    "specialization" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkArea" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkAreaMaterial" (
    "workAreaId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "WorkAreaMaterial_pkey" PRIMARY KEY ("workAreaId","categoryId")
);

-- CreateTable
CREATE TABLE "WorkAreaLabour" (
    "workAreaId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "WorkAreaLabour_pkey" PRIMARY KEY ("workAreaId","categoryId")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "expenseType" "ExpenseType" NOT NULL,
    "materialCategoryId" TEXT,
    "materialSubcategoryId" TEXT,
    "labourCategoryId" TEXT,
    "labourSubcategoryId" TEXT,
    "serviceCategoryId" TEXT,
    "equipmentCategoryId" TEXT,
    "professionalCategoryId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,4),
    "unit" TEXT,
    "rate" DECIMAL(14,2),
    "amount" DECIMAL(14,2) NOT NULL,
    "vendorId" TEXT,
    "workerId" TEXT,
    "constructionStageId" TEXT,
    "floorId" TEXT,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "invoiceNumber" TEXT,
    "notes" TEXT,
    "labourCalcMethod" "LabourCalcMethod",
    "numberOfWorkers" INTEGER,
    "numberOfDays" DECIMAL(8,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "expenseType" "ExpenseType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetCategory" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "expenseType" "ExpenseType" NOT NULL,
    "materialCategoryId" TEXT,
    "labourCategoryId" TEXT,
    "serviceCategoryId" TEXT,
    "professionalCategoryId" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "dateFrom" DATE,
    "dateTo" DATE,
    "filters" JSONB,
    "lastGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Floor_projectId_idx" ON "Floor"("projectId");

-- CreateIndex
CREATE INDEX "ConstructionStage_projectId_idx" ON "ConstructionStage"("projectId");

-- CreateIndex
CREATE INDEX "MaterialCategory_userId_idx" ON "MaterialCategory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialCategory_userId_groupName_name_key" ON "MaterialCategory"("userId", "groupName", "name");

-- CreateIndex
CREATE INDEX "MaterialSubcategory_categoryId_idx" ON "MaterialSubcategory"("categoryId");

-- CreateIndex
CREATE INDEX "LabourCategory_userId_idx" ON "LabourCategory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LabourCategory_userId_groupName_name_key" ON "LabourCategory"("userId", "groupName", "name");

-- CreateIndex
CREATE INDEX "LabourSubcategory_categoryId_idx" ON "LabourSubcategory"("categoryId");

-- CreateIndex
CREATE INDEX "ServiceCategory_userId_idx" ON "ServiceCategory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_userId_name_key" ON "ServiceCategory"("userId", "name");

-- CreateIndex
CREATE INDEX "EquipmentCategory_userId_idx" ON "EquipmentCategory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentCategory_userId_name_key" ON "EquipmentCategory"("userId", "name");

-- CreateIndex
CREATE INDEX "ProfessionalCategory_userId_idx" ON "ProfessionalCategory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalCategory_userId_name_key" ON "ProfessionalCategory"("userId", "name");

-- CreateIndex
CREATE INDEX "Vendor_userId_idx" ON "Vendor"("userId");

-- CreateIndex
CREATE INDEX "Worker_userId_idx" ON "Worker"("userId");

-- CreateIndex
CREATE INDEX "WorkArea_userId_idx" ON "WorkArea"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkArea_userId_name_key" ON "WorkArea"("userId", "name");

-- CreateIndex
CREATE INDEX "WorkAreaMaterial_categoryId_idx" ON "WorkAreaMaterial"("categoryId");

-- CreateIndex
CREATE INDEX "WorkAreaLabour_categoryId_idx" ON "WorkAreaLabour"("categoryId");

-- CreateIndex
CREATE INDEX "Expense_projectId_idx" ON "Expense"("projectId");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_expenseType_idx" ON "Expense"("expenseType");

-- CreateIndex
CREATE INDEX "Expense_materialCategoryId_idx" ON "Expense"("materialCategoryId");

-- CreateIndex
CREATE INDEX "Expense_labourCategoryId_idx" ON "Expense"("labourCategoryId");

-- CreateIndex
CREATE INDEX "Expense_constructionStageId_idx" ON "Expense"("constructionStageId");

-- CreateIndex
CREATE INDEX "Expense_vendorId_idx" ON "Expense"("vendorId");

-- CreateIndex
CREATE INDEX "Expense_workerId_idx" ON "Expense"("workerId");

-- CreateIndex
CREATE INDEX "Expense_floorId_idx" ON "Expense"("floorId");

-- CreateIndex
CREATE INDEX "Expense_projectId_date_idx" ON "Expense"("projectId", "date");

-- CreateIndex
CREATE INDEX "Expense_projectId_expenseType_idx" ON "Expense"("projectId", "expenseType");

-- CreateIndex
CREATE INDEX "Budget_projectId_idx" ON "Budget"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_projectId_expenseType_key" ON "Budget"("projectId", "expenseType");

-- CreateIndex
CREATE INDEX "BudgetCategory_projectId_idx" ON "BudgetCategory"("projectId");

-- CreateIndex
CREATE INDEX "BudgetCategory_materialCategoryId_idx" ON "BudgetCategory"("materialCategoryId");

-- CreateIndex
CREATE INDEX "BudgetCategory_labourCategoryId_idx" ON "BudgetCategory"("labourCategoryId");

-- CreateIndex
CREATE INDEX "Receipt_expenseId_idx" ON "Receipt"("expenseId");

-- CreateIndex
CREATE INDEX "Report_projectId_idx" ON "Report"("projectId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Floor" ADD CONSTRAINT "Floor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionStage" ADD CONSTRAINT "ConstructionStage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialCategory" ADD CONSTRAINT "MaterialCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialSubcategory" ADD CONSTRAINT "MaterialSubcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MaterialCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabourCategory" ADD CONSTRAINT "LabourCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabourSubcategory" ADD CONSTRAINT "LabourSubcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LabourCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentCategory" ADD CONSTRAINT "EquipmentCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalCategory" ADD CONSTRAINT "ProfessionalCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkArea" ADD CONSTRAINT "WorkArea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkAreaMaterial" ADD CONSTRAINT "WorkAreaMaterial_workAreaId_fkey" FOREIGN KEY ("workAreaId") REFERENCES "WorkArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkAreaMaterial" ADD CONSTRAINT "WorkAreaMaterial_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MaterialCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkAreaLabour" ADD CONSTRAINT "WorkAreaLabour_workAreaId_fkey" FOREIGN KEY ("workAreaId") REFERENCES "WorkArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkAreaLabour" ADD CONSTRAINT "WorkAreaLabour_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LabourCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_materialCategoryId_fkey" FOREIGN KEY ("materialCategoryId") REFERENCES "MaterialCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_materialSubcategoryId_fkey" FOREIGN KEY ("materialSubcategoryId") REFERENCES "MaterialSubcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_labourCategoryId_fkey" FOREIGN KEY ("labourCategoryId") REFERENCES "LabourCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_labourSubcategoryId_fkey" FOREIGN KEY ("labourSubcategoryId") REFERENCES "LabourSubcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_equipmentCategoryId_fkey" FOREIGN KEY ("equipmentCategoryId") REFERENCES "EquipmentCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_professionalCategoryId_fkey" FOREIGN KEY ("professionalCategoryId") REFERENCES "ProfessionalCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_constructionStageId_fkey" FOREIGN KEY ("constructionStageId") REFERENCES "ConstructionStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_materialCategoryId_fkey" FOREIGN KEY ("materialCategoryId") REFERENCES "MaterialCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_labourCategoryId_fkey" FOREIGN KEY ("labourCategoryId") REFERENCES "LabourCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_professionalCategoryId_fkey" FOREIGN KEY ("professionalCategoryId") REFERENCES "ProfessionalCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
