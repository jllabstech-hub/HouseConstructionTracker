"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  HardHat,
  MoreHorizontal,
  Package,
  Sliders,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { Drawer } from "@/components/ui/drawer";

export type TypeBudgetRow = {
  type: "MATERIAL" | "LABOUR" | "SERVICE" | "EQUIPMENT" | "PROFESSIONAL" | "OTHER";
  budget: number | string;
  actual: number | string;
  remaining: number | string;
  variance: number | string;
  isOver: boolean;
};

export type CategoryRiskItem = {
  name: string;
  type: string;
  budget: number;
  spent: number;
  variance: number;
  isOver: boolean;
};

function formatLakhsShort(amount: number): string {
  if (!amount || amount === 0) return "₹0";
  const abs = Math.abs(amount);
  const prefix = amount < 0 ? "-₹" : "₹";
  if (abs >= 10000000) {
    const cr = abs / 10000000;
    return `${prefix}${cr.toFixed(cr >= 10 ? 1 : 2).replace(/\.00$/, "").replace(/\.0$/, "")}Cr`;
  }
  if (abs >= 100000) {
    const l = abs / 100000;
    return `${prefix}${l.toFixed(l >= 10 ? 1 : 2).replace(/\.00$/, "").replace(/\.0$/, "")}L`;
  }
  if (abs >= 1000) {
    const k = abs / 1000;
    return `${prefix}${k.toFixed(k >= 10 ? 0 : 1).replace(/\.0$/, "")}K`;
  }
  return `${prefix}${abs.toLocaleString("en-IN")}`;
}

