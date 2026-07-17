"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Plus,
  ReceiptText,
  Settings2,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Route } from "next";

/**
 * Invios — mobile-first bottom navigation.
 *
 * Business: Invios is a premium invoicing & quotation workspace for freelancers,
 * consultants, and small agencies. The operator's primary loop is:
 *   1. Add a client
 *   2. Draft a quote → send → client accepts
 *   3. Convert to invoice → collect payment → export PDF
 *
 * Five primary destinations + a center FAB that fans out the three "create"
 * actions (invoice, quote, client). Expenses/projects were removed because no
 * such routes exist in the app.
 */

function isActivePath(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface NavItem {
  key: string;
  label: string;
  href: Route;
  Icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { key: "dashboard", label: "Home", href: "/app", Icon: LayoutDashboard },
  { key: "invoices", label: "Invoices", href: "/app/invoices", Icon: ReceiptText },
];

const rightItems: NavItem[] = [
  { key: "clients", label: "Clients", href: "/app/clients", Icon: UsersRound },
  { key: "settings", label: "Settings", href: "/app/settings", Icon: Settings2 },
];

interface FabAction {
  key: string;
  label: string;
  href: Route;
  Icon: typeof LayoutDashboard;
}

const fabActions: FabAction[] = [
  { key: "new-invoice", label: "Invoice", href: "/app/invoices/new", Icon: ReceiptText },
  { key: "new-quote", label: "Quote", href: "/app/quotations/new", Icon: FileText },
  { key: "new-client", label: "Client", href: "/app/clients", Icon: UserRoundPlus },
];

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
      {/* FAB overlay */}
      {isOpen && (
        <div
          className="animate-fab-overlay fixed inset-0 z-30 bg-foreground/30 backdrop-blur-[2px]"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* FAB action sheet */}
      {isOpen && (
        <div className="animate-fab-popup relative z-40 mx-3 mb-3">
          <div className="rounded-[var(--radius-lg)] border border-[--border-brand]/40 bg-surface p-3 shadow-[0_-8px_40px_-8px_rgba(23,18,15,0.18)]">
            <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              Create
            </p>
            <div className="grid grid-cols-3 gap-1">
              {fabActions.map((item) => {
                const Icon = item.Icon;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="group flex flex-col items-center justify-center gap-2.5 rounded-[var(--radius-md)] px-2 py-4 transition-colors hover:bg-background"
                  >
                    <span className="flex size-11 items-center justify-center rounded-full bg-accent/12 transition-colors group-hover:bg-accent/20">
                      <Icon
                        className="size-5 text-accent-strong transition-transform group-hover:scale-105"
                        strokeWidth={1.75}
                      />
                    </span>
                    <span className="text-xs font-medium text-muted-strong">
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
      <div className="relative z-40 border-t border-[--border-brand]/60 bg-surface/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex h-[4.25rem] max-w-md items-stretch">
          {/* Left slot */}
          {navItems.map((item) => (
            <NavLink key={item.key} item={item} active={isActivePath(pathname, item.href)} dim={isOpen} />
          ))}

          {/* Center FAB */}
          <div className="flex flex-1 items-center justify-center">
            <button
              onClick={() => setIsOpen((o) => !o)}
              aria-expanded={isOpen}
              aria-label="Quick actions"
              className={cn(
                "flex size-12 items-center justify-center rounded-full shadow-lg transition-all duration-200",
                isOpen
                  ? "bg-foreground text-on-dark"
                  : "bg-accent text-[#1C1917] shadow-[0_8px_24px_var(--accent-glow)] hover:-translate-y-0.5",
              )}
            >
              <Plus
                className={cn("size-6 transition-transform duration-300", isOpen && "rotate-45")}
                strokeWidth={2.25}
              />
            </button>
          </div>

          {/* Right slot */}
          {rightItems.map((item) => (
            <NavLink key={item.key} item={item} active={isActivePath(pathname, item.href)} dim={isOpen} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ item, active, dim }: { item: NavItem; active: boolean; dim: boolean }) {
  const Icon = item.Icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 px-1 transition-opacity duration-200",
        dim && "opacity-40",
      )}
    >
      <span
        className={cn(
          "flex h-8 items-center justify-center rounded-full px-3 transition-all duration-200",
          active ? "bg-accent/12" : "bg-transparent",
        )}
      >
        <Icon
          className={cn(
            "size-5 transition-colors duration-200",
            active ? "text-accent-strong" : "text-muted",
          )}
          strokeWidth={active ? 2 : 1.6}
        />
      </span>
      <span
        className={cn(
          "text-[10px] font-medium leading-none transition-colors duration-200",
          active ? "text-accent-strong" : "text-muted",
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}
