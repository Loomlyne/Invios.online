"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/require-session";

export async function updateDocumentStatusAction(
  table: "invoices" | "quotations" | "clients",
  id: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, user } = await requireSession();

    const { error } = await supabase
      .from(table)
      .update({ status })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath(`/app/${table}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to update status." };
  }
}
