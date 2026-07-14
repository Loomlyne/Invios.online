"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  documentLineItemSchema,
  quotationFormSchema,
  type QuotationStatus,
} from "@/lib/billing";
import {
  buildUniqueSlug,
  computeDocumentTotals,
  createShareToken,
  mapQuotationToInvoiceInput,
  normalizeLineItems,
} from "@/lib/billing-utils";
import { requireSession } from "@/lib/require-session";
import type { ActionState } from "@/lib/types";

function parseQuotationPayload(formData: FormData) {
  const lineItemsResult = z.array(documentLineItemSchema).safeParse(
    JSON.parse(String(formData.get("lineItemsJson") || "[]")),
  );

  if (!lineItemsResult.success) {
    return {
      success: false as const,
      message: lineItemsResult.error.issues[0]?.message ?? "Line items are invalid.",
    };
  }

  const parsed = quotationFormSchema.safeParse({
    id: formData.get("id") || undefined,
    clientId: formData.get("clientId"),
    quotationDate: formData.get("quotationDate"),
    expiryDate: formData.get("expiryDate"),
    validityDays: formData.get("validityDays") || 30,
    currency: formData.get("currency"),
    taxRate: formData.get("taxRate"),
    discount: formData.get("discount"),
    notes: formData.get("notes") || "",
    terms: formData.get("terms") || "",
    language: formData.get("language") || "en",
    trn: formData.get("trn") || "",
    status: formData.get("status") || "draft",
    lineItems: normalizeLineItems(lineItemsResult.data),
  });

  if (!parsed.success) {
    return {
      success: false as const,
      message: parsed.error.issues[0]?.message ?? "Quotation payload is invalid.",
    };
  }

  return {
    success: true as const,
    data: parsed.data,
  };
}

async function getQuotationDefaults() {
  const { supabase, user } = await requireSession();
  const { data, error } = await supabase
    .from("branding")
    .select("quotation_prefix")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    userId: user.id,
    prefix: (data?.quotation_prefix as string | null) ?? "QUO",
    supabase,
  };
}

async function getExistingQuotationSlugs(userId: string, excludeId?: string) {
  const { supabase } = await requireSession();
  let query = supabase.from("quotations").select("slug").eq("user_id", userId);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => item.slug as string);
}

export async function createQuotationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const parsed = parseQuotationPayload(formData);

    if (!parsed.success) {
      return { status: "error", message: parsed.message };
    }

    const { supabase, prefix, userId } = await getQuotationDefaults();
    const totals = computeDocumentTotals(parsed.data.lineItems, parsed.data.taxRate, parsed.data.discount);
    const { data: numberingData, error: numberingError } = await supabase.rpc("next_document_number", {
      p_kind: "quotation",
      p_prefix: prefix,
    });

    if (numberingError) {
      throw new Error(numberingError.message);
    }

    const existingSlugs = await getExistingQuotationSlugs(userId);
    const slug = buildUniqueSlug(`${numberingData}-${parsed.data.clientId}`, existingSlugs);
    const now = new Date().toISOString();
    const sentDate = parsed.data.status === "sent" ? now : null;
    const acceptedDate = parsed.data.status === "accepted" ? now : null;
    const rejectedDate = parsed.data.status === "rejected" ? now : null;

    const { data, error } = await supabase
      .from("quotations")
      .insert({
        user_id: userId,
        client_id: parsed.data.clientId,
        quotation_number: numberingData,
        slug,
        status: parsed.data.status,
        quotation_date: parsed.data.quotationDate,
        expiry_date: parsed.data.expiryDate,
        validity_days: parsed.data.validityDays,
        currency: parsed.data.currency,
        tax_rate: parsed.data.taxRate,
        discount: parsed.data.discount,
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        tax_amount: totals.taxAmount,
        total: totals.total,
        line_items: parsed.data.lineItems,
        notes: parsed.data.notes || null,
        terms: parsed.data.terms || null,
        language: parsed.data.language,
        share_token: createShareToken(),
        sent_date: sentDate,
        accepted_date: acceptedDate,
        rejected_date: rejectedDate,
      })
      .select("id,slug")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/app/quotations");
    revalidatePath("/app");
    return {
      status: "success",
      redirectTo: `/app/quotations/${data.slug}` as Route,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not create quotation.",
    };
  }
}

export async function updateQuotationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const parsed = parseQuotationPayload(formData);

    if (!parsed.success) {
      return { status: "error", message: parsed.message };
    }

    if (!parsed.data.id) {
      return { status: "error", message: "Quotation id is required." };
    }

    const { supabase, userId } = await getQuotationDefaults();
    const totals = computeDocumentTotals(parsed.data.lineItems, parsed.data.taxRate, parsed.data.discount);
    const { data: existingQuotation, error: existingQuotationError } = await supabase
      .from("quotations")
      .select("quotation_number,share_token,sent_date,accepted_date,rejected_date")
      .eq("id", parsed.data.id)
      .eq("user_id", userId)
      .single();

    if (existingQuotationError) {
      throw new Error(existingQuotationError.message);
    }

    const existingSlugs = await getExistingQuotationSlugs(userId, parsed.data.id);
    const slug = buildUniqueSlug(`${existingQuotation.quotation_number}-${parsed.data.clientId}`, existingSlugs);
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("quotations")
      .update({
        client_id: parsed.data.clientId,
        slug,
        status: parsed.data.status,
        quotation_date: parsed.data.quotationDate,
        expiry_date: parsed.data.expiryDate,
        validity_days: parsed.data.validityDays,
        currency: parsed.data.currency,
        tax_rate: parsed.data.taxRate,
        discount: parsed.data.discount,
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        tax_amount: totals.taxAmount,
        total: totals.total,
        line_items: parsed.data.lineItems,
        notes: parsed.data.notes || null,
        terms: parsed.data.terms || null,
        language: parsed.data.language,
        share_token: existingQuotation.share_token || createShareToken(),
        sent_date:
          parsed.data.status === "sent"
            ? existingQuotation.sent_date ?? now
            : existingQuotation.sent_date,
        accepted_date:
          parsed.data.status === "accepted"
            ? existingQuotation.accepted_date ?? now
            : null,
        rejected_date:
          parsed.data.status === "rejected"
            ? existingQuotation.rejected_date ?? now
            : null,
      })
      .eq("id", parsed.data.id)
      .eq("user_id", userId)
      .select("id,slug")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/app/quotations");
    revalidatePath(`/app/quotations/${data.slug}`);
    return {
      status: "success",
      redirectTo: `/app/quotations/${data.slug}` as Route,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not update quotation.",
    };
  }
}

