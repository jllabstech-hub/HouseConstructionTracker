"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Building,
  X,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

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

export function formatLakhs(amount: number): string {
  if (!amount || amount === 0) return "₹0";
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr.toFixed(cr >= 10 ? 1 : 2).replace(/\.00$/, "").replace(/\.0$/, "")}Cr`;
  }
  if (amount >= 100000) {
    const l = amount / 100000;
    return `₹${l.toFixed(l >= 10 ? 1 : 2).replace(/\.00$/, "").replace(/\.0$/, "")}L`;
  }
  if (amount >= 1000) {
    const k = amount / 1000;
    return `₹${k.toFixed(k >= 10 ? 0 : 1).replace(/\.0$/, "")}k`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function StageHubView({
  projectName,
  stagesData,
  totalProjectSpent,
}: {
  projectId?: string;
  projectName: string;
  stagesData: StageSummaryItem[];
  totalProjectSpent: number;
  totalProjectBudget?: number;
}) {
  const { language, getStageName } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<"ALL" | "COMPLETED" | "IN_PROGRESS" | "UPCOMING">("ALL");
  const [search, setSearch] = useState("");

  // Calculate overall completion percentage purely from recorded physical progress
  const overallProgress = useMemo(() => {
    const total = stagesData.reduce((acc, curr) => acc + curr.percentageComplete, 0);
    return Math.round(total / (stagesData.length || 1));
  }, [stagesData]);

  // Categorize stages into Completed, In Progress, and Upcoming
  const completedStages = useMemo(() => {
    return stagesData.filter((s) => s.status === "COMPLETED" || s.percentageComplete >= 100);
  }, [stagesData]);

  const inProgressStages = useMemo(() => {
    return stagesData.filter((s) => s.status === "IN_PROGRESS" || (s.percentageComplete > 0 && s.percentageComplete < 100));
  }, [stagesData]);

  const upcomingStages = useMemo(() => {
    return stagesData.filter((s) => s.status !== "COMPLETED" && s.status !== "IN_PROGRESS" && s.percentageComplete === 0);
  }, [stagesData]);

  // Find the next immediate milestone
  const nextStage = useMemo(() => {
    return inProgressStages[0] || upcomingStages[0] || null;
  }, [inProgressStages, upcomingStages]);

  // Filter stages based on selected filter and search query
  const filteredStages = useMemo(() => {
    return stagesData.filter((stage) => {
      // 1. Status Filter
      if (activeFilter === "COMPLETED" && !(stage.status === "COMPLETED" || stage.percentageComplete >= 100)) {
        return false;
      }
      if (activeFilter === "IN_PROGRESS" && !(stage.status === "IN_PROGRESS" || (stage.percentageComplete > 0 && stage.percentageComplete < 100))) {
        return false;
      }
      if (activeFilter === "UPCOMING" && (stage.status === "COMPLETED" || stage.status === "IN_PROGRESS" || stage.percentageComplete > 0)) {
        return false;
      }

      // 2. Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const localized = getStageName(stage.name).toLowerCase();
        const matchName = stage.name.toLowerCase().includes(q);
        const matchShort = stage.shortName.toLowerCase().includes(q);
        const matchStep = `stage ${stage.step}`.includes(q) || `${stage.step}` === q;
        return matchName || matchShort || matchStep || localized.includes(q);
      }

      return true;
    });
  }, [stagesData, activeFilter, search, getStageName]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Header & Project Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper-200/80 pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">
            {language === "te" ? "నిర్మాణ పురోగతి" : "Construction Progress"}
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-1">
            {language === "te"
              ? "పునాది నుండి గృహప్రవేశం వరకు మీ ఇంటి నిర్మాణ దశలు మరియు ఖర్చులు"
              : "Track real milestone progress and expenditures from foundation to handover."}
          </p>
        </div>

        {/* Project Selector Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-paper-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-ink-700 shadow-2xs self-start sm:self-auto">
          <Building className="h-3.5 w-3.5 text-clay-600" />
          <span>{projectName}</span>
        </div>
      </div>

      {/* 2. Overall Progress Hero Card */}
      <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
              {language === "te" ? "మొత్తం నిర్మాణ పురోగతి" : "Overall Construction Progress"}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-3xl sm:text-4xl font-bold text-ink-900">
                {overallProgress}%
              </span>
              <span className="text-xs text-ink-500 font-medium">
                ({completedStages.length} of {stagesData.length} stages complete)
              </span>
            </div>
          </div>

          {/* Total Spent Summary */}
          <div className="text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500">
              {language === "te" ? "మొత్తం ఖర్చు" : "Total Spent"}
            </span>
            <p className="font-display text-xl sm:text-2xl font-bold text-clay-700 mt-0.5">
              {formatINR(totalProjectSpent)}
            </p>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded-full bg-paper-100 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-clay-500 to-clay-600 transition-all duration-700 ease-out"
              style={{ width: `${Math.max(overallProgress, 2)}%` }}
            />
          </div>
        </div>

        {/* 3 Core Homeowner Answer Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-paper-100">
          {/* 1. What is completed? */}
          <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{language === "te" ? "పూర్తయినవి" : "What is completed?"}</span>
            </div>
            <p className="font-display text-lg font-bold text-emerald-950">
              {completedStages.length}{" "}
              <span className="text-xs font-normal text-emerald-800">
                {language === "te" ? "దశలు" : "stages"}
              </span>
            </p>
          </div>

          {/* 2. What is currently happening? */}
          <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>{language === "te" ? "ప్రస్తుతం జరుగుతున్నవి" : "Currently happening?"}</span>
            </div>
            <p className="font-display text-lg font-bold text-amber-950">
              {inProgressStages.length > 0 ? (
                <span>
                  {inProgressStages.length}{" "}
                  <span className="text-xs font-normal text-amber-800">
                    {language === "te" ? "దశలు ప్రగతిలో" : "in progress"}
                  </span>
                </span>
              ) : (
                <span className="text-xs font-medium text-amber-800">
                  {language === "te" ? "ప్రస్తుతం ఏదీ లేదు" : "None active"}
                </span>
              )}
            </p>
          </div>

          {/* 3. What comes next? */}
          <div className="rounded-2xl bg-paper-100/80 border border-paper-200 p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-ink-700 font-bold text-xs">
              <TrendingUp className="h-4 w-4 text-clay-600" />
              <span>{language === "te" ? "తదుపరి దశ" : "What comes next?"}</span>
            </div>
            <p className="text-xs font-bold text-ink-900 truncate" title={nextStage?.name}>
              {nextStage ? (language === "te" ? getStageName(nextStage.name) : nextStage.name) : "All stages completed"}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Quick Status Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-paper-200 shadow-2xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter("ALL")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-95 whitespace-nowrap shrink-0",
              activeFilter === "ALL"
                ? "bg-clay-600 text-white shadow-xs"
                : "bg-paper-100 text-ink-700 hover:bg-paper-200"
            )}
          >
            <span>{language === "te" ? "అన్నీ" : "All Stages"}</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-bold">
              {stagesData.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("IN_PROGRESS")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-95 whitespace-nowrap shrink-0",
              activeFilter === "IN_PROGRESS"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100"
            )}
          >
            <span>{language === "te" ? "ప్రగతిలో ఉన్నవి" : "In Progress"}</span>
            <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px] font-bold">
              {inProgressStages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("COMPLETED")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-95 whitespace-nowrap shrink-0",
              activeFilter === "COMPLETED"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100"
            )}
          >
            <span>{language === "te" ? "పూర్తయినవి" : "Completed"}</span>
            <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px] font-bold">
              {completedStages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("UPCOMING")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-95 whitespace-nowrap shrink-0",
              activeFilter === "UPCOMING"
                ? "bg-ink-800 text-white shadow-xs"
                : "bg-paper-100 text-ink-700 hover:bg-paper-200"
            )}
          >
            <span>{language === "te" ? "రాబోయే దశలు" : "Upcoming"}</span>
            <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px] font-bold">
              {upcomingStages.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
          <input
            type="text"
            placeholder={language === "te" ? "దశ పేరు వెతకండి..." : "Search stage name..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-paper-300 bg-paper-50/70 py-2 pl-9 pr-8 text-xs font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:bg-white focus:outline-none transition shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 text-ink-400 hover:text-ink-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Simple Stage Timeline List */}
      {filteredStages.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-paper-300 bg-white p-12 text-center space-y-3">
          <Layers className="mx-auto h-10 w-10 text-ink-300" />
          <h3 className="font-display font-bold text-ink-900 text-base">
            {language === "te" ? "దశలు ఏవీ కనుగొనబడలేదు" : "No stages found"}
          </h3>
          <p className="text-xs text-ink-500">
            {language === "te"
              ? "మీ శోధనకు సరిపోలే దశలు ఏవీ లేవు. దయచేసి శోధనను క్లియర్ చేయండి."
              : "No stages match the active filter or search term."}
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveFilter("ALL");
              setSearch("");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-paper-50 px-4 py-2 text-xs font-bold text-ink-800 hover:bg-paper-100 transition"
          >
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="relative space-y-4">
          {/* Vertical Timeline Spine */}
          <div className="absolute top-6 bottom-6 left-[19px] sm:left-[23px] w-0.5 bg-paper-200 z-0" />

          {filteredStages.map((stage) => {
            const isCompleted = stage.status === "COMPLETED" || stage.percentageComplete >= 100;
            const isInProgress = stage.status === "IN_PROGRESS" || (stage.percentageComplete > 0 && stage.percentageComplete < 100);
            const hasProgressEntered = stage.percentageComplete > 0 || isCompleted;
            const localizedName = getStageName(stage.name);

            return (
              <div key={stage.step} className="relative z-10 flex items-start gap-3 sm:gap-4 group">
                {/* Step Marker Circle */}
                <div className="shrink-0 mt-3.5">
                  {isCompleted ? (
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs ring-4 ring-white">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  ) : isInProgress ? (
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs ring-4 ring-amber-100 animate-pulse">
                      <Clock className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white border-2 border-paper-300 text-ink-500 font-bold text-xs sm:text-sm ring-4 ring-white">
                      {stage.step}
                    </div>
                  )}
                </div>

                {/* Stage Detail Card */}
                <Link
                  href={`/stages/${stage.step}`}
                  className={cn(
                    "flex-1 rounded-2xl border bg-white p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-clay-300 hover:shadow-md block",
                    isCompleted
                      ? "border-emerald-200/80 bg-emerald-50/20"
                      : isInProgress
                      ? "border-amber-300/90 bg-amber-50/20 ring-1 ring-amber-300/40"
                      : "border-paper-200"
                  )}
                >
                  {/* Top Row: Stage Name & Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-base sm:text-lg font-bold text-ink-900 leading-snug group-hover:text-clay-700 transition">
                        {language === "te" ? localizedName : stage.name}
                      </h2>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-900">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{language === "te" ? "పూర్తయింది" : "Completed"}</span>
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 border border-amber-200 px-2.5 py-1 text-[11px] font-bold text-amber-900">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          <span>{language === "te" ? "ప్రగతిలో ఉంది" : "In Progress"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-paper-100 border border-paper-200 px-2.5 py-1 text-[11px] font-bold text-ink-600">
                          <span>{language === "te" ? "రాబోయే దశ" : "Upcoming"}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Display */}
                  <div className="mt-3 space-y-1.5">
                    {hasProgressEntered ? (
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-ink-500">
                            {language === "te" ? "పురోగతి" : "Progress"}
                          </span>
                          <span className="font-display text-sm font-bold text-ink-900">
                            {stage.percentageComplete}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-paper-100 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              isCompleted
                                ? "bg-emerald-600"
                                : isInProgress
                                ? "bg-amber-500"
                                : "bg-clay-600"
                            )}
                            style={{ width: `${Math.max(stage.percentageComplete, 2)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-ink-400 py-0.5">
                        <AlertCircle className="h-3.5 w-3.5 text-ink-300" />
                        <span className="italic font-medium">
                          {language === "te" ? "పురోగతి నవీకరించబడలేదు" : "Progress not updated"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Financial Breakdown: Spent ₹6.8L • Material ₹5.2L • Labour ₹1.6L */}
                  <div className="mt-3.5 pt-3 border-t border-paper-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    {/* Spent Summary */}
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink-900 font-display text-sm">
                        {language === "te" ? "ఖర్చు:" : "Spent"}{" "}
                        <strong className="text-clay-700">{formatLakhs(stage.totalSpent)}</strong>
                      </span>
                      {stage.totalSpent > 0 && (
                        <span className="text-[11px] text-ink-400 font-normal">
                          ({formatINR(stage.totalSpent)})
                        </span>
                      )}
                    </div>

                    {/* Material & Labour Split */}
                    <div className="flex items-center gap-2 text-ink-600 flex-wrap">
                      <span className="rounded-md bg-paper-100 px-2 py-0.5 font-semibold text-ink-800">
                        {language === "te" ? "సామాగ్రి" : "Material"}: {formatLakhs(stage.materialSpent)}
                      </span>
                      <span>•</span>
                      <span className="rounded-md bg-paper-100 px-2 py-0.5 font-semibold text-ink-800">
                        {language === "te" ? "కూలీలు" : "Labour"}: {formatLakhs(stage.labourSpent)}
                      </span>
                      {stage.serviceSpent > 0 && (
                        <>
                          <span>•</span>
                          <span className="rounded-md bg-paper-100 px-2 py-0.5 font-semibold text-ink-800">
                            {language === "te" ? "ఇతర" : "Other"}: {formatLakhs(stage.serviceSpent)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
