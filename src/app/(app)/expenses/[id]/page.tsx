import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Building, CreditCard, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { loadMasters } from "@/lib/masters";
import { formatINR } from "@/lib/money";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      project: true,
      materialCategory: true,
      labourCategory: true,
      serviceCategory: true,
      equipmentCategory: true,
      professionalCategory: true,
      vendor: true,
      worker: true,
      constructionStage: true,
      floor: true,
      receipts: true,
    },
  });

  if (!expense || expense.project.userId !== user.id) notFound();
  const masters = await loadMasters(user.id, expense.projectId);

  const categoryName =
    expense.materialCategory?.name ||
    expense.labourCategory?.name ||
    expense.serviceCategory?.name ||
    expense.equipmentCategory?.name ||
    expense.professionalCategory?.name ||
    expense.expenseType;

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Back Link */}
      <div>
        <Link
          href="/expenses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Expenses</span>
        </Link>
      </div>

      {/* 1. Itemized Expense Detail Hero Card */}
      <div className="rounded-3xl border border-paper-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-paper-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-lg px-2.5 py-0.5 text-xs font-bold ${
                  expense.expenseType === "MATERIAL"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : expense.expenseType === "LABOUR"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-purple-50 text-purple-700 border border-purple-200"
                }`}
              >
                {expense.expenseType}
              </span>
              <span className="text-xs font-semibold text-stone-500">• {categoryName}</span>
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
              {expense.description}
            </h1>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Total Amount</span>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              {formatINR(Number(expense.amount))}
            </span>
          </div>
        </div>

        {/* Key Parameter Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-stone-400 font-semibold flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Date
            </span>
            <span className="font-bold text-stone-800 block">
              {new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-stone-400 font-semibold flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5" /> Payment
            </span>
            <span className="font-bold text-stone-800 block">{expense.paymentMethod}</span>
          </div>

          <div className="space-y-1">
            <span className="text-stone-400 font-semibold flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> {expense.expenseType === "LABOUR" ? "Worker" : "Vendor / Store"}
            </span>
            <span className="font-bold text-stone-800 block">
              {expense.worker?.name ?? expense.vendor?.name ?? "—"}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-stone-400 font-semibold flex items-center gap-1">
              <Building className="h-3.5 w-3.5" /> Floor & Stage
            </span>
            <span className="font-bold text-stone-800 block">
              {expense.floor?.name ?? "—"} {expense.constructionStage ? `• ${expense.constructionStage.name}` : ""}
            </span>
          </div>
        </div>

        {/* Calculation / Unit details if material or labour */}
        {(expense.quantity || expense.rate || expense.numberOfWorkers) && (
          <div className="rounded-2xl bg-paper-50 p-4 border border-paper-200 text-xs flex flex-wrap items-center gap-4">
            {expense.quantity && (
              <div>
                <span className="text-stone-500 font-medium">Quantity: </span>
                <span className="font-bold text-stone-900">{expense.quantity.toString()} {expense.unit ?? "units"}</span>
              </div>
            )}
            {expense.rate && (
              <div>
                <span className="text-stone-500 font-medium">Rate: </span>
                <span className="font-bold text-stone-900">₹{expense.rate.toString()}</span>
              </div>
            )}
            {expense.numberOfWorkers && (
              <div>
                <span className="text-stone-500 font-medium">Workers: </span>
                <span className="font-bold text-stone-900">{expense.numberOfWorkers} workers × {expense.numberOfDays?.toString() ?? "1"} days</span>
              </div>
            )}
            {expense.invoiceNumber && (
              <div>
                <span className="text-stone-500 font-medium">Bill/Invoice #: </span>
                <span className="font-bold text-stone-900">{expense.invoiceNumber}</span>
              </div>
            )}
          </div>
        )}

        {/* Attached Receipts */}
        {expense.receipts.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-paper-100">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-clay-600" /> Attached Receipts & Invoices
            </span>
            <div className="flex flex-wrap gap-2">
              {expense.receipts.map((receipt) => (
                <a
                  key={receipt.id}
                  href={`/api/receipts/${receipt.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-paper-50 px-3 py-1.5 text-xs font-bold text-clay-700 hover:bg-paper-100 transition"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{receipt.fileName}</span>
                  <span className="text-[10px] uppercase text-stone-400 font-normal">({receipt.ocrStatus})</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Edit Expense Form */}
      <div className="rounded-3xl border border-paper-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="font-serif text-lg font-bold text-stone-900 border-b border-paper-100 pb-3">
          Edit Expense Details
        </h2>

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
            materialCategoryName: expense.materialCategory?.name ?? "",
            labourCategoryId: expense.labourCategoryId ?? "",
            labourCategoryName: expense.labourCategory?.name ?? "",
            serviceCategoryId: expense.serviceCategoryId ?? "",
            serviceCategoryName: expense.serviceCategory?.name ?? "",
            equipmentCategoryId: expense.equipmentCategoryId ?? "",
            equipmentCategoryName: expense.equipmentCategory?.name ?? "",
            professionalCategoryId: expense.professionalCategoryId ?? "",
            professionalCategoryName: expense.professionalCategory?.name ?? "",
            dailyWorkers: expense.numberOfWorkers?.toString() ?? "",
            dailyDays: expense.numberOfDays?.toString() ?? "",
          }}
          existingReceipts={expense.receipts.map((r) => ({
            id: r.id,
            fileName: r.fileName,
            mimeType: r.mimeType,
            sizeBytes: r.sizeBytes,
            ocrStatus: r.ocrStatus,
          }))}
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
    </div>
  );
}
