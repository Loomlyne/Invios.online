import { cache } from "react";
import type {
  ClientRecord,
  ClientStatus,
  DashboardMetricKey,
  DashboardRangeKey,
  ExpenseRecord,
  InvoiceRecord,
  InvoiceStatus,
  PaymentMethod,
  PaymentRecord,
  QuotationRecord,
  QuotationStatus,
} from "@/lib/billing";
import { computePaymentStatus } from "@/lib/billing-utils";
import type { RecurringFrequency } from "@/lib/cron-utils";
import {
  buildDashboardInsights,
  buildDashboardInvoiceRows,
  buildDashboardMetrics,
  selectDashboardDrilldownRows,
} from "@/lib/dashboard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ClientRow = {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: ClientStatus;
  slug: string;
  trn: string | null;
  tax_code: string | null;
  portal_token: string;
  logo_path: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type DocumentClientRow = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  slug: string;
  trn: string | null;
};

type InvoiceRow = {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  slug: string;
  status: InvoiceStatus;
  invoice_type: InvoiceRecord["invoiceType"];
  issue_date: string;
  due_date: string;
  currency: string;
  tax_rate: number;
  discount: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  line_items: InvoiceRecord["lineItems"];
  notes: string | null;
  terms: string | null;
  language: InvoiceRecord["language"];
  trn: string | null;
  share_token: string;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  client: DocumentClientRow;
};

type QuotationRow = {
  id: string;
  user_id: string;
  client_id: string;
  quotation_number: string;
  slug: string;
  status: QuotationStatus;
  quotation_date: string;
  expiry_date: string;
  validity_days: number;
  currency: string;
  tax_rate: number;
  discount: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  line_items: QuotationRecord["lineItems"];
  notes: string | null;
  terms: string | null;
  language: QuotationRecord["language"];
  share_token: string;
  converted_to_invoice_id: string | null;
  conversion_date: string | null;
  sent_date: string | null;
  accepted_date: string | null;
  rejected_date: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  client: DocumentClientRow;
};

const invoiceSelect =
  "id,user_id,client_id,invoice_number,slug,status,invoice_type,issue_date,due_date,currency,tax_rate,discount,subtotal,discount_amount,tax_amount,total,line_items,notes,terms,language,trn,share_token,pdf_url,created_at,updated_at,client:clients!inner(id,name,company,email,phone,address,slug,trn)";

const quotationSelect =
  "id,user_id,client_id,quotation_number,slug,status,quotation_date,expiry_date,validity_days,currency,tax_rate,discount,subtotal,discount_amount,tax_amount,total,line_items,notes,terms,language,share_token,converted_to_invoice_id,conversion_date,sent_date,accepted_date,rejected_date,rejection_reason,created_at,updated_at,client:clients!inner(id,name,company,email,phone,address,slug,trn)";

function mapClient(row: ClientRow): ClientRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    company: row.company ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    status: row.status,
    slug: row.slug,
    trn: row.trn ?? "",
    taxCode: row.tax_code ?? "",
    portalToken: row.portal_token,
    logoPath: row.logo_path,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInvoice(row: InvoiceRow): InvoiceRecord {
  return {
    id: row.id,
    userId: row.user_id,
    clientId: row.client_id,
    invoiceNumber: row.invoice_number,
    slug: row.slug,
    status: row.status,
    invoiceType: row.invoice_type,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    currency: row.currency,
    taxRate: Number(row.tax_rate),
    discount: Number(row.discount),
    subtotal: Number(row.subtotal),
    discountAmount: Number(row.discount_amount),
    taxAmount: Number(row.tax_amount),
    total: Number(row.total),
    lineItems: row.line_items ?? [],
    notes: row.notes ?? "",
    terms: row.terms ?? "",
    language: row.language,
    trn: row.trn ?? "",
    shareToken: row.share_token,
    pdfUrl: row.pdf_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    client: {
      id: row.client.id,
      name: row.client.name,
      company: row.client.company ?? "",
      email: row.client.email ?? "",
      phone: row.client.phone ?? "",
      address: row.client.address ?? "",
      slug: row.client.slug,
      trn: row.client.trn ?? "",
    },
  };
}

