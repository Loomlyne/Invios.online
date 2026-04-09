"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  ReceiptText,
  Settings2,
  UsersRound,
} from "lucide-react";
import { bottomNavItems } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  "receipt-text": ReceiptText,
  "file-text": FileText,
  "users-round": UsersRound,
  "settings-2": Settings2,
} as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-30 lg:hidden"
    >
      <div className="glass-panel border-t border-black/8 px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] subtle-shadow">
        <div className="flex items-stretch">
          {bottomNavItems.map((item) => {
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
                    active ? "font-semibold text-foreground" : "font-medium text-muted",
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
