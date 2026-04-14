"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { advanceNextDueDate, type RecurringFrequency } from "@/lib/cron-utils";
import {
  createRecurringScheduleAction,
  updateRecurringScheduleAction,
  cancelRecurringScheduleAction,
} from "@/actions/recurring";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";

type RecurringConfigFormProps = {
  /** UUID of the invoice (required for dialog mode — create/update schedule for existing invoice) */
  invoiceId?: string;
  /** Current frequency (for edit mode) */
  frequency?: RecurringFrequency;
  /** Current next due date (for edit mode, YYYY-MM-DD) */
  nextDueDate?: string;
  /** Existing schedule id (for edit/cancel mode) */
  scheduleId?: string;
  /** Callback after successful save or cancel */
  onSaved?: () => void;
  /** "inline" for builder form (hidden inputs), "dialog" for detail page dialog */
  mode: "inline" | "dialog";
  /** Issue date from the parent form (used to auto-calculate next date in inline mode) */
  issueDate?: string;
  /** Controlled frequency (for inline mode — reads parent state) */
  selectedFrequency?: RecurringFrequency;
  /** Controlled date (for inline mode — reads parent state) */
  selectedDate?: string;
  /** Callback when frequency changes (inline mode) */
  onFrequencyChange?: (f: RecurringFrequency) => void;
  /** Callback when date changes (inline mode) */
  onDateChange?: (d: string) => void;
};

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

export function RecurringConfigForm({
  invoiceId,
  frequency: frequencyProp,
  nextDueDate: nextDueDateProp,
  scheduleId,
  onSaved,
  mode,
  issueDate,
  selectedFrequency,
  selectedDate,
  onFrequencyChange,
  onDateChange,
}: RecurringConfigFormProps) {
  const isInline = mode === "inline";

  // Internal state only used in dialog mode; inline mode is fully controlled by parent
  const [localFrequency, setLocalFrequency] = useState<RecurringFrequency>(
    frequencyProp ?? "monthly",
  );
  const [localDate, setLocalDate] = useState<string>(
    nextDueDateProp ??
      advanceNextDueDate(issueDate ?? todayIso(), frequencyProp ?? "monthly"),
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const activeFrequency = isInline ? (selectedFrequency ?? "monthly") : localFrequency;
  const activeDate = isInline
    ? (selectedDate ?? advanceNextDueDate(issueDate ?? todayIso(), activeFrequency))
    : localDate;

  function handleFrequencyChange(f: RecurringFrequency) {
    if (isInline) {
      onFrequencyChange?.(f);
      // Auto-recalculate date when frequency changes
      const newDate = advanceNextDueDate(issueDate ?? todayIso(), f);
      onDateChange?.(newDate);
    } else {
      setLocalFrequency(f);
      // Auto-recalculate date when frequency changes (unless user has manually set it)
      setLocalDate(advanceNextDueDate(issueDate ?? todayIso(), f));
    }
  }

  function handleDateChange(d: string) {
    if (isInline) {
      onDateChange?.(d);
    } else {
      setLocalDate(d);
    }
  }

  function handleSave() {
    if (!invoiceId) return;
    setError(null);

    startTransition(async () => {
      const result = scheduleId
        ? await updateRecurringScheduleAction(scheduleId, {
            frequency: localFrequency,
            nextDueDate: localDate,
          })
        : await createRecurringScheduleAction({
            sourceInvoiceId: invoiceId,
            frequency: localFrequency,
            nextDueDate: localDate,
          });

      if (result.status === "error") {
        setError(result.message ?? null);
      } else {
        onSaved?.();
      }
    });
  }

  function handleCancelSchedule() {
    if (!scheduleId) return;
    setError(null);

    startTransition(async () => {
      const result = await cancelRecurringScheduleAction(scheduleId);
      if (result.status === "error") {
        setError(result.message ?? null);
      } else {
        onSaved?.();
      }
    });
  }

  const frequencyRow = (
    <div className="grid gap-2">
      <Label className="text-sm">Frequency</Label>
      <div className="flex gap-2">
        {FREQUENCIES.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => handleFrequencyChange(f.value)}
            className={`flex h-10 flex-1 items-center justify-center rounded-full border text-sm font-medium transition ${
              activeFrequency === f.value
                ? "border-foreground bg-foreground text-on-dark"
                : "border-border bg-surface text-foreground hover:bg-[#FFF7EA]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );

  const dateRow = (
    <div className="grid gap-2">
      <Label className="text-sm">Next generation date</Label>
      <DatePicker
        id="recurringNextDate"
        name={isInline ? "recurringNextDate" : undefined}
        value={activeDate}
        onChange={handleDateChange}
      />
      <p className="text-[11px] text-muted">The next draft will be created on this date.</p>
    </div>
  );

  // Inline mode: hidden inputs let parent form read values on submit
  if (isInline) {
    return (
      <div className="grid gap-3 border-t border-dashed border-border/60 pt-3">
        {frequencyRow}
        {dateRow}
        <input type="hidden" name="recurringFrequency" value={activeFrequency} />
        <input type="hidden" name="recurringNextDate" value={activeDate} />
      </div>
    );
  }

  // Dialog mode: has its own action buttons
  return (
    <div className="grid gap-4">
      {frequencyRow}
      {dateRow}

      {error ? (
        <div className="rounded-[var(--radius-inner)] border border-[#E7B1A8] bg-[#FFF3F1] px-4 py-3 text-sm text-[#8D3D2E]">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2">
        {scheduleId ? (
          <button
            type="button"
            onClick={handleCancelSchedule}
            disabled={isPending}
            className="text-sm font-medium text-[#8D3D2E] hover:underline disabled:opacity-50"
          >
            Cancel schedule
          </button>
        ) : (
          <span />
        )}

        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onSaved} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" variant="accent" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Save schedule
          </Button>
        </div>
      </div>
    </div>
  );
}
