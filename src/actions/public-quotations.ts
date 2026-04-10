"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/types";

/**
 * Accept a public quotation via share token.
 * Uses admin client — no session required (D-04, Pattern 2).
 * Guards against double-accept by checking current status is "sent".
 */
export async function acceptQuotationPublicAction(
  shareToken: string,
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { status: "error", message: "Server configuration error." };
  }

  const { data: quotation, error: fetchError } = await supabase
    .from("quotations")
    .select("id, status")
    .eq("share_token", shareToken)
    .maybeSingle<{ id: string; status: string }>();

  if (fetchError) {
    return { status: "error", message: "An error occurred. Please try again." };
  }

  if (!quotation) {
    return { status: "error", message: "This share token is invalid or has expired." };
  }

  if (quotation.status !== "sent") {
    return { status: "error", message: "This quotation can no longer be accepted." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("quotations")
    .update({ status: "accepted", accepted_date: new Date().toISOString() })
    .eq("id", quotation.id);

  if (updateError) {
    return { status: "error", message: "Failed to accept the quotation. Please try again." };
  }

  revalidatePath(`/quotations/public/${shareToken}`);
  return { status: "success", message: "Quotation accepted — the sender has been notified." };
}

/**
 * Reject a public quotation via share token.
 * Uses admin client — no session required (D-04, Pattern 2).
 * Guards against double-reject by checking current status is "sent".
 * Stores rejection_reason from form data.
 */
export async function rejectQuotationPublicAction(
  shareToken: string,
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return { status: "error", message: "Server configuration error." };
  }

  const { data: quotation, error: fetchError } = await supabase
    .from("quotations")
    .select("id, status")
    .eq("share_token", shareToken)
    .maybeSingle<{ id: string; status: string }>();

  if (fetchError) {
    return { status: "error", message: "An error occurred. Please try again." };
  }

  if (!quotation) {
    return { status: "error", message: "This share token is invalid or has expired." };
  }

  if (quotation.status !== "sent") {
    return { status: "error", message: "This quotation can no longer be rejected." };
  }

  const rejectionReason = String(formData.get("rejectionReason") ?? "");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("quotations")
    .update({
      status: "rejected",
      rejected_date: new Date().toISOString(),
      rejection_reason: rejectionReason,
    })
    .eq("id", quotation.id);

  if (updateError) {
    return { status: "error", message: "Failed to reject the quotation. Please try again." };
  }

  revalidatePath(`/quotations/public/${shareToken}`);
  return { status: "success", message: "Quotation rejected. Your note has been sent." };
}
