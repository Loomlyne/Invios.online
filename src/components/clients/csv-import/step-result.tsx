"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImportResult } from "@/lib/csv-import";

// ---------------------------------------------------------------------------
// StepResult — Step 4 component
// ---------------------------------------------------------------------------

interface StepResultProps {
  result: ImportResult;
  onDone: () => void;
}

export function StepResult({ result, onDone }: StepResultProps) {
  return (
    <div className="flex flex-col items-center py-8 gap-4">
      {/* Success icon */}
      <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center">
        <Check className="size-5 text-success" />
      </div>

      {/* Heading */}
      <p className="text-base font-semibold">
        {result.inserted} clients imported
      </p>

      {/* 3-column count grid */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm w-full max-w-xs">
        <div>
          <span className="text-success font-semibold block">{result.inserted}</span>
          <span className="text-muted">imported</span>
        </div>
        <div>
          <span className="text-muted font-semibold block">{result.skipped}</span>
          <span className="text-muted">skipped</span>
        </div>
        <div>
          <span className="text-danger font-semibold block">{result.failed}</span>
          <span className="text-muted">failed</span>
        </div>
      </div>

      {/* Error message if applicable */}
      {result.status === "error" && result.message && (
        <p className="text-sm text-danger mt-2 text-center">{result.message}</p>
      )}

      {/* Done button */}
      <Button variant="accent" onClick={onDone} className="w-full mt-2">
        Done
      </Button>
    </div>
  );
}