function mapQuotation(row: QuotationRow): QuotationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    clientId: row.client_id,
    quotationNumber: row.quotation_number,
    slug: row.slug,
    status: row.status,
    quotationDate: row.quotation_date,
    expiryDate: row.expiry_date,
    validityDays: row.validity_days,
    currency: row.currency,
    taxRate: Number(row.tax_rate),
    discount: Number(row.discount),
    subtotal: Number(row.subtotal),
    discountAmount: Number(row.discount_amount),
    taxAmount: Number(row.tax_amount),
    total: Number(row.total),
    lineItems: row.line_items ?? [],
    notes: row.notes ?? "",
    terms: row.terms ?? "",
    language: row.language,
    shareToken: row.share_token,
    convertedToInvoiceId: row.converted_to_invoice_id,
    conversionDate: row.conversion_date,
    sentDate: row.sent_date,
    acceptedDate: row.accepted_date,
    rejectedDate: row.rejected_date,
    rejectionReason: row.rejection_reason ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    client: {
      id: row.client.id,
      name: row.client.name,
      company: row.client.company ?? "",
      email: row.client.email ?? "",
      phone: row.client.phone ?? "",
      address: row.client.address ?? "",
      slug: row.client.slug,
      trn: row.client.trn ?? "",
    },
  };
}

export const getClientOptions = cache(async () => {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as Pick<ClientRecord, "id" | "name" | "company" | "slug" | "status">[];
  }

  const { data } = await supabase
    .from("clients")
    .select("id,name,company,slug,status")
    .is("archived_at", null)
    .order("name", { ascending: true });

  return (data ?? []).map((client) => ({
    id: client.id as string,
    name: client.name as string,
    company: (client.company as string | null) ?? "",
    slug: client.slug as string,
    status: client.status as ClientStatus,
  }));
});

export async function listClients({
  search,
  status,
}: {
  search?: string;
  status?: ClientStatus | "all";
}) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as ClientRecord[];
  }

  let query = supabase
    .from("clients")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query.returns<ClientRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapClient);
}

export async function getClientBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("slug", slug)
    .is("archived_at", null)
    .maybeSingle<ClientRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapClient(data) : null;
}

export async function listInvoices({
  search,
  status,
}: {
  search?: string;
  status?: InvoiceStatus | "all" | "open";
}) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as InvoiceRecord[];
  }

  let query = supabase
    .from("invoices")
    .select(invoiceSelect)
    .order("created_at", { ascending: false })
    .limit(200);

  if (status === "open") {
    query = query.in("status", ["sent", "partial_paid", "overdue"]);
  } else if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query.returns<InvoiceRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const mapped = (data ?? []).map(mapInvoice);

  if (!search) {
    return mapped;
  }

  const term = search.toLowerCase();
  return mapped.filter((invoice) =>
    [
      invoice.invoiceNumber,
      invoice.slug,
      invoice.client.name,
      invoice.client.company,
    ].some((value) => value.toLowerCase().includes(term)),
  );
}

export async function getInvoiceById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("invoices")
    .select(invoiceSelect)
    .eq("id", id)
    .maybeSingle<InvoiceRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapInvoice(data) : null;
}

export async function listInvoicesForClient(clientId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as InvoiceRecord[];
  }

  const { data, error } = await supabase
    .from("invoices")
    .select(invoiceSelect)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .returns<InvoiceRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapInvoice);
}

export async function listQuotations({
  search,
  status,
}: {
  search?: string;
  status?: QuotationStatus | "all";
}) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as QuotationRecord[];
  }

  let query = supabase
    .from("quotations")
    .select(quotationSelect)
    .order("created_at", { ascending: false })
    .limit(200);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query.returns<QuotationRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const mapped = (data ?? []).map(mapQuotation);

  if (!search) {
    return mapped;
  }

  const term = search.toLowerCase();
  return mapped.filter((quotation) =>
    [
      quotation.quotationNumber,
      quotation.slug,
      quotation.client.name,
      quotation.client.company,
    ].some((value) => value.toLowerCase().includes(term)),
  );
}

