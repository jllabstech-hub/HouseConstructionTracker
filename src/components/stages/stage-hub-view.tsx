"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Hammer,
  Layers,
  Milestone,
  Plus,
  Receipt,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import {
  CHRONOLOGICAL_CONSTRUCTION_STAGES,
  getStageConfig,
  getStageOrderNumber,
  type StageConfig,
} from "@/lib/catalog/stage-ordering";

export type StageSummaryItem = {
  step: number;
  id?: string;
  name: string;
  shortName: string;
  icon: string;
  phase: "STRUCTURAL" | "ROUGH_IN" | "FINISHING" | "INTERIORS";
  totalSpent: number;
  materialSpent: number;
  labourSpent: number;
  serviceSpent: number;
  billsCount: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" | string;
  percentageComplete: number;
};

export function StageHubView({
  projectId,
  projectName,
  stagesData,
  totalProjectSpent,
  totalProjectBudget,
}: {
  projectId: string;
  projectName: string;
  stagesData: StageSummaryItem[];
  totalProjectSpent: number;
  totalProjectBudget: number;
}) {
  const { language, t, getStageName } = useLanguage();
  const [selectedPhase, setSelectedPhase] = useState<"ALL" | "STRUCTURAL" | "ROUGH_IN" | "FINISHING" | "INTERIORS">("ALL");
  const [search, setSearch] = useState("");

  const filteredStages = useMemo(() => {
    return stagesData.filter((item) => {
      if (selectedPhase !== "ALL" && item.phase !== selectedPhase) return false;
      if (search) {
        const query = search.toLowerCase();
        const localized = getStageName(item.name).toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchShort = item.shortName.toLowerCase().includes(query);
        const matchStep = `stage ${item.step}`.includes(query) || `${item.step}` === query;
        if (!matchName && !matchShort && !matchStep && !localized.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [stagesData, selectedPhase, search, getStageName]);

  const phases = [
    { id: "ALL", label: language === "te" ? "అన్ని దశలు (20)" : "All 20 Stages", count: 20 },
    { id: "STRUCTURAL", label: language === "te" ? "దశ 1: పునాది & స్లాబ్ (1-6)" : "Phase 1: Structural (1–6)", count: 6 },
    { id: "ROUGH_IN", label: language === "te" ? "దశ 2: గోడలు & వైరింగ్ (7-11)" : "Phase 2: Rough-in (7–11)", count: 5 },
    { id: "FINISHING", label: language === "te" ? "దశ 3: టైల్స్ & రంగులు (12-16)" : "Phase 3: Finishing (12–16)", count: 5 },
    { id: "INTERIORS", label: language === "te" ? "దశ 4: గృహప్రవేశం (17-20)" : "Phase 4: Handover (17–20)", count: 4 },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-ink-800 bg-gradient-to-br from-ink-900 via-ink-800 to-clay-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-clay-500/20 border border-clay-400/30 px-3.5 py-1 text-xs font-bold text-clay-200">
              <Milestone className="h-3.5 w-3.5" />
              <span>{projectName} • 20 Construction Stages</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
              {t.stages?.title ?? "Construction Stages & Timeline"}
            </h1>
            <p className="text-sm text-paper-200/90 max-w-2xl">
              {t.stages?.subtitle ?? "Step-by-step sequential roadmap of your house construction from planning and foundation excavation to final painting & Gruhapravesham."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="rounded-2xl bg-white/10 p-4 border border-white/10 backdrop-blur-xs text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-paper-300">
                {language === "te" ? "మొత్తం ఖర్చు" : "Total Spent"}
              </span>
              <p className="text-xl sm:text-2xl font-bold text-clay-300 mt-0.5">
                {formatINR(totalProjectSpent)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 border border-white/10 backdrop-blur-xs text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-paper-300">
                {language === "te" ? "మొత్తం దశలు" : "Total Stages"}
              </span>
              <p className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                20 <span className="text-xs text-paper-300 font-normal">{language === "te" ? "దశలు" : "Steps"}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Phase Navigation Tabs & Search */}
      <div className="rounded-3xl border border-paper-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search and Phase Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-ink-400" />
            <input
              type="text"
              placeholder={language === "te" ? "దశ పేరు లేదా నంబర్ ద్వారా వెతకండి (ఉదా: పునాది, స్లాబ్, 3)..." : "Search stage by name or number (e.g. Footing, Slab, 3)..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-paper-300 bg-paper-50 py-2.5 pl-10 pr-4 text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clay-500/20"
            />
          </div>

          <div className="text-xs font-semibold text-ink-600 shrink-0 px-2">
            {language === "te" ? "చూపిస్తోంది:" : "Showing:"}{" "}
            <strong className="text-ink-900">{filteredStages.length}</strong> / 20 {language === "te" ? "దశలు" : "Stages"}
          </div>
        </div>

        {/* Phase Chips */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 pt-1 border-t border-paper-100">
          {phases.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPhase(p.id as typeof selectedPhase)}
              className={cn(
                "rounded-xl px-3.5 py-2 text-xs font-bold transition whitespace-nowrap active:scale-95",
                selectedPhase === p.id
                  ? "bg-clay-600 text-white shadow-xs"
                  : "bg-paper-100 text-ink-700 hover:bg-paper-200"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 20-Stage Interactive Sequential Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredStages.map((stage) => {
          const localizedName = getStageName(stage.name);
          const hasSpend = stage.totalSpent > 0;
          const conf = getStageConfig(stage.name);

          return (
            <div
              key={stage.step}
              className={cn(
                "group relative flex flex-col justify-between rounded-3xl border bg-white p-5 shadow-xs transition hover:shadow-md hover:border-clay-300",
                hasSpend ? "border-paper-300" : "border-paper-200"
              )}
            >
              <div>
                {/* Step Number & Phase Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-clay-100 font-display text-sm font-bold text-clay-800 border border-clay-200">
                    {stage.step.toString().padStart(2, "0")}
                  </span>
                  <span className="rounded-lg bg-paper-100 px-2 py-0.5 text-[10px] font-bold uppercase text-ink-500">
                    {stage.phase}
                  </span>
                </div>

                {/* Stage Title */}
                <Link href={`/stages/${stage.step}`} className="block group-hover:text-clay-600 transition">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{conf?.icon ?? stage.icon}</span>
                    <h3 className="font-display text-base font-bold text-ink-900 group-hover:text-clay-700 leading-snug line-clamp-1">
                      {stage.step}. {stage.shortName}
                    </h3>
                  </div>
                  <p className="text-xs text-ink-500 font-medium mt-1 line-clamp-1">
                    {localizedName}
                  </p>
                </Link>

                {/* Spend Overview */}
                <div className="mt-4 rounded-2xl bg-paper-50 p-3 border border-paper-150 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-ink-500 uppercase tracking-wider">
                      {language === "te" ? "ఖర్చు:" : "Spent:"}
                    </span>
                    <strong className="text-sm font-bold text-clay-800">
                      {formatINR(stage.totalSpent)}
                    </strong>
                  </div>

                  {/* Materials vs Labour Mini Badges */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-paper-200/80 text-[11px]">
                    <div className="text-ink-600">
                      <span>🧱 </span>
                      <span>{formatINR(stage.materialSpent)}</span>
                    </div>
                    <div className="text-ink-600 text-right">
                      <span>👷 </span>
                      <span>{formatINR(stage.labourSpent)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-paper-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-ink-400 flex items-center gap-1">
                  <Receipt className="h-3.5 w-3.5" />
                  <span>{stage.billsCount} {language === "te" ? "బిల్లులు" : "bills"}</span>
                </span>

                <Link
                  href={`/stages/${stage.step}`}
                  className="inline-flex items-center gap-1 rounded-xl bg-paper-100 hover:bg-clay-600 hover:text-white px-3 py-1.5 text-xs font-bold text-ink-800 transition active:scale-95 shadow-2xs"
                >
                  <span>{language === "te" ? "వివరాలు" : "View"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
