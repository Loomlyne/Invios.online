"use client";

import { useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { VersionRestoreDialog } from "@/components/documents/version-restore-dialog";

interface VersionHistoryPanelProps {
  invoiceId: string;
  currentTotal: number;
  currency: string;
  hasPayments: boolean;
  versions: Array<{ id: string; snapshot: Record<string, unknown>; createdAt: string }>;
}

function formatVersionDate(isoString: string): string {
  const date = new Date(isoString);
  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${datePart} · ${timePart}`;
}

export function VersionHistoryPanel({
  invoiceId,
  currentTotal,
  currency,
  hasPayments,
  versions,
}: VersionHistoryPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [restoreVersionId, setRestoreVersionId] = useState<string | null>(null);

  // D-03 and UI-SPEC: hide panel entirely when no versions exist
  if (versions.length === 0) return null;

  const versionCount = versions.length;
  const pluralSuffix = versionCount === 1 ? "" : "s";

  const selectedVersion = restoreVersionId
    ? versions.find((v) => v.id === restoreVersionId)
    : null;
  const snapshotTotal = selectedVersion
    ? ((selectedVersion.snapshot as { total?: number }).total ?? currentTotal)
    : currentTotal;

  return (
    <div className="bg-surface border border-border rounded-[var(--radius-inner)]">
      {/* Toggle row */}
      <Button
        variant="ghost"
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 min-h-[44px] px-[var(--space-card)] rounded-[var(--radius-inner)]"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
            History
          </span>
          <span className="text-sm text-foreground">
            {versionCount} saved version{pluralSuffix}
          </span>
        </div>
        <ChevronDown
          className={`size-4 text-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </Button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border px-[var(--space-card)] pb-[var(--space-card)]">
          {/* Panel header */}
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-semibold text-foreground">
              Version History
            </span>
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted">
              Up to 10 saved
            </span>
          </div>

          {/* Version rows */}
          <div>
            {versions.map((version) => {
              const snapshotTotalForRow = (version.snapshot as { total?: number }).total ?? 0;

              return (
                <div
                  key={version.id}
                  className="flex items-center justify-between gap-3 min-h-[44px] border-b border-border py-2 last:border-b-0"
                >
                  {/* Date/time */}
                  <span className="text-sm text-muted shrink-0">
                    {formatVersionDate(version.createdAt)}
                  </span>

                  {/* Total */}
                  <span className="text-sm font-semibold text-foreground font-[tabular-nums] flex-1 text-right">
                    {formatCurrency(snapshotTotalForRow, currency)}
                  </span>

                  {/* Restore button — responsive: text on md+, icon-only on mobile */}
                  <div className="shrink-0">
                    {/* Desktop: text button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRestoreVersionId(version.id)}
                      className="min-h-[44px] hidden md:inline-flex"
                    >
                      Restore version
                    </Button>
                    {/* Mobile: icon-only button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRestoreVersionId(version.id)}
                      className="min-h-[44px] min-w-[44px] md:hidden"
                      aria-label="Restore this version"
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Restore dialog */}
      {restoreVersionId && (
        <VersionRestoreDialog
          versionId={restoreVersionId}
          invoiceId={invoiceId}
          currentTotal={currentTotal}
          snapshotTotal={snapshotTotal}
          currency={currency}
          hasPayments={hasPayments}
          open={restoreVersionId !== null}
          onOpenChange={(open) => {
            if (!open) setRestoreVersionId(null);
          }}
        />
      )}
    </div>
  );
}
