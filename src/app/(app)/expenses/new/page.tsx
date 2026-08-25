import { requireUser } from "@/lib/auth-guard";
import { getActiveProjectId } from "@/lib/project-context";
import { loadMasters } from "@/lib/masters";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { EmptyState, PageHeader } from "@/components/ui/page-header";

export default async function NewExpensePage() {
  const user = await requireUser();
  const projectId = await getActiveProjectId(user.id);
  if (!projectId) {
    return <EmptyState title="Choose a project first" body="Expenses always belong to a house project." />;
  }
  const masters = await loadMasters(user.id, projectId);

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Add expense"
        subtitle="Material purchase or labour payment — never the same thing."
      />
      <ExpenseForm
        projectId={projectId}
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
    </div>
  );
}
