"use client";

import { CreditCard } from "lucide-react";

export function BillingPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Billing</h2>
        <p className="text-sm text-muted mt-1">Manage your plan and payment details.</p>
      </div>
      <div className="rounded-[var(--radius-md)] border border-border bg-white p-8 text-center">
        <CreditCard className="size-8 text-muted mx-auto mb-3" />
        <p className="text-sm font-medium">Billing</p>
        <p className="text-sm text-muted mt-1">Plan and billing management is coming soon.</p>
      </div>
    </div>
  );
}
