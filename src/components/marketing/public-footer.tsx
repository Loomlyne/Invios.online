import Link from "next/link";
import { InviosLogo } from "@/components/app/invios-logo";

export function PublicFooter() {
  return (
    <footer className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-[1.5rem] border border-black/8 bg-surface p-8 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/">
              <InviosLogo />
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-7 text-muted">
              Premium invoicing and quotations for freelancers, consultants, and small agencies. Create, send, and track branded documents in minutes.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Product</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-strong">
              <li><Link href="/pricing" className="transition hover:text-foreground">Pricing</Link></li>
              <li><Link href="/sign-in" className="transition hover:text-foreground">Sign in</Link></li>
              <li><Link href="/sign-up" className="transition hover:text-foreground">Create account</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Legal</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-strong">
              <li><Link href="/terms" className="transition hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="/privacy" className="transition hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/refund" className="transition hover:text-foreground">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Contact</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-strong">
              <li>
                <a href="mailto:support@invios.online" className="transition hover:text-foreground">support@invios.online</a>
              </li>
              <li>
                <a href="mailto:billing@invios.online" className="transition hover:text-foreground">billing@invios.online</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Invios. All rights reserved.</span>
          <span>Prices in AED. Payments processed securely by Paddle.</span>
        </div>
      </div>
    </footer>
  );
}
