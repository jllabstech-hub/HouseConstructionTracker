import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ConstructionReportPdf } from "@/components/reports/construction-report-pdf";
import { getOwnedProjectOrNull } from "@/lib/auth-guard";
import { getCategoryTotal, getStageTotal } from "@/lib/finance/aggregations";
import { loadProjectExpenses, loadWorkAreas } from "@/lib/finance/queries";
import { buildReportData, type ReportKind } from "@/lib/finance/report-data";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
  try {
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
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    const from = fromParam && !isNaN(Date.parse(fromParam)) ? new Date(fromParam) : undefined;
    const to = toParam && !isNaN(Date.parse(toParam)) ? new Date(toParam) : undefined;

    const categoryId = url.searchParams.get("categoryId") || undefined;
    const categoryName = url.searchParams.get("categoryName") || undefined;
    const vendorId = url.searchParams.get("vendorId") || undefined;
    const vendorName = url.searchParams.get("vendorName") || undefined;
    const workerId = url.searchParams.get("workerId") || undefined;
    const workerName = url.searchParams.get("workerName") || undefined;
    const stageId = url.searchParams.get("stageId") || undefined;
    const stageName = url.searchParams.get("stageName") || undefined;

    const [expenses, workAreas, budgetCategories, stages] = await Promise.all([
      loadProjectExpenses(projectId, { from, to }),
      loadWorkAreas(projectId),
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
      expenses: expenses || [],
      workAreas: workAreas || [],
      from,
      to,
      categoryId,
      categoryName,
      vendorId,
      vendorName,
      workerId,
      workerName,
      stageId,
      stageName,
      categoryBudgets: (budgetCategories || []).map((item) => ({
        name: item.materialCategory?.name ?? item.labourCategory?.name ?? item.expenseType,
        budget: item.amount,
        actual: getCategoryTotal(
          expenses,
          (item.materialCategoryId ?? item.labourCategoryId) as string,
          item.expenseType === "LABOUR" ? "LABOUR" : "MATERIAL",
        ),
      })),
      stages: (stages || []).map((stage) => ({
        name: stage.name,
        status: stage.status,
        percentageComplete: stage.percentageComplete,
        amount: getStageTotal(expenses, stage.id),
      })),
    });

    const buffer = await renderToBuffer(<ConstructionReportPdf data={data} />);
    const disposition = url.searchParams.get("download") === "1" ? "attachment" : "inline";
    const rawFilename = data.filename || "construction-report.pdf";
    const cleanFilename = rawFilename.replace(/[^\w.-]/g, "_");

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${cleanFilename}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    const msg = error instanceof Error ? error.message : "Failed to generate report PDF";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
