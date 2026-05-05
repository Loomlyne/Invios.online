"use client";

import { Fragment } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CsvRowValid } from "@/lib/csv-import";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ValidatedRow = {
  row: CsvRowValid;
  errors: string[];
  isDuplicate: boolean;
  checked: boolean;
};

interface StepPreviewProps {
  rows: ValidatedRow[];
  onToggleRow: (index: number) => void;
  onToggleAll: (checked: boolean) => void;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

// ---------------------------------------------------------------------------
// StepPreview — Step 3 component
// ---------------------------------------------------------------------------

export function StepPreview({
  rows,
  onToggleRow,
  onToggleAll,
  onConfirm,
  onBack,
  isSubmitting,
}: StepPreviewProps) {
  const validCount = rows.filter((r) => r.errors.length === 0 && !r.isDuplicate).length;
  const duplicateCount = rows.filter((r) => r.isDuplicate).length;
  const errorCount = rows.filter((r) => r.errors.length > 0).length;

  // Only rows with no errors count toward the confirm button
  const checkedValidCount = rows.filter((r) => r.checked && r.errors.length === 0).length;

  // "Select all" checkbox reflects whether all checkable rows are checked
  const checkableRows = rows.filter((r) => r.errors.length === 0);
  const allChecked = checkableRows.length > 0 && checkableRows.every((r) => r.checked);

  return (
    <div className="flex flex-col gap-4">
      {/* Scrollable preview table */}
      <div className="max-h-[50vh] overflow-y-auto rounded-[var(--radius-md)] border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-surface-subtle">
            <tr>
              <th scope="col" className="w-11 px-2 py-2 text-center">
                <div className="flex items-center justify-center size-11">
                  <input
                    type="checkbox"
                    className="size-4 cursor-pointer accent-amber-500"
                    checked={allChecked}
                    onChange={(e) => onToggleAll(e.target.checked)}
                    aria-label="Select all rows"
                  />
                </div>
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                Row
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                Name
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                Email
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r, i) => {
              const hasError = r.errors.length > 0;
              const rowClass = hasError
                ? "border-l-2 border-danger bg-red-50/40"
                : r.isDuplicate
                  ? "border-l-2 border-amber-400 bg-amber-50/40"
                  : "border-l-2 border-success bg-surface";

              return (
                <Fragment key={i}>
                  <tr
                    className={`${rowClass} ${!r.checked ? "opacity-50" : ""} transition-opacity`}
                  >
                    <td className="w-11 px-2 py-1 text-center">
                      <div className="flex items-center justify-center size-11">
                        <input
                          type="checkbox"
                          className="size-4 cursor-pointer accent-amber-500"
                          checked={r.checked}
                          onChange={() => onToggleRow(i)}
                          aria-label={`Select row ${i + 1}`}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted tabular-nums">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{r.row.name || <span className="text-muted">—</span>}</td>
                    <td className="px-3 py-2 text-muted">
                      {r.row.email || <span>—</span>}
                    </td>
                    <td className="px-3 py-2">
                      {hasError ? (
                        <Badge variant="destructive">Error</Badge>
                      ) : r.isDuplicate ? (
                        <Badge variant="warning">Duplicate</Badge>
                      ) : (
                        <Badge variant="success">Valid</Badge>
                      )}
                    </td>
                  </tr>
                  {hasError && (
                    <tr className={`${rowClass} ${!r.checked ? "opacity-50" : ""}`}>
                      <td colSpan={5} className="text-sm text-danger px-4 pb-2">
                        {r.errors.join("; ")}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary bar */}
      <div className="flex gap-4 text-sm text-muted py-1">
        <span>{validCount} valid</span>
        <span>·</span>
        <span>{duplicateCount} duplicates</span>
        <span>·</span>
        <span>{errorCount} errors</span>
      </div>

      {/* Empty-selection helper text */}
      {checkedValidCount === 0 && !isSubmitting && (
        <p className="text-sm text-muted">
          No rows selected — check at least one row to import.
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="secondary" onClick={onBack} disabled={isSubmitting}>
          ← Back
        </Button>
        <Button
          variant="accent"
          onClick={onConfirm}
          disabled={isSubmitting || checkedValidCount === 0}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Importing…
            </>
          ) : (
            `Confirm import (${checkedValidCount} clients)`
          )}
        </Button>
      </div>
    </div>
  );
}