export function BudgetOverview({
  totalBudget,
  actualSpent,
  remainingCash,
  usedPercent,
  isOverallOver,
  typeRows,
  categoriesAtRisk = [],
  children,
}: {
  totalBudget: number | string;
  actualSpent: number | string;
  remainingCash: number | string;
  usedPercent: string;
  isOverallOver: boolean;
  typeRows: TypeBudgetRow[];
  categoriesAtRisk?: CategoryRiskItem[];
  projectId?: string;
  children?: React.ReactNode;
}) {
  const { language } = useLanguage();
  const [editorOpen, setEditorOpen] = useState(false);

  const numBudget = Number(totalBudget) || 0;
  const numSpent = Number(actualSpent) || 0;
  const numRemaining = Number(remainingCash) || 0;
  const numUsed = Number(usedPercent) || 0;
  const clampedPercent = Math.min(100, Math.max(0, numUsed));

  // Determine health state for overall budget
  const isWarning = !isOverallOver && numUsed >= 85 && numUsed <= 100;
  const isOver = isOverallOver || numUsed > 100;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper-200/80 pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">
            {language === "te" ? "బడ్జెట్ & ప్రణాళిక" : "Budget & Allocations"}
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-1">
            {language === "te"
              ? "నిర్మాణ వ్యయ ప్రణాళిక, వాస్తవ ఖర్చులు మరియు మిగిలిన బడ్జెట్"
              : "Track planned cost limits against actual construction expenditure."}
          </p>
        </div>

        {/* Manage Budget CTA */}
        {children && (
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-paper-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-ink-800 hover:bg-paper-50 active:scale-95 transition shadow-2xs self-start sm:self-auto whitespace-nowrap shrink-0"
          >
            <Sliders className="h-4 w-4 text-ink-600 shrink-0" />
            <span className="whitespace-nowrap">{language === "te" ? "బడ్జెట్ నిర్వహణ" : "Manage Budget"}</span>
          </button>
        )}
      </div>

      {/* 2. Top Core Financial Metrics: Budget, Spent, Remaining, Used % */}
      <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Budget */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500 block">
              {language === "te" ? "ప్లాన్ చేసిన బడ్జెట్" : "Budget (Planned)"}
            </span>
            <p className="font-display text-xl sm:text-2xl font-bold text-ink-900 leading-tight">
              {formatLakhsShort(numBudget)}
            </p>
            <p className="text-[11px] text-ink-400 font-medium">
              {formatINR(numBudget)}
            </p>
          </div>

          {/* Spent */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500 block">
              {language === "te" ? "వాస్తవ ఖర్చు" : "Spent (Actual)"}
            </span>
            <p className="font-display text-xl sm:text-2xl font-bold text-ink-900 leading-tight">
              {formatLakhsShort(numSpent)}
            </p>
            <p className="text-[11px] text-ink-400 font-medium">
              {formatINR(numSpent)}
            </p>
          </div>

          {/* Remaining */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500 block">
              {language === "te" ? "మిగిలిన నగదు" : "Remaining"}
            </span>
            <p
              className={cn(
                "font-display text-xl sm:text-2xl font-bold leading-tight",
                isOver ? "text-red-600" : isWarning ? "text-amber-700" : "text-emerald-700"
              )}
            >
              {formatLakhsShort(numRemaining)}
            </p>
            <p className="text-[11px] text-ink-400 font-medium">
              {isOver
                ? (language === "te" ? "బడ్జెట్ దాటింది" : "Over budget")
                : `${formatINR(numRemaining)} left`}
            </p>
          </div>

          {/* Used % */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500 block">
              {language === "te" ? "వినియోగ శాతం" : "Used %"}
            </span>
            <p
              className={cn(
                "font-display text-xl sm:text-2xl font-bold leading-tight",
                isOver ? "text-red-600" : isWarning ? "text-amber-700" : "text-emerald-700"
              )}
            >
              {numUsed.toFixed(1)}%
            </p>
            <p className="text-[11px] text-ink-400 font-medium">
              {isOver
                ? "Exceeded limit"
                : isWarning
                ? "Approaching limit"
                : "Healthy pace"}
            </p>
          </div>
        </div>

        {/* Subtle Overall Budget Progress Bar */}
        <div className="space-y-1 pt-1 border-t border-paper-100">
          <div className="h-2.5 w-full rounded-full bg-paper-100 overflow-hidden p-0.5">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                isOver ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-600"
              )}
              style={{ width: `${Math.max(clampedPercent, 2)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Budget by Primary Type: Material, Labour, Other */}
      <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-ink-900">
            {language === "te" ? "రకం వారీగా బడ్జెట్" : "Material, Labour & Other Allocations"}
          </h2>
          <p className="text-xs text-ink-500 mt-0.5">
            {language === "te"
              ? "సామాగ్రి కొనుగోళ్లు మరియు కూలీల చెల్లింపుల పరిమితులు"
              : "Direct comparison between planned targets and actual spending by category type."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {typeRows.map((row) => {
            const Icon =
              row.type === "MATERIAL"
                ? Package
                : row.type === "LABOUR"
                ? HardHat
                : MoreHorizontal;

            const label =
              row.type === "MATERIAL"
                ? (language === "te" ? "సామాగ్రి (Material)" : "Material")
                : row.type === "LABOUR"
                ? (language === "te" ? "కూలీలు (Labour)" : "Labour")
                : (language === "te" ? "ఇతర ఖర్చులు (Other)" : "Other Services");

            const numB = Number(row.budget);
            const numA = Number(row.actual);
            const numR = Number(row.remaining);
            const pct = numB > 0 ? (numA / numB) * 100 : 0;
            const isRowOver = row.isOver || pct > 100;
            const isRowWarning = !isRowOver && pct >= 85;

            return (
              <div
                key={row.type}
                className={cn(
                  "rounded-2xl border p-4 space-y-3 transition",
                  isRowOver
                    ? "border-red-200 bg-red-50/30"
                    : isRowWarning
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-paper-200 bg-paper-50/40"
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-paper-200 shadow-2xs text-ink-700">
                      <Icon className="h-4 w-4 text-clay-600" />
                    </div>
                    <span className="font-display text-sm font-bold text-ink-900">{label}</span>
                  </div>

                  <span
                    className={cn(
                      "text-xs font-bold font-display",
                      isRowOver ? "text-red-600" : isRowWarning ? "text-amber-700" : "text-emerald-700"
                    )}
                  >
                    {pct.toFixed(0)}%
                  </span>
                </div>

                {/* Numbers */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-ink-600">
                    <span>{language === "te" ? "బడ్జెట్:" : "Budget:"}</span>
                    <strong className="text-ink-900 font-display">{formatLakhsShort(numB)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-ink-600">
                    <span>{language === "te" ? "ఖర్చు:" : "Spent:"}</span>
                    <strong className="text-ink-900 font-display">{formatLakhsShort(numA)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-ink-600 border-t border-paper-200/60 pt-1">
                    <span>{language === "te" ? "మిగిలినది:" : "Remaining:"}</span>
                    <strong
                      className={cn(
                        "font-display font-bold",
                        isRowOver ? "text-red-600" : isRowWarning ? "text-amber-700" : "text-emerald-700"
                      )}
                    >
                      {formatLakhsShort(numR)}
                    </strong>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full rounded-full bg-paper-200/80 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isRowOver ? "bg-red-500" : isRowWarning ? "bg-amber-500" : "bg-emerald-600"
                    )}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Categories at Risk / Over Budget */}
      <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-ink-900">
            {language === "te" ? "పరిశీలించాల్సిన వర్గాలు (Where am I over budget?)" : "Categories at Risk & Over Budget"}
          </h2>
          <p className="text-xs text-ink-500 mt-0.5">
            {language === "te"
              ? "బడ్జెట్ పరిమితి దాటిన లేదా 85% పైగా ఖర్చు చేసిన వర్గాలు"
              : "Specific trades and materials that have exceeded or are nearing their target allocations."}
          </p>
        </div>

        {categoriesAtRisk.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {categoriesAtRisk.map((item) => {
              const numB = Number(item.budget);
              const numS = Number(item.spent);
              const varianceVal = Number(item.variance);
              const isItemOver = item.isOver || numS > numB;

              return (
                <div
                  key={item.name}
                  className={cn(
                    "rounded-2xl border p-4 space-y-2.5 transition",
                    isItemOver
                      ? "border-red-200 bg-red-50/40"
                      : "border-amber-200 bg-amber-50/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isItemOver ? (
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      )}
                      <h3 className="font-display text-sm font-bold text-ink-900 truncate">
                        {item.name}
                      </h3>
                    </div>

                    <span
                      className={cn(
                        "rounded-lg px-2 py-0.5 text-[10px] font-bold border",
                        isItemOver
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      )}
                    >
                      {isItemOver
                        ? `Over by ${formatLakhsShort(varianceVal)}`
                        : "Near Limit (>85%)"}
                    </span>
                  </div>

                  {/* Example Format: Tiles | Budget ₹1.50L | Spent ₹2.10L | Over by ₹60K */}
                  <div className="flex items-center justify-between text-xs text-ink-700 bg-white/80 rounded-xl p-2.5 border border-paper-200/60 font-medium">
                    <div>
                      <span className="text-ink-400 block text-[10px] uppercase font-bold">Budget</span>
                      <strong className="font-display text-xs text-ink-900">{formatLakhsShort(numB)}</strong>
                    </div>

                    <div className="text-center">
                      <span className="text-ink-400 block text-[10px] uppercase font-bold">Spent</span>
                      <strong className="font-display text-xs text-ink-900">{formatLakhsShort(numS)}</strong>
                    </div>

                    <div className="text-right">
                      <span className="text-ink-400 block text-[10px] uppercase font-bold">
                        {isItemOver ? "Over Budget" : "Remaining"}
                      </span>
                      <strong
                        className={cn(
                          "font-display text-xs font-bold",
                          isItemOver ? "text-red-600" : "text-amber-700"
                        )}
                      >
                        {isItemOver ? `+${formatLakhsShort(varianceVal)}` : formatLakhsShort(numB - numS)}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Healthy All Clear State */
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-emerald-900">
                {language === "te" ? "అన్ని వర్గాలు బడ్జెట్ పరిమితిలోనే ఉన్నాయి" : "All tracked categories are within budget"}
              </p>
              <p className="text-emerald-700 mt-0.5">
                {language === "te"
                  ? "ఏ వర్గంలోనూ బడ్జెట్ దాటలేదు లేదా ప్రమాదకర స్థితిలో లేదు."
                  : "No category has exceeded 85% of its allocated limit."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 5. Detailed Budget Editing Drawer */}
      {children && (
        <Drawer
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          title={language === "te" ? "బడ్జెట్ పరిమితులు సవరించండి" : "Manage Budget Allocations"}
          subtitle={language === "te" ? "మొత్తం బడ్జెట్ మరియు వర్గాల వారీ పరిమితులను సర్దుబాటు చేయండి" : "Set planned allocation targets for materials, labour and specific categories"}
          className="max-w-lg sm:max-w-xl"
        >
          {children}
        </Drawer>
      )}
    </div>
  );
}
