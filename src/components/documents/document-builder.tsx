"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import type { FormEvent, ReactNode } from "react";
import { ChevronDown, Loader2, Plus, Search, Trash2, UserPlus } from "lucide-react";
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
import { quickCreateClientAction } from "@/actions/clients";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
  const [localClients, setLocalClients] = useState(clients);

  const selectedClient = localClients.find((client) => client.id === clientId) ?? localClients[0];

  const preview = buildInvoicePreviewData(context.userState, {
    kind,
    title: kind === "invoice" ? "Invoice" : "Quotation",
    invoiceNumber: numberValue,
    numberLabel: kind === "invoice" ? "Invoice no." : "Quotation no.",
    statusLabel: formatStatus(initialValue?.status ?? "draft"),
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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Card className="p-0">
        <CardHeader className="border-b border-black/8 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="accent">{kind === "invoice" ? "Invoice builder" : "Quotation builder"}</Badge>
              <DocumentStatusBadge status={initialValue?.status ?? "draft"} />
            </div>
            <div className="xl:hidden">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="sm">Preview</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">{previewNode}</DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-5 py-5 sm:px-6">
          <form onSubmit={handleSubmit} className="grid gap-5">
            {initialValue?.id ? <input type="hidden" name="id" value={initialValue.id} /> : null}
            <input type="hidden" name="lineItemsJson" value={JSON.stringify(lineItems)} />
            <input type="hidden" name="status" value={initialValue?.status ?? "draft"} />

            {/* Client & document type */}
            <section className="grid gap-3">
              <SectionTitle>Client & type</SectionTitle>
              <Field label="Client" htmlFor="clientId">
                <input type="hidden" name="clientId" value={clientId} />
                <ClientSelector
                  clients={localClients}
                  value={clientId}
                  onChange={setClientId}
                  onClientCreated={(client) => {
                    setLocalClients((prev) => [client, ...prev]);
                    setClientId(client.id);
                  }}
                />
              </Field>

              {kind === "invoice" ? (
                <div className="space-y-2">
                  <Label htmlFor="invoiceType">Invoice type</Label>
                  <input type="hidden" name="invoiceType" value={invoiceType} />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setInvoiceType("invoice")}
                      className={`flex h-10 flex-1 items-center justify-center rounded-full text-sm font-medium transition ${
                        invoiceType === "invoice"
                          ? "bg-foreground text-on-dark shadow-sm"
                          : "border border-border bg-white text-foreground hover:bg-[#FFF7EA]"
                      }`}
                    >
                      Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceType("tax_invoice")}
                      className={`flex h-10 flex-1 items-center justify-center rounded-full text-sm font-medium transition ${
                        invoiceType === "tax_invoice"
                          ? "bg-foreground text-on-dark shadow-sm"
                          : "border border-border bg-white text-foreground hover:bg-[#FFF7EA]"
                      }`}
                    >
                      Tax invoice
                    </button>
                  </div>
                </div>
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
            </section>

            {/* Dates */}
            <section className="grid gap-3">
              <SectionTitle>Dates</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={kind === "invoice" ? "Issue date" : "Quotation date"} htmlFor="primaryDate">
                  <DatePicker
                    id="primaryDate"
                    name={kind === "invoice" ? "issueDate" : "quotationDate"}
                    value={primaryDate}
                    onChange={setPrimaryDate}
                  />
                </Field>
                <Field label={kind === "invoice" ? "Due date" : "Expiry date"} htmlFor="secondaryDate">
                  <DatePicker
                    id="secondaryDate"
                    name={kind === "invoice" ? "dueDate" : "expiryDate"}
                    value={secondaryDate}
                    onChange={setSecondaryDate}
                    align="right"
                  />
                </Field>
              </div>
            </section>

            {/* Line items */}
            <section className="grid gap-3">
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
              <div className="grid gap-3">
                {lineItems.map((item, index) => (
                  <Card key={item.id} className="border border-black/7 bg-[#FFF8EE] p-4 shadow-none">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_72px_120px_auto]">
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
                                  ? { ...line, quantity: Number(event.target.value) }
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
                                  ? { ...line, unitPrice: Number(event.target.value) }
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
                    <div className="mt-3">
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

            {/* Pricing & tax */}
            <section className="grid gap-3">
              <SectionTitle>Pricing</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Currency" htmlFor="currency">
                  <Input id="currency" name="currency" value={currency} onChange={(event) => setCurrency(event.target.value)} />
                </Field>
                <Field label="Tax %" htmlFor="taxRate">
                  <Input id="taxRate" name="taxRate" type="number" min={0} max={100} step="0.01" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} />
                </Field>
                <Field label="Discount %" htmlFor="discount">
                  <Input id="discount" name="discount" type="number" min={0} max={100} step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="TRN" htmlFor="trn">
                  <Input id="trn" name="trn" value={trn} onChange={(event) => setTrn(event.target.value)} />
                </Field>
                <Field label="Language" htmlFor="language">
                  <Select
                    id="language"
                    name="language"
                    value={language}
                    onChange={(v) => setLanguage(v as InvoiceFormInput["language"])}
                    options={[
                      { value: "en", label: "English" },
                      { value: "ar", label: "Arabic" },
                      { value: "bilingual", label: "Bilingual" },
                    ]}
                  />
                </Field>
              </div>
            </section>

            {/* Notes & terms */}
            <section className="grid gap-3">
              <SectionTitle>Notes & terms</SectionTitle>
              <Field label="Notes" htmlFor="notes">
                <Textarea id="notes" name="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </Field>
              <Field label="Terms" htmlFor="terms">
                <Textarea id="terms" name="terms" value={terms} onChange={(event) => setTerms(event.target.value)} />
              </Field>
            </section>

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

function ClientSelector({
  clients,
  value,
  onChange,
  onClientCreated,
}: {
  clients: ClientRecord[];
  value: string;
  onChange: (id: string) => void;
  onClientCreated: (client: ClientRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = clients.find((c) => c.id === value);
  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q);
  });

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setOpen(false);
      setSearch("");
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      requestAnimationFrame(() => searchRef.current?.focus());
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  const handleQuickCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setCreateError("");
    const formData = new FormData(event.currentTarget);
    const result = await quickCreateClientAction(formData);
    setCreating(false);

    if (result.status === "error") {
      setCreateError(result.message);
      return;
    }

    onClientCreated(result.client as unknown as ClientRecord);
    setAddOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-12 w-full items-center justify-between rounded-[1rem] border border-border bg-white px-4 text-left text-sm transition hover:border-[#CAB9A2]"
      >
        <span className="flex items-center gap-2 truncate">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FFF1D6] text-xs font-semibold text-[#92700C]">
            {selected?.name.charAt(0).toUpperCase() ?? "?"}
          </span>
          <span className="truncate font-medium text-foreground">
            {selected?.name ?? "Select client"}
          </span>
          {selected?.company ? (
            <span className="hidden truncate text-muted sm:inline">· {selected.company}</span>
          ) : null}
        </span>
        <ChevronDown className={`size-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-full rounded-[1rem] border border-border bg-white shadow-[0_16px_48px_rgba(19,15,11,0.12)]">
          <div className="border-b border-black/6 p-2">
            <div className="flex items-center gap-2 rounded-[0.6rem] bg-[#FAFAF8] px-3">
              <Search className="size-3.5 shrink-0 text-muted" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted">No clients found</p>
            ) : (
              filtered.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => {
                    onChange(client.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-[0.6rem] px-3 py-2.5 text-left text-sm transition hover:bg-[#FFF7EA] ${
                    client.id === value ? "bg-[#FFF1D6]" : ""
                  }`}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FFF1D6] text-xs font-semibold text-[#92700C]">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">{client.name}</span>
                    {client.company ? (
                      <span className="block truncate text-xs text-muted">{client.company}</span>
                    ) : null}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-black/6 p-1.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSearch("");
                setAddOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-[0.6rem] px-3 py-2.5 text-left text-sm font-medium text-[#92700C] transition hover:bg-[#FFF7EA]"
            >
              <UserPlus className="size-4" />
              New client
            </button>
          </div>
        </div>
      ) : null}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <h2 className="text-lg font-semibold text-foreground">Quick-add client</h2>
          <p className="mt-1 text-sm text-muted">Create a client and continue building your document.</p>
          <form onSubmit={handleQuickCreate} className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="qa-name">Client name</Label>
                <Input id="qa-name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qa-company">Company</Label>
                <Input id="qa-company" name="company" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qa-email">Email</Label>
                <Input id="qa-email" name="email" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qa-phone">Phone</Label>
                <Input id="qa-phone" name="phone" />
              </div>
            </div>
            <input type="hidden" name="status" value="active" />
            {createError ? (
              <div className="rounded-[1rem] border border-[#E7B1A8] bg-[#FFF3F1] px-4 py-3 text-sm text-[#8D3D2E]">
                {createError}
              </div>
            ) : null}
            <Button type="submit" variant="accent" className="w-full sm:w-fit">
              {creating ? <Loader2 className="size-4 animate-spin" /> : null}
              Create & select
            </Button>
          </form>
        </DialogContent>
      </Dialog>
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
