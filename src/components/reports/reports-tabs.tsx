"use client";

import { useState, useMemo } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Eye,
  FileText,
  HardHat,
  Info,
  Layers,
  Loader2,
  Package,
  Share2,
  SlidersHorizontal,
  Wallet,
  X,
} from "lucide-react";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

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
  floorId?: string | null;
  floorName?: string | null;
  receiptCount: number;
};

export type EntityOption = {
  id: string;
  name: string;
  groupName?: string | null;
  phone?: string | null;
  role?: string | null;
  sortOrder?: number;
};

const REPORT_TYPES = [
  { value: "total", label: "Total expenditure" },
  { value: "material", label: "Material" },
  { value: "labour", label: "Man Power" },
  { value: "budget", label: "Budget vs Actual" },
  { value: "work-wise", label: "Work-wise cost" },
  { value: "stage", label: "Construction Stage" },
  { value: "vendor", label: "Vendor purchases" },
  { value: "worker", label: "Worker payments" },
  { value: "floor", label: "Floor-wise" },
] as const;

export function ReportsTabs({
  projectId,
  expenses = [],
  materials = [],
  labours = [],
  vendors = [],
  workers = [],
  stages = [],
  floors = [],
}: {
  projectId: string;
  expenses: ReportExpenseItem[];
  materials: EntityOption[];
  labours: EntityOption[];
  vendors: EntityOption[];
  workers: EntityOption[];
  stages: { id: string; name: string; sortOrder: number }[];
  floors?: { id: string; name: string }[];
  workWise?: WorkWiseRow[];
}) {
  // 1. Report Selector: total | material | labour | budget | work-wise | stage | vendor | worker | floor
  const [selectedReport, setSelectedReport] = useState<string>("total");

  // 2. Date Range Selector: all | thisMonth | lastMonth | last3Months | custom
  const [dateRange, setDateRange] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  // 3. Optional Filter Drawer / Accordion
  const [showOptionalFilters, setShowOptionalFilters] = useState(false);
  const [selectedExpenseType, setSelectedExpenseType] = useState<string>("ALL");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [selectedStageId, setSelectedStageId] = useState<string>("ALL");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("ALL");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("ALL");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("ALL");

  // 4. In-App Preview & Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Compute Active Date Bounds
  const { fromDate, toDate, periodDescription } = useMemo(() => {
    const now = new Date();
    if (dateRange === "thisMonth") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const end = now.toISOString().slice(0, 10);
      return { fromDate: start, toDate: end, periodDescription: "This Month" };
    }
    if (dateRange === "lastMonth") {
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const start = new Date(year, lastMonth, 1).toISOString().slice(0, 10);
      const end = new Date(year, lastMonth + 1, 0).toISOString().slice(0, 10);
      return { fromDate: start, toDate: end, periodDescription: "Last Month" };
    }
    if (dateRange === "last3Months") {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().slice(0, 10);
      const end = now.toISOString().slice(0, 10);
      return { fromDate: threeMonthsAgo, toDate: end, periodDescription: "Last 3 Months" };
    }
    if (dateRange === "custom") {
      return {
        fromDate: customFrom || undefined,
        toDate: customTo || undefined,
        periodDescription: customFrom && customTo ? `${customFrom} to ${customTo}` : "Custom Date Range",
      };
    }
    return { fromDate: undefined, toDate: undefined, periodDescription: "All Time" };
  }, [dateRange, customFrom, customTo]);

  // Combine Category Options
  const allCategories = useMemo(() => {
    return [
      ...materials.map((m) => ({ ...m, type: "MATERIAL" })),
      ...labours.map((l) => ({ ...l, type: "LABOUR" })),
    ];
  }, [materials, labours]);

  // Count active optional filters
  const activeOptionalFilterCount = useMemo(() => {
    let count = 0;
    if (selectedExpenseType !== "ALL") count++;
    if (selectedCategoryId !== "ALL") count++;
    if (selectedStageId !== "ALL") count++;
    if (selectedFloorId !== "ALL") count++;
    if (selectedVendorId !== "ALL") count++;
    if (selectedWorkerId !== "ALL") count++;
    return count;
  }, [selectedExpenseType, selectedCategoryId, selectedStageId, selectedFloorId, selectedVendorId, selectedWorkerId]);

  const handleResetFilters = () => {
    setSelectedExpenseType("ALL");
    setSelectedCategoryId("ALL");
    setSelectedStageId("ALL");
    setSelectedFloorId("ALL");
    setSelectedVendorId("ALL");
    setSelectedWorkerId("ALL");
  };

  // Filter expenses strictly against Database Values & Date Bounds
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // 1. Date Range
      const expDate = exp.date.slice(0, 10);
      if (fromDate && expDate < fromDate) return false;
      if (toDate && expDate > toDate) return false;

      // 2. Primary Report Kind Scope
      if (selectedReport === "material" && exp.expenseType !== "MATERIAL") return false;
      if (selectedReport === "labour" && exp.expenseType !== "LABOUR") return false;
      if (selectedReport === "vendor" && !exp.vendorId) return false;
      if (selectedReport === "worker" && !exp.workerId) return false;
      if (selectedReport === "stage" && !exp.stageId) return false;

      // 3. Optional Filters
      if (selectedExpenseType !== "ALL") {
        if (selectedExpenseType === "MATERIAL" && exp.expenseType !== "MATERIAL") return false;
        if (selectedExpenseType === "LABOUR" && exp.expenseType !== "LABOUR") return false;
        if (selectedExpenseType === "OTHER" && (exp.expenseType === "MATERIAL" || exp.expenseType === "LABOUR")) return false;
      }

      if (selectedCategoryId !== "ALL") {
        if (exp.materialCategoryId !== selectedCategoryId && exp.labourCategoryId !== selectedCategoryId) {
          return false;
        }
      }

      if (selectedStageId !== "ALL" && exp.stageId !== selectedStageId) return false;
      if (selectedFloorId !== "ALL" && exp.floorId !== selectedFloorId) return false;
      if (selectedVendorId !== "ALL" && exp.vendorId !== selectedVendorId) return false;
      if (selectedWorkerId !== "ALL" && exp.workerId !== selectedWorkerId) return false;

      return true;
    });
  }, [
    expenses,
    fromDate,
    toDate,
    selectedReport,
    selectedExpenseType,
    selectedCategoryId,
    selectedStageId,
    selectedFloorId,
    selectedVendorId,
    selectedWorkerId,
  ]);

  // Aggregate Totals strictly separating Material != Labour
  const aggregates = useMemo(() => {
    let total = 0;
    let material = 0;
    let labour = 0;
    let other = 0;

    for (const exp of filteredExpenses) {
      const amt = Number(exp.amount) || 0;
      total += amt;
      if (exp.expenseType === "MATERIAL") material += amt;
      else if (exp.expenseType === "LABOUR") labour += amt;
      else other += amt;
    }

    return { total, material, labour, other, count: filteredExpenses.length };
  }, [filteredExpenses]);

  // Build PDF API URL
  const pdfUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("projectId", projectId);
    params.set("kind", selectedReport);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (selectedCategoryId !== "ALL") {
      params.set("categoryId", selectedCategoryId);
      const cat = allCategories.find((c) => c.id === selectedCategoryId);
      if (cat) params.set("categoryName", cat.name);
    }
    if (selectedVendorId !== "ALL") {
      params.set("vendorId", selectedVendorId);
      const v = vendors.find((vend) => vend.id === selectedVendorId);
      if (v) params.set("vendorName", v.name);
    }
    if (selectedWorkerId !== "ALL") {
      params.set("workerId", selectedWorkerId);
      const w = workers.find((work) => work.id === selectedWorkerId);
      if (w) params.set("workerName", w.name);
    }
    if (selectedStageId !== "ALL") {
      params.set("stageId", selectedStageId);
      const s = stages.find((stg) => stg.id === selectedStageId);
      if (s) params.set("stageName", s.name);
    }
    return `/api/reports/pdf?${params.toString()}`;
  }, [projectId, selectedReport, fromDate, toDate, selectedCategoryId, allCategories, selectedVendorId, vendors, selectedWorkerId, workers, selectedStageId, stages]);

  const handleDownload = async () => {
    setStatusMessage(null);
    setDownloading(true);
    try {
      const downloadUrl = `${pdfUrl}&download=1`;
      const response = await fetch(downloadUrl, { credentials: "include" });
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error || "Could not generate the PDF. Please try again.");
      }
      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `construction-${selectedReport}-report.pdf`;
      if (contentDisposition) {
        const match = /filename="([^"]+)"/.exec(contentDisposition);
        if (match?.[1]) filename = match[1];
      }
      const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

      setStatusMessage({
        text: "PDF downloaded successfully!",
        type: "success",
      });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error("PDF Download error:", err);
      setStatusMessage({
        text: err instanceof Error ? err.message : "Failed to download PDF. Please try again.",
        type: "error",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadCsv = () => {
    try {
      const headers = ["Date", "Type", "Category", "Description", "Quantity", "Unit", "Rate (INR)", "Vendor / Worker", "Payment Method", "Amount (INR)"];
      const rows = filteredExpenses.map((exp) => [
        exp.date.slice(0, 10),
        exp.expenseType,
        exp.materialCategoryName ?? exp.labourCategoryName ?? exp.serviceCategoryName ?? exp.expenseType,
        exp.description ?? "",
        exp.quantity ?? "",
        exp.unit ?? "",
        exp.rate ?? "",
        exp.vendorName ?? exp.workerName ?? "",
        exp.paymentMethod,
        exp.amount,
      ]);

      const selectedCat = allCategories.find((c) => c.id === selectedCategoryId)?.name;
      const selectedW = workers.find((w) => w.id === selectedWorkerId)?.name;
      const selectedV = vendors.find((v) => v.id === selectedVendorId)?.name;
      const namePart = selectedCat || selectedW || selectedV || selectedReport;
      const filename = `construction-${namePart.toLowerCase().replace(/[^a-z0-9]/g, "-")}-report.csv`;

      const csvContent = "\uFEFF" + [headers, ...rows].map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage({
        text: "CSV / Excel file downloaded successfully!",
        type: "success",
      });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error("CSV Download error:", err);
      setStatusMessage({
        text: "Failed to download CSV export.",
        type: "error",
      });
    }
  };

  const handleSharePdf = async () => {
    setStatusMessage(null);
    setSharing(true);
    try {
      const downloadUrl = `${pdfUrl}&download=1`;
      const response = await fetch(downloadUrl, { credentials: "include" });
      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error || "Could not generate the PDF.");
      }
      const blob = await response.blob();
      let filename = `construction-${selectedReport}-report.pdf`;
      const contentDisposition = response.headers.get("content-disposition");
      if (contentDisposition) {
        const match = /filename="([^"]+)"/.exec(contentDisposition);
        if (match?.[1]) filename = match[1];
      }
      const file = new File([blob], filename, { type: "application/pdf" });

      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Construction Report - ${selectedReport}`,
            text: `House Construction Expenditure Report (${periodDescription})`,
          });
          setStatusMessage({
            text: "Report shared successfully!",
            type: "success",
          });
          setTimeout(() => setStatusMessage(null), 3000);
          return;
        } catch (err) {
          if ((err as Error).name === "AbortError") {
            return;
          }
        }
      }

      // Fallback: trigger download + clipboard message
      const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

      setShareSuccess(true);
      setStatusMessage({
        text: "PDF downloaded! You can now attach and send it on WhatsApp or email.",
        type: "success",
      });
      setTimeout(() => {
        setShareSuccess(false);
        setStatusMessage(null);
      }, 4500);
    } catch (err) {
      console.error("PDF Share error:", err);
      setStatusMessage({
        text: err instanceof Error ? err.message : "Failed to share PDF. Please use Download button.",
        type: "error",
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      {/* 1. Header Section */}
      <div className="border-b border-paper-200/80 pb-4">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 leading-tight">
          Reports & Downloads
        </h1>
        <p className="text-xs sm:text-sm text-ink-500 mt-1">
          Generate, preview and download material-wise (Cement, Steel, Paints, Tiles, Plumbing) or person-wise (Workers, Contractors, Vendors) reports in PDF and Excel.
        </p>
      </div>

      {/* 2. Quick Reports 1-Tap Bar */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 block">
          Choose Report Mode
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "total", label: "Total expenditure", icon: FileText },
            { id: "material", label: "Material-wise (Cement, Steel, Paints...)", icon: Package },
            { id: "worker", label: "Worker / Person-wise (Mason, Carpenter...)", icon: HardHat },
            { id: "vendor", label: "Vendor / Shop-wise (Dealers, Stores)", icon: Wallet },
            { id: "stage", label: "Stage-wise", icon: Layers },
            { id: "budget", label: "Budget vs Actual", icon: Wallet },
          ].map((item) => {
            const isSelected = selectedReport === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedReport(item.id);
                  if (item.id === "total") {
                    setSelectedCategoryId("ALL");
                    setSelectedWorkerId("ALL");
                    setSelectedVendorId("ALL");
                  }
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-95 whitespace-nowrap shrink-0",
                  isSelected
                    ? "bg-clay-600 text-white shadow-xs"
                    : "bg-white border border-paper-200 text-ink-700 hover:bg-paper-50 shadow-2xs"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-white" : "text-clay-600")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Primary Report Configuration Card */}
      <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        {/* Row 1: Report Type & Date Range Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Report Dropdown */}
          <div>
            <label className="text-xs font-bold text-ink-700 block mb-1.5">
              Report Category
            </label>
            <select
              value={selectedReport}
              onChange={(e) => {
                setSelectedReport(e.target.value);
                if (e.target.value === "total") {
                  setSelectedCategoryId("ALL");
                  setSelectedWorkerId("ALL");
                  setSelectedVendorId("ALL");
                }
              }}
              className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-bold text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
            >
              {REPORT_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Dropdown */}
          <div>
            <label className="text-xs font-bold text-ink-700 block mb-1.5">
              Date Period
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-bold text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
            >
              <option value="all">All time</option>
              <option value="thisMonth">This month</option>
              <option value="lastMonth">Last month</option>
              <option value="last3Months">Last 3 months</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs (If custom selected) */}
        {dateRange === "custom" && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-paper-50 rounded-2xl border border-paper-200">
            <div>
              <label className="text-[11px] font-bold text-ink-600 block mb-1">From Date</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full rounded-xl border border-paper-300 bg-white p-2 text-xs font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-ink-600 block mb-1">To Date</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full rounded-xl border border-paper-300 bg-white p-2 text-xs font-medium"
              />
            </div>
          </div>
        )}

        {/* MATERIAL-WISE DEDICATED SELECTOR & QUICK CHIPS */}
        {selectedReport === "material" && (
          <div className="rounded-2xl border border-clay-200 bg-clay-50/50 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-clay-950 flex items-center gap-1.5">
                <Package className="h-4 w-4 text-clay-700" />
                <span>Select Material (Cement, Steel, Plumbing, Electrical, Paints, Tiles...)</span>
              </label>
              {selectedCategoryId !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId("ALL")}
                  className="text-xs font-bold text-clay-700 hover:underline inline-flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Show All Materials</span>
                </button>
              )}
            </div>

            {/* Material Dropdown */}
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-bold text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Materials Summary ({materials.length} items)</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.groupName ? `(${m.groupName})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* WORKER / PERSON-WISE DEDICATED SELECTOR & QUICK CHIPS */}
        {selectedReport === "worker" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <HardHat className="h-4 w-4 text-emerald-700" />
                <span>Select Worker / Contractor (Mason, Plumber, Carpenter, Painter...)</span>
              </label>
              {selectedWorkerId !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedWorkerId("ALL")}
                  className="text-xs font-bold text-emerald-800 hover:underline inline-flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Show All Workers</span>
                </button>
              )}
            </div>

            {/* Worker Dropdown */}
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-bold text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
            >
              <option value="ALL">All Workers & Contractors ({workers.length} persons)</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.role ? `(${w.role})` : ""} {w.phone ? `· ${w.phone}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* VENDOR-WISE DEDICATED SELECTOR */}
        {selectedReport === "vendor" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-amber-700" />
                <span>Select Vendor / Shop / Supplier</span>
              </label>
              {selectedVendorId !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedVendorId("ALL")}
                  className="text-xs font-bold text-amber-800 hover:underline inline-flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Show All Vendors</span>
                </button>
              )}
            </div>

            {/* Vendor Dropdown */}
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-bold text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
            >
              <option value="ALL">All Vendors & Shops ({vendors.length} vendors)</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} {v.phone ? `· ${v.phone}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Optional Filters Accordion (For advanced slicing) */}
        <div className="border border-paper-200 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOptionalFilters(!showOptionalFilters)}
            className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left hover:bg-paper-50 transition"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-clay-600" />
              <span className="text-xs sm:text-sm font-bold text-ink-900">
                More Filters (Stage, Floor, Type)
              </span>
              {activeOptionalFilterCount > 0 && (
                <span className="rounded-full bg-clay-600 px-2 py-0.5 text-[10px] font-bold text-white leading-none">
                  {activeOptionalFilterCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeOptionalFilterCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetFilters();
                  }}
                  className="text-xs font-bold text-clay-700 hover:underline mr-1"
                >
                  Reset
                </button>
              )}
              {showOptionalFilters ? <ChevronUp className="h-4 w-4 text-ink-500" /> : <ChevronDown className="h-4 w-4 text-ink-500" />}
            </div>
          </button>

          {showOptionalFilters && (
            <div className="p-4 border-t border-paper-100 bg-paper-50/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Construction Stage */}
              <div>
                <label className="font-bold text-ink-700 block mb-1">Stage</label>
                <select
                  value={selectedStageId}
                  onChange={(e) => setSelectedStageId(e.target.value)}
                  className="w-full rounded-xl border border-paper-300 bg-white p-2 font-medium"
                >
                  <option value="ALL">All Stages</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Floor */}
              {floors && floors.length > 0 && (
                <div>
                  <label className="font-bold text-ink-700 block mb-1">Floor</label>
                  <select
                    value={selectedFloorId}
                    onChange={(e) => setSelectedFloorId(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2 font-medium"
                  >
                    <option value="ALL">All Floors</option>
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category (if not on material tab) */}
              {selectedReport !== "material" && (
                <div>
                  <label className="font-bold text-ink-700 block mb-1">Category</label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2 font-medium"
                  >
                    <option value="ALL">All Categories</option>
                    {allCategories.map((c) => (
                      <option key={`${c.type}-${c.id}`} value={c.id}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Vendor (if not on vendor tab) */}
              {selectedReport !== "vendor" && (
                <div>
                  <label className="font-bold text-ink-700 block mb-1">Vendor</label>
                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2 font-medium"
                  >
                    <option value="ALL">All Vendors</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Worker (if not on worker tab) */}
              {selectedReport !== "worker" && (
                <div>
                  <label className="font-bold text-ink-700 block mb-1">Worker</label>
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2 font-medium"
                  >
                    <option value="ALL">All Workers</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Row 3: Action Buttons (Preview, Download PDF, Download CSV, Share PDF) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-paper-100 flex-wrap">
          {/* Preview Button */}
          <button
            type="button"
            onClick={() => setPreviewModalOpen(true)}
            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-2xl border border-paper-300 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-ink-900 hover:bg-paper-50 active:scale-95 transition shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <Eye className="h-4 w-4 text-clay-600 shrink-0" />
            <span className="whitespace-nowrap">Preview Statement</span>
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 rounded-2xl bg-clay-600 px-4 py-3 text-xs sm:text-sm font-bold text-white hover:bg-clay-700 active:scale-95 transition shadow-xs whitespace-nowrap disabled:opacity-60 cursor-pointer"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span className="whitespace-nowrap">Downloading PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 stroke-[2.5] shrink-0" />
                <span className="whitespace-nowrap">Download PDF</span>
              </>
            )}
          </button>

          {/* Download CSV / Excel Button */}
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-2xl border border-paper-300 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-ink-900 hover:bg-paper-50 active:scale-95 transition shadow-2xs whitespace-nowrap cursor-pointer"
            title="Download spreadsheet in Excel / CSV format"
          >
            <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="whitespace-nowrap">Excel / CSV</span>
          </button>

          {/* Share PDF Button */}
          <button
            type="button"
            onClick={handleSharePdf}
            disabled={sharing}
            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-2xl border border-paper-300 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-ink-900 hover:bg-paper-50 active:scale-95 transition shadow-2xs whitespace-nowrap disabled:opacity-60 cursor-pointer"
          >
            {sharing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-clay-600 shrink-0" />
                <span className="whitespace-nowrap">Preparing...</span>
              </>
            ) : shareSuccess ? (
              <>
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-emerald-700 whitespace-nowrap">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 text-ink-600 shrink-0" />
                <span className="whitespace-nowrap">Share / WhatsApp</span>
              </>
            )}
          </button>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div
            className={cn(
              "p-3 rounded-2xl border flex items-center gap-2 text-xs font-semibold animate-in fade-in zoom-in-95 duration-150",
              statusMessage.type === "success" && "bg-emerald-50 border-emerald-200 text-emerald-800",
              statusMessage.type === "error" && "bg-red-50 border-red-200 text-red-800",
              statusMessage.type === "info" && "bg-paper-100 border-paper-300 text-ink-800"
            )}
          >
            {statusMessage.type === "success" ? (
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <Info className="h-4 w-4 text-ink-500 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* 4. Live In-App Summary & Transaction Preview */}
      <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        {/* KPI Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-paper-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-ink-400">
              Report Total Expenditure
            </span>
            <p className="font-display text-2xl sm:text-3xl font-bold text-ink-900 mt-0.5">
              {formatINR(aggregates.total)}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-ink-600 flex-wrap">
            <span className="rounded-lg bg-paper-100 px-2.5 py-1 text-ink-800 font-bold">
              {aggregates.count} transactions
            </span>
            <span>•</span>
            <span>Material: <strong className="font-bold text-ink-900">{formatINR(aggregates.material)}</strong></span>
            <span>•</span>
            <span>Labour: <strong className="font-bold text-ink-900">{formatINR(aggregates.labour)}</strong></span>
          </div>
        </div>

        {/* Live Preview Table */}
        {filteredExpenses.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-paper-200">
            <table className="w-full text-left text-xs text-ink-700">
              <thead className="border-b border-paper-200 bg-paper-50/80 font-bold uppercase tracking-wider text-ink-500 text-[10px]">
                <tr>
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">Type</th>
                  <th className="py-3 px-3.5">Category</th>
                  <th className="py-3 px-3.5">Description</th>
                  <th className="py-3 px-3.5">Qty / Rate</th>
                  <th className="py-3 px-3.5">Vendor / Worker</th>
                  <th className="py-3 px-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-100">
                {filteredExpenses.slice(0, 50).map((exp) => {
                  const qtyRate = [
                    exp.quantity ? `${exp.quantity} ${exp.unit || ""}`.trim() : "",
                    exp.rate ? `@ ₹${exp.rate}` : "",
                  ].filter(Boolean).join(" ");

                  return (
                    <tr key={exp.id} className="hover:bg-paper-50/60">
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-ink-500 font-medium">{exp.date.slice(0, 10)}</td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                            exp.expenseType === "MATERIAL" && "bg-clay-100 text-clay-800",
                            exp.expenseType === "LABOUR" && "bg-emerald-100 text-emerald-800",
                            exp.expenseType === "OTHER" && "bg-paper-200 text-ink-700"
                          )}
                        >
                          {exp.expenseType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-ink-900">
                        {exp.materialCategoryName ?? exp.labourCategoryName ?? exp.expenseType}
                      </td>
                      <td className="py-2.5 px-3.5 max-w-[200px] truncate text-ink-600">
                        {exp.description || "—"}
                      </td>
                      <td className="py-2.5 px-3.5 text-ink-600 whitespace-nowrap font-mono text-[11px]">
                        {qtyRate || "—"}
                      </td>
                      <td className="py-2.5 px-3.5 text-ink-700 whitespace-nowrap">
                        {exp.vendorName || exp.workerName || exp.paymentMethod || "—"}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-ink-900 whitespace-nowrap">
                        {formatINR(Number(exp.amount))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center space-y-2 border border-dashed border-paper-300 rounded-2xl">
            <AlertCircle className="mx-auto h-8 w-8 text-ink-300" />
            <h3 className="font-display font-bold text-sm text-ink-800">No transactions match the selected criteria</h3>
            <p className="text-xs text-ink-500">Try choosing a broader date range or clearing optional filters.</p>
          </div>
        )}
      </div>

      {/* 5. PDF Preview Modal / Lightbox */}
      {previewModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
          onClick={() => setPreviewModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-white border border-paper-200 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-paper-200 bg-paper-50 sticky top-0 z-10">
              <div className="min-w-0 pr-2">
                <h3 className="font-display text-sm sm:text-base font-bold text-ink-900 truncate">
                  PDF Report Preview: {selectedReport}
                </h3>
                <p className="text-xs text-ink-500 mt-0.5 truncate">
                  {periodDescription} · {formatINR(aggregates.total)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-xl border border-paper-300 bg-white hover:bg-paper-100 px-3 py-2 text-xs font-bold text-ink-800 transition shadow-2xs min-h-[40px]"
                  title="Open PDF in new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-ink-500" />
                  <span className="hidden sm:inline">New Tab</span>
                </a>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center gap-1 rounded-xl bg-clay-600 hover:bg-clay-700 px-3.5 py-2 text-xs font-bold text-white transition shadow-xs min-h-[40px] disabled:opacity-60 cursor-pointer"
                >
                  {downloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>{downloading ? "Downloading..." : "Download"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="rounded-xl p-2 text-ink-500 hover:bg-paper-200 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Iframe View */}
            <div className="relative flex-1 bg-paper-100 p-1.5 sm:p-2">
              <iframe
                src={pdfUrl}
                title="Construction PDF Report"
                className="w-full h-[60vh] sm:h-[70vh] min-h-[300px] sm:min-h-[450px] rounded-xl border border-paper-200 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
