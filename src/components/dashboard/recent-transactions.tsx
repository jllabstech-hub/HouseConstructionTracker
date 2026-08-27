"use client";

import Link from "next/link";
import { ArrowRight, Package, HardHat, MoreHorizontal } from "lucide-react";
import { formatINR } from "@/lib/money";
import { useLanguage } from "@/context/language-context";

export type RecentExpenseItem = {
  id: string;
  date: string;
  type: string;
  categoryName: string;
  description: string | null;
  vendorName: string | null;
  amount: number;
};

export function RecentTransactions({
  expenses,
}: {
  expenses: RecentExpenseItem[];
}) {
  const { language } = useLanguage();

  if (expenses.length === 0) return null;

  return (
    <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-paper-100">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-ink-900 leading-tight">
            {language === "te" ? "ఇటీవలి ఖర్చులు" : "Recent Expenses"}
          </h2>
          <p className="text-xs text-ink-500 mt-0.5">
            {language === "te" ? "చివరిగా నమోదు చేసిన 5 లావాదేవీలు" : "Latest 5 recorded transactions"}
          </p>
        </div>

        <Link
          href="/expenses"
          className="inline-flex items-center gap-1 text-xs font-bold text-clay-700 hover:text-clay-900 transition"
        >
          <span>{language === "te" ? "అన్ని ఖర్చులు" : "View all expenses"}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-paper-100">
        {expenses.slice(0, 5).map((exp) => (
          <div
            key={exp.id}
            className="flex items-center justify-between py-3 hover:bg-paper-50/60 rounded-xl px-2 transition gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-paper-100 text-ink-700">
                {exp.type === "MATERIAL" ? (
                  <Package className="h-4 w-4 text-clay-600" />
                ) : exp.type === "LABOUR" ? (
                  <HardHat className="h-4 w-4 text-emerald-700" />
                ) : (
                  <MoreHorizontal className="h-4 w-4 text-ink-600" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-ink-900 truncate">
                  {exp.description || exp.categoryName}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-ink-500 truncate mt-0.5">
                  <span>{exp.date}</span>
                  {exp.vendorName && <span>• {exp.vendorName}</span>}
                  <span>• {exp.categoryName}</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 pl-3">
              <p className="text-xs sm:text-sm font-bold text-ink-900">
                {formatINR(exp.amount)}
              </p>
              <Link
                href={`/expenses/${exp.id}`}
                className="text-[11px] font-semibold text-clay-600 hover:text-clay-800 transition"
              >
                {language === "te" ? "సవరించు" : "Edit"}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
