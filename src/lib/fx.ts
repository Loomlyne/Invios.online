import { roundCurrency } from "@/lib/billing-utils";
import { formatCurrency } from "@/lib/utils";

/** Operator reporting currency for internal app surfaces (dashboard, lists, stats). */
export const REPORTING_CURRENCY = "AED" as const;

/**
 * Approximate static FX: units of AED per 1 unit of foreign currency.
 * Document currency stays on invoices/quotes; only internal rollups convert.
 * Rates are operational estimates for freelancer reporting — not bank mid-market.
 */
const AED_PER_UNIT: Record<string, number> = {
  AED: 1,
  USD: 3.6725,
  EUR: 4.0,
  GBP: 4.65,
  SAR: 0.9793,
  QAR: 1.0087,
  KWD: 11.95,
  BHD: 9.74,
  OMR: 9.54,
  INR: 0.044,
  PKR: 0.0132,
  EGP: 0.073,
  JOD: 5.18,
  TRY: 0.11,
  CAD: 2.7,
  AUD: 2.4,
  CHF: 4.15,
  JPY: 0.0245,
  CNY: 0.51,
  SGD: 2.75,
  HKD: 0.47,
  NZD: 2.2,
  SEK: 0.35,
  NOK: 0.34,
  DKK: 0.54,
  ZAR: 0.2,
  BRL: 0.65,
  MXN: 0.19,
  PHP: 0.064,
  THB: 0.11,
  MYR: 0.82,
  IDR: 0.00023,
  NGN: 0.0023,
  KES: 0.028,
  PLN: 0.93,
  CZK: 0.16,
  HUF: 0.01,
  ILS: 1.0,
  RUB: 0.04,
  KRW: 0.0027,
};

export function getAedRate(currency: string): number {
  const code = (currency || REPORTING_CURRENCY).trim().toUpperCase();
  return AED_PER_UNIT[code] ?? 1;
}

/** Convert a document amount into AED for internal reporting. */
export function toReportingAmount(amount: number, currency: string): number {
  return roundCurrency(amount * getAedRate(currency));
}

/** Format money for operator-facing UI — always AED. */
export function formatReportingCurrency(amount: number, currency: string = REPORTING_CURRENCY): string {
  return formatCurrency(toReportingAmount(amount, currency), REPORTING_CURRENCY);
}

export function sumInReportingCurrency(
  items: Array<{ amount: number; currency: string }>,
): number {
  return roundCurrency(
    items.reduce((total, item) => total + toReportingAmount(item.amount, item.currency), 0),
  );
}
