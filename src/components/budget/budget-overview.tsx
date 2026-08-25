"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  HardHat,
  MoreHorizontal,
  Package,
  Pencil,
  Sliders,
  Wallet,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

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

export function BudgetOverview({
  totalBudget,
  actualSpent,
  remainingCash,
  usedPercent,
  isOverallOver,
  typeRows,
  categoriesAtRisk = [],
  projectId,
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
  const { language, t } = useLanguage();
  const [editorOpen, setEditorOpen] = useState(false);

  const numUsed = Number(usedPercent) || 0;
  const clampedPercent = Math.min(100, Math.max(0, numUsed));

  return (
    <div className="space-y-6">
      {/* 1. Header & Manage Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-paper-200/80 pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
            {language === "te" ? "బడ్జెట్ & పరిమితులు" : "Budget & Variance"}
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            {language === "te"
              ? "ప్రణాళికాబద్ధ బడ్జెట్ మరియు వాస్తవ ఖర్చుల పోలిక"
              : "Track planned allocations against actual construction expenditure"}
          </p>
        </div>

        {/* Manage Budget Button */}
        {children && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setEditorOpen(true)}
            className="rounded-xl border-paper-300 bg-white hover:bg-paper-50 shadow-2xs shrink-0"
          >
            <Sliders className="h-4 w-4 text-ink-600" />
            <span>{language === "te" ? "బడ్జెట్ సవరించండి" : "Manage Budget"}</span>
          </Button>
        )}
      </div>

      {/* 2. Top 3 Big Financial Anchor Numbers */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Planned Total */}
        <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
            {language === "te" ? "ప్లాన్ చేసిన బడ్జెట్" : "Total Planned Budget"}
          </span>
          <p className="font-display text-2xl sm:text-3xl font-bold text-ink-900 mt-1">
            {formatINR(totalBudget)}
          </p>
          <p className="text-xs text-ink-400 mt-1">
            {language === "te" ? "మొత్తం నిర్మాణ అంచనా" : "Overall planned limit"}
          </p>
        </div>

        {/* Actual Spent */}
        <div className="rounded-2xl border border-clay-200 bg-clay-50/40 p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-clay-800">
            {language === "te" ? "వాస్తవ ఖర్చు" : "Actual Spent"}
          </span>
          <p className="font-display text-2xl sm:text-3xl font-bold text-ink-900 mt-1">
            {formatINR(actualSpent)}
          </p>
          <p className="text-xs text-clay-700 mt-1 font-semibold">
            {numUsed.toFixed(1)}% {language === "te" ? "వినియోగించారు" : "consumed"}
          </p>
        </div>

        {/* Remaining Cash */}
        <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
            {language === "te" ? "మిగిలిన నగదు" : "Remaining Cash"}
          </span>
          <p
            className={cn(
              "font-display text-2xl sm:text-3xl font-bold mt-1",
              isOverallOver ? "text-red-600" : "text-emerald-700"
            )}
          >
            {formatINR(remainingCash)}
          </p>
          <p className="text-xs text-ink-400 mt-1">
            {isOverallOver
              ? (language === "te" ? "బడ్జెట్ పరిమితి దాటింది" : "Exceeded budget")
              : (language === "te" ? "ఖర్చులకు అందుబాటులో ఉంది" : "Available to spend")}
          </p>
        </div>
      </div>

      {/* 3. Budget by Broad Type (Material, Labour, Other) */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-4">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-ink-900">
            {language === "te" ? "రకం వారీగా బడ్జెట్ (సామాగ్రి vs కూలీలు)" : "Budget by Type (Material vs Labour vs Other)"}
          </h2>
          <p className="text-xs text-ink-500 mt-0.5">
            {language === "te"
              ? "సామాగ్రి మరియు కూలీల బడ్జెట్ పరిమితులు విడివిడిగా పర్యవేక్షించబడతాయి"
              : "Planned vs actual breakdown for each primary spending type"}
          </p>
        </div>

        <div className="divide-y divide-paper-100 border-t border-paper-100">
          {typeRows.map((row) => {
            const Icon =
              row.type === "MATERIAL"
                ? Package
                : row.type === "LABOUR"
                ? HardHat
                : MoreHorizontal;

            const label =
              row.type === "MATERIAL"
                ? (language === "te" ? "సామాగ్రి కొనుగోళ్లు" : "Material Purchases")
                : row.type === "LABOUR"
                ? (language === "te" ? "కూలీల చెల్లింపులు" : "Labour Payments")
                : (language === "te" ? "ఇతర ఖర్చులు" : "Other Services");

            const numBudget = Number(row.budget);
            const numActual = Number(row.actual);
            const typePercent = numBudget > 0 ? Math.min(100, Math.round((numActual / numBudget) * 100)) : 0;

            return (
              <div key={row.type} className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-clay-600" />
                    <span className="text-xs sm:text-sm font-bold text-ink-900">{label}</span>
                  </div>

                  <div className="text-right">
                    <span className="font-display text-xs sm:text-sm font-bold text-ink-900">
                      {formatINR(row.actual)}
                    </span>
                    <span className="text-xs text-ink-400 font-medium"> / {formatINR(row.budget)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-paper-100 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        row.isOver ? "bg-red-500" : typePercent > 85 ? "bg-amber-500" : "bg-clay-600"
                      )}
                      style={{ width: `${typePercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-ink-600 w-10 text-right">
                    {typePercent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Categories at Risk / Over Budget */}
      {categoriesAtRisk.length > 0 && (
        <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            <h2 className="font-display text-base font-bold text-ink-900">
              {language === "te" ? "పరిమితి దాటిన లేదా చేరువలో ఉన్న వర్గాలు" : "Categories at Risk / Over Budget"}
            </h2>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {categoriesAtRisk.map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-amber-950">{item.name}</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    {language === "te" ? "ఖర్చు:" : "Spent:"} {formatINR(item.spent)} (బడ్జెట్: {formatINR(item.budget)})
                  </p>
                </div>
                <span className="font-bold text-red-600">
                  +{formatINR(item.variance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Budget Management Modal / Drawer */}
      {children && (
        <Drawer
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          title={language === "te" ? "బడ్జెట్ పరిమితులు సవరించండి" : "Manage Budget Allocations"}
          subtitle={language === "te" ? "మొత్తం బడ్జెట్ మరియు వర్గాల వారీ పరిమితులను సర్దుబాటు చేయండి" : "Set planned allocation targets for materials, labour and specific categories"}
        >
          {children}
        </Drawer>
      )}
    </div>
  );
}
