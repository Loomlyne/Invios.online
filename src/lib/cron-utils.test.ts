import { describe, it } from "vitest";

// ---------------------------------------------------------------------------
// advanceNextDueDate (AUTO-03)
// RED stubs — @/lib/cron-utils does not exist yet
// ---------------------------------------------------------------------------

describe("advanceNextDueDate", () => {
  it.todo(
    "advances weekly by 7 days — advanceNextDueDate('2026-04-12', 'weekly') returns '2026-04-19'"
  );

  it.todo(
    "advances monthly by 1 month — advanceNextDueDate('2026-04-12', 'monthly') returns '2026-05-12'"
  );

  it.todo(
    "advances quarterly by 3 months — advanceNextDueDate('2026-04-12', 'quarterly') returns '2026-07-12'"
  );

  it.todo(
    "handles month-end rollover (Jan 31 + monthly = Feb 28) — advanceNextDueDate('2026-01-31', 'monthly') returns '2026-02-28'"
  );
});

// ---------------------------------------------------------------------------
// shouldSendReminder (AUTO-04, AUTO-05)
// RED stubs — @/lib/cron-utils does not exist yet
// ---------------------------------------------------------------------------

describe("shouldSendReminder", () => {
  it.todo(
    "returns 'before' when days until due matches reminder_days_before — shouldSendReminder({ dueDate: '2026-04-15', today: '2026-04-12', reminderDaysBefore: 3, reminderDaysAfter: 7, remindOnDueDate: true, secondReminderDays: 14 }) returns 'before'"
  );

  it.todo(
    "returns 'due_date' when today equals due date and remindOnDueDate is true — shouldSendReminder with today == dueDate returns 'due_date'"
  );

  it.todo(
    "returns 'after' when days past due matches reminder_days_after — today is 7 days after due_date with reminderDaysAfter: 7 returns 'after'"
  );

  it.todo(
    "returns 'second' when days past due matches second_reminder_days"
  );

  it.todo(
    "returns null when no timing rule matches"
  );

  it.todo(
    "returns null when remindOnDueDate is false and today equals due date"
  );
});
