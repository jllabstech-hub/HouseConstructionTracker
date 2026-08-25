"use client";

import { useState } from "react";
import {
  FileText,
  HardHat,
  Layers,
  Milestone,
  Package,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { PdfActions } from "@/components/reports/pdf-actions";

export type WorkWiseRow = {
  id: string;
  name: string;
  material: string;
  labour: string;
  total: string;
};

export function ReportsTabs({
  projectId,
  workWise,
}: {
  projectId: string;
  workWise: WorkWiseRow[];
}) {
  const { language, t } = useLanguage();

  // Selected Report Configuration
  const [reportType, setReportType] = useState<string>("total");
  const [dateRange, setDateRange] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const reportTypes = [
    {
      id: "total",
      label: language === "te" ? "మొత్తం ఖర్చుల నివేదిక" : "Total Expenditure Statement",
      desc: language === "te" ? "ఇంటి పూర్తి నిర్మాణ ఖర్చుల సమగ్ర నివేదిక" : "Complete expenditure summary and category audit",
      icon: FileText,
    },
    {
      id: "material",
      label: language === "te" ? "సామాగ్రి కొనుగోళ్లు" : "Material Purchases Report",
      desc: language === "te" ? "సిమెంట్, స్టీల్, ఇసుక, ఇటుకల కొనుగోలు బిల్లులు" : "Every material purchase with quantity, rate and shop name",
      icon: Package,
    },
    {
      id: "labour",
      label: language === "te" ? "కూలీ & మేస్త్రీ చెల్లింపులు" : "Labour Wages & Contractors",
      desc: language === "te" ? "రోజువారీ కూలీలు మరియు కాంట్రాక్ట్ చెల్లింపుల లెడ్జర్" : "Daily wages, mason attendance and contract payouts",
      icon: HardHat,
    },
    {
      id: "stage",
      label: language === "te" ? "నిర్మాణ దశల వారీ నివేదిక" : "Stage-Wise Construction Cost",
      desc: language === "te" ? "20 దశల వరుస క్రమంలో అయిన ఖర్చుల స్టేట్‌మెంట్" : "Sequential 20-stage timeline expenditure",
      icon: Milestone,
    },
    {
      id: "work-wise",
      label: language === "te" ? "పని విభాగాల వారీ మ్యాట్రిక్స్" : "Work-Wise Trade Matrix",
      desc: language === "te" ? "మేస్త్రీ, టైల్స్, వుడ్‌వర్క్, ప్లంబింగ్ వారీగా ఖర్చులు" : "Material + Labour combined for each trade",
      icon: Layers,
    },
    {
      id: "budget",
      label: language === "te" ? "బడ్జెట్ vs వాస్తవ ఖర్చు" : "Budget vs Actual Variance",
      desc: language === "te" ? "ప్లాన్ చేసిన అంచనాలు vs వాస్తవ ఖర్చుల పోలిక" : "Planned budget limits against actual expenditure",
      icon: Wallet,
    },
    {
      id: "vendor",
      label: language === "te" ? "దుకాణాలు & సప్లయర్ల లెడ్జర్" : "Vendor & Supplier Ledger",
      desc: language === "te" ? "సప్లయర్ల వారీగా కొనుగోళ్లు మరియు బకాయిలు" : "Purchases grouped by hardware and cement stores",
      icon: Store,
    },
    {
      id: "worker",
      label: language === "te" ? "మేస్త్రీల చెల్లింపుల లెడ్జర్" : "Worker / Contractor Ledger",
      desc: language === "te" ? "మేస్త్రీల వారీగా చెల్లించిన కూలీల నివేదిక" : "Payouts grouped by mason and contractor",
      icon: Users,
    },
  ];

  // Derive date bounds
  let fromDate: string | undefined = undefined;
  let toDate: string | undefined = undefined;

  const now = new Date();
  if (dateRange === "month") {
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    toDate = now.toISOString().slice(0, 10);
  } else if (dateRange === "lastMonth") {
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    fromDate = new Date(year, lastMonth, 1).toISOString().slice(0, 10);
    toDate = new Date(year, lastMonth + 1, 0).toISOString().slice(0, 10);
  } else if (dateRange === "custom") {
    fromDate = customFrom || undefined;
    toDate = customTo || undefined;
  }

  const selectedReportObj = reportTypes.find((r) => r.id === reportType) ?? reportTypes[0];
  const Icon = selectedReportObj.icon;

  const query = new URLSearchParams({
    projectId,
    kind: reportType,
    ...(fromDate ? { from: fromDate } : {}),
    ...(toDate ? { to: toDate } : {}),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-paper-200/80 pb-4">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
          {language === "te" ? "నివేదికలు & పి.డి.ఎఫ్" : "Reports"}
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
          {language === "te"
            ? "ఇంటి నిర్మాణ ఖర్చుల స్టేట్‌మెంట్‌లను తయారు చేయండి, డౌన్‌లోడ్ చేసుకోండి లేదా వాట్సాప్‌లో పంపండి"
            : "Generate, download and share professional construction expenditure reports"}
        </p>
      </div>

      {/* 1. Interactive Report Builder */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="border-b border-paper-100 pb-3">
          <h2 className="font-display text-base sm:text-lg font-bold text-ink-900">
            {language === "te" ? "నివేదిక ఎంపిక" : "Report Builder"}
          </h2>
          <p className="text-xs text-ink-500 mt-0.5">
            {language === "te" ? "మీకు కావలసిన నివేదిక రకాన్ని మరియు కాలవ్యవధిని ఎంచుకోండి" : "Choose statement type and date filter"}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Report Type Selector */}
          <div>
            <label className="text-xs font-bold text-ink-700 block mb-1.5">
              {language === "te" ? "1. ఏ నివేదిక కావాలి?" : "1. What do you want to report?"}
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs sm:text-sm font-semibold text-ink-900 focus:border-clay-500 focus:outline-none"
            >
              {reportTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div>
            <label className="text-xs font-bold text-ink-700 block mb-1.5">
              {language === "te" ? "2. కాలవ్యవధి (తేదీ పరిధి)" : "2. Date Range"}
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs sm:text-sm font-semibold text-ink-900 focus:border-clay-500 focus:outline-none"
            >
              <option value="all">{language === "te" ? "మొదటి నుండి ఇప్పటివరకు (All Time)" : "All Time"}</option>
              <option value="month">{language === "te" ? "ఈ నెల (This Month)" : "This Month"}</option>
              <option value="lastMonth">{language === "te" ? "గత నెల (Last Month)" : "Last Month"}</option>
              <option value="custom">{language === "te" ? "నిర్దిష్ట తేదీలు (Custom Range)" : "Custom Date Range"}</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs if selected */}
        {dateRange === "custom" && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1">
                {language === "te" ? "ప్రారంభ తేదీ" : "From Date"}
              </label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2 text-xs font-medium text-ink-900"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1">
                {language === "te" ? "ముగింపు తేదీ" : "To Date"}
              </label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2 text-xs font-medium text-ink-900"
              />
            </div>
          </div>
        )}

        {/* Selected Statement Card & Actions */}
        <div className="rounded-xl border border-clay-200 bg-clay-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clay-600 text-white">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm sm:text-base font-bold text-ink-900">
                {selectedReportObj.label}
              </p>
              <p className="text-xs text-ink-500 mt-0.5">
                {selectedReportObj.desc}
              </p>
            </div>
          </div>

          <PdfActions
            projectId={projectId}
            kind={reportType}
            from={fromDate}
            to={toDate}
          />
        </div>
      </div>

      {/* 2. Quick Report Presets */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-3">
        <h3 className="font-display text-sm font-bold text-ink-900">
          {language === "te" ? "త్వరిత నివేదికల షార్ట్‌కట్‌లు" : "Quick Report Shortcuts"}
        </h3>
        <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-4">
          {reportTypes.slice(0, 4).map((rt) => {
            const RtIcon = rt.icon;
            const isSelected = reportType === rt.id;
            return (
              <button
                key={rt.id}
                type="button"
                onClick={() => setReportType(rt.id)}
                className={cn(
                  "flex items-start gap-2.5 rounded-xl border p-3 text-left transition active:scale-98",
                  isSelected
                    ? "border-clay-600 bg-clay-50/60 shadow-2xs"
                    : "border-paper-200 bg-paper-50/50 hover:bg-paper-100/60"
                )}
              >
                <RtIcon className={cn("h-4 w-4 shrink-0 mt-0.5", isSelected ? "text-clay-600" : "text-ink-500")} />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink-900 truncate">{rt.label}</p>
                  <p className="text-[11px] text-ink-500 line-clamp-1 mt-0.5">{rt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Work-Wise Trade Matrix Breakdown (Reference Table) */}
      {workWise.length > 0 && (
        <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-3">
          <div>
            <h3 className="font-display text-sm font-bold text-ink-900">
              {language === "te" ? "పని విభాగాల వారీ ఖర్చుల పట్టిక" : "Work-Wise Trade Matrix Reference"}
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">
              {language === "te" ? "ప్రతి పనికి సామాగ్రి మరియు కూలీ ఖర్చుల మొత్తం" : "Material + Labour combined for key trade areas"}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink-700">
              <thead className="border-b border-paper-200 bg-paper-50/70 font-bold uppercase tracking-wider text-ink-500 text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">{language === "te" ? "పని విభాగం" : "Trade / Work Area"}</th>
                  <th className="py-2.5 px-3 text-right">{language === "te" ? "సామాగ్రి" : "Material"}</th>
                  <th className="py-2.5 px-3 text-right">{language === "te" ? "కూలీలు" : "Labour"}</th>
                  <th className="py-2.5 px-3 text-right">{language === "te" ? "మొత్తం" : "Total"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-100">
                {workWise.map((w) => (
                  <tr key={w.id} className="hover:bg-paper-50/50 transition">
                    <td className="py-2.5 px-3 font-bold text-ink-900">{w.name}</td>
                    <td className="py-2.5 px-3 text-right font-medium">{formatINR(Number(w.material))}</td>
                    <td className="py-2.5 px-3 text-right font-medium">{formatINR(Number(w.labour))}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-ink-900">{formatINR(Number(w.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
