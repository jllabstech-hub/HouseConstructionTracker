"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Filter,
  HardHat,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { Badge, expenseTone } from "@/components/ui/badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ExpenseFiltersDrawer, type AdvancedFiltersState } from "@/components/expenses/expense-filters-drawer";
import { ExpenseMobileCard, type ExpenseRowData } from "@/components/expenses/expense-mobile-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { useLanguage } from "@/context/language-context";

export function ExpenseTable({
  expenses,
  stages = [],
}: {
  expenses: ExpenseRowData[];
  stages?: { id: string; name: string; shortName?: string }[];
  totalSpent?: number;
  projectId?: string;
}) {
  const { language, t } = useLanguage();

  // Primary Segmented Filter
  const [selectedType, setSelectedType] = useState<"ALL" | "MATERIAL" | "LABOUR" | "OTHER">("ALL");
  const [search, setSearch] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Advanced Filters
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    dateRange: "all",
    stageId: "all",
    paymentMethod: "all",
    minAmount: "",
    maxAmount: "",
    sortBy: "date_desc",
  });

  const [page, setPage] = useState(1);
  const pageSize = 15;

  const handleFilterChange = (key: keyof AdvancedFiltersState, val: string) => {
    setAdvancedFilters((prev) => ({ ...prev, [key]: val }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedType("ALL");
    setAdvancedFilters({
      dateRange: "all",
      stageId: "all",
      paymentMethod: "all",
      minAmount: "",
      maxAmount: "",
      sortBy: "date_desc",
    });
    setPage(1);
  };

  // Calculate active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.dateRange !== "all") count++;
    if (advancedFilters.stageId !== "all") count++;
    if (advancedFilters.paymentMethod !== "all") count++;
    if (advancedFilters.minAmount) count++;
    if (advancedFilters.maxAmount) count++;
    if (advancedFilters.sortBy !== "date_desc") count++;
    return count;
  }, [advancedFilters]);

  // Filtering & Sorting
  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      // 1. Primary Type
      if (selectedType === "MATERIAL" && e.type !== "MATERIAL") return false;
      if (selectedType === "LABOUR" && e.type !== "LABOUR") return false;
      if (selectedType === "OTHER" && (e.type === "MATERIAL" || e.type === "LABOUR")) return false;

      // 2. Search
      if (search) {
        const q = search.toLowerCase();
        const matchDesc = e.description?.toLowerCase().includes(q);
        const matchVendor = e.vendorName?.toLowerCase().includes(q);
        const matchCat = e.category.name.toLowerCase().includes(q);
        const matchStage = e.stageName?.toLowerCase().includes(q);
        if (!matchDesc && !matchVendor && !matchCat && !matchStage) return false;
      }

      // 3. Stage
      if (advancedFilters.stageId !== "all") {
        const stageObj = stages.find((s) => s.id === advancedFilters.stageId);
        if (stageObj && e.stageName !== stageObj.name) return false;
      }

      // 4. Payment Method
      if (advancedFilters.paymentMethod !== "all" && e.paymentMethod !== advancedFilters.paymentMethod) {
        return false;
      }

      // 5. Min / Max Amount
      const amt = Number(e.amount);
      if (advancedFilters.minAmount && amt < Number(advancedFilters.minAmount)) return false;
      if (advancedFilters.maxAmount && amt > Number(advancedFilters.maxAmount)) return false;

      // 6. Date Range
      if (advancedFilters.dateRange !== "all") {
        const d = new Date(e.date);
        const now = new Date();
        if (advancedFilters.dateRange === "today") {
          if (d.toDateString() !== now.toDateString()) return false;
        } else if (advancedFilters.dateRange === "month") {
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
        } else if (advancedFilters.dateRange === "lastMonth") {
          const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          if (d.getMonth() !== lastMonth || d.getFullYear() !== year) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (advancedFilters.sortBy === "date_asc") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (advancedFilters.sortBy === "amount_desc") {
        return Number(b.amount) - Number(a.amount);
      }
      if (advancedFilters.sortBy === "amount_asc") {
        return Number(a.amount) - Number(b.amount);
      }
      // default date_desc
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [expenses, selectedType, search, advancedFilters, stages]);

  const totalFilteredSpent = useMemo(() => {
    return filtered.reduce((acc, curr) => acc + Number(curr.amount), 0);
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedExpenses = filtered.slice((page - 1) * pageSize, page * pageSize);

  const filterOptions = [
    { value: "ALL", label: language === "te" ? "అన్నీ" : "All", count: expenses.length },
    {
      value: "MATERIAL",
      label: language === "te" ? "సామాగ్రి" : "Material",
      icon: Package,
      count: expenses.filter((e) => e.type === "MATERIAL").length,
    },
    {
      value: "LABOUR",
      label: language === "te" ? "కూలీలు" : "Labour",
      icon: HardHat,
      count: expenses.filter((e) => e.type === "LABOUR").length,
    },
    {
      value: "OTHER",
      label: language === "te" ? "ఇతర" : "Other",
      icon: MoreHorizontal,
      count: expenses.filter((e) => e.type !== "MATERIAL" && e.type !== "LABOUR").length,
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Header Row: Title, Totals & Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-paper-200/80 pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
            {t.nav?.expenses ?? "Expenses"}
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            <strong className="text-ink-900 font-semibold">{formatINR(totalFilteredSpent)}</strong>{" "}
            {language === "te" ? "మొత్తం ఖర్చు" : "spent"} ·{" "}
            <strong className="text-ink-800 font-semibold">{filtered.length}</strong>{" "}
            {language === "te" ? "లావాదేవీలు" : "transactions"}
          </p>
        </div>

        <Link
          href="/expenses/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-clay-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-clay-700 active:scale-98 transition w-full sm:w-auto shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>{t.nav?.addExpense ?? "+ Add Expense"}</span>
        </Link>
      </div>

      {/* 2. Controls Center: Segmented Filter & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Segmented Control: All | Material | Labour | Other */}
        <SegmentedControl
          options={filterOptions}
          value={selectedType}
          onChange={(val) => {
            setSelectedType(val as typeof selectedType);
            setPage(1);
          }}
          className="w-full md:w-auto overflow-x-auto"
        />

        {/* Search Bar + Filter Drawer Button */}
        <div className="flex items-center gap-2 flex-1 max-w-md ml-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
            <input
              type="text"
              placeholder={language === "te" ? "ఖర్చులను వెతకండి..." : "Search expenses..."}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-paper-300 bg-white py-2 pl-9 pr-8 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none focus:ring-1 focus:ring-clay-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-ink-400 hover:text-ink-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Advanced Filter Button */}
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-white px-3 py-2 text-xs font-bold text-ink-700 hover:bg-paper-50 transition shrink-0 shadow-2xs"
          >
            <Filter className="h-3.5 w-3.5 text-ink-500" />
            <span>{language === "te" ? "ఫిల్టర్లు" : "Filters"}</span>
            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-clay-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Reset button if any filter is active */}
          {(activeFiltersCount > 0 || search || selectedType !== "ALL") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-xl border border-paper-200 bg-paper-100 p-2 text-ink-600 hover:bg-paper-200 transition shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Expenses List */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {/* Mobile View: Clean Cards */}
          <div className="grid gap-2.5 sm:hidden">
            {paginatedExpenses.map((expense) => (
              <ExpenseMobileCard key={expense.id} expense={expense} />
            ))}
          </div>

          {/* Desktop View: Clean Table */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-paper-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs text-ink-700">
              <thead className="border-b border-paper-200 bg-paper-50/70 font-bold uppercase tracking-wider text-ink-500 text-[10px]">
                <tr>
                  <th className="py-3 px-4">{language === "te" ? "తేదీ" : "Date"}</th>
                  <th className="py-3 px-4">{language === "te" ? "వివరాలు" : "Description"}</th>
                  <th className="py-3 px-3">{language === "te" ? "రకం" : "Type"}</th>
                  <th className="py-3 px-4">{language === "te" ? "వర్గం" : "Category"}</th>
                  <th className="py-3 px-4">{language === "te" ? "దుకాణం / వర్కర్" : "Vendor / Worker"}</th>
                  <th className="py-3 px-4 text-right">{language === "te" ? "మొత్తం" : "Amount"}</th>
                  <th className="py-3 px-3 text-right">{language === "te" ? "చర్యలు" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-100">
                {paginatedExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-paper-50/50 transition">
                    <td className="py-3 px-4 font-medium text-ink-600 whitespace-nowrap">
                      {expense.date}
                    </td>
                    <td className="py-3 px-4 font-bold text-ink-900 max-w-[220px] truncate">
                      {expense.description || expense.category.name}
                      {expense.quantity && expense.rate && (
                        <span className="block text-[11px] font-normal text-ink-400">
                          {expense.quantity} {expense.unit} @ ₹{expense.rate}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <Badge tone={expenseTone(expense.type)} className="text-[10px]">
                        {expense.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-ink-800">
                      {expense.category.name}
                    </td>
                    <td className="py-3 px-4 text-ink-600 truncate max-w-[160px]">
                      {expense.vendorName ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-display text-sm font-bold text-ink-900 whitespace-nowrap">
                      {formatINR(Number(expense.amount))}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <Link
                        href={`/expenses/${expense.id}`}
                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-ink-400 hover:bg-paper-100 hover:text-clay-700 transition"
                        title="Edit expense"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > pageSize && (
            <TablePagination
              currentPage={page}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-paper-300 bg-white p-10 text-center space-y-3">
          <Receipt className="mx-auto h-10 w-10 text-ink-300" />
          <div>
            <h3 className="font-display text-base font-bold text-ink-900">
              {language === "te" ? "ఖర్చులు ఏవీ కనుగొనబడలేదు" : "No expenses found"}
            </h3>
            <p className="text-xs text-ink-500 mt-0.5 max-w-sm mx-auto">
              {search || activeFiltersCount > 0
                ? (language === "te" ? "మీ ఫిల్టర్లకు సరిపోలే రికార్డులు ఏవీ లేవు. దయచేసి ఫిల్టర్లను రీసెట్ చేయండి." : "No records match your active filters. Try clearing filters.")
                : (language === "te" ? "మీ ఇంటి నిర్మాణ ఖర్చులను ట్రాక్ చేయడానికి మొదటి బిల్లు లేదా కూలీని నమోదు చేయండి." : "Start tracking your construction spending by recording your first expense.")}
            </p>
          </div>

          {search || activeFiltersCount > 0 ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-paper-50 px-4 py-2 text-xs font-bold text-ink-800 hover:bg-paper-100 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{language === "te" ? "ఫిల్టర్లు క్లియర్ చేయండి" : "Clear Filters"}</span>
            </button>
          ) : (
            <Link
              href="/expenses/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-clay-600 px-4 py-2 text-xs font-bold text-white hover:bg-clay-700 transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>{language === "te" ? "+ మొదటి ఖర్చు నమోదు" : "+ Add First Expense"}</span>
            </Link>
          )}
        </div>
      )}

      {/* Advanced Filters Slide-Over Drawer */}
      <ExpenseFiltersDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={advancedFilters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        stages={stages}
      />
    </div>
  );
}
