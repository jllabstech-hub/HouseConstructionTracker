"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Files,
  HardHat,
  MoreHorizontal,
  Package,
  Plus,
  UploadCloud,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { StageConfig, CHRONOLOGICAL_CONSTRUCTION_STAGES } from "@/lib/catalog/stage-ordering";

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
  stageConfig,
  prevStage,
  nextStage,
  stageId,
  expenses,
  documents,
  totalSpent,
  materialSpent,
  labourSpent,
}: {
  projectId?: string;
  projectName?: string;
  step?: number;
  stageConfig: StageConfig;
  prevStage: StageConfig | null;
  nextStage: StageConfig | null;
  stageName?: string;
  stageId?: string;
  status?: string;
  percentageComplete?: number;
  expenses: StageDetailExpense[];
  documents: StageDetailDocument[];
  totalSpent: number;
  materialSpent: number;
  labourSpent: number;
  serviceSpent?: number;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* 1. Top Sequential Stepper & Breadcrumb */}
      <div className="flex items-center justify-between border-b border-paper-200/80 pb-3 flex-wrap gap-2.5">
        <Link
          href="/stages"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-600 hover:text-ink-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>All 20 Stages</span>
        </Link>

        {/* Stage Navigation: Previous Button + Direct Select Dropdown + Next Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {prevStage ? (
            <Link
              href={`/stages/${prevStage.step}`}
              className="inline-flex items-center gap-1 rounded-xl border border-paper-300 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-paper-50 hover:border-clay-400 shadow-2xs transition"
              title={`Previous: ${prevStage.step}. ${prevStage.name}`}
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">
                {prevStage.step}. {prevStage.shortName}
              </span>
              <span className="md:hidden">Prev</span>
            </Link>
          ) : (
            <span className="text-[11px] font-semibold text-ink-400 opacity-50 px-2">First</span>
          )}

          {/* Quick Jump Stage Dropdown */}
          <div className="relative">
            <select
              aria-label="Select construction stage"
              value={stageConfig.step}
              onChange={(e) => {
                const target = e.target.value;
                if (target) {
                  router.push(`/stages/${target}`);
                }
              }}
              className="rounded-xl border border-clay-300 bg-clay-50/80 hover:bg-white hover:border-clay-500 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-clay-900 shadow-2xs focus:border-clay-600 focus:outline-none cursor-pointer transition max-w-[220px] sm:max-w-xs truncate"
            >
              <optgroup label="── Phase 1: Substructure & Foundation ──">
                {CHRONOLOGICAL_CONSTRUCTION_STAGES.filter((s) => s.phase === "STRUCTURAL").map((s) => (
                  <option key={s.step} value={s.step}>
                    Stage {s.step}: {s.shortName} ({s.name})
                  </option>
                ))}
              </optgroup>
              <optgroup label="── Phase 2: Superstructure & Framing ──">
                {CHRONOLOGICAL_CONSTRUCTION_STAGES.filter((s) => s.phase === "ROUGH_IN").map((s) => (
                  <option key={s.step} value={s.step}>
                    Stage {s.step}: {s.shortName} ({s.name})
                  </option>
                ))}
              </optgroup>
              <optgroup label="── Phase 3: Finishing & Enclosure ──">
                {CHRONOLOGICAL_CONSTRUCTION_STAGES.filter((s) => s.phase === "FINISHING").map((s) => (
                  <option key={s.step} value={s.step}>
                    Stage {s.step}: {s.shortName} ({s.name})
                  </option>
                ))}
              </optgroup>
              <optgroup label="── Phase 4: Interiors & Handover ──">
                {CHRONOLOGICAL_CONSTRUCTION_STAGES.filter((s) => s.phase === "INTERIORS").map((s) => (
                  <option key={s.step} value={s.step}>
                    Stage {s.step}: {s.shortName} ({s.name})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {nextStage ? (
            <Link
              href={`/stages/${nextStage.step}`}
              className="inline-flex items-center gap-1 rounded-xl border border-paper-300 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-paper-50 hover:border-clay-400 shadow-2xs transition"
              title={`Next: ${nextStage.step}. ${nextStage.name}`}
            >
              <span className="hidden md:inline">
                {nextStage.step}. {nextStage.shortName}
              </span>
              <span className="md:hidden">Next</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </Link>
          ) : (
            <span className="text-[11px] font-semibold text-ink-400 opacity-50 px-2">Final</span>
          )}
        </div>
      </div>

      {/* 2. Hero Header Card */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-md bg-clay-100 px-2 py-0.5 text-xs font-bold text-clay-800">
              Stage {stageConfig.step} of 20
            </span>
            <span className="rounded-md bg-paper-100 px-2.5 py-0.5 text-xs font-bold text-ink-700">
              {stageConfig.phase === "STRUCTURAL"
                ? "Phase 1: Substructure & Foundation"
                : stageConfig.phase === "ROUGH_IN"
                ? "Phase 2: Superstructure & Framing"
                : stageConfig.phase === "FINISHING"
                ? "Phase 3: Finishing & Enclosure"
                : "Phase 4: Interiors & Handover"}
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 mt-2">
            {stageConfig.name}
          </h1>
        </div>

        {/* Primary CTA for this Stage */}
        <div className="shrink-0">
          <Link
            href={`/expenses/new?stageId=${stageId ?? stageConfig.step}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-clay-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-clay-700 active:scale-98 transition w-full sm:w-auto whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[2.5] shrink-0" />
            <span className="whitespace-nowrap">Record Expense</span>
          </Link>
        </div>
      </div>

      {/* 3. Financial Breakdown Strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Total Spent on Stage */}
        <div className="rounded-2xl border border-clay-200 bg-clay-50/40 p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-clay-800">
            Total Spent on Stage
          </span>
          <p className="font-display text-2xl font-bold text-ink-900 mt-1">
            {formatINR(totalSpent)}
          </p>
          <p className="text-xs text-ink-500 mt-1 font-medium">
            {expenses.length} transactions
          </p>
        </div>

        {/* Material Purchases */}
        <div className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-600">
            <Package className="h-4 w-4 text-clay-600" />
            <span>Material</span>
          </div>
          <p className="font-display text-2xl font-bold text-ink-900 mt-1">
            {formatINR(materialSpent)}
          </p>
          <p className="text-xs text-ink-400 mt-1">
            {totalSpent > 0 ? `${Math.round((materialSpent / totalSpent) * 100)}% of stage` : "—"}
          </p>
        </div>

        {/* Labour Payments */}
        <div className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-600">
            <HardHat className="h-4 w-4 text-emerald-700" />
            <span>Labour</span>
          </div>
          <p className="font-display text-2xl font-bold text-ink-900 mt-1">
            {formatINR(labourSpent)}
          </p>
          <p className="text-xs text-ink-400 mt-1">
            {totalSpent > 0 ? `${Math.round((labourSpent / totalSpent) * 100)}% of stage` : "—"}
          </p>
        </div>
      </div>

      {/* 4. Common Materials & Wage Presets */}
      {stageConfig.quickPresets && stageConfig.quickPresets.length > 0 && (
        <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-3">
          <div>
            <h3 className="font-display text-sm font-bold text-ink-900">
              Common Materials & Labour for this Stage
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">
              Click any preset to pre-fill an expense
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {stageConfig.quickPresets.map((preset) => (
              <Link
                key={preset.label}
                href={`/expenses/new?stageId=${stageId ?? stageConfig.step}&description=${encodeURIComponent(preset.description || preset.label)}&amount=${preset.amount || ""}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-paper-200 bg-paper-50 px-3 py-1.5 text-xs font-semibold text-ink-800 hover:bg-clay-50 hover:text-clay-800 hover:border-clay-300 transition"
              >
                {preset.type === "MATERIAL" ? (
                  <Package className="h-3.5 w-3.5 text-clay-600" />
                ) : (
                  <HardHat className="h-3.5 w-3.5 text-emerald-700" />
                )}
                <span>{preset.label}</span>
                {preset.amount && (
                  <span className="text-[10px] text-ink-400">({formatINR(preset.amount)})</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 5. Stage Passbook (Expenses recorded for this stage) */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-paper-100 pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-ink-900">
              Expenses for this Stage
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">
              {expenses.length} transactions recorded
            </p>
          </div>

          <Link
            href={`/expenses/new?stageId=${stageId ?? stageConfig.step}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-clay-700 hover:text-clay-900 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Expense</span>
          </Link>
        </div>

        {expenses.length > 0 ? (
          <div className="divide-y divide-paper-100">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between py-3 hover:bg-paper-50/50 rounded-lg px-2 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper-100 text-ink-700">
                    {exp.type === "MATERIAL" ? (
                      <Package className="h-4 w-4 text-clay-600" />
                    ) : exp.type === "LABOUR" ? (
                      <HardHat className="h-4 w-4 text-emerald-700" />
                    ) : (
                      <MoreHorizontal className="h-4 w-4 text-ink-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink-900 truncate">
                      {exp.description || exp.category.name}
                    </p>
                    <p className="text-[11px] text-ink-500 truncate">
                      {exp.date} {exp.vendorName ? `• ${exp.vendorName}` : ""}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <p className="font-display text-sm font-bold text-ink-900">
                    {formatINR(Number(exp.amount))}
                  </p>
                  <Link
                    href={`/expenses/${exp.id}`}
                    className="text-[10px] font-semibold text-clay-600 hover:text-clay-800"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-ink-400">
            No expenses recorded for this stage yet.
          </div>
        )}
      </div>

      {/* 6. Linked Blueprints & Drawings */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-paper-100 pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-ink-900">
              Linked Documents & Plans
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">
              Relevant architectural and structural drawings
            </p>
          </div>

          <Link
            href="/documents"
            className="inline-flex items-center gap-1 text-xs font-bold text-clay-700 hover:text-clay-900 transition"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload Plan</span>
          </Link>
        </div>

        {documents.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-xl border border-paper-200 bg-paper-50 p-3 hover:bg-paper-100 transition"
              >
                <Files className="h-4 w-4 text-clay-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink-900 truncate">{doc.title}</p>
                  <p className="text-[10px] text-ink-500">{doc.category}</p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-ink-400">
            No drawings attached to this stage yet.
          </div>
        )}
      </div>
    </div>
  );
}
