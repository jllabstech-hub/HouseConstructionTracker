"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveCategoryBudget,
  saveTypeBudget,
  updateProjectBudget,
  deleteCategoryBudget,
} from "@/lib/actions/budget";
import { formatINR, formatINRCompact } from "@/lib/money";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";
import {
  Building2,
  Layers,
  Tag,
  CheckCircle2,
  Trash2,
  Sparkles,
  TrendingUp,
  HardHat,
  Truck,
  Wrench,
  UserCheck,
  MoreHorizontal,
} from "lucide-react";

type CategoryOption = { id: string; name: string; groupName?: string | null };
type TypeBudgetItem = { id: string; expenseType: string; amount: number };
type CategoryBudgetItem = { id: string; expenseType: string; name: string; amount: number };

const EXPENSE_TYPES = [
  { value: "MATERIAL", labelEn: "Material", labelTe: "సామాగ్రి (Material)", icon: Layers, color: "text-blue-700 bg-blue-50 border-blue-200" },
  { value: "LABOUR", labelEn: "Labour", labelTe: "కూలీలు (Labour)", icon: HardHat, color: "text-amber-800 bg-amber-50 border-amber-200" },
  { value: "SERVICE", labelEn: "Service & Transport", labelTe: "సర్వీస్ & రవాణా", icon: Truck, color: "text-purple-700 bg-purple-50 border-purple-200" },
  { value: "EQUIPMENT", labelEn: "Machinery / Equipment", labelTe: "మిషనరీ & టూల్స్", icon: Wrench, color: "text-cyan-700 bg-cyan-50 border-cyan-200" },
  { value: "PROFESSIONAL", labelEn: "Professional / Architect", labelTe: "ఆర్కిటెక్ట్ & ఇంజనీర్", icon: UserCheck, color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  { value: "OTHER", labelEn: "Other / Misc", labelTe: "ఇతర ఖర్చులు", icon: MoreHorizontal, color: "text-stone-700 bg-stone-100 border-stone-200" },
] as const;

export function BudgetEditor({
  projectId,
  currentTotal = "0",
  materials = [],
  labours = [],
  typeBudgets = [],
  categoryBudgets = [],
}: {
  projectId: string;
  currentTotal: string;
  materials?: CategoryOption[];
  labours?: CategoryOption[];
  typeBudgets?: TypeBudgetItem[];
  categoryBudgets?: CategoryBudgetItem[];
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const [pending, start] = useTransition();

  const [activeTab, setActiveTab] = useState<"TOTAL" | "TYPE" | "CATEGORY">("TOTAL");
  const [totalAmount, setTotalAmount] = useState(currentTotal);
  const [selectedType, setSelectedType] = useState<string>("MATERIAL");
  const [typeAmount, setTypeAmount] = useState("");
  const [categoryType, setCategoryType] = useState<"MATERIAL" | "LABOUR">("MATERIAL");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categoryAmount, setCategoryAmount] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const totalBudgetNum = Number(totalAmount) || Number(currentTotal) || 0;

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleTotalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      await updateProjectBudget(projectId, totalAmount);
      showSuccess(language === "te" ? "మొత్తం బడ్జెట్ నవీకరించబడింది!" : "Total project budget updated!");
      router.refresh();
    });
  };

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      await saveTypeBudget(projectId, {
        expenseType: selectedType,
        amount: typeAmount,
      });
      setTypeAmount("");
      showSuccess(language === "te" ? `${selectedType} బడ్జెట్ సేవ్ అయింది!` : `${selectedType} allocation saved!`);
      router.refresh();
    });
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) return;
    start(async () => {
      await saveCategoryBudget(projectId, {
        expenseType: categoryType,
        categoryId: selectedCategoryId,
        amount: categoryAmount,
      });
      setCategoryAmount("");
      showSuccess(language === "te" ? "వర్గం బడ్జెట్ పరిమితి సేవ్ అయింది!" : "Category budget limit saved!");
      router.refresh();
    });
  };

  const activeCategories = categoryType === "MATERIAL" ? materials : labours;

  return (
    <div className="space-y-5">
      {/* 1. Clean Segmented Tabs Header */}
      <div className="flex items-center rounded-2xl bg-paper-100 p-1 border border-paper-200">
        <button
          type="button"
          onClick={() => setActiveTab("TOTAL")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition active:scale-98",
            activeTab === "TOTAL"
              ? "bg-white text-stone-900 shadow-xs"
              : "text-stone-600 hover:text-stone-900"
          )}
        >
          <Building2 className="h-3.5 w-3.5 text-clay-600" />
          <span>{language === "te" ? "మొత్తం బడ్జెట్" : "1. Total Budget"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TYPE")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition active:scale-98",
            activeTab === "TYPE"
              ? "bg-white text-stone-900 shadow-xs"
              : "text-stone-600 hover:text-stone-900"
          )}
        >
          <Layers className="h-3.5 w-3.5 text-clay-600" />
          <span>{language === "te" ? "రకం వారీగా" : "2. By Expense Type"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("CATEGORY")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition active:scale-98",
            activeTab === "CATEGORY"
              ? "bg-white text-stone-900 shadow-xs"
              : "text-stone-600 hover:text-stone-900"
          )}
        >
          <Tag className="h-3.5 w-3.5 text-clay-600" />
          <span>{language === "te" ? "వర్గం పరిమితి" : "3. By Category"}</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. TAB 1: Total Overall Budget */}
      {activeTab === "TOTAL" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="rounded-2xl border border-paper-200 bg-white p-5 space-y-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clay-50 text-clay-700 border border-clay-100">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-stone-900">
                  {language === "te" ? "మొత్తం ప్రాజెక్ట్ బడ్జెట్" : "Overall Project Budget"}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                  {language === "te"
                    ? "ఇంటి నిర్మాణానికి మీరు కేటాయించిన మొత్తం బడ్జెట్ లక్ష్యం. ఇది మొత్తం ఖర్చులను పర్యవేక్షించడానికి ప్రామాణికంగా పనిచేస్తుంది."
                    : "The master planned ceiling for your entire house construction. This benchmarks all your material and labour spending."}
                </p>
              </div>
            </div>

            <form onSubmit={handleTotalSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  {language === "te" ? "మొత్తం బడ్జెట్ మొత్తం (₹)" : "Total Budget Amount (₹)"}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-stone-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="e.g. 5000000"
                    className="w-full rounded-xl border border-paper-300 bg-paper-50/60 py-2.5 pl-8 pr-4 text-base font-bold text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                  />
                </div>
                {Number(totalAmount) > 0 && (
                  <p className="text-xs font-semibold text-clay-700 mt-1 pl-1">
                    {formatINR(Number(totalAmount))} ({formatINRCompact(Number(totalAmount))})
                  </p>
                )}
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[2500000, 3500000, 5000000, 7500000, 10000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTotalAmount(amt.toString())}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-xs font-semibold transition active:scale-95",
                        Number(totalAmount) === amt
                          ? "border-clay-500 bg-clay-50 text-clay-800 font-bold"
                          : "border-paper-200 bg-paper-50 text-stone-700 hover:bg-paper-100"
                      )}
                    >
                      {formatINRCompact(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-paper-100">
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-xl bg-clay-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-clay-700 active:scale-98 transition disabled:opacity-50"
                >
                  {pending ? "Saving..." : language === "te" ? "బడ్జెట్ భద్రపరచండి" : "Save Total Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. TAB 2: Expense Type Budget Allocation */}
      {activeTab === "TYPE" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="rounded-2xl border border-paper-200 bg-white p-5 space-y-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-stone-900">
                  {language === "te" ? "ఖర్చు రకం వారీగా కేటాయింపు" : "Expense-Type Budget Allocation"}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                  {language === "te"
                    ? "సామాగ్రి కొనుగోళ్లు (Material), కూలీల చెల్లింపులు (Labour), మరియు యంత్రాల ఖర్చుల కోసం విడివిడిగా పరిమితులను నిర్ణయించండి."
                    : "Separate allocations for Material purchases, Labour wages, and machinery/services."}
                </p>
              </div>
            </div>

            <form onSubmit={handleTypeSubmit} className="space-y-3 pt-2">
              {/* Type Grid Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  {language === "te" ? "ఖర్చు రకం ఎంచుకోండి" : "Select Expense Type"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPENSE_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setSelectedType(type.value)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border p-2.5 text-left transition active:scale-98",
                          isSelected
                            ? "border-clay-500 bg-clay-50/80 text-clay-950 font-bold ring-1 ring-clay-400"
                            : "border-paper-200 bg-paper-50/60 text-stone-700 hover:bg-paper-100"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-clay-700" : "text-stone-400")} />
                        <span className="text-xs truncate">{language === "te" ? type.labelTe : type.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  {selectedType} {language === "te" ? "బడ్జెట్ లక్ష్యం (₹)" : "Budget Target (₹)"}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-stone-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={typeAmount}
                    onChange={(e) => setTypeAmount(e.target.value)}
                    placeholder="e.g. 2500000"
                    className="w-full rounded-xl border border-paper-300 bg-paper-50/60 py-2.5 pl-8 pr-4 text-sm font-bold text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                  />
                </div>
                {Number(typeAmount) > 0 && (
                  <p className="text-xs font-semibold text-clay-700 mt-1 pl-1">
                    {formatINR(Number(typeAmount))} ({formatINRCompact(Number(typeAmount))})
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-paper-100">
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-xl bg-clay-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-clay-700 active:scale-98 transition disabled:opacity-50"
                >
                  {pending ? "Saving..." : language === "te" ? "కేటాయింపు భద్రపరచండి" : `Save ${selectedType} Budget`}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Type Allocations List */}
          {typeBudgets.length > 0 && (
            <div className="rounded-2xl border border-paper-200 bg-paper-50 p-4 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                {language === "te" ? "ప్రస్తుత రకం కేటాయింపులు" : "Current Type Allocations"}
              </span>
              <div className="space-y-1.5">
                {typeBudgets.map((b) => (
                  <div key={b.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-paper-200 text-xs">
                    <span className="font-bold text-stone-800">{b.expenseType}</span>
                    <span className="font-bold text-clay-800">{formatINR(b.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 3: Category Budget Limits */}
      {activeTab === "CATEGORY" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="rounded-2xl border border-paper-200 bg-white p-5 space-y-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800 border border-amber-100">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-stone-900">
                  {language === "te" ? "నిర్దిష్ట వర్గం బడ్జెట్ పరిమితి" : "Category Spending Limits"}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                  {language === "te"
                    ? "సిమెంట్, స్టీల్, ఇటుకలు, మేస్త్రీ కూలీలు వంటి నిర్దిష్ట అంశాలకు గరిష్ట బడ్జెట్ పరిమితులను విధించండి."
                    : "Set targeted spending caps for key materials like Cement, Steel, Sand, or specific labour trades."}
                </p>
              </div>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-3 pt-2">
              {/* Type Toggle: Material vs Labour */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  {language === "te" ? "వర్గ రకం" : "Category Group"}
                </label>
                <div className="flex rounded-xl bg-paper-100 p-1 border border-paper-200">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryType("MATERIAL");
                      setSelectedCategoryId("");
                    }}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-bold rounded-lg transition",
                      categoryType === "MATERIAL" ? "bg-white text-stone-900 shadow-2xs" : "text-stone-600 hover:text-stone-900"
                    )}
                  >
                    {language === "te" ? "సామాగ్రి (Materials)" : "Material Categories"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryType("LABOUR");
                      setSelectedCategoryId("");
                    }}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-bold rounded-lg transition",
                      categoryType === "LABOUR" ? "bg-white text-stone-900 shadow-2xs" : "text-stone-600 hover:text-stone-900"
                    )}
                  >
                    {language === "te" ? "కూలీలు (Labour)" : "Labour Categories"}
                  </button>
                </div>
              </div>

              {/* Category Select */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  {language === "te" ? "వర్గం ఎంచుకోండి" : "Select Category"} <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-paper-300 bg-paper-50/60 px-3.5 py-2.5 text-xs font-bold text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                >
                  <option value="">-- {language === "te" ? "వర్గం ఎంచుకోండి" : "Choose a category"} --</option>
                  {activeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.groupName ? `(${c.groupName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  {language === "te" ? "బడ్జెట్ పరిమితి మొత్తం (₹)" : "Maximum Budget Target (₹)"}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-stone-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={categoryAmount}
                    onChange={(e) => setCategoryAmount(e.target.value)}
                    placeholder="e.g. 350000"
                    className="w-full rounded-xl border border-paper-300 bg-paper-50/60 py-2.5 pl-8 pr-4 text-sm font-bold text-stone-900 focus:border-clay-500 focus:bg-white focus:outline-none"
                  />
                </div>
                {Number(categoryAmount) > 0 && (
                  <p className="text-xs font-semibold text-clay-700 mt-1 pl-1">
                    {formatINR(Number(categoryAmount))} ({formatINRCompact(Number(categoryAmount))})
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-paper-100">
                <button
                  type="submit"
                  disabled={pending || !selectedCategoryId}
                  className="w-full rounded-xl bg-clay-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-clay-700 active:scale-98 transition disabled:opacity-50"
                >
                  {pending ? "Saving..." : language === "te" ? "వర్గం పరిమితిని సేవ్ చేయండి" : "Save Category Limit"}
                </button>
              </div>
            </form>
          </div>

          {/* Active Category Budgets List */}
          {categoryBudgets.length > 0 && (
            <div className="rounded-2xl border border-paper-200 bg-paper-50 p-4 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                {language === "te" ? "ప్రస్తుత వర్గం పరిమితులు" : "Current Category Spending Caps"}
              </span>
              <div className="space-y-1.5">
                {categoryBudgets.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-paper-200 text-xs">
                    <div>
                      <span className="font-bold text-stone-800 block">{cat.name}</span>
                      <span className="text-[10px] font-semibold text-stone-400 uppercase">{cat.expenseType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-clay-800">{formatINR(cat.amount)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          start(async () => {
                            await deleteCategoryBudget(projectId, cat.id);
                            router.refresh();
                          });
                        }}
                        className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                        title="Remove category budget"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
