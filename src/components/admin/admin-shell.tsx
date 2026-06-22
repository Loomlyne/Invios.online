import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { InviosLogo } from "@/components/app/invios-logo";
import { AdminNav } from "@/components/admin/admin-nav";

/**
 * Operator admin chrome. Deliberately distinct from the customer app shell
 * (dark "OPERATOR CONSOLE" banner + shield) so it is always obvious you are in
 * the privileged area looking at cross-account data.
 */
export function AdminShell({
  adminEmail,
  children,
}: {
  adminEmail: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-grid">
      {/* Unmistakable operator banner */}
      <div className="flex items-center justify-center gap-2 bg-[#17120F] px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-on-dark">
        <ShieldCheck className="size-3.5 text-accent" />
        OPERATOR CONSOLE — you are viewing data across all accounts
      </div>

      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-[var(--space-grid)] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="glass-panel sticky top-6 rounded-[var(--radius-card)] border border-black/8 px-4 py-5 subtle-shadow">
            <div className="border-b border-black/6 px-2 pb-4">
              <Link href="/admin" className="inline-flex items-center gap-2">
                <InviosLogo markOnly className="h-6" />
                <span className="display-text text-lg font-semibold leading-none">
                  Admin
                </span>
              </Link>
            </div>
            <div className="pt-4">
              <AdminNav />
            </div>
            <div className="mt-4 border-t border-black/6 px-2 pt-4">
              <Link
                href="/app"
                className="flex items-center gap-2 rounded-[var(--radius-inner)] px-2 py-2 text-xs font-medium text-muted-strong transition hover:bg-black/5"
              >
                <ArrowLeft className="size-3.5" />
                Back to app
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-grid)] pb-12">
          <header className="glass-panel sticky top-4 z-20 rounded-[var(--radius-card)] border border-black/8 px-4 py-3 subtle-shadow">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2">
                <ShieldCheck className="size-4 text-accent" />
                <span className="display-text text-base font-semibold leading-none">
                  Operator Console
                </span>
              </div>
              <span className="max-w-[220px] truncate text-sm text-muted" title={adminEmail}>
                {adminEmail}
              </span>
            </div>
          </header>

          <main className="relative flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
