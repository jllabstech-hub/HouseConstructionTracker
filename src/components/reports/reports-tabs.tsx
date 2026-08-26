"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Download,
  FileText,
  Filter,
  HardHat,
  Layers,
  Milestone,
  Package,
  Search,
  Store,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { PdfActions } from "@/components/reports/pdf-actions";
import { format } from "date-fns";

export type WorkWiseRow = {
  id: string;
  name: string;
  material: string;
  labour: string;
  total: string;
};

export type ReportExpenseItem = {
  id: string;
  date: string;
  expenseType: string;
  amount: string;
  description: string | null;
  paymentMethod: string;
  quantity: string | null;
  unit: string | null;
  rate: string | null;
  materialCategoryId: string | null;
  materialCategoryName: string | null;
  labourCategoryId: string | null;
  labourCategoryName: string | null;
  serviceCategoryId: string | null;
  serviceCategoryName: string | null;
  vendorId: string | null;
  vendorName: string | null;
  workerId: string | null;
  workerName: string | null;
  stageId: string | null;
  stageName: string | null;
  receiptCount: number;
};

export type EntityOption = { id: string; name: string; groupName?: string | null; phone?: string | null; role?: string | null; sortOrder?: number };

export function ReportsTabs({
  projectId,
  expenses = [],
  materials = [],
  labours = [],
  vendors = [],
  workers = [],
  stages = [],
  workWise = [],
}: {
  projectId: string;
  expenses: ReportExpenseItem[];
  materials: EntityOption[];
  labours: EntityOption[];
  vendors: EntityOption[];
  workers: EntityOption[];
  stages: { id: string; name: string; sortOrder: number }[];
  workWise: WorkWiseRow[];
}) {
  const { language, getStageName } = useLanguage();

  // Perspective Mode: TOTAL | MATERIAL | PERSON | STAGE
  const [reportMode, setReportMode] = useState<"TOTAL" | "MATERIAL" | "PERSON" | "STAGE">("TOTAL");

  // Specific Entity Filters
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("ALL");
  const [selectedPersonType, setSelectedPersonType] = useState<"ALL" | "VENDOR" | "WORKER">("ALL");
  const [selectedPersonId, setSelectedPersonId] = useState<string>("ALL");
  const [selectedStageId, setSelectedStageId] = useState<string>("ALL");

  // Date Range Filter
  const [dateRange, setDateRange] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  // Search inside live preview table
  const [tableSearch, setTableSearch] = useState<string>("");

  // Calculate Date bounds
  const now = new Date();
  let fromDate: string | undefined = undefined;
  let toDate: string | undefined = undefined;

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

  // Filtered Expenses for Live Preview and PDF Actions
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // 1. Date Range
      const expDate = exp.date.slice(0, 10);
      if (fromDate && expDate < fromDate) return false;
      if (toDate && expDate > toDate) return false;

      // 2. Report Mode & Entity Scope
      if (reportMode === "MATERIAL") {
        if (exp.expenseType !== "MATERIAL") return false;
        if (selectedMaterialId !== "ALL" && exp.materialCategoryId !== selectedMaterialId) return false;
      } else if (reportMode === "PERSON") {
        if (selectedPersonId !== "ALL") {
          const isVendor = vendors.some((v) => v.id === selectedPersonId);
          if (isVendor && exp.vendorId !== selectedPersonId) return false;
          const isWorker = workers.some((w) => w.id === selectedPersonId);
          if (isWorker && exp.workerId !== selectedPersonId) return false;
        } else if (selectedPersonType === "VENDOR") {
          if (!exp.vendorId) return false;
        } else if (selectedPersonType === "WORKER") {
          if (!exp.workerId) return false;
        }
      } else if (reportMode === "STAGE") {
        if (selectedStageId !== "ALL" && exp.stageId !== selectedStageId) return false;
      }

      // 3. Table Search Query
      if (tableSearch) {
        const q = tableSearch.toLowerCase();
        const cat = (exp.materialCategoryName ?? exp.labourCategoryName ?? exp.serviceCategoryName ?? exp.expenseType).toLowerCase();
        const desc = (exp.description ?? "").toLowerCase();
        const person = (exp.vendorName ?? exp.workerName ?? "").toLowerCase();
        const stName = (exp.stageName ?? "").toLowerCase();
        if (!cat.includes(q) && !desc.includes(q) && !person.includes(q) && !stName.includes(q) && !exp.amount.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [
    expenses,
    fromDate,
    toDate,
    reportMode,
    selectedMaterialId,
    selectedPersonType,
    selectedPersonId,
    selectedStageId,
    vendors,
    workers,
    tableSearch,
  ]);

  // Derived Aggregate Totals for the Live Report
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [filteredExpenses]);

  const materialSubtotal = useMemo(() => {
    return filteredExpenses.filter((e) => e.expenseType === "MATERIAL").reduce((sum, e) => sum + Number(e.amount), 0);
  }, [filteredExpenses]);

  const labourSubtotal = useMemo(() => {
    return filteredExpenses.filter((e) => e.expenseType === "LABOUR").reduce((sum, e) => sum + Number(e.amount), 0);
  }, [filteredExpenses]);

  // Derive parameters for PDF generation
  const pdfKind = useMemo(() => {
    if (reportMode === "MATERIAL") return "material";
    if (reportMode === "PERSON") {
      if (selectedPersonId !== "ALL") {
        const isVendor = vendors.some((v) => v.id === selectedPersonId);
        return isVendor ? "vendor" : "worker";
      }
      return selectedPersonType === "VENDOR" ? "vendor" : selectedPersonType === "WORKER" ? "worker" : "total";
    }
    if (reportMode === "STAGE") return "stage";
    return "total";
  }, [reportMode, selectedPersonId, selectedPersonType, vendors]);

  const selectedMaterialObj = materials.find((m) => m.id === selectedMaterialId);
  const selectedVendorObj = vendors.find((v) => v.id === selectedPersonId);
  const selectedWorkerObj = workers.find((w) => w.id === selectedPersonId);
  const selectedStageObj = stages.find((s) => s.id === selectedStageId);

  // Active Report Header Title & Description
  const activeReportInfo = useMemo(() => {
    if (reportMode === "MATERIAL") {
      if (selectedMaterialObj) {
        return {
          title: language === "te" ? `${selectedMaterialObj.name} కొనుగోళ్ల నివేదిక` : `${selectedMaterialObj.name} Purchase Report`,
          subtitle: language === "te" ? "ఈ నిర్దిష్ట సామాగ్రికి సంబంధించిన అన్ని కొనుగోలు బిల్లులు మరియు పరిమాణాలు" : `Itemized purchase bills, quantities, and rates for ${selectedMaterialObj.name}`,
          icon: Package,
        };
      }
      return {
        title: language === "te" ? "అన్ని సామాగ్రి కొనుగోళ్లు" : "All Material Purchases Report",
        subtitle: language === "te" ? "సిమెంట్, స్టీల్, ఇసుక, ఇటుకలు, టైల్స్ తదితర సామాగ్రి కొనుగోళ్లు" : "Comprehensive breakdown of all construction materials purchased",
        icon: Package,
      };
    }

    if (reportMode === "PERSON") {
      if (selectedVendorObj) {
        return {
          title: language === "te" ? `${selectedVendorObj.name} - దుకాణం లెడ్జర్` : `${selectedVendorObj.name} - Vendor Ledger`,
          subtitle: language === "te" ? "ఈ దుకాణంలో కొనుగోలు చేసిన సామాగ్రి మరియు చెల్లింపుల వివరాలు" : `Complete purchase and payment transaction ledger for ${selectedVendorObj.name}`,
          icon: Store,
        };
      }
      if (selectedWorkerObj) {
        return {
          title: language === "te" ? `${selectedWorkerObj.name} - కూలీల లెడ్జర్` : `${selectedWorkerObj.name} - Worker Ledger`,
          subtitle: language === "te" ? "ఈ మేస్త్రీ / కూలీకి చెల్లించిన రోజువారీ కూలీలు మరియు కాంట్రాక్ట్ మొత్తాలు" : `Attendance wages and contract payouts statement for ${selectedWorkerObj.name}`,
          icon: HardHat,
        };
      }
      return {
        title: language === "te" ? "దుకాణాలు & కూలీల చెల్లింపుల నివేదిక" : "Vendors & Workers Payout Report",
        subtitle: language === "te" ? "అన్ని హార్డ్‌వేర్ షాపులు, సప్లయర్లు మరియు మేస్త్రీలకు చేసిన చెల్లింపులు" : "Payments and purchases grouped by vendor and worker",
        icon: Users,
      };
    }

    if (reportMode === "STAGE") {
      if (selectedStageObj) {
        return {
          title: language === "te" ? `${getStageName(selectedStageObj.name)} - దశ ఖర్చు నివేదిక` : `${selectedStageObj.name} - Stage Cost Report`,
          subtitle: language === "te" ? "ఈ నిర్మాణ దశలో ఖర్చు చేసిన సామాగ్రి మరియు కూలీల వివరాలు" : `Itemized materials, wages and services utilized during this construction stage`,
          icon: Milestone,
        };
      }
      return {
        title: language === "te" ? "నిర్మాణ దశల వారీ ఖర్చుల నివేదిక" : "Stage-Wise Construction Cost Statement",
        subtitle: language === "te" ? "20 దశల వరుస క్రమంలో అయిన మొత్తం ఖర్చుల స్టేట్‌మెంట్" : "Sequential 20-stage timeline expenditure and passbook",
        icon: Milestone,
      };
    }

    return {
      title: language === "te" ? "ఇంటి పూర్తి నిర్మాణ ఖర్చుల సమగ్ర నివేదిక" : "Total Project Expenditure Statement",
      subtitle: language === "te" ? "ఇంటి నిర్మాణానికి అయిన మొత్తం సామాగ్రి, కూలీలు మరియు ఇతర ఖర్చుల సమగ్ర ఆడిట్" : "Complete master expenditure audit, category splits, and transaction statement",
      icon: FileText,
    };
  }, [reportMode, selectedMaterialObj, selectedVendorObj, selectedWorkerObj, selectedStageObj, language, getStageName]);

  const ActiveIcon = activeReportInfo.icon;

  return (
    <div className="space-y-6">
      {/* 1. Top Page Header */}
      <div className="border-b border-paper-200/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
            {language === "te" ? "నివేదికలు & పి.డి.ఎఫ్ (Reports)" : "Reports & PDF Statements"}
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            {language === "te"
              ? "మొత్తం ఖర్చులు, నిర్దిష్ట సామాగ్రి లేదా వ్యక్తి వారీగా నివేదికలు చూడండి మరియు డౌన్‌లోడ్ చేసుకోండి"
              : "Generate, inspect, and download statements by Total Project, Individual Material, or Person/Vendor"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="shrink-0">
          <PdfActions
            projectId={projectId}
            kind={pdfKind}
            from={fromDate}
            to={toDate}
            categoryId={selectedMaterialId !== "ALL" ? selectedMaterialId : undefined}
            categoryName={selectedMaterialObj?.name}
            vendorId={selectedVendorObj?.id}
            vendorName={selectedVendorObj?.name}
            workerId={selectedWorkerObj?.id}
            workerName={selectedWorkerObj?.name}
            stageId={selectedStageObj?.id}
            stageName={selectedStageObj?.name}
          />
        </div>
      </div>

      {/* 2. Interactive Report Filter Bar */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-4">
        {/* Main Perspective Selector */}
        <div>
          <label className="text-xs font-bold text-ink-700 block mb-2">
            {language === "te" ? "1. నివేదిక రకాన్ని ఎంచుకోండి:" : "1. Select Report View:"}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setReportMode("TOTAL");
                setSelectedMaterialId("ALL");
                setSelectedPersonId("ALL");
                setSelectedStageId("ALL");
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-3 text-left transition active:scale-98",
                reportMode === "TOTAL"
                  ? "border-clay-600 bg-clay-50/80 text-clay-950 font-bold shadow-2xs ring-1 ring-clay-400"
                  : "border-paper-200 bg-paper-50/60 text-ink-700 hover:bg-paper-100"
              )}
            >
              <FileText className={cn("h-4 w-4 shrink-0", reportMode === "TOTAL" ? "text-clay-700" : "text-ink-400")} />
              <span className="text-xs">{language === "te" ? "మొత్తం ఖర్చులు" : "Total Project"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setReportMode("MATERIAL");
                setSelectedPersonId("ALL");
                setSelectedStageId("ALL");
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-3 text-left transition active:scale-98",
                reportMode === "MATERIAL"
                  ? "border-clay-600 bg-clay-50/80 text-clay-950 font-bold shadow-2xs ring-1 ring-clay-400"
                  : "border-paper-200 bg-paper-50/60 text-ink-700 hover:bg-paper-100"
              )}
            >
              <Package className={cn("h-4 w-4 shrink-0", reportMode === "MATERIAL" ? "text-clay-700" : "text-ink-400")} />
              <span className="text-xs">{language === "te" ? "సామాగ్రి వారీగా" : "By Material"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setReportMode("PERSON");
                setSelectedMaterialId("ALL");
                setSelectedStageId("ALL");
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-3 text-left transition active:scale-98",
                reportMode === "PERSON"
                  ? "border-clay-600 bg-clay-50/80 text-clay-950 font-bold shadow-2xs ring-1 ring-clay-400"
                  : "border-paper-200 bg-paper-50/60 text-ink-700 hover:bg-paper-100"
              )}
            >
              <User className={cn("h-4 w-4 shrink-0", reportMode === "PERSON" ? "text-clay-700" : "text-ink-400")} />
              <span className="text-xs">{language === "te" ? "వ్యక్తి / షాప్ వారీగా" : "By Person / Vendor"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setReportMode("STAGE");
                setSelectedMaterialId("ALL");
                setSelectedPersonId("ALL");
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl border p-3 text-left transition active:scale-98",
                reportMode === "STAGE"
                  ? "border-clay-600 bg-clay-50/80 text-clay-950 font-bold shadow-2xs ring-1 ring-clay-400"
                  : "border-paper-200 bg-paper-50/60 text-ink-700 hover:bg-paper-100"
              )}
            >
              <Milestone className={cn("h-4 w-4 shrink-0", reportMode === "STAGE" ? "text-clay-700" : "text-ink-400")} />
              <span className="text-xs">{language === "te" ? "దశల వారీగా" : "By Stage"}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Secondary Dropdowns */}
        <div className="grid gap-3 sm:grid-cols-2 pt-1 border-t border-paper-100">
          {/* MATERIAL DROPDOWN */}
          {reportMode === "MATERIAL" && (
            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1">
                {language === "te" ? "నిర్దిష్ట సామాగ్రి ఎంచుకోండి:" : "Select Specific Material:"}
              </label>
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs sm:text-sm font-semibold text-ink-900 focus:border-clay-500 focus:outline-none"
              >
                <option value="ALL">-- {language === "te" ? "అన్ని సామాగ్రి కొనుగోళ్లు (All Materials)" : "All Materials"} --</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.groupName ? `(${m.groupName})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* PERSON DROPDOWN */}
          {reportMode === "PERSON" && (
            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1">
                {language === "te" ? "నిర్దిష్ట వ్యక్తి / షాప్ ఎంచుకోండి:" : "Select Specific Vendor or Worker:"}
              </label>
              <select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs sm:text-sm font-semibold text-ink-900 focus:border-clay-500 focus:outline-none"
              >
                <option value="ALL">-- {language === "te" ? "అందరూ (All Vendors & Workers)" : "All Vendors & Workers"} --</option>
                <optgroup label={language === "te" ? "దుకాణాలు & వెండర్లు (Shops)" : "Hardware Shops & Vendors"}>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      🏪 {v.name} {v.phone ? `(${v.phone})` : ""}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={language === "te" ? "మేస్త్రీలు & కూలీలు (Workers)" : "Masons & Workers"}>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      👷 {w.name} {w.role ? `· ${w.role}` : ""} {w.phone ? `(${w.phone})` : ""}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          {/* STAGE DROPDOWN */}
          {reportMode === "STAGE" && (
            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1">
                {language === "te" ? "నిర్దిష్ట దశ ఎంచుకోండి:" : "Select Specific Stage:"}
              </label>
              <select
                value={selectedStageId}
                onChange={(e) => setSelectedStageId(e.target.value)}
                className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs sm:text-sm font-semibold text-ink-900 focus:border-clay-500 focus:outline-none"
              >
                <option value="ALL">-- {language === "te" ? "అన్ని 20 దశలు (All Stages)" : "All 20 Stages"} --</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    Stage {s.sortOrder}: {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* DATE RANGE DROPDOWN */}
          <div>
            <label className="text-xs font-bold text-ink-700 block mb-1">
              {language === "te" ? "కాలవ్యవధి (తేదీ పరిధి):" : "Date Period:"}
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

        {/* Custom Date Range Pickers */}
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
      </div>

      {/* 3. Live Statement Hero Metric Card */}
      <div className="rounded-2xl border border-clay-200 bg-clay-50/40 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-clay-600 text-white shadow-xs">
            <ActiveIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-ink-900">
              {activeReportInfo.title}
            </h2>
            <p className="text-xs text-ink-600 mt-0.5 max-w-xl">
              {activeReportInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500 block">
              {language === "te" ? "మొత్తం ఖర్చు" : "Report Total"}
            </span>
            <p className="font-display text-2xl font-bold text-clay-800">
              {formatINR(totalAmount)}
            </p>
            <p className="text-[11px] text-ink-500 font-medium">
              {filteredExpenses.length} {language === "te" ? "లావాదేవీలు" : "transactions"}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Live Interactive Transactions Table */}
      <div className="rounded-2xl border border-paper-200 bg-white shadow-xs overflow-hidden space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-ink-900">
              {language === "te" ? "ఖర్చుల వివరాలు (Transactions)" : "Itemized Transaction Details"}
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">
              {language === "te"
                ? `ఎంచుకున్న ఫిల్టర్‌కు సంబంధించిన ${filteredExpenses.length} లావాదేవీలు`
                : `Showing ${filteredExpenses.length} transactions for the active statement`}
            </p>
          </div>

          {/* Quick search filter */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-400" />
            <input
              type="text"
              placeholder={language === "te" ? "ఈ నివేదికలో వెతకండి..." : "Search in report..."}
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50/60 py-1.5 pl-8 pr-8 text-xs font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:bg-white focus:outline-none"
            />
            {tableSearch && (
              <button
                type="button"
                onClick={() => setTableSearch("")}
                className="absolute right-2.5 top-2 text-ink-400 hover:text-ink-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {filteredExpenses.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-paper-200">
            <table className="w-full text-left text-xs text-ink-700">
              <thead className="border-b border-paper-200 bg-paper-50 font-bold uppercase tracking-wider text-ink-500 text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">{language === "te" ? "తేదీ" : "Date"}</th>
                  <th className="py-2.5 px-3">{language === "te" ? "రకం & వర్గం" : "Category"}</th>
                  <th className="py-2.5 px-3">{language === "te" ? "వివరాలు" : "Description"}</th>
                  <th className="py-2.5 px-3">{language === "te" ? "దుకాణం / వర్కర్" : "Vendor / Worker"}</th>
                  <th className="py-2.5 px-3 text-center">{language === "te" ? "పరిమాణం / రేటు" : "Quantity & Rate"}</th>
                  <th className="py-2.5 px-3">{language === "te" ? "చెల్లింపు" : "Payment"}</th>
                  <th className="py-2.5 px-3 text-right">{language === "te" ? "మొత్తం (₹)" : "Amount (₹)"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-100">
                {filteredExpenses.map((exp) => {
                  const categoryName =
                    exp.materialCategoryName ??
                    exp.labourCategoryName ??
                    exp.serviceCategoryName ??
                    exp.expenseType;
                  const dateStr = format(new Date(exp.date), "dd-MMM-yyyy");

                  return (
                    <tr key={exp.id} className="hover:bg-paper-50/50 transition">
                      <td className="py-2.5 px-3 whitespace-nowrap text-ink-600 font-medium">{dateStr}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-ink-900 block">{categoryName}</span>
                        <span className="text-[10px] text-ink-400 uppercase font-semibold">{exp.expenseType}</span>
                      </td>
                      <td className="py-2.5 px-3 text-ink-600 max-w-xs truncate">{exp.description ?? "—"}</td>
                      <td className="py-2.5 px-3 font-semibold text-ink-800">
                        {exp.vendorName ? `🏪 ${exp.vendorName}` : exp.workerName ? `👷 ${exp.workerName}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-center text-ink-600 whitespace-nowrap">
                        {exp.quantity ? (
                          <span>
                            {exp.quantity} {exp.unit ?? ""} {exp.rate ? `@ ₹${exp.rate}` : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="rounded-md bg-paper-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-600">
                          {exp.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-ink-900 whitespace-nowrap">
                        {formatINR(Number(exp.amount))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-paper-200 bg-paper-50/80 font-bold">
                <tr>
                  <td colSpan={6} className="py-3 px-3 text-ink-700 uppercase tracking-wider text-xs">
                    {language === "te" ? "మొత్తం (Total)" : "Grand Total:"}
                  </td>
                  <td className="py-3 px-3 text-right text-sm text-clay-900 font-display">
                    {formatINR(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-paper-200 bg-paper-50/50 p-8 text-center">
            <p className="text-xs font-bold text-ink-600">
              {language === "te" ? "ఎంచుకున్న ఫిల్టర్‌కు ఎటువంటి లావాదేవీలు కనుగొనబడలేదు" : "No expenses found matching the selected report criteria"}
            </p>
          </div>
        )}
      </div>

      {/* 5. Work-Wise Trade Matrix Reference (if available) */}
      {workWise.length > 0 && reportMode === "TOTAL" && (
        <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-3">
          <div>
            <h3 className="font-display text-sm font-bold text-ink-900">
              {language === "te" ? "పని విభాగాల వారీ ఖర్చుల పట్టిక" : "Work-Wise Trade Matrix Breakdown"}
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">
              {language === "te" ? "ప్రతి పనికి సామాగ్రి మరియు కూలీ ఖర్చుల మొత్తం" : "Material + Labour combined for key trade areas"}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-paper-200">
            <table className="w-full text-left text-xs text-ink-700">
              <thead className="border-b border-paper-200 bg-paper-50 font-bold uppercase tracking-wider text-ink-500 text-[10px]">
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
