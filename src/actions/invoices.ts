"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { documentLineItemSchema, invoiceFormSchema, type InvoiceStatus } from "@/lib/billing";
import {
  buildUniqueSlug,
  computeDocumentTotals,
  createShareToken,
  normalizeLineItems,
} from "@/lib/billing-utils";
import { requireSession } from "@/lib/require-session";
import type { ActionState } from "@/lib/types";
import { snapshotInvoiceVersion } from "@/actions/versions";
import { type InvoiceSnapshot } from "@/lib/billing";
import { createRecurringScheduleAction } from "@/actions/recurring";

function parseInvoicePayload(formData: FormData) {
  const lineItemsResult = z.array(documentLineItemSchema).safeParse(
    JSON.parse(String(formData.get("lineItemsJson") || "[]")),
  );

  if (!lineItemsResult.success) {
    return {
      success: false as const,
      message: lineItemsResult.error.issues[0]?.message ?? "Line items are invalid.",
    };
  }

  const parsed = invoiceFormSchema.safeParse({
    id: formData.get("id") || undefined,
    clientId: formData.get("clientId"),
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate"),
    currency: formData.get("currency"),
    taxRate: formData.get("taxRate"),
    discount: formData.get("discount"),
    notes: formData.get("notes") || "",
    terms: formData.get("terms") || "",
    language: formData.get("language") || "en",
    trn: formData.get("trn") || "",
    status: formData.get("status") || "draft",
    invoiceType: formData.get("invoiceType") || "invoice",
    lineItems: normalizeLineItems(lineItemsResult.data),
  });

  if (!parsed.success) {
    return {
      success: false as const,
      message: parsed.error.issues[0]?.message ?? "Invoice payload is invalid.",
    };
  }

  return {
    success: true as const,
    data: parsed.data,
  };
}

async function getInvoiceDefaults() {
  const { supabase, user } = await requireSession();
  const { data, error } = await supabase
    .from("branding")
    .select("invoice_prefix")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    userId: user.id,
    prefix: (data?.invoice_prefix as string | null) ?? "INV",
    supabase,
  };
}

async function getExistingInvoiceSlugs(userId: string, excludeId?: string) {
  const { supabase } = await requireSession();
  let query = supabase.from("invoices").select("slug").eq("user_id", userId);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => item.slug as string);
}

export async function createInvoiceAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const parsed = parseInvoicePayload(formData);

    if (!parsed.success) {
      return { status: "error", message: parsed.message };
    }

    const { supabase, prefix, userId } = await getInvoiceDefaults();
    const totals = computeDocumentTotals(parsed.data.lineItems, parsed.data.taxRate, parsed.data.discount);
    const { data: numberingData, error: numberingError } = await supabase.rpc("next_document_number", {
      p_kind: "invoice",
      p_prefix: prefix,
    });

    if (numberingError) {
      throw new Error(numberingError.message);
    }

    const existingSlugs = await getExistingInvoiceSlugs(userId);
    const slug = buildUniqueSlug(`${numberingData}-${parsed.data.clientId}`, existingSlugs);
    const shareToken = createShareToken();

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        user_id: userId,
        client_id: parsed.data.clientId,
        invoice_number: numberingData,
        slug,
        status: parsed.data.status,
        invoice_type: parsed.data.invoiceType,
        issue_date: parsed.data.issueDate,
        due_date: parsed.data.dueDate,
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
        trn: parsed.data.trn || null,
        share_token: shareToken,
      })
      .select("id,slug")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // AUTO-03: Create recurring schedule if requested
    const recurringFrequency = formData.get("recurringFrequency") as string | null;
    const recurringNextDate = formData.get("recurringNextDate") as string | null;
    if (
      recurringFrequency &&
      recurringNextDate &&
      ["weekly", "monthly", "quarterly"].includes(recurringFrequency)
    ) {
      // Fire and forget — don't fail the invoice creation if schedule creation fails
      await createRecurringScheduleAction({
        sourceInvoiceId: data.id as string,
        frequency: recurringFrequency as "weekly" | "monthly" | "quarterly",
        nextDueDate: recurringNextDate,
      }).catch(() => {});
    }

    revalidatePath("/app/invoices");
    revalidatePath("/app");
    return {
      status: "success",
      redirectTo: `/app/invoices/${data.slug}` as Route,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not create invoice.",
    };
  }
}

