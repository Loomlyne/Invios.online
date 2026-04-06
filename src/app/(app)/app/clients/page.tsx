import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Plus } from "lucide-react";
import { createClientAction } from "@/actions/clients";
import { ClientForm } from "@/components/clients/client-form";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { StatStrip } from "@/components/app/stat-strip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { listClients } from "@/lib/billing-data";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const search = typeof params.search === "string" ? params.search : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const showCreate = params.create === "1";
  const hasFilters = search.trim().length > 0 || status !== "all";
  const clients = await listClients({ search, status: status === "all" ? "all" : status as "lead" | "active" });
  const activeClients = clients.filter((client) => client.status === "active").length;

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
            { label: "Active", value: String(activeClients) },
            { label: "Leads", value: String(clients.length - activeClients) },
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
            <ClientForm action={createClientAction} submitLabel="Save client" initialValue={{ status: "lead" }} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search name or company"
              className="h-11 flex-1 rounded-[1rem] border border-border bg-white px-4 text-sm"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-11 rounded-[1rem] border border-border bg-white px-4 text-sm sm:w-40"
            >
              <option value="all">All statuses</option>
              <option value="lead">Lead</option>
              <option value="active">Active</option>
            </select>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
        </CardHeader>

        <CardContent className="grid gap-3">
          {clients.length === 0 ? (
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
          ) : (
            clients.map((client) => (
              <Link
                key={client.id}
                href={`/app/clients/${client.slug}` as Route}
                className="rounded-[1.25rem] border border-black/7 bg-[#FFF8EE] px-5 py-5 transition hover:border-[#D7C4A7] hover:bg-[#FFF4E3]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold text-foreground">{client.name}</p>
                      <ClientStatusBadge status={client.status} />
                    </div>
                    <p className="mt-2 text-sm text-muted-strong">
                      {client.company || "Independent client"}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      {[client.email, client.phone].filter(Boolean).join(" · ") || "No contact details yet"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    Open detail
                    <ArrowRight className="size-4" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
