"use client";

import { useState, useMemo } from "react";
import { FileText } from "lucide-react";
import { formatINR } from "@/lib/money";
import { PdfActions } from "@/components/reports/pdf-actions";
import { TablePagination } from "@/components/ui/table-pagination";
import { sortByConstructionStage } from "@/lib/catalog/stage-ordering";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

type WorkWiseRow = {
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
  const { language, t, getStageName } = useLanguage();
  const [activeTab, setActiveTab] = useState<"POPULAR" | "ALL_STATEMENTS" | "TRADE_MATRIX">("POPULAR");
  const [matrixPage, setMatrixPage] = useState(1);
  const [matrixPageSize, setMatrixPageSize] = useState(8);

  const PRIMARY_REPORTS = [
    {
      kind: "stage",
      icon: "🏗️",
      title: language === "te" ? "నిర్మాణ దశల వారీ ఖర్చుల నివేదిక" : "Stage-Wise Construction Cost Statement",
      desc: language === "te" ? "దశ 1 ప్లానింగ్ & పునాది నుండి దశ 20 ఫినిషింగ్ వరకు వరుస క్రమంలో నివేదిక." : "Sequential spend statement from Stage 1 Planning & Foundation to Stage 20 Finishing.",
      tag: language === "te" ? "దశల క్రమం" : "Chronological Stages",
    },
    {
      kind: "total",
      icon: "📄",
      title: language === "te" ? "ఇంటి పూర్తి ఖర్చుల సారాంశం" : "Complete House Summary",
      desc: language === "te" ? "ఇప్పటివరకు చేసిన మొత్తం ఖర్చులు, బడ్జెట్ స్థితి మరియు కేటగిరీల విభజన." : "Full audit report of all money spent so far, budget status, and category breakdown.",
      tag: language === "te" ? "అత్యంత ప్రజాదరణ" : "Most Popular",
    },
    {
      kind: "material",
      icon: "🧱",
      title: language === "te" ? "మెటీరియల్ కొనుగోళ్ల నివేదిక" : "Material Purchases Statement",
      desc: language === "te" ? "సిమెంట్, ఇనుము, ఇసుక, ఇటుకలు మరియు టైల్స్ కొనుగోలు బిల్లుల వివరాలు." : "Every cement bag, steel rod, sand truck, and tile bill with shop names.",
      tag: language === "te" ? "మెటీరియల్స్ మాత్రమే" : "Materials Only",
    },
    {
      kind: "labour",
      icon: "👷",
      title: language === "te" ? "కూలీ & మేస్త్రీ జీతాల నివేదిక" : "Worker Wages & Attendance",
      desc: language === "te" ? "రోజువారీ కూలీలు, కాంట్రాక్ట్ చెల్లింపులు మరియు పని గంటలు." : "Daily wages, contractor payments, and labour hours with worker names.",
      tag: language === "te" ? "కూలీలు మాత్రమే" : "Labour Only",
    },
    {
      kind: "work-wise",
      icon: "🏠",
      title: language === "te" ? "పని విభాగాల వారీ మ్యాట్రిక్స్" : "Work-Wise Trade Matrix",
      desc: language === "te" ? "మేస్త్రీ, టైల్స్, వుడ్‌వర్క్, ప్లంబింగ్ మరియు పెయింటింగ్ ఖర్చులు." : "Side-by-side cost of Masonry, Tiles, Woodwork, Plumbing, and Painting.",
      tag: language === "te" ? "విభాగాల విశ్లేషణ" : "Trade Analysis",
    },
  ];

  const SECONDARY_REPORTS = [
    {
      kind: "budget",
      icon: "💰",
      title: language === "te" ? "బడ్జెట్ vs వాస్తవ ఖర్చు" : "Budget vs Actual Variance",
      desc: language === "te" ? "ప్లాన్ చేసిన అంచనాలు vs వాస్తవ ఖర్చుల పోలిక." : "Compare planned estimates against actual spending.",
    },
    {
      kind: "monthly",
      icon: "📅",
      title: language === "te" ? "నెలవారీ ఖర్చుల నివేదిక" : "Monthly Spending Statement",
      desc: language === "te" ? "నెలల వారీగా నగదు ప్రవాహ నివేదిక." : "Month-by-month cashflow breakdown.",
    },
    {
      kind: "vendor",
      icon: "🏪",
      title: language === "te" ? "దుకాణాలు & సప్లయర్ల బిల్లులు" : "Shop & Supplier Bills",
      desc: language === "te" ? "హార్డ్‌వేర్, సిమెంట్ మరియు స్టీల్ వ్యాపారుల వారీగా బిల్లులు." : "Grouped by hardware stores, cement vendors, and steel suppliers.",
    },
    {
      kind: "worker",
      icon: "👥",
      title: language === "te" ? "మేస్త్రీలు & కాంట్రాక్టర్ల లెడ్జర్" : "Contractor & Masons Ledger",
      desc: language === "te" ? "వ్యక్తిగత మేస్త్రీ లేదా కాంట్రాక్టర్ల వారీగా చెల్లింపులు." : "Payments grouped by individual mason or subcontractor.",
    },
    {
      kind: "floor",
      icon: "🏢",
      title: language === "te" ? "అంతస్తుల వారీ ఖర్చుల నివేదిక" : "Floor-wise Cost Statement",
      desc: language === "te" ? "గ్రౌండ్ ఫ్లోర్, మొదటి అంతస్తు, టెర్రస్ వారీగా ఖర్చులు." : "Spending separated by Ground Floor, First Floor, Terrace, etc.",
    },
    {
      kind: "payment",
      icon: "💳",
      title: language === "te" ? "చెల్లింపు పద్ధతుల వివరాలు" : "Payment Method Breakdown",
      desc: language === "te" ? "నగదు vs UPI (GPay/PhonePe) vs బ్యాంక్ బదిలీ లెడ్జర్." : "Cash vs UPI (GPay/PhonePe) vs Bank Transfer ledger.",
    },
  ];

  const sortedWorkWise = useMemo(() => {
    return sortByConstructionStage(workWise);
  }, [workWise]);

  const paginatedWorkWise = sortedWorkWise.slice((matrixPage - 1) * matrixPageSize, matrixPage * matrixPageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-white p-6 sm:p-7 border border-paper-200 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-clay-700">
          <FileText className="h-6 w-6" />
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900">
            {t.reports.title}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-ink-500 max-w-2xl font-medium">
          {t.reports.subtitle}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 p-1 bg-paper-100/80 rounded-2xl border border-paper-200">
        {[
          { id: "POPULAR", label: `⭐ ${t.reports.topReports}`, count: 4 },
          { id: "ALL_STATEMENTS", label: `📑 ${t.reports.allStatements}`, count: 6 },
          { id: "TRADE_MATRIX", label: `🏠 ${t.reports.workWiseMatrix}`, count: workWise.length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs",
              activeTab === tab.id
                ? "bg-clay-600 text-white shadow-sm"
                : "bg-white text-ink-700 hover:bg-paper-50",
            )}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. Top 4 Popular Reports */}
      {activeTab === "POPULAR" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {PRIMARY_REPORTS.map((rep) => (
              <div
                key={rep.kind}
                className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-clay-300 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{rep.icon}</span>
                    <span className="rounded-full bg-clay-50 border border-clay-200 px-2.5 py-0.5 text-[11px] font-bold text-clay-800">
                      {rep.tag}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink-900">{rep.title}</h3>
                  <p className="text-xs text-ink-500 leading-relaxed font-medium">{rep.desc}</p>
                </div>

                <div className="pt-3 border-t border-paper-100">
                  <PdfActions projectId={projectId} kind={rep.kind} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. All 6 Statements Tab */}
      {activeTab === "ALL_STATEMENTS" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECONDARY_REPORTS.map((rep) => (
              <div
                key={rep.kind}
                className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{rep.icon}</span>
                    <h3 className="font-display text-sm font-bold text-ink-900">{rep.title}</h3>
                  </div>
                  <p className="text-xs text-ink-500 font-medium">{rep.desc}</p>
                </div>

                <div className="pt-2 border-t border-paper-100">
                  <PdfActions projectId={projectId} kind={rep.kind} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Work-Wise Summary Matrix Table Tab */}
      {activeTab === "TRADE_MATRIX" && (
        <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">
              Work-Wise Summary (Material + Labour)
            </h2>
            <p className="text-xs text-ink-500">
              Side-by-side total for each trade in your house
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-paper-100 text-[11px] font-bold uppercase tracking-wider text-ink-500 border-b border-paper-200">
                <tr>
                  <th className="px-4 py-3">Work Trade</th>
                  <th className="px-4 py-3">🧱 Material Cost</th>
                  <th className="px-4 py-3">👷 Labour Wages</th>
                  <th className="px-4 py-3 text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-100">
                {paginatedWorkWise.map((row) => (
                  <tr key={row.id} className="hover:bg-paper-50 transition">
                    <td className="px-4 py-3 font-bold text-ink-900 text-xs">{row.name}</td>
                    <td className="px-4 py-3 text-xs text-ink-700">{formatINR(row.material)}</td>
                    <td className="px-4 py-3 text-xs text-ink-700">{formatINR(row.labour)}</td>
                    <td className="px-4 py-3 text-right font-bold text-clay-700 text-xs">
                      {formatINR(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {workWise.length > matrixPageSize && (
            <TablePagination
              currentPage={matrixPage}
              totalItems={workWise.length}
              pageSize={matrixPageSize}
              onPageChange={setMatrixPage}
              onPageSizeChange={setMatrixPageSize}
              pageSizeOptions={[5, 8, 15, 25]}
            />
          )}
        </div>
      )}
    </div>
  );
}
