"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  FileText,
  FolderOpen,
  LayoutDashboard,
  NotebookPen,
  Palette,
  Plus,
  ReceiptText,
  Settings2,
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
  "sticky-note": NotebookPen,
  "credit-card": CreditCard,
  "folder-open": FolderOpen,
  "notebook-pen": NotebookPen,
} as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const leftItems = bottomNavItems.slice(0, 3);
const rightItems = bottomNavItems.slice(3);

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
      {isOpen && (
        <div
          className="animate-fab-overlay fixed inset-0 z-30 bg-foreground/25"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {isOpen && (
        <div className="animate-fab-popup relative z-40 mx-4 mb-3">
          <div className="rounded-3xl border border-[--border-brand]/50 bg-surface p-3 shadow-[0_8px_32px_-8px_rgba(23,18,15,0.12)]">
            <div className="grid grid-cols-3 gap-1">
              {fabMenuItems.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap];
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="group flex flex-col items-center justify-center gap-2 rounded-2xl px-2 py-4 transition-colors hover:bg-background"
                  >
                    <Icon
                      className="size-6 text-foreground transition-colors group-hover:text-accent-strong"
                      strokeWidth={1.5}
                    />
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-strong">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div
        className="relative z-40 bg-surface pb-[env(safe-area-inset-bottom)]"
        style={{ boxShadow: "0 -1px 0 0 var(--border-brand)" }}
      >
        <div className="flex h-16 items-center">
          <div className="flex flex-1 items-center justify-around">
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
                    "flex size-11 items-center justify-center transition-opacity duration-200",
                    isOpen && "opacity-40",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-6 transition-colors duration-200",
                      active && !isOpen
                        ? "text-accent-strong"
                        : "text-muted-strong",
                    )}
                    strokeWidth={active && !isOpen ? 2 : 1.5}
                  />
                </Link>
              );
            })}
          </div>

          <div className="flex w-16 items-center justify-center">
            <button
              onClick={() => setIsOpen((o) => !o)}
              aria-expanded={isOpen}
              aria-label="Quick actions"
              className={cn(
                "flex size-12 items-center justify-center rounded-full transition-all duration-200",
                isOpen ? "bg-foreground" : "bg-accent-strong hover:bg-accent",
              )}
            >
              <Plus
                className={cn(
                  "size-6 text-on-dark transition-transform duration-300",
                  isOpen && "rotate-45",
                )}
                strokeWidth={2}
              />
            </button>
          </div>

          <div className="flex flex-1 items-center justify-around">
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
                    "flex size-11 items-center justify-center transition-opacity duration-200",
                    isOpen && "opacity-40",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-6 transition-colors duration-200",
                      active && !isOpen
                        ? "text-accent-strong"
                        : "text-muted-strong",
                    )}
                    strokeWidth={active && !isOpen ? 2 : 1.5}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
