"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HardHat,
  MoreHorizontal,
  Package,
  Plus,
  Receipt,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { saveExpense, deleteExpense } from "@/lib/actions/expenses";
import { uploadReceipt } from "@/lib/actions/receipts";
import { computeLabourAmount, computeMaterialAmount } from "@/lib/finance/aggregations";
import { formatINR, parseMoneyInput } from "@/lib/money";
import { getMaterialPreset } from "@/lib/catalog/expense-presets";
import { useLanguage } from "@/context/language-context";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string; groupName?: string; type?: string; phone?: string | null };
type ExpenseKind = "MATERIAL" | "LABOUR" | "OTHER";

const UNITS = [
  { value: "bags", labelEn: "Bags", labelTe: "బస్తాలు (Bags)" },
  { value: "kg", labelEn: "Kg", labelTe: "కిలోలు (Kg)" },
  { value: "tons", labelEn: "Tons", labelTe: "టన్నులు (Tons)" },
  { value: "loads", labelEn: "Loads (Tractor/Tipper)", labelTe: "లోడ్లు (Loads)" },
  { value: "sqft", labelEn: "Sqft", labelTe: "చ.అడుగులు (Sqft)" },
  { value: "cum", labelEn: "Cum (Cubic Meter)", labelTe: "ఘన మీటర్లు (Cum)" },
  { value: "nos", labelEn: "Nos / Pieces", labelTe: "సంఖ్య / పీసులు (Nos)" },
  { value: "litres", labelEn: "Litres", labelTe: "లీటర్లు (Litres)" },
  { value: "coils", labelEn: "Coils", labelTe: "కాయిల్స్ (Coils)" },
  { value: "brass", labelEn: "Brass (100 cu ft)", labelTe: "బ్రాస్ (Brass)" },
  { value: "units", labelEn: "Units", labelTe: "యూనిట్లు" },
] as const;

const PAYMENT_METHODS = [
  { value: "UPI", labelEn: "UPI (GPay / PhonePe / Paytm)" },
  { value: "CASH", labelEn: "Cash / నగదు" },
  { value: "BANK_TRANSFER", labelEn: "Bank Transfer / NEFT / IMPS" },
  { value: "CHEQUE", labelEn: "Cheque" },
  { value: "CARD", labelEn: "Credit / Debit Card" },
  { value: "CREDIT", labelEn: "Store Credit / Khata (ఉద్దెర)" },
  { value: "OTHER", labelEn: "Other" },
] as const;

