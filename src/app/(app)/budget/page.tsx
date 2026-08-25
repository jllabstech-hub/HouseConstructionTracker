import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { prisma } from "@/lib/prisma";
import { loadProjectExpenses } from "@/lib/finance/queries";
import { getBudgetVariance, getCategoryTotal, getTypeTotals } from "@/lib/finance/aggregations";
import { formatINR } from "@/lib/money";
import { EmptyState } from "@/components/ui/page-header";
import { BudgetEditor } from "@/components/budget/budget-editor";
import { CategoryBudgetsTable } from "@/components/budget/category-budgets-table";
import { BudgetOverview } from "@/components/budget/budget-overview";

export default async function BudgetPage() {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);
  if (!projectId) return <EmptyState title="No project" body="Create a project to set budgets." />;

  const [project, expenses, typeBudgets, categoryBudgets, materials, labours] = await Promise.all([
    prisma.project.findFirstOrThrow({ where: { id: projectId, userId: user.id } }),
    loadProjectExpenses(projectId),
    prisma.budget.findMany({ where: { projectId } }),
    prisma.budgetCategory.findMany({
      where: { projectId },
      include: { materialCategory: true, labourCategory: true, serviceCategory: true, professionalCategory: true },
    }),
    prisma.materialCategory.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.labourCategory.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);

  const totals = getTypeTotals(expenses);
  const overall = getBudgetVariance(project.totalBudget, totals.total);

  const typeRows = (["MATERIAL", "LABOUR", "SERVICE", "EQUIPMENT", "PROFESSIONAL", "OTHER"] as const).map((type) => {
    const budget = typeBudgets.find((row) => row.expenseType === type)?.amount ?? 0;
    const actual = totals[type];
    const result = getBudgetVariance(budget, actual);
    return {
      type,
      budget,
      actual,
      remaining: result.remaining,
      variance: result.variance,
      isOver: result.isOver,
    };
  });

  return (
    <div className="space-y-6">
      <BudgetOverview
        totalBudget={project.totalBudget.toString()}
        actualSpent={totals.total.toString()}
        remainingCash={overall.remaining.toString()}
        usedPercent={overall.usedPercent.toString()}
        isOverallOver={overall.isOver}
        typeRows={typeRows.map((row) => ({
          type: row.type,
          budget: row.budget.toString(),
          actual: row.actual.toString(),
          remaining: row.remaining.toString(),
          variance: row.variance.toString(),
          isOver: row.isOver,
        }))}
      />

      {/* Category budgets with pagination and search */}
      <CategoryBudgetsTable
        items={categoryBudgets.map((item) => {
          const name =
            item.materialCategory?.name ??
            item.labourCategory?.name ??
            item.serviceCategory?.name ??
            item.professionalCategory?.name ??
            item.expenseType;
          const categoryId = item.materialCategoryId ?? item.labourCategoryId ?? item.serviceCategoryId ?? item.professionalCategoryId ?? "";
          const actual = getCategoryTotal(expenses, categoryId, item.expenseType);
          const result = getBudgetVariance(item.amount, actual);
          return {
            id: item.id,
            name,
            planned: formatINR(item.amount),
            actual: formatINR(actual),
            variance: formatINR(result.variance),
            isOver: result.isOver,
          };
        })}
      />

      <BudgetEditor
        projectId={projectId}
        currentTotal={project.totalBudget.toString()}
        materials={materials.map((item) => ({ id: item.id, name: `${item.name} (${item.groupName})` }))}
        labours={labours.map((item) => ({ id: item.id, name: `${item.name} (${item.groupName})` }))}
      />
    </div>
  );
}

