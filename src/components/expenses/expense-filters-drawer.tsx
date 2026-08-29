"use client";

import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export type AdvancedFiltersState = {
  dateRange: "all" | "today" | "month" | "lastMonth";
  categoryId: string;
  stageId: string;
  floorId: string;
  vendorId: string;
  workerId: string;
  paymentMethod: string;
  minAmount: string;
  maxAmount: string;
  sortBy: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
};

export function ExpenseFiltersDrawer({
  open,
  onClose,
  filters,
  onChange,
  onReset,
  stages = [],
  floors = [],
  vendors = [],
  workers = [],
  categories = [],
}: {
  open: boolean;
  onClose: () => void;
  filters: AdvancedFiltersState;
  onChange: (key: keyof AdvancedFiltersState, value: string) => void;
  onReset: () => void;
  stages?: { id: string; name: string }[];
  floors?: { id: string; name: string }[];
  vendors?: { id: string; name: string }[];
  workers?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
}) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Filters"
      subtitle="Refine expenses by category, stage, vendor and more"
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={onReset}>
            Clear All
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={onClose}>
            Apply Filters
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* 1. Date Range */}
        <div>
          <label className="font-bold text-ink-700 block mb-1.5">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => onChange("dateRange", e.target.value as AdvancedFiltersState["dateRange"])}
            className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="month">This Month</option>
            <option value="lastMonth">Last Month</option>
          </select>
        </div>

        {/* 2. Category */}
        {categories.length > 0 && (
          <div>
            <label className="font-bold text-ink-700 block mb-1.5">
              Category
            </label>
            <select
              value={filters.categoryId}
              onChange={(e) => onChange("categoryId", e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 3. Construction Stage */}
        {stages.length > 0 && (
          <div>
            <label className="font-bold text-ink-700 block mb-1.5">
              Construction Stage
            </label>
            <select
              value={filters.stageId}
              onChange={(e) => onChange("stageId", e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            >
              <option value="all">All Stages</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 4. Floor */}
        {floors.length > 0 && (
          <div>
            <label className="font-bold text-ink-700 block mb-1.5">
              Floor
            </label>
            <select
              value={filters.floorId}
              onChange={(e) => onChange("floorId", e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            >
              <option value="all">All Floors</option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 5. Vendor */}
        {vendors.length > 0 && (
          <div>
            <label className="font-bold text-ink-700 block mb-1.5">
              Vendor
            </label>
            <select
              value={filters.vendorId}
              onChange={(e) => onChange("vendorId", e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            >
              <option value="all">All Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 6. Worker */}
        {workers.length > 0 && (
          <div>
            <label className="font-bold text-ink-700 block mb-1.5">
              Worker / Contractor
            </label>
            <select
              value={filters.workerId}
              onChange={(e) => onChange("workerId", e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            >
              <option value="all">All Workers</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 7. Payment Method */}
        <div>
          <label className="font-bold text-ink-700 block mb-1.5">
            Payment Method
          </label>
          <select
            value={filters.paymentMethod}
            onChange={(e) => onChange("paymentMethod", e.target.value)}
            className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
          >
            <option value="all">All Payment Modes</option>
            <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer / NEFT / IMPS</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>

        {/* 8. Sort Order */}
        <div>
          <label className="font-bold text-ink-700 block mb-1.5">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange("sortBy", e.target.value as AdvancedFiltersState["sortBy"])}
            className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
          >
            <option value="date_desc">Date: Newest First</option>
            <option value="date_asc">Date: Oldest First</option>
            <option value="amount_desc">Amount: High to Low</option>
            <option value="amount_asc">Amount: Low to High</option>
          </select>
        </div>

        {/* 9. Amount Range */}
        <div>
          <label className="font-bold text-ink-700 block mb-1.5">
            Amount Range (₹)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min ₹"
              value={filters.minAmount}
              onChange={(e) => onChange("minAmount", e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Max ₹"
              value={filters.maxAmount}
              onChange={(e) => onChange("maxAmount", e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </Drawer>
  );
}
