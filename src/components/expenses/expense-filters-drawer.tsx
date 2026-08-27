"use client";

import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";

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
  const { language, getStageName } = useLanguage();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={language === "te" ? "ఫిల్టర్లు" : "Filters"}
      subtitle={language === "te" ? "మీకు అవసరమైన ఖర్చులను సులభంగా వెతకండి" : "Refine expenses by category, stage, vendor and more"}
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={onReset}>
            {language === "te" ? "అన్నీ క్లియర్ చేయండి" : "Clear All"}
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={onClose}>
            {language === "te" ? "ఫిల్టర్లు వర్తింపజేయండి" : "Apply Filters"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* 1. Date Range */}
        <div>
          <label className="font-bold text-ink-700 block mb-1.5">
            {language === "te" ? "తేదీ వ్యవధి" : "Date Range"}
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => onChange("dateRange", e.target.value as AdvancedFiltersState["dateRange"])}
            className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
          >
            <option value="all">{language === "te" ? "అన్ని తేదీలు" : "All Dates"}</option>
            <option value="today">{language === "te" ? "ఈ రోజు (Today)" : "Today"}</option>
            <option value="month">{language === "te" ? "ఈ నెల (This Month)" : "This Month"}</option>
            <option value="lastMonth">{language === "te" ? "గత నెల (Last Month)" : "Last Month"}</option>
          </select>
        </div>

        {/* 2. Category */}
        {categories.length > 0 && (
          <div>
            <label className="font-bold text-ink-700 block mb-1.5">
              {language === "te" ? "ఖర్చు వర్గం" : "Category"}
            </label>
            <select
              value={filters.categoryId}
              onChange={(e) => onChange("categoryId", e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            >
              <option value="all">{language === "te" ? "అన్ని వర్గాలు" : "All Categories"}</option>
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
              {language === "te" ? "నిర్మాణ దశ" : "Construction Stage"}
            </label>
            <select
              value={filters.stageId}
              onChange={(e) => onChange("stageId", e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            >
              <option value="all">{language === "te" ? "అన్ని దశలు" : "All Stages"}</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {getStageName(s.name)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 4. Floor */}
        {floors.length > 0 && (
          <div>
            <label className="font-bold text-ink-700 block mb-1.5">
              {language === "te" ? "అంతస్తు / ఫ్లోర్" : "Floor"}
            </label>
            <select
              value={filters.floorId}
              onChange={(e) => onChange("floorId", e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            >
              <option value="all">{language === "te" ? "అన్ని అంతస్తులు" : "All Floors"}</option>
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
              {language === "te" ? "దుకాణం / వెండర్" : "Vendor"}
            </label>
            <select
              value={filters.vendorId}
              onChange={(e) => onChange("vendorId", e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            >
              <option value="all">{language === "te" ? "అన్ని దుకాణాలు" : "All Vendors"}</option>
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
              {language === "te" ? "కూలీ / వర్కర్" : "Worker / Contractor"}
            </label>
            <select
              value={filters.workerId}
              onChange={(e) => onChange("workerId", e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            >
              <option value="all">{language === "te" ? "అన్ని వర్కర్లు" : "All Workers"}</option>
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
            {language === "te" ? "చెల్లింపు విధానం" : "Payment Method"}
          </label>
          <select
            value={filters.paymentMethod}
            onChange={(e) => onChange("paymentMethod", e.target.value)}
            className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
          >
            <option value="all">{language === "te" ? "అన్ని చెల్లింపులు" : "All Payment Modes"}</option>
            <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
            <option value="CASH">Cash / నగదు</option>
            <option value="BANK_TRANSFER">Bank Transfer / NEFT / IMPS</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>

        {/* 8. Sort Order */}
        <div>
          <label className="font-bold text-ink-700 block mb-1.5">
            {language === "te" ? "వరుస క్రమం" : "Sort By"}
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange("sortBy", e.target.value as AdvancedFiltersState["sortBy"])}
            className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
          >
            <option value="date_desc">{language === "te" ? "ఇటీవలి తేదీ మొదట (Newest First)" : "Date: Newest First"}</option>
            <option value="date_asc">{language === "te" ? "పాత తేదీ మొదట (Oldest First)" : "Date: Oldest First"}</option>
            <option value="amount_desc">{language === "te" ? "అత్యధిక మొత్తం మొదట (Highest Amount)" : "Amount: High to Low"}</option>
            <option value="amount_asc">{language === "te" ? "అల్ప మొత్తం మొదట (Lowest Amount)" : "Amount: Low to High"}</option>
          </select>
        </div>

        {/* 9. Amount Range */}
        <div>
          <label className="font-bold text-ink-700 block mb-1.5">
            {language === "te" ? "ఖర్చు మొత్తం పరిధి (₹)" : "Amount Range (₹)"}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min ₹"
              value={filters.minAmount}
              onChange={(e) => onChange("minAmount", e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            >
            </input>
            <input
              type="number"
              placeholder="Max ₹"
              value={filters.maxAmount}
              onChange={(e) => onChange("maxAmount", e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            >
            </input>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
