"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  HardHat,
  Package,
  Plus,
  Receipt,
  Trash2,
  Wallet,
} from "lucide-react";
import { saveExpense, deleteExpense } from "@/lib/actions/expenses";
import { uploadReceipt } from "@/lib/actions/receipts";
import { createMaterialCategory, createLabourCategory } from "@/lib/actions/masters";
import { computeLabourAmount, computeMaterialAmount } from "@/lib/finance/aggregations";
import { formatINR, parseMoneyInput } from "@/lib/money";
import { getMaterialPreset } from "@/lib/catalog/expense-presets";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string; groupName?: string | null; type?: string; phone?: string | null };
export type SuperiorCategory = "MATERIAL" | "MANPOWER";
export type CalcMode = "QUANTITY_RATE" | "DIRECT_AMOUNT";

export type ExistingReceipt = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  ocrStatus: string;
};

const UNITS = [
  { value: "bags", label: "Bags" },
  { value: "kg", label: "Kg" },
  { value: "tons", label: "Tons" },
  { value: "loads", label: "Loads (Tractor/Tipper)" },
  { value: "sqft", label: "Sqft" },
  { value: "cum", label: "Cum (Cubic Meter)" },
  { value: "nos", label: "Nos / Pieces" },
  { value: "litres", label: "Litres" },
  { value: "coils", label: "Coils" },
  { value: "brass", label: "Brass (100 cu ft)" },
  { value: "days", label: "Days / Man-Days" },
  { value: "hours", label: "Hours" },
  { value: "units", label: "Units" },
] as const;

const PAYMENT_METHODS = [
  { value: "UPI", label: "UPI (GPay / PhonePe / Paytm)" },
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer / NEFT / IMPS" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CARD", label: "Credit / Debit Card" },
  { value: "CREDIT", label: "Store Credit / Khata" },
  { value: "OTHER", label: "Other" },
] as const;

