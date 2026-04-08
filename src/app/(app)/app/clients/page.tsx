import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";
import { createClientAction } from "@/actions/clients";
import { ClientForm } from "@/components/clients/client-form";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { StatStrip } from "@/components/app/stat-strip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataViewToolbar, DataViewRenderer, clientConfig } from "@/components/data-view";
import { listClients } from "@/lib/billing-data";
import { clientStatuses } from "@/lib/billing";
import type { ClientStatus } from "@/lib/billing";
import type { ViewMode } from "@/components/data-view";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const search = typeof params.search === "string" ? params.search : "";
  const rawStatus = typeof params.status === "string" ? params.status : "all";
  const status = rawStatus === "all" || (clientStatuses as readonly string[]).includes(rawStatus)
    ? rawStatus
    : "all";
  const showCreate = params.create === "1";
  const createStatus = (typeof params.status === "string" && (clientStatuses as readonly string[]).includes(params.status))
    ? (params.status as ClientStatus)
    : "lead";
  const rawView = typeof params.view === "string" ? params.view : "kanban";
  const view: ViewMode = ["list", "kanban", "table"].includes(rawView)
    ? (rawView as ViewMode)
    : "kanban";
  const hasFilters = search.trim().length > 0 || status !== "all";

  const clients = await listClients({
    search,
    status: status === "all" ? "all" : (status as ClientStatus),
  });
  const activeClients = clients.filter((c) => c.status === "active").length;
  const leadClients = clients.filter((c) => c.status === "lead").length;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Clients"
        description="Manage the client records that anchor every quotation and invoice."
        actions={
          <Button asChild variant="accent">
            <Link href={"?create=1" as Route}>
              Add client
              <Plus className="size-4" />
            </Link>
          </Button>
        }
      >
        <StatStrip
          items={[
            { label: "Total", value: String(clients.length) },
            { label: "Leads", value: String(leadClients) },
            { label: "Active", value: String(activeClients) },
          ]}
        />
      </PageHeader>

      {showCreate ? (
        <Card id="create-client">
          <CardHeader>
            <CardTitle>New client</CardTitle>
            <CardDescription className="mt-1">
              Add a billing relationship that quotations and invoices can target.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClientForm action={createClientAction} submitLabel="Save client" initialValue={{ status: createStatus }} />
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader>
          <DataViewToolbar
            searchPlaceholder={clientConfig.searchPlaceholder}
            statusOptions={clientConfig.statusOptions}
            currentSearch={search}
            currentStatus={status}
            currentView={view}
            extraParams={showCreate ? { create: "1" } : undefined}
          />
        </CardHeader>
        <CardContent>
          <DataViewRenderer
            items={clients}
            configKey="client"
            view={view}
            emptyState={
              <EmptyState
                title={hasFilters ? "No clients match the current filters." : "No clients yet."}
                description={
                  hasFilters
                    ? "Clear the search or status filter to see all clients."
                    : "Add the first client to unlock quotations and invoices."
                }
                actions={
                  <>
                    {!showCreate ? (
                      <Button asChild variant="accent">
                        <Link href={"?create=1" as Route}>Add client</Link>
                      </Button>
                    ) : null}
                    {hasFilters ? (
                      <Button asChild variant="secondary">
                        <Link href={"/app/clients" as Route}>Clear filters</Link>
                      </Button>
                    ) : null}
                  </>
                }
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
