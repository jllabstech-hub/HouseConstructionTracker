"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  HardHat,
  MoreHorizontal,
  Package,
  Plus,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { saveExpense } from "@/lib/actions/expenses";
import { uploadReceipt } from "@/lib/actions/receipts";
import { computeLabourAmount, computeMaterialAmount } from "@/lib/finance/aggregations";
import { formatINR, parseMoneyInput } from "@/lib/money";
import {
  CATEGORY_GROUP_ORDER,
  getLabourPreset,
  getMaterialPreset,
} from "@/lib/catalog/expense-presets";
import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import { Field, Select, TextInput } from "@/components/ui/fields";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string; groupName?: string; type?: string; phone?: string | null };
type ExpenseKind = "MATERIAL" | "LABOUR" | "SERVICE" | "EQUIPMENT" | "PROFESSIONAL" | "OTHER";

function grouped(options: Option[]) {
  const groups = new Map<string, Option[]>();
  for (const option of options) {
    const key = option.groupName ?? "Categories";
    groups.set(key, [...(groups.get(key) ?? []), option]);
  }
  return [...groups.entries()].sort(([a], [b]) => (CATEGORY_GROUP_ORDER[a] ?? 99) - (CATEGORY_GROUP_ORDER[b] ?? 99));
}

export function ExpenseForm({
  projectId,
  expenseId,
  initial,
  materials,
  labours,
  services,
  equipment,
  professionals,
  vendors,
  workers,
  stages,
  floors,
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

  // Success State for 1-tap fast workflows
  const [savedSuccess, setSavedSuccess] = useState<{ id: string; amount: number; title: string } | null>(null);

  // Primary Expense Kind: MATERIAL | LABOUR | OTHER
  const initialKind = (initial?.expenseType as ExpenseKind) ?? "MATERIAL";
  const [type, setType] = useState<ExpenseKind>(initialKind);

  // Material State
  const [materialCategory, setMaterialCategory] = useState<string>(initial?.materialCategoryId ?? materials[0]?.id ?? "");
  const [quantity, setQuantity] = useState<string>(initial?.quantity ?? "");
  const [rate, setRate] = useState<string>(initial?.rate ?? "");
  const [unit, setUnit] = useState<string>(initial?.unit ?? "bags");
  const [description, setDescription] = useState<string>(initial?.description ?? "");
  const [amount, setAmount] = useState<string>(initial?.amount ?? "");

  // Labour State
  const [labourCategory, setLabourCategory] = useState<string>(initial?.labourCategoryId ?? labours[0]?.id ?? "");
  const [calcMode, setCalcMode] = useState<"DAILY" | "CONTRACT">(
    initial?.calculationMode === "DAILY_WAGES" || (!initial?.calculationMode && !initial?.amount) ? "DAILY" : "CONTRACT"
  );
  const [dailyWorkers, setDailyWorkers] = useState<string>(initial?.dailyWorkers ?? "3");
  const [dailyDays, setDailyDays] = useState<string>(initial?.dailyDays ?? "1");
  const [dailyRate, setDailyRate] = useState<string>(initial?.rate ?? "900");
  const [contractAmount, setContractAmount] = useState<string>(initial?.amount ?? "");

  // Other State
  const [otherCategory, setOtherCategory] = useState<string>(
    initial?.serviceCategoryId ?? initial?.equipmentCategoryId ?? initial?.professionalCategoryId ?? services[0]?.id ?? ""
  );

  // Shared Form State
  const [date, setDate] = useState<string>(
    initial?.date ? initial.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [vendorId, setVendorId] = useState<string>(initial?.vendorId ?? "");
  const [workerId, setWorkerId] = useState<string>(initial?.workerId ?? "");
  const [stageId, setStageId] = useState<string>(initial?.constructionStageId ?? "");
  const [floorId, setFloorId] = useState<string>(initial?.floorId ?? "");
  const [paymentMethod, setPaymentMethod] = useState<string>(initial?.paymentMethod ?? "UPI");
  const [invoiceNumber, setInvoiceNumber] = useState<string>(initial?.invoiceNumber ?? "");
  const [notes, setNotes] = useState<string>(initial?.notes ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Grouped dropdowns
  const groupedMaterials = useMemo(() => grouped(materials), [materials]);
  const groupedLabours = useMemo(() => grouped(labours), [labours]);

  // Real-time calculated live total
  const computedTotal = useMemo(() => {
    if (type === "MATERIAL") {
      const q = parseMoneyInput(quantity);
      const r = parseMoneyInput(rate);
      const a = parseMoneyInput(amount);
      if (q && r) return Number(computeMaterialAmount({ quantity: q, rate: r }));
      if (a) return Number(a);
      return 0;
    }
    if (type === "LABOUR") {
      if (calcMode === "DAILY") {
        const w = Number(dailyWorkers) || 0;
        const d = Number(dailyDays) || 0;
        const r = parseMoneyInput(dailyRate);
        if (w && d && r) return Number(computeLabourAmount({ method: "DAILY_WAGE", numberOfWorkers: w, numberOfDays: d, rate: r }));
      }
      return Number(parseMoneyInput(contractAmount) ?? 0);
    }
    return Number(parseMoneyInput(amount) ?? 0);
  }, [type, quantity, rate, amount, calcMode, dailyWorkers, dailyDays, dailyRate, contractAmount]);

  const handleMaterialPreset = (catId: string) => {
    setMaterialCategory(catId);
    const catObj = materials.find((m) => m.id === catId);
    if (catObj) {
      const preset = getMaterialPreset(catObj.name);
      if (preset.defaultUnit) setUnit(preset.defaultUnit);
      if (!description) setDescription(catObj.name);
    }
  };

  const handleLabourPreset = (catId: string) => {
    setLabourCategory(catId);
    const catObj = labours.find((l) => l.id === catId);
    if (catObj && !description) {
      setDescription(catObj.name);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("projectId", projectId);
    formData.set("date", date);
    formData.set("expenseType", type);
    formData.set("paymentMethod", paymentMethod);
    if (stageId) formData.set("constructionStageId", stageId);
    if (floorId) formData.set("floorId", floorId);
    if (invoiceNumber) formData.set("invoiceNumber", invoiceNumber);
    if (notes) formData.set("notes", notes);

    if (type === "MATERIAL") {
      formData.set("materialCategoryId", materialCategory);
      formData.set("description", description || materials.find((m) => m.id === materialCategory)?.name || "Material");
      if (quantity) formData.set("quantity", quantity);
      if (unit) formData.set("unit", unit);
      if (rate) formData.set("rate", rate);
      if (computedTotal > 0) formData.set("amount", String(computedTotal));
      if (vendorId) formData.set("vendorId", vendorId);
    } else if (type === "LABOUR") {
      formData.set("labourCategoryId", labourCategory);
      formData.set("description", description || labours.find((l) => l.id === labourCategory)?.name || "Labour");
      formData.set("calculationMode", calcMode === "DAILY" ? "DAILY_WAGES" : "LUMP_SUM");
      if (calcMode === "DAILY") {
        if (dailyWorkers) formData.set("dailyWorkers", dailyWorkers);
        if (dailyDays) formData.set("dailyDays", dailyDays);
        if (dailyRate) formData.set("rate", dailyRate);
        if (computedTotal > 0) formData.set("amount", String(computedTotal));
      } else {
        if (contractAmount) formData.set("amount", contractAmount);
      }
      if (workerId) formData.set("workerId", workerId);
    } else {
      formData.set("serviceCategoryId", otherCategory);
      formData.set("description", description || "Service / Equipment");
      if (amount) formData.set("amount", amount);
      if (vendorId) formData.set("vendorId", vendorId);
    }

    start(async () => {
      try {
        const result = await saveExpense(formData, expenseId);
        if (result && "error" in result && result.error) {
          setError(typeof result.error === "string" ? result.error : "Failed to save expense");
          return;
        }

        const savedId = (result as { id?: string })?.id ?? expenseId;

        // Upload receipt if attached
        if (savedId && selectedFile) {
          const receiptForm = new FormData();
          receiptForm.set("file", selectedFile);
          await uploadReceipt(savedId, receiptForm);
        }

        if (expenseId) {
          router.push(`/expenses/${expenseId}`);
          router.refresh();
        } else {
          setSavedSuccess({
            id: savedId ?? "",
            amount: computedTotal,
            title: description || (type === "MATERIAL" ? "Material" : type === "LABOUR" ? "Labour" : "Other"),
          });
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      }
    });
  };

  // 1-Tap Reset for Fast Continuous Entry
  const handleAddAnother = () => {
    setSavedSuccess(null);
    setDescription("");
    setQuantity("");
    setRate("");
    setAmount("");
    setContractAmount("");
    setSelectedFile(null);
    setError(null);
  };

  // Post-Save Confirmation View
  if (savedSuccess) {
    return (
      <div className="max-w-xl mx-auto rounded-3xl border border-paper-200 bg-white p-8 shadow-xs text-center space-y-6">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900">
            {language === "te" ? "ఖర్చు విజయవంతంగా నమోదైంది!" : "Expense Saved Successfully!"}
          </h2>
          <p className="text-sm font-bold text-clay-700 mt-1">
            {formatINR(savedSuccess.amount)} · {savedSuccess.title}
          </p>
          <p className="text-xs text-ink-500 mt-1">
            {language === "te" ? "మీ ఇంటి నిర్మాణ లెక్కల పుస్తకంలో నమోదు చేయబడింది." : "Recorded in your house construction ledger."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={handleAddAnother}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-clay-600 px-5 py-3 text-sm font-bold text-white shadow-xs hover:bg-clay-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>{language === "te" ? "+ మరో ఖర్చు నమోదు చేయండి" : "+ Add Another Expense"}</span>
          </button>

          <Link
            href="/expenses"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-paper-300 bg-paper-50 px-5 py-3 text-sm font-bold text-ink-800 hover:bg-paper-100 transition"
          >
            <Receipt className="h-4 w-4" />
            <span>{language === "te" ? "ఖర్చుల జాబితా చూడండి" : "View Expenses"}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-paper-200/80 pb-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-900">
            {expenseId ? (language === "te" ? "ఖర్చును సవరించండి" : "Edit Expense") : (language === "te" ? "ఖర్చు నమోదు" : "Add Expense")}
          </h1>
          <p className="text-xs text-ink-500 mt-0.5">
            {language === "te" ? "సామాగ్రి కొనుగోలు లేదా కూలీల చెల్లింపును నమోదు చేయండి" : "Record a material purchase or labour wage payment"}
          </p>
        </div>

        <Link
          href="/expenses"
          className="inline-flex items-center gap-1 text-xs font-bold text-ink-600 hover:text-ink-900 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{language === "te" ? "వెనుకకు" : "Back"}</span>
        </Link>
      </div>

      {/* STEP 1: What are you recording? (Segmented Choice) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-ink-700 block">
          {language === "te" ? "1. మీరు ఏమి నమోదు చేస్తున్నారు?" : "1. What are you recording?"}
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setType("MATERIAL")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-2xl p-3 text-xs sm:text-sm font-bold border transition active:scale-98",
              type === "MATERIAL"
                ? "border-clay-600 bg-clay-600 text-white shadow-xs"
                : "border-paper-200 bg-white text-ink-700 hover:bg-paper-50"
            )}
          >
            <Package className="h-4 w-4" />
            <span>{language === "te" ? "సామాగ్రి" : "Material"}</span>
          </button>

          <button
            type="button"
            onClick={() => setType("LABOUR")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-2xl p-3 text-xs sm:text-sm font-bold border transition active:scale-98",
              type === "LABOUR"
                ? "border-emerald-700 bg-emerald-700 text-white shadow-xs"
                : "border-paper-200 bg-white text-ink-700 hover:bg-paper-50"
            )}
          >
            <HardHat className="h-4 w-4" />
            <span>{language === "te" ? "కూలీలు" : "Labour"}</span>
          </button>

          <button
            type="button"
            onClick={() => setType("SERVICE")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-2xl p-3 text-xs sm:text-sm font-bold border transition active:scale-98",
              type !== "MATERIAL" && type !== "LABOUR"
                ? "border-ink-800 bg-ink-800 text-white shadow-xs"
                : "border-paper-200 bg-white text-ink-700 hover:bg-paper-50"
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span>{language === "te" ? "ఇతర ఖర్చులు" : "Other"}</span>
          </button>
        </div>
      </div>

      {/* STEP 2: Adaptive Form Fields */}
      <div className="rounded-2xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        {/* Date Field */}
        <div>
          <label className="text-xs font-bold text-ink-700 block mb-1">
            {language === "te" ? "తేదీ" : "Date"}
          </label>
          <input
            type="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            required
          />
        </div>

        {/* 2A. MATERIAL FORM */}
        {type === "MATERIAL" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1">
                {language === "te" ? "సామాగ్రి వర్గం" : "Material Category"}
              </label>
              <select
                value={materialCategory}
                onChange={(e) => handleMaterialPreset(e.target.value)}
                className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
              >
                {groupedMaterials.map(([group, opts]) => (
                  <optgroup key={group} label={group}>
                    {opts.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1">
                {language === "te" ? "సామాగ్రి వివరాలు" : "Description"}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === "te" ? "ఉదా: అల్ట్రాటెక్ 53 గ్రేడ్ సిమెంట్ 50 బస్తాలు" : "e.g. UltraTech 53 OPC Cement"}
                className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
              />
            </div>

            {/* Quantity, Unit, Rate */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-xs font-bold text-ink-700 block mb-1">
                  {language === "te" ? "పరిమాణం" : "Quantity"}
                </label>
                <input
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="50"
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink-700 block mb-1">
                  {language === "te" ? "కొలత ప్రమాణం" : "Unit"}
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
                >
                  <option value="bags">Bags / బస్తాలు</option>
                  <option value="kg">Kg / కిలోలు</option>
                  <option value="tons">Tons / టన్నులు</option>
                  <option value="loads">Loads / లోడ్లు</option>
                  <option value="sqft">Sqft / చ.అడుగులు</option>
                  <option value="cum">Cum / ఘ.మీటర్లు</option>
                  <option value="nos">Nos / సంఖ్య</option>
                  <option value="litres">Litres / లీటర్లు</option>
                  <option value="coils">Coils / కాయిల్స్</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-ink-700 block mb-1">
                  {language === "te" ? "రేటు (₹)" : "Rate (₹)"}
                </label>
                <input
                  type="number"
                  step="any"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="420"
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Vendor / Shop Picker */}
            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1">
                {language === "te" ? "దుకాణం / సప్లయర్" : "Vendor / Supplier"}
              </label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
              >
                <option value="">{language === "te" ? "ఎంచుకోండి (ఐచ్ఛికం)" : "Select Vendor (Optional)"}</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.phone ? `(${v.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 2B. LABOUR FORM */}
        {type === "LABOUR" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1">
                {language === "te" ? "కూలీ పని రకం" : "Labour Trade"}
              </label>
              <select
                value={labourCategory}
                onChange={(e) => handleLabourPreset(e.target.value)}
                className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
              >
                {groupedLabours.map(([group, opts]) => (
                  <optgroup key={group} label={group}>
                    {opts.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Calculation Mode Toggle: Daily Wages vs Fixed Contract */}
            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1.5">
                {language === "te" ? "లెక్కించే విధానం" : "Calculation Method"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCalcMode("DAILY")}
                  className={cn(
                    "rounded-xl p-2.5 text-xs font-bold border transition",
                    calcMode === "DAILY"
                      ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                      : "border-paper-200 bg-paper-50 text-ink-600"
                  )}
                >
                  {language === "te" ? "రోజువారీ కూలీ (Daily Wage)" : "Daily Wage (Workers × Days × Rate)"}
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMode("CONTRACT")}
                  className={cn(
                    "rounded-xl p-2.5 text-xs font-bold border transition",
                    calcMode === "CONTRACT"
                      ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                      : "border-paper-200 bg-paper-50 text-ink-600"
                  )}
                >
                  {language === "te" ? "ఫిక్స్‌డ్ కాంట్రాక్ట్ (Fixed Contract)" : "Fixed Contract Amount"}
                </button>
              </div>
            </div>

            {/* Daily Wages Inputs */}
            {calcMode === "DAILY" ? (
              <div className="grid grid-cols-3 gap-2.5 bg-paper-50/70 p-3 rounded-xl border border-paper-200/80">
                <div>
                  <label className="text-xs font-bold text-ink-700 block mb-1">
                    {language === "te" ? "వర్కర్ల సంఖ్య" : "Workers"}
                  </label>
                  <input
                    type="number"
                    value={dailyWorkers}
                    onChange={(e) => setDailyWorkers(e.target.value)}
                    placeholder="4"
                    className="w-full rounded-xl border border-paper-300 bg-white p-2 text-xs sm:text-sm font-medium text-ink-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-700 block mb-1">
                    {language === "te" ? "రోజులు" : "Days"}
                  </label>
                  <input
                    type="number"
                    value={dailyDays}
                    onChange={(e) => setDailyDays(e.target.value)}
                    placeholder="2"
                    className="w-full rounded-xl border border-paper-300 bg-white p-2 text-xs sm:text-sm font-medium text-ink-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-700 block mb-1">
                    {language === "te" ? "రోజు కూలీ (₹)" : "Daily Rate (₹)"}
                  </label>
                  <input
                    type="number"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    placeholder="900"
                    className="w-full rounded-xl border border-paper-300 bg-white p-2 text-xs sm:text-sm font-medium text-ink-900"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-ink-700 block mb-1">
                  {language === "te" ? "కాంట్రాక్ట్ మొత్తం (₹)" : "Contract Amount (₹)"}
                </label>
                <input
                  type="number"
                  value={contractAmount}
                  onChange={(e) => setContractAmount(e.target.value)}
                  placeholder="25000"
                  className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs sm:text-sm font-medium text-ink-900"
                />
              </div>
            )}

            {/* Worker / Mason Picker */}
            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1">
                {language === "te" ? "మేస్త్రీ / వర్కర్ పేరు" : "Worker / Mason Name"}
              </label>
              <select
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
              >
                <option value="">{language === "te" ? "ఎంచుకోండి (ఐచ్ఛికం)" : "Select Worker (Optional)"}</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.phone ? `(${w.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 2C. OTHER FORM (Services, Equipment, Professional) */}
        {type !== "MATERIAL" && type !== "LABOUR" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1">
                {language === "te" ? "ఖర్చు రకం" : "Service / Machinery Type"}
              </label>
              <select
                value={otherCategory}
                onChange={(e) => setOtherCategory(e.target.value)}
                className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs sm:text-sm font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
              >
                <optgroup label="Services & Machinery">
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Equipment">
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Professional Fees">
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-ink-700 block mb-1">
                {language === "te" ? "మొత్తం ఖర్చు (₹)" : "Total Amount (₹)"}
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="15000"
                className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs sm:text-sm font-medium text-ink-900"
                required
              />
            </div>
          </div>
        )}

        {/* Stage & Payment Method */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-paper-100">
          <div>
            <label className="text-xs font-bold text-ink-700 block mb-1">
              {language === "te" ? "నిర్మాణ దశ" : "Construction Stage"}
            </label>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            >
              <option value="">{language === "te" ? "ఎంచుకోండి (ఐచ్ఛికం)" : "Select Stage"}</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {getStageName(s.name)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-ink-700 block mb-1">
              {language === "te" ? "చెల్లింపు విధానం" : "Payment Method"}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-xl border border-paper-300 bg-paper-50 p-2.5 text-xs font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
            >
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="CASH">Cash / నగదు</option>
              <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
        </div>

        {/* Receipt / Bill Photo Dropzone */}
        <div className="pt-2">
          <label className="text-xs font-bold text-ink-700 block mb-1">
            {language === "te" ? "రశీదు / బిల్లు ఫోటో (ఐచ్ఛికం)" : "Bill / Receipt Photo (Optional)"}
          </label>
          <FileDropzone
            name="receipt"
            onFileSelect={setSelectedFile}
            accept="image/jpeg,image/png,image/webp,application/pdf"
            maxSizeBytes={8 * 1024 * 1024}
            helperText={language === "te" ? "బిల్లు ఫోటో లేదా PDF అప్‌లోడ్ చేయండి" : "Drag and drop bill receipt or browse"}
          />
        </div>

        {/* Optional "More details" Accordion */}
        <details className="rounded-xl border border-paper-200 bg-paper-50/50">
          <summary className="flex cursor-pointer items-center justify-between p-3 text-xs font-bold text-ink-700 select-none">
            <span>{language === "te" ? "+ మరిన్ని వివరాలు (అంతస్తు, ఇన్వాయిస్ నం, నోట్స్)" : "+ More Details (Floor, Invoice #, Notes)"}</span>
            <ChevronDown className="h-4 w-4 text-ink-400" />
          </summary>
          <div className="p-3 pt-0 space-y-3 text-xs border-t border-paper-200/60 mt-2">
            <div>
              <label className="font-semibold text-ink-700 block mb-1">
                {language === "te" ? "అంతస్తు" : "Floor"}
              </label>
              <select
                value={floorId}
                onChange={(e) => setFloorId(e.target.value)}
                className="w-full rounded-xl border border-paper-300 bg-white p-2 text-xs font-medium text-ink-900"
              >
                <option value="">{language === "te" ? "అంతస్తు ఎంచుకోండి (ఐచ్ఛికం)" : "Select Floor (Optional)"}</option>
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-ink-700 block mb-1">
                {language === "te" ? "ఇన్వాయిస్ / బిల్లు నంబర్" : "Invoice / Bill Number"}
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2026-081"
                className="w-full rounded-xl border border-paper-300 bg-white p-2 text-xs font-medium text-ink-900"
              />
            </div>

            <div>
              <label className="font-semibold text-ink-700 block mb-1">
                {language === "te" ? "అదనపు నోట్స్" : "Notes"}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="w-full rounded-xl border border-paper-300 bg-white p-2 text-xs font-medium text-ink-900"
              />
            </div>
          </div>
        </details>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Floating Bottom Bar: Total & Save Action */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-paper-200 bg-white/98 px-4 py-3 backdrop-blur lg:left-[230px] shadow-lg">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase font-bold text-ink-500">
              {language === "te" ? "మొత్తం ఖర్చు" : "Calculated Total"}
            </p>
            <p className="font-display text-xl sm:text-2xl font-bold text-clay-700">
              {formatINR(computedTotal)}
            </p>
          </div>

          <Button
            type="submit"
            disabled={pending || computedTotal <= 0}
            className="min-w-36 rounded-xl bg-clay-600 px-6 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-clay-700 transition"
          >
            {pending
              ? (language === "te" ? "భద్రపరుస్తోంది..." : "Saving...")
              : expenseId
              ? (language === "te" ? "సవరణలు భద్రపరచండి" : "Save Changes")
              : (language === "te" ? "ఖర్చు భద్రపరచండి" : "Save Expense")}
          </Button>
        </div>
      </div>
    </form>
  );
}
