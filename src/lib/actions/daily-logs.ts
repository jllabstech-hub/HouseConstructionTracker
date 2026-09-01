"use server";

import { revalidatePath } from "next/cache";
import { Prisma, PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireProject, requireUser } from "@/lib/auth-guard";
import { invalidateProjectCache } from "@/lib/cache-utils";

export type DailySiteLogEntry = {
  id: string;
  date: string;
  stageId?: string | null;
  stageName?: string | null;
  floorId?: string | null;
  floorName?: string | null;
  mestriCount: number;
  mestriRate: number;
  mestriTotal: number;
  helperCount: number;
  helperRate: number;
  helperTotal: number;
  otherWorkersCount: number;
  otherWorkersRate: number;
  otherWorkersTotal: number;
  totalWorkers: number;
  totalLabourCost: number;
  cementBags: number;
  cementBrand: string;
  cementRate: number;
  totalCementCost: number;
  totalDayCost: number;
  workDescription: string;
  notes: string;
  paymentMethod: string;
  linkedCementExpenseId?: string | null;
  createdAt: string;
};

export type DailySiteLogsSummary = {
  totalMestriDays: number;
  totalHelperDays: number;
  totalOtherWorkerDays: number;
  totalWorkerDays: number;
  totalCementBags: number;
  totalLabourSpent: number;
  totalCementSpent: number;
  grandTotal: number;
  daysLoggedCount: number;
};

