"use client";

import { Badge } from "@/components/ui/badge";
import { CreditCard, Receipt, Shield } from "lucide-react";

export function BillingPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Billing</h2>
        <p className="text-sm text-muted mt-1">
          Review your Invios plan. Billing changes are read-only until subscriptions launch.
        </p>
      </div>

      <div className="rounded-[var(--radius-md)] border border-border bg-white p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Current plan</p>
            <p className="text-lg font-semibold mt-1">Invios Early Access</p>
            <p className="text-sm text-muted mt-1">Full workspace access while billing is in preview.</p>
          </div>
          <Badge>Active</Badge>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div className="rounded-[var(--radius-inner)] border border-border px-4 py-3">
            <dt className="text-muted">Billing cycle</dt>
            <dd className="font-medium mt-1">Not billed yet</dd>
          </div>
          <div className="rounded-[var(--radius-inner)] border border-border px-4 py-3">
            <dt className="text-muted">Payment method</dt>
            <dd className="font-medium mt-1">None on file</dd>
          </div>
          <div className="rounded-[var(--radius-inner)] border border-border px-4 py-3 sm:col-span-2">
            <dt className="text-muted">Next invoice</dt>
            <dd className="font-medium mt-1">Available when paid plans launch in v2.0</dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-border bg-white p-4">
          <Receipt className="size-5 text-accent mb-2" />
          <p className="text-sm font-medium">Invoices & receipts</p>
          <p className="text-sm text-muted mt-1">
            Downloadable billing history will appear here for tax and finance records.
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border bg-white p-4">
          <Shield className="size-5 text-accent mb-2" />
          <p className="text-sm font-medium">Plan changes</p>
          <p className="text-sm text-muted mt-1">
            Upgrade, downgrade, and seat management stay disabled until Stripe billing ships.
          </p>
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-dashed border-border bg-surface/50 p-4 text-center">
        <CreditCard className="size-8 text-muted mx-auto mb-3" />
        <p className="text-sm font-medium">Self-serve billing is coming soon</p>
        <p className="text-sm text-muted mt-1">
          This panel is informational only — no charges can be made from settings today.
        </p>
      </div>
    </div>
  );
}
