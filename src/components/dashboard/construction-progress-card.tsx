"use client";

import Link from "next/link";
import { ArrowRight, Milestone, CheckCircle2, Clock } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import type { ConstructionProgressSummary } from "@/lib/finance/financial-aggregates";

export function ConstructionProgressCard({
  progress,
}: {
  progress: ConstructionProgressSummary;
}) {
  const { language, getStageName } = useLanguage();
  const active = progress.activeStage;
  const isUnrecorded = progress.isUnrecorded || (!active?.percentageComplete && active?.status === "NOT_STARTED");

  const localizedActiveStageName = active?.name ? getStageName(active.name) : (language === "te" ? "ప్రస్తుత దశ" : "Current Stage");

  return (
    <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-paper-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay-50 text-clay-700 border border-clay-100">
            <Milestone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold text-ink-900 leading-tight">
              {language === "te" ? "నిర్మాణ పురోగతి" : "Construction Progress"}
            </h2>
            <p className="text-xs text-ink-500 mt-0.5">
              {language === "te"
                ? `${progress.completedCount} / ${progress.totalStages} దశలు పూర్తయ్యాయి`
                : `${progress.completedCount} of ${progress.totalStages} milestone stages completed`}
            </p>
          </div>
        </div>

        <Link
          href="/stages"
          className="inline-flex items-center gap-1 text-xs font-bold text-clay-700 hover:text-clay-900 transition"
        >
          <span>{language === "te" ? "అన్ని 20 దశలు" : "View timeline"}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 items-center">
        {/* Active Milestone Card */}
        <div className="rounded-xl border border-paper-200 bg-paper-50/50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              {language === "te" ? "ప్రస్తుత చురుకైన దశ" : "Active Milestone"}
            </span>
            {active && (
              <span className="rounded-md bg-clay-100 px-2 py-0.5 text-[11px] font-bold text-clay-800">
                Stage {active.sortOrder}
              </span>
            )}
          </div>

          <p className="font-display text-sm sm:text-base font-bold text-ink-900 leading-snug">
            {active?.name ?? (language === "te" ? "పునాది & నిర్మాణం" : "Foundation & Substructure")}
          </p>
          <p className="text-xs text-ink-500">
            {language === "te" ? active?.name : localizedActiveStageName}
          </p>

          <div className="pt-1">
            {isUnrecorded ? (
              <p className="text-xs font-medium text-ink-400 italic">
                {language === "te" ? "పురోగతి నవీకరించబడలేదు" : "Progress not updated"}
              </p>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-ink-700">
                  <span>{language === "te" ? "దశ పురోగతి" : "Stage Progress"}</span>
                  <span>{active?.percentageComplete ?? 0}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-paper-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-clay-600 transition-all duration-500"
                    style={{ width: `${active?.percentageComplete ?? 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Master Project 20-Stage Health */}
        <div className="rounded-xl border border-paper-200 bg-paper-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              {language === "te" ? "మొత్తం ఇంటి ప్రయాణం" : "Overall Timeline"}
            </span>
            <span className="font-display text-sm font-bold text-ink-900">
              {progress.overallPercent}%
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-paper-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-clay-600 transition-all duration-500"
              style={{ width: `${progress.overallPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>{progress.completedCount} {language === "te" ? "పూర్తయ్యాయి" : "Completed"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
              <Clock className="h-4 w-4" />
              <span>{progress.totalStages - progress.completedCount} {language === "te" ? "మిగిలాయి" : "Remaining"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