export async function getDailySiteLogs(projectId: string): Promise<{
  logs: DailySiteLogEntry[];
  summary: DailySiteLogsSummary;
}> {
  const user = await requireUser();
  await requireProject(projectId, user.id);

  // Find all expenses that have DAILY_LOG marker in notes or daily wage entries
  const expenses = await prisma.expense.findMany({
    where: {
      projectId,
      OR: [
        { notes: { contains: `"type":"DAILY_LOG"` } },
        { description: { startsWith: "Daily Site Log" } },
        { description: { startsWith: "Daily Labour" } },
      ],
    },
    include: {
      constructionStage: true,
      floor: true,
    },
    orderBy: { date: "desc" },
  });

  // Find any linked cement expenses
  const cementExpenses = await prisma.expense.findMany({
    where: {
      projectId,
      notes: { contains: `"type":"DAILY_LOG_CEMENT"` },
    },
  });

  const cementMap = new Map<string, typeof cementExpenses[0]>();
  for (const ce of cementExpenses) {
    try {
      if (ce.notes) {
        const meta = JSON.parse(ce.notes);
        if (meta.linkedLogId) {
          cementMap.set(meta.linkedLogId, ce);
        }
      }
    } catch {
      // ignore
    }
  }

  const logs: DailySiteLogEntry[] = [];

  for (const exp of expenses) {
    let mestriCount = 0;
    let mestriRate = 0;
    let helperCount = 0;
    let helperRate = 0;
    let otherWorkersCount = 0;
    let otherWorkersRate = 0;
    let cementBags = 0;
    let cementBrand = "UltraTech Cement";
    let cementRate = 380;
    let workDescription = exp.description;
    let customNotes = "";
    let linkedCementId: string | null = null;

    if (exp.notes && exp.notes.includes(`"type":"DAILY_LOG"`)) {
      try {
        const meta = JSON.parse(exp.notes);
        mestriCount = Number(meta.mestriCount) || 0;
        mestriRate = Number(meta.mestriRate) || 0;
        helperCount = Number(meta.helperCount) || 0;
        helperRate = Number(meta.helperRate) || 0;
        otherWorkersCount = Number(meta.otherWorkersCount) || 0;
        otherWorkersRate = Number(meta.otherWorkersRate) || 0;
        cementBags = Number(meta.cementBags) || 0;
        cementBrand = meta.cementBrand || "UltraTech Cement";
        cementRate = Number(meta.cementRate) || 380;
        workDescription = meta.workDescription || exp.description;
        customNotes = meta.notes || "";
        linkedCementId = meta.linkedCementExpenseId || null;
      } catch {
        // fallback
      }
    } else {
      // Parse from regular daily labour expense
      mestriCount = exp.numberOfWorkers || 1;
      mestriRate = Number(exp.rate || exp.amount);
      workDescription = exp.description;
      customNotes = exp.notes || "";
    }

    // Check linked cement if not in meta
    if (cementBags === 0 && cementMap.has(exp.id)) {
      const ce = cementMap.get(exp.id)!;
      cementBags = Number(ce.quantity || 0);
      cementRate = Number(ce.rate || 380);
      linkedCementId = ce.id;
    }

    const mestriTotal = mestriCount * mestriRate;
    const helperTotal = helperCount * helperRate;
    const otherWorkersTotal = otherWorkersCount * otherWorkersRate;
    const totalLabourCost = mestriTotal + helperTotal + otherWorkersTotal || Number(exp.amount);
    const totalCementCost = cementBags * cementRate;
    const totalWorkers = mestriCount + helperCount + otherWorkersCount;

    // Clean cement references from labour work description
    let cleanWorkDescription = (workDescription || "").replace(/,?\s*\d+\s*bags?\s*cement/gi, "").trim();
    if (!cleanWorkDescription || cleanWorkDescription === "Site Work") {
      cleanWorkDescription = `Site Work (${mestriCount} Mestri, ${helperCount} Helpers)`;
    }

    logs.push({
      id: exp.id,
      date: exp.date.toISOString().slice(0, 10),
      stageId: exp.constructionStageId,
      stageName: exp.constructionStage?.name ?? "General / Unassigned",
      floorId: exp.floorId,
      floorName: exp.floor?.name ?? null,
      mestriCount,
      mestriRate,
      mestriTotal,
      helperCount,
      helperRate,
      helperTotal,
      otherWorkersCount,
      otherWorkersRate,
      otherWorkersTotal,
      totalWorkers,
      totalLabourCost,
      cementBags,
      cementBrand,
      cementRate,
      totalCementCost,
      totalDayCost: totalLabourCost + totalCementCost,
      workDescription: cleanWorkDescription,
      notes: customNotes,
      paymentMethod: exp.paymentMethod,
      linkedCementExpenseId: linkedCementId,
      createdAt: exp.createdAt.toISOString(),
    });
  }

  // Calculate summary metrics
  const summary: DailySiteLogsSummary = {
    totalMestriDays: logs.reduce((acc, l) => acc + l.mestriCount, 0),
    totalHelperDays: logs.reduce((acc, l) => acc + l.helperCount, 0),
    totalOtherWorkerDays: logs.reduce((acc, l) => acc + l.otherWorkersCount, 0),
    totalWorkerDays: logs.reduce((acc, l) => acc + l.totalWorkers, 0),
    totalCementBags: logs.reduce((acc, l) => acc + l.cementBags, 0),
    totalLabourSpent: logs.reduce((acc, l) => acc + l.totalLabourCost, 0),
    totalCementSpent: logs.reduce((acc, l) => acc + l.totalCementCost, 0),
    grandTotal: logs.reduce((acc, l) => acc + l.totalDayCost, 0),
    daysLoggedCount: logs.length,
  };

  return { logs, summary };
}

export type RecordDailyLogInput = {
  projectId: string;
  date: string;
  stageId?: string;
  floorId?: string;
  mestriCount: number;
  mestriRate: number;
  helperCount: number;
  helperRate: number;
  otherWorkersCount?: number;
  otherWorkersRate?: number;
  cementBags?: number;
  cementBrand?: string;
  cementRate?: number;
  workDescription: string;
  notes?: string;
  paymentMethod?: string;
  workerId?: string;
  vendorId?: string;
};

