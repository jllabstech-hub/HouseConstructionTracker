"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/money";
import { useLanguage } from "@/context/language-context";

export type TopCategoryItem = {
  name: string;
  amount: number;
};

export type BudgetAlertItem = {
  name: string;
  variance: number;
};

export function TopExpensesAndAlerts({
  topCategories,
  budgetAlerts,
}: {
  topCategories: TopCategoryItem[];
  budgetAlerts: BudgetAlertItem[];
}) {
  const { language } = useLanguage();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Top Expense Categories */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-paper-100">
            <h2 className="font-display text-base font-bold text-ink-900 leading-tight">
              {language === "te" ? "అత్యధిక ఖర్చులు" : "Top Expenses"}
            </h2>
            <Link
              href="/expenses"
              className="inline-flex items-center gap-1 text-xs font-bold text-clay-700 hover:text-clay-900 transition"
            >
              <span>{language === "te" ? "అన్నీ చూడండి" : "View all"}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-paper-100 mt-1">
            {topCategories.slice(0, 5).map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between py-2.5 text-xs">
                <span className="font-semibold text-ink-800">
                  {idx + 1}. {cat.name}
                </span>
                <span className="font-bold text-ink-900">{formatINR(cat.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget Alerts or Healthy Status */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-paper-100">
            <h2 className="font-display text-base font-bold text-ink-900 leading-tight flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>{language === "te" ? "బడ్జెట్ హెచ్చరికలు" : "Budget Alerts"}</span>
            </h2>
            <Link
              href="/budget"
              className="inline-flex items-center gap-1 text-xs font-bold text-clay-700 hover:text-clay-900 transition"
            >
              <span>{language === "te" ? "బడ్జెట్ ప్లాన్" : "Budget details"}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-2">
            {budgetAlerts.length > 0 ? (
              <div className="space-y-2">
                {budgetAlerts.slice(0, 3).map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-xl bg-amber-50/60 border border-amber-200/70 p-2.5 text-xs"
                  >
                    <span className="font-bold text-amber-900">{item.name}</span>
                    <span className="font-bold text-red-600">
                      +{formatINR(item.variance)} {language === "te" ? "అదనంగా" : "over"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-50/60 border border-emerald-200/70 p-4 text-center text-xs">
                <p className="font-bold text-emerald-800">
                  {language === "te" ? "అన్ని ఖర్చులు బడ్జెట్ పరిధిలోనే ఉన్నాయి" : "All categories within planned budget"}
                </p>
                <p className="text-emerald-600 mt-0.5">
                  {language === "te" ? "ప్రస్తుతం ఏ ఖర్చు కూడా బడ్జెట్ దాటలేదు" : "No budget overruns detected so far"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
