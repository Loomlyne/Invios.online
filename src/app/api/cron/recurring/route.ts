import type { NextRequest } from "next/server";
import { isCronAuthenticated } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { advanceNextDueDate } from "@/lib/cron-utils";
import { buildUniqueSlug, createShareToken } from "@/lib/billing-utils";

export const maxDuration = 60;

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

  type RecurringScheduleRow = {
    id: string;
    user_id: string;
    source_invoice_id: string;
    frequency: string;
    next_due_date: string;
  };

  // 1. Fetch all active schedules where next_due_date <= today
  const { data: schedules, error: scheduleError } = await supabase
    .from("recurring_schedules")
    .select("id, user_id, source_invoice_id, frequency, next_due_date")
    .eq("is_active", true)
    .lte("next_due_date", today) as { data: RecurringScheduleRow[] | null; error: { message: string } | null };

  if (scheduleError) {
    console.error("[cron/recurring] Failed to fetch schedules:", scheduleError);
    return Response.json({ error: scheduleError.message }, { status: 500 });
  }

  if (!schedules || schedules.length === 0) {
    return Response.json({ processed: 0 });
  }

  let processed = 0;
  const errors: string[] = [];

  for (const schedule of schedules) {
    try {
      // 2. Fetch source invoice (all fields needed for the copy)
      const { data: source, error: sourceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", schedule.source_invoice_id)
        .single();

      if (sourceError || !source) {
        errors.push(`Schedule ${schedule.id}: source invoice not found`);
        continue;
      }

      // 3. Calculate new dates
      const issueDateDiff =
        source.due_date && source.issue_date
          ? Math.round(
              (new Date(source.due_date).getTime() -
                new Date(source.issue_date).getTime()) /
                86400000,
            )
          : 14; // default 14 days payment terms
      const newIssueDate = today;
      const newDueDate = new Date(
        new Date(today + "T00:00:00Z").getTime() + issueDateDiff * 86400000,
      )
        .toISOString()
        .split("T")[0];

      // 4. Get next invoice number
      const { data: branding } = await supabase
        .from("branding")
        .select("invoice_prefix")
        .eq("user_id", schedule.user_id)
        .maybeSingle();

      const prefix = (branding?.invoice_prefix as string) ?? "INV";
      const { data: numberData } = await supabase.rpc("next_document_number", {
        p_kind: "invoice",
        p_prefix: prefix,
      });

      // 5. Build unique slug
      const { data: existingSlugs } = await supabase
        .from("invoices")
        .select("slug")
        .eq("user_id", schedule.user_id);

      const slugList = (existingSlugs ?? []).map((s) => s.slug as string);
      const slug = buildUniqueSlug(`${numberData}-${source.client_id}`, slugList);

      // 6. Insert new draft invoice
      const recurringNote = `Generated from recurring schedule — Invoice #${source.invoice_number}`;
      const existingNotes = source.notes
        ? `${source.notes}\n\n${recurringNote}`
        : recurringNote;

      const { error: insertError } = await supabase.from("invoices").insert({
        user_id: schedule.user_id,
        client_id: source.client_id,
        invoice_number: numberData,
        slug,
        status: "draft",
        invoice_type: source.invoice_type,
        issue_date: newIssueDate,
        due_date: newDueDate,
        currency: source.currency,
        tax_rate: source.tax_rate,
        discount: source.discount,
        subtotal: source.subtotal,
        discount_amount: source.discount_amount,
        tax_amount: source.tax_amount,
        total: source.total,
        line_items: source.line_items,
        notes: existingNotes,
        terms: source.terms,
        language: source.language,
        trn: source.trn,
        share_token: createShareToken(),
      });

      if (insertError) {
        errors.push(`Schedule ${schedule.id}: insert failed — ${insertError.message}`);
        continue;
      }

      // 7. Advance next_due_date on the schedule
      const newNextDue = advanceNextDueDate(
        schedule.next_due_date,
        schedule.frequency as "weekly" | "monthly" | "quarterly",
      );

      await supabase
        .from("recurring_schedules")
        .update({ next_due_date: newNextDue, updated_at: new Date().toISOString() })
        .eq("id", schedule.id);

      processed++;
    } catch (err) {
      errors.push(
        `Schedule ${schedule.id}: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  }

  if (errors.length > 0) {
    console.error("[cron/recurring] Errors:", errors);
  }

  return Response.json({ processed, errors: errors.length });
}
