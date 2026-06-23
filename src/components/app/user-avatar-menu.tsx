"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, Palette, Settings2, User } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  // Filter out empty segments so an empty or whitespace-only name yields "?"
  // instead of crashing on parts[0][0] (e.g. users who never set a full name).
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const menuItems = [
  { label: "Profile", href: "/app/settings" as Route, icon: User },
  { label: "Branding", href: "/app/branding" as Route, icon: Palette },
  { label: "Settings", href: "/app/settings" as Route, icon: Settings2 },
] as const;

export function UserAvatarMenu({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="size-10 rounded-full bg-accent/15 text-sm font-semibold text-accent-strong transition hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label="Account menu"
        >
          {getInitials(fullName)}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[220px] rounded-[1rem] border border-border bg-white p-1.5 shadow-[var(--shadow-md)] animate-in fade-in-0 zoom-in-95"
        >
          <DropdownMenu.Label className="px-3.5 py-2.5">
            <p className="text-sm font-semibold text-primary">{fullName}</p>
            <p className="text-xs text-muted">{email}</p>
          </DropdownMenu.Label>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          {menuItems.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              className="flex cursor-pointer items-center gap-3 rounded-[0.7rem] px-3.5 py-2.5 text-sm text-primary outline-none transition-colors hover:bg-surface-subtle focus:bg-surface-subtle"
              onSelect={() => router.push(item.href)}
            >
              <item.icon className="size-4 text-muted-strong" />
              {item.label}
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-[0.7rem] px-3.5 py-2.5 text-sm outline-none transition-colors hover:bg-surface-subtle focus:bg-surface-subtle",
              "text-[#8D3D2E]",
            )}
            disabled={isPending}
            onSelect={() => {
              startTransition(async () => {
                await signOutAction();
                router.replace("/sign-in");
              });
            }}
          >
            <LogOut className="size-4" />
            {isPending ? "Signing out…" : "Log out"}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
