"use client";

import { useRef } from "react";
import {
  User,
  Palette,
  Building2,
  SlidersHorizontal,
  Mail,
  Plug,
  CreditCard,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SettingsSection } from "@/lib/types";

interface SidebarItem {
  key: SettingsSection;
  label: string;
  Icon: LucideIcon;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: "profile", label: "Profile", Icon: User },
  { key: "branding", label: "Branding", Icon: Palette },
  { key: "business", label: "Business Info", Icon: Building2 },
  { key: "general", label: "General", Icon: SlidersHorizontal },
  { key: "emails", label: "Emails", Icon: Mail },
  { key: "integrations", label: "Integrations", Icon: Plug },
  { key: "billing", label: "Billing", Icon: CreditCard },
];

// Separator goes after index 4 (Emails) — between "core" and "system" sections
const SEPARATOR_AFTER_INDEX = 4;

interface SettingsSidebarProps {
  active: SettingsSection;
  onNavigate: (section: SettingsSection) => void;
}

export function SettingsSidebar({ active, onNavigate }: SettingsSidebarProps) {
  const navRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    const nav = navRef.current;
    if (!nav) return;
    const buttons = Array.from(nav.querySelectorAll<HTMLButtonElement>("button"));
    const idx = buttons.indexOf(e.currentTarget);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      buttons[(idx + 1) % buttons.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      buttons[(idx - 1 + buttons.length) % buttons.length]?.focus();
    }
  }

  return (
    <div
      ref={navRef}
      role="navigation"
      aria-label="Settings navigation"
      className="hidden lg:flex flex-col w-56 shrink-0 p-4 glass-panel border-r border-black/8 rounded-[var(--radius-md)]"
    >
      {SIDEBAR_ITEMS.map((item, index) => {
        const isActive = item.key === active;
        return (
          <div key={item.key}>
            {index === SEPARATOR_AFTER_INDEX && (
              <hr className="my-2 border-t border-border" />
            )}
            <button
              onClick={() => onNavigate(item.key)}
              onKeyDown={handleKeyDown}
              aria-current={isActive ? "page" : undefined}
              tabIndex={isActive ? 0 : -1}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-[var(--radius-md)] transition hover:bg-black/5",
                isActive
                  ? "bg-accent/10 text-accent-strong"
                  : "text-muted-strong",
              )}
            >
              <item.Icon
                className={cn(
                  "size-4 shrink-0",
                  isActive ? "text-accent" : "text-muted",
                )}
              />
              {item.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
