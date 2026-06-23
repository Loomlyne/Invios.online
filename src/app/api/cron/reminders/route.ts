import type { NextRequest } from "next/server";
import { isCronAuthenticated } from "@/lib/env";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { shouldSendReminder } from "@/lib/cron-utils";
import type { ReminderType } from "@/lib/cron-utils";
import { sendReminderEmail } from "@/lib/email";
import { formatCurrency } from "@/lib/utils";

export const maxDuration = 60;

// Cap per-invocation to prevent Vercel's 60s ceiling from being hit as the
// user base grows. Any overflow is processed on the next scheduled run.
const BATCH_LIMIT = 100;

export async function GET(request: NextRequest) {
  if (!isCronAuthenticated(request.headers.get("authorization"))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseRaw = createSupabaseAdminClient();
  if (!supabaseRaw) {
    return Response.json({ error: "Admin client unavailable" }, { status: 500 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = supabaseRaw as any;

  const today = new Date().toISOString().split("T")[0];

  // 1. Fetch users with reminders enabled (oldest-first for deterministic pagination)
  const { data: users, error: usersError } = await supabase
    .from("user_settings")
    .select(
      "user_id, reminder_days_before, reminder_days_after, remind_on_due_date, second_reminder_days",
    )
    .eq("reminder_enabled", true)
    .order("user_id")
    .limit(BATCH_LIMIT);

  if (usersError) {
    console.error("[cron/reminders] Failed to fetch users:", usersError);
    return Response.json({ error: usersError.message }, { status: 500 });
  }

  if (!users || users.length === 0) {
    return Response.json({ processed: 0 });
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const userSettings of users) {
    try {
      // 2. Fetch sent/overdue invoices for this user (with client email for sending)
      const { data: invoices, error: invoiceError } = await supabase
        .from("invoices")
        .select("id, invoice_number, total, currency, due_date, share_token, client_id, status")
        .eq("user_id", userSettings.user_id)
        .in("status", ["sent", "overdue", "partial_paid"]);

      if (invoiceError || !invoices) {
        errors.push(`User ${userSettings.user_id}: invoice fetch failed`);
        continue;
      }

      // 3. Fetch user's business name for email footer
      const { data: branding } = await supabase
        .from("branding")
        .select("business_name")
        .eq("user_id", userSettings.user_id)
        .maybeSingle();

      const businessName = (branding?.business_name as string) ?? "Your service provider";

      for (const invoice of invoices) {
        try {
          // 4. Check if a reminder should fire for this invoice today
          const reminderType: ReminderType | null = shouldSendReminder({
            dueDate: invoice.due_date as string,
            today,
            reminderDaysBefore: userSettings.reminder_days_before as number,
            reminderDaysAfter: userSettings.reminder_days_after as number,
            remindOnDueDate: userSettings.remind_on_due_date as boolean,
            secondReminderDays: userSettings.second_reminder_days as number,
          });

          if (!reminderType) continue;

          // 5. Deduplication check — has this reminder been sent within 24 hours? (per D-15)
          const { data: existingLog } = await supabase
            .from("reminder_logs")
            .select("id")
            .eq("invoice_id", invoice.id)
            .eq("reminder_type", reminderType)
            .gte("sent_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .limit(1);

          if (existingLog && existingLog.length > 0) {
            skipped++;
            continue;
          }

          // 6. Fetch client email (per D-17)
          const { data: clientData } = await supabase
            .from("clients")
            .select("name, email")
            .eq("id", invoice.client_id)
            .single();

          if (!clientData?.email) {
            skipped++;
            continue; // No client email — skip silently
          }

          // 7. Send reminder email (per D-16)
          const publicUrl = `${env.siteUrl}/invoices/public/${invoice.share_token}`;
          const collected = await getCollectedAmount(supabase, invoice.id as string);
          const outstanding = Number(invoice.total) - collected;

          sendReminderEmail({
            clientEmail: clientData.email as string,
            clientName: clientData.name as string,
            invoiceNumber: invoice.invoice_number as string,
            amountDue: formatCurrency(outstanding, invoice.currency as string),
            dueDate: invoice.due_date as string,
            publicUrl,
            businessName,
          });

          // 8. Log the send for deduplication (per D-15)
          await supabase.from("reminder_logs").insert({
            invoice_id: invoice.id,
            user_id: userSettings.user_id,
            reminder_type: reminderType,
          });

          sent++;
        } catch (err) {
          errors.push(`Invoice ${invoice.id}: ${err instanceof Error ? err.message : "unknown"}`);
        }
      }
    } catch (err) {
      errors.push(
        `User ${userSettings.user_id}: ${err instanceof Error ? err.message : "unknown"}`,
      );
    }
  }

  if (errors.length > 0) {
    console.error("[cron/reminders] Errors:", errors);
  }

  return Response.json({
    sent,
    skipped,
    errors: errors.length,
    // true = another batch may remain; the next cron run will process it
    limited: users.length === BATCH_LIMIT,
  });
}

/** Helper: sum payments for an invoice to get collected amount */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getCollectedAmount(
  supabase: any,
  invoiceId: string,
): Promise<number> {
  const { data } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", invoiceId);

  return (data ?? []).reduce((sum: number, p: { amount: string | number }) => sum + Number(p.amount), 0);
}
