"use server";

import { revalidatePath } from "next/cache";
import { normalizePaymentMethodInput, paymentFormSchema } from "@/lib/billing";
import { computeAndWriteInvoiceStatus, getInvoiceById } from "@/lib/billing-data";
import { requireSession } from "@/lib/require-session";
import type { ActionState } from "@/lib/types";

export async function addPaymentAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSession();
    const rawDescription = formData.get("description");
    const description = typeof rawDescription === "string" ? rawDescription.trim() : "";

    const parsed = paymentFormSchema.safeParse({
      invoiceId: formData.get("invoiceId"),
      datePaid: formData.get("datePaid"),
      amount: formData.get("amount"),
      method: normalizePaymentMethodInput(formData.get("method")),
      description,
    });

    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message };
    }

    const { error } = await supabase.from("payments").insert({
      invoice_id: parsed.data.invoiceId,
      user_id: user.id,
      amount: parsed.data.amount,
      date_paid: parsed.data.datePaid,
      method: parsed.data.method,
      description: parsed.data.description,
    });

    if (error) {
      throw new Error(error.message);
    }

    await computeAndWriteInvoiceStatus(supabase, parsed.data.invoiceId, user.id);

    const invoice = await getInvoiceById(parsed.data.invoiceId);
    if (invoice) {
      revalidatePath(`/app/invoices/${invoice.slug}`);
    }
    revalidatePath("/app/invoices");
    revalidatePath("/app");

    return { status: "success" };
  } catch {
    return {
      status: "error",
      message: "Payment could not be saved. Check the amount and try again.",
    };
  }
}

export async function deletePaymentAction(
  paymentId: string,
  invoiceId: string,
): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSession();

    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", paymentId)
      .eq("user_id", user.id);

    if (error) {
      return {
        status: "error",
        message: "Could not delete payment. Reload the page and try again.",
      };
    }

    await computeAndWriteInvoiceStatus(supabase, invoiceId, user.id);

    const invoice = await getInvoiceById(invoiceId);
    if (invoice) {
      revalidatePath(`/app/invoices/${invoice.slug}`);
    }
    revalidatePath("/app/invoices");
    revalidatePath("/app");

    return { status: "success" };
  } catch {
    return {
      status: "error",
      message: "Could not delete payment. Reload the page and try again.",
    };
  }
}
