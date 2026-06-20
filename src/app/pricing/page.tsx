import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Check, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PublicNav } from "@/components/marketing/public-nav";
import { PublicFooter } from "@/components/marketing/public-footer";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pricing — Invios",
  description: "Simple, transparent pricing for freelancers and small businesses.",
};

const FREE_FEATURES = [
  { label: "Up to 3 invoices", included: true },
  { label: "Up to 2 clients", included: true },
  { label: "Quotations (up to 3)", included: true },
  { label: "Basic dashboard", included: true },
  { label: "PDF & PNG export", included: false },
  { label: "CSV export", included: false },
  { label: "Recurring invoices", included: false },
  { label: "Email reminders", included: false },
  { label: "Analytics & reports", included: false },
  { label: "Custom branding", included: false },
];

const PRO_FEATURES = [
  { label: "Unlimited invoices & quotations", included: true },
  { label: "Unlimited clients", included: true },
  { label: "PDF & PNG export", included: true },
  { label: "CSV export & data export", included: true },
  { label: "Recurring invoices", included: true },
  { label: "Automated email reminders", included: true },
  { label: "Analytics & revenue reports", included: true },
  { label: "Full custom branding", included: true },
  { label: "Version history", included: true },
  { label: "Priority support", included: true },
];

const FAQS = [
  {
    q: "What currency am I billed in?",
    a: "All Pro subscriptions are billed in US Dollars (USD) at $15 per month, inclusive of any applicable taxes. Payments are processed securely by Creem.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel your Pro subscription at any time from the customer portal. Your Pro access stays active until the end of the current billing period, then your account reverts to the Free plan.",
  },
  {
    q: "Do you offer refunds?",
    a: "We offer a full refund within 7 days of each monthly charge — no questions asked. See our Refund Policy for full details.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. The Free plan lets you create up to 3 invoices, 3 quotations, and 2 clients at no cost, with no credit card required.",
  },
];

export default async function PricingPage() {
  let isSignedIn = false;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      isSignedIn = Boolean(data.user);
    }
  } catch {
    // Public page — session is best-effort
  }

  return (
    <main className="min-h-screen overflow-hidden">
      <PublicNav cta="signup" />

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(202,138,4,0.16),transparent_30%)]" />
        <div className="relative mx-auto max-w-[1400px] px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-20 lg:px-8">
          <div className="flex justify-center">
            <Badge variant="accent">Transparent pricing</Badge>
          </div>
          <h1 className="display-text mt-5 text-4xl font-semibold leading-none text-foreground sm:text-5xl lg:text-6xl">
            Start free. Upgrade when ready.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-strong">
            No credit card required to get started. Upgrade to Pro for unlimited invoicing and the full feature set — $15/month, cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="mx-auto max-w-[1400px] px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">

          {/* Free card */}
          <div className="flex flex-col rounded-[var(--radius-card)] border border-black/10 bg-surface p-7 subtle-shadow">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Free</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="display-text text-4xl font-semibold text-foreground">Free</span>
              </div>
              <p className="mt-1.5 text-sm text-muted">Forever free — no card needed</p>
            </div>

            <ul className="mb-8 grid gap-2.5">
              {FREE_FEATURES.map(({ label, included }) => (
                <li key={label} className="flex items-start gap-2.5 text-sm">
                  {included ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  ) : (
                    <X className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                  )}
                  <span className={included ? "text-muted-strong" : "text-muted line-through"}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <Link
                href={isSignedIn ? "/app" : "/sign-up"}
                className="block w-full rounded-[var(--radius-inner)] border border-black/10 bg-surface-strong px-5 py-3 text-center text-sm font-semibold text-foreground transition hover:border-border-brand hover:bg-[var(--bg-dark)]"
              >
                {isSignedIn ? "Go to dashboard" : "Create free account"}
              </Link>
            </div>
          </div>

          {/* Pro card */}
          <div className="relative flex flex-col rounded-[var(--radius-card)] border-2 border-accent bg-surface p-7 soft-shadow">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3.5 py-1 text-xs font-semibold text-white shadow-sm">
              Most popular
            </span>

            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Pro</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="display-text text-4xl font-semibold text-foreground">$15</span>
                <span className="mb-0.5 text-sm text-muted">/month</span>
              </div>
              <p className="mt-1.5 text-sm text-muted">
                Billed monthly &middot;{" "}
                <span className="font-semibold text-accent">7-day refund policy</span>
              </p>
            </div>

            <ul className="mb-8 grid gap-2.5">
              {PRO_FEATURES.map(({ label }) => (
                <li key={label} className="flex items-start gap-2.5 text-sm text-muted-strong">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              {isSignedIn ? (
                <form action="/api/creem/checkout" method="post">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-inner)] bg-accent px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-strong)]"
                  >
                    Upgrade to Pro
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </button>
                </form>
              ) : (
                <a
                  href="/sign-up?next=/pricing"
                  className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-inner)] bg-accent px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-strong)]"
                >
                  Create account to upgrade
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

        </div>

        {/* Trust strip */}
        <div className="mx-auto mt-5 flex max-w-3xl items-center justify-center gap-2 rounded-[var(--radius-inner)] border border-border bg-surface-subtle px-5 py-3 text-center text-sm text-muted">
          <ShieldCheck className="size-4 shrink-0 text-accent" aria-hidden="true" />
          Secure checkout via Creem · Cancel anytime · 7-day money-back guarantee
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="display-text text-2xl font-semibold text-foreground sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="rounded-[var(--radius-inner)] border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-foreground">{q}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{a}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">
            Still have questions? Email{" "}
            <a href="mailto:support@invios.online" className="font-medium text-accent underline underline-offset-4 hover:text-accent-strong">
              support@invios.online
            </a>{" "}
            or read our{" "}
            <Link href="/refund" className="font-medium text-foreground underline-offset-4 hover:underline">
              Refund Policy
            </Link>
            {" · "}
            <Link href="/terms" className="font-medium text-foreground underline-offset-4 hover:underline">
              Terms
            </Link>
            {" · "}
            <Link href="/privacy" className="font-medium text-foreground underline-offset-4 hover:underline">
              Privacy
            </Link>
            .
          </p>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