export async function recordDailySiteLog(input: RecordDailyLogInput) {
  const user = await requireUser();
  await requireProject(input.projectId, user.id);

  const logDate = new Date(input.date);
  if (!input.date || Number.isNaN(logDate.getTime())) {
    return { error: "Please enter a valid date" };
  }

  if (input.stageId) {
    const stage = await prisma.constructionStage.findFirst({ where: { id: input.stageId, projectId: input.projectId } });
    if (!stage) return { error: "Selected construction stage not found in this project" };
  }
  if (input.floorId) {
    const floor = await prisma.floor.findFirst({ where: { id: input.floorId, projectId: input.projectId } });
    if (!floor) return { error: "Selected floor not found in this project" };
  }
  if (input.workerId) {
    const worker = await prisma.worker.findFirst({ where: { id: input.workerId, userId: user.id } });
    if (!worker) return { error: "Selected worker not found in your account" };
  }
  if (input.vendorId) {
    const vendor = await prisma.vendor.findFirst({ where: { id: input.vendorId, userId: user.id } });
    if (!vendor) return { error: "Selected vendor not found in your account" };
  }

  const mestriCount = Math.max(0, Number(input.mestriCount) || 0);
  const mestriRate = Math.max(0, Number(input.mestriRate) || 0);
  const helperCount = Math.max(0, Number(input.helperCount) || 0);
  const helperRate = Math.max(0, Number(input.helperRate) || 0);
  const otherWorkersCount = Math.max(0, Number(input.otherWorkersCount) || 0);
  const otherWorkersRate = Math.max(0, Number(input.otherWorkersRate) || 0);

  const cementBags = Math.max(0, Number(input.cementBags) || 0);
  const cementRate = Math.max(0, Number(input.cementRate) || 0);
  const cementBrand = input.cementBrand?.trim() || "UltraTech 53 Grade";

  const totalLabourCost = mestriCount * mestriRate + helperCount * helperRate + otherWorkersCount * otherWorkersRate;
  const totalCementCost = cementBags * cementRate;

  if (totalLabourCost <= 0 && cementBags <= 0) {
    return { error: "Please enter either labour count/rates or cement bags used." };
  }

  // Find or create default "Masonry & Labour" category
  let labourCategory = await prisma.labourCategory.findFirst({
    where: { projectId: input.projectId, name: "Masonry & Civil Labour" },
  });
  if (!labourCategory) {
    labourCategory = await prisma.labourCategory.findFirst({
      where: { projectId: input.projectId },
    });
  }

  // Find or create default "Cement" category
  let cementCategory = await prisma.materialCategory.findFirst({
    where: { projectId: input.projectId, name: "Cement" },
  });
  if (!cementCategory) {
    cementCategory = await prisma.materialCategory.findFirst({
      where: { projectId: input.projectId },
    });
  }

  try {
    const totalWorkers = mestriCount + helperCount + otherWorkersCount;
    const avgRate = totalWorkers > 0 ? totalLabourCost / totalWorkers : 0;

    const paymentMethod = Object.values(PaymentMethod).includes(input.paymentMethod as PaymentMethod)
      ? input.paymentMethod as PaymentMethod
      : PaymentMethod.CASH;
    const labourExp = await prisma.$transaction(async (tx) => {
      let linkedCementExpenseId: string | null = null;
      if (cementBags > 0 && totalCementCost > 0) {
        const cementExp = await tx.expense.create({
          data: {
            projectId: input.projectId, date: logDate, expenseType: "MATERIAL", materialCategoryId: cementCategory?.id ?? null,
            description: `Daily Cement: ${cementBags} bags (${cementBrand})`, quantity: new Prisma.Decimal(cementBags), unit: "bags",
            rate: new Prisma.Decimal(cementRate), amount: new Prisma.Decimal(totalCementCost), constructionStageId: input.stageId || null,
            floorId: input.floorId || null, vendorId: input.vendorId || null, paymentMethod,
            notes: JSON.stringify({ type: "DAILY_LOG_CEMENT", cementBags, cementBrand, cementRate }),
          },
        });
        linkedCementExpenseId = cementExp.id;
      }

      const logMetadata = { type: "DAILY_LOG", mestriCount, mestriRate, helperCount, helperRate, otherWorkersCount, otherWorkersRate,
        cementBags, cementBrand, cementRate, workDescription: input.workDescription.trim() || `Daily Site Work (${mestriCount} Masons, ${helperCount} Helpers)`,
        notes: input.notes?.trim() || "", linkedCementExpenseId };
      // Daily labour log is RECORDING ONLY — amount is 0, not added to expense totals.
      // The actual weekly payment is added manually by the user. All breakdown data
      // (mestri/helper counts, rates, computed totals) is preserved in the notes JSON
      // for the muster roll report and attendance tracking.
      const labour = await tx.expense.create({
        data: {
          projectId: input.projectId, date: logDate, expenseType: "LABOUR", labourCategoryId: labourCategory?.id ?? null,
          labourCalcMethod: "DAILY_WAGE", numberOfWorkers: totalWorkers || 0, numberOfDays: new Prisma.Decimal(1),
          rate: new Prisma.Decimal(0), amount: new Prisma.Decimal(0), constructionStageId: input.stageId || null,
          floorId: input.floorId || null, workerId: input.workerId || null, paymentMethod,
          description: input.workDescription.trim() || `Daily Site Log: ${mestriCount} Mestri (₹${mestriRate}) + ${helperCount} Helpers (₹${helperRate})`,
          notes: JSON.stringify(logMetadata),
        },
      });
      if (linkedCementExpenseId) {
        await tx.expense.update({ where: { id: linkedCementExpenseId }, data: { notes: JSON.stringify({ type: "DAILY_LOG_CEMENT", linkedLogId: labour.id, cementBags, cementBrand, cementRate }) } });
      }
      return labour;
    });

    invalidateProjectCache(input.projectId);
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/expenses");
    revalidatePath("/stages");
    revalidatePath("/daily-log");

    return { ok: true, id: labourExp.id };
  } catch (err) {
    console.error("recordDailySiteLog error:", err);
    return { error: err instanceof Error ? err.message : "Failed to record daily site log" };
  }
}

