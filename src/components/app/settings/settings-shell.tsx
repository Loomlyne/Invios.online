"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { SettingsSection, AppContext, SubscriptionData } from "@/lib/types";
import { SettingsSidebar, SIDEBAR_ITEMS } from "./settings-sidebar";
import { ProfilePanel } from "./panels/profile-panel";
import { BrandingPanel } from "./panels/branding-panel";
import { BusinessInfoPanel } from "./panels/business-info-panel";
import { GeneralPanel } from "./panels/general-panel";
import { EmailsPanel } from "./panels/emails-panel";
import { IntegrationsPanel } from "./panels/integrations-panel";
import { BillingPanel } from "./panels/billing-panel";

export function SettingsShell({
  context,
  initialSection,
  subscription,
  portalUrl,
}: {
  context: AppContext;
  initialSection: SettingsSection;
  subscription: SubscriptionData;
  portalUrl: string;
}) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const navigate = useCallback(
    (section: SettingsSection) => {
      setActiveSection(section);
      router.replace(`/app/settings?section=${section}`, { scroll: false });
    },
    [router],
  );

  // Auto-scroll the active pill into view on section change.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const activeEl = scroller.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeSection]);

  return (
    <div className="flex min-h-0 gap-6">
      <SettingsSidebar active={activeSection} onNavigate={navigate} />
      <main className="flex-1 min-w-0 pb-28 lg:pb-8">
        {/* Mobile section picker — horizontally scrollable pills */}
        <div className="lg:hidden mb-4 -mx-4">
          <div
            ref={scrollerRef}
            className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1"
            role="tablist"
            aria-label="Settings sections"
          >
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = activeSection === item.key;
              const Icon = item.Icon;
              return (
                <button
                  key={item.key}
                  role="tab"
                  aria-selected={isActive}
                  data-active={isActive}
                  onClick={() => navigate(item.key)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "border-transparent bg-foreground text-on-dark"
                      : "border-border bg-surface text-muted-strong hover:border-border-brand hover:bg-surface-subtle",
                  )}
                >
                  <Icon className={cn("size-4", isActive ? "text-accent" : "text-muted")} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel rendering */}
        {activeSection === "profile" && <ProfilePanel context={context} />}
        {activeSection === "branding" && <BrandingPanel context={context} />}
        {activeSection === "business" && <BusinessInfoPanel context={context} />}
        {activeSection === "general" && <GeneralPanel context={context} />}
        {activeSection === "emails" && <EmailsPanel context={context} />}
        {activeSection === "integrations" && <IntegrationsPanel />}
        {activeSection === "billing" && <BillingPanel subscription={subscription} portalUrl={portalUrl} />}
      </main>
    </div>
  );
}
