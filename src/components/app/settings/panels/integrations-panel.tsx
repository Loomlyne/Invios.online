"use client";

import { Plug } from "lucide-react";

export function IntegrationsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Integrations</h2>
        <p className="text-sm text-muted mt-1">Connect with third-party services.</p>
      </div>
      <div className="rounded-[var(--radius-md)] border border-border bg-white p-8 text-center">
        <Plug className="size-8 text-muted mx-auto mb-3" />
        <p className="text-sm font-medium">Integrations</p>
        <p className="text-sm text-muted mt-1">Third-party integrations are coming soon.</p>
      </div>
    </div>
  );
}
