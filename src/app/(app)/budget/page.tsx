import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { prisma } from "@/lib/prisma";
import { getBudgetVariance, getCategoryTotal, getTypeTotals } from "@/lib/finance/aggregations";
import { EmptyState } from "@/components/ui/page-header";
import { BudgetEditor } from "@/components/budget/budget-editor";
import { BudgetOverview, type CategoryRiskItem, type TypeBudgetRow } from "@/components/budget/budget-overview";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);
  if (!projectId) return <EmptyState title="No project" body="Create a project to set budgets." />;

  const [project, rawExpenses, typeBudgets, categoryBudgets, materials, labours] = await Promise.all([
    prisma.project.findFirst({ where: { id: projectId, userId: user.id } }),
    prisma.expense.findMany({
      where: { projectId },
      select: {
        expenseType: true,
        amount: true,
        materialCategoryId: true,
        labourCategoryId: true,
        serviceCategoryId: true,
        professionalCategoryId: true,
      },
    }),
    prisma.budget.findMany({ where: { projectId } }),
    prisma.budgetCategory.findMany({
      where: { projectId },
      include: { materialCategory: true, labourCategory: true, serviceCategory: true, professionalCategory: true },
    }),
    prisma.materialCategory.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.labourCategory.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ]);

  if (!project) {
    return <EmptyState title="No project found" body="Create or select a house project to set budgets." />;
  }

  const expenses = rawExpenses.map((r) => ({
    date: new Date(),
    expenseType: r.expenseType,
    amount: r.amount,
    materialCategoryId: r.materialCategoryId,
    labourCategoryId: r.labourCategoryId,
    serviceCategoryId: r.serviceCategoryId,
    professionalCategoryId: r.professionalCategoryId,
  }));

  const totals = getTypeTotals(expenses);
  const overall = getBudgetVariance(project.totalBudget, totals.total);

  // Type-wise budgets (Material, Labour, Other)
  const materialBudget = typeBudgets.find((b) => b.expenseType === "MATERIAL")?.amount ?? 0;
  const labourBudget = typeBudgets.find((b) => b.expenseType === "LABOUR")?.amount ?? 0;
  const otherBudget = typeBudgets.filter((b) => b.expenseType !== "MATERIAL" && b.expenseType !== "LABOUR").reduce((sum, b) => sum + Number(b.amount), 0);

  const otherActual = Number(totals.SERVICE) + Number(totals.EQUIPMENT) + Number(totals.PROFESSIONAL) + Number(totals.OTHER);

  const matVariance = getBudgetVariance(materialBudget, totals.MATERIAL);
  const labVariance = getBudgetVariance(labourBudget, totals.LABOUR);
  const othVariance = getBudgetVariance(otherBudget, otherActual);

  const typeRows: TypeBudgetRow[] = [
    {
      type: "MATERIAL",
      budget: Number(materialBudget),
      actual: Number(totals.MATERIAL),
      remaining: Number(matVariance.remaining),
      variance: Number(matVariance.variance),
      isOver: matVariance.isOver,
    },
    {
      type: "LABOUR",
      budget: Number(labourBudget),
      actual: Number(totals.LABOUR),
      remaining: Number(labVariance.remaining),
      variance: Number(labVariance.variance),
      isOver: labVariance.isOver,
    },
    {
      type: "OTHER",
      budget: Number(otherBudget),
      actual: otherActual,
      remaining: Number(othVariance.remaining),
      variance: Number(othVariance.variance),
      isOver: othVariance.isOver,
    },
  ];

  // Identify categories at risk
  const categoriesAtRisk: CategoryRiskItem[] = [];
  for (const item of categoryBudgets) {
    const name =
      item.materialCategory?.name ??
      item.labourCategory?.name ??
      item.serviceCategory?.name ??
      item.professionalCategory?.name ??
      item.expenseType;
    const categoryId = item.materialCategoryId ?? item.labourCategoryId ?? item.serviceCategoryId ?? item.professionalCategoryId ?? "";
    const actual = getCategoryTotal(expenses, categoryId, item.expenseType);
    const result = getBudgetVariance(item.amount, actual);
    if (result.isOver || Number(result.usedPercent) > 85) {
      categoriesAtRisk.push({
        name,
        type: item.expenseType,
        budget: Number(item.amount),
        spent: Number(actual),
        variance: Number(result.variance),
        isOver: result.isOver,
      });
    }
  }

  return (
    <BudgetOverview
      totalBudget={project.totalBudget.toString()}
      actualSpent={totals.total.toString()}
      remainingCash={overall.remaining.toString()}
      usedPercent={overall.usedPercent.toString()}
      isOverallOver={overall.isOver}
      typeRows={typeRows}
      categoriesAtRisk={categoriesAtRisk}
      projectId={projectId}
    >
      <BudgetEditor
        projectId={projectId}
        currentTotal={project.totalBudget.toString()}
        materials={materials.map((item) => ({ id: item.id, name: item.name, groupName: item.groupName }))}
        labours={labours.map((item) => ({ id: item.id, name: item.name, groupName: item.groupName }))}
        typeBudgets={typeBudgets.map((b) => ({ id: b.id, expenseType: b.expenseType, amount: Number(b.amount) }))}
        categoryBudgets={categoryBudgets.map((c) => ({
          id: c.id,
          expenseType: c.expenseType,
          name:
            c.materialCategory?.name ??
            c.labourCategory?.name ??
            c.serviceCategory?.name ??
            c.professionalCategory?.name ??
            c.expenseType,
          amount: Number(c.amount),
        }))}
      />
    </BudgetOverview>
  );
}
