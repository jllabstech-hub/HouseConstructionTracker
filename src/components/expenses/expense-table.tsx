"use client";

import Link from "next/link";
import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  Trash2,
  X,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { Badge, expenseTone } from "@/components/ui/badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ExpenseFiltersDrawer, type AdvancedFiltersState } from "@/components/expenses/expense-filters-drawer";
import { ExpenseMobileCard, type ExpenseRowData } from "@/components/expenses/expense-mobile-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteExpense } from "@/lib/actions/expenses";
import { useLanguage } from "@/context/language-context";

export function ExpenseTable({
  expenses,
  stages = [],
  totalSpent: initialTotalSpent,
  projectId = "",
}: {
  expenses: ExpenseRowData[];
  stages?: { id: string; name: string; shortName?: string }[];
  totalSpent?: number;
  projectId?: string;
}) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [pending, start] = useTransition();

  // Primary Segmented Filter
  const [selectedType, setSelectedType] = useState<"ALL" | "MATERIAL" | "LABOUR" | "OTHER">("ALL");
  const [search, setSearch] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRowData | null>(null);

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

  // Count active non-default filters
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

  // Combined Filtering & Sorting
  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      // 1. Primary Type Segment
      if (selectedType === "MATERIAL" && e.type !== "MATERIAL") return false;
      if (selectedType === "LABOUR" && e.type !== "LABOUR") return false;
      if (
        selectedType === "OTHER" &&
        (e.type === "MATERIAL" || e.type === "LABOUR")
      )
        return false;

      // 2. Search query (Category, Description, Vendor, Worker, Stage, Floor)
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesDesc = e.description?.toLowerCase().includes(q);
        const matchesCategory = e.category.name.toLowerCase().includes(q);
        const matchesVendor = e.vendorName?.toLowerCase().includes(q);
        const matchesStage = e.stageName?.toLowerCase().includes(q);
        const matchesFloor = e.floorName?.toLowerCase().includes(q);
        if (!matchesDesc && !matchesCategory && !matchesVendor && !matchesStage && !matchesFloor) {
          return false;
        }
      }

      // 3. Advanced Date Filter
      if (advancedFilters.dateRange !== "all") {
        const itemDate = new Date(e.date);
        const now = new Date();
        if (advancedFilters.dateRange === "today") {
          if (itemDate.toDateString() !== now.toDateString()) return false;
        } else if (advancedFilters.dateRange === "month") {
          if (
            itemDate.getMonth() !== now.getMonth() ||
            itemDate.getFullYear() !== now.getFullYear()
          )
            return false;
        } else if (advancedFilters.dateRange === "lastMonth") {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          if (
            itemDate.getMonth() !== lastMonth.getMonth() ||
            itemDate.getFullYear() !== lastMonth.getFullYear()
          )
            return false;
        }
      }

      // 4. Advanced Stage Filter
      if (advancedFilters.stageId !== "all") {
        const matchedStage = stages.find((s) => s.id === advancedFilters.stageId);
        if (matchedStage && e.stageName !== matchedStage.name) return false;
      }

      // 5. Payment Method
      if (
        advancedFilters.paymentMethod !== "all" &&
        e.paymentMethod !== advancedFilters.paymentMethod
      ) {
        return false;
      }

      // 6. Min & Max Amount
      const amt = Number(e.amount);
      if (advancedFilters.minAmount && amt < Number(advancedFilters.minAmount)) return false;
      if (advancedFilters.maxAmount && amt > Number(advancedFilters.maxAmount)) return false;

      return true;
    }).sort((a, b) => {
      // Sorting
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

  // Compute Subtotals for filtered view
  const currentTotal = useMemo(() => {
    return filtered.reduce((acc, curr) => acc + Number(curr.amount), 0);
  }, [filtered]);

  // Paginated Slices
  const paginatedExpenses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    start(async () => {
      await deleteExpense(projectId, deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Top Bar & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-900 leading-tight">
            {language === "te" ? "మొత్తం ఖర్చులు" : "All Expenses"}
          </h1>
          <p className="text-xs text-ink-500 mt-0.5">
            {filtered.length}{" "}
            {language === "te" ? "ఖర్చుల రికార్డులు" : "transactions recorded"} •{" "}
            <span className="font-bold text-ink-800">
              {formatINR(currentTotal)}
            </span>{" "}
            {selectedType !== "ALL" || search || activeFiltersCount > 0
              ? (language === "te" ? "ఫిల్టర్ చేసిన మొత్తం" : "filtered subtotal")
              : (language === "te" ? "మొత్తం ఖర్చు" : "total spend")}
          </p>
        </div>

        <Link
          href="/expenses/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-clay-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-clay-700 transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{language === "te" ? "+ ఖర్చు నమోదు" : "+ Record Expense"}</span>
        </Link>
      </div>

      {/* 2. Filter Toolbar (Segmented Pills + Search + Advanced Filter Drawer Trigger) */}
      <div className="space-y-3">
        {/* Primary Type Pills */}
        <div className="overflow-x-auto pb-1">
          <SegmentedControl
            value={selectedType}
            onChange={(val) => {
              setSelectedType(val as "ALL" | "MATERIAL" | "LABOUR" | "OTHER");
              setPage(1);
            }}
            options={[
              { value: "ALL", label: language === "te" ? "అన్నీ (All)" : "All" },
              {
                value: "MATERIAL",
                label: language === "te" ? "మెటీరియల్ (Material)" : "Materials",
                icon: Package,
              },
              {
                value: "LABOUR",
                label: language === "te" ? "కూలీలు (Labour)" : "Labour / Wages",
                icon: HardHat,
              },
              {
                value: "OTHER",
                label: language === "te" ? "ఇతర ఖర్చులు (Other)" : "Other",
                icon: MoreHorizontal,
              },
            ]}
          />
        </div>

        {/* Search Bar + Filters Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
            <input
              type="text"
              placeholder={
                language === "te"
                  ? "కేటగిరీ, దుకాణం, వర్కర్ లేదా వివరణను వెతకండి..."
                  : "Search category, vendor, worker, description..."
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-paper-300 bg-white py-2 pl-9 pr-8 text-xs font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-ink-400 hover:text-ink-600"
              >
                <X className="h-3.5 w-3.5" />
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
              <ExpenseMobileCard
                key={expense.id}
                expense={expense}
                onDelete={(exp) => setDeleteTarget(exp)}
              />
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
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/expenses/${expense.id}`}
                          className="inline-flex items-center justify-center rounded-lg p-1.5 text-ink-400 hover:bg-paper-100 hover:text-clay-700 transition"
                          title="Edit expense"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(expense)}
                          className="inline-flex items-center justify-center rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-700 transition"
                          title="Delete expense"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={language === "te" ? "ఈ ఖర్చును తొలగించాలా?" : "Delete Expense Record?"}
        description={
          language === "te"
            ? `మీరు ఖచ్చితంగా "${deleteTarget?.description || deleteTarget?.category.name || "ఈ ఖర్చు"}" ను శాశ్వతంగా తొలగించాలనుకుంటున్నారా?`
            : `Are you sure you want to permanently delete "${deleteTarget?.description || deleteTarget?.category.name || "this expense"}"?`
        }
        confirmText={pending ? "Deleting..." : (language === "te" ? "శాశ్వతంగా తొలగించు" : "Delete Expense")}
        variant="danger"
      />
    </div>
  );
}
