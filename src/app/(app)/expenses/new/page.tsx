import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { loadMasters } from "@/lib/masters";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { NoProjectState } from "@/components/projects/no-project-state";

export const dynamic = "force-dynamic";

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams?: Promise<{ stageId?: string; description?: string; amount?: string; type?: string }>;
}) {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);
  if (!projectId) {
    return (
      <NoProjectState
        title="No House Project Selected"
        description="Expenses must be recorded against a house project. Please create or select a project first."
      />
    );
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
        expenseType: params.type ?? "MATERIAL",
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
