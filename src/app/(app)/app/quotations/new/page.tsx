import Link from "next/link";
import type { Route } from "next";
import { MoveLeft } from "lucide-react";
import { DocumentBuilder } from "@/components/documents/document-builder";
import { Button } from "@/components/ui/button";
import { listClients } from "@/lib/billing-data";
import { getAppContext } from "@/lib/data";

export default async function NewQuotationPage({
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
          <Link href={"/app/quotations" as Route}>
            <MoveLeft className="size-4" />
            Back to quotations
          </Link>
        </Button>
        <div className="rounded-[var(--radius-card)] border border-dashed border-black/10 bg-[#FFF8EE] px-6 py-8">
          <p className="text-xl font-semibold text-foreground">Create a client before drafting a quotation.</p>
          <p className="mt-2 text-sm leading-7 text-muted-strong">
            Quotations inherit the selected client record so acceptance and later conversion into invoices stay trustworthy.
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
        <Link href={"/app/quotations" as Route}>
          <MoveLeft className="size-4" />
          Back to quotations
        </Link>
      </Button>
      <DocumentBuilder
        kind="quotation"
        context={context}
        clients={clients}
        submitLabel="Create quotation"
        numberValue={`${context.userState.settings.quotationPrefix}-NEXT`}
        initialValue={{
          clientId: clientId ?? clients[0]?.id,
          quotationDate: new Date().toISOString().slice(0, 10),
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          validityDays: 30,
          currency: context.userState.settings.defaultCurrency,
          taxRate: context.userState.settings.defaultTaxRate,
          discount: 0,
          language: context.userState.settings.defaultLanguage,
          notes: context.userState.settings.defaultNotes,
          terms: context.userState.settings.defaultTerms,
          trn: context.userState.profile.trn,
          status: "draft",
        }}
      />
    </div>
  );
}
