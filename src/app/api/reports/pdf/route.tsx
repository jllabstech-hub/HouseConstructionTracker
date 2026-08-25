import { pdf } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ConstructionReportPdf } from "@/components/reports/construction-report-pdf";
import { getOwnedProjectOrNull } from "@/lib/auth-guard";
import { getCategoryTotal, getStageTotal } from "@/lib/finance/aggregations";
import { loadProjectExpenses, loadWorkAreas } from "@/lib/finance/queries";
import { buildReportData, type ReportKind } from "@/lib/finance/report-data";
import { prisma } from "@/lib/prisma";

const KINDS = new Set<ReportKind>([
  "total",
  "material",
  "labour",
  "category",
  "work-wise",
  "monthly",
  "budget",
  "stage",
  "vendor",
  "worker",
  "payment",
  "floor",
]);

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const kind = (url.searchParams.get("kind") ?? "total") as ReportKind;
  if (!projectId || !KINDS.has(kind)) {
    return NextResponse.json({ error: "Invalid report request" }, { status: 400 });
  }

  const project = await getOwnedProjectOrNull(projectId, session.user.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const from = url.searchParams.get("from") ? new Date(url.searchParams.get("from")!) : undefined;
  const to = url.searchParams.get("to") ? new Date(url.searchParams.get("to")!) : undefined;
  const [expenses, workAreas, budgetCategories, stages] = await Promise.all([
    loadProjectExpenses(projectId, { from, to }),
    loadWorkAreas(session.user.id),
    prisma.budgetCategory.findMany({
      where: { projectId },
      include: { materialCategory: true, labourCategory: true },
    }),
    prisma.constructionStage.findMany({ where: { projectId }, orderBy: { sortOrder: "asc" } }),
  ]);

  const data = buildReportData({
    kind,
    projectName: project.name,
    totalBudget: project.totalBudget,
    expenses,
    workAreas,
    from,
    to,
    categoryBudgets: budgetCategories.map((item) => ({
      name: item.materialCategory?.name ?? item.labourCategory?.name ?? item.expenseType,
      budget: item.amount,
      actual: getCategoryTotal(
        expenses,
        (item.materialCategoryId ?? item.labourCategoryId) as string,
        item.expenseType === "LABOUR" ? "LABOUR" : "MATERIAL",
      ),
    })),
    stages: stages.map((stage) => ({
      name: stage.name,
      status: stage.status,
      percentageComplete: stage.percentageComplete,
      amount: getStageTotal(expenses, stage.id),
    })),
  });

  const blob = await pdf(<ConstructionReportPdf data={data} />).toBlob();
  const buffer = Buffer.from(await blob.arrayBuffer());
  const disposition = url.searchParams.get("download") === "1" ? "attachment" : "inline";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${data.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
