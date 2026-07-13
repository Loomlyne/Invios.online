import type { ReactNode } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { AppSidebarNav } from "@/components/app/app-sidebar-nav";
import { BottomNav } from "@/components/app/bottom-nav";
import { InviosLogo } from "@/components/app/invios-logo";
import { PageTransition } from "@/components/app/page-transition";
import { UserAvatarMenu } from "@/components/app/user-avatar-menu";
import { PRICING } from "@/lib/constants";
import type { AppContext, SubscriptionData } from "@/lib/types";

export function AppShell({
  context,
  subscription,
  children,
}: {
  context: AppContext;
  subscription?: SubscriptionData;
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
            {(!subscription || subscription.status === "inactive") && (
              <div className="mt-4 border-t border-black/6 pt-4 px-2">
                <div className="rounded-[var(--radius-inner)] border border-accent/20 bg-accent-soft/20 p-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Zap className="size-3.5 text-accent shrink-0" />
                    <p className="text-xs font-semibold text-foreground">Upgrade to Pro</p>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Unlimited invoices, PDF export, recurring billing &amp; more.
                  </p>
                  <form action="/api/creem/checkout" method="post">
                    <button
                      type="submit"
                      className="w-full rounded-[var(--radius-inner)] bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                    >
                      Become Pro — {PRICING.proMonthlyShort}
                    </button>
                  </form>
                </div>
              </div>
            )}

            <div className="mt-4 border-t border-black/6 pt-4 px-2">
              <UserAvatarMenu
                fullName={context.userState.profile.fullName}
                email={context.email ?? ""}
                avatarUrl={context.avatarUrl}
              />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-grid)] pb-32 lg:pb-8">
          <header className="glass-panel sticky top-4 z-20 rounded-[var(--radius-card)] border border-black/8 px-4 py-3 subtle-shadow lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <Link href="/app" className="inline-flex items-center gap-2">
                <InviosLogo markOnly className="h-5" />
                <span className="display-text text-base font-semibold leading-none">Invios</span>
              </Link>

              <UserAvatarMenu
                fullName={context.userState.profile.fullName}
                email={context.email ?? ""}
                avatarUrl={context.avatarUrl}
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
