"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/require-session";
import { computeAndWriteInvoiceStatus } from "@/lib/billing-data";
import { MAX_VERSIONS, type InvoiceSnapshot } from "@/lib/billing";
import type { ActionState } from "@/lib/types";

/**
 * Insert a version snapshot after a successful invoice save.
 * Enforces a rolling cap of MAX_VERSIONS per invoice — deletes oldest beyond the cap.
 * Called from updateInvoiceAction after successful DB write (per D-01).
 */
export async function snapshotInvoiceVersion(
  supabase: NonNullable<Awaited<ReturnType<typeof import("@/lib/supabase/server").createSupabaseServerClient>>>,
  invoiceId: string,
  userId: string,
  snapshot: InvoiceSnapshot,
): Promise<void> {
  // 1. Insert new version
  await supabase.from("invoice_versions").insert({
    invoice_id: invoiceId,
    user_id: userId,
    snapshot,
  });

  // 2. Enforce rolling cap — delete oldest beyond MAX_VERSIONS
  const { data: versions } = await supabase
    .from("invoice_versions")
    .select("id, created_at")
    .eq("invoice_id", invoiceId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (versions && versions.length > MAX_VERSIONS) {
    const toDelete = versions.slice(MAX_VERSIONS).map((v) => v.id);
    await supabase.from("invoice_versions").delete().in("id", toDelete);
  }
}

/**
 * Restore an invoice to a prior version snapshot.
 * Payments and expenses are kept intact (per D-06).
 * Payment status is recomputed after restore (per D-05).
 */
export async function restoreInvoiceVersionAction(
  versionId: string,
  invoiceId: string,
): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSession();

    // 1. Fetch snapshot (verify ownership via user_id)
    const { data: version, error: fetchError } = await supabase
      .from("invoice_versions")
      .select("snapshot")
      .eq("id", versionId)
      .eq("invoice_id", invoiceId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !version) {
      return {
        status: "error",
        message: "Version not found or you don't have permission to restore it.",
      };
    }

    const snap = version.snapshot as InvoiceSnapshot;

    // 2. Apply snapshot fields back to invoices table
    const { data: updated, error: updateError } = await supabase
      .from("invoices")
      .update({
        client_id: snap.client_id,
        issue_date: snap.issue_date,
        due_date: snap.due_date,
        currency: snap.currency,
        tax_rate: snap.tax_rate,
        discount: snap.discount,
        subtotal: snap.subtotal,
        discount_amount: snap.discount_amount,
        tax_amount: snap.tax_amount,
        total: snap.total,
        line_items: snap.line_items,
        notes: snap.notes || null,
        terms: snap.terms || null,
        language: snap.language,
        trn: snap.trn || null,
        invoice_type: snap.invoice_type,
      })
      .eq("id", invoiceId)
      .eq("user_id", user.id)
      .select("slug")
      .single();

    if (updateError || !updated) {
      return {
        status: "error",
        message: "Could not restore invoice version.",
      };
    }

    // 3. Recompute payment status (payments preserved — totals changed)
    await computeAndWriteInvoiceStatus(supabase, invoiceId, user.id);

    // 4. Revalidate paths
    revalidatePath("/app/invoices");
    revalidatePath(`/app/invoices/${updated.slug}`);

    return {
      status: "success",
      message: "Invoice restored to selected version.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not restore invoice version.",
    };
  }
}