export async function updateInvoiceAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const parsed = parseInvoicePayload(formData);

    if (!parsed.success) {
      return { status: "error", message: parsed.message };
    }

    if (!parsed.data.id) {
      return { status: "error", message: "Invoice id is required." };
    }

    const { supabase, userId } = await getInvoiceDefaults();
    const totals = computeDocumentTotals(parsed.data.lineItems, parsed.data.taxRate, parsed.data.discount);
    const { data: existingInvoice, error: existingInvoiceError } = await supabase
      .from("invoices")
      .select("invoice_number,share_token")
      .eq("id", parsed.data.id)
      .eq("user_id", userId)
      .single();

    if (existingInvoiceError) {
      throw new Error(existingInvoiceError.message);
    }

    const existingSlugs = await getExistingInvoiceSlugs(userId, parsed.data.id);
    const slug = buildUniqueSlug(`${existingInvoice.invoice_number}-${parsed.data.clientId}`, existingSlugs);

    const { data, error } = await supabase
      .from("invoices")
      .update({
        client_id: parsed.data.clientId,
        slug,
        status: parsed.data.status,
        invoice_type: parsed.data.invoiceType,
        issue_date: parsed.data.issueDate,
        due_date: parsed.data.dueDate,
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
        trn: parsed.data.trn || null,
        share_token: existingInvoice.share_token || createShareToken(),
      })
      .eq("id", parsed.data.id)
      .eq("user_id", userId)
      .select("id,slug")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // AUTO-01: Snapshot version after successful save (per D-01)
    // Fetch client name for denormalized snapshot display
    const { data: clientRow } = await supabase
      .from("clients")
      .select("name")
      .eq("id", parsed.data.clientId)
      .single();

    const snapshot: InvoiceSnapshot = {
      invoice_number: existingInvoice.invoice_number,
      client_id: parsed.data.clientId,
      client_name: clientRow?.name ?? "Unknown",
      issue_date: parsed.data.issueDate,
      due_date: parsed.data.dueDate,
      currency: parsed.data.currency,
      tax_rate: parsed.data.taxRate,
      discount: parsed.data.discount,
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      tax_amount: totals.taxAmount,
      total: totals.total,
      line_items: parsed.data.lineItems,
      notes: parsed.data.notes || "",
      terms: parsed.data.terms || "",
      language: parsed.data.language,
      trn: parsed.data.trn || "",
      invoice_type: parsed.data.invoiceType,
    };

    await snapshotInvoiceVersion(supabase, data.id, userId, snapshot);

    revalidatePath("/app/invoices");
    revalidatePath(`/app/invoices/${data.slug}`);
    return {
      status: "success",
      redirectTo: `/app/invoices/${data.slug}` as Route,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not update invoice.",
    };
  }
}

export async function setInvoiceStatusAction(id: string, status: InvoiceStatus) {
  const { supabase, user } = await requireSession();
  const { data, error } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("slug")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/app/invoices");
  if (data?.slug) {
    revalidatePath(`/app/invoices/${data.slug}`);
  }
}

export async function deleteInvoiceAction(id: string): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSession();
    const { data, error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id");

    if (error) {
      return {
        status: "error",
        message: `Failed to delete invoice: ${error.message}`,
      };
    }

    if (!data || data.length === 0) {
      return {
        status: "error",
        message: "Invoice not found or you don't have permission to delete it.",
      };
    }

    revalidatePath("/app/invoices");
    return {
      status: "success",
      redirectTo: "/app/invoices" as Route,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not delete invoice.",
    };
  }
}
