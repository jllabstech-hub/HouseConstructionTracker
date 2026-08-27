"use client";

import Link from "next/link";
import { Plus, Building2, Wallet, PiggyBank, Landmark } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { AnimatedNumber } from "@/components/ui/animated-number";

export function FinancialHero({
  projectName,
  location,
  currentStageName,
  totalSpent,
  totalBudget,
  remainingBudget,
  usedPercent,
  billsCount,
}: {
  projectName: string;
  location?: string | null;
  currentStageName?: string | null;
  totalSpent: number;
  totalBudget: number;
  remainingBudget: number;
  usedPercent: number;
  billsCount: number;
}) {
  const { language, t, getStageName } = useLanguage();
  const isOverBudget = remainingBudget < 0;
  const clampedPercent = Math.min(100, Math.max(0, usedPercent));

  return (
    <div className="space-y-5">
      {/* 1. Project Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/projects"
              className="font-display text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight hover:text-clay-800 transition"
              title="View all projects"
            >
              {projectName}
            </Link>
            {location && (
              <span className="rounded-md bg-paper-100 px-2.5 py-0.5 text-xs font-semibold text-ink-600">
                {location}
              </span>
            )}
            <span className="rounded-md bg-clay-50 border border-clay-200/60 px-2.5 py-0.5 text-xs font-semibold text-clay-800">
              {currentStageName
                ? getStageName(currentStageName)
                : language === "te"
                ? "పునాది & నిర్మాణం"
                : "Foundation & Structure"}
            </span>
          </div>
          <p className="text-xs text-ink-500 mt-1">
            {language === "te"
              ? "ఇంటి నిర్మాణ ఖర్చుల సమగ్ర నివేదిక"
              : "Live home construction financial dashboard"}
          </p>
        </div>

        {/* Primary CTA (+ Add Expense) & Secondary (+ New House) */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Link
            href="/projects/new"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-paper-300 bg-white hover:bg-paper-50 px-3.5 py-2 text-xs font-bold text-ink-800 shadow-2xs transition active:scale-95"
            title="Create a new house project"
          >
            <Building2 className="h-4 w-4 text-clay-600" />
            <span>{language === "te" ? "+ కొత్త ఇల్లు" : "+ New House"}</span>
          </Link>

          <Link
            href="/expenses/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-clay-600 hover:bg-clay-700 px-5 py-2.5 text-sm font-bold text-white shadow-xs transition active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>{t.nav?.addExpense ?? "+ Add Expense"}</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Financial Questions: Total Spent | Budget | Remaining */}
      <div className="grid gap-3.5 sm:grid-cols-3">
        {/* Question 1: How much have I spent? */}
        <div className="rounded-2xl border border-clay-200 bg-clay-50/40 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-clay-800">
                {language === "te" ? "మొత్తం ఖర్చు" : "Total Spent"}
              </span>
              <Wallet className="h-4 w-4 text-clay-600" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-bold text-ink-900 mt-2">
              <AnimatedNumber value={totalSpent} />
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-ink-500 font-medium pt-2.5 border-t border-clay-100">
            <span>
              {billsCount} {language === "te" ? "లావాదేవీలు" : "transactions"}
            </span>
            <span className="font-semibold text-clay-700">
              {clampedPercent.toFixed(1)}% {language === "te" ? "వాడారు" : "used"}
            </span>
          </div>
        </div>

        {/* Planned Budget */}
        <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                {language === "te" ? "మొత్తం బడ్జెట్" : "Total Budget"}
              </span>
              <PiggyBank className="h-4 w-4 text-ink-400" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-bold text-ink-900 mt-2">
              <AnimatedNumber value={totalBudget} />
            </p>
          </div>
          <div className="mt-4 text-xs text-ink-400 font-medium pt-2.5 border-t border-paper-100">
            {language === "te" ? "ప్రణాళికాబద్ధ అంచనా" : "Planned budget target"}
          </div>
        </div>

        {/* Question 2: How much budget remains? */}
        <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
                {language === "te" ? "మిగిలిన బడ్జెట్" : "Budget Remaining"}
              </span>
              <Landmark className={`h-4 w-4 ${isOverBudget ? "text-red-500" : "text-emerald-600"}`} />
            </div>
            <p
              className={`font-display text-2xl sm:text-3xl font-bold mt-2 ${
                isOverBudget ? "text-red-600" : "text-emerald-700"
              }`}
            >
              <AnimatedNumber value={remainingBudget} />
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs pt-2.5 border-t border-paper-100">
            <span className={isOverBudget ? "font-semibold text-red-600" : "text-ink-500"}>
              {isOverBudget
                ? language === "te"
                  ? "బడ్జెట్ దాటింది"
                  : "Over budget"
                : language === "te"
                ? "పరిధిలో ఉంది"
                : "Available cash"}
            </span>
            <span className="font-semibold text-ink-700">
              {(100 - clampedPercent).toFixed(1)}% {language === "te" ? "మిగిలింది" : "left"}
            </span>
          </div>
        </div>
      </div>

      {/* Budget Pacing Progress Bar */}
      <div className="rounded-xl border border-paper-200 bg-white p-3.5 shadow-xs">
        <div className="flex items-center justify-between text-xs font-medium text-ink-600 mb-1.5">
          <span>{language === "te" ? "బడ్జెట్ వినియోగ శాతం" : "Budget Consumed"}</span>
          <span className="font-bold text-ink-900">{clampedPercent.toFixed(1)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-paper-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isOverBudget ? "bg-red-500" : clampedPercent > 85 ? "bg-amber-500" : "bg-clay-600"
            }`}
            style={{ width: `${clampedPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