export function ExpenseForm({
  projectId,
  expenseId,
  initial,
  existingReceipts = [],
  materials = [],
  labours = [],
  vendors = [],
  workers = [],
  stages = [],
  floors = [],
}: {
  projectId: string;
  expenseId?: string;
  initial?: Partial<Record<string, string>>;
  existingReceipts?: ExistingReceipt[];
  materials: Option[];
  labours: Option[];
  services?: Option[];
  equipment?: Option[];
  professionals?: Option[];
  vendors: Option[];
  workers: Option[];
  stages: Option[];
  floors: Option[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isInitialLabour =
    initial?.expenseType === "LABOUR" ||
    initial?.expenseType === "SERVICE" ||
    initial?.expenseType === "EQUIPMENT" ||
    initial?.expenseType === "PROFESSIONAL" ||
    Boolean(initial?.labourCategoryId);

  const [superiorCategory, setSuperiorCategory] = useState<SuperiorCategory>(
    isInitialLabour ? "MANPOWER" : "MATERIAL"
  );

  const [materialsList, setMaterialsList] = useState<Option[]>(() => {
    const list = [...materials];
    if (initial?.materialCategoryId && initial?.materialCategoryName) {
      if (!list.some((m) => m.id === initial.materialCategoryId)) {
        list.push({ id: initial.materialCategoryId, name: initial.materialCategoryName, groupName: "Custom" });
      }
    }
    return list;
  });

  const [laboursList, setLaboursList] = useState<Option[]>(() => {
    const list = [...labours];
    if (initial?.labourCategoryId && initial?.labourCategoryName) {
      if (!list.some((l) => l.id === initial.labourCategoryId)) {
        list.push({ id: initial.labourCategoryId, name: initial.labourCategoryName, groupName: "Custom" });
      }
    }
    return list;
  });

  // Category Name and ID state - starts completely empty by default
  const [materialCategoryName, setMaterialCategoryName] = useState<string>(
    initial?.materialCategoryName ?? ""
  );
  const [materialCategoryId, setMaterialCategoryId] = useState<string>(
    initial?.materialCategoryId ?? ""
  );

  const [labourCategoryName, setLabourCategoryName] = useState<string>(
    initial?.labourCategoryName ?? ""
  );
  const [labourCategoryId, setLabourCategoryId] = useState<string>(
    initial?.labourCategoryId ?? ""
  );

  // 2. Shared Core Fields: Date & Description
  const [date, setDate] = useState<string>(
    initial?.date ? initial.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState<string>(initial?.description ?? "");

  // 3. Calculation Mode: "QUANTITY_RATE" vs "DIRECT_AMOUNT"
  const hasQuantityRateInitial =
    Boolean(initial?.quantity && initial?.rate) ||
    Boolean(initial?.dailyWorkers && initial?.rate) ||
    Boolean(initial?.dailyWorkers);

  const [calcMode, setCalcMode] = useState<CalcMode>(
    hasQuantityRateInitial ? "QUANTITY_RATE" : initial?.amount && !hasQuantityRateInitial ? "DIRECT_AMOUNT" : "QUANTITY_RATE"
  );

  // Material fields
  const [quantity, setQuantity] = useState<string>(initial?.quantity ?? "");
  const [unit, setUnit] = useState<string>(initial?.unit ?? "bags");
  const [rate, setRate] = useState<string>(initial?.rate ?? "");

  // Manpower fields
  const [numberOfWorkers, setNumberOfWorkers] = useState<string>(initial?.dailyWorkers ?? "3");
  const [numberOfDays, setNumberOfDays] = useState<string>(initial?.dailyDays ?? "1");
  const [dailyRate, setDailyRate] = useState<string>(initial?.rate ?? "900");

  // Direct Amount Field
  const [directAmount, setDirectAmount] = useState<string>(initial?.amount ?? "");

  // 4. Bill Upload / Receipt State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 5. Optional Details Accordion ("More Details")
  const [showMoreDetails, setShowMoreDetails] = useState(
    Boolean(initial?.vendorId || initial?.workerId || initial?.constructionStageId || initial?.floorId || initial?.invoiceNumber || initial?.notes)
  );
  const [vendorId, setVendorId] = useState<string>(initial?.vendorId ?? "");
  const [workerId, setWorkerId] = useState<string>(initial?.workerId ?? "");
  const [stageId, setStageId] = useState<string>(initial?.constructionStageId ?? "");
  const [floorId, setFloorId] = useState<string>(initial?.floorId ?? "");
  const [paymentMethod, setPaymentMethod] = useState<string>(initial?.paymentMethod ?? "UPI");
  const [invoiceNumber, setInvoiceNumber] = useState<string>(initial?.invoiceNumber ?? "");
  const [notes, setNotes] = useState<string>(initial?.notes ?? "");

  // Success State for Fast Continuous Logging
  const [savedSuccess, setSavedSuccess] = useState<{ id: string; amount: number; title: string } | null>(null);

  // Live Computed Total
  const computedTotal = useMemo(() => {
    if (calcMode === "DIRECT_AMOUNT") {
      return Number(parseMoneyInput(directAmount) ?? 0);
    }

    if (superiorCategory === "MATERIAL") {
      const q = parseMoneyInput(quantity);
      const r = parseMoneyInput(rate);
      if (q && r && !q.isZero() && !r.isZero()) {
        return Number(computeMaterialAmount({ quantity: q, rate: r }));
      }
      return 0;
    }

    // MANPOWER
    const w = Number(numberOfWorkers) || 0;
    const d = Number(numberOfDays) || 0;
    const r = parseMoneyInput(dailyRate);
    if (w && d && r) {
      return Number(computeLabourAmount({ method: "DAILY_WAGE", numberOfWorkers: w, numberOfDays: d, rate: r }));
    }
    return 0;
  }, [superiorCategory, calcMode, directAmount, quantity, rate, numberOfWorkers, numberOfDays, dailyRate]);

  const currentCategoryList = superiorCategory === "MATERIAL" ? materialsList : laboursList;
  const activeCategoryName = superiorCategory === "MATERIAL" ? materialCategoryName : labourCategoryName;

  const handleCategoryNameChange = (val: string) => {
    if (superiorCategory === "MATERIAL") {
      setMaterialCategoryName(val);
      const matched = materialsList.find((m) => m.name.toLowerCase() === val.trim().toLowerCase());
      if (matched) {
        setMaterialCategoryId(matched.id);
        const preset = getMaterialPreset(matched.name);
        if (preset.defaultUnit) setUnit(preset.defaultUnit);
        if (!description || materialsList.some((m) => m.name === description)) {
          setDescription(matched.name);
        }
      } else {
        setMaterialCategoryId("");
        const preset = getMaterialPreset(val);
        if (preset.defaultUnit) setUnit(preset.defaultUnit);
      }
    } else {
      setLabourCategoryName(val);
      const matched = laboursList.find((l) => l.name.toLowerCase() === val.trim().toLowerCase());
      if (matched) {
        setLabourCategoryId(matched.id);
        if (!description || laboursList.some((l) => l.name === description)) {
          setDescription(matched.name);
        }
      } else {
        setLabourCategoryId("");
      }
    }
  };

  // Live Formula Label
  const formulaLabel = useMemo(() => {
    if (calcMode === "DIRECT_AMOUNT") return null;

    if (superiorCategory === "MATERIAL") {
      const q = Number(quantity) || 0;
      const r = Number(rate) || 0;
      if (q > 0 && r > 0) {
        return `${q} ${unit} × ₹${r} = ₹${(q * r).toLocaleString("en-IN")}`;
      }
      return null;
    }

    const w = Number(numberOfWorkers) || 0;
    const d = Number(numberOfDays) || 0;
    const r = Number(dailyRate) || 0;
    if (w > 0 && d > 0 && r > 0) {
      return `${w} workers × ${d} ${d === 1 ? "day" : "days"} × ₹${r} = ₹${(w * d * r).toLocaleString("en-IN")}`;
    }
    return null;
  }, [superiorCategory, calcMode, quantity, rate, unit, numberOfWorkers, numberOfDays, dailyRate]);

  // Add Another Continuous Workflow
  const handleAddAnother = () => {
    setSavedSuccess(null);
    setError(null);
    setMaterialCategoryName("");
    setMaterialCategoryId("");
    setLabourCategoryName("");
    setLabourCategoryId("");
    setQuantity("");
    setRate("");
    setDirectAmount("");
    setInvoiceNumber("");
    setSelectedFile(null);
    setDescription("");
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const activeCatName = superiorCategory === "MATERIAL" ? materialCategoryName.trim() : labourCategoryName.trim();
    if (!activeCatName) {
      setError(`Please enter or select a ${superiorCategory === "MATERIAL" ? "material" : "man power"} category`);
      return;
    }

    if (computedTotal <= 0) {
      setError("Please enter a valid amount or quantity and rate");
      return;
    }

    start(async () => {
      try {
        let finalCatId = superiorCategory === "MATERIAL" ? materialCategoryId : labourCategoryId;

        // Auto-create category if user typed a new one
        if (!finalCatId && activeCatName) {
          if (superiorCategory === "MATERIAL") {
            const res = await createMaterialCategory({ projectId, name: activeCatName, groupName: "Custom" });
            if (res.ok && res.category) {
              finalCatId = res.category.id;
              setMaterialsList((prev) => (prev.some((c) => c.id === res.category!.id) ? prev : [...prev, res.category!]));
            }
          } else {
            const res = await createLabourCategory({ projectId, name: activeCatName, groupName: "Custom" });
            if (res.ok && res.category) {
              finalCatId = res.category.id;
              setLaboursList((prev) => (prev.some((c) => c.id === res.category!.id) ? prev : [...prev, res.category!]));
            }
          }
        }

        const title = description.trim() || activeCatName || (superiorCategory === "MATERIAL" ? "Material" : "Man Power");

        const payload: Record<string, unknown> = {
          projectId,
          date,
          expenseType: superiorCategory === "MATERIAL" ? "MATERIAL" : "LABOUR",
          paymentMethod,
          amount: String(computedTotal),
          description: title,
          constructionStageId: stageId || null,
          floorId: floorId || null,
          invoiceNumber: invoiceNumber || null,
          notes: notes || null,
        };

        if (superiorCategory === "MATERIAL") {
          payload.materialCategoryId = finalCatId || null;
          payload.quantity = calcMode === "QUANTITY_RATE" && quantity ? quantity : null;
          payload.unit = calcMode === "QUANTITY_RATE" && unit ? unit : null;
          payload.rate = calcMode === "QUANTITY_RATE" && rate ? rate : null;
          payload.vendorId = vendorId || null;
        } else {
          payload.labourCategoryId = finalCatId || null;
          if (calcMode === "QUANTITY_RATE") {
            payload.labourCalcMethod = "DAILY_WAGE";
            payload.numberOfWorkers = numberOfWorkers || null;
            payload.numberOfDays = numberOfDays || null;
            payload.rate = dailyRate || null;
          } else {
            payload.labourCalcMethod = "FIXED_CONTRACT";
          }
          payload.workerId = workerId || null;
        }

        const result = await saveExpense(payload, expenseId);
        if (result && "error" in result && result.error) {
          setError(typeof result.error === "string" ? result.error : "Failed to save expense");
          return;
        }

        const savedId = (result as { id?: string })?.id ?? expenseId;

        if (savedId && selectedFile) {
          const receiptForm = new FormData();
          receiptForm.set("file", selectedFile);
          await uploadReceipt(savedId, receiptForm);
        }

        if (expenseId) {
          router.push(`/expenses/${expenseId}`);
          router.refresh();
        } else if (savedId) {
          setSavedSuccess({ id: savedId, amount: computedTotal, title });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to record expense");
      }
    });
  };

  const handleDelete = () => {
    if (!expenseId) return;
    start(async () => {
      await deleteExpense(projectId, expenseId);
      router.push("/expenses");
      router.refresh();
    });
  };

  if (savedSuccess) {
    return (
      <div className="max-w-xl mx-auto py-4 sm:py-8 px-1">
        <div className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-xs text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-ink-900">
              Expense Recorded Successfully!
            </h2>
            <p className="font-display text-2xl sm:text-3xl font-bold text-clay-700">
              {formatINR(savedSuccess.amount)}
            </p>
            <p className="text-xs text-ink-500 font-medium">
              {savedSuccess.title} • {date}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleAddAnother}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-clay-600 px-5 py-3 text-sm font-bold text-white shadow-xs hover:bg-clay-700 active:scale-95 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Another Expense</span>
            </button>

            <Link
              href={`/expenses/${savedSuccess.id}`}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-paper-300 bg-white px-5 py-2.5 text-sm font-bold text-ink-800 hover:bg-paper-50 active:scale-95 transition shadow-2xs"
            >
              <span>View Details</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/expenses"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900 transition"
            >
              <span>All Expenses</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between border-b border-paper-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/expenses"
            className="rounded-xl border border-paper-200 bg-white p-2 text-ink-600 hover:bg-paper-50 hover:text-ink-900 transition shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-900 leading-tight">
              {expenseId ? "Edit Expense" : "Record Expense"}
            </h1>
            <p className="text-xs text-ink-500 mt-0.5">
              Track house construction costs in seconds
            </p>
          </div>
        </div>

        {expenseId && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/60 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 animate-fadeIn">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-3xl border border-paper-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 block">
            1. Select Type
          </span>

          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Superior Category">
            <button
              type="button"
              role="radio"
              aria-checked={superiorCategory === "MATERIAL"}
              onClick={() => {
                setSuperiorCategory("MATERIAL");
                setError(null);
              }}
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-2.5 rounded-2xl border p-4 text-center sm:text-left transition active:scale-[0.99] cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500",
                superiorCategory === "MATERIAL"
                  ? "border-clay-600 bg-clay-50/80 text-clay-950 ring-2 ring-clay-600/20 shadow-xs"
                  : "border-paper-200 bg-paper-50/60 text-ink-700 hover:bg-paper-100 hover:border-paper-300"
              )}
            >
              <div
                className={cn(
                  "p-2.5 rounded-xl shrink-0",
                  superiorCategory === "MATERIAL" ? "bg-clay-600 text-white" : "bg-paper-200 text-ink-600"
                )}
              >
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold block leading-tight">Material</span>
                <span className="text-[11px] text-ink-500 hidden sm:block mt-0.5">
                  Cement, Steel, Sand, Bricks, Tiles...
                </span>
              </div>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={superiorCategory === "MANPOWER"}
              onClick={() => {
                setSuperiorCategory("MANPOWER");
                setError(null);
              }}
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-2.5 rounded-2xl border p-4 text-center sm:text-left transition active:scale-[0.99] cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600",
                superiorCategory === "MANPOWER"
                  ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-600/20 shadow-xs"
                  : "border-paper-200 bg-paper-50/60 text-ink-700 hover:bg-paper-100 hover:border-paper-300"
              )}
            >
              <div
                className={cn(
                  "p-2.5 rounded-xl shrink-0",
                  superiorCategory === "MANPOWER" ? "bg-emerald-600 text-white" : "bg-paper-200 text-ink-600"
                )}
              >
                <HardHat className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold block leading-tight">Man Power</span>
                <span className="text-[11px] text-ink-500 hidden sm:block mt-0.5">
                  Masons, Carpenters, Plumbers, Wages...
                </span>
              </div>
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 block">
            2. Core Details
          </span>

          <div>
            <label htmlFor="expense-date" className="text-xs font-bold text-ink-700 block mb-1.5">
              Date
            </label>
            <input
              id="expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="expense-category-input" className="text-xs font-bold text-ink-700 block">
              {superiorCategory === "MATERIAL" ? "Material Category" : "Man Power Category"}
            </label>

            <div className="relative">
              <input
                id="expense-category-input"
                list="category-suggestions"
                type="text"
                required
                value={activeCategoryName}
                onChange={(e) => handleCategoryNameChange(e.target.value)}
                placeholder={
                  superiorCategory === "MATERIAL"
                    ? "Type category name (e.g. Cement, Steel, Sand, Bricks, Tiles...)"
                    : "Type trade / category (e.g. Masonry, Plumbing, Electrical, Wages...)"
                }
                className="w-full rounded-xl border border-paper-300 bg-white p-3 text-base sm:text-sm font-semibold text-ink-900 placeholder:text-ink-400 placeholder:font-normal focus:border-clay-500 focus:outline-none shadow-2xs"
              />

              <datalist id="category-suggestions">
                {currentCategoryList.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.groupName ? `${cat.name} (${cat.groupName})` : cat.name}
                  </option>
                ))}
              </datalist>
            </div>

            {currentCategoryList.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {currentCategoryList.map((cat) => {
                  const isSelected = activeCategoryName.toLowerCase() === cat.name.toLowerCase();
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryNameChange(cat.name)}
                      className={cn(
                        "rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition active:scale-95 border cursor-pointer shrink-0",
                        isSelected
                          ? superiorCategory === "MATERIAL"
                            ? "bg-clay-600 text-white border-clay-600 shadow-xs"
                            : "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-paper-50 text-ink-700 border-paper-300 hover:bg-paper-100 hover:border-paper-400"
                      )}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="expense-description" className="text-xs font-bold text-ink-700 block mb-1.5">
              Description / Notes
            </label>
            <input
              id="expense-description"
              type="text"
              placeholder={
                superiorCategory === "MATERIAL"
                  ? "e.g. UltraTech 53 Grade Cement, 16mm Fe550D Steel"
                  : "e.g. Plinth beam shuttering & concrete work, 4 masons"
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
            />
          </div>

          <div>
            <label htmlFor="expense-stage-select-main" className="text-xs font-bold text-ink-700 block mb-1.5">
              Construction Stage
            </label>
            <div className="relative">
              <select
                id="expense-stage-select-main"
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-paper-300 bg-white p-2.5 pr-8 text-base sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs cursor-pointer"
              >
                <option value="">-- General / Not Linked to Specific Stage --</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            </div>
            <p className="text-[11px] text-ink-400 mt-1">
              Select which construction stage (Foundation, Slabs, Masonry, Plastering, Electrical, etc.) this belongs to.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-paper-100 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
              3. Amount Calculation
            </span>

            <div className="flex items-center gap-1 rounded-xl bg-paper-100 p-1 border border-paper-200">
              <button
                type="button"
                onClick={() => setCalcMode("QUANTITY_RATE")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer",
                  calcMode === "QUANTITY_RATE"
                    ? "bg-white text-ink-900 shadow-xs"
                    : "text-ink-500 hover:text-ink-800"
                )}
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>Quantity × Rate</span>
              </button>
              <button
                type="button"
                onClick={() => setCalcMode("DIRECT_AMOUNT")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer",
                  calcMode === "DIRECT_AMOUNT"
                    ? "bg-white text-ink-900 shadow-xs"
                    : "text-ink-500 hover:text-ink-800"
                )}
              >
                <Wallet className="h-3.5 w-3.5" />
                <span>Direct Amount</span>
              </button>
            </div>
          </div>

          {calcMode === "QUANTITY_RATE" ? (
            <>
              {superiorCategory === "MATERIAL" ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="material-quantity" className="text-xs font-bold text-ink-700 block mb-1.5">
                      Quantity
                    </label>
                    <input
                      id="material-quantity"
                      type="number"
                      step="any"
                      inputMode="decimal"
                      placeholder="50"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="material-unit" className="text-xs font-bold text-ink-700 block mb-1.5">
                      Unit
                    </label>
                    <select
                      id="material-unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
                    >
                      {UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="material-rate" className="text-xs font-bold text-ink-700 block mb-1.5">
                      Rate (₹ / Unit)
                    </label>
                    <input
                      id="material-rate"
                      type="number"
                      step="any"
                      inputMode="decimal"
                      placeholder="380"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="labour-workers-count" className="text-xs font-bold text-ink-700 block mb-1.5">
                        Workers
                      </label>
                      <input
                        id="labour-workers-count"
                        type="number"
                        min={1}
                        inputMode="numeric"
                        placeholder="3"
                        value={numberOfWorkers}
                        onChange={(e) => setNumberOfWorkers(e.target.value)}
                        className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                      />
                    </div>

                    <div>
                      <label htmlFor="labour-days-count" className="text-xs font-bold text-ink-700 block mb-1.5">
                        Days
                      </label>
                      <input
                        id="labour-days-count"
                        type="number"
                        step="any"
                        min={0.5}
                        inputMode="decimal"
                        placeholder="1"
                        value={numberOfDays}
                        onChange={(e) => setNumberOfDays(e.target.value)}
                        className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                      />
                    </div>

                    <div>
                      <label htmlFor="labour-daily-rate" className="text-xs font-bold text-ink-700 block mb-1.5">
                        Daily Rate (₹)
                      </label>
                      <input
                        id="labour-daily-rate"
                        type="number"
                        step="any"
                        inputMode="decimal"
                        placeholder="900"
                        value={dailyRate}
                        onChange={(e) => setDailyRate(e.target.value)}
                        className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <label htmlFor="expense-direct-amount" className="text-xs font-bold text-ink-700 block mb-1.5">
                Total Bill / Invoice Amount (₹)
              </label>
              <input
                id="expense-direct-amount"
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="₹ 25,000"
                value={directAmount}
                onChange={(e) => setDirectAmount(e.target.value)}
                className="w-full rounded-xl border border-paper-300 bg-white p-3 text-lg font-bold text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
              />
            </div>
          )}

          <div className="rounded-2xl border border-clay-200 bg-clay-50/60 p-4 shadow-2xs transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-clay-800">
                  Calculated Total
                </span>
                {formulaLabel && (
                  <p className="text-xs font-semibold text-ink-600 mt-0.5 animate-fadeIn">
                    {formulaLabel}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="font-display text-2xl sm:text-3xl font-bold text-ink-900">
                  {formatINR(computedTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-clay-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-700">
                4. Bill / Invoice Attachment
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-ink-400">Optional</span>
          </div>

          {existingReceipts.length > 0 && (
            <div className="space-y-2 pb-2">
              <span className="text-xs font-semibold text-ink-600 block">
                Currently Attached Receipts:
              </span>
              <div className="flex flex-wrap gap-2">
                {existingReceipts.map((receipt) => (
                  <a
                    key={receipt.id}
                    href={`/api/receipts/${receipt.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-paper-300 bg-paper-50 px-3 py-1.5 text-xs font-bold text-clay-700 hover:bg-paper-100 transition shadow-2xs"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>{receipt.fileName}</span>
                    <span className="text-[10px] uppercase text-stone-400 font-normal">
                      ({(receipt.sizeBytes / 1024).toFixed(0)} KB)
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <FileDropzone
            name="receipt"
            label="Upload Bill / Receipt"
            helperText="Drag and drop invoice image (JPG, PNG) or PDF bill, or tap to choose/take photo"
            onFileSelect={(file) => setSelectedFile(file)}
          />
        </div>

        <div className="rounded-3xl border border-paper-200 bg-white shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setShowMoreDetails(!showMoreDetails)}
            className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-paper-50/60 transition cursor-pointer"
          >
            <div>
              <span className="text-xs sm:text-sm font-bold text-ink-900 block">
                More Details (Vendor, Stage, Payment, Notes)
              </span>
              <span className="text-xs text-ink-500">
                {showMoreDetails ? "Hide extra fields" : "Click to tag contractor, stage, floor, payment mode"}
              </span>
            </div>
            <div className="rounded-xl border border-paper-200 p-1.5 text-ink-600 bg-paper-50">
              {showMoreDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>

          {showMoreDetails && (
            <div className="p-5 sm:p-6 border-t border-paper-100 bg-paper-50/30 space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {superiorCategory === "MATERIAL" ? (
                  <div>
                    <label htmlFor="expense-vendor-select" className="text-xs font-bold text-ink-700 block mb-1.5">
                      Vendor / Store
                    </label>
                    <select
                      id="expense-vendor-select"
                      value={vendorId}
                      onChange={(e) => setVendorId(e.target.value)}
                      className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
                    >
                      <option value="">Select Vendor (Optional)</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="expense-worker-select" className="text-xs font-bold text-ink-700 block mb-1.5">
                      Worker / Contractor
                    </label>
                    <select
                      id="expense-worker-select"
                      value={workerId}
                      onChange={(e) => setWorkerId(e.target.value)}
                      className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
                    >
                      <option value="">Select Worker (Optional)</option>
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="expense-payment-method" className="text-xs font-bold text-ink-700 block mb-1.5">
                    Payment Method
                  </label>
                  <select
                    id="expense-payment-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.value} value={pm.value}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="expense-floor-select" className="text-xs font-bold text-ink-700 block mb-1.5">
                    Floor
                  </label>
                  <select
                    id="expense-floor-select"
                    value={floorId}
                    onChange={(e) => setFloorId(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
                  >
                    <option value="">Select Floor (Optional)</option>
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="expense-invoice-number" className="text-xs font-bold text-ink-700 block mb-1.5">
                    Bill / Invoice #
                  </label>
                  <input
                    id="expense-invoice-number"
                    type="text"
                    placeholder="e.g. INV-2024-001"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label htmlFor="expense-notes" className="text-xs font-bold text-ink-700 block mb-1.5">
                    Additional Notes
                  </label>
                  <input
                    id="expense-notes"
                    type="text"
                    placeholder="e.g. Paid via contractor phone, delivery pending"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={pending || computedTotal <= 0}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-clay-600 py-3.5 px-6 text-sm font-bold text-white shadow-xs hover:bg-clay-700 active:scale-[0.99] disabled:opacity-50 transition cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {pending
                ? "Saving Expense..."
                : expenseId
                ? `Update Expense (${formatINR(computedTotal)})`
                : `Save Expense (${formatINR(computedTotal)})`}
            </span>
          </button>
        </div>
      </form>

      {expenseId && (
        <ConfirmDialog
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Expense"
          description="Are you sure you want to delete this expense record? This action cannot be undone."
          confirmText="Delete"
          variant="danger"
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
