"use client";

import Link from "next/link";
import { formatINR } from "@/lib/money";
import { useLanguage } from "@/context/language-context";
import { Package, HardHat, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export type ExpenseRowData = {
  id: string;
  date: string;
  type: string;
  category: { id: string; name: string };
  amount: string;
  description: string | null;
  vendorName: string | null;
  stageName: string | null;
  floorName: string | null;
  paymentMethod: string;
  quantity: string | null;
  unit: string | null;
  rate: string | null;
  receiptCount: number;
};

function formatDisplayDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function ExpenseMobileCard({
  expense,
  onDelete,
}: {
  expense: ExpenseRowData;
  onDelete?: (expense: ExpenseRowData) => void;
}) {
  const { language } = useLanguage();

  const isMaterial = expense.type === "MATERIAL";
  const isLabour = expense.type === "LABOUR";

  // Build subtitle: e.g. "Material · ABC Traders" or "Labour · Ramesh Mason"
  const typeLabel = isMaterial
    ? language === "te" ? "సామాగ్రి" : "Material"
    : isLabour
    ? language === "te" ? "కూలీలు" : "Labour"
    : language === "te" ? "ఇతర" : "Other";

  const entitySubtitle = expense.vendorName
    ? `${typeLabel} · ${expense.vendorName}`
    : typeLabel;

  // Build quantity × rate formula if available
  const hasFormula = Boolean(expense.quantity && expense.rate);
  const formulaText = hasFormula
    ? `${expense.quantity} ${expense.unit ? expense.unit : "units"} × ₹${expense.rate}`
    : null;

  return (
    <div className="group relative rounded-2xl border border-paper-200 bg-white p-4 shadow-xs hover:border-clay-300 transition active:scale-[0.99]">
      <Link href={`/expenses/${expense.id}`} className="block space-y-2.5">
        {/* Row 1: Title & Icon + Amount */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-paper-100 mt-0.5 text-ink-700">
              {isMaterial ? (
                <Package className="h-4 w-4 text-clay-600" />
              ) : isLabour ? (
                <HardHat className="h-4 w-4 text-emerald-700" />
              ) : (
                <MoreHorizontal className="h-4 w-4 text-ink-600" />
              )}
            </div>

            <div className="min-w-0">
              {/* Category / Description */}
              <h3 className="text-sm font-bold text-ink-900 leading-snug truncate">
                {expense.category.name || expense.description}
              </h3>
              {/* Material · ABC Traders */}
              <p className="text-xs text-ink-500 truncate mt-0.5 font-medium">
                {entitySubtitle}
              </p>
            </div>
          </div>

          {/* Bold Currency Amount */}
          <div className="text-right shrink-0">
            <p className="font-display text-base sm:text-lg font-bold text-ink-900 leading-none">
              {formatINR(Number(expense.amount))}
            </p>
          </div>
        </div>

        {/* Row 2: Formula (e.g. 50 bags × ₹420) or Description */}
        {(formulaText || (expense.description && expense.description !== expense.category.name)) && (
          <div className="rounded-lg bg-paper-50/80 px-2.5 py-1 text-xs text-ink-600">
            {formulaText ? (
              <span className="font-semibold text-ink-800">{formulaText}</span>
            ) : (
              <span className="truncate block">{expense.description}</span>
            )}
          </div>
        )}

        {/* Row 3: Date & Footer Details + Actions */}
        <div className="flex items-center justify-between border-t border-paper-100 pt-2 text-[11px] text-ink-400">
          <span className="font-medium text-ink-500">
            {formatDisplayDate(expense.date)}
          </span>

          <div className="flex items-center gap-2">
            {expense.stageName && (
              <span className="rounded-md bg-paper-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-600 truncate max-w-[100px]">
                {expense.stageName}
              </span>
            )}
            <span className="text-[10px] uppercase font-bold text-ink-400">
              {expense.paymentMethod}
            </span>
            {/* Visible action buttons for touch devices */}
            <Link
              href={`/expenses/${expense.id}`}
              onClick={(e) => e.stopPropagation()}
              className="rounded-lg p-1.5 text-ink-400 hover:bg-paper-100 hover:text-clay-700 transition min-w-[28px] min-h-[28px] flex items-center justify-center"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Link>
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(expense);
                }}
                className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-700 transition min-w-[28px] min-h-[28px] flex items-center justify-center"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
