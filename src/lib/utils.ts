import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "AED") {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function hasValue(value?: string | null) {
  return Boolean(value && value.trim().length > 0);
}

export function formatDateDisplay(iso: string) {
  if (!iso) return "";
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}.${match[2]}.${match[1]}`;
  // Try parsing other formats
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

export function parseBankDetails(raw: string): { label: string; value: string }[] {
  if (!raw || !raw.trim()) return [];
  // Split on pipes, bullet separators, or newlines
  const parts = raw.includes("|") ? raw.split("|") : raw.includes(" • ") ? raw.split(" • ") : raw.split("\n");
  const cleaned = parts.map((p) => p.trim()).filter(Boolean);
  if (cleaned.length === 0) return [];

  const result: { label: string; value: string }[] = [];
  for (const part of cleaned) {
    // Detect "Label: Value" pattern (e.g. "Account Name: KOUSSAY ZAYANI", "IBAN: AE96...")
    const colonMatch = part.match(/^([^:]+):\s*(.+)$/);
    if (colonMatch) {
      result.push({ label: colonMatch[1].trim(), value: colonMatch[2].trim() });
    } else if (/^[A-Z]{2}\d{2}/.test(part)) {
      result.push({ label: "IBAN", value: part });
    } else if (/^\d{6,}$/.test(part.replace(/\s/g, ""))) {
      result.push({ label: "Account Number", value: part });
    } else {
      result.push({ label: result.length === 0 ? "Bank" : "Account Name", value: part });
    }
  }
  return result;
}
