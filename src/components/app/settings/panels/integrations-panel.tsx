"use client";

import { Badge } from "@/components/ui/badge";
import { Plug, Webhook, Mail, CreditCard } from "lucide-react";

const PLANNED_INTEGRATIONS = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Collect card payments and reconcile payouts with invoices.",
    icon: CreditCard,
    status: "planned" as const,
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Trigger automations when invoices, quotes, or clients change.",
    icon: Webhook,
    status: "planned" as const,
  },
  {
    id: "resend",
    name: "Resend",
    description: "Deliver branded transactional email from your own domain.",
    icon: Mail,
    status: "planned" as const,
  },
];

export function IntegrationsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Integrations</h2>
        <p className="text-sm text-muted mt-1">
          Connect payment, automation, and messaging providers. v2.0 will unlock live connections here.
        </p>
      </div>

      <div className="rounded-[var(--radius-md)] border border-dashed border-border bg-surface/50 p-4 text-sm text-muted">
        <div className="flex items-start gap-3">
          <Plug className="size-5 shrink-0 text-accent mt-0.5" />
          <p>
            Integrations are display-only for now. Each card below shows what will ship in the Operator Power milestone without exposing broken connect flows.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {PLANNED_INTEGRATIONS.map((integration) => {
          const Icon = integration.icon;
          return (
            <div
              key={integration.id}
              className="flex items-start justify-between gap-4 rounded-[var(--radius-md)] border border-border bg-white p-4"
            >
              <div className="flex gap-3">
                <div className="flex size-10 items-center justify-center rounded-[var(--radius-inner)] bg-surface text-accent">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{integration.name}</p>
                  <p className="text-sm text-muted mt-1">{integration.description}</p>
                </div>
              </div>
              <Badge variant="default">Planned</Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}
