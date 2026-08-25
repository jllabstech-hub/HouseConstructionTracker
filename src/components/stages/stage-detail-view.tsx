"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Hammer,
  HardHat,
  Layers,
  Milestone,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Sparkles,
  Truck,
  Upload,
  User,
  Wallet,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import {
  CHRONOLOGICAL_CONSTRUCTION_STAGES,
  getStageConfig,
  type StageConfig,
} from "@/lib/catalog/stage-ordering";

export type StageDetailExpense = {
  id: string;
  date: string;
  type: string;
  category: { id: string; name: string };
  amount: string;
  description: string | null;
  vendorName: string | null;
  paymentMethod: string;
  quantity: string | null;
  unit: string | null;
  rate: string | null;
  receiptCount: number;
};

export type StageDetailDocument = {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  fileType: string;
  version: string | null;
  description: string | null;
};

export function StageDetailView({
  projectId,
  projectName,
  step,
  stageName,
  stageId,
  status,
  percentageComplete,
  expenses,
  documents,
  totals,
}: {
  projectId: string;
  projectName: string;
  step: number;
  stageName: string;
  stageId?: string;
  status: string;
  percentageComplete: number;
  expenses: StageDetailExpense[];
  documents: StageDetailDocument[];
  totals: {
    total: number;
    material: number;
    labour: number;
    machinery: number;
    billsCount: number;
  };
}) {
  const { language, t, getStageName } = useLanguage();
  const [filterType, setFilterType] = useState<"ALL" | "MATERIAL" | "LABOUR" | "OTHER">("ALL");
  const [search, setSearch] = useState("");

  const config = getStageConfig(stageName) || CHRONOLOGICAL_CONSTRUCTION_STAGES[step - 1];
  const prevStep = step > 1 ? step - 1 : null;
  const nextStep = step < 20 ? step + 1 : null;
  const prevStageConfig = prevStep ? CHRONOLOGICAL_CONSTRUCTION_STAGES[prevStep - 1] : null;
  const nextStageConfig = nextStep ? CHRONOLOGICAL_CONSTRUCTION_STAGES[nextStep - 1] : null;

  const filteredExpenses = expenses.filter((e) => {
    if (filterType === "MATERIAL" && e.type !== "MATERIAL") return false;
    if (filterType === "LABOUR" && e.type !== "LABOUR") return false;
    if (filterType === "OTHER" && (e.type === "MATERIAL" || e.type === "LABOUR")) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchDesc = e.description?.toLowerCase().includes(q);
      const matchVendor = e.vendorName?.toLowerCase().includes(q);
      const matchCat = e.category.name.toLowerCase().includes(q);
      if (!matchDesc && !matchVendor && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Top Navigation Stepper */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-paper-200 bg-white p-3 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <Link
            href="/stages"
            className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-paper-50 px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-paper-100 transition active:scale-95"
          >
            <Milestone className="h-3.5 w-3.5 text-clay-600" />
            <span>{t.stages?.allStagesTitle ?? "All 20 Stages"}</span>
          </Link>

          <span className="text-xs font-bold text-ink-500 bg-paper-100 px-2.5 py-1 rounded-lg">
            {language === "te" ? `దశ ${step} / 20` : `Stage ${step} of 20`}
          </span>
        </div>

        {/* Previous & Next Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {prevStep ? (
            <Link
              href={`/stages/${prevStep}`}
              className="inline-flex items-center gap-1 rounded-xl border border-paper-300 bg-white px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-clay-50 hover:text-clay-700 hover:border-clay-300 transition"
              title={prevStageConfig?.name}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === "te" ? "మునుపటిది:" : "Prev:"} {prevStageConfig?.shortName}
              </span>
              <span className="sm:hidden">{language === "te" ? "మునుపటిది" : "Prev"}</span>
            </Link>
          ) : (
            <div />
          )}

          {nextStep ? (
            <Link
              href={`/stages/${nextStep}`}
              className="inline-flex items-center gap-1 rounded-xl bg-clay-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-clay-700 transition shadow-xs active:scale-95"
              title={nextStageConfig?.name}
            >
              <span className="hidden sm:inline">
                {language === "te" ? "తరువాతిది:" : "Next:"} {nextStageConfig?.shortName}
              </span>
              <span className="sm:hidden">{language === "te" ? "తరువాతిది" : "Next"}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>

      {/* 2. Stage Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-ink-800 bg-gradient-to-br from-ink-900 via-ink-800 to-clay-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-clay-500/30 border border-clay-400/40 px-3 py-0.5 text-xs font-bold text-clay-200">
                {config?.phase ?? "STRUCTURAL"} PHASE
              </span>
              <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs font-bold text-paper-200">
                {language === "te" ? `క్రమ సంఖ్య: ${step}` : `Step #${step}`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl">{config?.icon ?? "🏗️"}</span>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                  {config?.name ?? stageName}
                </h1>
                <p className="text-base sm:text-lg text-clay-300 font-semibold mt-0.5">
                  {getStageName(stageName)}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Record Action in Hero */}
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2.5">
            <Link
              href={stageId ? `/expenses/new?stageId=${stageId}` : `/expenses/new`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-clay-500 hover:bg-clay-400 px-5 py-3 text-sm font-bold text-white shadow-md transition active:scale-95 text-center"
            >
              <Plus className="h-4 w-4" />
              <span>{t.stages?.recordExpenseForStage ?? "+ Record Bill / Wages for this Stage"}</span>
            </Link>

            <Link
              href="/documents"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2.5 text-xs font-bold text-paper-100 transition text-center"
            >
              <Layers className="h-4 w-4 text-clay-300" />
              <span>{t.stages?.uploadStageDrawing ?? "+ Upload Stage Drawing / Plan"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Stage Financial Breakdown (4 Metrics Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-3xl border border-paper-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-500">
            <Wallet className="h-4 w-4 text-clay-600" />
            <span>{t.stages?.spentOnStage ?? "Spent on Stage"}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-clay-800 mt-2">
            {formatINR(totals.total)}
          </p>
          <span className="text-[11px] font-medium text-ink-400 mt-0.5 block">
            {totals.billsCount} {language === "te" ? "బిల్లులు & పేమెంట్లు" : "bills & payments"}
          </span>
        </div>

        <div className="rounded-3xl border border-paper-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-500">
            <span>🧱</span>
            <span>{t.stages?.materialsPurchased ?? "Materials"}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink-900 mt-2">
            {formatINR(totals.material)}
          </p>
          <span className="text-[11px] font-medium text-ink-400 mt-0.5 block">
            {language === "te" ? "సిమెంట్, స్టీల్, ఇసుక..." : "Cement, Steel, Sand..."}
          </span>
        </div>

        <div className="rounded-3xl border border-paper-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-500">
            <span>👷</span>
            <span>{t.stages?.labourPaid ?? "Worker Wages"}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink-900 mt-2">
            {formatINR(totals.labour)}
          </p>
          <span className="text-[11px] font-medium text-ink-400 mt-0.5 block">
            {language === "te" ? "మేస్త్రీ & కూలీల చెల్లింపులు" : "Mason & Labour payouts"}
          </span>
        </div>

        <div className="rounded-3xl border border-paper-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-500">
            <Truck className="h-4 w-4 text-amber-600" />
            <span>{t.stages?.machineryPaid ?? "Machinery & Other"}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-ink-900 mt-2">
            {formatINR(totals.machinery)}
          </p>
          <span className="text-[11px] font-medium text-ink-400 mt-0.5 block">
            {language === "te" ? "JCB, రవాణా & అనుమతులు" : "JCB, Transport & Permits"}
          </span>
        </div>
      </div>

      {/* 4. 1-Tap Quick Presets for this Stage */}
      {config?.quickPresets && config.quickPresets.length > 0 ? (
        <div className="rounded-3xl border border-paper-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-clay-600" />
            <h3 className="font-display text-sm font-bold text-ink-900">
              {t.stages?.quickPresets ?? "1-Tap Stage Shortcuts & Quick Presets"}
            </h3>
          </div>
          <p className="text-xs text-ink-500">
            {language === "te"
              ? "ఈ దశలో ఎక్కువగా వాడే సామాగ్రి లేదా కూలీ ఖర్చును తక్షణమే నమోదు చేయడానికి కింద ఉన్న బటన్‌పై నొక్కండి:"
              : "Tap any common item below to instantly prefill and record it for this stage:"}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {config.quickPresets.map((preset, idx) => (
              <Link
                key={idx}
                href={
                  stageId
                    ? `/expenses/new?stageId=${stageId}&description=${encodeURIComponent(preset.description)}&amount=${preset.amount ?? ""}`
                    : `/expenses/new?description=${encodeURIComponent(preset.description)}`
                }
                className="group flex items-center justify-between rounded-2xl border border-paper-200 bg-paper-50 p-3 hover:border-clay-400 hover:bg-clay-50/50 transition active:scale-98"
              >
                <div>
                  <p className="text-xs font-bold text-ink-900 group-hover:text-clay-800">
                    {preset.label}
                  </p>
                  <p className="text-[11px] text-ink-500 line-clamp-1 mt-0.5">
                    {preset.description}
                  </p>
                </div>
                <span className="shrink-0 rounded-xl bg-white px-2 py-1 text-xs font-bold text-clay-700 border border-paper-200 group-hover:bg-clay-600 group-hover:text-white transition">
                  {preset.amount ? formatINR(preset.amount) : "+ Add"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* 5. Linked Blueprints & Drawings for this Stage */}
      <div className="rounded-3xl border border-paper-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-clay-600" />
            <h3 className="font-display text-base font-bold text-ink-900">
              {t.stages?.linkedDrawings ?? "Blueprints & Drawings for this Stage"}
            </h3>
          </div>

          <Link
            href="/documents"
            className="text-xs font-bold text-clay-600 hover:text-clay-800"
          >
            {t.stages?.uploadStageDrawing ?? "+ Upload Plan / Drawing"}
          </Link>
        </div>

        {documents.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-paper-200 bg-paper-50 p-3 hover:border-clay-400 hover:bg-clay-50/40 transition"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-paper-200 text-clay-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ink-900 group-hover:text-clay-800 truncate">
                    {doc.title}
                  </p>
                  <p className="text-[11px] text-ink-500 truncate">
                    {doc.version ? `v${doc.version} • ` : ""}{doc.category}
                  </p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-paper-300 bg-paper-50/50 p-5 text-center">
            <p className="text-xs text-ink-500 font-medium">
              {t.stages?.noDrawingsForStage ?? "No blueprints or drawings attached for this stage yet."}
            </p>
            <Link
              href="/documents"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-clay-600 hover:text-clay-800"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{t.stages?.uploadStageDrawing ?? "Upload Plan for this Stage"}</span>
            </Link>
          </div>
        )}
      </div>

      {/* 6. Stage Expenses Passbook Table */}
      <div className="rounded-3xl border border-paper-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-ink-900">
              {t.stages?.stagePassbook ?? "Stage Expense Passbook"}
            </h3>
            <p className="text-xs text-ink-500">
              {filteredExpenses.length} {language === "te" ? "బిల్లులు మరియు పేమెంట్లు" : "bills and payments recorded"}
            </p>
          </div>

          {/* Type Filter Chips */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={cn(
                "rounded-xl px-3 py-1 text-xs font-bold transition",
                filterType === "ALL" ? "bg-clay-600 text-white" : "bg-paper-100 text-ink-700 hover:bg-paper-200"
              )}
            >
              {language === "te" ? "అన్నీ" : "All"} ({expenses.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("MATERIAL")}
              className={cn(
                "rounded-xl px-3 py-1 text-xs font-bold transition",
                filterType === "MATERIAL" ? "bg-clay-600 text-white" : "bg-paper-100 text-ink-700 hover:bg-paper-200"
              )}
            >
              🧱 {language === "te" ? "సామాగ్రి" : "Materials"}
            </button>
            <button
              type="button"
              onClick={() => setFilterType("LABOUR")}
              className={cn(
                "rounded-xl px-3 py-1 text-xs font-bold transition",
                filterType === "LABOUR" ? "bg-clay-600 text-white" : "bg-paper-100 text-ink-700 hover:bg-paper-200"
              )}
            >
              👷 {language === "te" ? "కూలీలు" : "Labour"}
            </button>
          </div>
        </div>

        {/* Expenses List / Table */}
        {filteredExpenses.length > 0 ? (
          <div className="divide-y divide-paper-100 border-t border-paper-100">
            {filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between py-3 hover:bg-paper-50/60 rounded-xl px-2 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                      exp.type === "MATERIAL"
                        ? "bg-amber-100 text-amber-800"
                        : exp.type === "LABOUR"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    )}
                  >
                    {exp.type === "MATERIAL" ? "🧱" : exp.type === "LABOUR" ? "👷" : "🚜"}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-ink-900">
                        {exp.description || exp.category.name}
                      </p>
                      <span className="rounded-md bg-paper-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-600">
                        {exp.category.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-ink-500 mt-0.5">
                      <span>{exp.date}</span>
                      {exp.vendorName ? <span>• {exp.vendorName}</span> : null}
                      {exp.quantity && exp.rate ? (
                        <span>• {exp.quantity} {exp.unit} @ ₹{exp.rate}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-ink-900">
                    {formatINR(Number(exp.amount))}
                  </p>
                  <Link
                    href={`/expenses/${exp.id}`}
                    className="text-[11px] font-semibold text-clay-600 hover:text-clay-800"
                  >
                    {language === "te" ? "సవరించు →" : "Edit →"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-paper-200 bg-paper-50/50 p-8 text-center">
            <Receipt className="mx-auto h-8 w-8 text-ink-300 mb-2" />
            <p className="text-sm font-medium text-ink-600">
              {t.stages?.noExpensesForStage ?? "No expenses recorded for this stage yet."}
            </p>
            <Link
              href={stageId ? `/expenses/new?stageId=${stageId}` : `/expenses/new`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-clay-600 px-4 py-2 text-xs font-bold text-white hover:bg-clay-700 transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>{t.stages?.recordExpenseForStage ?? "+ Record Expense for this Stage"}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
