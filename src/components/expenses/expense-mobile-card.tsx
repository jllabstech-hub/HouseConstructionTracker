"use client";

import Link from "next/link";
import { formatINR } from "@/lib/money";
import { useLanguage } from "@/context/language-context";
import { Package, HardHat, MoreHorizontal } from "lucide-react";

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

export function ExpenseMobileCard({ expense }: { expense: ExpenseRowData }) {
  const { language } = useLanguage();

  const isMaterial = expense.type === "MATERIAL";
  const isLabour = expense.type === "LABOUR";

  return (
    <div className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper-100 mt-0.5 text-ink-700">
            {isMaterial ? (
              <Package className="h-4 w-4 text-clay-600" />
            ) : isLabour ? (
              <HardHat className="h-4 w-4 text-emerald-700" />
            ) : (
              <MoreHorizontal className="h-4 w-4 text-ink-600" />
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-ink-900 leading-snug truncate">
              {expense.description || expense.category.name}
            </p>
            <p className="text-xs text-ink-500 truncate mt-0.5">
              {expense.category.name}
              {expense.vendorName ? ` · ${expense.vendorName}` : ""}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="font-display text-base font-bold text-ink-900">
            {formatINR(Number(expense.amount))}
          </p>
          <span className="text-[10px] font-bold text-ink-400 uppercase">
            {expense.paymentMethod}
          </span>
        </div>
      </div>

      {/* Details breakdown */}
      <div className="flex items-center justify-between border-t border-paper-100 pt-2 text-[11px] text-ink-500">
        <div className="flex items-center gap-2">
          <span>{expense.date}</span>
          {expense.quantity && expense.rate && (
            <span>
              • {expense.quantity} {expense.unit} @ ₹{expense.rate}
            </span>
          )}
        </div>

        <Link
          href={`/expenses/${expense.id}`}
          className="font-semibold text-clay-600 hover:text-clay-800"
        >
          {language === "te" ? "సవరించు" : "Edit"}
        </Link>
      </div>
    </div>
  );
}
