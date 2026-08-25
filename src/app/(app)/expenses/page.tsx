import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { loadProjectExpenses } from "@/lib/finance/queries";
import { prisma } from "@/lib/prisma";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { EmptyState, PageHeader } from "@/components/ui/page-header";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);
  const { type } = await searchParams;
  if (!projectId) {
    return <EmptyState title="No project yet" body="Create a project before recording expenses." />;
  }

  const expenses = await loadProjectExpenses(projectId, undefined, type ? { expenseType: type as never } : undefined);
  const withQty = await prisma.expense.findMany({
    where: { projectId, ...(type ? { expenseType: type as never } : {}) },
    select: { id: true, quantity: true, rate: true, unit: true },
  });
  const qtyMap = new Map(withQty.map((row) => [row.id, row]));

  return (
    <div>
      <PageHeader
        title={type === "MATERIAL" ? "Material expenses" : type === "LABOUR" ? "Labour expenses" : "All expenses"}
        subtitle="Material purchases and labour payments stay in separate types, even when they belong to the same work."
        actions={
          <>
            <Link href="/expenses?type=MATERIAL" className="rounded-xl border border-ink-200 px-3 py-2 text-sm">Material</Link>
            <Link href="/expenses?type=LABOUR" className="rounded-xl border border-ink-200 px-3 py-2 text-sm">Labour</Link>
            <Link href="/expenses/new" className="rounded-xl bg-clay-600 px-4 py-2 text-sm font-semibold text-white">Add expense</Link>
          </>
        }
      />
      <ExpenseTable
        projectId={projectId}
        typeFilter={type}
        expenses={expenses.map((row) => {
          const itemQty = qtyMap.get(row.id ?? "");
          return {
            ...row,
            quantity: itemQty?.quantity?.toString() ?? null,
            rate: itemQty?.rate?.toString() ?? null,
            unit: itemQty?.unit ?? row.unit ?? null,
            date: row.date instanceof Date ? row.date.toISOString() : row.date,
            amount: row.amount?.toString() ?? "0",
          };
        })}
      />
    </div>
  );
}
