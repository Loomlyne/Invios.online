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
import { appNavItems } from "@/lib/constants";
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

export function AppSidebarNav({ mode = "both" }: { mode?: "desktop" | "mobile" | "both" }) {
  const pathname = usePathname();

  return (
    <>
      {mode !== "mobile" ? (
        <nav className="hidden lg:flex lg:flex-col lg:gap-2">
          {appNavItems.map((item) => {
            const Icon = iconMap[item.icon];
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-[1.15rem] px-4 py-3 text-sm transition",
                  active
                    ? "bg-[#17120F] text-[#FFF9F0] shadow-[0_16px_40px_rgba(23,18,15,0.16)]"
                    : "text-muted-strong hover:bg-black/5",
                )}
              >
                <Icon className={cn("size-4", active ? "text-accent" : "text-muted")} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}

      {mode !== "desktop" ? (
        <nav className="mt-2 lg:hidden">
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {appNavItems.map((item) => {
              const Icon = iconMap[item.icon];
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition",
                    active
                      ? "bg-foreground/8 font-medium text-foreground"
                      : "text-muted-strong hover:bg-foreground/4",
                  )}
                >
                  <Icon className={cn("size-3.5", active ? "text-accent-strong" : "text-muted")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </>
  );
}
