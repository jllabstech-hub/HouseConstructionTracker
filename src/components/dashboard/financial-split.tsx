"use client";

import Link from "next/link";
import { ArrowRight, Package, HardHat, MoreHorizontal } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";

export function FinancialSplit({
  materialTotal,
  labourTotal,
  otherTotal,
  grandTotal,
}: {
  materialTotal: number;
  labourTotal: number;
  otherTotal: number;
  grandTotal: number;
}) {
  const total = grandTotal > 0 ? grandTotal : 1;
  const matPercent = Math.round((materialTotal / total) * 100);
  const labPercent = Math.round((labourTotal / total) * 100);
  const othPercent = Math.max(0, 100 - matPercent - labPercent);

  return (
    <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-paper-100 pb-3">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-ink-900 leading-tight">
            Where is the Money Going?
          </h2>
          <p className="text-xs text-ink-500 mt-0.5">
            Material purchases vs worker wages breakdown
          </p>
        </div>
      </div>

      {/* Visual Proportional Split Bar */}
      <div className="space-y-1.5">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-paper-100 flex">
          <div
            className="h-full bg-clay-600 transition-all duration-700"
            style={{ width: `${matPercent}%` }}
            title={`Material: ${matPercent}%`}
          />
          <div
            className="h-full bg-emerald-600 transition-all duration-700"
            style={{ width: `${labPercent}%` }}
            title={`Labour: ${labPercent}%`}
          />
          <div
            className="h-full bg-ink-400 transition-all duration-700"
            style={{ width: `${othPercent}%` }}
            title={`Other: ${othPercent}%`}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-ink-500 font-medium px-1">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-clay-600 inline-block" /> Material ({matPercent}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" /> Labour ({labPercent}%)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-ink-400 inline-block" /> Other ({othPercent}%)
          </span>
        </div>
      </div>

      {/* 3-Column Detail Cards */}
      <div className="grid gap-3.5 sm:grid-cols-3 pt-1">
        {/* Material Purchases */}
        <div className="rounded-xl border border-paper-200 bg-paper-50/50 p-4 flex flex-col justify-between hover:border-clay-300 transition">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-600">
                <Package className="h-4 w-4 text-clay-600" />
                <span>Material</span>
              </div>
              <span className="rounded-md bg-clay-100 px-2 py-0.5 text-xs font-bold text-clay-800">
                {matPercent}%
              </span>
            </div>

            <p className="mt-2.5 text-lg font-semibold tracking-tight tabular-nums text-ink-900 sm:text-xl">
              <AnimatedNumber value={materialTotal} />
            </p>
            <p className="text-[11px] text-ink-500 mt-0.5">
              Cement, steel, sand, tiles, bricks...
            </p>
          </div>

          <Link
            href="/expenses?type=MATERIAL"
            className="mt-3.5 inline-flex items-center gap-1 text-xs font-bold text-clay-700 hover:text-clay-900 pt-2.5 border-t border-paper-200/80 transition"
          >
            <span>View Materials</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Labour Wages */}
        <div className="rounded-xl border border-paper-200 bg-paper-50/50 p-4 flex flex-col justify-between hover:border-emerald-300 transition">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-600">
                <HardHat className="h-4 w-4 text-emerald-700" />
                <span>Labour</span>
              </div>
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {labPercent}%
              </span>
            </div>

            <p className="mt-2.5 text-lg font-semibold tracking-tight tabular-nums text-ink-900 sm:text-xl">
              <AnimatedNumber value={labourTotal} />
            </p>
            <p className="text-[11px] text-ink-500 mt-0.5">
              Masonry, bar bending, carpentry...
            </p>
          </div>

          <Link
            href="/expenses?type=LABOUR"
            className="mt-3.5 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 pt-2.5 border-t border-paper-200/80 transition"
          >
            <span>View Labour</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Other / Machinery / Services */}
        <div className="rounded-xl border border-paper-200 bg-paper-50/50 p-4 flex flex-col justify-between hover:border-paper-300 transition">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-600">
                <MoreHorizontal className="h-4 w-4 text-ink-600" />
                <span>Other</span>
              </div>
              <span className="rounded-md bg-paper-200 px-2 py-0.5 text-xs font-bold text-ink-700">
                {othPercent}%
              </span>
            </div>

            <p className="mt-2.5 text-lg font-semibold tracking-tight tabular-nums text-ink-900 sm:text-xl">
              <AnimatedNumber value={otherTotal} />
            </p>
            <p className="text-[11px] text-ink-500 mt-0.5">
              Machinery, transport, permits, fees...
            </p>
          </div>

          <Link
            href="/expenses?type=OTHER"
            className="mt-3.5 inline-flex items-center gap-1 text-xs font-bold text-ink-700 hover:text-ink-900 pt-2.5 border-t border-paper-200/80 transition"
          >
            <span>View Other</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
