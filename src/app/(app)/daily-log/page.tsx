import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { loadMasters } from "@/lib/masters";
import { getDailySiteLogs } from "@/lib/actions/daily-logs";
import { DailyLogManager } from "@/components/daily-log/daily-log-manager";
import { NoProjectState } from "@/components/projects/no-project-state";

export const dynamic = "force-dynamic";

export default async function DailyLogPage() {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);

  if (!projectId) {
    return (
      <NoProjectState
        title="No House Project Selected"
        description="Daily labour and cement tracking requires an active house project. Please create or select a house first."
      />
    );
  }

  const [masters, { logs, summary }] = await Promise.all([
    loadMasters(user.id, projectId),
    getDailySiteLogs(projectId),
  ]);

  return (
    <DailyLogManager
      projectId={projectId}
      initialLogs={logs}
      initialSummary={summary}
      stages={masters.stages}
      floors={masters.floors}
    />
  );
}
