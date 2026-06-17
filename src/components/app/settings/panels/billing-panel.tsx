import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, CreditCard, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AccessKeyCopyButton } from "./access-key-copy-button";

type SubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "revoked";

type Subscription = {
  status: SubscriptionStatus;
  current_period_end: string | null;
  access_key: string | null;
  plan: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isPeriodActive(current_period_end: string | null): boolean {
  if (!current_period_end) return false;
  return new Date(current_period_end) > new Date();
}

const portalUrl = process.env.POLAR_PORTAL_URL ?? "#";

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function ManageLink() {
  return (
    <Button asChild variant="secondary" size="sm" className="w-full sm:w-fit">
      <a href={portalUrl} target="_blank" rel="noopener noreferrer">
        Manage Subscription
      </a>
    </Button>
  );
}

function PlanCard({ sub }: { sub: Subscription }) {
  const isTrialing = sub.status === "trialing";
  const planLabel = sub.plan ?? "Invios Pro";

  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-white p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Current plan</p>
          <p className="text-lg font-semibold mt-1">{planLabel}</p>
          {isTrialing && (
            <p className="text-sm text-muted mt-1">
              You are on a free trial.
            </p>
          )}
        </div>
        <Badge variant="success">{isTrialing ? "Trial" : "Active"}</Badge>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 text-sm">
        <div className="rounded-[var(--radius-inner)] border border-border px-4 py-3">
          <dt className="text-muted">Renews on</dt>
          <dd className="font-medium mt-1">{formatDate(sub.current_period_end)}</dd>
        </div>
        {sub.access_key && (
          <div className="rounded-[var(--radius-inner)] border border-border px-4 py-3 sm:col-span-2">
            <dt className="text-muted mb-2">Access key</dt>
            <dd className="flex items-center gap-3">
              <code className="flex-1 font-mono text-xs bg-surface rounded-[var(--radius-inner)] border border-border px-3 py-2 truncate">
                {sub.access_key}
              </code>
              <AccessKeyCopyButton accessKey={sub.access_key} />
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/* ─── State renderers ─────────────────────────────────────────────────────── */

function NoSubscription() {
  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-md)] border border-dashed border-border bg-surface/50 p-8 text-center">
        <CreditCard className="size-10 text-muted mx-auto mb-4" />
        <p className="text-sm font-semibold">No active subscription</p>
        <p className="text-sm text-muted mt-1 mb-5">
          Unlock unlimited invoicing, quotations, and branding with Invios Pro.
        </p>
        <Button asChild variant="primary" size="sm">
          <Link href="/pricing">Get Invios Pro</Link>
        </Button>
      </div>
    </div>
  );
}

function ActiveSubscription({ sub }: { sub: Subscription }) {
  return (
    <div className="space-y-4">
      <PlanCard sub={sub} />
      <ManageLink />
    </div>
  );
}

function CanceledWithAccess({ sub }: { sub: Subscription }) {
  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-md)] border border-amber-700/20 bg-amber-50 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="size-4 text-amber-800 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          Your subscription is canceled. Access continues until{" "}
          <span className="font-semibold">{formatDate(sub.current_period_end)}</span>.
        </p>
      </div>
      <PlanCard sub={sub} />
      <ManageLink />
    </div>
  );
}

function PastDue({ sub }: { sub: Subscription }) {
  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-md)] border border-orange-700/20 bg-orange-50 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="size-4 text-orange-800 mt-0.5 shrink-0" />
        <p className="text-sm text-orange-800 font-medium">
          Payment failed — please update your payment method to keep access.
        </p>
      </div>
      {sub.plan && (
        <div className="rounded-[var(--radius-md)] border border-border bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Current plan</p>
              <p className="text-lg font-semibold mt-1">{sub.plan}</p>
            </div>
            <Badge variant="warning">Past due</Badge>
          </div>
        </div>
      )}
      <ManageLink />
    </div>
  );
}

function AccessEnded() {
  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-md)] border border-red-700/20 bg-red-50 px-4 py-3 flex items-start gap-3">
        <XCircle className="size-4 text-red-800 mt-0.5 shrink-0" />
        <p className="text-sm text-red-800 font-medium">
          Your access has ended. Resubscribe to continue using Invios Pro.
        </p>
      </div>
      <Button asChild variant="primary" size="sm">
        <Link href="/pricing">Resubscribe</Link>
      </Button>
    </div>
  );
}

/* ─── Main panel ──────────────────────────────────────────────────────────── */

export async function BillingPanel() {
  const supabase = await createSupabaseServerClient();

  let sub: Subscription | null = null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("subscriptions")
        .select("status, current_period_end, access_key, plan")
        .eq("user_id", user.id)
        .maybeSingle<Subscription>();

      sub = data ?? null;
    }
  }

  const status = sub?.status ?? "inactive";

  let content: ReactNode;

  if (!sub || status === "inactive") {
    content = <NoSubscription />;
  } else if (status === "active" || status === "trialing") {
    content = <ActiveSubscription sub={sub} />;
  } else if (status === "canceled") {
    if (isPeriodActive(sub.current_period_end)) {
      content = <CanceledWithAccess sub={sub} />;
    } else {
      content = <AccessEnded />;
    }
  } else if (status === "past_due") {
    content = <PastDue sub={sub} />;
  } else {
    // revoked or any unknown status
    content = <AccessEnded />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Billing</h2>
        <p className="text-sm text-muted mt-1">
          Manage your Invios subscription and access key.
        </p>
      </div>
      {content}
    </div>
  );
}
