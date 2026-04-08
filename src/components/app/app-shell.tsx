import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Settings2 } from "lucide-react";
import { AppSidebarNav } from "@/components/app/app-sidebar-nav";
import { PageTransition } from "@/components/app/page-transition";
import { SignOutButton } from "@/components/app/sign-out-button";
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
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 px-4 py-4 sm:px-6 lg:gap-6 lg:px-8 lg:py-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="glass-panel sticky top-6 rounded-[1.8rem] border border-black/8 px-4 py-5 subtle-shadow">
            <div className="border-b border-black/6 px-2 pb-4">
              <Link href="/app" className="display-text text-2xl font-semibold text-foreground">
                Invios
              </Link>
            </div>
            <div className="pt-4">
              <AppSidebarNav />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4 pb-28 lg:pb-8">
          <header className="glass-panel sticky top-4 z-20 rounded-[1.4rem] border border-black/8 px-4 py-3 subtle-shadow">
            <div className="flex items-center justify-between gap-4">
              <p className="truncate text-sm font-semibold text-foreground">
                {context.userState.profile.businessName || "Invios workspace"}
              </p>

              <div className="flex items-center gap-2">
                <Link
                  href={"/app/settings" as Route}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-white/80 text-muted-strong transition hover:bg-[#FFF8ED]"
                  aria-label="Settings"
                >
                  <Settings2 className="size-4" />
                </Link>
                <SignOutButton />
              </div>
            </div>

            <AppSidebarNav mode="mobile" />
          </header>

          <main className="relative flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </div>
  );
}
