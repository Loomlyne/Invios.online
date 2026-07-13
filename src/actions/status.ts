"use server";

import { revalidatePath } from "next/cache";
import { setInvoiceStatusAction } from "@/actions/invoices";
import { setQuotationStatusAction } from "@/actions/quotations";
import {
  clientStatuses,
  invoiceStatuses,
  quotationStatuses,
  type InvoiceStatus,
  type QuotationStatus,
} from "@/lib/billing";
import { requireSession } from "@/lib/require-session";

const statusesByTable = {
  invoices: invoiceStatuses,
  quotations: quotationStatuses,
  clients: clientStatuses,
} as const;

function isValidStatusForTable(
  table: keyof typeof statusesByTable,
  status: string,
) {
  return (statusesByTable[table] as readonly string[]).includes(status);
}

export async function updateDocumentStatusAction(
  table: "invoices" | "quotations" | "clients",
  id: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!isValidStatusForTable(table, status)) {
      return { ok: false, error: `Invalid status for ${table}.` };
    }

    if (table === "invoices") {
      await setInvoiceStatusAction(id, status as InvoiceStatus);
      return { ok: true };
    }

    if (table === "quotations") {
      await setQuotationStatusAction(id, status as QuotationStatus);
      return { ok: true };
    }

    const { supabase, user } = await requireSession();

    const { data, error } = await supabase
      .from("clients")
      .update({ status })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("slug")
      .single();

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/app/clients");
    if (data?.slug) {
      revalidatePath(`/app/clients/${data.slug}`);
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to update status." };
  }
}
