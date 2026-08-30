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
  HardHat,
  Package,
  Plus,
  Trash2,
  Wallet,
  Sparkles,
  Milestone,
} from "lucide-react";
import { saveExpense, deleteExpense } from "@/lib/actions/expenses";
import { uploadReceipt } from "@/lib/actions/receipts";
import {
  createMaterialCategory,
  createLabourCategory,
  createConstructionStageAction,
} from "@/lib/actions/masters";
import { computeLabourAmount, computeMaterialAmount } from "@/lib/finance/aggregations";
import { formatINR, parseMoneyInput } from "@/lib/money";
import { getMaterialPreset } from "@/lib/catalog/expense-presets";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string; groupName?: string | null; type?: string; phone?: string | null; company?: string | null };
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

  // Toggle for custom category entry
  const [isCustomCategory, setIsCustomCategory] = useState(false);

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
  
  // Construction Stage state with custom add support
  const [stagesList, setStagesList] = useState<Option[]>(() => {
    const list = [...stages];
    if (initial?.constructionStageId) {
      if (!list.some((s) => s.id === initial.constructionStageId)) {
        list.push({ id: initial.constructionStageId, name: "Selected Stage" });
      }
    }
    return list;
  });
  const [stageId, setStageId] = useState<string>(initial?.constructionStageId ?? "");
  const [isCustomStage, setIsCustomStage] = useState<boolean>(false);
  const [customStageName, setCustomStageName] = useState<string>("");

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

  // Handle Category selection or custom input
  const handleCategoryNameChange = (name: string) => {
    if (superiorCategory === "MATERIAL") {
      setMaterialCategoryName(name);
      const match = materialsList.find((m) => m.name.toLowerCase() === name.toLowerCase());
      if (match) {
        setMaterialCategoryId(match.id);
        const preset = getMaterialPreset(match.name);
        if (preset) {
          setUnit(preset.defaultUnit);
          if (!description && preset.descriptions?.[0]) setDescription(preset.descriptions[0]);
        }
      } else {
        setMaterialCategoryId("");
        const preset = getMaterialPreset(name);
        if (preset) {
          setUnit(preset.defaultUnit);
          if (!description && preset.descriptions?.[0]) setDescription(preset.descriptions[0]);
        }
      }
    } else {
      setLabourCategoryName(name);
      const match = laboursList.find((l) => l.name.toLowerCase() === name.toLowerCase());
      if (match) {
        setLabourCategoryId(match.id);
      } else {
        setLabourCategoryId("");
      }
    }
  };

  const handleAddAnother = () => {
    setSavedSuccess(null);
    setDescription("");
    setQuantity("");
    setRate("");
    setDirectAmount("");
    setInvoiceNumber("");
    setNotes("");
    setSelectedFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const categoryNameToSave = (superiorCategory === "MATERIAL" ? materialCategoryName : labourCategoryName).trim();
    if (!categoryNameToSave) {
      setError(`Please select or write a ${superiorCategory === "MATERIAL" ? "Material" : "Man Power"} category.`);
      return;
    }

    if (computedTotal <= 0) {
      setError("Please enter a valid amount or quantity/rate greater than ₹0.");
      return;
    }

    start(async () => {
      try {
        let finalMaterialCatId = materialCategoryId;
        let finalLabourCatId = labourCategoryId;

        // Auto-create category if custom
        if (superiorCategory === "MATERIAL") {
          const existing = materialsList.find((m) => m.name.toLowerCase() === categoryNameToSave.toLowerCase());
          if (existing) {
            finalMaterialCatId = existing.id;
          } else {
            const createRes = await createMaterialCategory({ projectId, name: categoryNameToSave });
            if ("category" in createRes && createRes.category?.id) {
              finalMaterialCatId = createRes.category.id;
              setMaterialsList((prev) => [...prev, { id: createRes.category!.id, name: categoryNameToSave }]);
            }
          }
        } else {
          const existing = laboursList.find((l) => l.name.toLowerCase() === categoryNameToSave.toLowerCase());
          if (existing) {
            finalLabourCatId = existing.id;
          } else {
            const createRes = await createLabourCategory({ projectId, name: categoryNameToSave });
            if ("category" in createRes && createRes.category?.id) {
              finalLabourCatId = createRes.category.id;
              setLaboursList((prev) => [...prev, { id: createRes.category!.id, name: categoryNameToSave }]);
            }
          }
        }

        // Auto-create construction stage if custom
        let finalStageId = stageId;
        if (isCustomStage && customStageName.trim()) {
          const existingStage = stagesList.find((s) => s.name.toLowerCase() === customStageName.trim().toLowerCase());
          if (existingStage) {
            finalStageId = existingStage.id;
          } else {
            const createStageRes = await createConstructionStageAction({ projectId, name: customStageName.trim() });
            if ("stage" in createStageRes && createStageRes.stage?.id) {
              finalStageId = createStageRes.stage.id;
              setStagesList((prev) => [...prev, { id: createStageRes.stage!.id, name: customStageName.trim() }]);
            }
          }
        }

        const payload: Record<string, string | number | undefined> = {
          projectId,
          date,
          expenseType: superiorCategory === "MATERIAL" ? "MATERIAL" : "LABOUR",
          description: description.trim() || `${categoryNameToSave} expense`,
          paymentMethod,
          constructionStageId: finalStageId || undefined,
          floorId: floorId || undefined,
          vendorId: superiorCategory === "MATERIAL" && vendorId ? vendorId : undefined,
          workerId: superiorCategory === "MANPOWER" && workerId ? workerId : undefined,
          invoiceNumber: invoiceNumber.trim() || undefined,
          notes: notes.trim() || undefined,
          materialCategoryId: superiorCategory === "MATERIAL" ? finalMaterialCatId || undefined : undefined,
          labourCategoryId: superiorCategory === "MANPOWER" ? finalLabourCatId || undefined : undefined,
        };

        if (calcMode === "DIRECT_AMOUNT") {
          payload.amount = directAmount;
        } else {
          if (superiorCategory === "MATERIAL") {
            payload.quantity = quantity;
            payload.unit = unit;
            payload.rate = rate;
            payload.amount = computedTotal;
          } else {
            payload.labourCalcMethod = "DAILY_WAGE";
            payload.numberOfWorkers = numberOfWorkers;
            payload.numberOfDays = numberOfDays;
            payload.rate = dailyRate;
            payload.amount = computedTotal;
          }
        }

        const res = await saveExpense(payload, expenseId);
        if ("error" in res && res.error) {
          setError(res.error);
          return;
        }

        const targetExpenseId = expenseId || ("id" in res ? (res.id as string) : undefined);

        if (selectedFile && targetExpenseId) {
          const formData = new FormData();
          formData.append("file", selectedFile);
          await uploadReceipt(targetExpenseId, formData);
        }

        if (expenseId) {
          router.push("/expenses");
          router.refresh();
        } else {
          setSavedSuccess({
            id: targetExpenseId || "",
            amount: computedTotal,
            title: description.trim() || categoryNameToSave,
          });
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
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
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

      {/* Spacious 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Main Form - 8 Cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-5">
          {/* Section 1: Type Selection */}
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
                  setIsCustomCategory(false);
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
                  setIsCustomCategory(false);
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

          {/* Section 2: Core Details & Construction Stage */}
          <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 block border-b border-paper-100 pb-2">
              2. Category & Construction Stage
            </span>

            <div>
              <label htmlFor="expense-date" className="text-xs font-bold text-ink-700 block mb-1.5">
                Payment / Transaction Date
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

            {/* Core 2-Column Responsive Grid: Category + Construction Stage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Category Dropdown + Clean Custom Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="expense-category-select" className="text-xs font-bold text-ink-700 block">
                    {superiorCategory === "MATERIAL" ? "Material Category" : "Labour / Work Category"} *
                  </label>
                  {currentCategoryList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory((prev) => !prev);
                        if (!isCustomCategory) {
                          handleCategoryNameChange("");
                        }
                      }}
                      className="text-[11px] font-bold text-clay-700 hover:underline cursor-pointer"
                    >
                      {isCustomCategory ? "← Pick from List" : "+ Type Custom Category"}
                    </button>
                  )}
                </div>

                {isCustomCategory || currentCategoryList.length === 0 ? (
                  <div className="space-y-1">
                    <input
                      id="expense-category-custom-input"
                      type="text"
                      required
                      value={activeCategoryName}
                      onChange={(e) => handleCategoryNameChange(e.target.value)}
                      placeholder={
                        superiorCategory === "MATERIAL"
                          ? "e.g. Italian Marble, UPVC Windows, Teak Wood..."
                          : "e.g. Masonry, Plumbing, Carpentry, Wages..."
                      }
                      className="w-full rounded-xl border border-paper-300 bg-white p-3 text-base sm:text-sm font-semibold text-ink-900 placeholder:text-ink-400 placeholder:font-normal focus:border-clay-500 focus:outline-none shadow-2xs"
                      autoFocus
                    />
                    <p className="text-[10px] text-ink-400">
                      Saves automatically for future expenses in this project.
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      id="expense-category-select"
                      value={
                        currentCategoryList.some((c) => c.name.toLowerCase() === activeCategoryName.toLowerCase())
                          ? activeCategoryName
                          : activeCategoryName
                          ? "__custom__"
                          : ""
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "__custom__") {
                          setIsCustomCategory(true);
                        } else {
                          setIsCustomCategory(false);
                          handleCategoryNameChange(val);
                        }
                      }}
                      className="w-full appearance-none rounded-xl border border-paper-300 bg-white p-3 pr-9 text-base sm:text-sm font-semibold text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs cursor-pointer"
                      required
                    >
                      <option value="">-- Select {superiorCategory === "MATERIAL" ? "Material" : "Labour"} Category --</option>
                      {currentCategoryList.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name} {cat.groupName ? `(${cat.groupName})` : ""}
                        </option>
                      ))}
                      <option value="__custom__">+ Add / Write Custom Category...</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  </div>
                )}
              </div>

              {/* Construction Stage Dropdown + Clean Custom Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="expense-stage-select-main" className="text-xs font-bold text-ink-700 flex items-center gap-1.5">
                    <Milestone className="h-3.5 w-3.5 text-clay-600" />
                    <span>Construction Stage</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomStage((prev) => !prev);
                      if (!isCustomStage) {
                        setCustomStageName("");
                      }
                    }}
                    className="text-[11px] font-bold text-clay-700 hover:underline cursor-pointer"
                  >
                    {isCustomStage ? "← Pick from Stages" : "+ Type Custom Stage"}
                  </button>
                </div>

                {isCustomStage ? (
                  <div className="space-y-1">
                    <input
                      id="expense-stage-custom-input"
                      type="text"
                      value={customStageName}
                      onChange={(e) => setCustomStageName(e.target.value)}
                      placeholder="e.g. Slab 2 Casting, Boundary Wall, Borewell..."
                      className="w-full rounded-xl border border-paper-300 bg-white p-3 text-base sm:text-sm font-semibold text-ink-900 placeholder:text-ink-400 placeholder:font-normal focus:border-clay-500 focus:outline-none shadow-2xs"
                      autoFocus
                    />
                    <p className="text-[10px] text-ink-400">
                      Saves new stage to your project construction list.
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      id="expense-stage-select-main"
                      value={stageId}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "__custom__") {
                          setIsCustomStage(true);
                        } else {
                          setIsCustomStage(false);
                          setStageId(val);
                        }
                      }}
                      className="w-full appearance-none rounded-xl border border-paper-300 bg-white p-3 pr-9 text-base sm:text-sm font-semibold text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs cursor-pointer"
                    >
                      <option value="">-- General / Not Linked to Specific Stage --</option>
                      {stagesList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                      <option value="__custom__">+ Add / Write Custom Stage...</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Description / Notes (Full Width) */}
            <div>
              <label htmlFor="expense-description" className="text-xs font-bold text-ink-700 block mb-1.5">
                Description / Notes / Specifications
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
          </div>

          {/* Section 3: Amount Calculation */}
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
                        placeholder="e.g. 50"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
                      />
                    </div>

                    <div>
                      <label htmlFor="material-unit" className="text-xs font-bold text-ink-700 block mb-1.5">
                        Unit
                      </label>
                      <div className="relative">
                        <select
                          id="material-unit"
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-paper-300 bg-white p-2.5 pr-8 text-base sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs cursor-pointer"
                        >
                          {UNITS.map((u) => (
                            <option key={u.value} value={u.value}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="material-rate" className="text-xs font-bold text-ink-700 block mb-1.5">
                        Rate (₹ / Unit)
                      </label>
                      <input
                        id="material-rate"
                        type="number"
                        step="any"
                        placeholder="e.g. 380"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="manpower-workers" className="text-xs font-bold text-ink-700 block mb-1.5">
                        Number of Workers
                      </label>
                      <input
                        id="manpower-workers"
                        type="number"
                        min="1"
                        placeholder="e.g. 4"
                        value={numberOfWorkers}
                        onChange={(e) => setNumberOfWorkers(e.target.value)}
                        className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
                      />
                    </div>

                    <div>
                      <label htmlFor="manpower-days" className="text-xs font-bold text-ink-700 block mb-1.5">
                        Number of Days
                      </label>
                      <input
                        id="manpower-days"
                        type="number"
                        step="0.5"
                        min="0.5"
                        placeholder="e.g. 1"
                        value={numberOfDays}
                        onChange={(e) => setNumberOfDays(e.target.value)}
                        className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
                      />
                    </div>

                    <div>
                      <label htmlFor="manpower-rate" className="text-xs font-bold text-ink-700 block mb-1.5">
                        Daily Wage (₹ / Worker)
                      </label>
                      <input
                        id="manpower-rate"
                        type="number"
                        step="any"
                        placeholder="e.g. 900"
                        value={dailyRate}
                        onChange={(e) => setDailyRate(e.target.value)}
                        className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div>
                <label htmlFor="direct-amount-input" className="text-xs font-bold text-ink-700 block mb-1.5">
                  Total Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-ink-400">
                    ₹
                  </span>
                  <input
                    id="direct-amount-input"
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 25000"
                    value={directAmount}
                    onChange={(e) => setDirectAmount(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-3 pl-8 text-lg font-bold text-ink-900 placeholder:text-ink-400 placeholder:font-normal focus:border-clay-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Optional Details Accordion */}
          <div className="rounded-3xl border border-paper-200 bg-white shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-paper-50/50 hover:bg-paper-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-600">
                  4. Payment Method, Vendor & Receipts
                </span>
                <span className="rounded-md bg-paper-200 px-2 py-0.5 text-[10px] font-bold text-ink-600">
                  Optional
                </span>
              </div>
              {showMoreDetails ? (
                <ChevronUp className="h-4 w-4 text-ink-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-ink-500" />
              )}
            </button>

            {showMoreDetails && (
              <div className="p-5 sm:p-6 space-y-4 border-t border-paper-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Payment Method */}
                  <div>
                    <label htmlFor="expense-payment-method" className="text-xs font-bold text-ink-700 block mb-1.5">
                      Payment Method
                    </label>
                    <div className="relative">
                      <select
                        id="expense-payment-method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-paper-300 bg-white p-2.5 pr-8 text-base sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs cursor-pointer"
                      >
                        {PAYMENT_METHODS.map((pm) => (
                          <option key={pm.value} value={pm.value}>
                            {pm.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    </div>
                  </div>

                  {/* Floor */}
                  <div>
                    <label htmlFor="expense-floor-select" className="text-xs font-bold text-ink-700 block mb-1.5">
                      Floor / Level
                    </label>
                    <div className="relative">
                      <select
                        id="expense-floor-select"
                        value={floorId}
                        onChange={(e) => setFloorId(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-paper-300 bg-white p-2.5 pr-8 text-base sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs cursor-pointer"
                      >
                        <option value="">-- General / Whole House --</option>
                        {floors.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Vendor / Store (for Materials) */}
                  {superiorCategory === "MATERIAL" && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="expense-vendor-select" className="text-xs font-bold text-ink-700 block">
                          Vendor / Store / Supplier
                        </label>
                        <Link href="/phonedirectory" className="text-[11px] font-bold text-clay-700 hover:underline">
                          + Add Contact
                        </Link>
                      </div>
                      <div className="relative">
                        <select
                          id="expense-vendor-select"
                          value={vendorId}
                          onChange={(e) => setVendorId(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-paper-300 bg-white p-2.5 pr-8 text-base sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs cursor-pointer"
                        >
                          <option value="">-- None / Direct Purchase --</option>
                          {vendors.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} {v.company ? `(${v.company})` : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      </div>
                    </div>
                  )}

                  {/* Worker / Contractor (for Manpower) */}
                  {superiorCategory === "MANPOWER" && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="expense-worker-select" className="text-xs font-bold text-ink-700 block">
                          Worker / Subcontractor
                        </label>
                        <Link href="/phonedirectory" className="text-[11px] font-bold text-clay-700 hover:underline">
                          + Add Contact
                        </Link>
                      </div>
                      <div className="relative">
                        <select
                          id="expense-worker-select"
                          value={workerId}
                          onChange={(e) => setWorkerId(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-paper-300 bg-white p-2.5 pr-8 text-base sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs cursor-pointer"
                        >
                          <option value="">-- None / Daily Site Labour --</option>
                          {workers.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} {w.type ? `(${w.type})` : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      </div>
                    </div>
                  )}

                  {/* Invoice / Bill Number */}
                  <div>
                    <label htmlFor="expense-invoice" className="text-xs font-bold text-ink-700 block mb-1.5">
                      Bill / Invoice / Receipt #
                    </label>
                    <input
                      id="expense-invoice"
                      type="text"
                      placeholder="e.g. INV-2026-089"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                    />
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label htmlFor="expense-notes" className="text-xs font-bold text-ink-700 block mb-1.5">
                    Additional Site Notes
                  </label>
                  <textarea
                    id="expense-notes"
                    rows={2}
                    placeholder="Vehicle number, challan details, unloading remarks..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-base sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                  />
                </div>

                {/* Upload Receipt / Bill Document */}
                <div>
                  <label className="text-xs font-bold text-ink-700 block mb-1.5">
                    Attach Bill / Invoice Photo
                  </label>
                  <FileDropzone
                    name="file"
                    onFileSelect={(file) => setSelectedFile(file)}
                    accept="image/*,application/pdf"
                    label="Drop receipt photo or click to browse"
                    helperText="JPEG, PNG or PDF up to 10MB"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Ready to upload: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                    </p>
                  )}
                  {existingReceipts.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[11px] font-bold text-ink-500">Existing Attached Receipts:</p>
                      {existingReceipts.map((r) => (
                        <div key={r.id} className="text-xs text-ink-700 flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{r.fileName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-clay-600 hover:bg-clay-700 py-3.5 px-6 text-sm font-bold text-white shadow-xs hover:shadow-sm active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
            >
              {pending ? (
                <span>Recording Expense…</span>
              ) : (
                <>
                  <span>{expenseId ? "Update Expense" : "Save & Record Expense"}</span>
                  <span className="font-mono text-clay-200">({formatINR(computedTotal)})</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Column (Live Expense Voucher & Quick Tips - 4 Cols) */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
          <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-paper-100 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                Expense Preview
              </span>
              <span className="rounded-full bg-clay-100 px-2.5 py-0.5 text-[10px] font-extrabold text-clay-800">
                Live Voucher
              </span>
            </div>

            <div className="rounded-2xl bg-paper-50 p-4 border border-paper-200/80 space-y-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                  Total Amount
                </p>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-clay-700 mt-0.5">
                  {formatINR(computedTotal)}
                </p>
              </div>

              <div className="border-t border-paper-200 pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-ink-500 font-medium">Type</span>
                  <span className="font-bold text-ink-900">
                    {superiorCategory === "MATERIAL" ? "Material Purchase" : "Man Power Wages"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ink-500 font-medium">Category</span>
                  <span className="font-bold text-ink-900 truncate max-w-[160px]">
                    {activeCategoryName || "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ink-500 font-medium">Date</span>
                  <span className="font-bold text-ink-900">{date}</span>
                </div>

                {(isCustomStage && customStageName.trim()) || stageId ? (
                  <div className="flex items-center justify-between">
                    <span className="text-ink-500 font-medium">Stage</span>
                    <span className="font-bold text-clay-800 bg-clay-100/80 px-2 py-0.5 rounded-md truncate max-w-[160px]">
                      {isCustomStage ? customStageName : stagesList.find((s) => s.id === stageId)?.name || stageId}
                    </span>
                  </div>
                ) : null}

                <div className="flex items-center justify-between">
                  <span className="text-ink-500 font-medium">Payment Method</span>
                  <span className="font-bold text-ink-900">{paymentMethod}</span>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="rounded-2xl border border-clay-200 bg-clay-50/60 p-4 text-xs space-y-2 text-ink-700">
              <div className="flex items-center gap-1.5 font-bold text-clay-900">
                <Sparkles className="h-4 w-4 text-clay-600" />
                <span>Construction Tracking Tip</span>
              </div>
              <p className="text-ink-600 leading-relaxed">
                {superiorCategory === "MATERIAL"
                  ? "Record cement and steel bills with quantity & rate to automatically compute unit costs and generate itemized stage expenditure reports."
                  : "Track daily worker counts and mason wage rates to prevent budget overruns during slab casting and brickwork stages."}
              </p>
            </div>

            <div className="pt-1 text-center">
              <Link
                href="/daily-log"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-clay-700 hover:text-clay-900 transition"
              >
                <span>Looking for Day-wise Cement & Labour Muster Roll?</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Expense?"
        description="Are you sure you want to permanently delete this expense? All linked calculations and reports will update automatically."
        confirmText={pending ? "Deleting..." : "Delete Expense"}
        variant="danger"
      />
    </div>
  );
}
