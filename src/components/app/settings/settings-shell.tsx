"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Drawer } from "vaul";
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate = useCallback(
    (section: SettingsSection) => {
      setActiveSection(section);
      router.replace(`/app/settings?section=${section}`, { scroll: false });
    },
    [router],
  );

  const currentItem = SIDEBAR_ITEMS.find((s) => s.key === activeSection) ?? SIDEBAR_ITEMS[0];
  const CurrentIcon = currentItem.Icon;
  const currentLabel = currentItem.label;

  return (
    <div className="flex min-h-0 gap-6">
      <SettingsSidebar active={activeSection} onNavigate={navigate} />
      <main className="flex-1 min-w-0 pb-28 lg:pb-8">
        {/* Mobile section picker — lg:hidden */}
        <div className="lg:hidden mb-4">
          <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <Drawer.Trigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)] border border-border bg-surface text-sm font-medium">
                <span className="flex items-center gap-2">
                  <CurrentIcon className="size-4 text-accent" />
                  {currentLabel}
                </span>
                <ChevronDown className="size-4 text-muted" />
              </button>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 bg-black/40" />
              <Drawer.Content className="fixed inset-x-0 bottom-0 rounded-t-[var(--radius-lg)] bg-surface p-4">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted/30" />
                <p className="text-sm font-semibold mb-3 px-2">Settings</p>
                <div className="space-y-1">
                  {SIDEBAR_ITEMS.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        navigate(item.key);
                        setDrawerOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-[var(--radius-md)] transition",
                        activeSection === item.key
                          ? "bg-accent/10 text-accent-strong"
                          : "text-muted-strong hover:bg-black/5"
                      )}
                    >
                      <item.Icon className={cn("size-4", activeSection === item.key ? "text-accent" : "text-muted")} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
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
