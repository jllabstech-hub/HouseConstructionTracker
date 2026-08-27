"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  X,
  FileText,
  Download,
  Eye,
  Share2,
  Phone,
  PhoneCall,
  MessageCircle,
  IndianRupee,
  Milestone,
  Files,
  ArrowRight,
  Sparkles,
  Receipt,
  Building2,
  HardHat,
  Package,
  Store,
  Loader2,
  CornerDownLeft,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

type SearchResultData = {
  query: string;
  smartReport: {
    title: string;
    subtitle: string;
    kind: string;
    totalAmount: number;
    totalFormatted: string;
    count: number;
    pdfDownloadUrl: string;
    pdfPreviewUrl: string;
    reportHubUrl: string;
    recentTransactions: {
      id?: string;
      date: string;
      category: string;
      description: string;
      party: string;
      amount: string;
    }[];
  } | null;
  expenses: {
    id: string;
    date: string;
    amount: string;
    rawAmount: number;
    description: string;
    category: string;
    party: string | null;
    paymentMethod: string;
    url: string;
  }[];
  contacts: {
    id: string;
    name: string;
    type: "VENDOR" | "WORKER";
    badge: string;
    subtitle: string;
    phone: string | null;
    url: string;
  }[];
  stages: {
    step: number;
    name: string;
    shortName: string;
    status: string;
    percentage: number;
    url: string;
  }[];
  documents: {
    id: string;
    title: string;
    category: string;
    url: string;
  }[];
  navigation: {
    title: string;
    url: string;
    subtitle: string;
  }[];
};

