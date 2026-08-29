"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, TrendingUp, ShieldCheck } from "lucide-react";
import { formatINR } from "@/lib/money";

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
  const maxAmount = topCategories.length > 0 ? Math.max(...topCategories.map((c) => c.amount)) : 1;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* 1. Top Expense Categories */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-paper-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-clay-600" />
              <h2 className="font-display text-base font-bold text-ink-900 leading-tight">
                Top Expense Categories
              </h2>
            </div>
            <Link
              href="/expenses"
              className="inline-flex items-center gap-1 text-xs font-bold text-clay-700 hover:text-clay-900 transition"
            >
              <span>View all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3 mt-3">
            {topCategories.length === 0 ? (
              <p className="text-xs text-ink-400 italic py-4 text-center">
                No expense categories recorded yet
              </p>
            ) : (
              topCategories.slice(0, 5).map((cat, idx) => {
                const barWidth = Math.round((cat.amount / maxAmount) * 100);
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink-800">
                        {idx + 1}. {cat.name}
                      </span>
                      <span className="font-bold text-ink-900">{formatINR(cat.amount)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-paper-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-clay-600 transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 2. Budget Alerts (What Needs My Attention?) */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-paper-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h2 className="font-display text-base font-bold text-ink-900 leading-tight">
                Budget Alerts
              </h2>
            </div>
            <Link
              href="/budget"
              className="inline-flex items-center gap-1 text-xs font-bold text-clay-700 hover:text-clay-900 transition"
            >
              <span>Budget plan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-3">
            {budgetAlerts.length > 0 ? (
              <div className="space-y-2.5">
                {budgetAlerts.slice(0, 3).map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-xl bg-amber-50/70 border border-amber-200/80 p-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                      <span className="font-bold text-amber-900">{item.name}</span>
                    </div>
                    <span className="font-bold text-red-600">
                      +{formatINR(item.variance)} over
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-4 text-center text-xs space-y-1">
                <div className="flex justify-center">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="font-bold text-emerald-800 text-sm">
                  All Categories On Track
                </p>
                <p className="text-emerald-700 text-xs">
                  No budget overruns detected. Spending is healthy.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
