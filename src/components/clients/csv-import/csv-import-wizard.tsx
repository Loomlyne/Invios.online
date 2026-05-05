"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { MobileSheet, MobileSheetContent, MobileSheetHeader } from "@/components/ui/mobile-sheet";
import { cn } from "@/lib/utils";
import { csvRowSchema, CSV_FIELDS } from "@/lib/csv-import";
import type { CsvField, CsvRowValid, ImportResult } from "@/lib/csv-import";
import { fetchExistingClientEmailsAction, importClientsAction } from "@/actions/clients";
import { StepUpload } from "./step-upload";
import { StepMap } from "./step-map";
import { StepPreview } from "./step-preview";
import { StepResult } from "./step-result";

// ---------------------------------------------------------------------------
// StepIndicator — inline, not worth a separate file
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: 1 | 2 | 3 | 4 }) {
  const steps = [1, 2, 3, 4] as const;
  return (
    <div className="mb-5 flex items-center gap-2" aria-label="Import wizard steps">
      {steps.map((step, i) => {
        const isCompleted = step < current;
        const isCurrent = step === current;
        return (
          <div key={step} className="flex items-center gap-2">
            {/* Step dot */}
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                isCurrent && "bg-accent text-[#1C1917]",
                isCompleted && "bg-success text-white",
                !isCurrent && !isCompleted && "bg-surface-strong text-muted",
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              {isCompleted ? <Check className="size-3.5" /> : step}
            </div>
            {/* Connector line (not after last dot) */}
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1",
                  step < current ? "bg-success" : "bg-border",
                )}
                style={{ minWidth: "1.5rem" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step title/description map
// ---------------------------------------------------------------------------

const STEP_HEADERS: Record<
  1 | 2 | 3 | 4,
  { title: string; description?: string }
> = {
  1: { title: "Import clients", description: "Upload a CSV file to add clients in bulk." },
  2: { title: "Map columns", description: "Match your CSV columns to client fields." },
  3: { title: "Preview import" },
  4: { title: "Import complete" },
};

// ---------------------------------------------------------------------------
// ValidatedRow type (exported for step-preview)
// ---------------------------------------------------------------------------

export type ValidatedRow = {
  row: CsvRowValid;
  errors: string[];
  isDuplicate: boolean;
  checked: boolean;
};

// ---------------------------------------------------------------------------
// CsvImportWizard — root component
// ---------------------------------------------------------------------------

interface CsvImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CsvImportWizard({ open, onOpenChange }: CsvImportWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<CsvField, string>>>({});
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setStep(1);
    setRawRows([]);
    setRawHeaders([]);
    setMapping({});
    setValidatedRows([]);
    setResult(null);
    setIsSubmitting(false);
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) reset();
  }

  async function preparePreview() {
    // Apply mapping to transform raw CSV rows into typed row inputs
    const mapped = rawRows.map((raw) => {
      const row: Record<string, string> = {};
      for (const field of CSV_FIELDS) {
        const csvHeader = mapping[field];
        row[field] = csvHeader ? (raw[csvHeader] ?? "").trim() : "";
      }
      return row;
    });

    // Fetch existing emails for duplicate detection (per D-05)
    const existingEmails = new Set(await fetchExistingClientEmailsAction());

    // Validate each row
    const rows = mapped.map((raw) => {
      const parseResult = csvRowSchema.safeParse(raw);
      const hasError = !parseResult.success;
      const validRow = parseResult.success
        ? parseResult.data
        : {
            name: raw.name || "",
            company: raw.company || "",
            email: raw.email || "",
            phone: raw.phone || "",
            address: raw.address || "",
            trn: raw.trn || "",
          };
      const isDuplicate =
        !hasError && !!validRow.email && existingEmails.has(validRow.email.toLowerCase());

      return {
        row: validRow as CsvRowValid,
        errors: hasError ? parseResult.error.issues.map((i) => i.message) : [],
        isDuplicate,
        checked: !hasError, // invalid rows unchecked by default; duplicates checked but flagged
      };
    });

    setValidatedRows(rows);
    setStep(3);
  }

  async function handleConfirmImport() {
    setIsSubmitting(true);
    try {
      const checkedRows = validatedRows
        .filter((r) => r.checked && r.errors.length === 0)
        .map((r) => r.row);
      const importResult = await importClientsAction(checkedRows);
      setResult(importResult);
      setStep(4);
    } catch {
      setResult({
        status: "error",
        inserted: 0,
        skipped: 0,
        failed: 0,
        message: "Import failed unexpectedly.",
      });
      setStep(4);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleToggleRow(index: number) {
    setValidatedRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, checked: !r.checked } : r)),
    );
  }

  function handleToggleAll(checked: boolean) {
    setValidatedRows((prev) =>
      prev.map((r) => ({
        ...r,
        // Only toggle rows that have no errors (error rows stay unchecked)
        checked: r.errors.length === 0 ? checked : false,
      })),
    );
  }

  const header = STEP_HEADERS[step];

  return (
    <MobileSheet open={open} onOpenChange={handleOpenChange}>
      <MobileSheetContent
        className={step === 3 ? "max-w-3xl" : "max-w-2xl"}
        title={header.title}
      >
        <MobileSheetHeader
          title={header.title}
          description={header.description}
        />

        <StepIndicator current={step} />

        {/* aria-live region for step transition announcements */}
        <div aria-live="polite" className="sr-only">
          {header.title}
        </div>

        {step === 1 && (
          <StepUpload
            onParsed={(rows, headers) => {
              setRawRows(rows);
              setRawHeaders(headers);
            }}
            onNext={() => setStep(2)}
            onClose={() => handleOpenChange(false)}
            hasParsedData={rawRows.length > 0}
            rowCount={rawRows.length}
          />
        )}

        {step === 2 && (
          <StepMap
            headers={rawHeaders}
            mapping={mapping}
            onMappingChange={setMapping}
            onNext={preparePreview}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <StepPreview
            rows={validatedRows}
            onToggleRow={handleToggleRow}
            onToggleAll={handleToggleAll}
            onConfirm={handleConfirmImport}
            onBack={() => setStep(2)}
            isSubmitting={isSubmitting}
          />
        )}

        {step === 4 && result && (
          <StepResult
            result={result}
            onDone={() => handleOpenChange(false)}
          />
        )}
      </MobileSheetContent>
    </MobileSheet>
  );
}
