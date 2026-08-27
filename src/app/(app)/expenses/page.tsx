import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { prisma } from "@/lib/prisma";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { EmptyState } from "@/components/ui/page-header";
import type { ExpenseRowData } from "@/components/expenses/expense-mobile-card";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);

  if (!projectId) {
    return <EmptyState title="No project found" body="Create or select a house project to view expenses." />;
  }

  const [
    totalAgg,
    rawExpenses,
    stages,
    floors,
    vendors,
    workers,
    matCategories,
    labCategories,
  ] = await Promise.all([
    prisma.expense.aggregate({
      where: { projectId },
      _sum: { amount: true },
    }),
    prisma.expense.findMany({
      where: { projectId },
      select: {
        id: true,
        date: true,
        expenseType: true,
        amount: true,
        description: true,
        paymentMethod: true,
        quantity: true,
        unit: true,
        rate: true,
        materialCategoryId: true,
        labourCategoryId: true,
        serviceCategoryId: true,
        equipmentCategoryId: true,
        professionalCategoryId: true,
        materialCategory: { select: { name: true } },
        labourCategory: { select: { name: true } },
        serviceCategory: { select: { name: true } },
        equipmentCategory: { select: { name: true } },
        professionalCategory: { select: { name: true } },
        vendor: { select: { name: true } },
        worker: { select: { name: true } },
        constructionStage: { select: { name: true } },
        floor: { select: { name: true } },
        receipts: { select: { id: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    prisma.constructionStage.findMany({
      where: { projectId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.floor.findMany({
      where: { projectId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.vendor.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.worker.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.materialCategory.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.labourCategory.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalSpent = Number(totalAgg._sum.amount ?? 0);
  const allCategories = [...matCategories, ...labCategories];

  const expenses: ExpenseRowData[] = rawExpenses.map((e) => {
    const categoryName =
      e.materialCategory?.name ||
      e.labourCategory?.name ||
      e.serviceCategory?.name ||
      e.equipmentCategory?.name ||
      e.professionalCategory?.name ||
      "General";

    const categoryId =
      e.materialCategoryId ||
      e.labourCategoryId ||
      e.serviceCategoryId ||
      e.equipmentCategoryId ||
      e.professionalCategoryId ||
      "";

    const vendorOrWorker = e.vendor?.name || e.worker?.name || null;

    return {
      id: e.id,
      date: e.date.toISOString().slice(0, 10),
      type: e.expenseType,
      category: { id: categoryId, name: categoryName },
      amount: e.amount.toString(),
      description: e.description,
      vendorName: vendorOrWorker,
      stageName: e.constructionStage?.name ?? null,
      floorName: e.floor?.name ?? null,
      paymentMethod: e.paymentMethod,
      quantity: e.quantity ? e.quantity.toString() : null,
      unit: e.unit,
      rate: e.rate ? e.rate.toString() : null,
      receiptCount: e.receipts.length,
    };
  });

  return (
    <ExpenseTable
      projectId={projectId}
      expenses={expenses}
      stages={stages}
      floors={floors}
      vendors={vendors}
      workers={workers}
      categories={allCategories}
      totalSpent={totalSpent}
    />
  );
}
