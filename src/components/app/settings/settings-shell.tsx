"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SettingsSection, AppContext } from "@/lib/types";
import { SettingsSidebar } from "./settings-sidebar";

export function SettingsShell({
  context,
  initialSection,
}: {
  context: AppContext;
  initialSection: SettingsSection;
}) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  const navigate = useCallback(
    (section: SettingsSection) => {
      setActiveSection(section);
      router.replace(`/app/settings?section=${section}`, { scroll: false });
    },
    [router],
  );

  return (
    <div className="flex min-h-0 gap-6">
      <SettingsSidebar active={activeSection} onNavigate={navigate} />
      <main className="flex-1 min-w-0 pb-28 lg:pb-8">
        {/* Placeholder: panels wired in Plan 03 */}
        <div className="rounded-[var(--radius-md)] border border-border bg-white p-6">
          <p className="text-muted text-sm">
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} settings will be available here.
          </p>
        </div>
      </main>
    </div>
  );
}
