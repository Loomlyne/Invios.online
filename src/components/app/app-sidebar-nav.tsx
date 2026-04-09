"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Palette,
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
  "palette": Palette,
  "settings-2": Settings2,
} as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {appNavItems.map((item) => {
        const Icon = iconMap[item.icon as keyof typeof iconMap];
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
