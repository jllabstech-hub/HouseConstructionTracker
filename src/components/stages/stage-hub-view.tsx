"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Milestone,
  Plus,
  Receipt,
  Search,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { SegmentedControl } from "@/components/ui/segmented-control";

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

  // Calculate overall completion percentage
  const overallProgress = useMemo(() => {
    const total = stagesData.reduce((acc, curr) => acc + curr.percentageComplete, 0);
    return Math.round(total / (stagesData.length || 1));
  }, [stagesData]);

  const filteredStages = useMemo(() => {
    return stagesData.filter((item) => {
      if (selectedPhase !== "ALL" && item.phase !== selectedPhase) return false;
      if (search) {
        const query = search.toLowerCase();
        const localized = getStageName(item.name).toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchShort = item.shortName.toLowerCase().includes(query);
        const matchStep = `${item.step}` === query || `stage ${item.step}`.includes(query);
        if (!matchName && !matchShort && !matchStep && !localized.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [stagesData, selectedPhase, search, getStageName]);

  const phaseOptions = [
    { value: "ALL", label: language === "te" ? "అన్నీ (20)" : "All (20)" },
    { value: "STRUCTURAL", label: language === "te" ? "పునాది & స్లాబ్ (1-6)" : "Structural (1–6)" },
    { value: "ROUGH_IN", label: language === "te" ? "గోడలు & పైపులు (7-11)" : "Rough-in (7–11)" },
    { value: "FINISHING", label: language === "te" ? "ఫినిషింగ్ (12-16)" : "Finishing (12–16)" },
    { value: "INTERIORS", label: language === "te" ? "గృహప్రవేశం (17-20)" : "Handover (17–20)" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-paper-200/80 pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
            {language === "te" ? "నిర్మాణ పురోగతి & దశలు" : "Construction Progress"}
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            {language === "te"
              ? "పునాది తవ్వకం నుండి గృహప్రవేశం వరకు 20 వరుస క్రమ దశలు"
              : "Sequential 20-stage timeline from foundation to handover"}
          </p>
        </div>

        {/* Overall Completion Metric Card */}
        <div className="flex items-center gap-3 rounded-2xl border border-paper-200 bg-white p-3.5 shadow-xs shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              {language === "te" ? "మొత్తం పురోగతి" : "Overall Progress"}
            </span>
            <p className="font-display text-xl font-bold text-ink-900">
              {overallProgress}%
            </p>
          </div>
          <div className="h-10 w-16 overflow-hidden rounded-full bg-paper-100 flex items-center p-1">
            <div
              className="h-full rounded-full bg-clay-600 transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Controls: Phase Segmented Filter & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <SegmentedControl
          options={phaseOptions}
          value={selectedPhase}
          onChange={(val) => setSelectedPhase(val as typeof selectedPhase)}
          className="w-full md:w-auto overflow-x-auto"
        />

        <div className="relative max-w-xs w-full ml-auto">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
          <input
            type="text"
            placeholder={language === "te" ? "దశ పేరు వెతకండి..." : "Search stages..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-paper-300 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 3. Vertical Clean Sequential Timeline */}
      <div className="rounded-2xl border border-paper-200 bg-white shadow-xs divide-y divide-paper-100 overflow-hidden">
        {filteredStages.map((stage) => {
          const isCompleted = stage.percentageComplete >= 100 || stage.status === "COMPLETED";
          const isInProgress = stage.percentageComplete > 0 && stage.percentageComplete < 100;
          const localizedName = getStageName(stage.name);

          return (
            <div
              key={stage.step}
              className="flex items-center justify-between p-4 sm:p-5 hover:bg-paper-50/50 transition gap-3"
            >
              {/* Left: Status Icon + Stage Number & Title */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="shrink-0">
                  {isCompleted ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-4.5 w-4.5" />
                    </div>
                  ) : isInProgress ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <Clock className="h-4.5 w-4.5" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-paper-100 text-ink-400 font-bold text-xs">
                      {stage.step}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/stages/${stage.step}`}
                      className="font-display text-sm sm:text-base font-bold text-ink-900 hover:text-clay-700 transition truncate"
                    >
                      {stage.step}. {stage.shortName}
                    </Link>
                    <span className="rounded-md bg-paper-100 px-1.5 py-0.2 text-[10px] font-bold uppercase text-ink-500">
                      {stage.phase}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 truncate mt-0.5">
                    {localizedName}
                  </p>
                </div>
              </div>

              {/* Right: Progress % + Spent + View Button */}
              <div className="flex items-center gap-4 shrink-0 text-right">
                <div className="hidden sm:block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">
                    {language === "te" ? "ఖర్చు" : "Spent"}
                  </span>
                  <p className="font-display text-sm font-bold text-ink-900">
                    {stage.totalSpent > 0 ? formatINR(stage.totalSpent) : "—"}
                  </p>
                </div>

                <div className="hidden md:block w-20">
                  <div className="flex items-center justify-between text-[11px] text-ink-500 font-medium mb-1">
                    <span>{stage.percentageComplete}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-paper-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-clay-600"
                      style={{ width: `${stage.percentageComplete}%` }}
                    />
                  </div>
                </div>

                <Link
                  href={`/stages/${stage.step}`}
                  className="inline-flex items-center gap-1 rounded-xl border border-paper-300 bg-white px-3 py-1.5 text-xs font-bold text-ink-800 hover:bg-clay-50 hover:text-clay-700 hover:border-clay-300 transition shadow-2xs active:scale-98"
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
