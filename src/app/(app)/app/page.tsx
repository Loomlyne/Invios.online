import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CircleAlert } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SetupChecklist } from "@/components/app/setup-checklist";
import { StatStrip } from "@/components/app/stat-strip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppContext } from "@/lib/data";
import { cn } from "@/lib/utils";

function countBusinessFields(context: Awaited<ReturnType<typeof getAppContext>>) {
  const fields = [
    context.userState.profile.fullName,
    context.userState.profile.businessName,
    context.userState.profile.businessEmail,
    context.userState.profile.phone,
    context.userState.profile.address,
  ];

  return fields.filter((field) => field.trim().length > 0).length;
}

function countBrandAssets(context: Awaited<ReturnType<typeof getAppContext>>) {
  return [
    context.userState.branding.logoPath,
    context.userState.branding.signaturePath,
    context.userState.branding.signatureMode !== "none" ? "signature" : "",
    context.userState.branding.primaryColor,
  ].filter(Boolean).length;
}

export default async function AppHomePage() {
  const context = await getAppContext();
  const businessFieldCount = countBusinessFields(context);
  const brandAssetCount = countBrandAssets(context);
  const setupItems = context.setupProgress.items;
  const nextItem = setupItems.find((item) => !item.complete) ?? setupItems[setupItems.length - 1];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Dashboard"
        description={
          context.setupProgress.complete
            ? "Workspace is ready. Create invoices, manage clients, and export documents."
            : `Finish ${nextItem.label.toLowerCase()} to complete setup.`
        }
        actions={
          <Button asChild variant="accent">
            <Link href={context.setupProgress.complete ? ("/app/invoices" as Route) : nextItem.href}>
              {context.setupProgress.complete ? "Open invoices" : `Finish ${nextItem.label.toLowerCase()}`}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      >
        <StatStrip
          items={[
            { label: "Setup", value: `${context.setupProgress.percentage}%` },
            { label: "Identity", value: `${businessFieldCount}/5` },
            { label: "Brand", value: `${brandAssetCount}/4` },
            { label: "Currency", value: context.userState.settings.defaultCurrency },
          ]}
        />
      </PageHeader>

      {!context.setupProgress.complete ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Workspace readiness</CardTitle>
              <span className="text-sm font-medium text-muted">
                {context.setupProgress.completedCount}/{context.setupProgress.totalCount}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F3EBDD]">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300"
                style={{ width: `${context.setupProgress.percentage}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {setupItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "rounded-[1rem] border px-4 py-3 transition",
                  item.complete
                    ? "border-[#DCEBDD] bg-[#F6FBF6]"
                    : "border-border bg-[#FFFCF7] hover:border-[#D7C4A7] hover:bg-[#FFF8ED]",
                )}
              >
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {item.complete ? "Complete" : "Pending"}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        {[
          {
            title: "Invoices",
            body: "Create, edit, share, and export invoices.",
            href: "/app/invoices" as Route,
          },
          {
            title: "Quotations",
            body: "Scope work and convert accepted quotations into invoices.",
            href: "/app/quotations" as Route,
          },
          {
            title: "Clients",
            body: "Manage client records that anchor every document.",
            href: "/app/clients" as Route,
          },
          {
            title: "Settings",
            body: "Branding, defaults, and document template.",
            href: "/app/settings?section=defaults" as Route,
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-[1.1rem] border border-black/7 bg-surface px-4 py-4 transition hover:border-[#D7C4A7] hover:bg-[#FFF7EA]"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <ArrowRight className="size-4 text-muted" />
            </div>
            <p className="mt-1 text-sm leading-6 text-muted">{item.body}</p>
          </Link>
        ))}
      </section>

      {context.warnings.length > 0 ? (
        <Card className="border-black/10 bg-[#FCF7EE]">
          <CardHeader>
            <Badge variant="warning">Watchouts</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {context.warnings.map((warning) => (
              <div
                key={warning}
                className="flex items-start gap-3 rounded-[1rem] border border-[#E4D6BF] bg-white px-4 py-3 text-sm text-muted-strong"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-accent-strong" />
                <span>{warning}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <SetupChecklist context={context} />
    </div>
  );
}
