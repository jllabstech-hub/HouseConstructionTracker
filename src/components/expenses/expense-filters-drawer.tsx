"use client";

import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";

export type AdvancedFiltersState = {
  dateRange: "all" | "today" | "month" | "lastMonth";
  stageId: string;
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
  stages,
}: {
  open: boolean;
  onClose: () => void;
  filters: AdvancedFiltersState;
  onChange: (key: keyof AdvancedFiltersState, value: string) => void;
  onReset: () => void;
  stages: { id: string; name: string; shortName?: string }[];
}) {
  const { language, getStageName } = useLanguage();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={language === "te" ? "ఫిల్టర్లు" : "Filter Expenses"}
      subtitle={language === "te" ? "మీకు అవసరమైన లావాదేవీలను సులభంగా వెతకండి" : "Refine your expense ledger"}
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
        {/* Date Range */}
        <div>
          <label className="font-bold text-ink-700 block mb-1.5">
            {language === "te" ? "తేదీ వ్యవధి" : "Date Range"}
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => onChange("dateRange", e.target.value)}
            className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
          >
            <option value="all">{language === "te" ? "అన్ని తేదీలు (All Dates)" : "All Dates"}</option>
            <option value="today">{language === "te" ? "ఈ రోజు (Today)" : "Today"}</option>
            <option value="month">{language === "te" ? "ఈ నెల (This Month)" : "This Month"}</option>
            <option value="lastMonth">{language === "te" ? "గత నెల (Last Month)" : "Last Month"}</option>
          </select>
        </div>

        {/* Stage Filter */}
        <div>
          <label className="font-bold text-ink-700 block mb-1.5">
            {language === "te" ? "నిర్మాణ దశ" : "Construction Stage"}
          </label>
          <select
            value={filters.stageId}
            onChange={(e) => onChange("stageId", e.target.value)}
            className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
          >
            <option value="all">{language === "te" ? "అన్ని దశలు (All Stages)" : "All Stages"}</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {getStageName(s.name)}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method */}
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
            <option value="UPI">UPI / GPay / PhonePe</option>
            <option value="CASH">Cash / నగదు</option>
            <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
            <option value="CHEQUE">Cheque</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="font-bold text-ink-700 block mb-1.5">
            {language === "te" ? "వరుస క్రమం" : "Sort By"}
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange("sortBy", e.target.value)}
            className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
          >
            <option value="date_desc">{language === "te" ? "ఇటీవలి తేదీ మొదట (Newest First)" : "Date: Newest First"}</option>
            <option value="date_asc">{language === "te" ? "పాత తేదీ మొదట (Oldest First)" : "Date: Oldest First"}</option>
            <option value="amount_desc">{language === "te" ? "అత్యధిక మొత్తం మొదట (Highest Amount)" : "Amount: High to Low"}</option>
            <option value="amount_asc">{language === "te" ? "అల్ప మొత్తం మొదట (Lowest Amount)" : "Amount: Low to High"}</option>
          </select>
        </div>

        {/* Amount Range */}
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
