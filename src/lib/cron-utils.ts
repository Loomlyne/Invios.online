export type ReminderType = "before" | "due_date" | "after" | "second";
export type RecurringFrequency = "weekly" | "monthly" | "quarterly";

/**
 * Advance a date string by the given recurring frequency.
 * Returns ISO date string (YYYY-MM-DD).
 */
export function advanceNextDueDate(
  currentNextDue: string,
  frequency: RecurringFrequency,
): string {
  const date = new Date(currentNextDue + "T00:00:00Z");
  if (frequency === "weekly") date.setUTCDate(date.getUTCDate() + 7);
  if (frequency === "monthly") date.setUTCMonth(date.getUTCMonth() + 1);
  if (frequency === "quarterly") date.setUTCMonth(date.getUTCMonth() + 3);
  return date.toISOString().split("T")[0];
}

/**
 * Determine which reminder type (if any) should fire for an invoice today.
 * Returns null if no timing rule matches.
 */
export function shouldSendReminder(params: {
  dueDate: string;
  today: string;
  reminderDaysBefore: number;
  reminderDaysAfter: number;
  remindOnDueDate: boolean;
  secondReminderDays: number;
}): ReminderType | null {
  const due = new Date(params.dueDate + "T00:00:00Z").getTime();
  const now = new Date(params.today + "T00:00:00Z").getTime();
  const dayMs = 86400000;
  const diffDays = Math.round((due - now) / dayMs);

  // Before due: diffDays > 0 means due is in the future
  if (diffDays > 0 && diffDays === params.reminderDaysBefore) {
    return "before";
  }

  // On due date
  if (diffDays === 0 && params.remindOnDueDate) {
    return "due_date";
  }

  // After due: diffDays < 0 means due is in the past
  const daysPastDue = -diffDays;
  if (daysPastDue > 0 && daysPastDue === params.reminderDaysAfter) {
    return "after";
  }

  if (daysPastDue > 0 && daysPastDue === params.secondReminderDays) {
    return "second";
  }

  return null;
}
