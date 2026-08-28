import { Decimal } from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export type MoneyInput = Decimal.Value | { toString(): string } | null | undefined;

export function toDecimal(value: MoneyInput): Decimal {
  if (value === null || value === undefined || value === "") {
    return new Decimal(0);
  }
  return new Decimal(value.toString());
}

export function zero(): Decimal {
  return new Decimal(0);
}

export function addMoney(...values: MoneyInput[]): Decimal {
  return values.reduce<Decimal>((sum, value) => sum.plus(toDecimal(value)), zero());
}

export function subtractMoney(left: MoneyInput, right: MoneyInput): Decimal {
  return toDecimal(left).minus(toDecimal(right));
}

export function multiplyMoney(left: MoneyInput, right: MoneyInput): Decimal {
  return toDecimal(left).times(toDecimal(right));
}

export function isPositive(value: MoneyInput): boolean {
  return toDecimal(value).greaterThan(0);
}

export function isNegative(value: MoneyInput): boolean {
  return toDecimal(value).lessThan(0);
}

export function moneyEquals(left: MoneyInput, right: MoneyInput): boolean {
  return toDecimal(left).eq(toDecimal(right));
}

export function roundMoney(value: MoneyInput, decimalPlaces = 2): Decimal {
  return toDecimal(value).toDecimalPlaces(decimalPlaces);
}

export function percentOf(part: MoneyInput, whole: MoneyInput, decimalPlaces = 1): Decimal {
  const total = toDecimal(whole);
  if (total.isZero()) return zero();
  return toDecimal(part).div(total).times(100).toDecimalPlaces(decimalPlaces);
}

export function variance(budget: MoneyInput, actual: MoneyInput) {
  const budgetDec = toDecimal(budget);
  const actualDec = toDecimal(actual);
  const remaining = budgetDec.minus(actualDec);
  const delta = actualDec.minus(budgetDec);
  const usedPct = percentOf(actualDec, budgetDec, 1);
  return {
    budget: budgetDec,
    actual: actualDec,
    remaining,
    variance: delta,
    usedPercent: usedPct,
    isOver: actualDec.greaterThan(budgetDec) && budgetDec.greaterThan(0),
    isUnset: budgetDec.isZero(),
  };
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const inrIntegerFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function formatINR(value: MoneyInput, options?: { integer?: boolean }): string {
  const amount = roundMoney(value);
  if (options?.integer || amount.isInteger()) {
    return inrIntegerFormatter.format(Number(amount.toFixed(0)));
  }
  return inrFormatter.format(Number(amount.toFixed(2)));
}

export function formatINRSigned(value: MoneyInput): string {
  const amount = roundMoney(value);
  const formatted = formatINR(amount.abs());
  if (amount.isZero()) return formatted;
  return amount.isNegative() ? `-${formatted}` : `+${formatted}`;
}

export function formatPdfINR(value: MoneyInput, options?: { integer?: boolean }): string {
  const amount = roundMoney(value);
  const num = options?.integer || amount.isInteger()
    ? Math.round(Number(amount.toFixed(0)))
    : Number(amount.toFixed(2));
  const formatted = num.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: options?.integer || amount.isInteger() ? 0 : 2,
  });
  return `Rs. ${formatted}`;
}

export function formatPdfINRCompact(value: MoneyInput): string {
  const amount = toDecimal(value);
  const abs = amount.abs();
  const sign = amount.isNegative() ? "-" : "";

  if (abs.greaterThanOrEqualTo(1_00_00_000)) {
    const crore = abs.div(1_00_00_000).toDecimalPlaces(2);
    return `${sign}Rs. ${formatPlain(crore)}Cr`;
  }
  if (abs.greaterThanOrEqualTo(1_00_000)) {
    const lakh = abs.div(1_00_000).toDecimalPlaces(2);
    return `${sign}Rs. ${formatPlain(lakh)}L`;
  }
  return `${sign}${formatPdfINR(abs)}`;
}

export function formatINRCompact(value: MoneyInput): string {
  const amount = toDecimal(value);
  const abs = amount.abs();
  const sign = amount.isNegative() ? "-" : "";

  if (abs.greaterThanOrEqualTo(1_00_00_000)) {
    const crore = abs.div(1_00_00_000).toDecimalPlaces(2);
    return `${sign}₹${formatPlain(crore)}Cr`;
  }
  if (abs.greaterThanOrEqualTo(1_00_000)) {
    const lakh = abs.div(1_00_000).toDecimalPlaces(2);
    return `${sign}₹${formatPlain(lakh)}L`;
  }
  return `${sign}${formatINR(abs)}`;
}

function formatPlain(value: Decimal): string {
  const asString = value.toFixed(2);
  return asString.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

export function toChartNumber(value: MoneyInput): number {
  return Number(roundMoney(value).toFixed(2));
}

export function parseMoneyInput(raw: string | number | null | undefined): Decimal | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const cleaned = String(raw).replace(/[₹,\s]/g, "");
  if (!cleaned || Number.isNaN(Number(cleaned))) return null;
  try {
    const value = new Decimal(cleaned);
    if (!value.isFinite()) return null;
    return value;
  } catch {
    return null;
  }
}
