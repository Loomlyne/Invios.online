"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/require-session";
import type { ActionState } from "@/lib/types";
import type { RecurringFrequency } from "@/lib/cron-utils";

const recurringScheduleSchema = z.object({
  sourceInvoiceId: z.string().uuid(),
  frequency: z.enum(["weekly", "monthly", "quarterly"]),
  nextDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Valid date required"),
});

export async function createRecurringScheduleAction(
  input: z.infer<typeof recurringScheduleSchema>,
): Promise<ActionState> {
  try {
    const parsed = recurringScheduleSchema.safeParse(input);
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid schedule." };
    }

    const { supabase, user } = await requireSession();

    // Check if a schedule already exists for this invoice
    const { data: existing } = await supabase
      .from("recurring_schedules")
      .select("id")
      .eq("source_invoice_id", parsed.data.sourceInvoiceId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (existing) {
      return { status: "error", message: "A recurring schedule already exists for this invoice." };
    }

    const { error } = await supabase
      .from("recurring_schedules")
      .insert({
        user_id: user.id,
        source_invoice_id: parsed.data.sourceInvoiceId,
        frequency: parsed.data.frequency,
        next_due_date: parsed.data.nextDueDate,
      });

    if (error) throw new Error(error.message);

    revalidatePath("/app/invoices");
    return { status: "success", message: "Recurring schedule created." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not create schedule." };
  }
}

export async function updateRecurringScheduleAction(
  scheduleId: string,
  input: { frequency: RecurringFrequency; nextDueDate: string },
): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSession();

    const { error } = await supabase
      .from("recurring_schedules")
      .update({
        frequency: input.frequency,
        next_due_date: input.nextDueDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scheduleId)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);

    revalidatePath("/app/invoices");
    return { status: "success", message: "Schedule updated." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not update schedule." };
  }
}

export async function cancelRecurringScheduleAction(
  scheduleId: string,
): Promise<ActionState> {
  try {
    const { supabase, user } = await requireSession();

    const { error } = await supabase
      .from("recurring_schedules")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", scheduleId)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);

    revalidatePath("/app/invoices");
    return { status: "success", message: "Schedule cancelled." };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Could not cancel schedule." };
  }
}
