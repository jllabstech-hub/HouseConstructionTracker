"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { deleteExpense } from "@/lib/actions/expenses";
import { formatINR, addMoney } from "@/lib/money";
import { getTypeTotals, type ExpenseRecord } from "@/lib/finance/aggregations";
import { getStageConfig, getStageOrderNumber } from "@/lib/catalog/stage-ordering";
import { TablePagination } from "@/components/ui/table-pagination";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

type Row = ExpenseRecord & { receiptCount?: number };

export function ExpenseTable({
  projectId,
  expenses,
  typeFilter,
}: {
  projectId: string;
  expenses: Row[];
  typeFilter?: string;
}) {
  const router = useRouter();
  const { language, t, getStageName } = useLanguage();
  const [pending, start] = useTransition();
  const [query, setQuery] = useState("");
  const [type, setType] = useState(typeFilter ?? "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeDateFilter, setActiveDateFilter] = useState("all");
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [sortOrder, setSortOrder] = useState<"STAGE" | "DATE">("STAGE");

  const [activeTab, setActiveTab] = useState<"ALL" | "MATERIAL" | "LABOUR" | "SERVICE" | "RECEIPTS">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const availableStages = useMemo(() => {
    const map = new Map<string, number>();
    for (const exp of expenses) {
      if (exp.constructionStageName) {
        map.set(exp.constructionStageName, (map.get(exp.constructionStageName) ?? 0) + 1);
      }
    }
    return [...map.entries()].sort(([stageA], [stageB]) => {
      return getStageOrderNumber(stageA) - getStageOrderNumber(stageB);
    });
  }, [expenses]);

  const filtered = useMemo(() => {
    return expenses.filter((row) => {
      if (activeTab === "MATERIAL" && row.expenseType !== "MATERIAL") return false;
      if (activeTab === "LABOUR" && row.expenseType !== "LABOUR") return false;
      if (activeTab === "SERVICE" && !["SERVICE", "EQUIPMENT", "PROFESSIONAL", "OTHER"].includes(row.expenseType)) return false;
      if (activeTab === "RECEIPTS" && (!row.receiptCount || row.receiptCount === 0)) return false;
      if (selectedStage !== "ALL" && row.constructionStageName !== selectedStage) return false;
      if (type && row.expenseType !== type) return false;
      if (paymentMethod && row.paymentMethod !== paymentMethod) return false;
      if (from && new Date(row.date) < new Date(from)) return false;
      if (to && new Date(row.date) > new Date(to)) return false;
      if (query) {
        const haystack = [
          row.description,
          row.vendorName,
          row.workerName,
          row.materialCategoryName,
          row.labourCategoryName,
          row.serviceCategoryName,
          row.constructionStageName,
          row.floorName,
          row.invoiceNumber,
          row.paymentMethod,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [expenses, activeTab, selectedStage, type, paymentMethod, from, to, query]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, type, paymentMethod, from, to, activeTab, selectedStage, sortOrder]);

  const hasActiveFilters =
    query !== "" ||
    selectedStage !== "ALL" ||
    activeDateFilter !== "all" ||
    paymentMethod !== "" ||
    type !== "" ||
    activeTab !== "ALL";

  function resetAllFilters() {
    setQuery("");
    setType("");
    setFrom("");
    setTo("");
    setActiveDateFilter("all");
    setSelectedStage("ALL");
    setPaymentMethod("");
    setActiveTab("ALL");
  }

  const sortedAndFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortOrder === "STAGE") {
        const orderA = getStageOrderNumber(a.constructionStageName);
        const orderB = getStageOrderNumber(b.constructionStageName);
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [filtered, sortOrder]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedAndFiltered.slice(start, start + pageSize);
  }, [sortedAndFiltered, currentPage, pageSize]);

  const totals = getTypeTotals(filtered);
  const allTotals = getTypeTotals(expenses);
  const receiptsCount = expenses.filter((e) => (e.receiptCount ?? 0) > 0).length;

  function applyQuickDate(kind: string) {
    setActiveDateFilter(kind);
    const now = new Date();
    if (kind === "all") {
      setFrom("");
      setTo("");
    } else if (kind === "today") {
      const iso = now.toISOString().slice(0, 10);
      setFrom(iso);
      setTo(iso);
    } else if (kind === "month") {
      setFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
      setTo(now.toISOString().slice(0, 10));
    } else if (kind === "last") {
      setFrom(new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10));
      setTo(new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10));
    }
  }

  function getCategoryName(row: Row) {
    return (
      row.materialCategoryName ??
      row.labourCategoryName ??
      row.serviceCategoryName ??
      row.equipmentCategoryName ??
      row.professionalCategoryName ??
      row.expenseType
    );
  }

  function getIconForType(expenseType: string) {
    if (expenseType === "MATERIAL") return "🧱";
    if (expenseType === "LABOUR") return "👷";
    if (expenseType === "SERVICE") return "🚜";
    if (expenseType === "EQUIPMENT") return "⚙️";
    if (expenseType === "PROFESSIONAL") return "📐";
    return "📦";
  }

  return (
    <div className="space-y-4">
      {/* 1. Main Navigation Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 p-1 bg-paper-100/80 rounded-2xl border border-paper-200">
        {[
          { id: "ALL", label: `📋 ${t.passbook.allPassbook}`, count: expenses.length, amount: allTotals.total },
          { id: "MATERIAL", label: `🧱 ${t.types.materials}`, count: expenses.filter(e => e.expenseType === "MATERIAL").length, amount: allTotals.MATERIAL },
          { id: "LABOUR", label: `👷 ${t.types.labourWages}`, count: expenses.filter(e => e.expenseType === "LABOUR").length, amount: allTotals.LABOUR },
          { id: "SERVICE", label: `🚜 ${t.types.machineryOther}`, count: expenses.filter(e => ["SERVICE","EQUIPMENT","PROFESSIONAL","OTHER"].includes(e.expenseType)).length, amount: allTotals.SERVICE.plus(allTotals.EQUIPMENT).plus(allTotals.PROFESSIONAL).plus(allTotals.OTHER) },
          { id: "RECEIPTS", label: `📸 ${t.passbook.paperBills} (${receiptsCount})`, count: receiptsCount },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as typeof activeTab);
              if (tab.id !== "ALL" && tab.id !== "RECEIPTS") {
                setType("");
              }
            }}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs",
              activeTab === tab.id
                ? "bg-clay-600 text-white shadow-sm"
                : "bg-white text-ink-700 hover:bg-paper-50",
            )}
          >
            <span>{tab.label}</span>
            {tab.amount !== undefined && (
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px]", activeTab === tab.id ? "bg-clay-700/80 text-white" : "bg-paper-100 text-ink-500 font-semibold")}>
                {formatINR(tab.amount)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 2. Redesigned Clean & Compact Filter Center */}
      <div className="rounded-3xl border border-paper-200 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
        {/* Row 1: Omni-Search Bar & Status Indicator & Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-ink-400" />
            <input
              type="text"
              placeholder={t.passbook.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl border border-paper-300 bg-paper-50 py-2.5 pl-10 pr-9 text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clay-500/20 transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-3 text-ink-400 hover:text-ink-600 p-0.5 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Reset & Status Summary */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper-100/90 text-xs font-semibold text-ink-700">
              <span>📊</span>
              <span>
                <strong className="text-ink-900">{filtered.length}</strong> / {expenses.length} {language === "te" ? "బిల్లులు" : "bills"}
              </span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 px-3 py-1.5 text-xs font-bold transition active:scale-95"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{language === "te" ? "రీసెట్" : "Reset"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: 4 Smart Compact Dropdowns / Control Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-paper-100">
          {/* Dropdown 1: Construction Stage Picker */}
          <div>
            <label className="block text-[11px] font-bold text-ink-500 uppercase tracking-wider mb-1">
              🏗️ {t.passbook.stage}
            </label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-bold text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="ALL">
                🏗️ {language === "te" ? "అన్ని దశలు" : "All Construction Stages"} ({expenses.length})
              </option>
              {availableStages.map(([stg, count]) => {
                const conf = getStageConfig(stg);
                const localizedName = getStageName(stg);
                return (
                  <option key={stg} value={stg}>
                    {conf?.icon ?? "🏗️"} {localizedName} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Dropdown 2: Date Filter */}
          <div>
            <label className="block text-[11px] font-bold text-ink-500 uppercase tracking-wider mb-1">
              📅 {t.passbook.date}
            </label>
            <select
              value={activeDateFilter}
              onChange={(e) => applyQuickDate(e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-bold text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="all">📅 {t.passbook.allDates}</option>
              <option value="today">⚡ {t.passbook.today}</option>
              <option value="month">🗓️ {t.passbook.thisMonth}</option>
              <option value="last">⏮️ {t.passbook.lastMonth}</option>
            </select>
          </div>

          {/* Dropdown 3: Payment Method Filter */}
          <div>
            <label className="block text-[11px] font-bold text-ink-500 uppercase tracking-wider mb-1">
              💳 {language === "te" ? "చెల్లింపు విధానం" : "Payment Mode"}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-bold text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="">💳 {language === "te" ? "అన్ని చెల్లింపులు" : "All Payment Modes"}</option>
              <option value="UPI">📱 UPI (GPay / PhonePe / Paytm)</option>
              <option value="CASH">💵 {language === "te" ? "నగదు (Cash)" : "Cash"}</option>
              <option value="BANK_TRANSFER">🏦 {language === "te" ? "బ్యాంక్ బదిలీ (Bank Transfer)" : "Bank Transfer"}</option>
              <option value="CHEQUE">📝 {language === "te" ? "చెక్ (Cheque)" : "Cheque"}</option>
            </select>
          </div>

          {/* Dropdown 4: Sort Order */}
          <div>
            <label className="block text-[11px] font-bold text-ink-500 uppercase tracking-wider mb-1">
              🔄 {language === "te" ? "వరుస క్రమం" : "Sort Order"}
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "STAGE" | "DATE")}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 px-3 py-2 text-xs font-bold text-ink-900 focus:border-clay-500 focus:bg-white focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="STAGE">🏗️ {language === "te" ? "దశల క్రమం (1 → 20)" : "Stage Sequence (1 → 20)"}</option>
              <option value="DATE">📅 {language === "te" ? "ఇటీవలి తేదీ" : "Recent Date (Newest First)"}</option>
            </select>
          </div>
        </div>
      </div>
      {/* 2. Total Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-2xl bg-gradient-to-r from-clay-50 to-paper-100 p-3.5 border border-clay-200/80 shadow-2xs">
        <div>
          <p className="text-[11px] font-bold uppercase text-ink-400">{t.passbook.filteredTotal}</p>
          <p className="text-base sm:text-lg font-bold text-clay-800">{formatINR(totals.total)}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase text-ink-400">🧱 {t.types.materials}</p>
          <p className="text-base sm:text-lg font-bold text-ink-800">{formatINR(totals.MATERIAL)}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase text-ink-400">👷 {t.types.labourWages}</p>
          <p className="text-base sm:text-lg font-bold text-ink-800">{formatINR(totals.LABOUR)}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase text-ink-400">🚜 {t.types.machineryOther}</p>
          <p className="text-base sm:text-lg font-bold text-ink-800">
            {formatINR(addMoney(totals.SERVICE, totals.EQUIPMENT, totals.PROFESSIONAL, totals.OTHER))}
          </p>
        </div>
      </div>

      {/* 3. Empty State */}
      {filtered.length === 0 && (
        <div className="rounded-3xl border border-paper-200 bg-white p-10 text-center space-y-3">
          <div className="text-4xl">{activeTab === "RECEIPTS" ? "📸" : "🔍"}</div>
          <p className="font-display text-lg font-bold text-ink-900">
            {activeTab === "RECEIPTS" ? (language === "te" ? "ఇంకా బిల్లు ఫోటోలు అప్‌లోడ్ చేయలేదు" : "No paper bills uploaded yet") : t.passbook.noExpenses}
          </p>
          <p className="text-xs text-ink-500 max-w-sm mx-auto">
            {activeTab === "RECEIPTS"
              ? (language === "te" ? "ఖర్చు నమోదు చేసేటప్పుడు బిల్లు ఫోటోలు లేదా PDFలను జతచేయవచ్చు." : "You can attach camera photos or PDFs of physical bills whenever you record an expense.")
              : t.passbook.noExpensesSub}
          </p>
          <Link
            href="/expenses/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs"
          >
            <Plus className="h-4 w-4" /> {activeTab === "RECEIPTS" ? (language === "te" ? "బిల్లుతో ఖర్చు నమోదు చేయండి" : "Add Expense with Bill Photo") : t.passbook.addNewExpense}
          </Link>
        </div>
      )}

      {/* 3. Receipts & Bills Photo Gallery View */}
      {activeTab === "RECEIPTS" && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((row) => (
            <div key={row.id} className="rounded-3xl border border-paper-200 bg-white p-4 shadow-sm hover:shadow-md transition space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-clay-700 bg-clay-50 px-2 py-0.5 rounded-lg">
                  {row.invoiceNumber ? `Bill #${row.invoiceNumber}` : (language === "te" ? "క్యాష్ మెమో" : "Cash Memo")}
                </span>
                <span className="text-xs text-ink-400 font-medium">
                  {format(new Date(row.date), "dd MMM yyyy")}
                </span>
              </div>

              <div className="flex items-center gap-3 bg-paper-50 p-3 rounded-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-paper-200 text-2xl shadow-xs">
                  📸
                </div>
                <div>
                  <p className="text-sm font-bold text-ink-900 leading-snug">{row.description}</p>
                  <p className="text-xs text-ink-500">{row.vendorName ?? row.workerName ?? (language === "te" ? "ప్రత్యక్ష సైట్ ఖర్చు" : "Direct Site Expense")}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-paper-100">
                <p className="text-base font-bold text-ink-900">{formatINR(row.amount)}</p>
                <Link
                  href={`/expenses/${row.id}`}
                  className="rounded-xl bg-clay-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-clay-700"
                >
                  {language === "te" ? "బిల్లు చూడండి 👁️" : "View Bill 👁️"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Mobile Passbook Cards View (Visible on Mobile & Tablet when not in Receipts grid) */}
      {activeTab !== "RECEIPTS" && (
        <div className="space-y-3 md:hidden">
        {paginatedRows.map((row) => (
          <div
            key={row.id}
            className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs space-y-2.5 transition active:bg-paper-50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getIconForType(row.expenseType)}</span>
                <div>
                  <p className="text-xs font-bold text-clay-800 uppercase tracking-wider">
                    {getCategoryName(row)}
                  </p>
                  <p className="text-sm font-semibold text-ink-900 leading-snug">{row.description}</p>
                </div>
              </div>
              <p className="text-lg font-bold text-ink-900 whitespace-nowrap">
                {formatINR(row.amount)}
              </p>
            </div>

            {/* Details line: Qty, Vendor/Worker, Stage */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500 border-t border-paper-100 pt-2">
              {row.quantity && (
                <span className="font-medium text-ink-700">
                  📦 {row.quantity} {row.unit ? ((language === "te" && (t.units as Record<string, string>)[row.unit]) ? (t.units as Record<string, string>)[row.unit] : row.unit) : ""}
                  {row.rate ? ` @ ${formatINR(row.rate)}` : ""}
                </span>
              )}
              {(row.vendorName || row.workerName) && (
                <span>👤 {row.vendorName ?? row.workerName}</span>
              )}
              {row.floorName && <span>🏢 {row.floorName}</span>}
              {row.constructionStageName && (
                <span className="inline-flex items-center gap-1 font-bold text-clay-800 bg-clay-50 px-2 py-0.5 rounded-md border border-clay-200/60">
                  <span>{getStageConfig(row.constructionStageName)?.icon ?? "🏗️"}</span>
                  <span>{getStageName(row.constructionStageName)}</span>
                </span>
              )}
            </div>

            {/* Bottom Footer: Date, Payment mode & Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-paper-100 text-xs">
              <div className="flex items-center gap-2 text-ink-400 font-medium">
                <span>{format(new Date(row.date), "dd MMM yyyy")}</span>
                <span>·</span>
                <span className="rounded-md bg-paper-100 px-1.5 py-0.5 font-semibold text-ink-700">
                  {row.paymentMethod?.replaceAll("_", " ")}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/expenses/${row.id}`}
                  className="flex items-center gap-1 font-bold text-clay-700 hover:underline"
                >
                  <Pencil className="h-3.5 w-3.5" /> {t.passbook.edit}
                </Link>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (confirm(language === "te" ? "ఈ ఖర్చు నమోదును తొలగించాలా?" : "Delete this expense entry?")) {
                      start(async () => {
                        await deleteExpense(projectId, row.id!);
                        router.refresh();
                      });
                    }
                  }}
                  className="text-ink-400 hover:text-red-600 p-1"
                  title={t.passbook.delete}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* 5. Desktop Tabular View (Visible on Medium & Large Screens when not in receipts gallery) */}
      {activeTab !== "RECEIPTS" && (
        <div className="hidden md:block overflow-hidden rounded-3xl border border-paper-200 bg-white shadow-xs">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-paper-100 text-[11px] font-bold uppercase tracking-wider text-ink-500 border-b border-paper-200">
              <tr>
                <th className="px-4 py-3">{t.passbook.date}</th>
                <th className="px-4 py-3">{t.passbook.type}</th>
                <th className="px-4 py-3">{t.passbook.stage}</th>
                <th className="px-4 py-3">{t.passbook.category}</th>
                <th className="px-4 py-3">{t.passbook.description}</th>
                <th className="px-4 py-3">{t.passbook.quantity}</th>
                <th className="px-4 py-3">{t.passbook.rate}</th>
                <th className="px-4 py-3 text-right">{t.passbook.amount}</th>
                <th className="px-4 py-3">{t.passbook.vendorWorker}</th>
                <th className="px-4 py-3">{t.passbook.floor}</th>
                <th className="px-4 py-3">{t.passbook.payment}</th>
                <th className="px-4 py-3 text-right">{t.passbook.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-100">
              {paginatedRows.map((row) => (
                <tr key={row.id} className="hover:bg-paper-50/80 transition">
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-ink-500">
                    {format(new Date(row.date), "dd-MMM-yyyy")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-paper-100 px-2 py-0.5 text-xs font-bold text-ink-800">
                      <span>{getIconForType(row.expenseType)}</span>
                      {row.expenseType}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    {row.constructionStageName ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-clay-50 px-2 py-0.5 font-bold text-clay-800 border border-clay-200/60">
                        <span>{getStageConfig(row.constructionStageName)?.icon ?? "🏗️"}</span>
                        <span>{getStageName(row.constructionStageName)}</span>
                      </span>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink-900 text-xs">
                    {getCategoryName(row)}
                  </td>
                  <td className="px-4 py-3 text-ink-700 max-w-xs truncate text-xs">
                    {row.description}
                  </td>
                  <td className="px-4 py-3 text-ink-600 text-xs whitespace-nowrap">
                    {row.quantity ? `${row.quantity} ${row.unit ? ((language === "te" && (t.units as Record<string, string>)[row.unit]) ? (t.units as Record<string, string>)[row.unit] : row.unit) : ""}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-600 text-xs whitespace-nowrap">
                    {row.rate ? formatINR(row.rate) : "—"}
                  </td>
                  <td className="px-4 py-3 font-bold text-ink-900 text-right whitespace-nowrap">
                    {formatINR(row.amount)}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-600 whitespace-nowrap">
                    {row.vendorName ?? row.workerName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500 whitespace-nowrap">
                    {row.floorName ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-ink-500">
                    {row.paymentMethod?.replaceAll("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap text-xs">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/expenses/${row.id}`}
                        className="rounded-lg p-1 text-clay-700 hover:bg-paper-100 font-semibold"
                      >
                        {t.passbook.edit}
                      </Link>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          if (confirm(language === "te" ? "ఈ ఖర్చు నమోదును తొలగించాలా?" : "Delete this expense entry?")) {
                            start(async () => {
                              await deleteExpense(projectId, row.id!);
                              router.refresh();
                            });
                          }
                        }}
                        className="rounded-lg p-1 text-ink-400 hover:text-red-600"
                        title={t.passbook.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. Pagination Navigation */}
      {activeTab !== "RECEIPTS" && filtered.length > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 15, 25, 50, 100]}
        />
      )}
    </div>
  );
}
