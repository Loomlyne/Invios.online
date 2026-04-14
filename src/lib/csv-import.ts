import { z } from "zod";

// --- Constants ---

export const CSV_FIELDS = ["name", "company", "email", "phone", "address", "trn"] as const;
export type CsvField = typeof CSV_FIELDS[number];

export const MAX_IMPORT_ROWS = 200;

// Field labels for UI display (Step 2 mapping dropdowns)
export const CSV_FIELD_LABELS: Record<CsvField, string> = {
  name: "Name",
  company: "Company",
  email: "Email",
  phone: "Phone",
  address: "Address",
  trn: "TRN",
};

// --- Fuzzy Header Mapping (per D-03) ---

const HEADER_ALIASES: Record<string, CsvField> = {
  // name variants
  name: "name",
  "client name": "name",
  "full name": "name",
  contact: "name",
  "contact name": "name",
  // company variants
  company: "company",
  "company name": "company",
  organization: "company",
  organisation: "company",
  business: "company",
  "business name": "company",
  // email variants
  email: "email",
  "e-mail": "email",
  "email address": "email",
  "e-mail address": "email",
  // phone variants
  phone: "phone",
  "phone number": "phone",
  mobile: "phone",
  tel: "phone",
  telephone: "phone",
  // address variants
  address: "address",
  "billing address": "address",
  location: "address",
  "street address": "address",
  // trn variants
  trn: "trn",
  "tax registration number": "trn",
  "vat number": "trn",
  "tax number": "trn",
  vat: "trn",
  "tax id": "trn",
};

/**
 * Auto-map CSV headers to client fields using fuzzy matching.
 * Returns a mapping of CsvField -> CSV column header string.
 * First match wins — if two CSV columns map to the same field, only the first is used.
 */
export function autoMapHeaders(csvHeaders: string[]): Partial<Record<CsvField, string>> {
  const mapping: Partial<Record<CsvField, string>> = {};
  for (const header of csvHeaders) {
    const normalized = header.toLowerCase().trim();
    const field = HEADER_ALIASES[normalized];
    if (field && !mapping[field]) {
      mapping[field] = header; // first match wins
    }
  }
  return mapping;
}

// --- Zod Row Schema ---

/**
 * CSV row validation schema — looser than clientFormSchema.
 * Omits id, status, taxCode, logoPath (not user-supplied in CSV).
 * Reuses validation rules from clientFormSchema verbatim.
 */
export const csvRowSchema = z.object({
  name: z.string().min(2, "Client name is required."),
  company: z.string().default(""),
  email: z.union([z.literal(""), z.string().email("Enter a valid email.")]).default(""),
  phone: z.string().default(""),
  address: z.string().default(""),
  trn: z.string().default(""),
});

export type CsvRowInput = z.input<typeof csvRowSchema>;
export type CsvRowValid = z.output<typeof csvRowSchema>;

// --- Import Result Type (per RESEARCH Pattern 7) ---

/**
 * Return type for importClientsAction — structured result with counts
 * so the wizard can render the Result step without parsing message strings.
 * Intentionally NOT using ActionState.
 */
export type ImportResult = {
  status: "success" | "error";
  inserted: number;
  skipped: number;   // duplicates by email
  failed: number;    // validation errors (should be 0 — validated client-side)
  message?: string;  // error detail if status === "error"
};
