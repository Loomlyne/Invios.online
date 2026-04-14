import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { PortalDocumentRow } from "@/components/public/portal-document-row";
import {
  getClientByPortalToken,
  listInvoicesForClientPublic,
  listQuotationsForClientPublic,
} from "@/lib/billing-data";
import { getOwnerUserState, getPublicLogoUrl } from "@/lib/public-documents";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ portalToken: string }>;
}) {
  const { portalToken } = await params;
  const client = await getClientByPortalToken(portalToken);

  if (!client) {
    notFound();
  }

  const [ownerState, [invoices, quotations]] = await Promise.all([
    getOwnerUserState(client.userId),
    Promise.all([
      listInvoicesForClientPublic(client.id, client.userId),
      listQuotationsForClientPublic(client.id, client.userId),
    ]),
  ]);

  const logoUrl = await getPublicLogoUrl(ownerState.branding.logoPath);

  return (
    <PublicPageShell
      businessName={ownerState.profile.businessName}
      logoUrl={logoUrl}
      primaryColor={ownerState.branding.primaryColor || "var(--accent)"}
    >
      <h1 className="mb-6 mt-8 text-xl font-semibold text-foreground">Your Documents</h1>

      {invoices.length === 0 && quotations.length === 0 ? (
        <div className="py-16 text-center">
          <h2 className="text-lg font-medium text-foreground">No documents yet</h2>
          <p className="mt-2 text-sm text-muted">Documents shared with you will appear here.</p>
        </div>
      ) : (
        <>
          {quotations.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-base font-semibold text-foreground">Quotations</h2>
              <div className="divide-y divide-border">
                {quotations.map((q) => (
                  <PortalDocumentRow
                    key={q.id}
                    href={`/quotations/public/${q.shareToken}`}
                    documentNumber={q.quotationNumber}
                    status={q.status}
                    date={formatDateDisplay(q.quotationDate)}
                    total={formatCurrency(q.total, q.currency)}
                  />
                ))}
              </div>
            </section>
          )}

          {invoices.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-base font-semibold text-foreground">Invoices</h2>
              <div className="divide-y divide-border">
                {invoices.map((inv) => (
                  <PortalDocumentRow
                    key={inv.id}
                    href={`/invoices/public/${inv.shareToken}`}
                    documentNumber={inv.invoiceNumber}
                    status={inv.status}
                    date={formatDateDisplay(inv.issueDate)}
                    total={formatCurrency(inv.total, inv.currency)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </PublicPageShell>
  );
}
