import Link from "next/link";
import type { Route } from "next";
import { MoveLeft } from "lucide-react";
import { DocumentBuilder } from "@/components/documents/document-builder";
import { Button } from "@/components/ui/button";
import { getAppContext } from "@/lib/data";
import { listClients } from "@/lib/billing-data";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const clientId = typeof params.clientId === "string" ? params.clientId : undefined;
  const [context, clients] = await Promise.all([
    getAppContext(),
    listClients({ status: "all" }),
  ]);

  if (clients.length === 0) {
    return (
      <div className="grid gap-4">
        <Button asChild variant="ghost" className="w-fit">
          <Link href={"/app/invoices" as Route}>
            <MoveLeft className="size-4" />
            Back to invoices
          </Link>
        </Button>
        <div className="rounded-[1.6rem] border border-dashed border-black/10 bg-[#FFF8EE] px-6 py-8">
          <p className="text-xl font-semibold text-foreground">Create a client before drafting an invoice.</p>
          <p className="mt-2 text-sm leading-7 text-muted-strong">
            The invoice builder needs a real client record so pricing, public share pages, and future portal flows stay anchored correctly.
          </p>
          <Button asChild variant="accent" className="mt-5">
            <Link href={"/app/clients" as Route}>Open clients</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <Button asChild variant="ghost" className="w-fit">
        <Link href={"/app/invoices" as Route}>
          <MoveLeft className="size-4" />
          Back to invoices
        </Link>
      </Button>
      <DocumentBuilder
        kind="invoice"
        context={context}
        clients={clients}
        submitLabel="Create invoice"
        numberValue={`${context.userState.settings.invoicePrefix}-NEXT`}
        initialValue={{
          clientId: clientId ?? clients[0]?.id,
          issueDate: new Date().toISOString().slice(0, 10),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          currency: context.userState.settings.defaultCurrency,
          taxRate: context.userState.settings.defaultTaxRate,
          discount: 0,
          language: context.userState.settings.defaultLanguage,
          notes: context.userState.settings.defaultNotes,
          terms: context.userState.settings.defaultTerms,
          trn: context.userState.profile.trn,
          status: "draft",
          invoiceType: "invoice",
        }}
      />
    </div>
  );
}
