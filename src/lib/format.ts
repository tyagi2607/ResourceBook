/**
 * format.ts — turn raw database numbers into display text.
 *
 * Every helper accepts null/undefined and returns EMPTY ("—") in that case,
 * because most market columns stay empty until the daily ETL has run.
 */

export const EMPTY = "—";

type Maybe<T> = T | null | undefined;

/** 2345.6 -> "$2,345.60" (USD) or "CA$2,345.60" (CAD). */
export function formatPrice(value: Maybe<number>, currency = "USD", digits = 2): string {
  if (value == null) return EMPTY;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** 1.234 -> "+1.23%", -0.5 -> "-0.50%". Values are already percents (1.25 = 1.25 %). */
export function formatPercent(value: Maybe<number>, digits = 2): string {
  if (value == null) return EMPTY;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

/** 1234.5 -> "1,234.5" (fixed decimals). */
export function formatNumber(value: Maybe<number>, digits = 0): string {
  if (value == null) return EMPTY;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** "2026-10-08" or an ISO timestamp -> "Oct 8, 2026" (no time-zone shift for plain dates). */
export function formatDate(value: Maybe<string>): string {
  if (!value) return EMPTY;
  const date = value.length === 10 ? new Date(`${value}T12:00:00Z`) : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** "2026-08-01" -> "Aug 2026" (for monthly data). */
export function formatMonth(value: Maybe<string>): string {
  if (!value) return EMPTY;
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${value.slice(0, 10)}T12:00:00Z`),
  );
}

/** 92.4 -> "+92 t", -3 -> "−3 t" (whole tonnes; tiny moves show as "0 t"). */
export function formatTonnesChange(value: Maybe<number>): string {
  if (value == null) return EMPTY;
  const rounded = Math.round(value);
  if (rounded === 0) return "0 t";
  return `${rounded > 0 ? "+" : "−"}${formatNumber(Math.abs(rounded), 0)} t`;
}

/**
 * Tailwind text color for a gain/loss number: green up, red down, neutral otherwise.
 */
export function changeTone(value: Maybe<number>): string {
  if (value == null || value === 0) return "text-zinc-600 dark:text-zinc-400";
  return value > 0
    ? "text-emerald-700 dark:text-emerald-400"
    : "text-rose-700 dark:text-rose-400";
}
