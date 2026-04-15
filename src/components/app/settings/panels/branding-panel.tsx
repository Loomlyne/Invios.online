"use client";

import { Section } from "../shared/settings-section";
import { SaveButton } from "../shared/save-button";

export function BrandingPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Branding</h2>
          <p className="text-sm text-muted mt-1">Manage your logo, colors, fonts, and document identity.</p>
        </div>
        <div className="hidden lg:block">
          <SaveButton isDirty={false} onSave={async () => {}} />
        </div>
      </div>
      <Section title="Branding" description="Branding settings will be available here.">
        <p className="text-sm text-muted">Content will be added in a future phase.</p>
      </Section>
      {/* Mobile sticky save */}
      <div className="lg:hidden sticky bottom-16 bg-surface border-t border-border px-4 py-3">
        <SaveButton isDirty={false} onSave={async () => {}} />
      </div>
    </div>
  );
}
