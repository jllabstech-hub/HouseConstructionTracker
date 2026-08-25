import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { prisma } from "@/lib/prisma";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { EmptyState } from "@/components/ui/page-header";
import type { ExpenseRowData } from "@/components/expenses/expense-mobile-card";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);
  const { type } = await searchParams;

  if (!projectId) {
    return <EmptyState title="No project found" body="Create or select a house project to view expenses." />;
  }

  const [rawExpenses, stages] = await Promise.all([
    prisma.expense.findMany({
      where: {
        projectId,
        ...(type ? { expenseType: type as never } : {}),
      },
      include: {
        materialCategory: true,
        labourCategory: true,
        serviceCategory: true,
        equipmentCategory: true,
        professionalCategory: true,
        vendor: true,
        worker: true,
        constructionStage: true,
        floor: true,
        receipts: true,
      },
      orderBy: { date: "desc" },
    }),
    prisma.constructionStage.findMany({
      where: { projectId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  let totalSpent = 0;

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
    const amountNum = Number(e.amount);
    totalSpent += amountNum;

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
      totalSpent={totalSpent}
    />
  );
}
