"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Palette,
  Plus,
  ReceiptText,
  Settings2,
  StickyNote,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { bottomNavItems, fabMenuItems } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  "receipt-text": ReceiptText,
  "file-text": FileText,
  "users-round": UsersRound,
  "settings-2": Settings2,
  "user-round-plus": UserRoundPlus,
  palette: Palette,
  "sticky-note": StickyNote,
} as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const leftItems = bottomNavItems.slice(0, 2);
const rightItems = bottomNavItems.slice(2);

export function BottomNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-30 lg:hidden"
    >
      {/* Overlay */}
      {isOpen && (
        <div
          className="animate-fab-overlay fixed inset-0 z-30 bg-[#17120f]/30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Popup menu */}
      {isOpen && (
        <div className="animate-fab-popup relative z-40 mx-4 mb-3">
          <div className="glass-panel rounded-[var(--radius-card)] border border-black/8 p-4 subtle-shadow">
            <div className="grid grid-cols-3 gap-3">
              {fabMenuItems.map((item, i) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap];
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex flex-col items-center gap-1.5 rounded-[var(--radius-inner)] px-2 py-3 transition-colors hover:bg-surface-strong"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <Icon className="size-6 text-muted-strong" />
                    <span className="text-xs font-medium text-foreground">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="relative z-40 glass-panel border-t border-black/8 px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] subtle-shadow">
        <div className="flex items-stretch">
          {/* Left nav items */}
          {leftItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[0.85rem] py-2 transition-colors duration-150",
                  "min-h-[44px] min-w-[44px]",
                  active
                    ? "text-foreground"
                    : "text-muted hover:text-muted-strong",
                )}
              >
                <div className="relative flex items-center justify-center">
                  {active && (
                    <span className="absolute -top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />
                  )}
                  <Icon
                    className={cn(
                      "size-5",
                      active ? "text-accent-strong" : "text-muted",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] leading-none",
                    active
                      ? "font-semibold text-foreground"
                      : "font-medium text-muted",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Center FAB */}
          <div className="flex flex-1 items-center justify-center">
            <button
              onClick={() => setIsOpen((o) => !o)}
              aria-expanded={isOpen}
              aria-label="Quick actions"
              className={cn(
                "relative -mt-7 flex size-14 items-center justify-center rounded-full shadow-lg transition-all duration-300",
                isOpen
                  ? "bg-foreground"
                  : "bg-accent-strong",
              )}
            >
              <Plus
                className={cn(
                  "size-7 text-white transition-transform duration-300",
                  isOpen && "rotate-45",
                )}
              />
            </button>
          </div>

          {/* Right nav items */}
          {rightItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-[0.85rem] py-2 transition-colors duration-150",
                  "min-h-[44px] min-w-[44px]",
                  active
                    ? "text-foreground"
                    : "text-muted hover:text-muted-strong",
                )}
              >
                <div className="relative flex items-center justify-center">
                  {active && (
                    <span className="absolute -top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />
                  )}
                  <Icon
                    className={cn(
                      "size-5",
                      active ? "text-accent-strong" : "text-muted",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] leading-none",
                    active
                      ? "font-semibold text-foreground"
                      : "font-medium text-muted",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
