"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Building,
  Hammer,
  Paintbrush,
  Sparkles,
  X,
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

export const CONSTRUCTION_PHASES = [
  {
    key: "STRUCTURAL" as const,
    phaseNumber: 1,
    icon: Building,
    titleEn: "Phase 1: Substructure & Foundation",
    titleTe: "దశ 1: పునాది & బేస్‌మెంట్ నిర్మాణం",
    rangeText: "Stages 1–6",
    descriptionEn: "Site setup, excavation, column footings, plinth beam, termite treatment, and ground floor slab.",
    descriptionTe: "సైట్ క్లీనింగ్, తవ్వకం, పిల్లర్ పునాదులు, ప్లింత్ బీమ్, చెదలు ట్రీట్‌మెంట్ మరియు గ్రౌండ్ ఫ్లోర్ స్లాబ్.",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    headerBg: "bg-gradient-to-r from-blue-50/80 to-white",
  },
  {
    key: "ROUGH_IN" as const,
    phaseNumber: 2,
    icon: Hammer,
    titleEn: "Phase 2: Superstructure & Framing",
    titleTe: "దశ 2: గోడలు, స్లాబ్ & పైపుల అమరిక",
    rangeText: "Stages 7–11",
    descriptionEn: "RCC columns, brickwork masonry, roof slab concreting, electrical & plumbing concealed conduit rough-in, and plastering.",
    descriptionTe: "పిల్లర్లు ఎత్తడం, ఇటుక గోడల నిర్మాణం, పైకప్పు స్లాబ్, ఎలక్ట్రికల్/ప్లంబింగ్ కన్సీల్డ్ వైరింగ్ మరియు ప్లాస్టరింగ్.",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
    headerBg: "bg-gradient-to-r from-amber-50/80 to-white",
  },
  {
    key: "FINISHING" as const,
    phaseNumber: 3,
    icon: Paintbrush,
    titleEn: "Phase 3: Finishing & Enclosure",
    titleTe: "దశ 3: ఫినిషింగ్ & అమరికలు",
    rangeText: "Stages 12–16",
    descriptionEn: "Flooring tiles, granite, doors & windows UPVC, wall putty primer & paint, sanitaryware & switch fittings.",
    descriptionTe: "టైల్స్ & గ్రానైట్, తలుపులు/కిటికీలు, పుట్టీ & పెయింటింగ్, బాత్రూమ్ ఫిట్టింగ్స్ మరియు స్విచ్ బోర్డులు.",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-200",
    headerBg: "bg-gradient-to-r from-emerald-50/80 to-white",
  },
  {
    key: "INTERIORS" as const,
    phaseNumber: 4,
    icon: Sparkles,
    titleEn: "Phase 4: Interiors & Handover",
    titleTe: "దశ 4: ఇంటీరియర్స్ & గృహప్రవేశం",
    rangeText: "Stages 17–20",
    descriptionEn: "Modular kitchen, false ceiling, compound wall, main gate, exterior elevation, deep cleaning, and housewarming.",
    descriptionTe: "మోడ్యులర్ కిచెన్, ఫాల్స్ సీలింగ్, కాంపౌండ్ వాల్, మెయిన్ గేట్, ఎలివేషన్ మరియు గృహప్రవేశం (శ్రీకారం).",
    badgeClass: "bg-purple-100 text-purple-900 border-purple-200",
    headerBg: "bg-gradient-to-r from-purple-50/80 to-white",
  },
];

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

  const phaseOptions = [
    { value: "ALL", label: language === "te" ? "అన్నీ (20)" : "All (20)", icon: Layers },
    { value: "STRUCTURAL", label: language === "te" ? "1. పునాది (1–6)" : "1. Substructure (1–6)", icon: Building },
    { value: "ROUGH_IN", label: language === "te" ? "2. గోడలు (7–11)" : "2. Superstructure (7–11)", icon: Hammer },
    { value: "FINISHING", label: language === "te" ? "3. ఫినిషింగ్ (12–16)" : "3. Finishing (12–16)", icon: Paintbrush },
    { value: "INTERIORS", label: language === "te" ? "4. గృహప్రవేశం (17–20)" : "4. Handover (17–20)", icon: Sparkles },
  ];

  // Group stages by Phase
  const groupedPhases = useMemo(() => {
    return CONSTRUCTION_PHASES.map((phaseMeta) => {
      const phaseStages = stagesData.filter((item) => {
        if (item.phase !== phaseMeta.key) return false;
        if (search) {
          const query = search.toLowerCase();
          const localized = getStageName(item.name).toLowerCase();
          const matchName = item.name.toLowerCase().includes(query);
          const matchShort = item.shortName.toLowerCase().includes(query);
          const matchStep = `${item.step}` === query || `stage ${item.step}`.includes(query);
          return matchName || matchShort || matchStep || localized.includes(query);
        }
        return true;
      });

      const phaseSpent = stagesData
        .filter((s) => s.phase === phaseMeta.key)
        .reduce((sum, s) => sum + s.totalSpent, 0);

      const allPhaseStages = stagesData.filter((s) => s.phase === phaseMeta.key);
      const phaseProgress = Math.round(
        allPhaseStages.reduce((sum, s) => sum + s.percentageComplete, 0) / (allPhaseStages.length || 1)
      );

      const completedCount = allPhaseStages.filter(
        (s) => s.percentageComplete >= 100 || s.status === "COMPLETED"
      ).length;

      return {
        ...phaseMeta,
        stages: phaseStages,
        totalStagesInPhase: allPhaseStages.length,
        completedCount,
        phaseSpent,
        phaseProgress,
      };
    }).filter((phase) => {
      if (selectedPhase !== "ALL" && phase.key !== selectedPhase) return false;
      if (search && phase.stages.length === 0) return false;
      return true;
    });
  }, [stagesData, selectedPhase, search, getStageName]);

  return (
    <div className="space-y-6">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-paper-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
              {language === "te" ? "నిర్మాణ దశల పురోగతి" : "Construction Stages"}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            {language === "te"
              ? "పునాది తవ్వకం నుండి గృహప్రవేశం వరకు 20 వరుస క్రమ దశలు"
              : "Sequential 20 progressive construction stages from foundation to handover"}
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

      {/* 2. Controls Toolbar: Modern Filter Chips & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-paper-200 shadow-2xs">
        {/* Phase Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {phaseOptions.map((opt) => {
            const isSelected = selectedPhase === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedPhase(opt.value as typeof selectedPhase)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition select-none whitespace-nowrap active:scale-98 shrink-0",
                  isSelected
                    ? "bg-clay-600 text-white shadow-xs"
                    : "bg-paper-100/80 text-ink-700 hover:bg-paper-200/80 hover:text-ink-900"
                )}
              >
                {Icon && <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-white" : "text-clay-600")} />}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
          <input
            type="text"
            placeholder={language === "te" ? "దశ పేరు వెతకండి..." : "Search stages..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-paper-300 bg-paper-50/60 py-2 pl-9 pr-8 text-xs font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:bg-white focus:outline-none transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 text-ink-400 hover:text-ink-700 p-0.5 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Phase-Wise Grouped Stage Sections */}
      <div className="space-y-6">
        {groupedPhases.map((phase) => {
          const PhaseIcon = phase.icon;
          const phaseTitle = language === "te" ? phase.titleTe : phase.titleEn;
          const phaseDesc = language === "te" ? phase.descriptionTe : phase.descriptionEn;

          return (
            <div
              key={phase.key}
              className="rounded-2xl border border-paper-200 bg-white shadow-xs overflow-hidden"
            >
              {/* Phase Header Strip */}
              <div className={cn("border-b border-paper-200/80 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4", phase.headerBg)}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-paper-200 shadow-2xs text-ink-800">
                    <PhaseIcon className="h-5 w-5 text-clay-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-base sm:text-lg font-bold text-ink-900">
                        {phaseTitle}
                      </h2>
                      <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold border", phase.badgeClass)}>
                        {phase.rangeText}
                      </span>
                    </div>
                    <p className="text-xs text-ink-600 mt-0.5 line-clamp-1 max-w-2xl">
                      {phaseDesc}
                    </p>
                  </div>
                </div>

                {/* Phase Stats Summary */}
                <div className="flex items-center gap-5 shrink-0 self-end md:self-center">
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">
                      {language === "te" ? "దశ ఖర్చు" : "Phase Spent"}
                    </span>
                    <p className="font-display text-sm sm:text-base font-bold text-ink-900">
                      {phase.phaseSpent > 0 ? formatINR(phase.phaseSpent) : "₹0"}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">
                      {language === "te" ? "పూర్తయినవి" : "Completed"}
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-ink-700">
                      {phase.completedCount} / {phase.totalStagesInPhase}
                    </p>
                  </div>

                  <div className="w-16 sm:w-20">
                    <div className="flex items-center justify-between text-[10px] text-ink-500 font-bold mb-1">
                      <span>{phase.phaseProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-paper-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-clay-600 transition-all duration-300"
                        style={{ width: `${phase.phaseProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase Stages List */}
              <div className="divide-y divide-paper-100">
                {phase.stages.map((stage) => {
                  const isCompleted = stage.percentageComplete >= 100 || stage.status === "COMPLETED";
                  const isInProgress = stage.percentageComplete > 0 && stage.percentageComplete < 100;
                  const localizedName = getStageName(stage.name);

                  return (
                    <div
                      key={stage.step}
                      className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-paper-50/60 transition gap-3"
                    >
                      {/* Left: Status Icon + Stage Number & Title */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0">
                          {isCompleted ? (
                            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          ) : isInProgress ? (
                            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                              <Clock className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-paper-100 text-ink-400 font-bold text-xs">
                              {stage.step}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <Link
                            href={`/stages/${stage.step}`}
                            className="font-display text-xs sm:text-sm font-bold text-ink-900 hover:text-clay-700 transition truncate block"
                          >
                            {language === "te" ? localizedName : stage.name}
                          </Link>
                          <p className="text-[11px] sm:text-xs text-ink-500 truncate">
                            {language === "te" ? stage.name : localizedName}
                          </p>
                        </div>
                      </div>

                      {/* Right: Progress % + Spent + View Button */}
                      <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-right">
                        <div>
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-ink-400 block">
                            {language === "te" ? "ఖర్చు" : "Spent"}
                          </span>
                          <p className="font-display text-xs sm:text-sm font-bold text-ink-900">
                            {stage.totalSpent > 0 ? formatINR(stage.totalSpent) : "—"}
                          </p>
                        </div>

                        <div className="hidden sm:block w-20">
                          {stage.percentageComplete > 0 || stage.status !== "NOT_STARTED" ? (
                            <>
                              <div className="text-[10px] text-ink-500 font-medium mb-0.5">
                                {stage.percentageComplete}%
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-paper-100 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-clay-600"
                                  style={{ width: `${stage.percentageComplete}%` }}
                                />
                              </div>
                            </>
                          ) : (
                            <span className="text-[10px] font-medium text-ink-400 italic">
                              {language === "te" ? "నవీకరించబడలేదు" : "Not updated"}
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/stages/${stage.step}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-paper-300 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-bold text-ink-800 hover:bg-clay-50 hover:text-clay-700 hover:border-clay-300 transition shadow-2xs active:scale-98"
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
        })}

        {groupedPhases.length === 0 && (
          <div className="rounded-2xl border border-dashed border-paper-300 bg-paper-50 p-8 text-center">
            <p className="text-sm font-bold text-ink-700">
              {language === "te" ? "ఎటువంటి దశలు కనుగొనబడలేదు" : "No stages match your search or filter"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
