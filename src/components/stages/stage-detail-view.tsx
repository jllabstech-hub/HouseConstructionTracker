"use client";

import Link from "next/link";
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
import { useLanguage } from "@/context/language-context";
import { StageConfig } from "@/lib/catalog/stage-ordering";

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
  stageConfig,
  prevStage,
  nextStage,
  stageName,
  stageId,
  status,
  percentageComplete,
  expenses,
  documents,
  totalSpent,
  materialSpent,
  labourSpent,
  serviceSpent,
}: {
  projectId: string;
  projectName: string;
  step: number;
  stageConfig: StageConfig;
  prevStage: StageConfig | null;
  nextStage: StageConfig | null;
  stageName: string;
  stageId?: string;
  status: string;
  percentageComplete: number;
  expenses: StageDetailExpense[];
  documents: StageDetailDocument[];
  totalSpent: number;
  materialSpent: number;
  labourSpent: number;
  serviceSpent: number;
}) {
  const { language, t, getStageName } = useLanguage();
  const localizedStageTitle = getStageName(stageConfig.name);

  return (
    <div className="space-y-6">
      {/* 1. Top Sequential Stepper & Breadcrumb */}
      <div className="flex items-center justify-between border-b border-paper-200/80 pb-3">
        <Link
          href="/stages"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-600 hover:text-ink-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === "te" ? "అన్ని దశల జాబితా" : "All 20 Stages"}</span>
        </Link>

        <div className="flex items-center gap-2">
          {prevStage ? (
            <Link
              href={`/stages/${prevStage.step}`}
              className="inline-flex items-center gap-1 rounded-xl border border-paper-300 bg-white px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-paper-50 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">
                {prevStage.step}. {prevStage.shortName}
              </span>
            </Link>
          ) : (
            <span className="text-xs text-ink-400 opacity-50 px-2">First Stage</span>
          )}

          {nextStage ? (
            <Link
              href={`/stages/${nextStage.step}`}
              className="inline-flex items-center gap-1 rounded-xl border border-paper-300 bg-white px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-paper-50 transition"
            >
              <span className="hidden sm:inline">
                {nextStage.step}. {nextStage.shortName}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="text-xs text-ink-400 opacity-50 px-2">Final Stage</span>
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
                ? language === "te" ? "దశ 1: పునాది & బేస్‌మెంట్" : "Phase 1: Substructure & Foundation"
                : stageConfig.phase === "ROUGH_IN"
                ? language === "te" ? "దశ 2: గోడలు, స్లాబ్ & పైపులు" : "Phase 2: Superstructure & Framing"
                : stageConfig.phase === "FINISHING"
                ? language === "te" ? "దశ 3: ఫినిషింగ్ & అమరికలు" : "Phase 3: Finishing & Enclosure"
                : language === "te" ? "దశ 4: ఇంటీరియర్స్ & గృహప్రవేశం" : "Phase 4: Interiors & Handover"}
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 mt-2">
            {stageConfig.name}
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            {localizedStageTitle}
          </p>
        </div>

        {/* Primary CTA for this Stage */}
        <div className="shrink-0">
          <Link
            href={`/expenses/new?stageId=${stageId ?? stageConfig.step}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-clay-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-clay-700 active:scale-98 transition w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>{language === "te" ? "ఈ దశకు ఖర్చు నమోదు" : "Record Expense for this Stage"}</span>
          </Link>
        </div>
      </div>

      {/* 3. Financial Breakdown Strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Total Spent on Stage */}
        <div className="rounded-2xl border border-clay-200 bg-clay-50/40 p-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-clay-800">
            {language === "te" ? "ఈ దశలో ఖర్చు" : "Total Spent on Stage"}
          </span>
          <p className="font-display text-2xl font-bold text-ink-900 mt-1">
            {formatINR(totalSpent)}
          </p>
          <p className="text-xs text-ink-500 mt-1 font-medium">
            {expenses.length} {language === "te" ? "లావాదేవీలు" : "transactions"}
          </p>
        </div>

        {/* Material Purchases */}
        <div className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-600">
            <Package className="h-4 w-4 text-clay-600" />
            <span>{language === "te" ? "సామాగ్రి" : "Material"}</span>
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
            <span>{language === "te" ? "కూలీలు" : "Labour"}</span>
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
              {language === "te" ? "ఈ దశకు సాధారణ సామాగ్రి & కూలీల షార్ట్‌కట్స్" : "Common Materials & Labour for this Stage"}
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">
              {language === "te" ? "త్వరిత నమోదు కోసం క్రింది ఐటమ్ పై క్లిక్ చేయండి" : "Click any preset to pre-fill an expense"}
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
              {language === "te" ? "ఈ దశకు సంబంధించిన ఖర్చులు" : "Expenses for this Stage"}
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">
              {expenses.length} {language === "te" ? "నమోదైన లావాదేవీలు" : "transactions recorded"}
            </p>
          </div>

          <Link
            href={`/expenses/new?stageId=${stageId ?? stageConfig.step}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-clay-700 hover:text-clay-900 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{language === "te" ? "ఖర్చు నమోదు" : "Add Expense"}</span>
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
                    {language === "te" ? "సవరించు" : "Edit"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-ink-400">
            {language === "te" ? "ఈ దశకు ఖర్చులు ఏవీ నమోదు కాలేదు." : "No expenses recorded for this stage yet."}
          </div>
        )}
      </div>

      {/* 6. Linked Blueprints & Drawings */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-paper-100 pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-ink-900">
              {language === "te" ? "ఈ దశకు డాక్యుమెంట్లు" : "Linked Documents & Plans"}
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">
              {language === "te" ? "స్ట్రక్చరల్ మరియు వర్కింగ్ ప్లాన్లు" : "Relevant architectural and structural drawings"}
            </p>
          </div>

          <Link
            href="/documents"
            className="inline-flex items-center gap-1 text-xs font-bold text-clay-700 hover:text-clay-900 transition"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>{language === "te" ? "ప్లాన్ అప్‌లోడ్" : "Upload Plan"}</span>
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
            {language === "te" ? "ఈ దశకు ప్రత్యేక ప్లాన్లు ఏవీ జోడించబడలేదు." : "No drawings attached to this stage yet."}
          </div>
        )}
      </div>
    </div>
  );
}
