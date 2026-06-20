import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  FileText,
  Globe,
  Palette,
  Repeat,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { InstallPromptButton } from "@/components/app/install-prompt";
import { PublicNav } from "@/components/marketing/public-nav";
import { PublicFooter } from "@/components/marketing/public-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      <PublicNav />

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(202,138,4,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(28,25,23,0.08),transparent_18%)]" />
        <div className="relative mx-auto max-w-[1400px] px-4 pb-10 pt-12 sm:px-6 lg:px-8 lg:pb-16">
          <div className="animate-enter space-y-7">
            <Badge variant="accent">Invoicing &amp; quotations for AED businesses</Badge>
            <div className="max-w-3xl space-y-5">
              <h1 className="display-text text-5xl font-semibold leading-none text-balance text-foreground sm:text-6xl lg:text-7xl">
                Send invoices that actually look worth paying.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-strong">
                Invios is a premium billing workspace for freelancers, consultants, and small agencies. Manage clients, build quotations, send branded invoices, export PDFs, and track what you are owed — all from one clean console.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="accent" size="lg">
                <Link href="/sign-up">
                  Start free — no card needed
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
            <p className="text-sm text-muted">
              Free plan available · Pro from <span className="font-semibold text-foreground">AED 50/month</span> · Cancel anytime
            </p>
          </div>

          {/* Product preview */}
          <div className="mt-12 lg:mt-16">
            <AppPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <Badge variant="default">Everything you need to bill</Badge>
          <h2 className="display-text mt-4 text-3xl font-semibold text-foreground sm:text-4xl">
            One workspace for the whole billing workflow.
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-strong">
            From the first quotation to the paid invoice, Invios keeps every document branded, consistent, and easy to share.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-[var(--radius-card)] border border-border bg-white/84 p-6 subtle-shadow">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent-soft">
                <Icon className="size-5 text-accent" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="rounded-[2rem] border border-black/10 bg-[#FCF8F1] px-6 py-10 sm:px-10">
          <div className="max-w-2xl">
            <Badge variant="default">How it works</Badge>
            <h2 className="display-text mt-4 text-3xl font-semibold text-foreground sm:text-4xl">
              From signup to sent in three steps.
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ step, title, text }) => (
              <div key={step}>
                <span className="display-text text-3xl font-semibold text-accent">{step}</span>
                <h3 className="mt-3 text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-strong">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center">
            <Badge variant="accent">Simple, transparent pricing</Badge>
          </div>
          <h2 className="display-text mt-4 text-3xl font-semibold text-foreground sm:text-4xl">
            Start free. Upgrade when you are ready.
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-strong">
            No credit card to begin. Pro unlocks unlimited documents and the full feature set for AED 50/month.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-[var(--radius-card)] border border-black/10 bg-surface p-7 subtle-shadow">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Free</p>
            <div className="mt-3 flex items-end gap-1">
              <span className="display-text text-4xl font-semibold text-foreground">AED 0</span>
            </div>
            <p className="mt-1.5 text-sm text-muted">Forever free — no card needed</p>
            <ul className="mb-8 mt-6 grid gap-2.5">
              {["Up to 3 invoices", "Up to 3 quotations", "Up to 2 clients", "Basic dashboard"].map((label) => (
                <li key={label} className="flex items-start gap-2.5 text-sm text-muted-strong">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
            <Link
              href="/sign-up"
              className="mt-auto block w-full rounded-[var(--radius-inner)] border border-black/10 bg-surface-strong px-5 py-3 text-center text-sm font-semibold text-foreground transition hover:border-border-brand hover:bg-[var(--bg-dark)]"
            >
              Create free account
            </Link>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col rounded-[var(--radius-card)] border-2 border-accent bg-surface p-7 soft-shadow">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3.5 py-1 text-xs font-semibold text-white shadow-sm">
              Most popular
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Pro</p>
            <div className="mt-3 flex items-end gap-1">
              <span className="display-text text-4xl font-semibold text-foreground">AED 50</span>
              <span className="mb-0.5 text-sm text-muted">/month</span>
            </div>
            <p className="mt-1.5 text-sm text-muted">
              Billed monthly · <span className="font-semibold text-accent">7-day refund</span>
            </p>
            <ul className="mb-8 mt-6 grid gap-2.5">
              {["Unlimited invoices & quotations", "Unlimited clients", "PDF, PNG & CSV export", "Recurring invoices & reminders", "Analytics & custom branding"].map((label) => (
                <li key={label} className="flex items-start gap-2.5 text-sm text-muted-strong">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
            <Link
              href="/pricing"
              className="mt-auto flex w-full items-center justify-center gap-2 rounded-[var(--radius-inner)] bg-accent px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-strong)]"
            >
              See Pro details
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-5 flex max-w-3xl items-center justify-center gap-2 rounded-[var(--radius-inner)] border border-border bg-surface-subtle px-5 py-3 text-center text-sm text-muted">
          <ShieldCheck className="size-4 shrink-0 text-accent" aria-hidden="true" />
          Secure checkout via Creem · Prices in AED · Cancel anytime · 7-day money-back guarantee
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="display-text text-3xl font-semibold text-foreground sm:text-4xl">
            Common questions
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="rounded-[var(--radius-inner)] border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold text-foreground">{q}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-[1400px] px-4 pb-16 pt-2 sm:px-6 lg:px-8 lg:pb-20">
        <div className="rounded-[2rem] border border-black/10 bg-[#1C1917] px-6 py-10 text-[#F8F4EE] soft-shadow sm:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="display-text text-3xl font-semibold sm:text-4xl">
                Ready to send your first branded invoice?
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#DDD4C6]">
                Create a free account in under a minute. Add Invios to your home screen and run it like a native app.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="accent" size="lg">
                <Link href="/sign-up">
                  Get started free
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <InstallPromptButton variant="inverse" />
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

const FEATURES = [
  {
    icon: FileText,
    title: "Branded invoices",
    text: "Build clean, professional invoices with your logo, TRN, bank details, and line items — ready to send in seconds.",
  },
  {
    icon: Send,
    title: "Quotations that convert",
    text: "Send quotations clients can review on a public link, then convert accepted quotes into invoices with one click.",
  },
  {
    icon: Users,
    title: "Client records",
    text: "Keep every client's details, history, and outstanding balance organised in one place.",
  },
  {
    icon: Globe,
    title: "Shareable PDFs & links",
    text: "Every document exports to a pixel-perfect PDF or PNG and shares as a branded public page.",
  },
  {
    icon: Repeat,
    title: "Recurring & reminders",
    text: "Automate recurring invoices and send polite payment reminders so you get paid on time.",
  },
  {
    icon: BarChart3,
    title: "Analytics & exports",
    text: "Track revenue, outstanding, and overdue at a glance, and export your data to CSV whenever you need it.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Set up your business",
    text: "Add your business name, TRN, logo, and bank details once. They flow into every document automatically.",
  },
  {
    step: "2",
    title: "Create a document",
    text: "Add a client, list your line items, and Invios builds a branded invoice or quotation instantly.",
  },
  {
    step: "3",
    title: "Send and get paid",
    text: "Share a PDF or public link, then track status from sent to paid right inside your dashboard.",
  },
];

const FAQS = [
  {
    q: "Who is Invios for?",
    a: "Freelancers, consultants, solo operators, and small agencies who need to send professional invoices and quotations in AED without the overhead of heavy accounting software.",
  },
  {
    q: "What does it cost?",
    a: "The Free plan is AED 0 forever. Pro is AED 50/month, billed monthly through Creem, and unlocks unlimited documents plus the full feature set. Cancel anytime.",
  },
  {
    q: "Can I get a refund?",
    a: "Yes — we offer a full refund within 7 days of any monthly charge, no questions asked. See our Refund Policy for details.",
  },
  {
    q: "Is my data secure?",
    a: "Your data is stored with row-level security, encrypted in transit and at rest. We never sell your data. Read our Privacy Policy to learn more.",
  },
];

function AppPreview() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-black/10 bg-white/90 shadow-[var(--shadow-lg)]">
      {/* Browser bar */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-subtle px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#E5C9A0]" />
        <span className="size-2.5 rounded-full bg-[#E0D6C5]" />
        <span className="size-2.5 rounded-full bg-[#D7C4A7]" />
        <div className="ml-3 flex-1 rounded-full border border-border bg-white px-3 py-1 text-center text-xs text-muted">
          app.invios.online
        </div>
      </div>

      <div className="grid sm:grid-cols-[180px_1fr]">
        {/* Sidebar */}
        <aside className="hidden flex-col gap-1 border-r border-border bg-surface-subtle p-4 sm:flex">
          <p className="display-text px-2 text-lg font-semibold">Invios</p>
          <nav className="mt-4 space-y-1 text-sm">
            <span className="block rounded-lg bg-accent-soft px-3 py-2 font-medium text-accent-strong">Dashboard</span>
            <span className="block rounded-lg px-3 py-2 text-muted-strong">Invoices</span>
            <span className="block rounded-lg px-3 py-2 text-muted-strong">Quotations</span>
            <span className="block rounded-lg px-3 py-2 text-muted-strong">Clients</span>
            <span className="block rounded-lg px-3 py-2 text-muted-strong">Settings</span>
          </nav>
        </aside>

        {/* Main */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="display-text text-xl font-semibold text-foreground">Dashboard</h3>
            <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white">New invoice</span>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: "Outstanding", value: "AED 12,400" },
              { label: "Paid (June)", value: "AED 28,900" },
              { label: "Overdue", value: "AED 1,250" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-white p-3">
                <p className="text-[0.65rem] uppercase tracking-wide text-muted">{stat.label}</p>
                <p className="mt-1 text-sm font-semibold text-foreground sm:text-base">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Invoice list */}
          <div className="mt-5 overflow-hidden rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border bg-surface-subtle px-4 py-2.5 text-[0.7rem] font-medium uppercase tracking-wide text-muted">
              <span>Recent invoices</span>
              <span>Status</span>
            </div>
            {[
              { id: "INV-1042", client: "Najm Studio", amount: "AED 4,500", status: "Paid", tone: "text-success bg-emerald-50" },
              { id: "INV-1041", client: "Oasis Retail", amount: "AED 7,900", status: "Sent", tone: "text-accent-strong bg-accent-soft" },
              { id: "INV-1040", client: "Dunes Co.", amount: "AED 1,250", status: "Overdue", tone: "text-danger bg-red-50" },
            ].map((row) => (
              <div key={row.id} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{row.client}</p>
                  <p className="text-xs text-muted">{row.id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">{row.amount}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.tone}`}>{row.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-muted">
            <Palette className="size-3.5 text-accent" aria-hidden="true" />
            Branded with your logo, colours, and bank details on every document.
          </div>
        </div>
      </div>
    </div>
  );
}
