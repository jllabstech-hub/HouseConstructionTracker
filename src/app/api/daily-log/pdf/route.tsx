import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { DailyLabourLogPdf } from "@/components/daily-log/daily-log-pdf";
import { getOwnedProjectOrNull } from "@/lib/auth-guard";
import { getDailySiteLogs, type DailySiteLogsSummary } from "@/lib/actions/daily-logs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId parameter" }, { status: 400 });
    }

    const project = await getOwnedProjectOrNull(projectId, session.user.id);
    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    const stageId = url.searchParams.get("stageId") || undefined;
    const logId = url.searchParams.get("logId") || undefined;
    const download = url.searchParams.get("download") === "1";

    const { logs: allLogs, summary } = await getDailySiteLogs(projectId);
    let filteredLogs = stageId ? allLogs.filter((l) => l.stageId === stageId) : allLogs;
    if (logId) {
      filteredLogs = allLogs.filter((l) => l.id === logId);
    }

    const logSummary: DailySiteLogsSummary = logId && filteredLogs.length > 0 ? {
      totalMestriDays: filteredLogs.reduce((acc, l) => acc + l.mestriCount, 0),
      totalHelperDays: filteredLogs.reduce((acc, l) => acc + l.helperCount, 0),
      totalOtherWorkerDays: filteredLogs.reduce((acc, l) => acc + l.otherWorkersCount, 0),
      totalWorkerDays: filteredLogs.reduce((acc, l) => acc + l.totalWorkers, 0),
      totalLabourSpent: filteredLogs.reduce((acc, l) => acc + l.totalLabourCost, 0),
      totalCementBags: 0,
      totalCementSpent: 0,
      grandTotal: filteredLogs.reduce((acc, l) => acc + l.totalLabourCost, 0),
      daysLoggedCount: filteredLogs.length,
    } : summary;

    const pdfBuffer = await renderToBuffer(
      <DailyLabourLogPdf
        projectName={project.name}
        logs={filteredLogs}
        summary={logSummary}
        generatedAt={new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      />
    );

    const safeName = project.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const filename = logId && filteredLogs[0]
      ? `daily-labour-voucher-${filteredLogs[0].date}-${safeName}.pdf`
      : `daily-labour-muster-roll-${safeName}.pdf`;

    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": download ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("Daily Log PDF Generation Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate PDF report" },
      { status: 500 }
    );
  }
}
