import { z } from "zod";
import { parseMoneyInput, toDecimal } from "@/lib/money";

const optionalText = z.string().trim().optional().or(z.literal(""));
const requiredDate = z.string().min(1, "Date is required");

function moneyField(label: string, { allowEmpty = false, allowZero = false } = {}) {
  return z
    .string()
    .optional()
    .transform((value) => (value ?? "").trim())
    .superRefine((value, ctx) => {
      if (!value) {
        if (allowEmpty) return;
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} is required` });
        return;
      }
      const parsed = parseMoneyInput(value);
      if (!parsed) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be a valid amount` });
        return;
      }
      if (parsed.isNegative()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} cannot be negative` });
      }
      if (!allowZero && parsed.isZero() && label === "Amount") {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Amount must be positive" });
      }
    });
}

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "User ID or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const projectSchema = z.object({
  name: z.string().trim().min(2, "Project name is required"),
  location: optionalText,
  plotArea: moneyField("Plot area", { allowEmpty: true, allowZero: true }),
  builtUpArea: moneyField("Built-up area", { allowEmpty: true, allowZero: true }),
  numberOfFloors: z.string().optional(),
  startDate: optionalText,
  expectedCompletionDate: optionalText,
  actualCompletionDate: optionalText,
  totalBudget: moneyField("Total budget", { allowEmpty: true, allowZero: true }),
  status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED"]),
  notes: optionalText,
});

export const floorSchema = z.object({
  name: z.string().trim().min(1, "Floor name is required"),
  notes: optionalText,
});

export const stageSchema = z.object({
  name: z.string().trim().min(1, "Stage name is required"),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"]),
  percentageComplete: z.coerce.number().min(0).max(100),
  startDate: optionalText,
  expectedEndDate: optionalText,
  actualEndDate: optionalText,
  notes: optionalText,
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  groupName: optionalText,
});

export const vendorSchema = z.object({
  name: z.string().trim().min(1, "Vendor name is required"),
  company: optionalText,
  phone: optionalText,
  address: optionalText,
  notes: optionalText,
});

export const workerSchema = z.object({
  name: z.string().trim().min(1, "Worker name is required"),
  type: z.enum([
    "MASON",
    "CARPENTER",
    "ELECTRICIAN",
    "PLUMBER",
    "PAINTER",
    "TILE_WORKER",
    "FABRICATOR",
    "GENERAL_LABOUR",
    "CONTRACTOR",
    "OTHER",
  ]),
  phone: optionalText,
  specialization: optionalText,
  notes: optionalText,
});

export const documentCategoryEnum = z.enum([
  "FLOOR_PLAN",
  "STRUCTURAL",
  "ELEVATION",
  "MEP",
  "APPROVAL",
  "SITE_PHOTO",
  "CONTRACT",
  "OTHER",
]);

export const documentSchema = z.object({
  title: z.string().trim().min(1, "Document title is required"),
  category: documentCategoryEnum,
  description: optionalText,
  version: optionalText,
  floorId: optionalText,
  constructionStageId: optionalText,
});

export const budgetTypeSchema = z.object({
  expenseType: z.enum(["MATERIAL", "LABOUR", "SERVICE", "EQUIPMENT", "PROFESSIONAL", "OTHER"]),
  amount: moneyField("Budget amount"),
});

export const budgetCategorySchema = z.object({
  expenseType: z.enum(["MATERIAL", "LABOUR", "SERVICE", "PROFESSIONAL"]),
  categoryId: z.string().min(1, "Category is required"),
  amount: moneyField("Budget amount"),
});

const expenseBase = z.object({
  projectId: z.string().min(1, "Project is required"),
  date: requiredDate,
  description: z.string().trim().min(1, "Description is required"),
  quantity: moneyField("Quantity", { allowEmpty: true, allowZero: true }),
  unit: optionalText,
  rate: moneyField("Rate", { allowEmpty: true, allowZero: true }),
  amount: moneyField("Amount", { allowEmpty: true }),
  vendorId: optionalText,
  workerId: optionalText,
  constructionStageId: optionalText,
  floorId: optionalText,
  paymentMethod: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "CARD", "CREDIT", "OTHER"]),
  invoiceNumber: optionalText,
  notes: optionalText,
  materialCategoryId: optionalText,
  materialSubcategoryId: optionalText,
  labourCategoryId: optionalText,
  labourSubcategoryId: optionalText,
  serviceCategoryId: optionalText,
  equipmentCategoryId: optionalText,
  professionalCategoryId: optionalText,
  labourCalcMethod: z.enum(["DAILY_WAGE", "FIXED_CONTRACT", "WORK_BASED"]).optional(),
  numberOfWorkers: moneyField("Number of workers", { allowEmpty: true, allowZero: true }),
  numberOfDays: moneyField("Number of days", { allowEmpty: true, allowZero: true }),
});

export const expenseSchema = expenseBase
  .extend({
    expenseType: z.enum(["MATERIAL", "LABOUR", "SERVICE", "EQUIPMENT", "PROFESSIONAL", "OTHER"]),
  })
  .superRefine((value, ctx) => {
    if (value.expenseType === "MATERIAL" && !value.materialCategoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["materialCategoryId"],
        message: "Material category is required for material expenses",
      });
    }
    if (value.expenseType === "LABOUR" && !value.labourCategoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["labourCategoryId"],
        message: "Labour category is required for labour expenses",
      });
    }
    if (value.expenseType === "SERVICE" && !value.serviceCategoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["serviceCategoryId"],
        message: "Service category is required for service expenses",
      });
    }
    if (value.expenseType === "EQUIPMENT" && !value.equipmentCategoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["equipmentCategoryId"],
        message: "Equipment category is required for equipment expenses",
      });
    }
    if (value.expenseType === "PROFESSIONAL" && !value.professionalCategoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["professionalCategoryId"],
        message: "Professional category is required for professional expenses",
      });
    }

    const quantity = parseMoneyInput(value.quantity ?? "");
    const rate = parseMoneyInput(value.rate ?? "");
    const amount = parseMoneyInput(value.amount ?? "");

    if (value.expenseType === "LABOUR" && value.labourCalcMethod === "DAILY_WAGE") {
      const workers = parseMoneyInput(value.numberOfWorkers ?? "");
      const days = parseMoneyInput(value.numberOfDays ?? "");
      if (!workers || workers.lessThanOrEqualTo(0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["numberOfWorkers"],
          message: "Number of workers is required for daily wage labour",
        });
      }
      if (!days || days.lessThanOrEqualTo(0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["numberOfDays"],
          message: "Number of days is required for daily wage labour",
        });
      }
      if (!rate || rate.lessThanOrEqualTo(0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rate"],
          message: "Daily rate is required for daily wage labour",
        });
      }
    } else if (value.expenseType === "MATERIAL" && quantity && rate) {
      if (quantity.isNegative()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["quantity"],
          message: "Quantity cannot be negative",
        });
      }
      if (rate.isNegative()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rate"],
          message: "Rate cannot be negative",
        });
      }
    } else if (!amount || !toDecimal(amount).greaterThan(0)) {
      if (value.expenseType === "LABOUR" && value.labourCalcMethod === "DAILY_WAGE") return;
      if (value.expenseType === "MATERIAL" && quantity && rate) return;
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount"],
        message: "Amount must be positive",
      });
    }
  });

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
export type ProjectFormValues = z.infer<typeof projectSchema>;
