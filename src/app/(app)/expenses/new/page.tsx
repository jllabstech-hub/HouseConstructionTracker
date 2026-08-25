import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { loadMasters } from "@/lib/masters";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { EmptyState } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams?: Promise<{ stageId?: string; description?: string; amount?: string }>;
}) {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);
  if (!projectId) {
    return <EmptyState title="Choose a project first" body="Expenses always belong to a house project." />;
  }
  const masters = await loadMasters(user.id, projectId);
  const params = searchParams ? await searchParams : {};

  return (
    <ExpenseForm
      projectId={projectId}
      initial={{
        constructionStageId: params.stageId ?? "",
        description: params.description ?? "",
        amount: params.amount ?? "",
      }}
      materials={masters.materials}
      labours={masters.labours}
      services={masters.services}
      equipment={masters.equipment}
      professionals={masters.professionals}
      vendors={masters.vendors}
      workers={masters.workers}
      stages={masters.stages}
      floors={masters.floors}
    />
  );
}
