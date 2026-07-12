"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gauge,
  UsersRound,
  CreditCard,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { key: "overview", label: "Overview", href: "/admin", icon: Gauge },
  { key: "accounts", label: "Accounts", href: "/admin/accounts", icon: UsersRound },
  { key: "billing", label: "Billing", href: "/admin/billing", icon: CreditCard },
  { key: "logs", label: "Logs & audit", href: "/admin/logs", icon: ScrollText },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-[1.15rem] px-4 py-3 text-sm transition",
              active
                ? "bg-[#17120F] text-on-dark shadow-[0_16px_40px_rgba(23,18,15,0.16)]"
                : "text-muted-strong hover:bg-black/5",
            )}
          >
            <Icon className={cn("size-4", active ? "text-accent" : "text-muted")} />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
