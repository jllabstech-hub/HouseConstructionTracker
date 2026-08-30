"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  HardHat,
  Package,
  Plus,
  Trash2,
  Share2,
  Users,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import {
  recordDailySiteLog,
  deleteDailySiteLog,
  type DailySiteLogEntry,
  type DailySiteLogsSummary,
} from "@/lib/actions/daily-logs";
import { formatINR } from "@/lib/money";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Option = { id: string; name: string };

export function DailyLogManager({
  projectId,
  initialLogs,
  initialSummary,
  stages = [],
  floors = [],
}: {
  projectId: string;
  initialLogs: DailySiteLogEntry[];
  initialSummary: DailySiteLogsSummary;
  stages: Option[];
  floors: Option[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [stageId, setStageId] = useState<string>("");
  const [floorId, setFloorId] = useState<string>("");
  
  // Labour Fields
  const [mestriCount, setMestriCount] = useState<string>("2");
  const [mestriRate, setMestriRate] = useState<string>("950");
  const [helperCount, setHelperCount] = useState<string>("4");
  const [helperRate, setHelperRate] = useState<string>("650");
  
  // Cement Fields
  const [cementBags, setCementBags] = useState<string>("15");
  const [cementBrand, setCementBrand] = useState<string>("UltraTech 53 Grade");
  const [cementRate, setCementRate] = useState<string>("380");

  // Notes & Description
  const [workDescription, setWorkDescription] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");

  // Filtering
  const [filterStage, setFilterStage] = useState<string>("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Live Calculations
  const mCount = Math.max(0, Number(mestriCount) || 0);
  const mRate = Math.max(0, Number(mestriRate) || 0);
  const mTotal = mCount * mRate;

  const hCount = Math.max(0, Number(helperCount) || 0);
  const hRate = Math.max(0, Number(helperRate) || 0);
  const hTotal = hCount * hRate;

  const labourTotal = mTotal + hTotal;

  const cBags = Math.max(0, Number(cementBags) || 0);
  const cRate = Math.max(0, Number(cementRate) || 0);
  const cementTotal = cBags * cRate;

  const combinedDayTotal = labourTotal + cementTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (labourTotal <= 0 && cBags <= 0) {
      setError("Please record either labour worker count/wages or cement bags used.");
      return;
    }

    start(async () => {
      try {
        const res = await recordDailySiteLog({
          projectId,
          date,
          stageId: stageId || undefined,
          floorId: floorId || undefined,
          mestriCount: mCount,
          mestriRate: mRate,
          helperCount: hCount,
          helperRate: hRate,
          cementBags: cBags,
          cementBrand,
          cementRate: cRate,
          workDescription:
            workDescription.trim() ||
            `Site Work (${mCount} Mestri, ${hCount} Helpers${cBags > 0 ? `, ${cBags} bags cement` : ""})`,
          notes: notes.trim() || undefined,
          paymentMethod,
        });

        if ("error" in res && res.error) {
          setError(res.error);
          return;
        }

        setSuccessMsg(`Daily log for ${date} saved successfully!`);
        setWorkDescription("");
        setNotes("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to record daily site log");
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    start(async () => {
      await deleteDailySiteLog(projectId, deleteTargetId);
      setDeleteTargetId(null);
      router.refresh();
    });
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    if (!filterStage) return initialLogs;
    return initialLogs.filter((l) => l.stageId === filterStage);
  }, [initialLogs, filterStage]);

  // Share via WhatsApp / Copy
  const handleShareWhatsApp = (log: DailySiteLogEntry) => {
    const text = `*🏗️ House Construction Daily Site Log - ${log.date}*\n` +
      `*Stage:* ${log.stageName || "General"}\n` +
      `*Labour Breakdown:*\n` +
      `• Masons / Mestri: ${log.mestriCount} @ ₹${log.mestriRate} = ${formatINR(log.mestriTotal)}\n` +
      `• Helpers / Mazdoors: ${log.helperCount} @ ₹${log.helperRate} = ${formatINR(log.helperTotal)}\n` +
      `• *Total Daily Wages:* ${formatINR(log.totalLabourCost)}\n` +
      (log.cementBags > 0 ? `\n*Cement Used:* ${log.cementBags} bags (${log.cementBrand}) = ${formatINR(log.totalCementCost)}\n` : "") +
      `\n*Total Day Expenditure:* ${formatINR(log.totalDayCost)}\n` +
      (log.workDescription ? `*Work Done:* ${log.workDescription}\n` : "") +
      (log.notes ? `*Notes:* ${log.notes}` : "");

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-paper-200/80 pb-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-ink-900 leading-tight">
            Daily Labour & Cement Log
          </h1>
          <p className="text-xs text-ink-500 mt-0.5">
            Day-wise muster roll tracking for Mestri, Helpers, wage payouts, and cement bag consumption
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-clay-50 border border-clay-200 px-3 py-1.5 text-xs font-bold text-clay-800 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-clay-600" />
            <span>{initialSummary.daysLoggedCount} Days Logged</span>
          </span>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-ink-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mestri (Masons)</span>
            <HardHat className="h-4 w-4 text-amber-600" />
          </div>
          <p className="font-display text-xl sm:text-2xl font-bold text-ink-900">
            {initialSummary.totalMestriDays}{" "}
            <span className="text-xs font-medium text-ink-400">days</span>
          </p>
          <p className="text-[11px] text-ink-500">Total head mason work</p>
        </div>

        <div className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-ink-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Helpers (Mazdoor)</span>
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="font-display text-xl sm:text-2xl font-bold text-ink-900">
            {initialSummary.totalHelperDays}{" "}
            <span className="text-xs font-medium text-ink-400">days</span>
          </p>
          <p className="text-[11px] text-ink-500">Total helper work days</p>
        </div>

        <div className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-ink-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cement Consumed</span>
            <Package className="h-4 w-4 text-clay-600" />
          </div>
          <p className="font-display text-xl sm:text-2xl font-bold text-ink-900">
            {initialSummary.totalCementBags}{" "}
            <span className="text-xs font-medium text-ink-400">bags</span>
          </p>
          <p className="text-[11px] text-ink-500">{formatINR(initialSummary.totalCementSpent)} cement value</p>
        </div>

        <div className="rounded-2xl border border-paper-200 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-ink-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Wage Payout</span>
            <span className="text-xs font-bold text-clay-700">₹</span>
          </div>
          <p className="font-display text-xl sm:text-2xl font-bold text-clay-700">
            {formatINR(initialSummary.totalLabourSpent)}
          </p>
          <p className="text-[11px] text-ink-500">Labour wages paid</p>
        </div>
      </div>

      {/* Main 2-Column Responsive Section: Entry Form on Left + History on Right / Below */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Quick Entry Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-paper-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-clay-100 text-clay-700">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-ink-900">
                    Record Day-Wise Log
                  </h2>
                  <p className="text-[11px] text-ink-500">Log today&apos;s workers and cement used</p>
                </div>
              </div>

              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                1-Click Save
              </span>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date & Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-ink-700 block mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs font-semibold text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-700 block mb-1.5">
                    Construction Stage
                  </label>
                  <div className="relative">
                    <select
                      value={stageId}
                      onChange={(e) => setStageId(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-paper-300 bg-white p-2.5 pr-8 text-xs font-semibold text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs cursor-pointer"
                    >
                      <option value="">-- General / Masonry --</option>
                      {stages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                  </div>
                </div>
              </div>

              {/* MESTRI (Head Masons) */}
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <HardHat className="h-3.5 w-3.5 text-amber-700" />
                    <span>Mestri / Head Masons</span>
                  </span>
                  <span className="font-mono text-xs font-extrabold text-amber-900">
                    {formatINR(mTotal)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-ink-600 block mb-1">
                      Number of Mestri
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={mestriCount}
                      onChange={(e) => setMestriCount(e.target.value)}
                      placeholder="e.g. 2"
                      className="w-full rounded-xl border border-paper-300 bg-white p-2 text-xs font-semibold text-ink-900 focus:border-clay-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-ink-600 block mb-1">
                      Wage Rate (₹ / Day)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={mestriRate}
                      onChange={(e) => setMestriRate(e.target.value)}
                      placeholder="e.g. 950"
                      className="w-full rounded-xl border border-paper-300 bg-white p-2 text-xs font-semibold text-ink-900 focus:border-clay-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* HELPERS (Mazdoors) */}
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Helpers / Mazdoor</span>
                  </span>
                  <span className="font-mono text-xs font-extrabold text-emerald-900">
                    {formatINR(hTotal)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-ink-600 block mb-1">
                      Number of Helpers
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={helperCount}
                      onChange={(e) => setHelperCount(e.target.value)}
                      placeholder="e.g. 4"
                      className="w-full rounded-xl border border-paper-300 bg-white p-2 text-xs font-semibold text-ink-900 focus:border-clay-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-ink-600 block mb-1">
                      Wage Rate (₹ / Day)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={helperRate}
                      onChange={(e) => setHelperRate(e.target.value)}
                      placeholder="e.g. 650"
                      className="w-full rounded-xl border border-paper-300 bg-white p-2 text-xs font-semibold text-ink-900 focus:border-clay-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* CEMENT CONSUMPTION */}
              <div className="rounded-2xl border border-clay-200/80 bg-clay-50/40 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-clay-950 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-clay-700" />
                    <span>Cement Bags Used Today</span>
                  </span>
                  <span className="font-mono text-xs font-extrabold text-clay-900">
                    {formatINR(cementTotal)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-ink-600 block mb-1">
                      Bags Consumed
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cementBags}
                      onChange={(e) => setCementBags(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full rounded-xl border border-paper-300 bg-white p-2 text-xs font-semibold text-ink-900 focus:border-clay-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-ink-600 block mb-1">
                      Rate (₹ / Bag)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={cementRate}
                      onChange={(e) => setCementRate(e.target.value)}
                      placeholder="e.g. 380"
                      className="w-full rounded-xl border border-paper-300 bg-white p-2 text-xs font-semibold text-ink-900 focus:border-clay-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-600 block mb-1">
                    Cement Brand / Type
                  </label>
                  <input
                    type="text"
                    value={cementBrand}
                    onChange={(e) => setCementBrand(e.target.value)}
                    placeholder="e.g. UltraTech 53 Grade / ACC Suraksha"
                    className="w-full rounded-xl border border-paper-300 bg-white p-2 text-xs font-medium text-ink-900 focus:border-clay-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Work Description & Notes */}
              <div>
                <label className="text-xs font-bold text-ink-700 block mb-1.5">
                  Work Done Today / Notes
                </label>
                <input
                  type="text"
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder="e.g. 9-inch brick masonry living room wall, column curing..."
                  className="w-full rounded-xl border border-paper-300 bg-white p-2.5 text-xs font-medium text-ink-900 focus:border-clay-500 focus:outline-none shadow-2xs"
                />
              </div>

              {/* Floor & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {floors.length > 0 && (
                  <div>
                    <label className="text-[11px] font-bold text-ink-600 block mb-1">
                      Floor / Level
                    </label>
                    <select
                      value={floorId}
                      onChange={(e) => setFloorId(e.target.value)}
                      className="w-full rounded-xl border border-paper-300 bg-white p-2 text-xs font-semibold text-ink-900 focus:border-clay-500 focus:outline-none"
                    >
                      <option value="">-- General / Whole Site --</option>
                      {floors.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-[11px] font-bold text-ink-600 block mb-1">
                    Wage Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-paper-300 bg-white p-2 text-xs font-semibold text-ink-900 focus:border-clay-500 focus:outline-none"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Live Day Total Banner & Submit Button */}
              <div className="rounded-2xl bg-paper-100 p-3.5 border border-paper-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500 block">
                    Combined Day Total
                  </span>
                  <span className="font-display text-lg font-bold text-ink-900">
                    {formatINR(combinedDayTotal)}
                  </span>
                </div>
                <div className="text-right text-[11px] text-ink-500">
                  <p>Labour: {formatINR(labourTotal)}</p>
                  <p>Cement: {formatINR(cementTotal)}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={pending}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-clay-600 hover:bg-clay-700 py-3 px-4 text-xs font-bold text-white shadow-xs transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {pending ? "Saving Daily Log…" : "Save Daily Site Log"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Day-Wise Ledger / History (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl border border-paper-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-paper-100 pb-3">
              <div>
                <h2 className="font-display text-base font-bold text-ink-900">
                  Day-Wise Muster Roll & Cement Ledger
                </h2>
                <p className="text-[11px] text-ink-500">Complete day-by-day record of site operations</p>
              </div>

              {/* Stage Filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={filterStage}
                    onChange={(e) => setFilterStage(e.target.value)}
                    className="appearance-none rounded-xl border border-paper-300 bg-paper-50 px-3 py-1.5 pr-7 text-xs font-bold text-ink-800 focus:outline-none cursor-pointer"
                  >
                    <option value="">All Stages ({initialLogs.length})</option>
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                </div>
              </div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-paper-300 p-8 text-center space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-paper-100 text-ink-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="font-display text-sm font-bold text-ink-900">No Daily Logs Recorded Yet</h3>
                <p className="text-xs text-ink-500 max-w-sm mx-auto">
                  Use the quick form on the left to record daily mestri, helpers, wages, and cement bags.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-paper-200 bg-white p-4 shadow-2xs hover:border-paper-300 transition space-y-3"
                  >
                    {/* Row 1: Date + Stage + Total */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm font-bold text-ink-900">
                            {log.date}
                          </span>
                          <span className="rounded-md bg-clay-100 px-2 py-0.5 text-[10px] font-bold text-clay-800">
                            {log.stageName}
                          </span>
                        </div>
                        <p className="text-xs text-ink-600 mt-0.5">{log.workDescription}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-display text-base font-extrabold text-clay-700 block">
                          {formatINR(log.totalDayCost)}
                        </span>
                        <span className="text-[10px] text-ink-400 font-medium">Day Total</span>
                      </div>
                    </div>

                    {/* Row 2: Labour & Cement breakdown chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-paper-100">
                      <div className="rounded-xl bg-amber-50/60 p-2.5 border border-amber-100/80 space-y-1">
                        <div className="flex justify-between font-bold text-amber-950">
                          <span>Labour Wages</span>
                          <span>{formatINR(log.totalLabourCost)}</span>
                        </div>
                        <div className="text-[11px] text-amber-900 space-y-0.5">
                          <p>• {log.mestriCount} Mestri @ ₹{log.mestriRate} = {formatINR(log.mestriTotal)}</p>
                          <p>• {log.helperCount} Helpers @ ₹{log.helperRate} = {formatINR(log.helperTotal)}</p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-clay-50/60 p-2.5 border border-clay-100/80 space-y-1">
                        <div className="flex justify-between font-bold text-clay-950">
                          <span>Cement Used</span>
                          <span>{formatINR(log.totalCementCost)}</span>
                        </div>
                        <div className="text-[11px] text-clay-900 space-y-0.5">
                          {log.cementBags > 0 ? (
                            <>
                              <p>• {log.cementBags} Bags ({log.cementBrand})</p>
                              <p>• @ ₹{log.cementRate} / bag</p>
                            </>
                          ) : (
                            <p className="text-ink-400">No cement logged today</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Action Buttons (WhatsApp Share & Delete) */}
                    <div className="flex items-center justify-between pt-1 border-t border-paper-100 text-xs">
                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(log)}
                        className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Share on WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(log.id)}
                        className="rounded-lg p-1 text-ink-400 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                        title="Delete log entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Delete Daily Site Log?"
        description="Are you sure you want to delete this daily log entry? Associated labour and cement calculations will be adjusted automatically."
        confirmText={pending ? "Deleting..." : "Delete Log"}
        variant="danger"
      />
    </div>
  );
}
