"use client";

import Link from "next/link";
import { ArrowRight, Package, HardHat, MoreHorizontal } from "lucide-react";
import { formatINR } from "@/lib/money";
import { useLanguage } from "@/context/language-context";

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
  const { language } = useLanguage();

  const total = grandTotal > 0 ? grandTotal : 1;
  const matPercent = Math.round((materialTotal / total) * 100);
  const labPercent = Math.round((labourTotal / total) * 100);
  const othPercent = Math.max(0, 100 - matPercent - labPercent);

  return (
    <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-ink-900 leading-tight">
            {language === "te" ? "డబ్బు ఎక్కడికి వెళ్తోంది?" : "Where Money is Going"}
          </h2>
          <p className="text-xs text-ink-500 mt-0.5">
            {language === "te"
              ? "సామాగ్రి ఖర్చులు మరియు కూలీల చెల్లింపులు వేర్వేరుగా లెక్కించబడ్డాయి"
              : "Material purchases and worker wages are strictly separated"}
          </p>
        </div>
      </div>

      {/* 3-Column Split */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Material Purchases */}
        <div className="rounded-xl border border-paper-200 bg-paper-50/50 p-4 flex flex-col justify-between hover:border-clay-300 transition">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-600">
                <Package className="h-4 w-4 text-clay-600" />
                <span>{language === "te" ? "సామాగ్రి" : "Material"}</span>
              </div>
              <span className="rounded-md bg-clay-100 px-1.5 py-0.5 text-xs font-bold text-clay-800">
                {matPercent}%
              </span>
            </div>

            <p className="font-display text-xl sm:text-2xl font-bold text-ink-900 mt-2">
              {formatINR(materialTotal)}
            </p>
            <p className="text-[11px] text-ink-500 mt-0.5">
              {language === "te" ? "సిమెంట్, స్టీల్, ఇసుక, ఇటుకలు..." : "Cement, steel, sand, tiles..."}
            </p>
          </div>

          <Link
            href="/expenses?type=MATERIAL"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-clay-700 hover:text-clay-900 pt-2 border-t border-paper-200/80 transition"
          >
            <span>{language === "te" ? "సామాగ్రి బిల్లులు" : "View Materials"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Labour Wages */}
        <div className="rounded-xl border border-paper-200 bg-paper-50/50 p-4 flex flex-col justify-between hover:border-emerald-300 transition">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-600">
                <HardHat className="h-4 w-4 text-emerald-700" />
                <span>{language === "te" ? "కూలీలు" : "Labour"}</span>
              </div>
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-800">
                {labPercent}%
              </span>
            </div>

            <p className="font-display text-xl sm:text-2xl font-bold text-ink-900 mt-2">
              {formatINR(labourTotal)}
            </p>
            <p className="text-[11px] text-ink-500 mt-0.5">
              {language === "te" ? "మేస్త్రీ, కూలీలు, కార్పెంటర్..." : "Masonry, bar bending, carpentry..."}
            </p>
          </div>

          <Link
            href="/expenses?type=LABOUR"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 pt-2 border-t border-paper-200/80 transition"
          >
            <span>{language === "te" ? "కూలీల చెల్లింపులు" : "View Labour"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Other / Machinery */}
        <div className="rounded-xl border border-paper-200 bg-paper-50/50 p-4 flex flex-col justify-between hover:border-paper-300 transition">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-600">
                <MoreHorizontal className="h-4 w-4 text-ink-600" />
                <span>{language === "te" ? "ఇతర ఖర్చులు" : "Other"}</span>
              </div>
              <span className="rounded-md bg-paper-200 px-1.5 py-0.5 text-xs font-bold text-ink-700">
                {othPercent}%
              </span>
            </div>

            <p className="font-display text-xl sm:text-2xl font-bold text-ink-900 mt-2">
              {formatINR(otherTotal)}
            </p>
            <p className="text-[11px] text-ink-500 mt-0.5">
              {language === "te" ? "JCB, రవాణా, అనుమతులు..." : "Machinery, transport, fees..."}
            </p>
          </div>

          <Link
            href="/expenses?type=OTHER"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-ink-700 hover:text-ink-900 pt-2 border-t border-paper-200/80 transition"
          >
            <span>{language === "te" ? "ఇతర బిల్లులు" : "View Other"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
