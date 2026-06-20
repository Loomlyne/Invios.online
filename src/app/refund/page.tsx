import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/marketing/public-nav";
import { PublicFooter } from "@/components/marketing/public-footer";

export const metadata: Metadata = {
  title: "Refund Policy — Invios",
};

const TOC = [
  { id: "refund-window", label: "7-Day Refund Window" },
  { id: "how-to-request", label: "How to Request a Refund" },
  { id: "after-window", label: "After the Refund Window" },
  { id: "exceptions", label: "Exceptions" },
  { id: "free-plan", label: "Free Plan" },
  { id: "payment-processing", label: "Payment Processing" },
  { id: "contact", label: "Contact Us" },
];

export default function RefundPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <PublicNav cta="pricing" />

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(202,138,4,0.12),transparent_32%)]" />
        <div className="relative mx-auto max-w-[1400px] px-4 pb-10 pt-14 sm:px-6 lg:px-8">
          <Badge variant="accent">Legal</Badge>
          <h1 className="display-text mt-4 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Refund Policy
          </h1>
          <p className="mt-3 text-sm text-muted">Last updated: June 17, 2026</p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-strong">
            We want you to be happy with Invios Pro. Here is exactly how refunds work.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-14">

          {/* Sticky ToC */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">On this page</p>
              <nav className="mt-4 space-y-0.5">
                {TOC.map(({ id, label }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="block rounded-lg px-3 py-1.5 text-sm text-muted-strong transition hover:bg-black/5 hover:text-foreground"
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <div className="mt-8 lg:mt-0">
            {/* Summary box */}
            <div className="rounded-[var(--radius-card)] border-2 border-accent/25 bg-accent-soft p-6 sm:p-8">
              <p className="text-sm font-semibold text-foreground">The short version</p>
              <p className="mt-2 text-sm leading-7 text-muted-strong">
                If you are unhappy with Invios Pro within the first 7 days of any monthly billing cycle, we will issue a full refund — no questions asked. After 7 days, charges for that billing period are non-refundable, but you can cancel at any time to avoid future charges.
              </p>
            </div>

            {/* Sections */}
            <div className="mt-6 divide-y divide-border rounded-[var(--radius-card)] border border-border bg-surface">

              <section id="refund-window" className="p-6 sm:p-8">
                <h2 className="text-base font-semibold text-foreground">1. 7-Day Refund Window</h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-muted-strong">
                  <p>Invios offers a full refund on any monthly Pro subscription payment if requested within <strong className="text-foreground">7 calendar days</strong> of the billing date. This applies to:</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Your initial subscription payment when you first upgrade to Pro</li>
                    <li>Each subsequent monthly renewal payment</li>
                  </ul>
                  <p>For example, if you are billed on the 1st of each month, you are eligible for a refund on that payment if you request it by the 8th of the same month.</p>
                </div>
              </section>

              <section id="how-to-request" className="p-6 sm:p-8">
                <h2 className="text-base font-semibold text-foreground">2. How to Request a Refund</h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-muted-strong">
                  <p>To request a refund, contact us at <a href="mailto:billing@invios.online" className="text-accent underline underline-offset-4 hover:text-accent-strong">billing@invios.online</a> with:</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>The email address associated with your Invios account</li>
                    <li>The date of the payment you are requesting a refund for</li>
                    <li>A brief reason (optional, but helps us improve)</li>
                  </ul>
                  <p>We will review your request and process the refund within <strong className="text-foreground">5 business days</strong>. Refunds are returned to the original payment method. Depending on your bank or card issuer, the funds may take an additional 5–10 business days to appear.</p>
                </div>
              </section>

              <section id="after-window" className="p-6 sm:p-8">
                <h2 className="text-base font-semibold text-foreground">3. After the Refund Window</h2>
                <p className="mt-3 text-sm leading-7 text-muted-strong">Once the 7-day window for a billing cycle has passed, that cycle's payment is non-refundable. However, you can cancel your subscription at any time through the customer portal, and you will not be charged for future billing cycles. Your Pro access remains active until the end of the current billing period even after cancellation.</p>
              </section>

              <section id="exceptions" className="p-6 sm:p-8">
                <h2 className="text-base font-semibold text-foreground">4. Exceptions</h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-muted-strong">
                  <p>We reserve the right to decline refund requests in cases of:</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Accounts found to have violated our <Link href="/terms" className="text-accent underline underline-offset-4 hover:text-accent-strong">Terms of Service</Link></li>
                    <li>Excessive or repeated refund requests (more than one refund per 6-month period)</li>
                    <li>Accounts where there is evidence of fraudulent activity</li>
                  </ul>
                  <p>In these cases, we will contact you to discuss the situation.</p>
                </div>
              </section>

              <section id="free-plan" className="p-6 sm:p-8">
                <h2 className="text-base font-semibold text-foreground">5. Free Plan</h2>
                <p className="mt-3 text-sm leading-7 text-muted-strong">The Free plan is provided at no cost and is not subject to any payment or refund terms. No charges are made for the Free plan, and no refunds are applicable.</p>
              </section>

              <section id="payment-processing" className="p-6 sm:p-8">
                <h2 className="text-base font-semibold text-foreground">6. Payment Processing</h2>
                <p className="mt-3 text-sm leading-7 text-muted-strong">All payments are processed by Creem, our third-party payment processor. Refunds are initiated by Invios through Creem and are subject to Creem's standard processing timelines. Currency conversion rates at the time of the original transaction apply — refunds are processed in the original currency (USD).</p>
              </section>

              <section id="contact" className="p-6 sm:p-8">
                <h2 className="text-base font-semibold text-foreground">7. Contact Us</h2>
                <p className="mt-3 text-sm leading-7 text-muted-strong">For refund requests or billing questions, contact us at <a href="mailto:billing@invios.online" className="text-accent underline underline-offset-4 hover:text-accent-strong">billing@invios.online</a>. We aim to respond within 1 business day.</p>
              </section>

            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