export function GlobalSearchModal({
  isOpen,
  onClose,
  projectId,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResultData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchResults("");
    } else {
      setQuery("");
      setData(null);
    }
  }, [isOpen, projectId]);

  // Handle hotkeys (Escape to close)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [isOpen, onClose]);

  // Debounced search query
  useEffect(() => {
    if (!isOpen || !projectId) return;
    const timer = setTimeout(() => {
      fetchResults(query);
    }, 180);
    return () => clearTimeout(timer);
  }, [query, projectId, isOpen]);

  const fetchResults = async (q: string) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?projectId=${projectId}&q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (url: string) => {
    onClose();
    router.push(url);
  };

  if (!isOpen) return null;

  const smartReport = data?.smartReport;
  const hasResults =
    smartReport != null ||
    (data?.expenses && data.expenses.length > 0) ||
    (data?.contacts && data.contacts.length > 0) ||
    (data?.stages && data.stages.length > 0) ||
    (data?.documents && data.documents.length > 0) ||
    (data?.navigation && data.navigation.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 md:pt-14 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" role="dialog" aria-modal="true" aria-label="Global Project Search">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-paper-200 overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-paper-200 bg-white px-4 py-3.5 sm:px-5">
          <Search className="h-5 w-5 text-clay-600 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search expenses, workers, materials, and reports"
            placeholder={
              language === "te"
                ? "ఏదైనా అడగండి... ఉదా: painter bill report, cement, ramesh mason, stage 3..."
                : "Ask anything... e.g. painter bill report, cement bills, ramesh mason, stage 3..."
            }
            className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />

          {loading && <Loader2 className="h-4 w-4 text-clay-600 animate-spin shrink-0" aria-hidden="true" />}

          {query && !loading && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search input"
              className="rounded-full p-2 text-ink-400 hover:bg-paper-100 hover:text-ink-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <kbd className="hidden sm:inline-flex items-center rounded-md border border-paper-300 bg-paper-100 px-2 py-0.5 text-[10px] font-bold text-ink-500">
            ESC
          </kbd>
        </div>

        {/* 2. Scrollable Search Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* A. SMART REPORT INSTANT CARD (User query matches report intent) */}
          {smartReport && (
            <div className="rounded-2xl border-2 border-clay-500/80 bg-gradient-to-br from-clay-50/90 via-white to-amber-50/40 p-4 sm:p-5 shadow-sm space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clay-600 text-white shadow-xs">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-clay-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white tracking-wider">
                        Smart Report
                      </span>
                      <h4 className="font-display font-bold text-ink-900 text-sm sm:text-base">
                        {smartReport.title}
                      </h4>
                    </div>
                    <p className="text-xs text-ink-600 mt-0.5">{smartReport.subtitle}</p>
                  </div>
                </div>

                {/* Total Metric */}
                <div className="text-left sm:text-right shrink-0 bg-white sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-paper-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500 block">
                    {language === "te" ? "మొత్తం చెల్లింపు" : "Total Amount"}
                  </span>
                  <p className="font-display text-lg sm:text-xl font-bold text-clay-800">
                    {smartReport.totalFormatted}
                  </p>
                  <p className="text-[11px] text-ink-500 font-semibold">
                    {smartReport.count} {language === "te" ? "లావాదేవీలు" : "bills found"}
                  </p>
                </div>
              </div>

              {/* Action Buttons: PDF Download, View, WhatsApp, Full Report */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-clay-200/60">
                <a
                  href={smartReport.pdfDownloadUrl}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 hover:bg-clay-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-95"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{language === "te" ? "PDF డౌన్‌లోడ్" : "Download PDF Report"}</span>
                </a>

                <a
                  href={smartReport.pdfPreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-white hover:bg-paper-50 px-3 py-1.5 text-xs font-bold text-ink-800 shadow-2xs transition active:scale-95"
                >
                  <Eye className="h-3.5 w-3.5 text-ink-500" />
                  <span>{language === "te" ? "ప్రివ్యూ" : "Preview Statement"}</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleNavigate(smartReport.reportHubUrl)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-white hover:bg-paper-50 px-3 py-1.5 text-xs font-bold text-ink-800 shadow-2xs transition active:scale-95"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>{language === "te" ? "రిపోర్ట్స్ హబ్‌లో చూడండి" : "Open in Reports Hub"}</span>
                </button>
              </div>

              {/* Mini Itemized Breakdown Table */}
              {smartReport.recentTransactions.length > 0 && (
                <div className="mt-2 rounded-xl border border-paper-200 bg-white overflow-hidden">
                  <table className="w-full text-left text-xs text-ink-700">
                    <thead className="border-b border-paper-200 bg-paper-50/80 font-bold uppercase tracking-wider text-ink-500 text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3">Party</th>
                        <th className="py-2 px-3 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-paper-100">
                      {smartReport.recentTransactions.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-paper-50/50">
                          <td className="py-2 px-3 whitespace-nowrap text-ink-500">{tx.date}</td>
                          <td className="py-2 px-3 font-semibold text-ink-900">{tx.category}</td>
                          <td className="py-2 px-3 max-w-[150px] truncate text-ink-600">{tx.description}</td>
                          <td className="py-2 px-3 font-medium text-ink-700">{tx.party}</td>
                          <td className="py-2 px-3 text-right font-bold text-ink-900">{tx.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* B. MATCHING EXPENSES & TRANSACTIONS */}
          {data?.expenses && data.expenses.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5 text-clay-600" />
                  {language === "te" ? "సంబంధిత ఖర్చులు" : "Matching Expenses & Bills"}
                </span>
                <button
                  type="button"
                  onClick={() => handleNavigate("/expenses")}
                  className="text-xs font-semibold text-clay-700 hover:underline flex items-center gap-1"
                >
                  <span>{language === "te" ? "అన్నీ చూడండి" : "View all expenses"}</span>
                  <ArrowRight className="h-3 w-3 inline" />
                </button>
              </div>

              <div className="divide-y divide-paper-100 rounded-2xl border border-paper-200 bg-white overflow-hidden">
                {data.expenses.map((exp) => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => handleNavigate(exp.url)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-paper-50 transition gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink-900 text-xs sm:text-sm truncate">
                          {exp.category}
                        </span>
                        {exp.party && (
                          <span className="text-[11px] font-semibold text-ink-500 truncate">
                            · {exp.party}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-ink-500 truncate">{exp.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-display font-bold text-xs sm:text-sm text-ink-900">
                        {exp.amount}
                      </p>
                      <span className="text-[10px] text-ink-400 block">{exp.date}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* C. PHONE DIRECTORY CONTACTS (Shops & Workers) */}
          {data?.contacts && data.contacts.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-amber-600" />
                {language === "te" ? "ఫోన్ డైరెక్టరీ (షాపులు & వర్కర్లు)" : "Phone Directory Contacts"}
              </span>

              <div className="grid gap-2 sm:grid-cols-2">
                {data.contacts.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-paper-200 bg-white p-3 flex items-center justify-between gap-2 shadow-2xs hover:border-clay-300 transition"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-ink-900 truncate">{c.name}</p>
                      <p className="text-[11px] text-ink-500 truncate">{c.subtitle}</p>
                    </div>

                    {c.phone && (
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={`tel:${c.phone}`}
                          className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                          title="Call"
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleNavigate("/phonedirectory")}
                          className="p-1.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition font-bold text-[10px]"
                          title="Pay via UPI"
                        >
                          <IndianRupee className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* D. CONSTRUCTION STAGES */}
          {data?.stages && data.stages.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
                <Milestone className="h-3.5 w-3.5 text-blue-600" />
                {language === "te" ? "నిర్మాణ దశలు" : "Construction Stages"}
              </span>

              <div className="grid gap-2 sm:grid-cols-2">
                {data.stages.map((st) => (
                  <button
                    key={st.step}
                    type="button"
                    onClick={() => handleNavigate(st.url)}
                    className="rounded-2xl border border-paper-200 bg-white p-3 text-left hover:border-clay-400 hover:bg-paper-50 transition flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-ink-900 truncate">
                        Stage {st.step}: {st.name}
                      </p>
                      <span className="text-[10px] text-ink-500 font-semibold">{st.percentage}% complete</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-ink-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* E. DOCUMENTS */}
          {data?.documents && data.documents.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
                <Files className="h-3.5 w-3.5 text-indigo-600" />
                {language === "te" ? "డాక్యుమెంట్లు & ప్లాన్స్" : "Documents & Blueprints"}
              </span>

              <div className="divide-y divide-paper-100 rounded-2xl border border-paper-200 bg-white overflow-hidden">
                {data.documents.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => handleNavigate(doc.url)}
                    className="w-full flex items-center justify-between p-2.5 text-left hover:bg-paper-50 transition"
                  >
                    <span className="font-bold text-xs text-ink-900 truncate">{doc.title}</span>
                    <span className="rounded-md bg-paper-100 px-2 py-0.5 text-[10px] font-semibold text-ink-600 uppercase">
                      {doc.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* F. QUICK NAVIGATION SHORTCUTS */}
          {data?.navigation && data.navigation.length > 0 && !query && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                {language === "te" ? "త్వరిత నావిగేషన్" : "Quick Suggestions"}
              </span>

              <div className="grid gap-2 sm:grid-cols-2">
                {data.navigation.map((nav, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleNavigate(nav.url)}
                    className="flex items-center justify-between p-3 rounded-2xl border border-paper-200 bg-paper-50/60 hover:bg-white hover:border-clay-300 transition text-left"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-ink-900 truncate">{nav.title}</p>
                      <p className="text-[11px] text-ink-500 truncate">{nav.subtitle}</p>
                    </div>
                    <CornerDownLeft className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* NO RESULTS STATE */}
          {!loading && query && !hasResults && (
            <div className="p-8 text-center rounded-2xl border border-dashed border-paper-300 bg-paper-50/50">
              <p className="font-bold text-sm text-ink-700">
                {language === "te" ? `"${query}" కి ఎటువంటి ఫలితాలు దొరకలేదు` : `No results found for "${query}"`}
              </p>
              <p className="text-xs text-ink-500 mt-1">
                {language === "te"
                  ? "ఉదాహరణలు: painter, cement bills, ramesh mason, foundation, reports..."
                  : "Try asking for: 'painter bill report', 'cement', 'ramesh mason', 'stage 3', 'reports'..."}
              </p>
            </div>
          )}
        </div>

        {/* 3. Modal Footer Help */}
        <div className="border-t border-paper-200 bg-paper-50 px-4 py-2.5 flex items-center justify-between text-[11px] text-ink-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>AI Smart Search & Quick PDF Reports</span>
          </span>
          <span className="hidden sm:inline">Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