export async function updateDailySiteLog(logId: string, input: RecordDailyLogInput) {
  const user = await requireUser();
  await requireProject(input.projectId, user.id);

  try {
    // Delete old entry (and linked cement)
    const deleteRes = await deleteDailySiteLog(input.projectId, logId);
    if ("error" in deleteRes && deleteRes.error) {
      return { error: deleteRes.error };
    }

    // Create fresh entry with updated values
    const createRes = await recordDailySiteLog(input);
    return createRes;
  } catch (err) {
    console.error("updateDailySiteLog error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update daily log" };
  }
}

export async function deleteDailySiteLog(projectId: string, logId: string) {
  const user = await requireUser();
  await requireProject(projectId, user.id);

  try {
    const exp = await prisma.expense.findFirst({
      where: { id: logId, projectId },
    });

    if (!exp) return { error: "Log entry not found" };

    // Check if there is a linked cement expense
    if (exp.notes) {
      try {
        const meta = JSON.parse(exp.notes);
        if (meta.linkedCementExpenseId) {
          await prisma.expense.deleteMany({
            where: { id: meta.linkedCementExpenseId, projectId },
          });
        }
      } catch {
        // ignore
      }
    }

    // Also delete any cement expense linked via linkedLogId
    await prisma.expense.deleteMany({
      where: {
        projectId,
        notes: { contains: `"linkedLogId":"${logId}"` },
      },
    });

    // Delete main log expense
    await prisma.expense.delete({
      where: { id: logId },
    });

    invalidateProjectCache(projectId);
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/expenses");
    revalidatePath("/stages");
    revalidatePath("/daily-log");

    return { ok: true };
  } catch (err) {
    console.error("deleteDailySiteLog error:", err);
    return { error: err instanceof Error ? err.message : "Failed to delete log entry" };
  }
}
