import Link from "next/link";
import type { Metadata } from "next";
import { InviosLogo } from "@/components/app/invios-logo";

export const metadata: Metadata = {
  title: "Refund Policy — Invios",
};

export default function RefundPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto max-w-[1400px] px-4 pb-0 pt-6 sm:px-6 lg:px-8">
        <div className="glass-panel flex items-center justify-between gap-4 rounded-[1.4rem] border border-black/8 px-4 py-3 subtle-shadow">
          <Link href="/"><InviosLogo /></Link>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="rounded-[0.85rem] px-4 py-2 text-sm font-medium text-muted-strong transition hover:bg-black/5 hover:text-foreground">Sign in</Link>
            <Link href="/pricing" className="rounded-[0.85rem] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]">Pricing</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Legal</p>
        <h1 className="display-text mt-4 text-4xl font-semibold text-foreground">Refund Policy</h1>
        <p className="mt-2 text-sm text-muted">Last updated: June 17, 2026</p>

        {/* Summary box */}
        <div className="mt-8 rounded-[var(--radius-md)] border-2 border-accent/20 bg-accent-soft/20 p-6">
          <p className="text-sm font-semibold text-foreground">The short version</p>
          <p className="mt-2 text-sm text-muted-strong leading-7">
            If you are unhappy with Invios Pro within the first 7 days of any monthly billing cycle, we will issue a full refund — no questions asked. After 7 days, charges for that billing period are non-refundable, but you can cancel at any time to avoid future charges.
          </p>
        </div>

        <div className="mt-10 space-y-8 text-sm leading-7 text-muted-strong">

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">1. 7-Day Refund Window</h2>
            <p>Invios offers a full refund on any monthly Pro subscription payment if requested within <strong>7 calendar days</strong> of the billing date. This applies to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your initial subscription payment when you first upgrade to Pro</li>
              <li>Each subsequent monthly renewal payment</li>
            </ul>
            <p>For example, if you are billed on the 1st of each month, you are eligible for a refund on that payment if you request it by the 8th of the same month.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">2. How to Request a Refund</h2>
            <p>To request a refund, contact us at <a href="mailto:billing@invios.online" className="text-accent underline underline-offset-4 hover:text-accent-strong">billing@invios.online</a> with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The email address associated with your Invios account</li>
              <li>The date of the payment you are requesting a refund for</li>
              <li>A brief reason (optional, but helps us improve)</li>
            </ul>
            <p>We will review your request and process the refund within <strong>5 business days</strong>. Refunds are returned to the original payment method. Depending on your bank or card issuer, the funds may take an additional 5–10 business days to appear.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">3. After the Refund Window</h2>
            <p>Once the 7-day window for a billing cycle has passed, that cycle's payment is non-refundable. However, you can cancel your subscription at any time through the customer portal, and you will not be charged for future billing cycles. Your Pro access remains active until the end of the current billing period even after cancellation.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">4. Exceptions</h2>
            <p>We reserve the right to decline refund requests in cases of:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Accounts found to have violated our <Link href="/terms" className="text-accent underline underline-offset-4 hover:text-accent-strong">Terms of Service</Link></li>
              <li>Excessive or repeated refund requests (more than one refund per 6-month period)</li>
              <li>Accounts where there is evidence of fraudulent activity</li>
            </ul>
            <p>In these cases, we will contact you to discuss the situation.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">5. Free Plan</h2>
            <p>The Free plan is provided at no cost and is not subject to any payment or refund terms. No charges are made for the Free plan, and no refunds are applicable.</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">6. Payment Processing</h2>
            <p>All payments are processed by Paddle, our third-party payment processor. Refunds are initiated by Invios through Paddle and are subject to Paddle's standard processing timelines. Currency conversion rates at the time of the original transaction apply — refunds are processed in the original currency (AED).</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-border bg-white p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground">7. Contact Us</h2>
            <p>For refund requests or billing questions, contact us at <a href="mailto:billing@invios.online" className="text-accent underline underline-offset-4 hover:text-accent-strong">billing@invios.online</a>. We aim to respond within 1 business day.</p>
          </div>

        </div>

        <div className="mt-12 flex flex-wrap gap-4 text-sm text-muted">
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">Terms of Service</Link>
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>
          <Link href="/pricing" className="underline underline-offset-4 hover:text-foreground">Pricing</Link>
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">Home</Link>
        </div>
      </section>
    </main>
  );
}
