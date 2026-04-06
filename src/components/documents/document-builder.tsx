"use client";

import { useState, useTransition } from "react";
import type { FormEvent, ReactNode } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  createInvoiceAction,
  updateInvoiceAction,
} from "@/actions/invoices";
import {
  createQuotationAction,
  updateQuotationAction,
} from "@/actions/quotations";
import { DocumentLayoutDiagnostics } from "@/components/documents/document-layout-diagnostics";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  ClientRecord,
  DocumentKind,
  DocumentLineItem,
  InvoiceFormInput,
} from "@/lib/billing";
import { createLineItem } from "@/lib/billing-utils";
import { buildInvoicePreviewData } from "@/lib/preview";
import type { ActionState, AppContext } from "@/lib/types";

const initialState: ActionState = { status: "idle" };

type BuilderInitialValue = {
  id?: string;
  clientId?: string;
  issueDate?: string;
  dueDate?: string;
  quotationDate?: string;
  expiryDate?: string;
  validityDays?: number;
  currency?: string;
  taxRate?: number;
  discount?: number;
  language?: InvoiceFormInput["language"];
  notes?: string;
  terms?: string;
  trn?: string;
  lineItems?: DocumentLineItem[];
  status?: string;
  invoiceType?: InvoiceFormInput["invoiceType"];
};