export async function getQuotationById(id: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("quotations")
    .select(quotationSelect)
    .eq("id", id)
    .maybeSingle<QuotationRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapQuotation(data) : null;
}

export async function listQuotationsForClient(clientId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as QuotationRecord[];
  }

  const { data, error } = await supabase
    .from("quotations")
    .select(quotationSelect)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .returns<QuotationRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapQuotation);
}

export async function getPublicInvoiceByToken(shareToken: string) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("invoices")
    .select(invoiceSelect)
    .eq("share_token", shareToken)
    .maybeSingle<InvoiceRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapInvoice(data) : null;
}

export async function getPublicQuotationByToken(shareToken: string) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("quotations")
    .select(quotationSelect)
    .eq("share_token", shareToken)
    .maybeSingle<QuotationRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapQuotation(data) : null;
}

// ---------------------------------------------------------------------------
// Phase 3: Payments, Expenses, Dashboard Metrics
// ---------------------------------------------------------------------------

type PaymentRow = {
  id: string;
  invoice_id: string;
  user_id: string;
  amount: string; // numeric(12,2) returns as string from Supabase
  date_paid: string;
  method: string;
  description: string | null;
  created_at: string;
};

type ExpenseRow = {
  id: string;
  invoice_id: string;
  user_id: string;
  amount: string; // numeric(12,2) returns as string from Supabase
  date: string;
  description: string;
  vendor: string | null;
  created_at: string;
};

function mapPayment(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    userId: row.user_id,
    amount: Number(row.amount),
    datePaid: row.date_paid,
    method: row.method as PaymentMethod,
    description: row.description ?? "",
    createdAt: row.created_at,
  };
}

function mapExpense(row: ExpenseRow): ExpenseRecord {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    userId: row.user_id,
    amount: Number(row.amount),
    date: row.date,
    description: row.description,
    vendor: row.vendor ?? "",
    createdAt: row.created_at,
  };
}

export const listPaymentsForInvoice = cache(async (invoiceId: string): Promise<PaymentRecord[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("date_paid", { ascending: true })
    .returns<PaymentRow[]>();
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPayment);
});

export const listExpensesForInvoice = cache(async (invoiceId: string): Promise<ExpenseRecord[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("date", { ascending: true })
    .returns<ExpenseRow[]>();
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapExpense);
});

/**
 * Recompute invoice payment status and write it back to the invoices table.
 * Called after every payment insert or delete.
 */
export async function computeAndWriteInvoiceStatus(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  invoiceId: string,
  userId: string,
): Promise<void> {
  if (!supabase) return;

  const { data: invoice } = await supabase
    .from("invoices")
    .select("total, due_date, status")
    .eq("id", invoiceId)
    .eq("user_id", userId)
    .single();

  if (!invoice) return;

  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", invoiceId)
    .eq("user_id", userId);

  const collected = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const today = new Date().toISOString().split("T")[0];

  const newStatus = computePaymentStatus({
    currentStatus: invoice.status as InvoiceStatus,
    total: Number(invoice.total),
    collected,
    dueDate: invoice.due_date,
    today,
  });

  if (newStatus !== invoice.status) {
    await supabase
      .from("invoices")
      .update({ status: newStatus })
      .eq("id", invoiceId)
      .eq("user_id", userId);
  }
}

/**
 * Bulk-update overdue statuses for sent/partial_paid invoices past their due date.
 * Never touches drafts or paid invoices.
 * Called at dashboard and invoice list load time.
 */
export async function syncOverdueStatuses(userId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  const today = new Date().toISOString().split("T")[0];
  await supabase
    .from("invoices")
    .update({ status: "overdue" })
    .eq("user_id", userId)
    .in("status", ["sent", "partial_paid"])
    .lt("due_date", today);
}

/**
 * Aggregate dashboard metrics across all non-draft invoices for the user.
 * Syncs overdue statuses before aggregating.
 */
