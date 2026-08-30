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

export function ExpenseTable({
  expenses,
  stages = [],
  floors = [],
  vendors = [],
  workers = [],
  categories = [],
  projectId = "",
}: {
  expenses: ExpenseRowData[];
  stages?: { id: string; name: string }[];
  floors?: { id: string; name: string }[];
  vendors?: { id: string; name: string }[];
  workers?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  totalSpent?: number;
  projectId?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  // Primary Quick Filter: All | Material | Labour | Other
  const [selectedType, setSelectedType] = useState<"ALL" | "MATERIAL" | "LABOUR" | "OTHER">("ALL");
  const [search, setSearch] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRowData | null>(null);

  // Advanced Filters
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    dateRange: "all",
    categoryId: "all",
    stageId: "all",
    floorId: "all",
    vendorId: "all",
    workerId: "all",
    paymentMethod: "all",
    minAmount: "",
    maxAmount: "",
    sortBy: "date_desc",
  });

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const handleFilterChange = (key: keyof AdvancedFiltersState, val: string) => {
    setAdvancedFilters((prev) => ({ ...prev, [key]: val }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedType("ALL");
    setAdvancedFilters({
      dateRange: "all",
      categoryId: "all",
      stageId: "all",
      floorId: "all",
      vendorId: "all",
      workerId: "all",
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
    if (advancedFilters.categoryId !== "all") count++;
    if (advancedFilters.stageId !== "all") count++;
    if (advancedFilters.floorId !== "all") count++;
    if (advancedFilters.vendorId !== "all") count++;
    if (advancedFilters.workerId !== "all") count++;
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

      // 4. Advanced Category Filter
      if (advancedFilters.categoryId !== "all") {
        if (e.category.id !== advancedFilters.categoryId && e.category.name !== advancedFilters.categoryId) {
          return false;
        }
      }

      // 5. Advanced Stage Filter
      if (advancedFilters.stageId !== "all") {
        const matchedStage = stages.find((s) => s.id === advancedFilters.stageId);
        if (matchedStage && e.stageName !== matchedStage.name) return false;
      }

      // 6. Advanced Floor Filter
      if (advancedFilters.floorId !== "all") {
        const matchedFloor = floors.find((f) => f.id === advancedFilters.floorId);
        if (matchedFloor && e.floorName !== matchedFloor.name) return false;
      }

      // 7. Advanced Vendor Filter
      if (advancedFilters.vendorId !== "all") {
        const matchedVendor = vendors.find((v) => v.id === advancedFilters.vendorId);
        if (matchedVendor && e.vendorName !== matchedVendor.name) return false;
      }

      // 8. Advanced Worker Filter
      if (advancedFilters.workerId !== "all") {
        const matchedWorker = workers.find((w) => w.id === advancedFilters.workerId);
        if (matchedWorker && e.vendorName !== matchedWorker.name) return false;
      }

      // 9. Payment Method
      if (
        advancedFilters.paymentMethod !== "all" &&
        e.paymentMethod !== advancedFilters.paymentMethod
      ) {
        return false;
      }

      // 10. Min & Max Amount
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
  }, [expenses, selectedType, search, advancedFilters, stages, floors, vendors, workers]);

  // Compute Subtotals for filtered view
  const currentTotal = useMemo(() => {
    return filtered.reduce((acc, curr) => acc + Number(curr.amount), 0);
  }, [filtered]);

  const materialTotal = useMemo(() => {
    return filtered.filter((e) => e.type === "MATERIAL").reduce((acc, curr) => acc + Number(curr.amount), 0);
  }, [filtered]);

  const labourTotal = useMemo(() => {
    return filtered.filter((e) => e.type === "LABOUR").reduce((acc, curr) => acc + Number(curr.amount), 0);
  }, [filtered]);

  const otherTotal = useMemo(() => {
    return filtered.filter((e) => e.type !== "MATERIAL" && e.type !== "LABOUR").reduce((acc, curr) => acc + Number(curr.amount), 0);
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
    <div className="space-y-6 w-full pb-10">
      {/* 1. Top Section: Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper-200/80 pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">
            Expenses
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-1">
            Track, filter, and audit every construction payment with bill receipts.
          </p>
        </div>

        {/* Primary Action */}
        <Link
          href="/expenses/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-clay-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-clay-700 active:scale-95 transition self-start sm:self-auto whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5] shrink-0" />
          <span className="whitespace-nowrap">Add Expense</span>
        </Link>
      </div>

      {/* 2. Top Financial Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 block">Total Spent</span>
          <p className="font-display text-xl sm:text-2xl font-bold text-ink-900 leading-tight">{formatINR(currentTotal)}</p>
          <p className="text-[11px] text-ink-400 font-medium">{filtered.length} transactions recorded</p>
        </div>
        <div className="rounded-2xl border border-clay-200 bg-clay-50/40 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-clay-800">Material</span>
            <Package className="h-3.5 w-3.5 text-clay-600" />
          </div>
          <p className="font-display text-xl sm:text-2xl font-bold text-clay-900 leading-tight">{formatINR(materialTotal)}</p>
          <p className="text-[11px] text-clay-700 font-medium">{currentTotal > 0 ? ((materialTotal / currentTotal) * 100).toFixed(0) : 0}% of spending</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Labour</span>
            <HardHat className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <p className="font-display text-xl sm:text-2xl font-bold text-emerald-950 leading-tight">{formatINR(labourTotal)}</p>
          <p className="text-[11px] text-emerald-700 font-medium">{currentTotal > 0 ? ((labourTotal / currentTotal) * 100).toFixed(0) : 0}% of spending</p>
        </div>
        <div className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">Other / Services</span>
            <MoreHorizontal className="h-3.5 w-3.5 text-ink-400" />
          </div>
          <p className="font-display text-xl sm:text-2xl font-bold text-ink-900 leading-tight">{formatINR(otherTotal)}</p>
          <p className="text-[11px] text-ink-400 font-medium">Machinery, transport & fees</p>
        </div>
      </div>

      {/* 2. Quick Filters (All | Material | Labour | Other) + Search & Filter Drawer Trigger */}
      <div className="space-y-3">
        {/* Quick Filter Segmented Pills */}
        <div className="overflow-x-auto pb-1">
          <SegmentedControl
            value={selectedType}
            onChange={(val) => {
              setSelectedType(val as "ALL" | "MATERIAL" | "LABOUR" | "OTHER");
              setPage(1);
            }}
            options={[
              { value: "ALL", label: "All" },
              {
                value: "MATERIAL",
                label: "Material",
                icon: Package,
              },
              {
                value: "LABOUR",
                label: "Labour",
                icon: HardHat,
              },
              {
                value: "OTHER",
                label: "Other",
                icon: MoreHorizontal,
              },
            ]}
          />
        </div>

        {/* Search Bar + Filters Button */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-ink-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-paper-300 bg-white py-2.5 pl-10 pr-9 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-3 text-ink-400 hover:text-ink-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Advanced Filters Button */}
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-paper-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-ink-800 hover:bg-paper-50 active:scale-95 transition shrink-0 shadow-2xs"
          >
            <Filter className="h-4 w-4 text-ink-500" />
            <span>Filters</span>
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
              className="rounded-xl border border-paper-200 bg-paper-100 p-2.5 text-ink-600 hover:bg-paper-200 transition shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Expenses Listing */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {/* Mobile View: Expense Cards (Tap -> Detail) */}
          <div className="grid gap-3 sm:hidden">
            {paginatedExpenses.map((expense) => (
              <ExpenseMobileCard
                key={expense.id}
                expense={expense}
                onDelete={(exp) => setDeleteTarget(exp)}
              />
            ))}
          </div>

          {/* Desktop View: Clean Table */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-paper-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs text-ink-700">
              <thead className="border-b border-paper-200 bg-paper-50/70 font-bold uppercase tracking-wider text-ink-500 text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-3">Type</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Vendor / Worker</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-100">
                {paginatedExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-paper-50/60 transition group">
                    <td className="py-3.5 px-4 font-medium text-ink-600 whitespace-nowrap">
                      {expense.date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-ink-900 max-w-[240px] truncate">
                      <Link
                        href={`/expenses/${expense.id}`}
                        className="hover:text-clay-700 transition"
                      >
                        {expense.description || expense.category.name}
                      </Link>
                      {expense.quantity && expense.rate && (
                        <span className="block text-[11px] font-normal text-ink-400 mt-0.5">
                          {expense.quantity} {expense.unit} @ ₹{expense.rate}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <Badge tone={expenseTone(expense.type)} className="text-[10px]">
                        {expense.type}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-ink-800">
                      {expense.category.name}
                    </td>
                    <td className="py-3.5 px-4 text-ink-600 truncate max-w-[160px]">
                      {expense.vendorName ?? "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-display text-sm font-bold text-ink-900 whitespace-nowrap">
                      {formatINR(Number(expense.amount))}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
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
        <div className="rounded-3xl border border-dashed border-paper-300 bg-white p-8 sm:p-12 text-center space-y-6">
          <div className="max-w-md mx-auto space-y-2">
            <Receipt className="mx-auto h-12 w-12 text-ink-300" />
            <h3 className="font-display text-lg sm:text-xl font-bold text-ink-900">
              {search || activeFiltersCount > 0 ? "No matching expenses" : "No expenses recorded yet"}
            </h3>
            <p className="text-xs sm:text-sm text-ink-500">
              {search || activeFiltersCount > 0
                ? "No records match your active filters. Try clearing search or filters."
                : "Start tracking your house construction spending by recording your material purchases or labour payments."}
            </p>
          </div>

          {search || activeFiltersCount > 0 ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-paper-50 px-4 py-2.5 text-xs font-bold text-ink-800 hover:bg-paper-100 transition shadow-2xs cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear Filters</span>
            </button>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-2">
              <Link
                href="/expenses/new?type=MATERIAL"
                className="rounded-2xl border border-clay-200 bg-clay-50/50 hover:bg-clay-50 p-5 text-left transition group space-y-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay-600 text-white group-hover:scale-105 transition">
                  <Package className="h-4.5 w-4.5" />
                </div>
                <h4 className="font-display font-bold text-ink-900 text-sm">Material Purchase</h4>
                <p className="text-xs text-ink-500 leading-relaxed">Record cement, steel, sand, bricks, tiles, electricals, and plumbing supplies.</p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-clay-700 pt-1 group-hover:translate-x-0.5 transition">
                  <span>+ Record Material</span> &rarr;
                </span>
              </Link>

              <Link
                href="/expenses/new?type=LABOUR"
                className="rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 p-5 text-left transition group space-y-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white group-hover:scale-105 transition">
                  <HardHat className="h-4.5 w-4.5" />
                </div>
                <h4 className="font-display font-bold text-ink-900 text-sm">Labour Wages</h4>
                <p className="text-xs text-ink-500 leading-relaxed">Pay daily wages or contract payments to masons, carpenters, and electricians.</p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 pt-1 group-hover:translate-x-0.5 transition">
                  <span>+ Record Labour</span> &rarr;
                </span>
              </Link>

              <Link
                href="/phonedirectory"
                className="rounded-2xl border border-paper-200 bg-paper-50 hover:bg-paper-100 p-5 text-left transition group space-y-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-white group-hover:scale-105 transition">
                  <Receipt className="h-4.5 w-4.5" />
                </div>
                <h4 className="font-display font-bold text-ink-900 text-sm">Phone Directory</h4>
                <p className="text-xs text-ink-500 leading-relaxed">Save contact numbers of your local hardware shops, masons, and contractors.</p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-ink-800 pt-1 group-hover:translate-x-0.5 transition">
                  <span>View Contacts</span> &rarr;
                </span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Advanced Filters Drawer */}
      <ExpenseFiltersDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={advancedFilters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        stages={stages}
        floors={floors}
        vendors={vendors}
        workers={workers}
        categories={categories}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense Record?"
        description={`Are you sure you want to permanently delete "${deleteTarget?.description || deleteTarget?.category.name || "this expense"}"?`}
        confirmText={pending ? "Deleting..." : "Delete Expense"}
        variant="danger"
      />
    </div>
  );
}
