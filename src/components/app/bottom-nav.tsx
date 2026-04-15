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
      {/* Overlay */}
      {isOpen && (
        <div
          className="animate-fab-overlay fixed inset-0 z-30 bg-[#17120f]/30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Action palette popup */}
      {isOpen && (
        <div className="animate-fab-popup relative z-40 mx-6 mb-3">
          <div className="rounded-[2.5rem] border border-white/70 bg-surface/90 p-4 shadow-[0_24px_48px_rgba(23,18,15,0.12),0_8px_16px_rgba(23,18,15,0.04)] backdrop-blur-2xl">
            <div className="grid grid-cols-3 gap-2">
              {fabMenuItems.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap];
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="group flex flex-col items-center justify-center gap-2.5 rounded-3xl p-4 transition-colors hover:bg-[#f8f4ee]"
                  >
                    <div className="flex size-[52px] items-center justify-center rounded-[18px] border border-black/[0.03] bg-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:border-accent/20 group-hover:shadow-md">
                      <Icon
                        className="size-6 text-foreground transition-colors group-hover:text-accent"
                        strokeWidth={1.5}
                      />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-foreground">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar — inset floating pill */}
      <div className="relative z-40 mx-6 mb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex h-[76px] items-center justify-between rounded-[2.5rem] border border-white/70 bg-surface/60 px-3 shadow-[0_8px_32px_rgba(23,18,15,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl">
          {/* Left nav items */}
          <div className="flex w-[40%] items-center justify-between">
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
                    "relative flex size-11 items-center justify-center rounded-full transition-all duration-300",
                    isOpen && "opacity-40",
                    !isOpen && "hover:bg-white/40",
                  )}
                >
                  {active && !isOpen && (
                    <span className="absolute top-0.5 h-[5px] w-[5px] rounded-full bg-accent shadow-[0_0_8px_rgba(202,138,4,0.6)]" />
                  )}
                  <Icon
                    className={cn(
                      "size-[26px] transition-colors duration-300",
                      active && !isOpen ? "text-foreground" : "text-muted",
                    )}
                    strokeWidth={1.5}
                  />
                </Link>
              );
            })}
          </div>

          {/* Center void for FAB */}
          <div className="w-16" />

          {/* Right nav items */}
          <div className="flex w-[40%] items-center justify-between">
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
                    "relative flex size-11 items-center justify-center rounded-full transition-all duration-300",
                    isOpen && "opacity-40",
                    !isOpen && "hover:bg-white/40",
                  )}
                >
                  {active && !isOpen && (
                    <span className="absolute top-0.5 h-[5px] w-[5px] rounded-full bg-accent shadow-[0_0_8px_rgba(202,138,4,0.6)]" />
                  )}
                  <Icon
                    className={cn(
                      "size-[26px] transition-colors duration-300",
                      active && !isOpen ? "text-foreground" : "text-muted",
                    )}
                    strokeWidth={1.5}
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Center FAB — positioned over the bar */}
        <button
          onClick={() => setIsOpen((o) => !o)}
          aria-expanded={isOpen}
          aria-label="Quick actions"
          className={cn(
            "absolute bottom-[6px] left-1/2 flex size-16 -translate-x-1/2 items-center justify-center rounded-full transition-all duration-300 hover:scale-105",
            isOpen
              ? "bg-foreground shadow-[0_16px_32px_-4px_rgba(23,18,15,0.5)] ring-4 ring-surface/40"
              : "bg-accent-strong shadow-[0_12px_24px_-4px_rgba(202,138,4,0.4)]",
          )}
        >
          <Plus
            className={cn(
              "size-7 text-white transition-transform duration-300",
              isOpen && "rotate-45",
            )}
            strokeWidth={1.5}
          />
        </button>
      </div>
    </nav>
  );
}
