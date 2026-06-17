import Link from "next/link";
import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import { InviosLogo } from "@/components/app/invios-logo";
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

export default async function PricingPage() {
  let userEmail: string | undefined;

  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      userEmail = data.user?.email ?? undefined;
    }
  } catch {
    // Public page — session is best-effort
  }

  const checkoutBase = process.env.PADDLE_CHECKOUT_URL ?? "#";
  const emailParam = userEmail ? `?customer_email=${encodeURIComponent(userEmail)}` : "";
  const checkoutHref = `${checkoutBase}${emailParam}`;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="mx-auto max-w-[1400px] px-4 pb-0 pt-6 sm:px-6 lg:px-8">
        <div className="glass-panel flex items-center justify-between gap-4 rounded-[1.4rem] border border-black/8 px-4 py-3 subtle-shadow">
          <Link href="/">
            <InviosLogo />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="rounded-[0.85rem] px-4 py-2 text-sm font-medium text-muted-strong transition hover:bg-black/5 hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-[0.85rem] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-[1400px] px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-20 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Transparent pricing
        </p>
        <h1 className="display-text mt-4 text-4xl font-semibold leading-none text-foreground sm:text-5xl lg:text-6xl">
          Start free. Upgrade when ready.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-strong">
          No credit card required to get started. Upgrade to Pro for unlimited invoicing and the full feature set.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="mx-auto max-w-[1400px] px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">

          {/* Free card */}
          <div className="flex flex-col rounded-[var(--radius-card)] border border-black/10 bg-surface p-7 subtle-shadow">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Free</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="display-text text-4xl font-semibold text-foreground">AED 0</span>
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
                href="/sign-up"
                className="block w-full rounded-[var(--radius-inner)] border border-black/10 bg-surface-strong px-5 py-3 text-center text-sm font-semibold text-foreground transition hover:border-border-brand hover:bg-[var(--bg-dark)]"
              >
                Create free account
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
                <span className="display-text text-4xl font-semibold text-foreground">AED 50</span>
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
              <a
                href={checkoutHref}
                className="block w-full rounded-[var(--radius-inner)] bg-accent px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-strong)]"
              >
                Upgrade to Pro
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* Footer note */}
      <section className="mx-auto max-w-[1400px] px-4 pb-10 pt-2 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign in
          </Link>
          {" · "}
          <Link href="/terms" className="font-medium text-foreground underline-offset-4 hover:underline">
            Terms
          </Link>
          {" · "}
          <Link href="/privacy" className="font-medium text-foreground underline-offset-4 hover:underline">
            Privacy
          </Link>
          {" · "}
          <Link href="/refund" className="font-medium text-foreground underline-offset-4 hover:underline">
            Refund policy
          </Link>
        </p>
      </section>
    </main>
  );
}
