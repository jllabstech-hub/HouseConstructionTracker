import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { loadMasters } from "@/lib/masters";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { PageHeader } from "@/components/ui/page-header";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { project: true, receipts: true },
  });
  if (!expense || expense.project.userId !== user.id) notFound();
  const masters = await loadMasters(user.id, expense.projectId);

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Edit expense" subtitle={expense.description} />
      <ExpenseForm
          projectId={expense.projectId}
          expenseId={expense.id}
          initial={{
            expenseType: expense.expenseType,
            date: expense.date.toISOString().slice(0, 10),
            description: expense.description,
            quantity: expense.quantity?.toString() ?? "",
            unit: expense.unit ?? "",
            rate: expense.rate?.toString() ?? "",
            amount: expense.amount.toString(),
            vendorId: expense.vendorId ?? "",
            workerId: expense.workerId ?? "",
            constructionStageId: expense.constructionStageId ?? "",
            floorId: expense.floorId ?? "",
            paymentMethod: expense.paymentMethod,
            invoiceNumber: expense.invoiceNumber ?? "",
            notes: expense.notes ?? "",
            materialCategoryId: expense.materialCategoryId ?? "",
            labourCategoryId: expense.labourCategoryId ?? "",
            serviceCategoryId: expense.serviceCategoryId ?? "",
            equipmentCategoryId: expense.equipmentCategoryId ?? "",
            professionalCategoryId: expense.professionalCategoryId ?? "",
            labourCalcMethod: expense.labourCalcMethod ?? "DAILY_WAGE",
            numberOfWorkers: expense.numberOfWorkers?.toString() ?? "",
            numberOfDays: expense.numberOfDays?.toString() ?? "",
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
      {expense.receipts.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-paper-200 bg-white p-4">
          <h2 className="font-display text-lg">Receipts</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {expense.receipts.map((receipt) => (
              <li key={receipt.id}>
                <a className="text-clay-700" href={`/api/receipts/${receipt.id}`} target="_blank" rel="noreferrer">
                  {receipt.fileName}
                </a>
                <span className="ml-2 text-ink-500">OCR {receipt.ocrStatus.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
