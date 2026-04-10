"use server";

import { revalidatePath } from "next/cache";
import { expenseFormSchema } from "@/lib/billing";
import { getInvoiceById } from "@/lib/billing-data";
import { requireSession } from "@/lib/require-session";
import type { ActionState } from "@/lib/types";

export async function addExpenseAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSession();

    const parsed = expenseFormSchema.safeParse({
      invoiceId: formData.get("invoiceId"),
      date: formData.get("date"),
      amount: formData.get("amount"),
      description: formData.get("description"),
      vendor: formData.get("vendor") || "",
    });

    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message };
    }

    const { error } = await supabase.from("expenses").insert({
      invoice_id: parsed.data.invoiceId,
      user_id: user.id,
      amount: parsed.data.amount,
      date: parsed.data.date,
      description: parsed.data.description,
      vendor: parsed.data.vendor,
    });

    if (error) {
      throw new Error(error.message);
    }

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
      message: "Expense could not be saved. Check the fields and try again.",
    };
  }
}

export async function deleteExpenseAction(
  expenseId: string,
  invoiceId: string,
): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSession();

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId)
      .eq("user_id", user.id);

    if (error) {
      return {
        status: "error",
        message: "Could not delete expense. Reload the page and try again.",
      };
    }

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
      message: "Could not delete expense. Reload the page and try again.",
    };
  }
}
