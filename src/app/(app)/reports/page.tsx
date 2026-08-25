import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { loadProjectExpenses, loadWorkAreas } from "@/lib/finance/queries";
import { getWorkWiseCost } from "@/lib/finance/aggregations";
import { EmptyState } from "@/components/ui/page-header";
import { ReportsTabs } from "@/components/reports/reports-tabs";

export default async function ReportsPage() {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);
  if (!projectId) return <EmptyState title="No project" body="Create a project to generate reports." />;

  const [expenses, workAreas] = await Promise.all([
    loadProjectExpenses(projectId),
    loadWorkAreas(user.id),
  ]);
  const workWise = getWorkWiseCost(expenses, workAreas);

  return (
    <div className="space-y-6">
      <ReportsTabs
        projectId={projectId}
        workWise={workWise.map((w) => ({
          id: w.id,
          name: w.name,
          material: w.material.toString(),
          labour: w.labour.toString(),
          total: w.total.toString(),
        }))}
      />
    </div>
  );
}