export function DocumentBuilder({
  kind,
  context,
  clients,
  submitLabel,
  numberValue,
  initialValue,
}: {
  kind: DocumentKind;
  context: AppContext;
  clients: ClientRecord[];
  submitLabel: string;
  numberValue: string;
  initialValue?: BuilderInitialValue;
}) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>(initialState);
  const [isPending, startTransition] = useTransition();
  const [clientId, setClientId] = useState(initialValue?.clientId ?? clients[0]?.id ?? "");
  const [currency, setCurrency] = useState(initialValue?.currency ?? context.userState.settings.defaultCurrency);
  const [taxRate, setTaxRate] = useState(String(initialValue?.taxRate ?? context.userState.settings.defaultTaxRate));
  const [discount, setDiscount] = useState(String(initialValue?.discount ?? 0));
  const [language, setLanguage] = useState(initialValue?.language ?? context.userState.settings.defaultLanguage);
  const [notes, setNotes] = useState(initialValue?.notes ?? context.userState.settings.defaultNotes);
  const [terms, setTerms] = useState(initialValue?.terms ?? context.userState.settings.defaultTerms);
  const [trn, setTrn] = useState(initialValue?.trn ?? context.userState.profile.trn);
  const [statusValue, setStatusValue] = useState<string>(initialValue?.status ?? "draft");
  const [invoiceType, setInvoiceType] = useState(initialValue?.invoiceType ?? "invoice");
  const [primaryDate, setPrimaryDate] = useState(
    (kind === "invoice" ? initialValue?.issueDate : initialValue?.quotationDate) ?? isoDateFromNow(0),
  );
  const [secondaryDate, setSecondaryDate] = useState(
    (kind === "invoice" ? initialValue?.dueDate : initialValue?.expiryDate) ?? isoDateFromNow(kind === "invoice" ? 7 : 30),
  );
  const [validityDays, setValidityDays] = useState(String(initialValue?.validityDays ?? 30));
  const [lineItems, setLineItems] = useState<DocumentLineItem[]>(
    initialValue?.lineItems?.length ? initialValue.lineItems : [createLineItem({ description: "" })],
  );

  const selectedClient = clients.find((client) => client.id === clientId) ?? clients[0];

  const preview = buildInvoicePreviewData(context.userState, {
    kind,
    title: kind === "invoice" ? "Invoice" : "Quotation",
    invoiceNumber: numberValue,
    numberLabel: kind === "invoice" ? "Invoice no." : "Quotation no.",
    statusLabel: formatStatus(statusValue),
    issueDate: primaryDate,
    dueDate: secondaryDate,
    issueDateLabel: kind === "invoice" ? "Issue date" : "Quotation date",
    dueDateLabel: kind === "invoice" ? "Due date" : "Expiry date",
    currency,
    language,
    taxRate: Number(taxRate),
    discount: Number(discount),
    terms,
    notes,
    trn,
    recipientName: selectedClient?.name ?? "Client",
    recipientCompany: selectedClient?.company ?? "",
    recipientEmail: selectedClient?.email ?? "",
    recipientPhone: selectedClient?.phone ?? "",
    recipientAddress: selectedClient?.address ?? "",
    lineItems,
  });

  const previewNode = <InvoicePreview preview={preview} mode="page" />;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const submitAction = kind === "invoice"
        ? initialValue?.id
          ? updateInvoiceAction
          : createInvoiceAction
        : initialValue?.id
          ? updateQuotationAction
          : createQuotationAction;
      const result = await submitAction(initialState, formData);
      setState(result);

      if (result.status === "success" && result.redirectTo) {
        router.push(result.redirectTo as Route);
      }
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_480px]">
      <Card className="overflow-hidden p-0">
        <CardHeader className="border-b border-black/8 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge variant="accent">{kind === "invoice" ? "Invoice builder" : "Quotation builder"}</Badge>
              <CardTitle className="mt-3">
                {kind === "invoice"
                  ? "Build the branded invoice before it ever leaves the workspace."
                  : "Shape the quotation, then convert accepted work into an invoice later."}
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl">
                The builder, view page, public link, and PDF export all reuse this same presentation contract.
              </CardDescription>
            </div>
            <div className="xl:hidden">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary">Preview</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">{previewNode}</DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-5 py-5 sm:px-6">
          <form onSubmit={handleSubmit} className="grid gap-6">
            {initialValue?.id ? <input type="hidden" name="id" value={initialValue.id} /> : null}
            <input type="hidden" name="lineItemsJson" value={JSON.stringify(lineItems)} />

            <section className="grid gap-4">
              <SectionTitle>Document frame</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Client" htmlFor="clientId">
                  <select
                    id="clientId"
                    name="clientId"
                    value={clientId}
                    onChange={(event) => setClientId(event.target.value)}
                    className="flex h-12 w-full rounded-[1rem] border border-border bg-white px-4 text-sm"
                  >
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}{client.company ? ` · ${client.company}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Status" htmlFor="status">
                  <select
                    id="status"
                    name="status"
                    value={statusValue}
                    onChange={(event) => setStatusValue(event.target.value)}
                    className="flex h-12 w-full rounded-[1rem] border border-border bg-white px-4 text-sm"
                  >
                    {(kind === "invoice"
                      ? [
                          ["draft", "Draft"],
                          ["sent", "Sent"],
                        ]
                      : [
                          ["draft", "Draft"],
                          ["sent", "Sent"],
                          ["accepted", "Accepted"],
                          ["rejected", "Rejected"],
                          ["expired", "Expired"],
                        ]
                    ).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>

                {kind === "invoice" ? (
                  <Field label="Invoice type" htmlFor="invoiceType">
                    <select
                      id="invoiceType"
                      name="invoiceType"
                      value={invoiceType}
                      onChange={(event) => setInvoiceType(event.target.value as InvoiceFormInput["invoiceType"])}
                      className="flex h-12 w-full rounded-[1rem] border border-border bg-white px-4 text-sm"
                    >
                      <option value="invoice">Invoice</option>
                      <option value="tax_invoice">Tax invoice</option>
                    </select>
                  </Field>
                ) : (
                  <Field label="Validity days" htmlFor="validityDays">
                    <Input
                      id="validityDays"
                      name="validityDays"
                      type="number"
                      min={1}
                      value={validityDays}
                      onChange={(event) => setValidityDays(event.target.value)}
                    />
                  </Field>
                )}

                <Field label={kind === "invoice" ? "Issue date" : "Quotation date"} htmlFor="primaryDate">
                  <Input
                    id="primaryDate"
                    name={kind === "invoice" ? "issueDate" : "quotationDate"}
                    type="date"
                    value={primaryDate}
                    onChange={(event) => setPrimaryDate(event.target.value)}
                  />
                </Field>

                <Field label={kind === "invoice" ? "Due date" : "Expiry date"} htmlFor="secondaryDate">
                  <Input
                    id="secondaryDate"
                    name={kind === "invoice" ? "dueDate" : "expiryDate"}
                    type="date"
                    value={secondaryDate}
                    onChange={(event) => setSecondaryDate(event.target.value)}
                  />
                </Field>
              </div>
            </section>

            <section className="grid gap-4">
              <SectionTitle>Commercial settings</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Currency" htmlFor="currency">
                  <Input id="currency" name="currency" value={currency} onChange={(event) => setCurrency(event.target.value)} />
                </Field>
                <Field label="Language" htmlFor="language">
                  <select
                    id="language"
                    name="language"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value as InvoiceFormInput["language"])}
                    className="flex h-12 w-full rounded-[1rem] border border-border bg-white px-4 text-sm"
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                    <option value="bilingual">Bilingual</option>
                  </select>
                </Field>
                <Field label="Tax rate %" htmlFor="taxRate">
                  <Input
                    id="taxRate"
                    name="taxRate"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={taxRate}
                    onChange={(event) => setTaxRate(event.target.value)}
                  />
                </Field>
                <Field label="Discount %" htmlFor="discount">
                  <Input
                    id="discount"
                    name="discount"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={discount}
                    onChange={(event) => setDiscount(event.target.value)}
                  />
                </Field>
              </div>
            </section>

            <section className="grid gap-4">
              <div className="flex items-center justify-between gap-4">
                <SectionTitle>Line items</SectionTitle>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setLineItems((current) => [...current, createLineItem({ description: "" })])}
                >
                  <Plus className="size-4" />
                  Add line
                </Button>
              </div>
              <div className="grid gap-4">
                {lineItems.map((item, index) => (
                  <Card key={item.id} className="border border-black/7 bg-[#FFF8EE] p-4 shadow-none">
                    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px_160px_auto]">
                      <Field label="Description" htmlFor={`description-${item.id}`}>
                        <Input
                          id={`description-${item.id}`}
                          value={item.description}
                          onChange={(event) =>
                            setLineItems((current) =>
                              current.map((line) =>
                                line.id === item.id ? { ...line, description: event.target.value } : line,
                              ),
                            )
                          }
                        />
                      </Field>
                      <Field label="Qty" htmlFor={`quantity-${item.id}`}>
                        <Input
                          id={`quantity-${item.id}`}
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.quantity}
                          onChange={(event) =>
                            setLineItems((current) =>
                              current.map((line) =>
                                line.id === item.id
                                  ? {
                                      ...line,
                                      quantity: Number(event.target.value),
                                    }
                                  : line,
                              ),
                            )
                          }
                        />
                      </Field>
                      <Field label="Unit price" htmlFor={`price-${item.id}`}>
                        <Input
                          id={`price-${item.id}`}
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(event) =>
                            setLineItems((current) =>
                              current.map((line) =>
                                line.id === item.id
                                  ? {
                                      ...line,
                                      unitPrice: Number(event.target.value),
                                    }
                                  : line,
                              ),
                            )
                          }
                        />
                      </Field>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setLineItems((current) =>
                              current.length === 1 ? current : current.filter((line) => line.id !== item.id),
                            )
                          }
                          aria-label={`Remove line item ${index + 1}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Field label="Notes" htmlFor={`notes-${item.id}`}>
                        <Textarea
                          id={`notes-${item.id}`}
                          value={item.notes ?? ""}
                          onChange={(event) =>
                            setLineItems((current) =>
                              current.map((line) =>
                                line.id === item.id ? { ...line, notes: event.target.value } : line,
                              ),
                            )
                          }
                        />
                      </Field>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            <section className="grid gap-4">
              <SectionTitle>Notes and terms</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="TRN" htmlFor="trn">
                  <Input id="trn" name="trn" value={trn} onChange={(event) => setTrn(event.target.value)} />
                </Field>
              </div>
              <Field label="Notes" htmlFor="notes">
                <Textarea id="notes" name="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </Field>
              <Field label="Terms" htmlFor="terms">
                <Textarea id="terms" name="terms" value={terms} onChange={(event) => setTerms(event.target.value)} />
              </Field>
            </section>

            <DocumentLayoutDiagnostics preview={preview} />

            {state.message ? (
              <div
                className={`rounded-[1rem] border px-4 py-3 text-sm ${
                  state.status === "error"
                    ? "border-[#E7B1A8] bg-[#FFF3F1] text-[#8D3D2E]"
                    : "border-emerald-900/10 bg-emerald-50 text-success"
                }`}
              >
                {state.message}
              </div>
            ) : null}

            <Button type="submit" variant="accent" className="w-full sm:w-fit">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitLabel}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="hidden xl:block">
        <div className="sticky top-[7rem]">{previewNode}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-semibold text-foreground">{children}</h3>;
}

function isoDateFromNow(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
