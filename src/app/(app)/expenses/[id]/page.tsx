import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { loadMasters } from "@/lib/masters";
import { ExpenseForm } from "@/components/expenses/expense-form";

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
    <div className="space-y-6">
      <ExpenseForm
        projectId={expense.projectId}
        expenseId={expense.id}
        initial={{
          expenseType: expense.expenseType,
          date: expense.date.toISOString().slice(0, 10),
          description: expense.description ?? "",
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
          dailyWorkers: expense.numberOfWorkers?.toString() ?? "",
          dailyDays: expense.numberOfDays?.toString() ?? "",
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

      {expense.receipts.length > 0 && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-paper-200 bg-white p-4 shadow-xs">
          <h3 className="font-display text-sm font-bold text-ink-900">Attached Receipts</h3>
          <ul className="mt-2 space-y-1.5 text-xs">
            {expense.receipts.map((receipt) => (
              <li key={receipt.id} className="flex items-center justify-between">
                <a
                  className="font-semibold text-clay-700 hover:underline"
                  href={`/api/receipts/${receipt.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {receipt.fileName}
                </a>
                <span className="text-[10px] uppercase font-bold text-ink-400">
                  {receipt.ocrStatus}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
