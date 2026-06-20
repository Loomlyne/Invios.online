import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, XCircle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
          <dd className="font-medium mt-1">Monthly · $15</dd>
        </div>
        <div className="rounded-[var(--radius-inner)] border border-border px-4 py-3">
          <dt className="text-muted">Next renewal</dt>
          <dd className="font-medium mt-1">{formatDate(sub.current_period_end)}</dd>
        </div>
      </dl>
    </div>
  );
}

function FreePlan() {
  return (
    <div className="space-y-4">
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
      <div className="rounded-[var(--radius-md)] border border-dashed border-accent/30 bg-accent-soft/30 p-5">
        <div className="flex items-start gap-3">
          <Zap className="size-5 text-accent mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Upgrade to Pro — $15/month</p>
            <p className="text-sm text-muted mt-1">
              Unlock unlimited invoices, PDF export, recurring invoices, email reminders, and full analytics.
            </p>
            <div className="mt-4">
              <Button asChild variant="accent" size="sm">
                <Link href="/pricing">View Pro Plan</Link>
              </Button>
            </div>
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