export function ExpenseForm({
  projectId,
  expenseId,
  initial,
  materials = [],
  labours = [],
  services = [],
  equipment = [],
  professionals = [],
  vendors = [],
  workers = [],
  stages = [],
  floors = [],
}: {
  projectId: string;
  expenseId?: string;
  initial?: Partial<Record<string, string>>;
  materials: Option[];
  labours: Option[];
  services: Option[];
  equipment: Option[];
  professionals: Option[];
  vendors: Option[];
  workers: Option[];
  stages: Option[];
  floors: Option[];
}) {
  const router = useRouter();
  const { language, t, getStageName } = useLanguage();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Success State for 15-second fast continuous recording
  const [savedSuccess, setSavedSuccess] = useState<{ id: string; amount: number; title: string } | null>(null);

  // 1. Primary Decision: "What are you recording?"
  const initialType: ExpenseKind =
    initial?.expenseType === "LABOUR"
      ? "LABOUR"
      : initial?.expenseType === "SERVICE" || initial?.expenseType === "EQUIPMENT" || initial?.expenseType === "PROFESSIONAL" || initial?.expenseType === "OTHER"
      ? "OTHER"
      : "MATERIAL";
  const [type, setType] = useState<ExpenseKind>(initialType);

  // 2. Shared Fields
  const [date, setDate] = useState<string>(
    initial?.date ? initial.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState<string>(initial?.description ?? "");

  // 3. Material Specific Fields
  const [materialCategory, setMaterialCategory] = useState<string>(
    initial?.materialCategoryId ?? materials[0]?.id ?? ""
  );
  const [quantity, setQuantity] = useState<string>(initial?.quantity ?? "");
  const [unit, setUnit] = useState<string>(initial?.unit ?? "bags");
  const [rate, setRate] = useState<string>(initial?.rate ?? "");
  const [materialManualAmount, setMaterialManualAmount] = useState<string>(initial?.amount ?? "");

  // 4. Labour Specific Fields
  const [labourCategory, setLabourCategory] = useState<string>(
    initial?.labourCategoryId ?? labours[0]?.id ?? ""
  );
  const [workerId, setWorkerId] = useState<string>(initial?.workerId ?? "");
  const [calcMode, setCalcMode] = useState<"DAILY_WAGE" | "FIXED_CONTRACT">(
    initial?.labourCalcMethod === "FIXED_CONTRACT" || (initial?.amount && !initial?.numberOfWorkers)
      ? "FIXED_CONTRACT"
      : "DAILY_WAGE"
  );
  const [numberOfWorkers, setNumberOfWorkers] = useState<string>(initial?.numberOfWorkers ?? "3");
  const [numberOfDays, setNumberOfDays] = useState<string>(initial?.numberOfDays ?? "1");
  const [dailyRate, setDailyRate] = useState<string>(initial?.rate ?? "900");
  const [contractAmount, setContractAmount] = useState<string>(initial?.amount ?? "");

  // 5. Other Specific Fields
  const [otherCategory, setOtherCategory] = useState<string>(
    initial?.serviceCategoryId ?? initial?.equipmentCategoryId ?? initial?.professionalCategoryId ?? services[0]?.id ?? ""
  );
  const [otherAmount, setOtherAmount] = useState<string>(initial?.amount ?? "");

  // 6. Optional Fields (Hidden under "More Details")
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [vendorId, setVendorId] = useState<string>(initial?.vendorId ?? "");
  const [stageId, setStageId] = useState<string>(initial?.constructionStageId ?? "");
  const [floorId, setFloorId] = useState<string>(initial?.floorId ?? "");
  const [paymentMethod, setPaymentMethod] = useState<string>(initial?.paymentMethod ?? "UPI");
  const [invoiceNumber, setInvoiceNumber] = useState<string>(initial?.invoiceNumber ?? "");
  const [notes, setNotes] = useState<string>(initial?.notes ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Live Calculated Total Computation
  const computedTotal = useMemo(() => {
    if (type === "MATERIAL") {
      const q = parseMoneyInput(quantity);
      const r = parseMoneyInput(rate);
      const a = parseMoneyInput(materialManualAmount);
      if (q && r && !q.isZero() && !r.isZero()) {
        return Number(computeMaterialAmount({ quantity: q, rate: r }));
      }
      if (a) return Number(a);
      return 0;
    }
    if (type === "LABOUR") {
      if (calcMode === "DAILY_WAGE") {
        const w = Number(numberOfWorkers) || 0;
        const d = Number(numberOfDays) || 0;
        const r = parseMoneyInput(dailyRate);
        if (w && d && r) {
          return Number(computeLabourAmount({ method: "DAILY_WAGE", numberOfWorkers: w, numberOfDays: d, rate: r }));
        }
        return 0;
      }
      return Number(parseMoneyInput(contractAmount) ?? 0);
    }
    return Number(parseMoneyInput(otherAmount) ?? 0);
  }, [type, quantity, rate, materialManualAmount, calcMode, numberOfWorkers, numberOfDays, dailyRate, contractAmount, otherAmount]);

  // Live Formula String
  const formulaLabel = useMemo(() => {
    if (type === "MATERIAL") {
      const q = Number(quantity) || 0;
      const r = Number(rate) || 0;
      if (q > 0 && r > 0) {
        return `${q} ${unit} × ₹${r} = ₹${(q * r).toLocaleString("en-IN")}`;
      }
      return null;
    }
    if (type === "LABOUR" && calcMode === "DAILY_WAGE") {
      const w = Number(numberOfWorkers) || 0;
      const d = Number(numberOfDays) || 0;
      const r = Number(dailyRate) || 0;
      if (w > 0 && d > 0 && r > 0) {
        return `${w} workers × ${d} ${d === 1 ? "day" : "days"} × ₹${r} = ₹${(w * d * r).toLocaleString("en-IN")}`;
      }
      return null;
    }
    return null;
  }, [type, quantity, rate, unit, calcMode, numberOfWorkers, numberOfDays, dailyRate]);

  // Auto-set description and default unit when Material category changes
  const handleMaterialCategoryChange = (catId: string) => {
    setMaterialCategory(catId);
    const cat = materials.find((m) => m.id === catId);
    if (cat) {
      const preset = getMaterialPreset(cat.name);
      if (preset.defaultUnit) setUnit(preset.defaultUnit);
      if (!description || materials.some((m) => m.name === description)) {
        setDescription(cat.name);
      }
    }
  };

  // Auto-set description when Labour category changes
  const handleLabourCategoryChange = (catId: string) => {
    setLabourCategory(catId);
    const cat = labours.find((l) => l.id === catId);
    if (cat) {
      if (!description || labours.some((l) => l.name === description)) {
        setDescription(cat.name);
      }
    }
  };

  // Reset form for "Add Another" 15-second workflow
  const handleAddAnother = () => {
    setSavedSuccess(null);
    setError(null);
    setQuantity("");
    setRate("");
    setMaterialManualAmount("");
    setContractAmount("");
    setOtherAmount("");
    setInvoiceNumber("");
    setSelectedFile(null);
    setDescription("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (computedTotal <= 0) {
      setError(language === "te" ? "దయచేసి సరైన మొత్తం లేదా పరిమాణం మరియు రేటు నమోదు చేయండి" : "Please enter a valid amount or quantity and rate");
      return;
    }

    const payload: Record<string, unknown> = {
      projectId,
      date,
      expenseType: type,
      paymentMethod,
      amount: String(computedTotal),
      constructionStageId: stageId || null,
      floorId: floorId || null,
      invoiceNumber: invoiceNumber || null,
      notes: notes || null,
    };

    let title = "Expense";

    if (type === "MATERIAL") {
      const cat = materials.find((m) => m.id === materialCategory);
      title = description.trim() || cat?.name || "Material";
      payload.materialCategoryId = materialCategory;
      payload.description = title;
      payload.quantity = quantity || null;
      payload.unit = unit || null;
      payload.rate = rate || null;
      payload.vendorId = vendorId || null;
    } else if (type === "LABOUR") {
      const cat = labours.find((l) => l.id === labourCategory);
      title = description.trim() || cat?.name || "Labour";
      payload.labourCategoryId = labourCategory;
      payload.description = title;
      payload.labourCalcMethod = calcMode;
      if (calcMode === "DAILY_WAGE") {
        payload.numberOfWorkers = numberOfWorkers || null;
        payload.numberOfDays = numberOfDays || null;
        payload.rate = dailyRate || null;
      }
      payload.workerId = workerId || null;
    } else {
      title = description.trim() || "Service / Equipment";
      payload.serviceCategoryId = otherCategory || null;
      payload.description = title;
      payload.vendorId = vendorId || null;
    }

    start(async () => {
      try {
        const result = await saveExpense(payload, expenseId);
        if (result && "error" in result && result.error) {
          setError(typeof result.error === "string" ? result.error : "Failed to save expense");
          return;
        }

        const savedId = (result as { id?: string })?.id ?? expenseId;

        // Upload receipt if selected
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

  // SUCCESS BANNER STATE (ZERO REDIRECT, 1-TAP CONTINUOUS LOGGING)
  if (savedSuccess) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-xs text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-ink-900">
              {language === "te" ? "ఖర్చు విజయవంతంగా నమోదైంది!" : "Expense Recorded Successfully!"}
            </h2>
            <p className="font-display text-2xl font-bold text-clay-700">
              {formatINR(savedSuccess.amount)}
            </p>
            <p className="text-xs text-ink-500 font-medium">
              {savedSuccess.title} • {date}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddAnother}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-clay-600 px-5 py-3 text-sm font-bold text-white shadow-xs hover:bg-clay-700 active:scale-95 transition"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>{language === "te" ? "+ ఇంకో ఖర్చు నమోదు" : "+ Add Another"}</span>
            </button>

            <Link
              href={`/expenses/${savedSuccess.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-paper-300 bg-white px-5 py-3 text-sm font-bold text-ink-800 hover:bg-paper-50 active:scale-95 transition shadow-2xs"
            >
              <span>{language === "te" ? "ఖర్చు వివరాలు" : "View Expense"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/expenses"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-3 text-xs font-semibold text-ink-600 hover:text-ink-900 transition"
            >
              <span>{language === "te" ? "అన్ని ఖర్చులు" : "All Expenses"}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* 1. Header Row */}
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
              {expenseId
                ? (language === "te" ? "ఖర్చు సవరణ" : "Edit Expense")
                : (language === "te" ? "ఖర్చు నమోదు" : "Add Expense")}
            </h1>
            <p className="text-xs text-ink-500 mt-0.5">
              {language === "te"
                ? "15 సెకన్లలో మీ నిర్మాణ ఖర్చులను సులభంగా నమోదు చేయండి"
                : "Record your construction spending in seconds"}
            </p>
          </div>
        </div>

        {expenseId && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/60 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{language === "te" ? "తొలగించు" : "Delete"}</span>
          </button>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
          {error}
        </div>
      )}

      {/* 2. Main Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: "What are you recording?" */}
        <div className="rounded-2xl border border-paper-200 bg-white p-5 shadow-xs space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-500 block">
            {language === "te" ? "మీరు ఏమి నమోదు చేస్తున్నారు?" : "What are you recording?"}
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* Material Button */}
            <button
              type="button"
              onClick={() => {
                setType("MATERIAL");
                setError(null);
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-2xl border p-3.5 text-xs sm:text-sm font-bold transition shadow-2xs",
                type === "MATERIAL"
                  ? "border-clay-600 bg-clay-50/70 text-clay-900 ring-2 ring-clay-600/20"
                  : "border-paper-200 bg-paper-50 text-ink-700 hover:bg-paper-100"
              )}
            >
              <Package className={cn("h-4 w-4", type === "MATERIAL" ? "text-clay-600" : "text-ink-400")} />
              <span>{language === "te" ? "సామాగ్రి (Material)" : "Material"}</span>
            </button>

            {/* Labour Button */}
            <button
              type="button"
              onClick={() => {
                setType("LABOUR");
                setError(null);
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-2xl border p-3.5 text-xs sm:text-sm font-bold transition shadow-2xs",
                type === "LABOUR"
                  ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-600/20"
                  : "border-paper-200 bg-paper-50 text-ink-700 hover:bg-paper-100"
              )}
            >
              <HardHat className={cn("h-4 w-4", type === "LABOUR" ? "text-emerald-700" : "text-ink-400")} />
              <span>{language === "te" ? "కూలీలు (Labour)" : "Labour"}</span>
            </button>

            {/* Other Button */}
            <button
              type="button"
              onClick={() => {
                setType("OTHER");
                setError(null);
              }}
              className={cn(
                "col-span-2 sm:col-span-1 flex items-center justify-center gap-2 rounded-2xl border p-3.5 text-xs sm:text-sm font-bold transition shadow-2xs",
                type === "OTHER"
                  ? "border-ink-800 bg-ink-50 text-ink-900 ring-2 ring-ink-800/20"
                  : "border-paper-200 bg-paper-50 text-ink-700 hover:bg-paper-100"
              )}
            >
              <MoreHorizontal className={cn("h-4 w-4", type === "OTHER" ? "text-ink-800" : "text-ink-400")} />
              <span>{language === "te" ? "ఇతర (Other)" : "Other"}</span>
            </button>
          </div>
        </div>

        {/* Step 2: Core Fast Fields */}
        <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          {/* Date Picker */}
          <div>
            <label className="text-xs font-bold text-ink-700 block mb-1.5">
              {language === "te" ? "తేదీ" : "Date"}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
            />
          </div>

          {/* ================= IF MATERIAL ================= */}
          {type === "MATERIAL" && (
            <>
              {/* Material Category Select */}
              <div>
                <label className="text-xs font-bold text-ink-700 block mb-1.5">
                  {language === "te" ? "సామాగ్రి రకం" : "Material Category"}
                </label>
                <select
                  value={materialCategory}
                  onChange={(e) => handleMaterialCategoryChange(e.target.value)}
                  className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description / Item Name */}
              <div>
                <label className="text-xs font-bold text-ink-700 block mb-1.5">
                  {language === "te" ? "వివరణ / వస్తువు పేరు" : "Description / Item Name"}
                </label>
                <input
                  type="text"
                  placeholder={language === "te" ? "ఉదా: అల్ట్రాటెక్ 53 గ్రేడ్ సిమెంట్" : "e.g. UltraTech 53 Grade Cement, 16mm Fe550D Steel"}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                />
              </div>

              {/* Quantity, Unit & Rate Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Quantity */}
                <div>
                  <label className="text-xs font-bold text-ink-700 block mb-1.5">
                    {language === "te" ? "పరిమాణం" : "Quantity"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    placeholder="50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="text-xs font-bold text-ink-700 block mb-1.5">
                    {language === "te" ? "యూనిట్" : "Unit"}
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
                  >
                    {UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {language === "te" ? u.labelTe : u.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rate (₹) */}
                <div>
                  <label className="text-xs font-bold text-ink-700 block mb-1.5">
                    {language === "te" ? "ధర (₹ / యూనిట్)" : "Rate (₹ / Unit)"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    placeholder="420"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Direct Amount Fallback (If no qty/rate) */}
              {(!quantity || !rate) && (
                <div>
                  <label className="text-xs font-bold text-ink-700 block mb-1.5">
                    {language === "te" ? "లేదా నేరుగా మొత్తం (₹)" : "Or Direct Total Amount (₹)"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    placeholder="₹ 21,000"
                    value={materialManualAmount}
                    onChange={(e) => setMaterialManualAmount(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                  />
                </div>
              )}
            </>
          )}

          {/* ================= IF LABOUR ================= */}
          {type === "LABOUR" && (
            <>
              {/* Labour Category Select */}
              <div>
                <label className="text-xs font-bold text-ink-700 block mb-1.5">
                  {language === "te" ? "కూలీల విభాగం" : "Labour Category"}
                </label>
                <select
                  value={labourCategory}
                  onChange={(e) => handleLabourCategoryChange(e.target.value)}
                  className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
                >
                  {labours.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Description */}
              <div>
                <label className="text-xs font-bold text-ink-700 block mb-1.5">
                  {language === "te" ? "పని వివరాలు" : "Work Description"}
                </label>
                <input
                  type="text"
                  placeholder={language === "te" ? "ఉదా: పునాది కాంక్రీట్ పని లేదా స్లాబ్ షట్టరింగ్" : "e.g. Plinth beam shuttering & concrete work"}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                />
              </div>

              {/* Worker / Contractor */}
              <div>
                <label className="text-xs font-bold text-ink-700 block mb-1.5">
                  {language === "te" ? "మేస్త్రీ / వర్కర్" : "Worker / Contractor"}
                </label>
                <select
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
                >
                  <option value="">{language === "te" ? "ఎంచుకోండి (ఐచ్ఛికం)" : "Select Worker (Optional)"}</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Calculation Method Toggle */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-ink-700 block">
                  {language === "te" ? "చెల్లింపు లెక్క విధానం" : "Calculation Method"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCalcMode("DAILY_WAGE")}
                    className={cn(
                      "rounded-xl border p-2.5 text-xs font-bold transition shadow-2xs",
                      calcMode === "DAILY_WAGE"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20"
                        : "border-paper-200 bg-paper-50 text-ink-600 hover:bg-paper-100"
                    )}
                  >
                    {language === "te" ? "రోజువారీ కూలీ (Daily Wage)" : "Daily Wage"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcMode("FIXED_CONTRACT")}
                    className={cn(
                      "rounded-xl border p-2.5 text-xs font-bold transition shadow-2xs",
                      calcMode === "FIXED_CONTRACT"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20"
                        : "border-paper-200 bg-paper-50 text-ink-600 hover:bg-paper-100"
                    )}
                  >
                    {language === "te" ? "కాంట్రాక్ట్ / మొత్తం (Fixed Contract)" : "Fixed Contract"}
                  </button>
                </div>
              </div>

              {/* Daily Wage Fields */}
              {calcMode === "DAILY_WAGE" ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1.5">
                      {language === "te" ? "వర్కర్ల సంఖ్య" : "Workers"}
                    </label>
                    <input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      placeholder="4"
                      value={numberOfWorkers}
                      onChange={(e) => setNumberOfWorkers(e.target.value)}
                      className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1.5">
                      {language === "te" ? "రోజులు" : "Days"}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={0.5}
                      inputMode="decimal"
                      placeholder="1"
                      value={numberOfDays}
                      onChange={(e) => setNumberOfDays(e.target.value)}
                      className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-ink-700 block mb-1.5">
                      {language === "te" ? "రోజు కూలీ (₹)" : "Daily Rate (₹)"}
                    </label>
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      placeholder="900"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value)}
                      className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                    />
                  </div>
                </div>
              ) : (
                /* Fixed Contract Field */
                <div>
                  <label className="text-xs font-bold text-ink-700 block mb-1.5">
                    {language === "te" ? "కాంట్రాక్ట్ మొత్తం (₹)" : "Contract Amount (₹)"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    inputMode="decimal"
                    placeholder="₹ 35,000"
                    value={contractAmount}
                    onChange={(e) => setContractAmount(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                  />
                </div>
              )}
            </>
          )}

          {/* ================= IF OTHER ================= */}
          {type === "OTHER" && (
            <>
              <div>
                <label className="text-xs font-bold text-ink-700 block mb-1.5">
                  {language === "te" ? "వర్గం" : "Category"}
                </label>
                <select
                  value={otherCategory}
                  onChange={(e) => setOtherCategory(e.target.value)}
                  className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-ink-700 block mb-1.5">
                  {language === "te" ? "వివరణ" : "Description"}
                </label>
                <input
                  type="text"
                  placeholder="e.g. JCB excavation 4 hours, water tanker, plan permit"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink-700 block mb-1.5">
                  {language === "te" ? "మొత్తం (₹)" : "Total Amount (₹)"}
                </label>
                <input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  placeholder="₹ 5,000"
                  value={otherAmount}
                  onChange={(e) => setOtherAmount(e.target.value)}
                  className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none shadow-2xs"
                />
              </div>
            </>
          )}

          {/* ================= REAL-TIME TOTAL BANNER ================= */}
          <div className="rounded-2xl border border-clay-200 bg-clay-50/50 p-4 shadow-2xs transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-clay-800">
                  {language === "te" ? "మొత్తం ఖర్చు" : "Calculated Total"}
                </span>
                {formulaLabel && (
                  <p className="text-xs font-semibold text-ink-600 mt-0.5 animate-fadeIn">
                    {formulaLabel}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="font-display text-2xl sm:text-3xl font-bold text-ink-900 transition-all duration-300 scale-100">
                  {formatINR(computedTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Optional Fields Accordion ("More Details") */}
        <div className="rounded-2xl border border-paper-200 bg-white shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setShowMoreDetails(!showMoreDetails)}
            className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-paper-50/60 transition"
          >
            <div>
              <span className="text-xs sm:text-sm font-bold text-ink-900 block">
                {language === "te" ? "మరిన్ని వివరాలు (ఐచ్ఛికం)" : "More Details (Optional)"}
              </span>
              <p className="text-[11px] text-ink-500 mt-0.5">
                {language === "te"
                  ? "దుకాణం, దశ, అంతస్తు, చెల్లింపు విధానం, రసీదు ఫోటో"
                  : "Vendor, stage, floor, payment method, bill photo & notes"}
              </p>
            </div>

            <div className="rounded-lg bg-paper-100 p-1 text-ink-500">
              {showMoreDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>

          {showMoreDetails && (
            <div className="p-5 sm:p-6 border-t border-paper-100 bg-paper-50/30 space-y-4 text-xs">
              {/* Vendor (For Material or Other) */}
              {type !== "LABOUR" && (
                <div>
                  <label className="font-bold text-ink-700 block mb-1.5">
                    {language === "te" ? "దుకాణం / వెండర్" : "Vendor / Supplier"}
                  </label>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
                  >
                    <option value="">{language === "te" ? "ఎంచుకోండి (ఐచ్ఛికం)" : "Select Vendor (Optional)"}</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Construction Stage & Floor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Stage */}
                <div>
                  <label className="font-bold text-ink-700 block mb-1.5">
                    {language === "te" ? "నిర్మాణ దశ" : "Construction Stage"}
                  </label>
                  <select
                    value={stageId}
                    onChange={(e) => setStageId(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
                  >
                    <option value="">{language === "te" ? "ఎంచుకోండి (ఐచ్ఛికం)" : "Select Stage (Optional)"}</option>
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {getStageName(s.name)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Floor */}
                <div>
                  <label className="font-bold text-ink-700 block mb-1.5">
                    {language === "te" ? "అంతస్తు" : "Floor"}
                  </label>
                  <select
                    value={floorId}
                    onChange={(e) => setFloorId(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
                  >
                    <option value="">{language === "te" ? "ఎంచుకోండి (ఐచ్ఛికం)" : "Select Floor (Optional)"}</option>
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Method & Invoice Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Payment Method */}
                <div>
                  <label className="font-bold text-ink-700 block mb-1.5">
                    {language === "te" ? "చెల్లింపు విధానం" : "Payment Method"}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.value} value={pm.value}>
                        {pm.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Invoice Number */}
                <div>
                  <label className="font-bold text-ink-700 block mb-1.5">
                    {language === "te" ? "ఇన్‌వాయిస్ / బిల్లు సంఖ్య" : "Invoice / Bill Number"}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-482"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bill Receipt Upload */}
              <div>
                <label className="font-bold text-ink-700 block mb-1.5">
                  {language === "te" ? "బిల్లు లేదా రసీదు ఫోటో" : "Bill / Receipt Attachment"}
                </label>
                <FileDropzone
                  name="receiptFile"
                  onFileSelect={(file) => setSelectedFile(file)}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-ink-700 block mb-1.5">
                  {language === "te" ? "గమనికలు" : "Notes"}
                </label>
                <textarea
                  rows={2}
                  placeholder={language === "te" ? "అదనపు వివరాలు..." : "Additional notes or remarks..."}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-paper-300 bg-white p-2.5 font-medium text-ink-900 placeholder:text-ink-400 focus:border-clay-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Step 4: Primary Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={pending || computedTotal <= 0}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-clay-600 hover:bg-clay-700 disabled:opacity-50 disabled:cursor-not-allowed py-4 px-6 text-sm sm:text-base font-bold text-white shadow-xs transition active:scale-[0.99]"
          >
            <Plus className="h-5 w-5 stroke-[2.5]" />
            <span>
              {pending
                ? (language === "te" ? "నమోదు అవుతోంది..." : "Saving Expense...")
                : expenseId
                ? (language === "te" ? "ఖర్చును నవీకరించు" : "Update Expense")
                : (language === "te" ? "ఖర్చును నమోదు చేయి" : "Save Expense")}
            </span>
          </button>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={language === "te" ? "ఈ ఖర్చును తొలగించాలా?" : "Delete Expense Record?"}
        description={
          language === "te"
            ? "మీరు ఖచ్చితంగా ఈ ఖర్చును శాశ్వతంగా తొలగించాలనుకుంటున్నారా?"
            : "Are you sure you want to permanently delete this expense record?"
        }
        confirmText={pending ? "Deleting..." : (language === "te" ? "శాశ్వతంగా తొలగించు" : "Delete Expense")}
        variant="danger"
      />
    </div>
  );
}