const getDashboardDataset = cache(async (userId: string, range: DashboardRangeKey = "all") => {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split("T")[0];

  const emptyRows = [] as ReturnType<typeof buildDashboardInvoiceRows>;
  const emptyInsights = buildDashboardInsights({
    rows: [],
    quotations: [],
    payments: [],
    expenses: [],
    range,
    today,
  });

  if (!supabase) {
    return {
      rows: emptyRows,
      metrics: buildDashboardMetrics([]),
      insights: emptyInsights,
      recentInvoices: [] as InvoiceRecord[],
      recentQuotations: [] as QuotationRecord[],
    };
  }

  // Run overdue sync in the background — don't block the data queries.
  // Statuses will be at most one render stale, which is acceptable.
  syncOverdueStatuses(userId).catch(() => {});

  const [invoiceResult, paymentResult, expenseResult, quotationResult] = await Promise.all([
    supabase
      .from("invoices")
      .select(invoiceSelect)
      .eq("user_id", userId)
      .returns<InvoiceRow[]>(),
    supabase
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .returns<PaymentRow[]>(),
    supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .returns<ExpenseRow[]>(),
    supabase
      .from("quotations")
      .select(quotationSelect)
      .eq("user_id", userId)
      .returns<QuotationRow[]>(),
  ]);

  if (invoiceResult.error || paymentResult.error || expenseResult.error || quotationResult.error) {
    const message =
      invoiceResult.error?.message ||
      paymentResult.error?.message ||
      expenseResult.error?.message ||
      quotationResult.error?.message;
    throw new Error(message);
  }

  const invoices = (invoiceResult.data ?? []).map(mapInvoice);
  const payments = (paymentResult.data ?? []).map(mapPayment);
  const expenses = (expenseResult.data ?? []).map(mapExpense);
  const quotations = (quotationResult.data ?? []).map(mapQuotation);
  const rows = buildDashboardInvoiceRows({
    invoices,
    payments,
    expenses,
    range,
    today,
  });

  const recentInvoices = [...invoices]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const recentQuotations = [...quotations]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return {
    rows,
    metrics: buildDashboardMetrics(rows),
    insights: buildDashboardInsights({
      rows,
      quotations,
      payments,
      expenses,
      range,
      today,
    }),
    recentInvoices,
    recentQuotations,
  };
});

export async function getDashboardMetrics(
  userId: string,
  range: DashboardRangeKey = "all",
) {
  return (await getDashboardDataset(userId, range)).metrics;
}

export async function getDashboardDrilldown(
  userId: string,
  metric: DashboardMetricKey,
  range: DashboardRangeKey = "all",
) {
  return selectDashboardDrilldownRows((await getDashboardDataset(userId, range)).rows, metric);
}

export async function getDashboardInsights(
  userId: string,
  range: DashboardRangeKey = "all",
) {
  return (await getDashboardDataset(userId, range)).insights;
}

export async function getDashboardRecentInvoices(
  userId: string,
  range: DashboardRangeKey = "all",
) {
  return (await getDashboardDataset(userId, range)).recentInvoices;
}

export async function getDashboardRecentQuotations(
  userId: string,
  range: DashboardRangeKey = "all",
) {
  return (await getDashboardDataset(userId, range)).recentQuotations;
}

export async function listRecentInvoices(userId: string, limit = 5): Promise<InvoiceRecord[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("invoices")
    .select(invoiceSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<InvoiceRow[]>();
  if (error) return [];
  return (data ?? []).map(mapInvoice);
}

export async function listRecentQuotations(userId: string, limit = 5): Promise<QuotationRecord[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("quotations")
    .select(quotationSelect)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<QuotationRow[]>();
  if (error) return [];
  return (data ?? []).map(mapQuotation);
}

export async function listOverdueInvoices(userId: string): Promise<InvoiceRecord[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("invoices")
    .select(invoiceSelect)
    .eq("user_id", userId)
    .eq("status", "overdue")
    .order("due_date", { ascending: true })
    .returns<InvoiceRow[]>();
  if (error) return [];
  return (data ?? []).map(mapInvoice);
}

// ---------------------------------------------------------------------------
// Phase 4: Public Trust Surfaces
// ---------------------------------------------------------------------------

/**
 * Resolve a client from a portal token (public, no session required).
 * Blocks archived clients via .is("archived_at", null). (D-07)
 */
export async function getClientByPortalToken(portalToken: string): Promise<ClientRecord | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("portal_token", portalToken)
    .is("archived_at", null)
    .maybeSingle<ClientRow>();

  if (error) throw new Error(error.message);
  return data ? mapClient(data) : null;
}

