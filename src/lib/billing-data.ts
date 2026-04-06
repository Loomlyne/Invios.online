import { cache } from "react";
import type {
  ClientRecord,
  ClientStatus,
  InvoiceRecord,
  InvoiceStatus,
  QuotationRecord,
  QuotationStatus,
} from "@/lib/billing";
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
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query.returns<ClientRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const mapped = (data ?? []).map(mapClient);

  if (!search) {
    return mapped;
  }

  const term = search.toLowerCase();
  return mapped.filter((client) =>
    [client.name, client.company, client.email].some((value) => value.toLowerCase().includes(term)),
  );
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
  status?: InvoiceStatus | "all";
}) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return [] as InvoiceRecord[];
  }

  let query = supabase
    .from("invoices")
    .select(invoiceSelect)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
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
    .order("created_at", { ascending: false });

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
