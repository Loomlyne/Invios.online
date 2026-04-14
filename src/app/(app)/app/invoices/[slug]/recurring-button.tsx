"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import type { RecurringFrequency } from "@/lib/cron-utils";
import { RecurringConfigForm } from "@/components/documents/recurring-config-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type RecurringButtonProps = {
  invoiceId: string;
  schedule?: {
    id: string;
    frequency: RecurringFrequency;
    nextDueDate: string;
  } | null;
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function RecurringButton({ invoiceId, schedule }: RecurringButtonProps) {
  const [open, setOpen] = useState(false);

  const label = schedule ? `Recurring: ${capitalize(schedule.frequency)}` : "Make recurring";

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <RefreshCw className="size-4" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <h2 className="text-xl font-semibold text-foreground">Set up recurring billing</h2>
          <p className="mt-1 text-sm text-muted">
            A draft copy of this invoice will be created automatically on each scheduled date.
          </p>
          <div className="mt-4">
            <RecurringConfigForm
              mode="dialog"
              invoiceId={invoiceId}
              frequency={schedule?.frequency}
              nextDueDate={schedule?.nextDueDate}
              scheduleId={schedule?.id}
              onSaved={() => setOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