/**
 * Look up an invoice by its slug (authenticated route, RLS-scoped).
 */
export async function getInvoiceBySlug(slug: string): Promise<InvoiceRecord | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("invoices")
    .select(invoiceSelect)
    .eq("slug", slug)
    .maybeSingle<InvoiceRow>();

  if (error) throw new Error(error.message);
  return data ? mapInvoice(data) : null;
}

/**
 * Look up a quotation by its slug (authenticated route, RLS-scoped).
 */
export async function getQuotationBySlug(slug: string): Promise<QuotationRecord | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("quotations")
    .select(quotationSelect)
    .eq("slug", slug)
    .maybeSingle<QuotationRow>();

  if (error) throw new Error(error.message);
  return data ? mapQuotation(data) : null;
}

/**
 * Resolve an old slug to the current slug via the alias table.
 * Returns the current document slug or null if no alias found. (D-13)
 * Uses admin client so this works on both public and authenticated contexts.
 */
export async function getSlugAliasRedirect(
  slug: string,
  kind: "invoice" | "quotation",
): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  // Query alias by old_slug. The index on (kind, old_slug) makes this efficient
  // in production; kind is used as a discriminator via eq chaining on the result.
  const { data: alias, error: aliasError } = await supabase
    .from("document_slug_aliases")
    .select("document_id")
    .eq("old_slug", slug)
    .maybeSingle();

  if (aliasError || !alias) return null;

  const table = kind === "invoice" ? "invoices" : "quotations";
  const { data: doc, error: docError } = await supabase
    .from(table)
    .select("slug")
    .eq("id", (alias as { document_id: string }).document_id)
    .single();

  if (docError || !doc) return null;
  return (doc as { slug: string }).slug;
}

/**
 * List invoices for a client on the public portal (no session required).
 */
export async function listInvoicesForClientPublic(
  clientId: string,
  userId: string,
): Promise<InvoiceRecord[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("invoices")
    .select(invoiceSelect)
    .eq("client_id", clientId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<InvoiceRow[]>();

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapInvoice);
}

/**
 * List quotations for a client on the public portal (no session required).
 */
export async function listQuotationsForClientPublic(
  clientId: string,
  userId: string,
): Promise<QuotationRecord[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("quotations")
    .select(quotationSelect)
    .eq("client_id", clientId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<QuotationRow[]>();

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapQuotation);
}

// ---------------------------------------------------------------------------
// Phase 5: Version History
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Phase 5: Recurring Schedules
// ---------------------------------------------------------------------------

/**
 * Get the active recurring schedule for a given invoice, if one exists.
 * Returns null if no active schedule exists.
 */
export async function getRecurringSchedule(invoiceId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("recurring_schedules")
    .select("id, frequency, next_due_date, is_active, created_at")
    .eq("source_invoice_id", invoiceId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id as string,
    frequency: data.frequency as RecurringFrequency,
    nextDueDate: data.next_due_date as string,
    isActive: data.is_active as boolean,
    createdAt: data.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// Phase 5: Version History
// ---------------------------------------------------------------------------

/**
 * List all version snapshots for an invoice, ordered by created_at desc.
 * Used by VersionHistoryPanel on the invoice detail page.
 */
export const listInvoiceVersions = cache(async (invoiceId: string) => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("invoice_versions")
    .select("id, snapshot, created_at")
    .eq("invoice_id", invoiceId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return [];

  return (data ?? []).map((row) => ({
    id: row.id as string,
    snapshot: row.snapshot as Record<string, unknown>,
    createdAt: row.created_at as string,
  }));
});
