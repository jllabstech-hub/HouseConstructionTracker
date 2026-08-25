"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BrickWall, Camera, ChevronDown, HardHat, X } from "lucide-react";
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

function Chips({
  items,
  value,
  onPick,
}: {
  items: Array<string | number>;
  value: string;
  onPick: (next: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.slice(0, 3).map((item) => {
        const raw = String(item);
        return (
          <button
            key={raw}
            type="button"
            onClick={() => onPick(raw)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs",
              value === raw ? "bg-clay-600 text-white" : "bg-paper-100 text-ink-600",
            )}
          >
            {raw}
          </button>
        );
      })}
    </div>
  );
}

const OTHER_TYPES = [
  ["SERVICE", "Service"],
  ["EQUIPMENT", "Equipment"],
  ["PROFESSIONAL", "Professional"],
  ["OTHER", "Other"],
] as const;

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
  const { language, t } = useLanguage();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<ExpenseKind>((initial?.expenseType as ExpenseKind) ?? "MATERIAL");
  const [showOtherTypes, setShowOtherTypes] = useState(
    ["SERVICE", "EQUIPMENT", "PROFESSIONAL", "OTHER"].includes(initial?.expenseType ?? ""),
  );
  const [materialId, setMaterialId] = useState(initial?.materialCategoryId ?? "");
  const [labourId, setLabourId] = useState(initial?.labourCategoryId ?? "");
  const [labourMethod, setLabourMethod] = useState(initial?.labourCalcMethod ?? "DAILY_WAGE");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [qty, setQty] = useState(initial?.quantity ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "bags");
  const [rate, setRate] = useState(initial?.rate ?? "");
  const [workersCount, setWorkersCount] = useState(initial?.numberOfWorkers ?? "");
  const [days, setDays] = useState(initial?.numberOfDays ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const receiptRef = useRef<HTMLInputElement>(null);

  const materialPreset = useMemo(
    () => getMaterialPreset(materials.find((item) => item.id === materialId)?.name),
    [materials, materialId],
  );
  const labourPreset = useMemo(
    () => getLabourPreset(labours.find((item) => item.id === labourId)?.name),
    [labours, labourId],
  );

  const preview = useMemo(() => {
    if (type === "LABOUR" && labourMethod === "DAILY_WAGE") {
      return computeLabourAmount({
        method: "DAILY_WAGE",
        numberOfWorkers: parseMoneyInput(workersCount),
        numberOfDays: parseMoneyInput(days),
        rate: parseMoneyInput(rate),
      });
    }
    if (type === "MATERIAL") {
      return computeMaterialAmount({
        quantity: parseMoneyInput(qty),
        rate: parseMoneyInput(rate),
        amount: parseMoneyInput(amount),
      });
    }
    return parseMoneyInput(amount);
  }, [type, labourMethod, workersCount, days, rate, qty, amount]);

  const formula = useMemo(() => {
    if (type === "MATERIAL" && qty && rate) {
      return `${qty} ${unit || "units"} × ${formatINR(parseMoneyInput(rate))}`;
    }
    if (type === "LABOUR" && labourMethod === "DAILY_WAGE" && workersCount && days && rate) {
      return `${workersCount} × ${days} days × ${formatINR(parseMoneyInput(rate))}`;
    }
    return null;
  }, [type, qty, unit, rate, labourMethod, workersCount, days]);

  const saveLabel = language === "te" ? t.form.saveExpense : "Save expense";
  const isLabourDaily = type === "LABOUR" && labourMethod === "DAILY_WAGE";
  const showAmountField = type !== "MATERIAL" && !isLabourDaily;

  return (
    <form
      className="space-y-4 pb-28"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const payload = Object.fromEntries(form.entries());
        start(async () => {
          setError(null);
          const result = await saveExpense({ ...payload, projectId, expenseType: type, description }, expenseId);
          if (result.error || !result.id) {
            setError(result.error ?? "Could not save expense.");
            return;
          }
          const file = form.get("receipt");
          if (file instanceof File && file.size > 0) {
            const receiptData = new FormData();
            receiptData.set("file", file);
            await uploadReceipt(result.id, receiptData);
          }
          router.push("/expenses");
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="expenseType" value={type} />
      <input type="hidden" name="projectId" value={projectId} />

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-paper-100 p-1">
        <button
          type="button"
          onClick={() => {
            setType("MATERIAL");
            setShowOtherTypes(false);
          }}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition",
            type === "MATERIAL" ? "bg-white text-clay-800 shadow-sm" : "text-ink-600",
          )}
        >
          <BrickWall className="h-4 w-4" />
          Material
        </button>
        <button
          type="button"
          onClick={() => {
            setType("LABOUR");
            setShowOtherTypes(false);
          }}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition",
            type === "LABOUR" ? "bg-white text-clay-800 shadow-sm" : "text-ink-600",
          )}
        >
          <HardHat className="h-4 w-4" />
          Labour
        </button>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowOtherTypes((open) => !open)}
          className="text-xs text-ink-400 underline-offset-2 hover:text-ink-600 hover:underline"
        >
          {showOtherTypes ? "Hide other types" : "JCB, fees, equipment…"}
        </button>
      </div>

      {showOtherTypes ? (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {OTHER_TYPES.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setType(id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                type === id ? "bg-clay-600 text-white" : "bg-white text-ink-600 ring-1 ring-ink-200",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-paper-200 bg-white px-4 py-2.5">
        <span className="text-sm font-medium text-ink-700">Date</span>
        <TextInput
          name="date"
          type="date"
          required
          aria-label="Date"
          defaultValue={initial?.date ?? new Date().toISOString().slice(0, 10)}
          className="w-auto border-0 bg-transparent px-0 py-1 text-right shadow-none ring-0 focus:ring-0"
        />
      </div>

      {type === "MATERIAL" ? (
        <section className="space-y-3 rounded-2xl border border-paper-200 bg-white p-4">
          <Field label="Material category">
            <Select
              name="materialCategoryId"
              value={materialId}
              required
              onChange={(event) => {
                const id = event.target.value;
                setMaterialId(id);
                const preset = getMaterialPreset(materials.find((item) => item.id === id)?.name);
                setUnit(preset.defaultUnit);
                if (!description && preset.descriptions[0]) setDescription(preset.descriptions[0]);
              }}
            >
              <option value="">Select material</option>
              {grouped(materials).map(([group, options]) => (
                <optgroup key={group} label={group}>
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>

          <Field label="Description">
            <TextInput
              name="description"
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="OPC Cement"
            />
          </Field>
          <Chips items={materialPreset.descriptions} value={description} onPick={setDescription} />
        </section>
      ) : null}

      {type === "LABOUR" ? (
        <section className="space-y-3 rounded-2xl border border-paper-200 bg-white p-4">
          <Field label="Labour category">
            <Select
              name="labourCategoryId"
              value={labourId}
              required
              onChange={(event) => {
                const id = event.target.value;
                setLabourId(id);
                const preset = getLabourPreset(labours.find((item) => item.id === id)?.name);
                if (!description && preset.descriptions[0]) setDescription(preset.descriptions[0]);
              }}
            >
              <option value="">Select labour</option>
              {grouped(labours).map(([group, options]) => (
                <optgroup key={group} label={group}>
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>

          <Field label="Work description">
            <TextInput
              name="description"
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Work done"
            />
          </Field>
          <Chips items={labourPreset.descriptions} value={description} onPick={setDescription} />
        </section>
      ) : null}

      {type === "SERVICE" ? (
        <section className="rounded-2xl border border-paper-200 bg-white p-4">
          <Field label="Service category">
            <Select name="serviceCategoryId" defaultValue={initial?.serviceCategoryId ?? ""} required>
              <option value="">Select service</option>
              {services.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        </section>
      ) : null}

      {type === "EQUIPMENT" ? (
        <section className="rounded-2xl border border-paper-200 bg-white p-4">
          <Field label="Equipment category">
            <Select name="equipmentCategoryId" defaultValue={initial?.equipmentCategoryId ?? ""} required>
              <option value="">Select equipment</option>
              {equipment.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        </section>
      ) : null}

      {type === "PROFESSIONAL" ? (
        <section className="rounded-2xl border border-paper-200 bg-white p-4">
          <Field label="Professional category">
            <Select name="professionalCategoryId" defaultValue={initial?.professionalCategoryId ?? ""} required>
              <option value="">Select professional</option>
              {professionals.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        </section>
      ) : null}

      {type !== "MATERIAL" && type !== "LABOUR" ? (
        <section className="rounded-2xl border border-paper-200 bg-white p-4">
          <Field label="Description">
            <TextInput
              name="description"
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Work or service"
            />
          </Field>
        </section>
      ) : null}

      {type === "MATERIAL" ? (
        <section className="rounded-2xl border border-paper-200 bg-white p-4">
          <div className="grid grid-cols-3 gap-2">
            <Field label="Quantity">
              <TextInput name="quantity" inputMode="decimal" value={qty} onChange={(event) => setQty(event.target.value)} placeholder="50" />
            </Field>
            <Field label="Unit">
              <TextInput name="unit" value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="Bags" />
            </Field>
            <Field label="Rate">
              <TextInput name="rate" inputMode="decimal" value={rate} onChange={(event) => setRate(event.target.value)} placeholder="420" />
            </Field>
          </div>
          {formula ? (
            <p className="mt-3 text-center text-sm text-ink-500">
              {formula} = <span className="font-semibold text-ink-900">{preview ? formatINR(preview) : "₹0"}</span>
            </p>
          ) : (
            <p className="mt-3 text-center text-xs text-ink-400">Quantity × rate</p>
          )}
        </section>
      ) : null}

      {type === "LABOUR" ? (
        <section className="space-y-3 rounded-2xl border border-paper-200 bg-white p-4">
          <Field label="Calculation method">
            <Select name="labourCalcMethod" value={labourMethod} onChange={(event) => setLabourMethod(event.target.value)}>
              <option value="DAILY_WAGE">Daily wage</option>
              <option value="FIXED_CONTRACT">Fixed contract</option>
              <option value="WORK_BASED">Work-based</option>
            </Select>
          </Field>

          {isLabourDaily ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Workers">
                  <TextInput
                    name="numberOfWorkers"
                    inputMode="numeric"
                    value={workersCount}
                    onChange={(event) => setWorkersCount(event.target.value)}
                    placeholder="5"
                  />
                </Field>
                <Field label="Days">
                  <TextInput
                    name="numberOfDays"
                    inputMode="decimal"
                    value={days}
                    onChange={(event) => setDays(event.target.value)}
                    placeholder="4"
                  />
                </Field>
                <Field label="Daily rate">
                  <TextInput
                    name="rate"
                    inputMode="decimal"
                    value={rate}
                    onChange={(event) => setRate(event.target.value)}
                    placeholder="900"
                  />
                </Field>
              </div>
              {formula ? (
                <p className="text-center text-sm text-ink-500">
                  {formula} = <span className="font-semibold text-ink-900">{preview ? formatINR(preview) : "₹0"}</span>
                </p>
              ) : (
                <p className="text-center text-xs text-ink-400">Workers × days × daily rate</p>
              )}
            </>
          ) : (
            <Field label="Amount">
              <TextInput
                name="amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="75000"
              />
            </Field>
          )}
        </section>
      ) : null}

      {showAmountField ? (
        <section className="rounded-2xl border border-paper-200 bg-white p-4">
          <Field label="Amount">
            <TextInput
              name="amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="15000"
            />
          </Field>
        </section>
      ) : null}

      {(type === "MATERIAL" || isLabourDaily) && (
        <input type="hidden" name="amount" value={preview && !preview.isZero() ? preview.toFixed(2) : amount} />
      )}

      <button
        type="button"
        onClick={() => receiptRef.current?.click()}
        className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-paper-300 bg-white px-4 py-3 text-left text-sm text-ink-600"
      >
        <Camera className="h-4 w-4 shrink-0 text-clay-600" />
        <span className="min-w-0 flex-1 truncate">
          {receiptName ?? (language === "te" ? t.form.takePhotoOrUpload : "Receipt photo (optional)")}
        </span>
        {receiptName ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              if (receiptRef.current) receiptRef.current.value = "";
              setReceiptName(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                if (receiptRef.current) receiptRef.current.value = "";
                setReceiptName(null);
              }
            }}
            className="rounded-full p-1 text-ink-400 hover:bg-paper-100 hover:text-ink-700"
            aria-label="Remove receipt"
          >
            <X className="h-4 w-4" />
          </span>
        ) : null}
      </button>
      <input
        ref={receiptRef}
        type="file"
        name="receipt"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        onChange={(event) => setReceiptName(event.target.files?.[0]?.name ?? null)}
      />

      <details className="rounded-2xl border border-paper-200 bg-white" open={Boolean(expenseId)}>
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-ink-600 [&::-webkit-details-marker]:hidden">
          More details
          <ChevronDown className="h-4 w-4 text-ink-400" />
        </summary>
        <div className="space-y-3 border-t border-paper-200 px-4 py-4">
          <Field label="Payment">
            <Select name="paymentMethod" defaultValue={initial?.paymentMethod ?? "UPI"}>
              {["UPI", "CASH", "BANK_TRANSFER", "CHEQUE", "CARD", "CREDIT", "OTHER"].map((method) => (
                <option key={method} value={method}>
                  {method.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </Field>

          {type === "LABOUR" ? (
            <Field label="Worker">
              <Select name="workerId" defaultValue={initial?.workerId ?? ""}>
                <option value="">Optional</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          {type === "MATERIAL" || type === "SERVICE" ? (
            <Field label="Vendor">
              <Select name="vendorId" defaultValue={initial?.vendorId ?? ""}>
                <option value="">Optional</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Stage">
              <Select name="constructionStageId" defaultValue={initial?.constructionStageId ?? ""}>
                <option value="">Optional</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Floor">
              <Select name="floorId" defaultValue={initial?.floorId ?? ""}>
                <option value="">Optional</option>
                {floors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Invoice">
            <TextInput name="invoiceNumber" defaultValue={initial?.invoiceNumber} placeholder="Optional" />
          </Field>
          <Field label="Notes">
            <TextInput name="notes" defaultValue={initial?.notes} placeholder="Optional" />
          </Field>
        </div>
      </details>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-paper-200 bg-white/95 px-4 py-3 backdrop-blur lg:left-[270px] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <p className="text-xs text-ink-500">Total</p>
            <p className="font-display text-2xl text-clay-700">{preview ? formatINR(preview) : "₹0"}</p>
          </div>
          <Button type="submit" disabled={pending} className="min-w-36">
            {pending ? t.form.saving : saveLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