export async function setQuotationStatusAction(id: string, status: QuotationStatus) {
  const { supabase, user } = await requireSession();

  const { data: current, error: fetchError } = await supabase
    .from("quotations")
    .select("status,converted_to_invoice_id,sent_date,accepted_date,rejected_date")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (current.converted_to_invoice_id !== null) {
    throw new Error("Converted quotations are locked and cannot change status.");
  }

  if (current.status === status) return;

  const now = new Date().toISOString();
  const update: Record<string, string | null> = {
    status,
    sent_date:
      status === "sent"
        ? current.sent_date ?? now
        : current.sent_date,
    accepted_date:
      status === "accepted"
        ? current.accepted_date ?? now
        : null,
    rejected_date:
      status === "rejected"
        ? current.rejected_date ?? now
        : null,
  };

  const { data, error } = await supabase
    .from("quotations")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("slug")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/quotations");
  if (data?.slug) {
    revalidatePath(`/app/quotations/${data.slug}`);
  }
}

export async function convertQuotationToInvoiceAction(quotationId: string) {
  const { supabase, user } = await requireSession();
  const [brandingResult, quotationResult] = await Promise.all([
    supabase
      .from("branding")
      .select("invoice_prefix")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("quotations")
      .select("*")
      .eq("id", quotationId)
      .eq("user_id", user.id)
      .single(),
  ]);

  if (brandingResult.error) {
    throw new Error(brandingResult.error.message);
  }

  if (quotationResult.error) {
    throw new Error(quotationResult.error.message);
  }

  const quotation = quotationResult.data;

  if (quotation.status !== "accepted") {
    throw new Error("Only accepted quotations can be converted.");
  }

  const { data: numberingData, error: numberingError } = await supabase.rpc("next_document_number", {
    p_kind: "invoice",
    p_prefix: brandingResult.data?.invoice_prefix ?? "INV",
  });

  if (numberingError) {
    throw new Error(numberingError.message);
  }

  const existingInvoiceSlugsResult = await supabase
    .from("invoices")
    .select("slug")
    .eq("user_id", user.id);

  if (existingInvoiceSlugsResult.error) {
    throw new Error(existingInvoiceSlugsResult.error.message);
  }

  const invoiceInput = mapQuotationToInvoiceInput({
    clientId: quotation.client_id,
    quotationDate: quotation.quotation_date,
    expiryDate: quotation.expiry_date,
    currency: quotation.currency,
    taxRate: Number(quotation.tax_rate),
    discount: Number(quotation.discount),
    notes: quotation.notes ?? "",
    terms: quotation.terms ?? "",
    language: quotation.language,
    trn: "",
    lineItems: quotation.line_items ?? [],
    status: "accepted",
    validityDays: quotation.validity_days,
  });
  const slug = buildUniqueSlug(
    `${numberingData}-${quotation.client_id}`,
    (existingInvoiceSlugsResult.data ?? []).map((item) => item.slug as string),
  );
  const totals = computeDocumentTotals(invoiceInput.lineItems, invoiceInput.taxRate, invoiceInput.discount);
  const now = new Date().toISOString();

  const { data: invoiceData, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      client_id: invoiceInput.clientId,
      invoice_number: numberingData,
      slug,
      status: "draft",
      invoice_type: "invoice",
      issue_date: invoiceInput.issueDate,
      due_date: invoiceInput.dueDate,
      currency: invoiceInput.currency,
      tax_rate: invoiceInput.taxRate,
      discount: invoiceInput.discount,
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      tax_amount: totals.taxAmount,
      total: totals.total,
      line_items: invoiceInput.lineItems,
      notes: invoiceInput.notes || null,
      terms: invoiceInput.terms || null,
      language: invoiceInput.language,
      trn: invoiceInput.trn || null,
      share_token: createShareToken(),
    })
    .select("id,slug")
    .single();

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  const { error: quotationUpdateError } = await supabase
    .from("quotations")
    .update({
      converted_to_invoice_id: invoiceData.id,
      conversion_date: now,
      accepted_date: quotation.accepted_date ?? now,
    })
    .eq("id", quotationId)
    .eq("user_id", user.id);

  if (quotationUpdateError) {
    throw new Error(quotationUpdateError.message);
  }

  revalidatePath("/app/quotations");
  revalidatePath("/app/invoices");
  redirect(`/app/invoices/${invoiceData.slug}/edit` as Route);
}

export async function deleteQuotationAction(id: string): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSession();
    const { data, error } = await supabase
      .from("quotations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id");

    if (error) {
      return {
        status: "error",
        message: `Failed to delete quotation: ${error.message}`,
      };
    }

    if (!data || data.length === 0) {
      return {
        status: "error",
        message: "Quotation not found or you don't have permission to delete it.",
      };
    }

    revalidatePath("/app/quotations");
    return {
      status: "success",
      redirectTo: "/app/quotations" as Route,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not delete quotation.",
    };
  }
}
