import type { ReactNode } from "react";
import Link from "next/link";
import { AppSidebarNav } from "@/components/app/app-sidebar-nav";
import { BottomNav } from "@/components/app/bottom-nav";
import { InviosLogo } from "@/components/app/invios-logo";
import { PageTransition } from "@/components/app/page-transition";
import { UserAvatarMenu } from "@/components/app/user-avatar-menu";
import type { AppContext } from "@/lib/types";

export function AppShell({
  context,
  children,
}: {
  context: AppContext;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-grid">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-[var(--space-grid)] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="glass-panel sticky top-6 rounded-[var(--radius-card)] border border-black/8 px-4 py-5 subtle-shadow">
            <div className="border-b border-black/6 px-2 pb-4">
              <Link href="/app">
                <InviosLogo />
              </Link>
            </div>
            <div className="pt-4">
              <AppSidebarNav />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-grid)] pb-28 lg:pb-8">
          <header className="glass-panel sticky top-4 z-20 rounded-[var(--radius-card)] border border-black/8 px-4 py-3 subtle-shadow">
            <div className="flex items-center justify-between gap-4">
              <Link href="/app" className="inline-flex items-center gap-2">
                <InviosLogo markOnly className="h-5" />
                <span className="display-text text-base font-semibold leading-none">Invios</span>
              </Link>

              <UserAvatarMenu
                fullName={context.userState.profile.fullName}
                email={context.email ?? ""}
              />
            </div>
          </header>

          <main className="relative flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
