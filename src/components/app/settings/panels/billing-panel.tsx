import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Check, X, XCircle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRICING } from "@/lib/constants";
import type { SubscriptionData } from "@/lib/types";

type Subscription = NonNullable<SubscriptionData>;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isPeriodActive(end: string | null): boolean {
  if (!end) return false;
  return new Date(end) > new Date();
}

function ManageLink({ portalUrl }: { portalUrl: string }) {
  return (
    <form action={portalUrl} method="post" className="w-full sm:w-fit">
      <Button type="submit" variant="secondary" size="sm" className="w-full sm:w-fit">
        Manage Subscription
      </Button>
    </form>
  );
}

function PlanCard({ sub }: { sub: Subscription }) {
  const isTrialing = sub.status === "trialing";
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-white p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Current plan</p>
          <p className="text-lg font-semibold mt-1">Invios Pro</p>
          {isTrialing && <p className="text-sm text-muted mt-1">You are on a free trial.</p>}
        </div>
        <Badge variant="success">{isTrialing ? "Trial" : "Active"}</Badge>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 text-sm">
        <div className="rounded-[var(--radius-inner)] border border-border px-4 py-3">
          <dt className="text-muted">Billing cycle</dt>
          <dd className="font-medium mt-1">Monthly · {PRICING.currencySymbol}{PRICING.proMonthlyAmount}</dd>
        </div>
        <div className="rounded-[var(--radius-inner)] border border-border px-4 py-3">
          <dt className="text-muted">Next renewal</dt>
          <dd className="font-medium mt-1">{formatDate(sub.current_period_end)}</dd>
        </div>
      </dl>
    </div>
  );
}

const PLAN_FEATURES: { label: string; free: boolean; pro: boolean }[] = [
  { label: "Up to 3 invoices", free: true, pro: false },
  { label: "Unlimited invoices & quotations", free: false, pro: true },
  { label: "Up to 2 clients", free: true, pro: false },
  { label: "Unlimited clients", free: false, pro: true },
  { label: "Basic dashboard", free: true, pro: true },
  { label: "PDF & PNG export", free: false, pro: true },
  { label: "CSV export", free: false, pro: true },
  { label: "Recurring invoices", free: false, pro: true },
  { label: "Email reminders", free: false, pro: true },
  { label: "Analytics & reports", free: false, pro: true },
  { label: "Custom branding", free: false, pro: true },
];

function FreePlan() {
  return (
    <div className="space-y-5">
      {/* Current plan row */}
      <div className="rounded-[var(--radius-md)] border border-border bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Current plan</p>
            <p className="text-lg font-semibold mt-1">Free</p>
            <p className="text-sm text-muted mt-1">Up to 3 invoices and 2 clients.</p>
          </div>
          <Badge variant="default">Free</Badge>
        </div>
      </div>

      {/* Feature comparison */}
      <div className="rounded-[var(--radius-md)] border border-border overflow-hidden">
        <div className="grid grid-cols-3 bg-surface-subtle px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          <span>Feature</span>
          <span className="text-center">Free</span>
          <span className="text-center text-accent">Pro</span>
        </div>
        {PLAN_FEATURES.map(({ label, free, pro }) => (
          <div key={label} className="grid grid-cols-3 border-t border-border px-4 py-2.5 text-sm">
            <span className="text-muted-strong">{label}</span>
            <span className="flex justify-center">
              {free
                ? <Check className="size-4 text-accent" />
                : <X className="size-4 text-muted/40" />}
            </span>
            <span className="flex justify-center">
              {pro
                ? <Check className="size-4 text-accent" />
                : <X className="size-4 text-muted/40" />}
            </span>
          </div>
        ))}
      </div>

      {/* Upgrade CTA */}
      <div className="rounded-[var(--radius-md)] border-2 border-accent/25 bg-accent-soft/30 p-5">
        <div className="flex items-start gap-3">
          <Zap className="size-5 text-accent mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Upgrade to Pro — {PRICING.proMonthlyLabel}</p>
            <p className="text-sm text-muted mt-1">
              Billed monthly · 7-day money-back guarantee · Cancel anytime
            </p>
            <form action="/api/creem/checkout" method="post" className="mt-4">
              <Button type="submit" variant="accent" size="sm">
                <Zap className="size-3.5" />
                Upgrade to Pro
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActiveSubscription({ sub, portalUrl }: { sub: Subscription; portalUrl: string }) {
  return (
    <div className="space-y-4">
      <PlanCard sub={sub} />
      <ManageLink portalUrl={portalUrl} />
    </div>
  );
}

function CanceledWithAccess({ sub, portalUrl }: { sub: Subscription; portalUrl: string }) {
  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-md)] border border-amber-700/20 bg-amber-50 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="size-4 text-amber-800 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          Your subscription is canceled. Pro access continues until{" "}
          <span className="font-semibold">{formatDate(sub.current_period_end)}</span>.
        </p>
      </div>
      <PlanCard sub={sub} />
      <ManageLink portalUrl={portalUrl} />
    </div>
  );
}

function PastDue({ portalUrl }: { portalUrl: string }) {
  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-md)] border border-orange-700/20 bg-orange-50 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="size-4 text-orange-800 mt-0.5 shrink-0" />
        <p className="text-sm text-orange-800 font-medium">
          Payment failed — please update your payment method to keep Pro access.
        </p>
      </div>
      <ManageLink portalUrl={portalUrl} />
    </div>
  );
}

function AccessEnded() {
  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-md)] border border-red-700/20 bg-red-50 px-4 py-3 flex items-start gap-3">
        <XCircle className="size-4 text-red-800 mt-0.5 shrink-0" />
        <p className="text-sm text-red-800 font-medium">
          Your Pro access has ended. Resubscribe to unlock all features.
        </p>
      </div>
      <Button asChild variant="accent" size="sm">
        <Link href="/pricing">Resubscribe</Link>
      </Button>
    </div>
  );
}

export function BillingPanel({
  subscription,
  portalUrl,
}: {
  subscription: SubscriptionData;
  portalUrl: string;
}) {
  const sub = subscription;
  const status = sub?.status ?? "inactive";

  let content: ReactNode;

  if (!sub || status === "inactive") {
    content = <FreePlan />;
  } else if (status === "revoked") {
    content = <AccessEnded />;
  } else if (status === "active" || status === "trialing") {
    content = <ActiveSubscription sub={sub} portalUrl={portalUrl} />;
  } else if (status === "canceled") {
    content = isPeriodActive(sub.current_period_end)
      ? <CanceledWithAccess sub={sub} portalUrl={portalUrl} />
      : <AccessEnded />;
  } else if (status === "past_due") {
    content = <PastDue portalUrl={portalUrl} />;
  } else {
    content = <AccessEnded />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Billing</h2>
        <p className="text-sm text-muted mt-1">Manage your Invios plan and subscription.</p>
      </div>
      {content}
      <p className="text-xs text-muted">
        Questions?{" "}
        <a href="mailto:support@invios.online" className="underline underline-offset-4 hover:text-foreground">
          Contact support
        </a>
        {" · "}
        <Link href="/refund" className="underline underline-offset-4 hover:text-foreground">
          Refund policy
        </Link>
      </p>
    </div>
  );
}
