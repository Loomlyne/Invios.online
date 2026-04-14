"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { MobileSheet, MobileSheetContent, MobileSheetHeader } from "@/components/ui/mobile-sheet";
import { cn } from "@/lib/utils";
import type { CsvField, CsvRowValid, ImportResult } from "@/lib/csv-import";
import { StepUpload } from "./step-upload";
import { StepMap } from "./step-map";

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
// Validated row type (Plan 03 will use this fully)
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

  function reset() {
    setStep(1);
    setRawRows([]);
    setRawHeaders([]);
    setMapping({});
    setValidatedRows([]);
    setResult(null);
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) reset();
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
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {/* Steps 3 and 4 are implemented in Plan 03 */}
        {step === 3 && (
          <div className="py-8 text-center text-sm text-muted">
            Step 3: Preview import (Plan 03)
          </div>
        )}

        {step === 4 && (
          <div className="py-8 text-center text-sm text-muted">
            Step 4: Import complete (Plan 03)
          </div>
        )}
      </MobileSheetContent>
    </MobileSheet>
  );
}
